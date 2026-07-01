/**
 * PDF Editor Pro - Main Router & Startup Module
 * Handles dashboard tool card navigation, global event listeners, and startup initialization.
 */

document.addEventListener('DOMContentLoaded', () => {
    initDomElements();
    setupNavigation();
    setupGlobalControls();
    setupEditorControls();
    setupSignatureModal();
    loadSignaturesFromStorage();
    
    // Default mode for converter
    setConverterMode('pdf-to-img');
    
    showToast('Selamat datang di PDF Editor Pro Windows Suite!', 'info');
});

function switchView(viewName, toolTitle = '') {
    state.currentView = viewName;
    
    if (viewName === 'dashboard') {
        elements.dashboardView.classList.remove('hidden');
        elements.workspaceView.classList.add('hidden');
        elements.backToDashboardBtn.classList.add('hidden');
        elements.workspaceTitle.textContent = '';
        return;
    }
    
    // Switch to a specific tool workspace
    elements.dashboardView.classList.add('hidden');
    elements.workspaceView.classList.remove('hidden');
    elements.backToDashboardBtn.classList.remove('hidden');
    elements.workspaceTitle.textContent = toolTitle;
    
    // Hide all individual tool workspaces first
    elements.toolWorkspaces.forEach(ws => ws.classList.add('hidden'));
    
    if (viewName === 'editor') {
        elements.editorWorkspace.classList.remove('hidden');
    } else if (viewName === 'merge') {
        elements.mergeWorkspace.classList.remove('hidden');
    } else if (viewName === 'pages') {
        elements.pagesWorkspace.classList.remove('hidden');
    } else if (viewName === 'compress') {
        elements.compressWorkspace.classList.remove('hidden');
    } else if (viewName === 'converter') {
        elements.converterWorkspace.classList.remove('hidden');
    }
}

function setupNavigation() {
    // Dashboard Tool Cards clicks
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        card.addEventListener('click', () => {
            const tool = card.getAttribute('data-tool');
            const title = card.querySelector('h3').textContent;
            switchView(tool, title);
        });
    });
    
    // Back to Dashboard button
    if (elements.backToDashboardBtn) {
        elements.backToDashboardBtn.addEventListener('click', () => {
            switchView('dashboard');
        });
    }
    
    // Logo return to dashboard
    const logo = document.querySelector('.logo-section');
    if (logo) {
        logo.addEventListener('click', () => switchView('dashboard'));
    }
}

function setupGlobalControls() {
    // Theme Toggle
    if (elements.themeToggleBtn) {
        elements.themeToggleBtn.addEventListener('click', () => {
            const body = document.body;
            if (body.classList.contains('theme-dark')) {
                body.classList.remove('theme-dark');
                body.classList.add('theme-light');
                elements.themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
                showToast('Mode Terang diaktifkan', 'info');
            } else {
                body.classList.remove('theme-light');
                body.classList.add('theme-dark');
                elements.themeToggleBtn.innerHTML = '<i class="fa-solid fa-moon"></i>';
                showToast('Mode Gelap diaktifkan', 'info');
            }
        });
    }
    
    // Help Modal
    const helpBtn = document.getElementById('helpBtn');
    const helpBackdrop = document.getElementById('helpModalBackdrop');
    const closeHelp = document.getElementById('closeHelpModalBtn');
    
    if (helpBtn && helpBackdrop) {
        helpBtn.addEventListener('click', () => helpBackdrop.classList.remove('hidden'));
        if (closeHelp) closeHelp.addEventListener('click', () => helpBackdrop.classList.add('hidden'));
        helpBackdrop.addEventListener('click', (e) => { if (e.target === helpBackdrop) helpBackdrop.classList.add('hidden'); });
    }
    
    // Mencegah recursion event bubbling pada semua input file saat upload zone diklik
    document.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('click', (e) => e.stopPropagation());
    });
}

