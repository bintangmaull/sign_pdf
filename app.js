/**
 * SignaDoc Pro - Core Application Logic
 * Supports PDF rendering via PDF.js, Signature manipulation, and PDF export via PDF-Lib.
 */

// Initialize PDF.js Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// App State
const state = {
    docType: null, // 'pdf' or 'image'
    docName: '',
    rawBuffer: null, // ArrayBuffer of the uploaded file
    pdfDoc: null,    // PDF.js document instance
    currentPage: 1,
    totalPages: 1,
    scale: 1.2,      // Zoom level
    canvasWidth: 0,
    canvasHeight: 0,
    
    // Signatures
    savedSignatures: [], // Array of { id, type, dataUrl, name }
    placedSignatures: [], // Array of { id, sigId, dataUrl, page, normX, normY, normW, normH }
    selectedOverlayId: null,
    
    // Signature Modal State
    activeTab: 'draw',
    drawColor: '#000000',
    drawWidth: 3,
    isDrawing: false,
    typedColor: '#000000',
    selectedFont: 'Great Vibes',
    uploadedSigDataUrl: null
};

// DOM Elements
const elements = {
    themeToggleBtn: document.getElementById('themeToggleBtn'),
    helpBtn: document.getElementById('helpBtn'),
    dropZone: document.getElementById('dropZone'),
    fileInput: document.getElementById('fileInput'),
    docInfoCard: document.getElementById('docInfoCard'),
    docTypeIcon: document.getElementById('docTypeIcon'),
    docName: document.getElementById('docName'),
    docMeta: document.getElementById('docMeta'),
    closeDocBtn: document.getElementById('closeDocBtn'),
    
    openSigModalBtn: document.getElementById('openSigModalBtn'),
    signaturesList: document.getElementById('signaturesList'),
    sigCountBadge: document.getElementById('sigCountBadge'),
    exportBtn: document.getElementById('exportBtn'),
    
    viewerToolbar: document.getElementById('viewerToolbar'),
    pageControls: document.getElementById('pageControls'),
    prevPageBtn: document.getElementById('prevPageBtn'),
    nextPageBtn: document.getElementById('nextPageBtn'),
    pageNumberInput: document.getElementById('pageNumberInput'),
    totalPagesCount: document.getElementById('totalPagesCount'),
    viewerStatusText: document.getElementById('viewerStatusText'),
    zoomControls: document.getElementById('zoomControls'),
    zoomInBtn: document.getElementById('zoomInBtn'),
    zoomOutBtn: document.getElementById('zoomOutBtn'),
    zoomResetBtn: document.getElementById('zoomResetBtn'),
    zoomLevelText: document.getElementById('zoomLevelText'),
    
    viewerViewport: document.getElementById('viewerViewport'),
    viewerEmptyState: document.getElementById('viewerEmptyState'),
    canvasWrapper: document.getElementById('canvasWrapper'),
    docCanvas: document.getElementById('docCanvas'),
    overlaysLayer: document.getElementById('overlaysLayer'),
    
    // Signature Modal
    sigModalBackdrop: document.getElementById('sigModalBackdrop'),
    closeSigModalBtn: document.getElementById('closeSigModalBtn'),
    cancelSigBtn: document.getElementById('cancelSigBtn'),
    saveSigBtn: document.getElementById('saveSigBtn'),
    tabBtns: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Draw Tab
    sigDrawCanvas: document.getElementById('sigDrawCanvas'),
    drawPlaceholder: document.getElementById('drawPlaceholder'),
    penWidthSlider: document.getElementById('penWidthSlider'),
    penWidthVal: document.getElementById('penWidthVal'),
    clearDrawBtn: document.getElementById('clearDrawBtn'),
    
    // Type Tab
    typedNameInput: document.getElementById('typedNameInput'),
    fontCards: document.querySelectorAll('.font-card'),
    
    // Upload Tab
    uploadSigDrop: document.getElementById('uploadSigDrop'),
    sigFileInput: document.getElementById('sigFileInput'),
    sigImagePreviewBox: document.getElementById('sigImagePreviewBox'),
    sigImagePreview: document.getElementById('sigImagePreview'),
    removeUploadedSigBtn: document.getElementById('removeUploadedSigBtn'),
    
    // Help Modal
    helpModalBackdrop: document.getElementById('helpModalBackdrop'),
    closeHelpModalBtn: document.getElementById('closeHelpModalBtn'),
    closeHelpBtn: document.getElementById('closeHelpBtn'),
    
    toastContainer: document.getElementById('toastContainer')
};

