/* ── VoyLux Itinerary Parser ──────────────────── */

const Parser = (() => {

  function clean(s) {
    return (s || '').replace(/\s+/g, ' ').trim();
  }

  function extractAfter(text, ...labels) {
    for (const label of labels) {
      const re = new RegExp(label + '[:\\s]*([^\\n]+)', 'i');
      const m = text.match(re);
      if (m) return clean(m[1]);
    }
    return '';
  }

  function autoRef() {
    const yr = new Date().getFullYear().toString().slice(-3);
    const num = Math.floor(1000 + Math.random() * 9000);
    return `VLX/TLND/${yr}/${num}R`;
  }

  function parsePax(text) {
    const adults = text.match(/(\d+)\s*(adults?|adlt)/i);
    const children = text.match(/(\d+)\s*(children|child|kids?|peds?)/i);
    return {
      adults: adults ? parseInt(adults[1]) : 2,
      children: children ? parseInt(children[1]) : 0,
      childrenAges: ''
    };
  }

  function parseNights(text) {
    const nights = [];
    // Match patterns like "01 NIGHTS PATTAYA" or "1 Night in Bangkok"
    const re = /(\d+)\s*nights?\s+(?:in\s+)?([A-Z][A-Za-z\s]+?)(?=,|\.|\/|\d|$|\n)/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      nights.push({ nights: parseInt(m[1]), city: clean(m[2]) });
    }
    // Fallback: "01 NIGHTS PATTAYA, 03 NIGHTS BANGKOK"
    if (nights.length === 0) {
      const re2 = /(\d+)\s*N(?:IGHTS?)?\s+([A-Z][A-Za-z]+)/g;
      while ((m = re2.exec(text)) !== null) {
        nights.push({ nights: parseInt(m[1]), city: clean(m[2]) });
      }
    }
    return nights;
  }

  function parseTotalDays(text) {
    const m = text.match(/(\d+)\s*nights?\s*[,&]?\s*(\d+)\s*days?/i)
           || text.match(/(\d+)N\s*(\d+)D/i);
    if (m) return { nights: parseInt(m[1]), days: parseInt(m[2]) };
    // Infer from day blocks
    const dayMatches = text.match(/^DAY\s*\d+/gim) || [];
    const n = dayMatches.length;
    return n > 0 ? { nights: n - 1, days: n } : { nights: 4, days: 5 };
  }

  function parseRooming(text) {
    const m = text.match(/(\d+)\s*(DBL|Double|Twin|Single|SGL|TWN|Triple)/i);
    if (!m) return '';
    const typeMap = { dbl: 'Double', double: 'Double', twin: 'Twin', sgl: 'Single', twn: 'Twin', triple: 'Triple' };
    const type = typeMap[(m[2] || '').toLowerCase()] || m[2];
    return `${m[1].padStart(2,'0')} ${type} Room`;
  }

  function parseInclusions(text) {
    const lines = text.split('\n');
    const inc = [];
    for (const line of lines) {
      const l = line.trim();
      if (l.startsWith('✅') || l.match(/^[✅✓✓✔]\s*/)) {
        inc.push(l.replace(/^[✅✓✓✔\s]+/, '').trim());
      }
    }
    return inc;
  }

  function parseHotelOptions(text) {
    const options = [];
    // Match OPTION 01 / OPTION 1 blocks
    const re = /OPTION\s*(\d+)[:\s\-–]*([\s\S]*?)(?=OPTION\s*\d+|$)/gi;
    let m;
    while ((m = re.exec(text)) !== null) {
      const block = m[2].trim();
      // Extract hotel names (line 1 of block, or line before cost)
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      let hotels = '';
      let costTHB = 0;
      let pax = 2;
      for (const line of lines) {
        // Cost line: THB 10,695 or 10695 or Rs 1234
        const costM = line.match(/(?:THB|฿)\s*([\d,]+)/i)
                    || line.match(/([\d,]+)\s*(?:THB|฿)/i)
                    || line.match(/(?:cost|price|rate)[^:]*:\s*(?:THB)?\s*([\d,]+)/i);
        if (costM) {
          costTHB = parseInt(costM[1].replace(/,/g, ''));
          const paxM = line.match(/\/\s*(\d+)\s*pax|for\s*(\d+)\s*pax/i);
          if (paxM) pax = parseInt(paxM[1] || paxM[2]);
          continue;
        }
        // Per pax cost in brackets
        const ppM = line.match(/(?:THB|฿)\s*([\d,]+)\s*\/\s*(?:pax|person)/i);
        if (ppM) { costTHB = parseInt(ppM[1].replace(/,/g, '')); continue; }

        if (!hotels && line.length > 5) hotels = line;
      }
      options.push({
        option: m[1].padStart(2, '0'),
        hotels: hotels || block.split('\n')[0].trim(),
        costTHB,
        pax
      });
    }
    return options;
  }

  function parseDays(text) {
    const days = [];
    // Split on DAY markers
    const re = /^(DAY\s*\d+)[:\s\-–]*([^\n]*)/gim;
    const splits = [];
    let m;
    while ((m = re.exec(text)) !== null) {
      splits.push({ index: m.index, label: m[1].trim(), title: m[2].trim(), end: 0 });
    }
    for (let i = 0; i < splits.length; i++) {
      splits[i].end = (i + 1 < splits.length) ? splits[i + 1].index : text.length;
    }
    for (const sp of splits) {
      const block = text.slice(sp.index + sp.label.length + sp.title.length, sp.end);
      const num = sp.label.replace(/[^0-9]/g, '');
      const lines = block.split('\n')
        .map(l => l.replace(/^[\-\*•▸→✈🚗🏨🍽️🧘📸🎫]*\s*/, '').trim())
        .filter(l => l.length > 3 && !l.match(/^DAY\s*\d+/i));
      days.push({
        num,
        title: sp.title || `Day ${num}`,
        activities: lines.slice(0, 12)
      });
    }
    return days;
  }

  function parseOptionalCosts(text) {
    const m = text.match(/optional\s*costs?[\s\S]*?(?=\n\s*\n|\n[A-Z]{3,}|$)/i);
    if (!m) return [];
    return m[0].split('\n')
      .slice(1)
      .map(l => l.trim())
      .filter(l => l.length > 2);
  }

  function parseNotes(text) {
    const m = text.match(/please\s*note[\s\S]*?(?=\n\s*\n[A-Z]|$)/i);
    if (!m) return [];
    return m[0].split('\n')
      .slice(1)
      .map(l => l.replace(/^[\-\*•]\s*/, '').trim())
      .filter(l => l.length > 3);
  }

  function inferDestination(nights) {
    if (!nights.length) return 'Destination';
    const cities = nights.map(n => n.city);
    // Country mapping
    const thaiCities = /pattaya|bangkok|chiang mai|phuket|koh samui|hua hin/i;
    const indiaCities = /delhi|mumbai|goa|kerala|rajasthan|agra|jaipur|udaipur/i;
    const europeMap = /paris|rome|london|amsterdam|barcelona|switzerland/i;
    const cityStr = cities.join(' ');
    if (thaiCities.test(cityStr)) return 'Thailand';
    if (indiaCities.test(cityStr)) return 'India';
    if (europeMap.test(cityStr)) return 'Europe';
    return cities.join(' & ');
  }

  function parse(rawText, manualRef) {
    const text = rawText || '';

    const guestName = extractAfter(text, 'guest name', 'guest', 'name', 'quoted for', 'prepared for') || 'Guest';
    const pax = parsePax(text);
    const rooming = parseRooming(text);
    const travelPeriod = extractAfter(text, 'travel period', 'travel date', 'departure', 'travelling on', 'travel on') || '';
    const quotedDate = extractAfter(text, 'quoted on', 'date') || '';
    const quotedBy = extractAfter(text, 'quoted by', 'prepared by', 'agent') || '';
    const nights = parseNights(text);
    const totalDays = parseTotalDays(text);
    const inclusions = parseInclusions(text);
    const hotelOptions = parseHotelOptions(text);
    const days = parseDays(text);
    const optionalCosts = parseOptionalCosts(text);
    const notes = parseNotes(text);
    const destination = inferDestination(nights);
    const reference = (manualRef && manualRef.trim()) ? manualRef.trim() : autoRef();

    return {
      guestName,
      pax,
      rooming,
      travelPeriod,
      quotedDate,
      quotedBy,
      destination,
      nights,
      totalDays,
      inclusions,
      hotelOptions,
      days,
      optionalCosts,
      notes,
      reference
    };
  }

  return { parse, autoRef };
})();