function setupEditorControls() {
    // Tool 1: Interactive Editor Upload Zone & File Input
    const editorDrop = document.getElementById('dropZone');
    const editorInput = document.getElementById('fileInput');
    const closeDocBtn = document.getElementById('closeDocBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    if (editorInput && editorDrop) {
        editorInput.addEventListener('click', (e) => e.stopPropagation());
        editorInput.addEventListener('change', (e) => handleEditorFileSelect(e.target.files[0]));
        
        editorDrop.addEventListener('dragover', (e) => { e.preventDefault(); editorDrop.classList.add('dragover'); });
        editorDrop.addEventListener('dragleave', (e) => { e.preventDefault(); editorDrop.classList.remove('dragover'); });
        editorDrop.addEventListener('drop', (e) => {
            e.preventDefault();
            editorDrop.classList.remove('dragover');
            if (e.dataTransfer.files.length) handleEditorFileSelect(e.dataTransfer.files[0]);
        });
    }
    
    if (closeDocBtn) {
        closeDocBtn.addEventListener('click', () => {
            state.docType = null;
            state.rawBuffer = null;
            state.pdfDoc = null;
            state.imageElement = null;
            elements.docInfoCard.classList.add('hidden');
            elements.canvasWrapper.classList.add('hidden');
            elements.viewerEmptyState.classList.remove('hidden');
            elements.dropZone.classList.remove('hidden');
            if (editorInput) editorInput.value = '';
            exportBtn.disabled = true;
            showToast('Dokumen ditutup.', 'info');
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportEditedDocument);
    }
    
    // Zoom Controls
    if (elements.zoomInBtn) {
        elements.zoomInBtn.addEventListener('click', () => {
            state.scale = Math.min(3.0, state.scale + 0.2);
            updateZoomDisplay();
            reRenderCurrentDoc();
        });
    }
    if (elements.zoomOutBtn) {
        elements.zoomOutBtn.addEventListener('click', () => {
            state.scale = Math.max(0.5, state.scale - 0.2);
            updateZoomDisplay();
            reRenderCurrentDoc();
        });
    }
    if (elements.zoomResetBtn) {
        elements.zoomResetBtn.addEventListener('click', () => {
            state.scale = 1.2;
            updateZoomDisplay();
            reRenderCurrentDoc();
        });
    }
    
    // Page Navigation Controls
    if (elements.prevPageBtn) {
        elements.prevPageBtn.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                updatePageButtons();
                renderCurrentPage();
            }
        });
    }
    if (elements.nextPageBtn) {
        elements.nextPageBtn.addEventListener('click', () => {
            if (state.currentPage < state.totalPages) {
                state.currentPage++;
                updatePageButtons();
                renderCurrentPage();
            }
        });
    }
    if (elements.pageNumberInput) {
        elements.pageNumberInput.addEventListener('change', (e) => {
            let val = parseInt(e.target.value);
            if (isNaN(val) || val < 1) val = 1;
            if (val > state.totalPages) val = state.totalPages;
            state.currentPage = val;
            updatePageButtons();
            renderCurrentPage();
        });
    }
    
    // Rotate Page Button
    if (elements.rotatePageBtn) {
        elements.rotatePageBtn.addEventListener('click', rotateCurrentPage);
    }
    
    // Delete Page in Editor
    if (elements.deletePageBtn) {
        elements.deletePageBtn.addEventListener('click', deleteCurrentPageInEditor);
    }
    
    // Annotation Tools Buttons
    const addTextBtn = document.getElementById('addFreeTextBtn');
    if (addTextBtn) {
        addTextBtn.addEventListener('click', () => {
            const textInput = document.getElementById('freeTextInput');
            const colorInput = document.getElementById('freeTextColorInput');
            const sizeInput = document.getElementById('freeTextSizeInput');
            
            const text = textInput && textInput.value.trim() ? textInput.value.trim() : 'Catatan Teks';
            const color = colorInput ? colorInput.value : '#000000';
            const size = sizeInput ? parseInt(sizeInput.value) || 24 : 24;
            
            addTextBoxToDocument(text, color, size);
            if (textInput) textInput.value = '';
        });
    }
    
    const addDateBtn = document.getElementById('addTodayDateBtn');
    if (addDateBtn) {
        addDateBtn.addEventListener('click', addTodayDateStamp);
    }
    
    const stampBtns = document.querySelectorAll('.stamp-btn');
    stampBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.getAttribute('data-stamp');
            const color = btn.getAttribute('data-color') || '#dc2626';
            addStampToDocument(text, color);
        });
    });
    
    // Tool 2: Merge PDF Events
    const mergeInput = document.getElementById('mergeFileInput');
    const mergeDrop = document.getElementById('mergeDropZone');
    const executeMergeBtn = document.getElementById('executeMergeBtn');
    
    if (mergeInput && mergeDrop) {
        mergeInput.addEventListener('change', (e) => handleMergeFilesSelect(e.target.files));
        mergeDrop.addEventListener('dragover', (e) => { e.preventDefault(); mergeDrop.classList.add('dragover'); });
        mergeDrop.addEventListener('dragleave', (e) => { e.preventDefault(); mergeDrop.classList.remove('dragover'); });
        mergeDrop.addEventListener('drop', (e) => {
            e.preventDefault();
            mergeDrop.classList.remove('dragover');
            if (e.dataTransfer.files.length) handleMergeFilesSelect(e.dataTransfer.files);
        });
    }
    if (executeMergeBtn) executeMergeBtn.addEventListener('click', executeMergePdfs);
    
    // Tool 3: Remove Pages Events
    const pagesInput = document.getElementById('pagesFileInput');
    const pagesDrop = document.getElementById('pagesDropZone');
    const executeRemoveBtn = document.getElementById('executeRemovePagesBtn');
    
    if (pagesInput && pagesDrop) {
        pagesInput.addEventListener('change', (e) => handlePagesFileSelect(e.target.files[0]));
        pagesDrop.addEventListener('dragover', (e) => { e.preventDefault(); pagesDrop.classList.add('dragover'); });
        pagesDrop.addEventListener('dragleave', (e) => { e.preventDefault(); pagesDrop.classList.remove('dragover'); });
        pagesDrop.addEventListener('drop', (e) => {
            e.preventDefault();
            pagesDrop.classList.remove('dragover');
            if (e.dataTransfer.files.length) handlePagesFileSelect(e.dataTransfer.files[0]);
        });
    }
    if (executeRemoveBtn) executeRemoveBtn.addEventListener('click', executeRemovePages);
    
    // Tool 4: Compress PDF Events
    const compressInput = document.getElementById('compressFileInput');
    const compressDrop = document.getElementById('compressDropZone');
    
    if (compressInput && compressDrop) {
        compressInput.addEventListener('change', (e) => handleCompressFileSelect(e.target.files[0]));
        compressDrop.addEventListener('dragover', (e) => { e.preventDefault(); compressDrop.classList.add('dragover'); });
        compressDrop.addEventListener('dragleave', (e) => { e.preventDefault(); compressDrop.classList.remove('dragover'); });
        compressDrop.addEventListener('drop', (e) => {
            e.preventDefault();
            compressDrop.classList.remove('dragover');
            if (e.dataTransfer.files.length) handleCompressFileSelect(e.dataTransfer.files[0]);
        });
    }
    
    // Tool 5, 6, 7: Converter Events
    const converterTabs = document.querySelectorAll('.converter-tab-btn');
    converterTabs.forEach(btn => {
        btn.addEventListener('click', () => setConverterMode(btn.getAttribute('data-mode')));
    });
    
    const converterInput = document.getElementById('converterFileInput');
    const converterDrop = document.getElementById('converterDropZone');
    const executeConvertBtn = document.getElementById('executeConvertBtn');
    
    if (converterInput && converterDrop) {
        converterInput.addEventListener('change', (e) => handleConverterFileSelect(e.target.files));
        converterDrop.addEventListener('dragover', (e) => { e.preventDefault(); converterDrop.classList.add('dragover'); });
        converterDrop.addEventListener('dragleave', (e) => { e.preventDefault(); converterDrop.classList.remove('dragover'); });
        converterDrop.addEventListener('drop', (e) => {
            e.preventDefault();
            converterDrop.classList.remove('dragover');
            if (e.dataTransfer.files.length) handleConverterFileSelect(e.dataTransfer.files);
        });
    }
    if (executeConvertBtn) executeConvertBtn.addEventListener('click', executeConversion);
}

function updateZoomDisplay() {
    if (elements.zoomLevelText) {
        elements.zoomLevelText.textContent = `${Math.round(state.scale * 100)}%`;
    }
}

function reRenderCurrentDoc() {
    if (!state.docType) return;
    if (state.docType === 'pdf') renderCurrentPage();
    else renderImageToCanvas();
}
