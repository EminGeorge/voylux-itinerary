/* ── VoyLux PDF Export ────────────────────────── */

const PDFExport = (() => {

  function download(refNumber) {
    const element = document.getElementById('itinerary-output');
    if (!element) { alert('No itinerary to export.'); return; }

    const btn = document.getElementById('btn-download');
    if (btn) {
      btn.textContent = 'Generating PDF…';
      btn.disabled = true;
    }

    const opt = {
      margin: 0,
      filename: `VoyLux_Itinerary_${(refNumber || 'export').replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: 1200
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['css', 'legacy'], before: '.page-break-before', avoid: '.avoid-break' }
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        if (btn) {
          btn.textContent = '⬇ Download PDF';
          btn.disabled = false;
        }
      })
      .catch(err => {
        console.error('PDF export error:', err);
        if (btn) {
          btn.textContent = '⬇ Download PDF';
          btn.disabled = false;
        }
        alert('PDF generation failed. Try using the Print button instead (Ctrl+P → Save as PDF).');
      });
  }

  return { download };
})();
