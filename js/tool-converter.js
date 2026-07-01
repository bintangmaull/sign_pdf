/**
 * PDF Editor Pro - Tools 5, 6, 7: Converter Module
 * Supports PDF to JPG/PNG (with ZIP packaging for multi-page), Images to PDF, and PDF to Word (.doc).
 */

function setConverterMode(mode) {
    state.converterMode = mode;
    
    const tabs = document.querySelectorAll('.converter-tab-btn');
    tabs.forEach(t => {
        if (t.getAttribute('data-mode') === mode) t.classList.add('active');
        else t.classList.remove('active');
    });
    
    const descEl = document.getElementById('converterModeDesc');
    const inputEl = document.getElementById('converterFileInput');
    const emptyEl = document.getElementById('converterEmptyState');
    const listEl = document.getElementById('converterFilesList');
    const actionBtn = document.getElementById('executeConvertBtn');
    
    if (listEl) listEl.innerHTML = '';
    if (emptyEl) emptyEl.classList.remove('hidden');
    if (actionBtn) {
        actionBtn.disabled = true;
        actionBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Mulai Konversi & Simpan';
    }
    
    state.convertImages = [];
    state.rawBuffer = null;
    
    if (mode === 'pdf-to-img') {
        if (descEl) descEl.textContent = 'Ekstrak seluruh halaman dokumen PDF menjadi file gambar berkualitas tinggi (PNG / JPG). Jika lebih dari 1 halaman, akan dikemas dalam file ZIP.';
        if (inputEl) { inputEl.accept = '.pdf,application/pdf'; inputEl.multiple = false; }
    } else if (mode === 'img-to-pdf') {
        if (descEl) descEl.textContent = 'Ubah foto atau gambar (JPG, PNG, WebP) menjadi 1 dokumen PDF profesional. Mendukung penggabungan banyak foto sekaligus.';
        if (inputEl) { inputEl.accept = 'image/*,.png,.jpg,.jpeg,.webp'; inputEl.multiple = true; }
    } else if (mode === 'pdf-to-word') {
        if (descEl) descEl.textContent = 'Ekstrak teks dan struktur dari dokumen PDF menjadi dokumen Microsoft Word (.doc) yang dapat dibuka dan diedit di Office Word.';
        if (inputEl) { inputEl.accept = '.pdf,application/pdf'; inputEl.multiple = false; }
    }
}

async function handleConverterFileSelect(files) {
    if (!files || !files.length) return;
    
    const listEl = document.getElementById('converterFilesList');
    const emptyEl = document.getElementById('converterEmptyState');
    const actionBtn = document.getElementById('executeConvertBtn');
    
    if (state.converterMode === 'pdf-to-img' || state.converterMode === 'pdf-to-word') {
        const file = files[0];
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            showToast('Harap pilih file berformat PDF!', 'error');
            return;
        }
        state.docName = file.name;
        const buffer = await file.arrayBuffer();
        state.rawBuffer = buffer.slice(0);
        
        if (emptyEl) emptyEl.classList.add('hidden');
        if (listEl) {
            listEl.innerHTML = `
                <div class="doc-info-card" style="margin-top: 1rem;">
                    <div class="doc-icon"><i class="fa-solid fa-file-pdf"></i></div>
                    <div class="doc-details">
                        <h3>${file.name}</h3>
                        <span>${formatBytes(file.size)} • Siap dikonversi</span>
                    </div>
                </div>
            `;
        }
        if (actionBtn) actionBtn.disabled = false;
    } else if (state.converterMode === 'img-to-pdf') {
        for (let i = 0; i < files.length; i++) {
            const f = files[i];
            if (!f.type.startsWith('image/') && !/\.(png|jpg|jpeg|webp)$/i.test(f.name)) {
                showToast(`File "${f.name}" bukan gambar, dilewatkan.`, 'error');
                continue;
            }
            state.convertImages.push(f);
        }
        
        if (state.convertImages.length > 0) {
            if (emptyEl) emptyEl.classList.add('hidden');
            renderConvertImagesList();
            if (actionBtn) actionBtn.disabled = false;
        }
    }
}

function renderConvertImagesList() {
    const listEl = document.getElementById('converterFilesList');
    if (!listEl) return;
    
    listEl.innerHTML = '<div style="font-weight: 600; font-size: 0.9rem; margin: 1rem 0 0.5rem; color: var(--text-muted);">Daftar Gambar (${state.convertImages.length} foto):</div>';
    
    const grid = document.createElement('div');
    grid.style.cssText = 'display: flex; flex-direction: column; gap: 0.5rem; max-height: 300px; overflow-y: auto;';
    
    state.convertImages.forEach((imgFile, idx) => {
        const row = document.createElement('div');
        row.className = 'doc-info-card';
        row.innerHTML = `
            <div class="doc-icon" style="background: rgba(99,102,241,0.15); color: var(--primary);"><i class="fa-solid fa-image"></i></div>
            <div class="doc-details">
                <h3>${idx + 1}. ${imgFile.name}</h3>
                <span>${formatBytes(imgFile.size)}</span>
            </div>
            <button class="btn-remove-doc" title="Hapus"><i class="fa-solid fa-xmark"></i></button>
        `;
        
        const delBtn = row.querySelector('.btn-remove-doc');
        delBtn.addEventListener('click', () => {
            state.convertImages = state.convertImages.filter((_, i) => i !== idx);
            if (state.convertImages.length === 0) {
                const emptyEl = document.getElementById('converterEmptyState');
                if (emptyEl) emptyEl.classList.remove('hidden');
                listEl.innerHTML = '';
                const actionBtn = document.getElementById('executeConvertBtn');
                if (actionBtn) actionBtn.disabled = true;
            } else {
                renderConvertImagesList();
            }
        });
        
        grid.appendChild(row);
    });
    
    listEl.appendChild(grid);
}

