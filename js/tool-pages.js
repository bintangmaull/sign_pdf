/**
 * PDF Editor Pro - Tool 3: Remove Pages Module
 * Renders thumbnails of all PDF pages in a grid, allowing users to mark pages for deletion and export a clean PDF.
 */

async function handlePagesFileSelect(file) {
    if (!file) return;
    
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        showToast('Harap pilih file berformat PDF!', 'error');
        return;
    }
    
    showToast('Membaca struktur halaman PDF...', 'info');
    state.docName = file.name;
    state.pagesToDelete.clear();
    
    try {
        const buffer = await file.arrayBuffer();
        state.rawBuffer = buffer.slice(0);
        
        const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) });
        const pdfDoc = await loadingTask.promise;
        state.totalPages = pdfDoc.numPages;
        
        const infoEl = document.getElementById('pagesDocInfo');
        if (infoEl) {
            infoEl.innerHTML = `<strong>${file.name}</strong> (${state.totalPages} Halaman) • Klik pada halaman yang ingin Anda <strong>hapus</strong>.`;
        }
        
        await renderPagesThumbnailsGrid(pdfDoc);
        updateRemovePagesUI();
    } catch (e) {
        console.error('Error loading PDF for pages tool:', e);
        showToast('Gagal membaca dokumen PDF.', 'error');
    }
}

async function renderPagesThumbnailsGrid(pdfDoc) {
    const gridEl = document.getElementById('pagesThumbGrid');
    const emptyEl = document.getElementById('pagesEmptyState');
    if (!gridEl) return;
    
    if (emptyEl) emptyEl.classList.add('hidden');
    gridEl.innerHTML = '<div class="text-center" style="grid-column: 1/-1; padding: 2rem; color: var(--text-muted);"><i class="fa-solid fa-spinner fa-spin fa-2x"></i><p class="mt-2">Merender thumbnail halaman...</p></div>';
    
    const cards = [];
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.3 });
        
        const card = document.createElement('div');
        card.className = 'page-thumb-card';
        card.setAttribute('data-page', i);
        
        const canvas = document.createElement('canvas');
        canvas.className = 'page-thumb-canvas';
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        card.appendChild(canvas);
        
        const label = document.createElement('span');
        label.className = 'page-thumb-label';
        label.textContent = `Halaman ${i}`;
        card.appendChild(label);
        
        const badge = document.createElement('div');
        badge.className = 'page-delete-badge';
        badge.innerHTML = '<i class="fa-solid fa-trash"></i>';
        card.appendChild(badge);
        
        card.addEventListener('click', () => {
            if (state.pagesToDelete.has(i)) {
                state.pagesToDelete.delete(i);
                card.classList.remove('marked-delete');
            } else {
                if (state.pagesToDelete.size >= state.totalPages - 1) {
                    showToast('Dokumen PDF minimal harus menyisakan 1 halaman!', 'error');
                    return;
                }
                state.pagesToDelete.add(i);
                card.classList.add('marked-delete');
            }
            updateRemovePagesUI();
        });
        
        cards.push(card);
    }
    
    gridEl.innerHTML = '';
    cards.forEach(c => gridEl.appendChild(c));
}

function updateRemovePagesUI() {
    const statusText = document.getElementById('pagesDeleteStatusText');
    const actionBtn = document.getElementById('executeRemovePagesBtn');
    
    const count = state.pagesToDelete.size;
    if (statusText) {
        if (count === 0) {
            statusText.innerHTML = 'Belum ada halaman dipilih untuk dihapus.';
            statusText.style.color = 'var(--text-muted)';
        } else {
            statusText.innerHTML = `<strong>${count}</strong> dari ${state.totalPages} halaman akan dihapus.`;
            statusText.style.color = 'var(--danger)';
        }
    }
    
    if (actionBtn) {
        actionBtn.disabled = (count === 0);
    }
}

async function executeRemovePages() {
    const count = state.pagesToDelete.size;
    if (count === 0) {
        showToast('Pilih minimal 1 halaman untuk dihapus!', 'error');
        return;
    }
    
    const actionBtn = document.getElementById('executeRemovePagesBtn');
    if (actionBtn) {
        actionBtn.disabled = true;
        actionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghapus Halaman...';
    }
    
    try {
        const { PDFDocument } = PDFLib;
        const srcDoc = await PDFDocument.load(state.rawBuffer.slice(0), { ignoreEncryption: true });
        const newDoc = await PDFDocument.create();
        
        const keepIndices = [];
        for (let i = 0; i < state.totalPages; i++) {
            if (!state.pagesToDelete.has(i + 1)) {
                keepIndices.push(i);
            }
        }
        
        const copiedPages = await newDoc.copyPages(srcDoc, keepIndices);
        copiedPages.forEach(page => newDoc.addPage(page));
        
        const newBytes = await newDoc.save();
        const blob = new Blob([newBytes], { type: 'application/pdf' });
        
        const baseName = state.docName.replace(/\.[^/.]+$/, "");
        await saveFileWithPicker(
            blob, 
            `${baseName}_Bersih_${keepIndices.length}_Halaman.pdf`, 
            'Dokumen PDF (*.pdf)', 
            { 'application/pdf': ['.pdf'] }
        );
        
        showToast(`Berhasil menghapus ${count} halaman dan menyisakan ${keepIndices.length} halaman bersih!`, 'success');
    } catch (err) {
        if (err.message === 'Dibatalkan oleh pengguna' || err.name === 'AbortError') {
            showToast('Proses penyimpanan dibatalkan.', 'info');
        } else {
            console.error('Remove pages error:', err);
            showToast('Gagal memproses dokumen PDF.', 'error');
        }
    } finally {
        if (actionBtn) {
            actionBtn.disabled = false;
            actionBtn.innerHTML = '<i class="fa-solid fa-file-export"></i> Simpan PDF Bersih';
        }
    }
}
