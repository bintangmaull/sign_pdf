/**
 * PDF Editor Pro - Tool 1: Interactive Editor Module
 * Supports PDF rendering via PDF.js, Signatures, Free Text Boxes, Stamps, Date Stamps, and PDF-Lib Exporting.
 */

// Initialize PDF.js Worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

async function handleEditorFileSelect(file) {
    if (!file) return;
    
    if (file.size > 20 * 1024 * 1024) {
        showToast('Ukuran file terlalu besar! Maksimal 20MB.', 'error');
        return;
    }
    
    state.docName = file.name;
    const fileType = file.type;
    const fileNameLower = file.name.toLowerCase();
    
    state.placedSignatures = [];
    state.placedTexts = [];
    state.placedStamps = [];
    state.selectedOverlayId = null;
    state.rotation = 0;
    
    if (fileType === 'application/pdf' || fileNameLower.endsWith('.pdf')) {
        state.docType = 'pdf';
    } else if (fileType.startsWith('image/') || /\.(png|jpg|jpeg|webp)$/.test(fileNameLower)) {
        state.docType = 'image';
    } else {
        showToast('Format file tidak didukung! Harap gunakan PDF atau Gambar (PNG/JPG).', 'error');
        return;
    }
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        state.rawBuffer = arrayBuffer.slice(0);
        
        if (state.docType === 'pdf') {
            await loadPdfDocument(arrayBuffer.slice(0));
            elements.docTypeIcon.className = 'fa-solid fa-file-pdf';
            elements.docMeta.textContent = `PDF • ${state.totalPages} Halaman`;
        } else {
            await loadImageDocument(arrayBuffer.slice(0));
            elements.docTypeIcon.className = 'fa-solid fa-file-image';
            elements.docMeta.textContent = 'Dokumen Gambar';
        }
        
        elements.docName.textContent = state.docName;
        elements.docInfoCard.classList.remove('hidden');
        elements.dropZone.classList.add('hidden');
        elements.viewerEmptyState.classList.add('hidden');
        elements.canvasWrapper.classList.remove('hidden');
        elements.exportBtn.disabled = false;
        
        showToast('Dokumen berhasil dimuat! Silakan tambahkan tanda tangan atau teks.', 'success');
    } catch (error) {
        console.error('Error loading file:', error);
        showToast('Gagal memuat dokumen. File rusak atau terenkripsi.', 'error');
    }
}

async function loadPdfDocument(arrayBuffer) {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer.slice(0) });
    state.pdfDoc = await loadingTask.promise;
    state.totalPages = state.pdfDoc.numPages;
    state.currentPage = 1;
    
    if (state.totalPages > 1) {
        elements.pageControls.classList.remove('hidden');
        elements.totalPagesCount.textContent = state.totalPages;
        elements.pageNumberInput.max = state.totalPages;
        elements.pageNumberInput.value = 1;
        updatePageButtons();
    } else {
        elements.pageControls.classList.add('hidden');
    }
    
    elements.zoomControls.classList.remove('hidden');
    if (elements.rotatePageBtn) elements.rotatePageBtn.classList.remove('hidden');
    if (elements.deletePageBtn) elements.deletePageBtn.classList.remove('hidden');
    await renderCurrentPage();
}

async function loadImageDocument(arrayBuffer) {
    state.totalPages = 1;
    state.currentPage = 1;
    elements.pageControls.classList.add('hidden');
    elements.zoomControls.classList.remove('hidden');
    if (elements.rotatePageBtn) elements.rotatePageBtn.classList.add('hidden');
    if (elements.deletePageBtn) elements.deletePageBtn.classList.add('hidden');
    
    const blob = new Blob([arrayBuffer]);
    const url = URL.createObjectURL(blob);
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            state.imageElement = img;
            renderImageToCanvas();
            resolve();
        };
        img.onerror = reject;
        img.src = url;
    });
}

async function renderCurrentPage() {
    if (!state.pdfDoc) return;
    
    elements.viewerStatusText.textContent = `Merender halaman ${state.currentPage}...`;
    const page = await state.pdfDoc.getPage(state.currentPage);
    
    const unscaledViewport = page.getViewport({ scale: 1, rotation: state.rotation });
    const maxDimension = 900;
    let autoScale = 1.0;
    if (unscaledViewport.width > maxDimension || unscaledViewport.height > maxDimension) {
        autoScale = Math.min(maxDimension / unscaledViewport.width, maxDimension / unscaledViewport.height);
    }
    
    const viewport = page.getViewport({ scale: autoScale * state.scale, rotation: state.rotation });
    
    const canvas = elements.docCanvas;
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    state.canvasWidth = viewport.width;
    state.canvasHeight = viewport.height;
    
    await page.render({ canvasContext: context, viewport: viewport }).promise;
    elements.viewerStatusText.textContent = `Halaman ${state.currentPage} dari ${state.totalPages}`;
    renderAllOverlaysForCurrentPage();
}

