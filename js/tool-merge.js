/**
 * PDF Editor Pro - Tool 2: Merge PDF Module
 * Supports uploading multiple PDF files, reordering/removing them, and combining them into a single PDF document.
 */

async function handleMergeFilesSelect(files) {
    if (!files || !files.length) return;
    
    showToast('Memuat file PDF untuk digabung...', 'info');
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            showToast(`File "${file.name}" bukan PDF, dilewatkan.`, 'error');
            continue;
        }
        
        try {
            const buffer = await file.arrayBuffer();
            const { PDFDocument } = PDFLib;
            const doc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
            const pageCount = doc.getPageCount();
            
            state.mergeFiles.push({
                id: 'merge_' + Date.now() + '_' + i,
                name: file.name,
                size: formatBytes(file.size),
                buffer: buffer.slice(0),
                pagesCount: pageCount
            });
        } catch (e) {
            console.error('Error reading PDF for merge:', e);
            showToast(`Gagal membaca file "${file.name}".`, 'error');
        }
    }
    
    renderMergeList();
}

function renderMergeList() {
    const listEl = document.getElementById('mergeList');
    const actionBtn = document.getElementById('executeMergeBtn');
    const emptyEl = document.getElementById('mergeEmptyState');
    
    if (!listEl) return;
    
    if (state.mergeFiles.length === 0) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.classList.remove('hidden');
        if (actionBtn) actionBtn.disabled = true;
        return;
    }
    
    if (emptyEl) emptyEl.classList.add('hidden');
    if (actionBtn) actionBtn.disabled = (state.mergeFiles.length < 2);
    
    listEl.innerHTML = '';
    state.mergeFiles.forEach((fileItem, idx) => {
        const itemEl = document.createElement('div');
        itemEl.className = 'merge-item';
        itemEl.innerHTML = `
            <div class="merge-item-info">
                <div class="merge-item-icon"><i class="fa-solid fa-file-pdf"></i></div>
                <div class="merge-item-details">
                    <h4>${idx + 1}. ${fileItem.name}</h4>
                    <span>${fileItem.pagesCount} Halaman • ${fileItem.size}</span>
                </div>
            </div>
            <div class="merge-item-actions">
                <button class="btn btn-icon btn-sm move-up-btn" title="Geser ke Atas" ${idx === 0 ? 'disabled' : ''}>
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
                <button class="btn btn-icon btn-sm move-down-btn" title="Geser ke Bawah" ${idx === state.mergeFiles.length - 1 ? 'disabled' : ''}>
                    <i class="fa-solid fa-arrow-down"></i>
                </button>
                <button class="btn btn-icon btn-sm delete-merge-btn style="color:var(--danger);" title="Hapus">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        
        const upBtn = itemEl.querySelector('.move-up-btn');
        upBtn.addEventListener('click', () => {
            if (idx > 0) {
                const temp = state.mergeFiles[idx - 1];
                state.mergeFiles[idx - 1] = state.mergeFiles[idx];
                state.mergeFiles[idx] = temp;
                renderMergeList();
            }
        });
        
        const downBtn = itemEl.querySelector('.move-down-btn');
        downBtn.addEventListener('click', () => {
            if (idx < state.mergeFiles.length - 1) {
                const temp = state.mergeFiles[idx + 1];
                state.mergeFiles[idx + 1] = state.mergeFiles[idx];
                state.mergeFiles[idx] = temp;
                renderMergeList();
            }
        });
        
        const delBtn = itemEl.querySelector('.delete-merge-btn');
        delBtn.addEventListener('click', () => {
            state.mergeFiles = state.mergeFiles.filter(f => f.id !== fileItem.id);
            renderMergeList();
            showToast('File dihapus dari daftar gabungan.', 'info');
        });
        
        listEl.appendChild(itemEl);
    });
}

async function executeMergePdfs() {
    if (state.mergeFiles.length < 2) {
        showToast('Minimal harus ada 2 file PDF untuk digabungkan!', 'error');
        return;
    }
    
    const actionBtn = document.getElementById('executeMergeBtn');
    if (actionBtn) {
        actionBtn.disabled = true;
        actionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menggabungkan...';
    }
    
    try {
        const { PDFDocument } = PDFLib;
        const mergedDoc = await PDFDocument.create();
        
        let totalCombinedPages = 0;
        for (const fileItem of state.mergeFiles) {
            const srcDoc = await PDFDocument.load(fileItem.buffer.slice(0), { ignoreEncryption: true });
            const copiedPages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
            copiedPages.forEach(page => mergedDoc.addPage(page));
            totalCombinedPages += copiedPages.length;
        }
        
        const mergedBytes = await mergedDoc.save();
        const blob = new Blob([mergedBytes], { type: 'application/pdf' });
        
        await saveFileWithPicker(
            blob, 
            `Dokumen_Digabung_${state.mergeFiles.length}_File.pdf`, 
            'Dokumen PDF (*.pdf)', 
            { 'application/pdf': ['.pdf'] }
        );
        
        showToast(`Berhasil menggabungkan ${state.mergeFiles.length} file (${totalCombinedPages} halaman)!`, 'success');
    } catch (err) {
        if (err.message === 'Dibatalkan oleh pengguna' || err.name === 'AbortError') {
            showToast('Proses penyimpanan dibatalkan.', 'info');
        } else {
            console.error('Merge error:', err);
            showToast('Gagal menggabungkan dokumen PDF.', 'error');
        }
    } finally {
        if (actionBtn) {
            actionBtn.disabled = false;
            actionBtn.innerHTML = '<i class="fa-solid fa-object-group"></i> Gabungkan & Simpan PDF';
        }
    }
}
