/**
 * PDF Editor Pro - Tool 4: Compress PDF Module
 * Reduces PDF file size by re-encoding PDF pages as optimized JPEG streams inside a clean vector structure.
 */

async function handleCompressFileSelect(file) {
    if (!file) return;
    
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        showToast('Harap pilih file berformat PDF!', 'error');
        return;
    }
    
    state.docName = file.name;
    try {
        const buffer = await file.arrayBuffer();
        state.rawBuffer = buffer.slice(0);
        
        const infoEl = document.getElementById('compressDocInfo');
        if (infoEl) {
            infoEl.innerHTML = `<strong>${file.name}</strong> • Ukuran Awal: <strong>${formatBytes(file.size)}</strong>`;
            infoEl.classList.remove('hidden');
        }
        
        const emptyEl = document.getElementById('compressEmptyState');
        if (emptyEl) emptyEl.classList.add('hidden');
        
        const optionsEl = document.getElementById('compressOptionsArea');
        if (optionsEl) optionsEl.classList.remove('hidden');
        
        setupCompressOptions();
    } catch (e) {
        console.error('Error loading PDF for compress:', e);
        showToast('Gagal membaca file PDF.', 'error');
    }
}

function setupCompressOptions() {
    const cards = document.querySelectorAll('.compress-option-card');
    const actionBtn = document.getElementById('executeCompressBtn');
    
    cards.forEach(card => {
        card.addEventListener('click', () => {
            cards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            state.compressLevel = card.getAttribute('data-level');
            if (actionBtn) actionBtn.disabled = false;
        });
    });
    
    if (actionBtn) {
        actionBtn.disabled = false;
        actionBtn.onclick = executeCompressPdf;
    }
}

async function executeCompressPdf() {
    if (!state.rawBuffer) {
        showToast('Harap pilih file PDF terlebih dahulu!', 'error');
        return;
    }
    
    const actionBtn = document.getElementById('executeCompressBtn');
    if (actionBtn) {
        actionBtn.disabled = true;
        actionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memampatkan Dokumen...';
    }
    
    showToast('Sedang memproses kompresi dokumen PDF...', 'info');
    
    try {
        const originalSize = state.rawBuffer.byteLength;
        
        // Configuration based on level
        let scale = 1.2;
        let quality = 0.70;
        
        if (state.compressLevel === 'light') {
            scale = 1.5;
            quality = 0.85;
        } else if (state.compressLevel === 'extreme') {
            scale = 1.0;
            quality = 0.50;
        }
        
        const loadingTask = pdfjsLib.getDocument({ data: state.rawBuffer.slice(0) });
        const srcDoc = await loadingTask.promise;
        const totalPages = srcDoc.numPages;
        
        const { PDFDocument } = PDFLib;
        const newDoc = await PDFDocument.create();
        
        for (let i = 1; i <= totalPages; i++) {
            if (actionBtn) actionBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Kompresi Halaman ${i}/${totalPages}...`;
            
            const page = await srcDoc.getPage(i);
            const origViewport = page.getViewport({ scale: 1.0 });
            const renderViewport = page.getViewport({ scale: scale });
            
            const canvas = document.createElement('canvas');
            canvas.width = renderViewport.width;
            canvas.height = renderViewport.height;
            const ctx = canvas.getContext('2d');
            
            await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
            
            const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
            const jpegBytes = dataUrlToUint8Array(jpegDataUrl);
            
            const embeddedImg = await newDoc.embedJpg(jpegBytes);
            const newPage = newDoc.addPage([origViewport.width, origViewport.height]);
            newPage.drawImage(embeddedImg, {
                x: 0,
                y: 0,
                width: origViewport.width,
                height: origViewport.height
            });
        }
        
        const compressedBytes = await newDoc.save();
        const compressedSize = compressedBytes.byteLength;
        const savedPercent = Math.round((1 - (compressedSize / originalSize)) * 100);
        
        const blob = new Blob([compressedBytes], { type: 'application/pdf' });
        const baseName = state.docName.replace(/\.[^/.]+$/, "");
        
        await saveFileWithPicker(
            blob, 
            `${baseName}_Kompresi_${state.compressLevel.toUpperCase()}.pdf`, 
            'Dokumen PDF (*.pdf)', 
            { 'application/pdf': ['.pdf'] }
        );
        
        if (savedPercent > 0) {
            showToast(`Kompresi berhasil! Ukuran hemat ${savedPercent}% (${formatBytes(originalSize)} ➔ ${formatBytes(compressedSize)})`, 'success');
        } else {
            showToast(`Kompresi selesai (${formatBytes(compressedSize)}). Dokumen sudah sangat optimal sejak awal!`, 'success');
        }
    } catch (err) {
        if (err.message === 'Dibatalkan oleh pengguna' || err.name === 'AbortError') {
            showToast('Proses penyimpanan dibatalkan.', 'info');
        } else {
            console.error('Compress error:', err);
            showToast('Gagal memproses kompresi dokumen PDF.', 'error');
        }
    } finally {
        if (actionBtn) {
            actionBtn.disabled = false;
            actionBtn.innerHTML = '<i class="fa-solid fa-compress"></i> Kompres & Simpan PDF Sekarang';
        }
    }
}