const drawCtx = elements.sigDrawCanvas.getContext('2d');
const docCtx = elements.docCanvas.getContext('2d');

/* ==========================================================================
   Initialization & Event Listeners
   ========================================================================== */
function init() {
    setupTheme();
    setupDragAndDrop();
    setupViewerControls();
    setupSignatureModal();
    setupHelpModal();
    setupDocumentExport();
    
    // Load saved signatures from localStorage if available
    loadSignaturesFromStorage();
    
    // Window resize handler to reposition overlays accurately
    window.addEventListener('resize', () => {
        if (state.docType) renderCurrentPage();
    });
    
    // Click outside to deselect overlay items
    document.addEventListener('pointerdown', (e) => {
        if (!e.target.closest('.sig-overlay-item') && !e.target.closest('.btn-sig-action')) {
            deselectAllOverlays();
        }
    });
}

/* ==========================================================================
   Theme Management
   ========================================================================== */
function setupTheme() {
    const savedTheme = localStorage.getItem('signadoc_theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.replace('theme-dark', 'theme-light');
        elements.themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
    }
    
    elements.themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.contains('theme-dark');
        if (isDark) {
            document.body.classList.replace('theme-dark', 'theme-light');
            elements.themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
            localStorage.setItem('signadoc_theme', 'light');
        } else {
            document.body.classList.replace('theme-light', 'theme-dark');
            elements.themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
            localStorage.setItem('signadoc_theme', 'dark');
        }
    });
}

/* ==========================================================================
   Document Upload & Drag-Drop Handling
   ========================================================================== */
function setupDragAndDrop() {
    // File input change
    elements.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
    });
    
    // Drag events for Upload Zone
    ['dragenter', 'dragover'].forEach(eventName => {
        elements.dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            elements.dropZone.classList.add('dragover');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        elements.dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            elements.dropZone.classList.remove('dragover');
        }, false);
    });
    
    elements.dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt.files && dt.files.length > 0) {
            handleFileSelect(dt.files[0]);
        }
    });
    
    // Also allow dropping onto the viewer viewport
    elements.viewerViewport.addEventListener('dragover', (e) => e.preventDefault());
    elements.viewerViewport.addEventListener('drop', (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    
    // Close document button
    elements.closeDocBtn.addEventListener('click', closeDocument);
}

async function handleFileSelect(file) {
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.pdf')) {
        showToast('Format file tidak didukung! Harap gunakan PDF, PNG, atau JPG.', 'error');
        return;
    }
    
    if (file.size > 20 * 1024 * 1024) {
        showToast('Ukuran file melebihi batas maksimal 20 MB.', 'error');
        return;
    }
    
    state.docName = file.name;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    state.docType = isPdf ? 'pdf' : 'image';
    
    showToast('Memuat dokumen...', 'info');
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        state.rawBuffer = arrayBuffer.slice(0); // Simpan salinan buffer utuh agar tidak di-detach worker
        
        if (state.docType === 'pdf') {
            await loadPdfDocument(arrayBuffer.slice(0)); // Gunakan salinan untuk PDF.js
            elements.docTypeIcon.className = 'fa-solid fa-file-pdf';
            elements.docMeta.textContent = `PDF • ${state.totalPages} Halaman`;
        } else {
            await loadImageDocument(file);
            elements.docTypeIcon.className = 'fa-solid fa-file-image';
            elements.docMeta.textContent = `Gambar • 1 Halaman`;
        }
        
        // Update UI state
        elements.docName.textContent = state.docName;
        elements.dropZone.classList.add('hidden');
        elements.docInfoCard.classList.remove('hidden');
        elements.viewerEmptyState.classList.add('hidden');
        elements.canvasWrapper.classList.remove('hidden');
        elements.zoomControls.classList.remove('hidden');
        elements.exportBtn.disabled = false;
        
        if (state.docType === 'pdf' && state.totalPages > 1) {
            elements.pageControls.classList.remove('hidden');
            elements.totalPagesCount.textContent = state.totalPages;
            elements.pageNumberInput.max = state.totalPages;
            updatePageControls();
        } else {
            elements.pageControls.classList.add('hidden');
        }
        
        elements.viewerStatusText.textContent = `Aktif: ${state.docName}`;
        showToast('Dokumen berhasil dimuat! Pilih atau buat tanda tangan untuk menempelkannya.', 'success');
        
    } catch (err) {
        console.error('Error loading file:', err);
        showToast('Gagal membaca file dokumen.', 'error');
    }
}