function renderImageToCanvas() {
    if (!state.imageElement) return;
    
    const img = state.imageElement;
    const maxDimension = 950;
    let w = img.naturalWidth || img.width;
    let h = img.naturalHeight || img.height;
    
    let baseScale = 1.0;
    if (w > maxDimension || h > maxDimension) {
        baseScale = Math.min(maxDimension / w, maxDimension / h);
    }
    
    const finalW = w * baseScale * state.scale;
    const finalH = h * baseScale * state.scale;
    
    const canvas = elements.docCanvas;
    const context = canvas.getContext('2d');
    canvas.width = finalW;
    canvas.height = finalH;
    
    state.canvasWidth = finalW;
    state.canvasHeight = finalH;
    
    context.drawImage(img, 0, 0, finalW, finalH);
    elements.viewerStatusText.textContent = `Dokumen Gambar (${Math.round(finalW)}x${Math.round(finalH)} px)`;
    renderAllOverlaysForCurrentPage();
}

function updatePageButtons() {
    elements.prevPageBtn.disabled = (state.currentPage <= 1);
    elements.nextPageBtn.disabled = (state.currentPage >= state.totalPages);
    elements.pageNumberInput.value = state.currentPage;
}

/* ==========================================================================
   Interactive Overlays Rendering (Signatures, Texts, Stamps)
   ========================================================================== */
function renderAllOverlaysForCurrentPage() {
    elements.overlaysLayer.innerHTML = '';
    
    const currentSigs = state.placedSignatures.filter(s => s.page === state.currentPage);
    currentSigs.forEach(item => {
        const el = createOverlayElement(item, 'sig', `
            <img src="${item.dataUrl}" class="sig-overlay-img" alt="Tanda Tangan">
        `);
        elements.overlaysLayer.appendChild(el);
    });
    
    const currentTexts = state.placedTexts.filter(t => t.page === state.currentPage);
    currentTexts.forEach(item => {
        const el = createOverlayElement(item, 'text', `
            <div class="text-overlay-content" style="color: ${item.color}; font-size: ${item.fontSize}px;">
                ${item.text}
            </div>
        `);
        elements.overlaysLayer.appendChild(el);
    });
    
    const currentStamps = state.placedStamps.filter(s => s.page === state.currentPage);
    currentStamps.forEach(item => {
        const el = createOverlayElement(item, 'stamp', `
            <div class="stamp-box" style="color: ${item.color}; border-color: ${item.color};">
                ${item.stampText}
            </div>
        `);
        elements.overlaysLayer.appendChild(el);
    });
}

function createOverlayElement(item, type, contentHtml) {
    const el = document.createElement('div');
    const className = `${type}-overlay-item` + (state.selectedOverlayId === item.id ? ' selected' : '');
    el.className = className;
    el.id = item.id;
    
    const left = item.normX * state.canvasWidth;
    const top = item.normY * state.canvasHeight;
    const width = item.normW * state.canvasWidth;
    const height = item.normH * state.canvasHeight;
    
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
    
    el.innerHTML = contentHtml + `
        <div class="overlay-btn-delete" title="Hapus"><i class="fa-solid fa-xmark"></i></div>
        <div class="overlay-resize-handle" title="Ubah Ukuran"></div>
    `;
    
    setupOverlayInteractions(el, item, type);
    return el;
}

function selectOverlay(id, type) {
    state.selectedOverlayId = id;
    state.selectedOverlayType = type;
    document.querySelectorAll('.sig-overlay-item, .text-overlay-item, .stamp-overlay-item').forEach(el => {
        if (el.id === id) el.classList.add('selected');
        else el.classList.remove('selected');
    });
}

function deselectAllOverlays() {
    state.selectedOverlayId = null;
    state.selectedOverlayType = null;
    document.querySelectorAll('.sig-overlay-item, .text-overlay-item, .stamp-overlay-item').forEach(el => el.classList.remove('selected'));
}