async function executeConversion() {
    const actionBtn = document.getElementById('executeConvertBtn');
    if (actionBtn) {
        actionBtn.disabled = true;
        actionBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses Konversi...';
    }
    
    try {
        if (state.converterMode === 'pdf-to-img') {
            await convertPdfToImages();
        } else if (state.converterMode === 'img-to-pdf') {
            await convertImagesToPdf();
        } else if (state.converterMode === 'pdf-to-word') {
            await convertPdfToWord();
        }
    } catch (err) {
        if (err.message === 'Dibatalkan oleh pengguna' || err.name === 'AbortError') {
            showToast('Proses penyimpanan dibatalkan.', 'info');
        } else {
            console.error('Conversion error:', err);
            showToast('Gagal memproses konversi dokumen.', 'error');
        }
    } finally {
        if (actionBtn) {
            actionBtn.disabled = false;
            actionBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Mulai Konversi & Simpan';
        }
    }
}

async function convertPdfToImages() {
    if (!state.rawBuffer) return;
    showToast('Mengekstrak halaman PDF menjadi gambar...', 'info');
    
    const loadingTask = pdfjsLib.getDocument({ data: state.rawBuffer.slice(0) });
    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;
    const baseName = state.docName.replace(/\.[^/.]+$/, "");
    
    if (totalPages === 1) {
        const page = await pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: viewport }).promise;
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
        await saveFileWithPicker(blob, `${baseName}_Halaman_1.png`, 'Gambar PNG (*.png)', { 'image/png': ['.png'] });
        showToast('Berhasil mengonversi halaman PDF ke Gambar!', 'success');
    } else {
        // Multi-page: check if JSZip is available
        if (typeof JSZip !== 'undefined') {
            showToast(`Mengemas ${totalPages} gambar halaman ke dalam file ZIP...`, 'info');
            const zip = new JSZip();
            const folder = zip.folder(baseName);
            
            for (let i = 1; i <= totalPages; i++) {
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
                folder.file(`Halaman_${i}.png`, blob);
            }
            
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            await saveFileWithPicker(zipBlob, `${baseName}_${totalPages}_Gambar.zip`, 'Arsip ZIP (*.zip)', { 'application/zip': ['.zip'] });
            showToast(`Berhasil mengonversi dan mengemas ${totalPages} halaman ke dalam ZIP!`, 'success');
        } else {
            // Fallback sequential download if JSZip is missing
            showToast(`Mengunduh ${totalPages} gambar halaman secara berurutan...`, 'info');
            for (let i = 1; i <= totalPages; i++) {
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: 2.0 });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d');
                await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
                triggerDownload(blob, `${baseName}_Halaman_${i}.png`);
                await new Promise(r => setTimeout(r, 600));
            }
            showToast(`Berhasil mengonversi ${totalPages} halaman PDF ke gambar!`, 'success');
        }
    }
}

async function convertImagesToPdf() {
    if (!state.convertImages.length) return;
    showToast('Mengonversi foto menjadi dokumen PDF...', 'info');
    
    const { PDFDocument } = PDFLib;
    const pdfDoc = await PDFDocument.create();
    
    for (const file of state.convertImages) {
        const buffer = await file.arrayBuffer();
        const blob = new Blob([buffer], { type: file.type });
        const dataUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.readAsDataURL(blob);
        });
        
        const imgElement = await getEmbeddableImage(pdfDoc, dataUrl);
        const imgW = imgElement.width;
        const imgH = imgElement.height;
        
        // Fit within standard A4 or use original image dimensions
        const page = pdfDoc.addPage([imgW, imgH]);
        page.drawImage(imgElement, { x: 0, y: 0, width: imgW, height: imgH });
    }
    
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    await saveFileWithPicker(
        blob, 
        `Album_Foto_${state.convertImages.length}_Gambar.pdf`, 
        'Dokumen PDF (*.pdf)', 
        { 'application/pdf': ['.pdf'] }
    );
    showToast(`Berhasil menyatukan ${state.convertImages.length} gambar menjadi PDF!`, 'success');
}

async function convertPdfToWord() {
    if (!state.rawBuffer) return;
    showToast('Mengekstrak teks dan membuat dokumen Word...', 'info');
    
    const loadingTask = pdfjsLib.getDocument({ data: state.rawBuffer.slice(0) });
    const pdfDoc = await loadingTask.promise;
    const totalPages = pdfDoc.numPages;
    const baseName = state.docName.replace(/\.[^/.]+$/, "");
    
    let htmlContent = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="utf-8"><title>${baseName}</title>
        <style>
            body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #000000; padding: 2cm; }
            p { margin-bottom: 12pt; text-align: justify; }
            .page-break { page-break-before: always; }
        </style>
        </head><body>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i > 1) htmlContent += '<div class="page-break"></div>';
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        
        let pageText = '';
        let lastY = null;
        
        textContent.items.forEach(item => {
            const str = item.str;
            const currentY = item.transform[5];
            
            if (lastY !== null && Math.abs(currentY - lastY) > 15) {
                pageText += '</p><p>';
            } else if (pageText.length > 0 && !pageText.endsWith(' ')) {
                pageText += ' ';
            }
            pageText += str;
            lastY = currentY;
        });
        
        htmlContent += `<p>${pageText}</p>`;
    }
    
    htmlContent += '</body></html>';
    
    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    await saveFileWithPicker(
        blob, 
        `${baseName}_Diekstrak.doc`, 
        'Dokumen Microsoft Word (*.doc)', 
        { 'application/msword': ['.doc'] }
    );
    showToast('Berhasil mengonversi PDF ke dokumen Word (.doc)!', 'success');
}