async function loadPdfDocument(arrayBuffer) {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
    state.pdfDoc = await loadingTask.promise;
    state.totalPages = state.pdfDoc.numPages;
    state.currentPage = 1;
    await renderCurrentPage();
}

async function loadImageDocument(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                state.imageElement = img;
                state.totalPages = 1;
                state.currentPage = 1;
                renderCurrentImage();
                resolve();
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function closeDocument() {
    state.docType = null;
    state.docName = '';
    state.rawBuffer = null;
    state.pdfDoc = null;
    state.imageElement = null;
    state.placedSignatures = [];
    state.selectedOverlayId = null;
    
    elements.docInfoCard.classList.add('hidden');
    elements.dropZone.classList.remove('hidden');
    elements.fileInput.value = '';
    
    elements.canvasWrapper.classList.add('hidden');
    elements.viewerEmptyState.classList.remove('hidden');
    elements.pageControls.classList.add('hidden');
    elements.zoomControls.classList.add('hidden');
    elements.exportBtn.disabled = true;
    
    elements.viewerStatusText.textContent = 'Silakan unggah dokumen untuk mulai menandatangani';
    elements.overlaysLayer.innerHTML = '';
}

/* ==========================================================================
   Document Rendering (PDF / Image)
   ========================================================================== */
async function renderCurrentPage() {
    if (!state.docType) return;
    if (state.docType === 'image') {
        renderCurrentImage();
        return;
    }
    
    try {
        const page = await state.pdfDoc.getPage(state.currentPage);
        const viewport = page.getViewport({ scale: state.scale });
        
        state.canvasWidth = viewport.width;
        state.canvasHeight = viewport.height;
        
        elements.docCanvas.width = viewport.width;
        elements.docCanvas.height = viewport.height;
        elements.canvasWrapper.style.width = `${viewport.width}px`;
        elements.canvasWrapper.style.height = `${viewport.height}px`;
        
        const renderContext = {
            canvasContext: docCtx,
            viewport: viewport
        };
        
        await page.render(renderContext).promise;
        updatePageControls();
        renderOverlaysForCurrentPage();
    } catch (err) {
        console.error('Error rendering PDF page:', err);
    }
}

function renderCurrentImage() {
    const img = state.imageElement;
    if (!img) return;
    
    // Scale image reasonably to fit viewport while keeping aspect ratio
    const baseScale = state.scale;
    const width = img.width * (baseScale * 0.8);
    const height = img.height * (baseScale * 0.8);
    
    state.canvasWidth = width;
    state.canvasHeight = height;
    
    elements.docCanvas.width = width;
    elements.docCanvas.height = height;
    elements.canvasWrapper.style.width = `${width}px`;
    elements.canvasWrapper.style.height = `${height}px`;
    
    docCtx.clearRect(0, 0, width, height);
    docCtx.drawImage(img, 0, 0, width, height);
    renderOverlaysForCurrentPage();
}

function setupViewerControls() {
    // Pagination
    elements.prevPageBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
            state.currentPage--;
            renderCurrentPage();
        }
    });
    
    elements.nextPageBtn.addEventListener('click', () => {
        if (state.currentPage < state.totalPages) {
            state.currentPage++;
            renderCurrentPage();
        }
    });
    
    elements.pageNumberInput.addEventListener('change', (e) => {
        let page = parseInt(e.target.value);
        if (isNaN(page) || page < 1) page = 1;
        if (page > state.totalPages) page = state.totalPages;
        state.currentPage = page;
        e.target.value = page;
        renderCurrentPage();
    });
    
    // Zoom controls
    elements.zoomInBtn.addEventListener('click', () => {
        if (state.scale < 3.0) {
            state.scale += 0.2;
            updateZoomText();
            renderCurrentPage();
        }
    });
    
    elements.zoomOutBtn.addEventListener('click', () => {
        if (state.scale > 0.6) {
            state.scale -= 0.2;
            updateZoomText();
            renderCurrentPage();
        }
    });
    
    elements.zoomResetBtn.addEventListener('click', () => {
        state.scale = 1.2;
        updateZoomText();
        renderCurrentPage();
    });
}

