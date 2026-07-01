/**
 * PDF Editor Pro - Config & Global State Module
 * Stores global application state, active tool view, and DOM references.
 */

const state = {
    currentView: 'dashboard', // 'dashboard' or specific tool name: 'editor', 'merge', 'pages', 'compress', 'converter'
    activeTool: null,
    
    // Core Document State (used across tools)
    docType: null, // 'pdf' or 'image'
    docName: '',
    rawBuffer: null,
    pdfDoc: null,
    totalPages: 0,
    currentPage: 1,
    scale: 1.2,
    rotation: 0, // 0, 90, 180, 270
    imageElement: null,
    
    // Interactive Editor State
    savedSignatures: [],
    placedSignatures: [], // { id, sigId, dataUrl, page, normX, normY, normW, normH }
    placedTexts: [],      // { id, text, color, fontSize, page, normX, normY, normW, normH }
    placedStamps: [],     // { id, stampText, color, page, normX, normY, normW, normH }
    selectedOverlayId: null,
    selectedOverlayType: null, // 'sig', 'text', 'stamp'
    
    // Merge Tool State
    mergeFiles: [], // Array of { id, name, size, buffer, pagesCount }
    
    // Remove Pages Tool State
    pagesToDelete: new Set(), // Set of page indices (1-indexed) to delete
    
    // Compress Tool State
    compressLevel: 'medium', // 'light', 'medium', 'extreme'
    
    // Converter Tool State
    converterMode: 'pdf-to-img', // 'pdf-to-img', 'img-to-pdf', 'pdf-to-word'
    convertImages: [], // Array of image files for img-to-pdf mode
    
    // Canvas Drawing State
    isDrawing: false,
    penColor: '#000000',
    penWidth: 3,
    canvasWidth: 0,
    canvasHeight: 0
};

// Global DOM Elements Registry (populated on DOMContentLoaded)
const elements = {};

function initDomElements() {
    // Views
    elements.dashboardView = document.getElementById('dashboardView');
    elements.workspaceView = document.getElementById('workspaceView');
    elements.backToDashboardBtn = document.getElementById('backToDashboardBtn');
    elements.workspaceTitle = document.getElementById('workspaceTitle');
    
    // Tool Workspaces
    elements.toolWorkspaces = document.querySelectorAll('.tool-workspace');
    elements.editorWorkspace = document.getElementById('editorWorkspace');
    elements.mergeWorkspace = document.getElementById('mergeWorkspace');
    elements.pagesWorkspace = document.getElementById('pagesWorkspace');
    elements.compressWorkspace = document.getElementById('compressWorkspace');
    elements.converterWorkspace = document.getElementById('converterWorkspace');
    
    // Sidebar & Common Upload
    elements.dropZone = document.getElementById('dropZone');
    elements.fileInput = document.getElementById('fileInput');
    elements.docInfoCard = document.getElementById('docInfoCard');
    elements.docTypeIcon = document.getElementById('docTypeIcon');
    elements.docName = document.getElementById('docName');
    elements.docMeta = document.getElementById('docMeta');
    elements.closeDocBtn = document.getElementById('closeDocBtn');
    
    // Editor Toolbar & Canvas
    elements.pageControls = document.getElementById('pageControls');
    elements.prevPageBtn = document.getElementById('prevPageBtn');
    elements.nextPageBtn = document.getElementById('nextPageBtn');
    elements.pageNumberInput = document.getElementById('pageNumberInput');
    elements.totalPagesCount = document.getElementById('totalPagesCount');
    elements.zoomControls = document.getElementById('zoomControls');
    elements.zoomInBtn = document.getElementById('zoomInBtn');
    elements.zoomOutBtn = document.getElementById('zoomOutBtn');
    elements.zoomResetBtn = document.getElementById('zoomResetBtn');
    elements.zoomLevelText = document.getElementById('zoomLevelText');
    elements.rotatePageBtn = document.getElementById('rotatePageBtn');
    elements.deletePageBtn = document.getElementById('deletePageBtn');
    elements.viewerStatusText = document.getElementById('viewerStatusText');
    elements.viewerEmptyState = document.getElementById('viewerEmptyState');
    elements.canvasWrapper = document.getElementById('canvasWrapper');
    elements.docCanvas = document.getElementById('docCanvas');
    elements.overlaysLayer = document.getElementById('overlaysLayer');
    
    // Buttons & Modals
    elements.exportBtn = document.getElementById('exportBtn');
    elements.themeToggleBtn = document.getElementById('themeToggleBtn');
    elements.helpBtn = document.getElementById('helpBtn');
    elements.toastContainer = document.getElementById('toastContainer');
}
