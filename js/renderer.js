/* ── VoyLux Itinerary Renderer ────────────────── */

const Renderer = (() => {

  const LOGO_SVG = `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
    <polygon points="20,10 40,65 50,38 70,10" fill="#c9a227"/>
    <polygon points="50,38 70,10 70,65 50,65" fill="#c9a227" opacity="0.6"/>
    <text x="40" y="80" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" font-weight="700" letter-spacing="3" fill="#c9a227">VOYLUX</text>
    <text x="40" y="92" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="5.5" letter-spacing="3.5" fill="#c9a227">—LEISURE—</text>
  </svg>`;

  const LOGO_SVG_WHITE = `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg">
    <polygon points="20,10 40,65 50,38 70,10" fill="#c9a227"/>
    <polygon points="50,38 70,10 70,65 50,65" fill="#c9a227" opacity="0.6"/>
    <text x="40" y="80" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" font-weight="700" letter-spacing="3" fill="#ffffff">VOYLUX</text>
    <text x="40" y="92" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="5.5" letter-spacing="3.5" fill="#ffffff">—LEISURE—</text>
  </svg>`;

  const WATERMARK_SVG = `<svg viewBox="0 0 80 100" xmlns="http://www.w3.org/2000/svg" width="220" height="275">
    <polygon points="20,10 40,65 50,38 70,10" fill="#0a1628"/>
    <polygon points="50,38 70,10 70,65 50,65" fill="#0a1628" opacity="0.6"/>
    <text x="40" y="80" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="9" font-weight="700" letter-spacing="3" fill="#0a1628">VOYLUX</text>
    <text x="40" y="92" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="5.5" letter-spacing="3.5" fill="#0a1628">—LEISURE—</text>
  </svg>`;

  const DEFAULT_INCLUSIONS = [
    'Accommodation as per itinerary',
    'Daily breakfast at hotel',
    'All transfers by private vehicle',
    'Airport pickup & drop-off',
    'All tours & entry tickets as mentioned',
    'English-speaking tour guide',
    '24/7 tour coordinator support',
    'All applicable taxes'
  ];

  const DEFAULT_EXCLUSIONS = [
    'International airfare',
    'Travel insurance',
    'Visa fees & charges',
    'Personal expenses & shopping',
    'Meals not mentioned in itinerary',
    'Tips & gratuities',
    'Camera / video entry fees',
    'Any services not mentioned'
  ];

  const DEFAULT_PAYMENT_TERMS = [
    'Registration fee / token advance required to confirm booking',
    '50% of total package cost due 30 days before travel',
    'Balance 100% due 15 days before travel',
    'Payment accepted via bank transfer or UPI',
    'All rates are quoted unless otherwise specified',
    'Rates subject to change until booking is confirmed'
  ];

  function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Two-panel flex header: title on left, dark accent block with logo on right */
  function pageHeader(data, pageTitle) {
    return `
      <div class="page-header">
        <div class="section-header">
          <div class="title">
            <div class="page-ref">${esc(data.reference)}</div>
            <div class="page-title-header">${esc(pageTitle)}</div>
          </div>
          <div class="accent">${LOGO_SVG_WHITE}</div>
        </div>
      </div>`;
  }

  /* Full-width footer bar with ref on left, page number on right */
  function pageFooter(data, pageNum, total) {
    return `
      <div class="page-footer">
        <span class="footer-ref">${esc(data.reference)}</span>
        <span class="footer-pg">Page ${pageNum} of ${total}</span>
      </div>`;
  }

  function watermark() {
    return `<div class="watermark">${WATERMARK_SVG}</div>`;
  }

  /* Render inclusions as a strict 2-column CSS grid */
  function inclGrid(items) {
    return `<ul class="inclusions-grid">
      ${items.map(i => `<li class="incl-item"><span class="incl-check">✓</span><span>${esc(i)}</span></li>`).join('')}
    </ul>`;
  }

  /* Split a T&C string into formatted HTML, grouping by section headings */
  function renderTCContent(tcText) {
    if (!tcText) return '';
    const lines = tcText.split(/[·•\n]/)
      .map(l => l.trim())
      .filter(l => l.length > 2);

    const sections = [];
    let current = { heading: '', items: [] };
    for (const line of lines) {
      if (line.match(/^(IMPORTANT\s+NOTES?|PAYMENT\s+TERMS?|CANCELLATION|BANK\s+DETAILS?|GENERAL\s+NOTES?)/i) && line.length < 60) {
        if (current.items.length > 0 || current.heading) sections.push({ ...current });
        current = { heading: line, items: [] };
      } else {
        current.items.push(line);
      }
    }
    if (current.items.length > 0 || current.heading) sections.push(current);

    if (sections.length === 0) return '';
    if (sections.length === 1 && !sections[0].heading) {
      return `<ul class="payment-list">${lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul>`;
    }
    return sections.map(sec => `
      ${sec.heading ? `<h4 class="tc-subheading">${esc(sec.heading)}</h4>` : ''}
      ${sec.items.length > 0 ? `<ul class="payment-list">${sec.items.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
    `).join('');
  }

  /* ── PAGE 1: Cover ── */
  function renderCover(data) {
    const dest = data.destination || 'Your Destination';
    const accomSummary = data.accommodations.length > 0
      ? data.accommodations.map(a => a.hotel).join(' · ')
      : '';

    return `
    <div class="page cover-page" id="pg-cover">
      <div class="cover-inner">
        <div class="cover-logo-large">${LOGO_SVG}</div>
        <div class="cover-divider"></div>
        <h1 class="brand-title">VoyLux Escapes</h1>
        <p class="brand-tagline">Curated &nbsp;|&nbsp; Seamless &nbsp;|&nbsp; Elevated</p>

        <div class="cover-destination">
          <p class="dest-label">Destination</p>
          <p class="dest-name">${esc(dest)}</p>
        </div>

        <div class="cover-meta">
          ${data.duration ? `
          <div class="cover-meta-item">
            <div class="meta-label">Duration</div>
            <div class="meta-value">${esc(data.duration)}</div>
          </div>` : ''}
          ${data.travelDate ? `
          <div class="cover-meta-item">
            <div class="meta-label">Travel Period</div>
            <div class="meta-value">${esc(data.travelDate)}</div>
          </div>` : ''}
          ${data.guests ? `
          <div class="cover-meta-item">
            <div class="meta-label">Guests</div>
            <div class="meta-value">${esc(data.guests)}</div>
          </div>` : ''}
          ${accomSummary ? `
          <div class="cover-meta-item">
            <div class="meta-label">Accommodation</div>
            <div class="meta-value">${esc(accomSummary)}</div>
          </div>` : ''}
        </div>
      </div>

      <div class="cover-bottom">
        <p>Ref: ${esc(data.reference)}</p>
      </div>

      <span class="page-num">1</span>
    </div>`;
  }

  /* ── PAGE 2: Itinerary details + Accommodations ── */
  function renderPage2(data) {
    const inclList = data.inclusions.length > 0 ? data.inclusions : DEFAULT_INCLUSIONS;

    /* 3-column hotel table: Category | Hotel/Property (with stay period) | Cost */
    const accomRows = data.accommodations.length > 0
      ? data.accommodations.map(a => {
          const stayPeriod = a.checkIn && a.checkOut
            ? `${esc(a.checkIn)} – ${esc(a.checkOut)}${a.nights ? ` (${esc(a.nights)}N)` : ''}`
            : '';
          return `
          <tr>
            <td style="width:15%">${esc(a.category) || '—'}</td>
            <td style="width:55%">
              <strong>${esc(a.hotel)}</strong>
              ${stayPeriod ? `<br><small style="color:#888;font-size:0.68rem">${stayPeriod}</small>` : ''}
            </td>
            <td class="cost-cell" style="width:30%">${data.totalCost
              ? `<strong>${esc(data.totalCost)}</strong>`
              : '<span style="color:#aaa">On request</span>'}</td>
          </tr>`;
        }).join('')
      : `<tr><td colspan="3" style="text-align:center;color:#aaa;font-size:0.78rem">Accommodation details not specified</td></tr>`;

    return `
    <div class="page content-page page-break-before" id="pg-2">
      ${pageHeader(data, 'Detailed Itinerary')}
      ${watermark()}

      <div class="content-body">
        <!-- Guest Info -->
        <table class="guest-table">
          ${data.guestName ? `<tr>
            <td class="label">Guest Name</td>
            <td colspan="3">${esc(data.guestName)}</td>
          </tr>` : ''}
          <tr>
            <td class="label">No. of Guests</td>
            <td>${esc(data.guests) || '—'}</td>
            <td class="label">Rooming</td>
            <td>${esc(data.rooming) || '—'}</td>
          </tr>
          <tr>
            <td class="label">Duration</td>
            <td>${esc(data.duration) || '—'}</td>
            <td class="label">Travel Period</td>
            <td>${esc(data.travelDate) || '—'}</td>
          </tr>
          ${data.totalCost ? `<tr>
            <td class="label">Total Cost</td>
            <td colspan="3"><strong style="color:#c9a227">${esc(data.totalCost)}</strong></td>
          </tr>` : ''}
        </table>

        <!-- Accommodations -->
        <h3 class="section-heading teal">Accommodations</h3>
        <table class="hotel-table">
          <thead>
            <tr>
              <th style="width:15%">Category</th>
              <th style="width:55%">Hotel / Property</th>
              <th style="width:30%">Package Cost</th>
            </tr>
          </thead>
          <tbody>${accomRows}</tbody>
        </table>
        <p style="font-size:0.68rem;color:#888;font-style:italic;margin-top:4px">* Rates as quoted. Subject to availability at time of confirmation.</p>

        <!-- Inclusions -->
        <h3 class="section-heading teal" style="margin-top:18px">Package Inclusions Overview</h3>
        ${inclGrid(inclList)}
      </div>

      ${pageFooter(data, 2, 5)}
    </div>`;
  }

  /* ── PAGE 3: Day-by-day Itinerary ── */
  function renderPage3(data) {
    const dest = data.destination || 'Your Destination';

    const dayBlocks = data.days.length > 0
      ? data.days.map(day => {
          let actLines = (day.activities || '').split('\n')
            .map(l => l.replace(/^[•·▸→✈🚗🏨🍽️🧘📸🎫\-*]+\s*/, '').trim())
            .filter(l => l.length > 2);
          if (actLines.length === 0 && (day.activities || '').trim()) {
            actLines = [day.activities.trim()];
          }
          return `
          <div class="day-block avoid-break">
            <h4 class="day-heading">Day ${esc(String(day.day))}: ${esc(day.title)}</h4>
            <ul class="day-activities">
              ${actLines.map(a => `<li>${esc(a)}</li>`).join('')}
            </ul>
          </div>`;
        }).join('')
      : `<p style="font-size:0.8rem;color:#888;text-align:center;padding:40px 0;">No day-by-day itinerary provided in the input.</p>`;

    /* Subtitle: duration · destination · travelDate — only non-empty parts */
    const subtitleParts = [data.duration, dest, data.travelDate].filter(Boolean);
    const subtitle = subtitleParts.map(esc).join(' &nbsp;·&nbsp; ');

    return `
    <div class="page content-page page-break-before" id="pg-3">
      ${pageHeader(data, 'Tentative Itinerary')}
      ${watermark()}

      <div class="content-body">
        <h3 class="section-heading gold">Tentative Itinerary — ${esc(dest)}</h3>
        <p style="font-size:0.72rem;color:#888;margin-bottom:14px;font-style:italic">${subtitle}</p>
        ${dayBlocks}
      </div>

      ${pageFooter(data, 3, 5)}
    </div>`;
  }

  /* ── PAGE 4: Notes, Inclusions, Exclusions, Payment ── */
  function renderPage4(data) {
    const inclList = data.inclusions.length > 0 ? data.inclusions : DEFAULT_INCLUSIONS;
    const exclList = data.exclusions.length > 0 ? data.exclusions : DEFAULT_EXCLUSIONS;

    const noteLines = data.notes
      ? data.notes.split('\n').map(l => l.replace(/^[•·\-*]+\s*/, '').trim()).filter(l => l.length > 2)
      : [];
    const notesList = noteLines.length > 0 ? noteLines : [
      'Rates are based on current availability and are subject to change until confirmed.',
      'Hotel rooms are subject to availability; similar category properties may be substituted.',
      'All entry tickets, transfers, and tours are as per the itinerary only.',
      'Travel insurance is strongly recommended for all travellers.',
      'Peak season surcharges may apply for travel during public holidays.'
    ];

    const tcHtml = data.termsAndConditions
      ? renderTCContent(data.termsAndConditions)
      : `<ul class="payment-list">${DEFAULT_PAYMENT_TERMS.map(t => `<li>${esc(t)}</li>`).join('')}</ul>`;

    return `
    <div class="page content-page page-break-before" id="pg-4">
      ${pageHeader(data, 'Terms & Conditions')}
      ${watermark()}

      <div class="content-body">

        <!-- Important Notes -->
        <h3 class="section-heading gold italic">Important Notes</h3>
        <div class="notes-block">
          ${notesList.map(n => `<p>• ${esc(n)}</p>`).join('')}
        </div>

        <!-- Inclusions -->
        <h3 class="section-heading teal">Inclusions</h3>
        ${inclGrid(inclList)}

        <!-- Exclusions -->
        <h3 class="section-heading teal">Exclusions</h3>
        <ul class="section-list exclusions">
          ${exclList.map(e => `<li>${esc(e)}</li>`).join('')}
        </ul>

        <!-- Payment Terms & T&C -->
        <h3 class="section-heading teal">Payment Terms &amp; Conditions</h3>
        ${tcHtml}

        <!-- Cancellation Policy -->
        <h3 class="section-heading gold" style="margin-top:14px">Cancellation Policy</h3>
        <table class="cancellation-table">
          <thead>
            <tr>
              <th>Days Prior to Departure</th>
              <th>Cancellation Fee (Per Person)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>30 Days or more</strong></td>
              <td>Token Deposit / Registration Fee (Non-refundable)</td>
            </tr>
            <tr>
              <td><strong>29 to 21 Days</strong></td>
              <td>50% of the Total Package Cost</td>
            </tr>
            <tr>
              <td><strong>21 to 12 Days</strong></td>
              <td>75% of the Total Package Cost</td>
            </tr>
            <tr>
              <td><strong>Less than 12 Days</strong></td>
              <td>100% of the Total Package Cost (No Refund)</td>
            </tr>
          </tbody>
        </table>
      </div>

      ${pageFooter(data, 4, 5)}
    </div>`;
  }

  /* ── PAGE 5: Back Cover ── */
  function renderBackCover() {
    const features = [
      { icon: '🚗', label: 'Private Transfers', sub: 'Seamless, door-to-door luxury' },
      { icon: '🏨', label: 'Handpicked Hotels', sub: 'Premium 4–5 star stays' },
      { icon: '🎫', label: 'Exclusive Access', sub: 'Premium passes to top attractions' },
      { icon: '🍽️', label: 'Gourmet Dining', sub: 'Curated local culinary experiences' },
      { icon: '🧘', label: 'Wellness Touches', sub: 'Spa & mindfulness options' },
      { icon: '📸', label: 'Curated Vistas', sub: 'Iconic spots, captured beautifully' },
    ];

    return `
    <div class="page back-cover page-break-before" id="pg-back">
      <div class="back-inner">
        <h1 class="brand-title">VoyLux Escapes</h1>
        <p class="brand-tagline">Curated &nbsp;|&nbsp; Seamless &nbsp;|&nbsp; Elevated</p>

        <div class="features-grid">
          ${features.map(f => `
          <div class="feature">
            <span class="feat-icon">${f.icon}</span>
            <p class="feat-label">${f.label}</p>
            <p class="feat-sub">${f.sub}</p>
          </div>`).join('')}
        </div>

        <div class="back-divider"></div>

        <div class="back-logo">${LOGO_SVG}</div>

        <div class="company-address">
          <p>Second Floor, DewSpace Business Center</p>
          <p>18, Paramara Rd, Ernakulam North</p>
          <p class="gold">Kochi, Kerala 682018 IN</p>
          <p style="margin-top:8px">📷 @voyluxleisure</p>
        </div>
      </div>
      <span class="page-num" style="color:rgba(255,255,255,0.3)">5</span>
    </div>`;
  }

  function render(data) {
    return `
    <div class="itinerary-output" id="itinerary-output">
      ${renderCover(data)}
      ${renderPage2(data)}
      ${renderPage3(data)}
      ${renderPage4(data)}
      ${renderBackCover()}
    </div>`;
  }

  return { render };
})();