function updatePageControls() {
    elements.prevPageBtn.disabled = (state.currentPage <= 1);
    elements.nextPageBtn.disabled = (state.currentPage >= state.totalPages);
    elements.pageNumberInput.value = state.currentPage;
}

function updateZoomText() {
    const pct = Math.round((state.scale / 1.2) * 100);
    elements.zoomLevelText.textContent = `${pct}%`;
}

/* ==========================================================================
   Signature Creation Modal Handling
   ========================================================================== */
function setupSignatureModal() {
    elements.openSigModalBtn.addEventListener('click', () => {
        elements.sigModalBackdrop.classList.remove('hidden');
        resetModalFields();
    });
    
    const closeModal = () => elements.sigModalBackdrop.classList.add('hidden');
    elements.closeSigModalBtn.addEventListener('click', closeModal);
    elements.cancelSigBtn.addEventListener('click', closeModal);
    
    // Close when clicking backdrop
    elements.sigModalBackdrop.addEventListener('click', (e) => {
        if (e.target === elements.sigModalBackdrop) closeModal();
    });
    
    // Tab switching
    elements.tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.tabBtns.forEach(b => b.classList.remove('active'));
            elements.tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const targetTab = btn.getAttribute('data-tab');
            state.activeTab = targetTab;
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        });
    });
    
    setupDrawCanvas();
    setupTypeSignature();
    setupUploadSignature();
    
    // Save Signature Button
    elements.saveSigBtn.addEventListener('click', () => {
        let dataUrl = null;
        let name = 'Tanda Tangan';
        
        if (state.activeTab === 'draw') {
            // Check if canvas is blank
            const blankCanvas = document.createElement('canvas');
            blankCanvas.width = elements.sigDrawCanvas.width;
            blankCanvas.height = elements.sigDrawCanvas.height;
            if (elements.sigDrawCanvas.toDataURL() === blankCanvas.toDataURL()) {
                showToast('Harap gambar tanda tangan terlebih dahulu.', 'error');
                return;
            }
            dataUrl = getTrimmedCanvasDataUrl(elements.sigDrawCanvas);
            name = 'Tanda Tangan Lukis';
        } else if (state.activeTab === 'type') {
            const text = elements.typedNameInput.value.trim();
            if (!text) {
                showToast('Harap ketik nama Anda terlebih dahulu.', 'error');
                return;
            }
            dataUrl = createTypedSignatureImage(text, state.selectedFont, state.typedColor);
            name = text;
        } else if (state.activeTab === 'upload') {
            if (!state.uploadedSigDataUrl) {
                showToast('Harap pilih gambar tanda tangan terlebih dahulu.', 'error');
                return;
            }
            dataUrl = state.uploadedSigDataUrl;
            name = 'Tanda Tangan Gambar';
        }
        
        if (dataUrl) {
            const newSig = {
                id: 'sig_' + Date.now(),
                type: state.activeTab,
                dataUrl: dataUrl,
                name: name
            };
            
            state.savedSignatures.push(newSig);
            saveSignaturesToStorage();
            renderSavedSignaturesList();
            
            showToast('Tanda tangan berhasil dibuat dan disimpan!', 'success');
            closeModal();
            
            // Automatically place it on the center of the active document if opened
            if (state.docType) {
                addSignatureToDocument(newSig);
            }
        }
    });
}

/* Tab 1: Draw Canvas Setup */
function setupDrawCanvas() {
    const canvas = elements.sigDrawCanvas;
    
    // Color dots
    const colorDots = document.querySelectorAll('#tab-draw .color-dot');
    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            state.drawColor = dot.getAttribute('data-color');
        });
    });
    
    // Pen width
    elements.penWidthSlider.addEventListener('input', (e) => {
        state.drawWidth = parseInt(e.target.value);
        elements.penWidthVal.textContent = `${state.drawWidth}px`;
    });
    
    // Clear button
    elements.clearDrawBtn.addEventListener('click', () => {
        drawCtx.clearRect(0, 0, canvas.width, canvas.height);
        elements.drawPlaceholder.style.opacity = '1';
    });
    
    // Drawing events (Mouse)
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    
    // Drawing events (Touch)
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        canvas.dispatchEvent(mouseEvent);
    }, { passive: false });
    
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup', {});
        canvas.dispatchEvent(mouseEvent);
    }, { passive: false });
}