function setupOverlayInteractions(el, item, type) {
    el.addEventListener('pointerdown', (e) => {
        if (e.target.classList.contains('overlay-btn-delete') || e.target.classList.contains('overlay-resize-handle')) return;
        selectOverlay(item.id, type);
        startDraggingOverlay(e, el, item);
    });
    
    const delBtn = el.querySelector('.overlay-btn-delete');
    delBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (type === 'sig') state.placedSignatures = state.placedSignatures.filter(s => s.id !== item.id);
        if (type === 'text') state.placedTexts = state.placedTexts.filter(t => t.id !== item.id);
        if (type === 'stamp') state.placedStamps = state.placedStamps.filter(s => s.id !== item.id);
        renderAllOverlaysForCurrentPage();
    });
    
    const resHandle = el.querySelector('.overlay-resize-handle');
    resHandle.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        selectOverlay(item.id, type);
        startResizingOverlay(e, el, item, type);
    });
}

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
        let newLeft = Math.max(0, Math.min(state.canvasWidth - elWidth, startLeft + dx));
        let newTop = Math.max(0, Math.min(state.canvasHeight - elHeight, startTop + dy));
        el.style.left = `${newLeft}px`;
        el.style.top = `${newTop}px`;
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

function startResizingOverlay(e, el, item, type) {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = parseFloat(el.style.width);
    const startHeight = parseFloat(el.style.height);
    const aspectRatio = startWidth / startHeight;
    const startLeft = parseFloat(el.style.left);
    const startTop = parseFloat(el.style.top);
    
    const onPointerMove = (moveEvent) => {
        const dx = moveEvent.clientX - startX;
        let newWidth = Math.max(50, startWidth + dx);
        let newHeight = newWidth / aspectRatio;
        
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
        item.normW = newWidth / state.canvasWidth;
        item.normH = newHeight / state.canvasHeight;
        
        if (type === 'text') {
            item.fontSize = Math.max(12, Math.round(newHeight * 0.45));
            const content = el.querySelector('.text-overlay-content');
            if (content) content.style.fontSize = `${item.fontSize}px`;
        }
    };
    
    const onPointerUp = () => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
    };
    
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
}

/* ==========================================================================
   Adding New Overlays (Signatures, Text Boxes, Stamps, Dates)
   ========================================================================== */
function addSignatureToDocument(sig) {
    const defaultW = 180;
    const defaultH = 80;
    const startX = Math.max(20, (state.canvasWidth - defaultW) / 2);
    const startY = Math.max(20, (state.canvasHeight - defaultH) / 2);
    
    const placed = {
        id: 'sig_' + Date.now() + '_' + Math.floor(Math.random()*1000),
        sigId: sig.id,
        dataUrl: sig.dataUrl,
        page: state.currentPage,
        normX: startX / state.canvasWidth,
        normY: startY / state.canvasHeight,
        normW: defaultW / state.canvasWidth,
        normH: defaultH / state.canvasHeight
    };
    
    state.placedSignatures.push(placed);
    renderAllOverlaysForCurrentPage();
    selectOverlay(placed.id, 'sig');
    showToast('Tanda tangan ditempelkan! Geser dan atur ukurannya.', 'success');
}

function addTextBoxToDocument(text, color = '#000000', fontSize = 24) {
    if (!state.docType) {
        showToast('Harap buka dokumen terlebih dahulu!', 'error');
        return;
    }
    
    const defaultW = Math.max(160, text.length * 13);
    const defaultH = 60;
    const startX = Math.max(20, (state.canvasWidth - defaultW) / 2);
    const startY = Math.max(20, (state.canvasHeight - defaultH) / 2);
    
    const placed = {
        id: 'text_' + Date.now() + '_' + Math.floor(Math.random()*1000),
        text: text,
        color: color,
        fontSize: fontSize,
        page: state.currentPage,
        normX: startX / state.canvasWidth,
        normY: startY / state.canvasHeight,
        normW: defaultW / state.canvasWidth,
        normH: defaultH / state.canvasHeight
    };
    
    state.placedTexts.push(placed);
    renderAllOverlaysForCurrentPage();
    selectOverlay(placed.id, 'text');
    showToast('Teks anotasi ditempelkan! Geser posisinya sesuai keinginan.', 'success');
}

