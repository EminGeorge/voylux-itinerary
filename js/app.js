/* ── VoyLux App Controller ────────────────────── */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────
  let currentData = null;

  // ── DOM refs ───────────────────────────────────
  const inputScreen  = document.getElementById('input-screen');
  const outputScreen = document.getElementById('output-screen');
  const pagesPreview = document.getElementById('pages-preview');
  const loadingOverlay = document.getElementById('loading-overlay');
  const errorToast   = document.getElementById('error-toast');

  const tabBtns      = document.querySelectorAll('.tab-btn');
  const tabPanels    = document.querySelectorAll('.tab-panel');
  const textarea     = document.getElementById('itinerary-text');
  const refInput     = document.getElementById('ref-input');
  const dropZone     = document.getElementById('drop-zone');
  const fileInput    = document.getElementById('file-input');
  const fileNameDisplay = document.getElementById('file-name-display');
  const btnGenerate  = document.getElementById('btn-generate');
  const btnDownload  = document.getElementById('btn-download');
  const btnPrint     = document.getElementById('btn-print');
  const btnRestart   = document.getElementById('btn-restart');

  // ── Tabs ───────────────────────────────────────
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // ── File upload ────────────────────────────────
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) handleFile(fileInput.files[0]);
  });

  function handleFile(file) {
    if (!file) return;
    const name = file.name.toLowerCase();
    fileNameDisplay.textContent = `📄 ${file.name}`;

    if (name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = e => { textarea.value = e.target.result; switchToText(); };
      reader.readAsText(file);

    } else if (name.endsWith('.docx')) {
      if (typeof mammoth === 'undefined') {
        showError('mammoth.js not loaded — refresh and try again.');
        return;
      }
      const reader = new FileReader();
      reader.onload = e => {
        mammoth.extractRawValue({ arrayBuffer: e.target.result })
          .then(result => { textarea.value = result.value; switchToText(); })
          .catch(() => showError('Could not read DOCX file.'));
      };
      reader.readAsArrayBuffer(file);

    } else if (name.endsWith('.pdf')) {
      if (typeof pdfjsLib === 'undefined') {
        showError('PDF.js not loaded — refresh and try again.');
        return;
      }
      const reader = new FileReader();
      reader.onload = async e => {
        try {
          const pdf = await pdfjsLib.getDocument({ data: e.target.result }).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            fullText += content.items.map(item => item.str).join(' ') + '\n';
          }
          textarea.value = fullText;
          switchToText();
        } catch {
          showError('Could not read PDF. Try pasting the text instead.');
        }
      };
      reader.readAsArrayBuffer(file);

    } else if (name.endsWith('.doc')) {
      showError('Old .doc format not supported. Please save as .docx and re-upload.');
    } else {
      showError('Unsupported file type. Use .txt, .docx, or .pdf.');
    }
  }

  function switchToText() {
    tabBtns.forEach(b => b.classList.remove('active'));
    tabPanels.forEach(p => p.classList.remove('active'));
    document.querySelector('[data-tab="tab-text"]').classList.add('active');
    document.getElementById('tab-text').classList.add('active');
  }

  // ── Generate ────────────────────────────────────
  btnGenerate.addEventListener('click', generate);

  function generate() {
    const raw = textarea.value.trim();
    if (!raw) { showError('Please paste your itinerary text or upload a file.'); return; }
    hideError();
    showLoading();

    // Yield to browser to show spinner before heavy work
    setTimeout(() => {
      try {
        const ref = refInput.value.trim();
        currentData = Parser.parse(raw, ref);
        const html  = Renderer.render(currentData);
        pagesPreview.innerHTML = html;
        hideLoading();
        showOutput();
      } catch (err) {
        hideLoading();
        showError('Parsing error: ' + err.message);
        console.error(err);
      }
    }, 80);
  }

  // ── Toolbar actions ─────────────────────────────
  btnDownload.addEventListener('click', () => {
    if (currentData) PDFExport.download(currentData.reference);
  });

  btnPrint.addEventListener('click', () => window.print());

  btnRestart.addEventListener('click', () => {
    outputScreen.style.display = 'none';
    inputScreen.style.display  = 'flex';
    pagesPreview.innerHTML = '';
  });

  // ── Screen transitions ──────────────────────────
  function showOutput() {
    inputScreen.style.display  = 'none';
    outputScreen.style.display = 'flex';
  }

  function showLoading() { loadingOverlay.classList.add('active'); }
  function hideLoading() { loadingOverlay.classList.remove('active'); }

  function showError(msg) {
    errorToast.textContent = msg;
    errorToast.style.display = 'block';
  }
  function hideError() { errorToast.style.display = 'none'; }

  // ── Auto-populate ref placeholder ──────────────
  refInput.placeholder = Parser.autoRef();

})();