function startDrawing(e) {
    state.isDrawing = true;
    elements.drawPlaceholder.style.opacity = '0';
    
    const rect = elements.sigDrawCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawCtx.beginPath();
    drawCtx.moveTo(x, y);
    drawCtx.lineCap = 'round';
    drawCtx.lineJoin = 'round';
    drawCtx.strokeStyle = state.drawColor;
    drawCtx.lineWidth = state.drawWidth;
}

function draw(e) {
    if (!state.isDrawing) return;
    const rect = elements.sigDrawCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawCtx.lineTo(x, y);
    drawCtx.stroke();
}

function stopDrawing() {
    if (!state.isDrawing) return;
    state.isDrawing = false;
    drawCtx.closePath();
}

/* Helper: Trim whitespace from drawing canvas */
function getTrimmedCanvasDataUrl(canvas) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const pix = ctx.getImageData(0, 0, w, h).data;
    
    let minX = w, minY = h, maxX = 0, maxY = 0;
    let found = false;
    
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const alpha = pix[(y * w + x) * 4 + 3];
            if (alpha > 10) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                found = true;
            }
        }
    }
    
    if (!found) return canvas.toDataURL();
    
    // Add 10px padding
    minX = Math.max(0, minX - 10);
    minY = Math.max(0, minY - 10);
    maxX = Math.min(w - 1, maxX + 10);
    maxY = Math.min(h - 1, maxY + 10);
    
    const trimW = maxX - minX + 1;
    const trimH = maxY - minY + 1;
    
    const trimmedCanvas = document.createElement('canvas');
    trimmedCanvas.width = trimW;
    trimmedCanvas.height = trimH;
    const tCtx = trimmedCanvas.getContext('2d');
    tCtx.drawImage(canvas, minX, minY, trimW, trimH, 0, 0, trimW, trimH);
    
    return trimmedCanvas.toDataURL('image/png');
}

/* Tab 2: Type Signature Setup */
function setupTypeSignature() {
    const colorDots = document.querySelectorAll('#tab-type .color-dot');
    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            state.typedColor = dot.getAttribute('data-color');
            updateFontPreviews();
        });
    });
    
    elements.typedNameInput.addEventListener('input', updateFontPreviews);
    
    elements.fontCards.forEach(card => {
        card.addEventListener('click', () => {
            elements.fontCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            state.selectedFont = card.getAttribute('data-font');
        });
    });
}

function updateFontPreviews() {
    const text = elements.typedNameInput.value || 'Tanda Tangan';
    const samples = document.querySelectorAll('#tab-type .font-sample');
    samples.forEach(sample => {
        sample.textContent = text;
        sample.style.color = state.typedColor;
    });
}

function createTypedSignatureImage(text, fontName, color) {
    const offCanvas = document.createElement('canvas');
    offCanvas.width = 600;
    offCanvas.height = 200;
    const ctx = offCanvas.getContext('2d');
    
    ctx.clearRect(0, 0, offCanvas.width, offCanvas.height);
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let fontSize = 72;
    if (fontName === 'Pacifico') fontSize = 56;
    if (fontName === 'Caveat') fontSize = 68;
    
    ctx.font = `${fontSize}px "${fontName}", cursive`;
    ctx.fillText(text, offCanvas.width / 2, offCanvas.height / 2);
    
    return getTrimmedCanvasDataUrl(offCanvas);
}

/* Tab 3: Upload Image Setup */
function setupUploadSignature() {
    elements.uploadSigDrop.addEventListener('click', () => {
        elements.sigFileInput.click();
    });
    
    elements.sigFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                state.uploadedSigDataUrl = event.target.result;
                elements.sigImagePreview.src = state.uploadedSigDataUrl;
                elements.uploadSigDrop.classList.add('hidden');
                elements.sigImagePreviewBox.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        }
    });
    
    elements.removeUploadedSigBtn.addEventListener('click', () => {
        state.uploadedSigDataUrl = null;
        elements.sigFileInput.value = '';
        elements.sigImagePreviewBox.classList.add('hidden');
        elements.uploadSigDrop.classList.remove('hidden');
    });
}

function resetModalFields() {
    drawCtx.clearRect(0, 0, elements.sigDrawCanvas.width, elements.sigDrawCanvas.height);
    elements.drawPlaceholder.style.opacity = '1';
    elements.typedNameInput.value = '';
    updateFontPreviews();
    
    state.uploadedSigDataUrl = null;
    elements.sigFileInput.value = '';
    elements.sigImagePreviewBox.classList.add('hidden');
    elements.uploadSigDrop.classList.remove('hidden');
}