function addStampToDocument(stampText, color = '#dc2626') {
    if (!state.docType) {
        showToast('Harap buka dokumen terlebih dahulu!', 'error');
        return;
    }
    
    const defaultW = 200;
    const defaultH = 70;
    const startX = Math.max(20, (state.canvasWidth - defaultW) / 2);
    const startY = Math.max(20, (state.canvasHeight - defaultH) / 2);
    
    const placed = {
        id: 'stamp_' + Date.now() + '_' + Math.floor(Math.random()*1000),
        stampText: stampText,
        color: color,
        page: state.currentPage,
        normX: startX / state.canvasWidth,
        normY: startY / state.canvasHeight,
        normW: defaultW / state.canvasWidth,
        normH: defaultH / state.canvasHeight
    };
    
    state.placedStamps.push(placed);
    renderAllOverlaysForCurrentPage();
    selectOverlay(placed.id, 'stamp');
    showToast(`Stempel "${stampText}" ditempelkan!`, 'success');
}

function addTodayDateStamp() {
    const now = new Date();
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('id-ID', options);
    addTextBoxToDocument(dateStr, '#1e293b', 22);
}

/* ==========================================================================
   Page Rotation & Deletion in Interactive Editor
   ========================================================================== */
function rotateCurrentPage() {
    if (!state.docType || state.docType !== 'pdf') return;
    state.rotation = (state.rotation + 90) % 360;
    renderCurrentPage();
    showToast(`Halaman diputar ${state.rotation}°`, 'info');
}

async function deleteCurrentPageInEditor() {
    if (!state.docType || state.docType !== 'pdf' || state.totalPages <= 1) {
        showToast('Tidak dapat menghapus halaman (dokumen harus memiliki lebih dari 1 halaman).', 'error');
        return;
    }
    
    if (!confirm(`Apakah Anda yakin ingin menghapus halaman ${state.currentPage} dari PDF ini?`)) return;
    
    try {
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(state.rawBuffer.slice(0), { ignoreEncryption: true });
        pdfDoc.removePage(state.currentPage - 1);
        
        const newBytes = await pdfDoc.save();
        state.rawBuffer = newBytes.slice(0);
        
        state.placedSignatures = state.placedSignatures.filter(s => s.page !== state.currentPage);
        state.placedSignatures.forEach(s => { if (s.page > state.currentPage) s.page--; });
        
        state.placedTexts = state.placedTexts.filter(t => t.page !== state.currentPage);
        state.placedTexts.forEach(t => { if (t.page > state.currentPage) t.page--; });
        
        state.placedStamps = state.placedStamps.filter(s => s.page !== state.currentPage);
        state.placedStamps.forEach(s => { if (s.page > state.currentPage) s.page--; });
        
        await loadPdfDocument(state.rawBuffer.slice(0));
        showToast('Halaman berhasil dihapus!', 'success');
    } catch (e) {
        console.error('Error deleting page:', e);
        showToast('Gagal menghapus halaman.', 'error');
    }
}

/* ==========================================================================
   Signature Creation & Modal Management
   ========================================================================== */
function setupSignatureModal() {
    const openBtn = document.getElementById('openSigModalBtn');
    const closeBtn = document.getElementById('closeSigModalBtn');
    const cancelBtn = document.getElementById('cancelSigBtn');
    const saveBtn = document.getElementById('saveSigBtn');
    const backdrop = document.getElementById('sigModalBackdrop');
    
    if (!openBtn) return;
    
    openBtn.addEventListener('click', () => {
        backdrop.classList.remove('hidden');
        initDrawCanvas();
    });
    
    const closeModal = () => backdrop.classList.add('hidden');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (backdrop) backdrop.addEventListener('click', (e) => { if (e.target === backdrop) closeModal(); });
    
    // Tabs setup
    const tabBtns = document.querySelectorAll('.sig-tabs .tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const targetId = 'tab-' + btn.getAttribute('data-tab');
            const targetEl = document.getElementById(targetId);
            if (targetEl) targetEl.classList.add('active');
            if (btn.getAttribute('data-tab') === 'draw') initDrawCanvas();
        });
    });
    
    setupDrawCanvas();
    setupTypeSignature();
    setupUploadSignature();
    
    if (saveBtn) saveBtn.addEventListener('click', () => {
        saveActiveSignature();
        closeModal();
    });
}

