/* ── VoyLux Itinerary Parser ──────────────────── */

const Parser = (() => {

  function autoRef() {
    const yr = new Date().getFullYear().toString().slice(-3);
    const num = Math.floor(1000 + Math.random() * 9000);
    return `VLX/TLND/${yr}/${num}R`;
  }

  function parse(rawText, manualRef) {
    const data = {
      guestName: '',
      destination: '',
      travelDate: '',
      duration: '',
      guests: '',
      rooming: '',
      refNo: '',
      totalCost: '',
      accommodations: [],
      days: [],
      inclusions: [],
      exclusions: [],
      notes: '',
      termsAndConditions: ''
    };

    const text = rawText || '';
    const fullText = text;

    // --- Guest Name: only extract if the document explicitly labels it ---
    const guestNameMatch = text.match(/Guest\s+Name\s*[:\-]?\s*([^\n\r]+)/i);
    data.guestName = guestNameMatch ? guestNameMatch[1].trim() : '';

    // --- Reference Number ---
    const refMatch = text.match(/(?:REF(?:ERENCE)?(?:\s*NO)?[:.\s]+|VLX\/|VLXTLND|Ref\s*[:.]?\s*)([A-Z0-9\/\-]+)/i);
    if (refMatch) data.refNo = refMatch[1].trim();
    if (manualRef && manualRef.trim()) data.refNo = manualRef.trim();
    data.reference = data.refNo || autoRef();

    // --- Total Cost ---
    const costMatch = text.match(/Total\s+Cost\s*[:\s]*\$?\s*([\d,\.]+)/i);
    if (costMatch) data.totalCost = '$ ' + costMatch[1].trim();

    // --- Travel Date ---
    const travelDateMatch = text.match(/Travel\s+Date\s*[:\s]*([\d]+\s*[-–]\s*\w+\s*[-–]\s*\d{4})/i);
    if (travelDateMatch) data.travelDate = travelDateMatch[1].trim();

    // --- Duration: "No of Days N" or "4N / 5D" pattern ---
    const daysMatch = text.match(/No\.?\s+of\s+Days\s*[:\s]*(\d+)/i) || text.match(/(\d+)\s*N\s*[\/\s]\s*(\d+)\s*D/i);
    if (daysMatch) {
      if (daysMatch[2]) {
        data.duration = daysMatch[1] + 'N / ' + daysMatch[2] + 'D';
      } else {
        const n = parseInt(daysMatch[1]) - 1;
        data.duration = n + 'N / ' + daysMatch[1] + 'D';
      }
    }

    // --- Guests: "No of Pax N" ---
    const paxMatch = text.match(/No\.?\s+of\s+Pax\s*[:\s]*(\d+)/i);
    if (paxMatch) data.guests = paxMatch[1] + ' Adults';

    // --- Destination ---
    const destinationKeywords = [
      'Thailand', 'Bali', 'Indonesia', 'Singapore', 'Malaysia', 'Dubai',
      'Europe', 'Maldives', 'Sri Lanka', 'Vietnam', 'Cambodia', 'Japan',
      'Australia', 'Switzerland', 'London', 'Paris', 'Bangkok', 'Phuket',
      'Kuta', 'Ubud', 'Gili', 'Lombok', 'Penida'
    ];
    for (const kw of destinationKeywords) {
      if (fullText.includes(kw)) {
        if (['Bali', 'Kuta', 'Ubud', 'Gili', 'Lombok', 'Penida'].includes(kw)) {
          data.destination = 'Bali, Indonesia'; break;
        }
        if (['Bangkok', 'Phuket'].includes(kw)) {
          data.destination = 'Thailand'; break;
        }
        data.destination = kw; break;
      }
    }
    const destMatch = text.match(/DESTINATION\s*[:\-]?\s*([A-Za-z\s,]+?)(?:\n|DURATION|TRAVEL|GUEST)/i);
    if (destMatch && !data.destination) data.destination = destMatch[1].trim();

    // --- Rooming ---
    const roomMatch = text.match(/(\d+)\s*(DBL|Double|Twin|Single|SGL|TWN|Triple)/i);
    if (roomMatch) {
      const typeMap = { dbl: 'Double', double: 'Double', twin: 'Twin', sgl: 'Single', twn: 'Twin', triple: 'Triple' };
      const type = typeMap[(roomMatch[2] || '').toLowerCase()] || roomMatch[2];
      data.rooming = `${roomMatch[1].padStart(2, '0')} ${type} Room`;
    }

    // --- Accommodations: parse ACCOMMODATIONS block ---
    const accomMatch = text.match(/ACCOMMODATIONS?\s+([\s\S]+?)(?:DAY\s+1|ITINERARY|INCLUSIONS?|Check\s*-\s*in)/i);
    if (accomMatch) {
      const accomText = accomMatch[1];
      const hotelMatch = accomText.match(/^(.+?)(?:\s*\((\d)\s*Star\))?(?:\s+Check\s*-\s*in|\s+Check\s*in)/i);
      const checkInMatch = accomText.match(/Check\s*-?\s*in\s*[:\|]?\s*([\d]+\s*[-–]\s*\w+\s*[-–]\s*\d{4})/i);
      const checkOutMatch = accomText.match(/Check\s*-?\s*out\s*[:\|]?\s*([\d]+\s*[-–]\s*\w+\s*[-–]\s*\d{4})/i);
      const nightsMatch = accomText.match(/No\.?\s+of\s+Nights\s*[:\|]?\s*(\d+)/i);
      if (hotelMatch) {
        data.accommodations.push({
          hotel: hotelMatch[1].trim(),
          category: hotelMatch[2] ? hotelMatch[2] + ' Star' : '',
          checkIn: checkInMatch ? checkInMatch[1] : '',
          checkOut: checkOutMatch ? checkOutMatch[1] : '',
          nights: nightsMatch ? nightsMatch[1] : ''
        });
      }
    }

    // --- Day-wise itinerary ---
    const dayPattern = /DAY\s+(\d+)\s*[:\-–]?\s*([^\n]*)\n?([\s\S]*?)(?=DAY\s+\d+|INCLUSIONS?|ACCOMMODATIONS?|TERMS|$)/gi;
    let dayMatch;
    while ((dayMatch = dayPattern.exec(fullText)) !== null) {
      const dayNum = parseInt(dayMatch[1]);
      const title = dayMatch[2].trim();
      const body = dayMatch[3].trim();
      if (body || title) {
        data.days.push({ day: dayNum, title: title || `Day ${dayNum}`, activities: body });
      }
    }

    // --- Inclusions ---
    const inclMatch = text.match(/INCLUSIONS?\s*\n([\s\S]+?)(?=EXCLUSIONS?|TERMS|PAYMENT|$)/i);
    if (inclMatch) {
      data.inclusions = inclMatch[1].split('\n')
        .map(l => l.replace(/^[✓✗•\-*]+\s*/, '').trim())
        .filter(l => l.length > 3 && !l.match(/^(EXCL|TERMS|PAYM)/i));
    }

    // --- Exclusions ---
    const exclMatch = text.match(/EXCLUSIONS?\s*\n([\s\S]+?)(?=TERMS|PAYMENT|CANCELL|$)/i);
    if (exclMatch) {
      data.exclusions = exclMatch[1].split('\n')
        .map(l => l.replace(/^[✓✗•\-*×x]+\s*/, '').trim())
        .filter(l => l.length > 3 && !l.match(/^(TERMS|PAYM|CANCEL)/i));
    }

    // --- Terms and Conditions ---
    const tcMatch = text.match(/TERMS\s*(?:&|AND)\s*CONDITIONS?\s*\n?([\s\S]+?)(?=INCLUSIONS?|PAYMENT\s+TERMS|$)/i);
    if (tcMatch) data.termsAndConditions = tcMatch[1].trim();

    return data;
  }

  return { parse, autoRef };
})();