/* ==========================================================================
   Saved Signatures List & Storage
   ========================================================================== */
function loadSignaturesFromStorage() {
    try {
        const data = localStorage.getItem('signadoc_saved_sigs');
        if (data) {
            state.savedSignatures = JSON.parse(data);
            renderSavedSignaturesList();
        }
    } catch (e) {
        console.error('Failed to load saved signatures:', e);
    }
}

function saveSignaturesToStorage() {
    try {
        localStorage.setItem('signadoc_saved_sigs', JSON.stringify(state.savedSignatures));
    } catch (e) {
        console.error('Failed to save signatures to storage:', e);
    }
}

function renderSavedSignaturesList() {
    const listEl = elements.signaturesList;
    elements.sigCountBadge.textContent = state.savedSignatures.length;
    
    if (state.savedSignatures.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-folder-open"></i>
                <p>Belum ada tanda tangan dibuat</p>
            </div>
        `;
        return;
    }
    
    listEl.innerHTML = '';
    state.savedSignatures.forEach(sig => {
        const card = document.createElement('div');
        card.className = 'sig-item-card';
        card.title = 'Klik untuk menempelkan ke dokumen';
        
        card.innerHTML = `
            <img src="${sig.dataUrl}" alt="${sig.name}" class="sig-item-preview">
            <div class="sig-item-actions">
                <button class="btn-sig-action delete-sig-btn" data-id="${sig.id}" title="Hapus Tanda Tangan">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        
        // Clicking card places signature on active document
        card.addEventListener('click', (e) => {
            if (e.target.closest('.delete-sig-btn')) return;
            if (!state.docType) {
                showToast('Harap buka atau unggah dokumen terlebih dahulu!', 'error');
                return;
            }
            addSignatureToDocument(sig);
        });
        
        // Delete button
        const delBtn = card.querySelector('.delete-sig-btn');
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            state.savedSignatures = state.savedSignatures.filter(s => s.id !== sig.id);
            saveSignaturesToStorage();
            renderSavedSignaturesList();
            showToast('Tanda tangan dihapus dari daftar.', 'info');
        });
        
        listEl.appendChild(card);
    });
}

/* ==========================================================================
   Interactive Signature Placement & Drag/Resize Overlays
   ========================================================================== */
function addSignatureToDocument(sig) {
    // Create new placed signature object with default size and centered coords
    const defaultW = 180;
    const defaultH = 80;
    const startX = Math.max(20, (state.canvasWidth - defaultW) / 2);
    const startY = Math.max(20, (state.canvasHeight - defaultH) / 2);
    
    const placed = {
        id: 'placed_' + Date.now() + '_' + Math.floor(Math.random()*1000),
        sigId: sig.id,
        dataUrl: sig.dataUrl,
        page: state.currentPage,
        normX: startX / state.canvasWidth,
        normY: startY / state.canvasHeight,
        normW: defaultW / state.canvasWidth,
        normH: defaultH / state.canvasHeight
    };
    
    state.placedSignatures.push(placed);
    renderOverlaysForCurrentPage();
    selectOverlay(placed.id);
    showToast('Tanda tangan ditempelkan! Geser dan atur ukurannya sesuai keinginan.', 'success');
}

function renderOverlaysForCurrentPage() {
    elements.overlaysLayer.innerHTML = '';
    
    const currentOverlays = state.placedSignatures.filter(s => s.page === state.currentPage);
    currentOverlays.forEach(item => {
        const el = document.createElement('div');
        el.className = 'sig-overlay-item' + (state.selectedOverlayId === item.id ? ' selected' : '');
        el.id = item.id;
        
        // Convert normalized coordinates to current canvas pixel dimensions
        const left = item.normX * state.canvasWidth;
        const top = item.normY * state.canvasHeight;
        const width = item.normW * state.canvasWidth;
        const height = item.normH * state.canvasHeight;
        
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.style.width = `${width}px`;
        el.style.height = `${height}px`;
        
        el.innerHTML = `
            <img src="${item.dataUrl}" class="sig-overlay-img" alt="Tanda Tangan">
            <div class="overlay-btn-delete" title="Hapus"><i class="fa-solid fa-xmark"></i></div>
            <div class="overlay-resize-handle" title="Ubah Ukuran"></div>
        `;
        
        // Event listeners for interactivity
        setupOverlayInteractions(el, item);
        elements.overlaysLayer.appendChild(el);
    });
}