function setupDrawCanvas() {
    const canvas = document.getElementById('sigDrawCanvas');
    const clearBtn = document.getElementById('clearDrawBtn');
    const colorDots = document.querySelectorAll('#tab-draw .color-dot');
    const slider = document.getElementById('penWidthSlider');
    const sliderVal = document.getElementById('penWidthVal');
    const placeholder = document.getElementById('drawPlaceholder');
    
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            state.penColor = dot.getAttribute('data-color');
        });
    });
    
    if (slider) {
        slider.addEventListener('input', (e) => {
            state.penWidth = parseInt(e.target.value);
            if (sliderVal) sliderVal.textContent = `${state.penWidth}px`;
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (placeholder) placeholder.style.display = 'flex';
        });
    }
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };
    
    const startDraw = (e) => {
        e.preventDefault();
        isDrawing = true;
        const pos = getPos(e);
        lastX = pos.x;
        lastY = pos.y;
        if (placeholder) placeholder.style.display = 'none';
        ctx.beginPath();
        ctx.arc(lastX, lastY, state.penWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = state.penColor;
        ctx.fill();
    };
    
    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.strokeStyle = state.penColor;
        ctx.lineWidth = state.penWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        lastX = pos.x;
        lastY = pos.y;
    };
    
    const stopDraw = () => { isDrawing = false; };
    
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDraw);
}

function initDrawCanvas() {
    const canvas = document.getElementById('sigDrawCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const placeholder = document.getElementById('drawPlaceholder');
    if (placeholder) placeholder.style.display = 'flex';
}

function setupTypeSignature() {
    const input = document.getElementById('typedNameInput');
    const cards = document.querySelectorAll('.font-card');
    const colorDots = document.querySelectorAll('#tab-type .color-dot');
    
    if (!input) return;
    
    cards.forEach(card => {
        card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });
    
    colorDots.forEach(dot => {
        dot.addEventListener('click', () => {
            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            const color = dot.getAttribute('data-color');
            cards.forEach(c => c.style.color = color);
        });
    });
    
    input.addEventListener('input', (e) => {
        const val = e.target.value || 'Tanda Tangan';
        document.querySelectorAll('.font-sample').forEach(el => el.textContent = val);
    });
}

function setupUploadSignature() {
    const fileInput = document.getElementById('sigFileInput');
    const dropZone = document.getElementById('uploadSigDrop');
    const previewBox = document.getElementById('sigImagePreviewBox');
    const previewImg = document.getElementById('sigImagePreview');
    const removeBtn = document.getElementById('removeUploadedSigBtn');
    
    if (!fileInput || !dropZone) return;
    
    const handleFile = (file) => {
        if (!file || !file.type.startsWith('image/')) {
            showToast('Harap pilih file gambar (PNG/JPG)', 'error');
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            if (previewImg) previewImg.src = e.target.result;
            dropZone.classList.add('hidden');
            if (previewBox) previewBox.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    };
    
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = '#6366f1'; });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.style.borderColor = ''; });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = '';
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
    
    if (removeBtn) {
        removeBtn.addEventListener('click', () => {
            fileInput.value = '';
            if (previewBox) previewBox.classList.add('hidden');
            dropZone.classList.remove('hidden');
        });
    }
}

function saveActiveSignature() {
    const activeTabBtn = document.querySelector('.sig-tabs .tab-btn.active');
    if (!activeTabBtn) return;
    const tab = activeTabBtn.getAttribute('data-tab');
    let dataUrl = null;
    
    if (tab === 'draw') {
        const canvas = document.getElementById('sigDrawCanvas');
        const placeholder = document.getElementById('drawPlaceholder');
        if (placeholder && placeholder.style.display !== 'none') {
            showToast('Anda belum melukis tanda tangan!', 'error');
            return;
        }
        dataUrl = canvas.toDataURL('image/png');
    } else if (tab === 'type') {
        const input = document.getElementById('typedNameInput');
        const val = input ? input.value.trim() : '';
        if (!val) {
            showToast('Harap ketik nama Anda terlebih dahulu!', 'error');
            return;
        }
        const activeCard = document.querySelector('.font-card.active');
        const fontName = activeCard ? activeCard.getAttribute('data-font') : 'Great Vibes';
        const activeColorDot = document.querySelector('#tab-type .color-dot.active');
        const color = activeColorDot ? activeColorDot.getAttribute('data-color') : '#000000';
        
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 150;
        const ctx = canvas.getContext('2d');
        ctx.font = `48px "${fontName}", cursive`;
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(val, 200, 75);
        dataUrl = canvas.toDataURL('image/png');
    } else if (tab === 'upload') {
        const previewImg = document.getElementById('sigImagePreview');
        if (!previewImg || !previewImg.src || previewImg.src === window.location.href) {
            showToast('Harap pilih gambar tanda tangan terlebih dahulu!', 'error');
            return;
        }
        dataUrl = previewImg.src;
    }
    
    if (dataUrl) {
        const newSig = {
            id: 'sig_' + Date.now(),
            dataUrl: dataUrl
        };
        state.savedSignatures.push(newSig);
        saveSignaturesToStorage();
        renderSavedSignaturesList();
        showToast('Tanda tangan berhasil dibuat & disimpan!', 'success');
    }
}

