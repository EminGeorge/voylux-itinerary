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
    'All rates are quoted in THB unless otherwise specified',
    'Rates subject to change until booking is confirmed'
  ];

  function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function pageHeader(data, pageTitle) {
    return `
      <div class="page-header">
        <div class="wave-header">
          <div>
            <div class="page-ref">${esc(data.reference)}</div>
            <div class="page-title-header">${esc(pageTitle)}</div>
          </div>
          <div class="wave-right">${LOGO_SVG_WHITE}</div>
        </div>
      </div>`;
  }

  function watermark() {
    return `<div class="watermark">${WATERMARK_SVG}</div>`;
  }

  /* ── PAGE 1: Cover ── */
  function renderCover(data) {
    const nightsSummary = data.nights.length > 0
      ? data.nights.map(n => `${n.nights}N ${n.city}`).join(' + ')
      : `${data.totalDays.nights}N ${data.totalDays.days}D`;

    return `
    <div class="page cover-page" id="pg-cover">
      <div class="cover-inner">
        <div class="cover-logo-large">${LOGO_SVG}</div>
        <div class="cover-divider"></div>
        <h1 class="brand-title">VoyLux Escapes</h1>
        <p class="brand-tagline">Curated &nbsp;|&nbsp; Seamless &nbsp;|&nbsp; Elevated</p>

        <div class="cover-destination">
          <p class="dest-label">Destination</p>
          <p class="dest-name">${esc(data.destination)}</p>
        </div>

        <div class="cover-meta">
          <div class="cover-meta-item">
            <div class="meta-label">Duration</div>
            <div class="meta-value">${data.totalDays.nights}N / ${data.totalDays.days}D</div>
          </div>
          ${data.travelPeriod ? `
          <div class="cover-meta-item">
            <div class="meta-label">Travel Period</div>
            <div class="meta-value">${esc(data.travelPeriod)}</div>
          </div>` : ''}
          <div class="cover-meta-item">
            <div class="meta-label">Guests</div>
            <div class="meta-value">${data.pax.adults} Adult${data.pax.adults !== 1 ? 's' : ''}${data.pax.children > 0 ? ` · ${data.pax.children} Child${data.pax.children !== 1 ? 'ren' : ''}` : ''}</div>
          </div>
          ${nightsSummary ? `
          <div class="cover-meta-item">
            <div class="meta-label">Itinerary</div>
            <div class="meta-value" style="font-size:0.72rem">${esc(nightsSummary)}</div>
          </div>` : ''}
        </div>
      </div>

      <div class="cover-bottom">
        <p>Ref: ${esc(data.reference)}</p>
        ${data.quotedBy ? `<p style="margin-top:4px">Prepared by ${esc(data.quotedBy)}${data.quotedDate ? ' · ' + esc(data.quotedDate) : ''}</p>` : ''}
      </div>

      <span class="page-num">1</span>
    </div>`;
  }

  /* ── PAGE 2: Itinerary details + Accommodations ── */
  function renderPage2(data) {
    const inclList = data.inclusions.length > 0 ? data.inclusions : DEFAULT_INCLUSIONS;

    const hotelRows = data.hotelOptions.length > 0
      ? data.hotelOptions.map(opt => `
        <tr>
          <td><strong>Option ${esc(opt.option)}</strong></td>
          <td>${esc(opt.hotels)}</td>
          <td class="cost-cell">${opt.costTHB > 0
            ? `<strong>THB ${opt.costTHB.toLocaleString()}</strong><br><small style="color:#888;font-size:0.68rem">/ ${opt.pax} pax</small>`
            : '<span style="color:#aaa">On request</span>'
          }</td>
        </tr>`).join('')
      : `<tr><td colspan="3" style="text-align:center;color:#aaa;font-size:0.78rem">Hotel options not specified</td></tr>`;

    const nightsBreakdown = data.nights.length > 0
      ? data.nights.map(n => `${n.nights} Night${n.nights !== 1 ? 's' : ''} — ${n.city}`).join('<br>')
      : `${data.totalDays.nights} Nights / ${data.totalDays.days} Days`;

    return `
    <div class="page content-page" id="pg-2">
      ${pageHeader(data, 'Detailed Itinerary')}
      ${watermark()}

      <div class="content-body">
        <!-- Guest Info -->
        <table class="guest-table">
          <tr>
            <td class="label">Guest Name</td>
            <td colspan="3">${esc(data.guestName)}</td>
          </tr>
          <tr>
            <td class="label">No. of Adults</td>
            <td>${data.pax.adults}</td>
            <td class="label">No. of Children</td>
            <td>${data.pax.children || '—'}</td>
          </tr>
          <tr>
            <td class="label">Rooming</td>
            <td>${esc(data.rooming) || '—'}</td>
            <td class="label">Duration</td>
            <td>${data.totalDays.nights}N / ${data.totalDays.days}D</td>
          </tr>
          <tr>
            <td class="label">Travel Period</td>
            <td colspan="3">${esc(data.travelPeriod) || '—'}</td>
          </tr>
          ${data.quotedBy ? `<tr>
            <td class="label">Quoted By</td>
            <td>${esc(data.quotedBy)}</td>
            <td class="label">Quoted On</td>
            <td>${esc(data.quotedDate) || '—'}</td>
          </tr>` : ''}
        </table>

        <!-- Night breakdown -->
        <p style="font-size:0.74rem;color:#555;margin-bottom:16px;padding:6px 10px;background:#f9f9f9;border-left:3px solid #c9a227;">
          <strong style="color:#0a1628;">Route:</strong> &nbsp;${nightsBreakdown}
        </p>

        <!-- Accommodations -->
        <h3 class="section-heading teal">Accommodations</h3>
        <table class="hotel-table">
          <thead>
            <tr>
              <th style="width:15%">Category</th>
              <th>Hotel / Property</th>
              <th style="width:22%">Package Cost</th>
            </tr>
          </thead>
          <tbody>${hotelRows}</tbody>
        </table>
        <p style="font-size:0.68rem;color:#888;font-style:italic;margin-top:4px">* Rates in THB. INR equivalent available on request. Subject to availability at time of confirmation.</p>

        <!-- Inclusions preview -->
        <h3 class="section-heading teal" style="margin-top:18px">Package Inclusions Overview</h3>
        <ul class="section-list inclusions">
          ${inclList.map(i => `<li>${esc(i)}</li>`).join('')}
        </ul>

        ${data.optionalCosts.length > 0 ? `
        <div class="optional-block">
          <h5>Optional Add-ons</h5>
          <ul>${data.optionalCosts.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
        </div>` : ''}
      </div>

      <span class="page-num">2</span>
    </div>`;
  }

  /* ── PAGE 3: Day-by-day Itinerary ── */
  function renderPage3(data) {
    const dayBlocks = data.days.length > 0
      ? data.days.map(day => `
        <div class="day-block">
          <h4 class="day-heading">Day ${esc(day.num)}: ${esc(day.title)}</h4>
          <ul class="day-activities">
            ${day.activities.map(a => `<li>${esc(a)}</li>`).join('')}
          </ul>
        </div>`).join('')
      : `<p style="font-size:0.8rem;color:#888;text-align:center;padding:40px 0;">No day-by-day itinerary provided in the input.</p>`;

    return `
    <div class="page content-page" id="pg-3">
      ${pageHeader(data, 'Tentative Itinerary')}
      ${watermark()}

      <div class="content-body">
        <h3 class="section-heading gold">Tentative Itinerary — ${esc(data.destination)}</h3>
        <p style="font-size:0.72rem;color:#888;margin-bottom:14px;font-style:italic">
          ${data.totalDays.nights} Nights / ${data.totalDays.days} Days &nbsp;·&nbsp;
          ${data.nights.map(n => `${n.nights}N ${n.city}`).join(', ') || data.destination}
        </p>
        ${dayBlocks}
      </div>

      <span class="page-num">3</span>
    </div>`;
  }

  /* ── PAGE 4: Notes, Inclusions, Exclusions, Payment ── */
  function renderPage4(data) {
    const inclList = data.inclusions.length > 0 ? data.inclusions : DEFAULT_INCLUSIONS;
    const notesList = data.notes.length > 0 ? data.notes : [
      'Rates are based on current availability and are subject to change until confirmed.',
      'Hotel rooms are subject to availability; similar category properties may be substituted.',
      'All entry tickets, transfers, and tours are as per the itinerary only.',
      'Travel insurance is strongly recommended for all travellers.',
      'Peak season surcharges may apply for travel during public holidays.'
    ];

    return `
    <div class="page content-page" id="pg-4">
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
        <ul class="section-list inclusions">
          ${inclList.map(i => `<li>${esc(i)}</li>`).join('')}
        </ul>

        <!-- Exclusions -->
        <h3 class="section-heading teal">Exclusions</h3>
        <ul class="section-list exclusions">
          ${DEFAULT_EXCLUSIONS.map(e => `<li>${esc(e)}</li>`).join('')}
        </ul>

        <!-- Payment Terms -->
        <h3 class="section-heading teal">Payment Terms &amp; Conditions</h3>
        <ul class="payment-list">
          ${DEFAULT_PAYMENT_TERMS.map(t => `<li>${esc(t)}</li>`).join('')}
        </ul>

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

      <span class="page-num">4</span>
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
    <div class="page back-cover" id="pg-back">
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