function selectOverlay(id) {
    state.selectedOverlayId = id;
    document.querySelectorAll('.sig-overlay-item').forEach(el => {
        if (el.id === id) el.classList.add('selected');
        else el.classList.remove('selected');
    });
}

function deselectAllOverlays() {
    state.selectedOverlayId = null;
    document.querySelectorAll('.sig-overlay-item').forEach(el => el.classList.remove('selected'));
}

function setupOverlayInteractions(el, item) {
    // Select when clicked
    el.addEventListener('pointerdown', (e) => {
        if (e.target.classList.contains('overlay-btn-delete') || e.target.classList.contains('overlay-resize-handle')) return;
        selectOverlay(item.id);
        startDraggingOverlay(e, el, item);
    });
    
    // Delete button
    const delBtn = el.querySelector('.overlay-btn-delete');
    delBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        state.placedSignatures = state.placedSignatures.filter(s => s.id !== item.id);
        renderOverlaysForCurrentPage();
    });
    
    // Resize handle
    const resHandle = el.querySelector('.overlay-resize-handle');
    resHandle.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        selectOverlay(item.id);
        startResizingOverlay(e, el, item);
    });
}

/* Dragging logic */
function startDraggingOverlay(e, el, item) {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    
    const startLeft = parseFloat(el.style.left);
    const startTop = parseFloat(el.style.top);
    const elWidth = parseFloat(el.style.width);
    const elHeight = parseFloat(el.style.height);
    
    const onPointerMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        
        let newLeft = startLeft + dx;
        let newTop = startTop + dy;
        
        // Clamp within canvas boundaries
        newLeft = Math.max(0, Math.min(state.canvasWidth - elWidth, newLeft));
        newTop = Math.max(0, Math.min(state.canvasHeight - elHeight, newTop));
        
        el.style.left = `${newLeft}px`;
        el.style.top = `${newTop}px`;
        
        // Update normalized data
        item.normX = newLeft / state.canvasWidth;
        item.normY = newTop / state.canvasHeight;
    };
    
    const onPointerUp = () => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
    };
    
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
}

/* Resizing logic */
function startResizingOverlay(e, el, item) {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    
    const startWidth = parseFloat(el.style.width);
    const startHeight = parseFloat(el.style.height);
    const aspectRatio = startWidth / startHeight;
    const startLeft = parseFloat(el.style.left);
    const startTop = parseFloat(el.style.top);
    
    const onPointerMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        
        let newWidth = Math.max(40, startWidth + dx);
        let newHeight = newWidth / aspectRatio;
        
        // Ensure it doesn't overflow canvas bounds
        if (startLeft + newWidth > state.canvasWidth) {
            newWidth = state.canvasWidth - startLeft;
            newHeight = newWidth / aspectRatio;
        }
        if (startTop + newHeight > state.canvasHeight) {
            newHeight = state.canvasHeight - startTop;
            newWidth = newHeight * aspectRatio;
        }
        
        el.style.width = `${newWidth}px`;
        el.style.height = `${newHeight}px`;
        
        // Update normalized data
        item.normW = newWidth / state.canvasWidth;
        item.normH = newHeight / state.canvasHeight;
    };
    
    const onPointerUp = () => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
    };
    
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
}

/* ==========================================================================
   Document Exporting & Downloading
   ========================================================================== */
function setupDocumentExport() {
    elements.exportBtn.addEventListener('click', async () => {
        if (!state.docType) return;
        if (state.placedSignatures.length === 0) {
            const proceed = confirm('Anda belum menempelkan tanda tangan pada dokumen ini. Tetap unduh dokumen?');
            if (!proceed) return;
        }
        
        deselectAllOverlays();
        elements.exportBtn.disabled = true;
        elements.exportBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses Dokumen...';
        showToast('Sedang memproses dan menyatukan tanda tangan...', 'info');
        
        try {
            if (state.docType === 'pdf') {
                await exportSignedPdf();
            } else {
                await exportSignedImage();
            }
            showToast('Dokumen berhasil diunduh!', 'success');
        } catch (err) {
            console.error('Export error:', err);
            const errMsg = err.message || err.toString();
            showToast(`Gagal mengekspor: ${errMsg}`, 'error');
        } finally {
            elements.exportBtn.disabled = false;
            elements.exportBtn.innerHTML = '<i class="fa-solid fa-download"></i> Unduh Dokumen Resmi';
        }
    });
}