function saveSignaturesToStorage() {
    try {
        localStorage.setItem('signadoc_saved_sigs', JSON.stringify(state.savedSignatures));
    } catch (e) {
        console.warn('LocalStorage error:', e);
    }
}

function loadSignaturesFromStorage() {
    try {
        const data = localStorage.getItem('signadoc_saved_sigs');
        if (data) {
            state.savedSignatures = JSON.parse(data);
            renderSavedSignaturesList();
        }
    } catch (e) {
        console.warn('LocalStorage error:', e);
    }
}

function renderSavedSignaturesList() {
    const listEl = document.getElementById('signaturesList');
    const badgeEl = document.getElementById('sigCountBadge');
    if (!listEl) return;
    
    if (badgeEl) badgeEl.textContent = state.savedSignatures.length;
    
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
        card.className = 'sig-card';
        card.innerHTML = `
            <img src="${sig.dataUrl}" class="sig-card-img" alt="Tanda Tangan">
            <button class="delete-sig-btn" title="Hapus"><i class="fa-solid fa-trash"></i></button>
        `;
        
        card.addEventListener('click', (e) => {
            if (e.target.closest('.delete-sig-btn')) return;
            if (!state.docType) {
                showToast('Harap buka dokumen terlebih dahulu!', 'error');
                return;
            }
            addSignatureToDocument(sig);
        });
        
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
   Document Exporting (PDF-Lib & File System Access API)
   ========================================================================== */
async function getEmbeddableImage(pdfDoc, dataUrl) {
    if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
        const bytes = dataUrlToUint8Array(dataUrl);
        try { return await pdfDoc.embedJpg(bytes); } catch (e) { console.warn('Direct embedJpg failed...', e); }
    }
    if (dataUrl.startsWith('data:image/png')) {
        const bytes = dataUrlToUint8Array(dataUrl);
        try { return await pdfDoc.embedPng(bytes); } catch (e) { console.warn('Direct embedPng failed...', e); }
    }
    
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

function hexToRgbLib(hex) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(char => char + char).join('');
    const num = parseInt(c, 16);
    return {
        r: ((num >> 16) & 255) / 255,
        g: ((num >> 8) & 255) / 255,
        b: (num & 255) / 255
    };
}

async function exportEditedDocument() {
    if (!state.docType) return;
    
    deselectAllOverlays();
    elements.exportBtn.disabled = true;
    elements.exportBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan Dokumen...';
    showToast('Sedang memproses dokumen hasil edit...', 'info');
    
    try {
        if (state.docType === 'pdf') {
            await exportEditedPdf();
        } else {
            await exportEditedImage();
        }
        showToast('Dokumen berhasil disimpan di folder pilihan Anda!', 'success');
    } catch (err) {
        if (err.message === 'Dibatalkan oleh pengguna' || err.name === 'AbortError') {
            showToast('Proses penyimpanan dibatalkan.', 'info');
        } else {
            console.error('Export error:', err);
            showToast(`Gagal menyimpan: ${err.message || err.toString()}`, 'error');
        }
    } finally {
        elements.exportBtn.disabled = false;
        elements.exportBtn.innerHTML = '<i class="fa-solid fa-folder-arrow-down"></i> Simpan Dokumen Ke...';
    }
}