function dataUrlToUint8Array(dataUrl) {
    const base64 = dataUrl.split(',')[1];
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function getEmbeddableImage(pdfDoc, dataUrl) {
    if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
        const bytes = dataUrlToUint8Array(dataUrl);
        try {
            return await pdfDoc.embedJpg(bytes);
        } catch (e) {
            console.warn('Direct embedJpg failed, fallback to canvas...', e);
        }
    }
    
    if (dataUrl.startsWith('data:image/png')) {
        const bytes = dataUrlToUint8Array(dataUrl);
        try {
            return await pdfDoc.embedPng(bytes);
        } catch (e) {
            console.warn('Direct embedPng failed, fallback to canvas...', e);
        }
    }
    
    // Fallback for webp or any other format: draw to canvas and convert to clean PNG Uint8Array
    const img = await loadImageFromDataUrl(dataUrl);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width || 300;
    canvas.height = img.naturalHeight || img.height || 150;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const cleanPngUrl = canvas.toDataURL('image/png');
    const cleanBytes = dataUrlToUint8Array(cleanPngUrl);
    return await pdfDoc.embedPng(cleanBytes);
}

async function exportSignedPdf() {
    const { PDFDocument } = PDFLib;
    // Gunakan salinan buffer agar tidak error jika pernah diproses worker lain
    const pdfDoc = await PDFDocument.load(state.rawBuffer.slice(0), { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    
    // Group signatures by page
    for (const sig of state.placedSignatures) {
        const pageIdx = sig.page - 1;
        if (pageIdx < 0 || pageIdx >= pages.length) continue;
        
        const page = pages[pageIdx];
        const pageW = page.getWidth();
        const pageH = page.getHeight();
        
        // Embed signature image cleanly using byte array
        const imgElement = await getEmbeddableImage(pdfDoc, sig.dataUrl);
        
        // Calculate PDF coordinate mapping
        const sigW = sig.normW * pageW;
        const sigH = sig.normH * pageH;
        const sigX = sig.normX * pageW;
        // PDF-lib y is from bottom-left, whereas normY is from top-left
        const sigY = pageH - (sig.normY * pageH) - sigH;
        
        page.drawImage(imgElement, {
            x: sigX,
            y: sigY,
            width: sigW,
            height: sigH
        });
    }
    
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Create download filename
    const baseName = state.docName.replace(/\.[^/.]+$/, "");
    triggerDownload(blob, `${baseName}_Ditandatangani.pdf`);
}

async function exportSignedImage() {
    const baseImg = state.imageElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const w = baseImg.naturalWidth || baseImg.width;
    const h = baseImg.naturalHeight || baseImg.height;
    
    canvas.width = w;
    canvas.height = h;
    
    // Draw base image
    ctx.drawImage(baseImg, 0, 0, w, h);
    
    // Draw overlays for page 1
    for (const sig of state.placedSignatures) {
        const sigImg = await loadImageFromDataUrl(sig.dataUrl);
        const sigX = sig.normX * w;
        const sigY = sig.normY * h;
        const sigW = sig.normW * w;
        const sigH = sig.normH * h;
        
        ctx.drawImage(sigImg, sigX, sigY, sigW, sigH);
    }
    
    canvas.toBlob((blob) => {
        const baseName = state.docName.replace(/\.[^/.]+$/, "");
        triggerDownload(blob, `${baseName}_Ditandatangani.png`);
    }, 'image/png', 1.0);
}

function loadImageFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
    });
}

function triggerDownload(blob, filename) {
    try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 1000);
    } catch (e) {
        console.error('Download error:', e);
        showToast('Gagal memulai unduhan file.', 'error');
    }
}

/* ==========================================================================
   Help Guide Modal & Toast Helpers
   ========================================================================== */
function setupHelpModal() {
    elements.helpBtn.addEventListener('click', () => {
        elements.helpModalBackdrop.classList.remove('hidden');
    });
    
    const closeModal = () => elements.helpModalBackdrop.classList.add('hidden');
    elements.closeHelpModalBtn.addEventListener('click', closeModal);
    elements.closeHelpBtn.addEventListener('click', closeModal);
    
    elements.helpModalBackdrop.addEventListener('click', (e) => {
        if (e.target === elements.helpModalBackdrop) closeModal();
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-exclamation';
    
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    
    elements.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'toastFadeOut 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