async function exportEditedPdf() {
    const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;
    const pdfDoc = await PDFDocument.load(state.rawBuffer.slice(0), { ignoreEncryption: true });
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Apply rotation if changed
    if (state.rotation !== 0) {
        pages.forEach(page => {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees((currentRotation + state.rotation) % 360));
        });
    }
    
    // 1. Draw Signatures
    for (const sig of state.placedSignatures) {
        const pageIdx = sig.page - 1;
        if (pageIdx < 0 || pageIdx >= pages.length) continue;
        const page = pages[pageIdx];
        const pageW = page.getWidth();
        const pageH = page.getHeight();
        
        const imgElement = await getEmbeddableImage(pdfDoc, sig.dataUrl);
        const sigW = sig.normW * pageW;
        const sigH = sig.normH * pageH;
        const sigX = sig.normX * pageW;
        const sigY = pageH - (sig.normY * pageH) - sigH;
        
        page.drawImage(imgElement, { x: sigX, y: sigY, width: sigW, height: sigH });
    }
    
    // 2. Draw Texts
    for (const item of state.placedTexts) {
        const pageIdx = item.page - 1;
        if (pageIdx < 0 || pageIdx >= pages.length) continue;
        const page = pages[pageIdx];
        const pageW = page.getWidth();
        const pageH = page.getHeight();
        
        const textX = item.normX * pageW + 10;
        const textY = pageH - (item.normY * pageH) - (item.fontSize * 1.5);
        const colorRgb = hexToRgbLib(item.color || '#000000');
        
        page.drawText(item.text, {
            x: textX,
            y: Math.max(10, textY),
            size: item.fontSize || 20,
            font: font,
            color: rgb(colorRgb.r, colorRgb.g, colorRgb.b)
        });
    }
    
    // 3. Draw Stamps
    for (const stamp of state.placedStamps) {
        const pageIdx = stamp.page - 1;
        if (pageIdx < 0 || pageIdx >= pages.length) continue;
        const page = pages[pageIdx];
        const pageW = page.getWidth();
        const pageH = page.getHeight();
        
        const stampW = stamp.normW * pageW;
        const stampH = stamp.normH * pageH;
        const stampX = stamp.normX * pageW;
        const stampY = pageH - (stamp.normY * pageH) - stampH;
        const colorRgb = hexToRgbLib(stamp.color || '#dc2626');
        
        // Draw stamp border and text
        page.drawRectangle({
            x: stampX,
            y: stampY,
            width: stampW,
            height: stampH,
            borderColor: rgb(colorRgb.r, colorRgb.g, colorRgb.b),
            borderWidth: 3
        });
        
        page.drawText(stamp.stampText, {
            x: stampX + (stampW * 0.1),
            y: stampY + (stampH * 0.35),
            size: Math.round(stampH * 0.35),
            font: font,
            color: rgb(colorRgb.r, colorRgb.g, colorRgb.b)
        });
    }
    
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const baseName = state.docName.replace(/\.[^/.]+$/, "");
    await saveFileWithPicker(blob, `${baseName}_Diedit.pdf`, 'Dokumen PDF (*.pdf)', { 'application/pdf': ['.pdf'] });
}

async function exportEditedImage() {
    const baseImg = state.imageElement;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    const w = baseImg.naturalWidth || baseImg.width;
    const h = baseImg.naturalHeight || baseImg.height;
    canvas.width = w;
    canvas.height = h;
    
    ctx.drawImage(baseImg, 0, 0, w, h);
    
    for (const sig of state.placedSignatures) {
        const sigImg = await loadImageFromDataUrl(sig.dataUrl);
        ctx.drawImage(sigImg, sig.normX * w, sig.normY * h, sig.normW * w, sig.normH * h);
    }
    
    for (const item of state.placedTexts) {
        ctx.font = `bold ${item.fontSize || 24}px sans-serif`;
        ctx.fillStyle = item.color || '#000000';
        ctx.fillText(item.text, item.normX * w + 10, (item.normY * h) + (item.fontSize * 1.2));
    }
    
    for (const stamp of state.placedStamps) {
        const sx = stamp.normX * w;
        const sy = stamp.normY * h;
        const sw = stamp.normW * w;
        const sh = stamp.normH * h;
        ctx.strokeStyle = stamp.color || '#dc2626';
        ctx.lineWidth = 4;
        ctx.strokeRect(sx, sy, sw, sh);
        ctx.font = `bold ${Math.round(sh * 0.35)}px Outfit, sans-serif`;
        ctx.fillStyle = stamp.color || '#dc2626';
        ctx.fillText(stamp.stampText, sx + (sw * 0.1), sy + (sh * 0.6));
    }
    
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
    const baseName = state.docName.replace(/\.[^/.]+$/, "");
    await saveFileWithPicker(blob, `${baseName}_Diedit.png`, 'Gambar PNG (*.png)', { 'image/png': ['.png'] });
}
