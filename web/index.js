/**
 * VEO Batch Processing System - Native App JavaScript Bridge
 * Integrates the web interface with Python backend via Eel
 */

// --- Type-like object for job structure ---
class Job {
    constructor(id, prompt, imageBytes, model, config) {
        this.id = id;
        this.prompt = prompt;
        this.imageBytes = imageBytes;
        this.model = model;
        this.config = config;
        this.status = 'queued'; // 'queued' | 'generating' | 'completed' | 'failed'
        this.resultUrl = null;
        this.error = null;
    }
}

// --- DOM Element Selection ---
const promptEl = document.querySelector('#prompt-input');
const fileInput = document.querySelector('#file-input');
const fileNameEl = document.querySelector('#file-name');
const imgPreview = document.querySelector('#img-preview');
const seedInput = document.querySelector('#seed-input');
const randomSeedBtn = document.querySelector('#random-seed-btn');
const aspectRatioSelect = document.querySelector('#aspect-ratio-select');
const modelSelect = document.querySelector('#model-select');
const batchSizeInput = document.querySelector('#batch-size-input');
const addToQueueBtn = document.querySelector('#add-to-queue-button');
const startQueueBtn = document.querySelector('#start-queue-button');
const clearQueueBtn = document.querySelector('#clear-queue-button');
const queueListEl = document.querySelector('#queue-list');
const queueStatsEl = document.querySelector('#queue-stats');
const errorMessageEl = document.querySelector('#error-message');

// Config View Elements
const navGenerationBtn = document.querySelector('#nav-generation-btn');
const navConfigBtn = document.querySelector('#nav-config-btn');
const generationView = document.querySelector('#generation-view');
const configView = document.querySelector('#config-view');
const apiKeyInput = document.querySelector('#api-key-input');
const saveApiKeyBtn = document.querySelector('#save-api-key-btn');
const apiKeyStatusEl = document.querySelector('#api-key-status');

// Native App Elements
const selectFolderBtn = document.querySelector('#select-folder-btn');
const openFolderBtn = document.querySelector('#open-folder-btn');
const currentFolderPathEl = document.querySelector('#current-folder-path');

// Naming Convention Elements
const namingPrefixInput = document.querySelector('#naming-prefix-input');
const namingStartNumberInput = document.querySelector('#naming-start-number-input');
const namingPositionSelect = document.querySelector('#naming-position-select');
const namingPreviewEl = document.querySelector('#naming-preview');

// --- State Variables ---
let base64data = '';
let queue = [];
let isProcessing = false;
let apiKey = null;
let namingPrefix = 'video_';
let namingStartNumber = 1;
let namingPosition = 'after';

// --- Utility Functions ---
function blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
            const url = reader.result;
            resolve(url.split(',')[1]);
        };
        reader.readAsDataURL(blob);
    });
}

async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// --- State Management (localStorage) ---
function saveQueue() {
    localStorage.setItem('videoGenerationQueue', JSON.stringify(queue));
}

function loadQueue() {
    const savedQueue = localStorage.getItem('videoGenerationQueue');
    if (savedQueue) {
        queue = JSON.parse(savedQueue);
        renderQueue();
    }
}

function saveApiKey(key) {
    localStorage.setItem('geminiApiKey', key);
    apiKey = key;
    updateApiKeyStatus();
}

function loadApiKey() {
    const savedKey = localStorage.getItem('geminiApiKey');
    if (savedKey) {
        apiKey = savedKey;
        apiKeyInput.value = '••••••••••••••••••••' + savedKey.slice(-4);
    }
    updateApiKeyStatus();
}

function saveNamingSettings() {
    const settings = {
        prefix: namingPrefix,
        startNumber: namingStartNumber,
        position: namingPosition,
    };
    localStorage.setItem('namingSettings', JSON.stringify(settings));
}

function loadNamingSettings() {
    const savedSettings = localStorage.getItem('namingSettings');
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        namingPrefix = settings.prefix || 'video_';
        namingStartNumber = settings.startNumber || 1;
        namingPosition = settings.position || 'after';

        namingPrefixInput.value = namingPrefix;
        namingStartNumberInput.value = String(namingStartNumber);
        namingPositionSelect.value = namingPosition;
    }
    updateNamingPreview();
}

// --- Native App Integration ---
async function initializeNativeFeatures() {
    try {
        // Load current output folder
        const currentFolder = await eel.get_output_folder()();
        currentFolderPathEl.textContent = currentFolder;
        
        // Get app info
        const appInfo = await eel.get_app_info()();
        console.log('Native app initialized:', appInfo);
    } catch (error) {
        console.error('Failed to initialize native features:', error);
        currentFolderPathEl.textContent = 'Error loading folder info';
    }
}

// --- UI Rendering ---
function generateFilename(jobId) {
    const completedJobs = queue.filter(j => j.status === 'completed');
    const jobIndex = completedJobs.findIndex(j => j.id === jobId);

    if (jobIndex === -1) {
        return `${jobId}.mp4`; // Fallback
    }
    
    const number = namingStartNumber + jobIndex;
    const paddedNumber = String(number).padStart(3, '0');

    if (namingPosition === 'after') {
        return `${namingPrefix}${paddedNumber}.mp4`;
    } else {
        return `${paddedNumber}${namingPrefix}.mp4`;
    }
}

function renderQueue() {
    queueListEl.innerHTML = '';
    if (queue.length === 0) {
        queueListEl.innerHTML = `
            <div class="text-center py-12 space-y-4">
                <div class="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                    <svg class="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z"></path>
                    </svg>
                </div>
                <p class="text-text-secondary font-medium">Queue is empty</p>
                <p class="text-text-tertiary text-sm">Add a job to get started with video generation</p>
            </div>`;
    }
    
    queue.forEach((job, index) => {
        const card = document.createElement('div');
        card.className = 'queue-card';
        card.dataset.jobId = job.id;

        // Professional status indicator
        let statusIndicator = '';
        switch(job.status) {
            case 'queued':
                statusIndicator = `
                    <div class="status-badge status-queued">
                        <div class="w-2 h-2 rounded-full bg-current opacity-75"></div>
                        Queued
                    </div>`;
                break;
            case 'generating':
                statusIndicator = `
                    <div class="status-badge status-generating">
                        <div class="spinner"></div>
                        Generating
                    </div>`;
                break;
            case 'completed':
                statusIndicator = `
                    <div class="status-badge status-completed">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                        </svg>
                        Completed
                    </div>`;
                break;
            case 'failed':
                statusIndicator = `
                    <div class="status-badge status-failed">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                        Failed
                    </div>`;
                break;
        }

        // Create professional card layout
        const cardContent = `
            <div class="space-y-4">
                <!-- Header with status -->
                <div class="flex items-start justify-between gap-4">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-xs font-mono text-text-tertiary">#${(index + 1).toString().padStart(3, '0')}</span>
                            <span class="text-xs text-text-tertiary">•</span>
                            <span class="text-xs text-text-tertiary">${job.model.replace('veo-', 'VEO ').replace('-generate-001', '').replace('-fast-generate-001', ' Fast')}</span>
                        </div>
                        <p class="prompt-text text-sm font-medium text-text-primary leading-relaxed" title="${job.prompt}">${job.prompt}</p>
                    </div>
                    ${statusIndicator}
                </div>
                
                <!-- Video preview for completed jobs -->
                ${job.status === 'completed' && job.resultUrl ? `
                    <div class="bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-xl p-4 border border-white/5">
                        <div class="flex items-start gap-4">
                            <div class="relative group">
                                <video 
                                    src="${job.resultUrl}" 
                                    class="w-32 h-20 object-cover rounded-lg border border-white/10 shadow-lg transition-transform group-hover:scale-[1.02]" 
                                    controls 
                                    loop
                                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 160'%3E%3Crect width='256' height='160' fill='%23374151'/%3E%3C/svg%3E"
                                ></video>
                                <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg pointer-events-none"></div>
                            </div>
                            <div class="flex-1 space-y-3">
                                <div class="grid grid-cols-2 gap-3 text-xs">
                                    <div>
                                        <span class="text-text-tertiary block">Aspect Ratio</span>
                                        <span class="text-text-secondary font-mono">${job.config.aspectRatio}</span>
                                    </div>
                                    <div>
                                        <span class="text-text-tertiary block">Seed</span>
                                        <span class="text-text-secondary font-mono">${job.config.seed || 'Random'}</span>
                                    </div>
                                </div>
                                <button 
                                    class="download-btn w-full text-xs font-medium py-2 px-4 rounded-lg transition-all" 
                                    data-url="${job.downloadUrl || job.resultUrl}" 
                                    data-filename="${generateFilename(job.id)}"
                                    data-job-id="${job.id}"
                                >
                                    <svg class="w-3 h-3 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                    </svg>
                                    Download to Custom Folder
                                </button>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <!-- Error display for failed jobs -->
                ${job.status === 'failed' ? `
                    <div class="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                        <div class="flex items-start gap-2">
                            <svg class="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                            </svg>
                            <div class="flex-1">
                                <p class="text-red-400 text-xs font-medium mb-1">Generation Failed</p>
                                <p class="text-red-300/80 text-xs leading-relaxed" title="${job.error}">${job.error}</p>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <!-- Progress indicator for generating jobs -->
                ${job.status === 'generating' ? `
                    <div class="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <div class="spinner"></div>
                            </div>
                            <div class="flex-1">
                                <p class="text-blue-400 text-xs font-medium mb-1">Processing Video</p>
                                <p class="text-blue-300/80 text-xs">This usually takes 1-3 minutes...</p>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        card.innerHTML = cardContent;
        queueListEl.appendChild(card);
    });
    
    // Re-attach download event listeners
    document.querySelectorAll('.download-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const target = e.currentTarget;
            const url = target.dataset.url;
            const filename = target.dataset.filename;
            
            // Show loading state
            const originalText = target.innerHTML;
            target.innerHTML = '<div class="spinner inline-block mr-1.5"></div>Downloading...';
            target.disabled = true;
            
            try {
                // Use native download with custom path
                const result = await eel.download_video_to_custom_path(url, filename)();
                
                if (result.success) {
                    // Show success notification
                    await eel.show_native_notification('Download Complete', `Video saved to: ${result.path}`)();
                    
                    // Update button text briefly
                    target.innerHTML = '✅ Downloaded!';
                    setTimeout(() => {
                        target.innerHTML = originalText;
                        target.disabled = false;
                    }, 2000);
                } else {
                    throw new Error(result.error || 'Download failed');
                }
            } catch (error) {
                console.error('Download error:', error);
                showError(`Download failed: ${error.message}`);
                target.innerHTML = originalText;
                target.disabled = false;
            }
        });
    });

    updateQueueControls();
    updateQueueStats();
}

function updateQueueStats() {
    const queuedCount = queue.filter(j => j.status === 'queued').length;
    const generatingCount = queue.filter(j => j.status === 'generating').length;
    const completedCount = queue.filter(j => j.status === 'completed').length;
    const failedCount = queue.filter(j => j.status === 'failed').length;
    
    if (queue.length === 0) {
        queueStatsEl.innerHTML = '';
        return;
    }
    
    const statsHtml = `
        ${queuedCount > 0 ? `<span class="text-text-tertiary"><span class="text-yellow-400">${queuedCount}</span> queued</span>` : ''}
        ${generatingCount > 0 ? `<span class="text-text-tertiary"><span class="text-blue-400">${generatingCount}</span> generating</span>` : ''}
        ${completedCount > 0 ? `<span class="text-text-tertiary"><span class="text-green-400">${completedCount}</span> completed</span>` : ''}
        ${failedCount > 0 ? `<span class="text-text-tertiary"><span class="text-red-400">${failedCount}</span> failed</span>` : ''}
    `;
    
    queueStatsEl.innerHTML = statsHtml;
}

function updateQueueControls() {
    const hasQueuedJobs = queue.some(j => j.status === 'queued');
    startQueueBtn.disabled = isProcessing || !hasQueuedJobs;
    startQueueBtn.textContent = isProcessing ? 'Processing...' : 'Start Generation';
    clearQueueBtn.disabled = isProcessing;
}

function updateApiKeyStatus() {
    if (apiKey) {
        apiKeyStatusEl.innerHTML = `<span class="w-3 h-3 bg-status-completed rounded-full"></span><span>API Key Saved</span>`;
        apiKeyStatusEl.classList.remove('text-red-400');
        apiKeyStatusEl.classList.add('text-status-completed');
    } else {
        apiKeyStatusEl.innerHTML = `<span class="w-3 h-3 bg-status-failed rounded-full"></span><span>Not Configured</span>`;
        apiKeyStatusEl.classList.remove('text-status-completed');
        apiKeyStatusEl.classList.add('text-red-400');
    }
}

function updateNamingPreview() {
    const exampleNumber = String(namingStartNumber).padStart(3, '0');
    let previewText = '';
    if (namingPosition === 'after') {
        previewText = `${namingPrefix}${exampleNumber}.mp4`;
    } else {
        previewText = `${exampleNumber}${namingPrefix}.mp4`;
    }
    namingPreviewEl.textContent = previewText;
}

async function updateCurrentFolder() {
    try {
        const currentFolder = await eel.get_output_folder()();
        currentFolderPathEl.textContent = currentFolder;
    } catch (error) {
        console.error('Failed to get current folder:', error);
    }
}

// --- Google GenAI Integration (imported via CDN) ---
async function generateContent(job, currentApiKey) {
    // Import GoogleGenAI from the CDN
    const { GoogleGenAI } = await import('@google/genai');
    
    const ai = new GoogleGenAI({ apiKey: currentApiKey });

    const params = {
        model: job.model,
        prompt: job.prompt,
        config: {
            numberOfVideos: 1,
            aspectRatio: job.config.aspectRatio,
        },
    };

    if (job.config.seed) {
        params.config.seed = job.config.seed;
    }

    if (job.imageBytes) {
        params.image = {
            imageBytes: job.imageBytes,
            mimeType: 'image/png',
        };
    }

    let operation = await ai.models.generateVideos(params);

    const maxPolls = 30; // 5 minutes max
    for (let i = 0; i < maxPolls && !operation.done; i++) {
        await delay(10000); // Poll every 10 seconds
        try {
            operation = await ai.operations.getVideosOperation({ operation });
        } catch (e) {
            console.error('Error polling for operation status:', e);
            throw new Error('Failed to get video generation status.');
        }
    }

    if (!operation.done) {
        throw new Error('Video generation timed out.');
    }

    const videos = operation.response?.generatedVideos;
    if (!videos || videos.length === 0) {
        throw new Error('No videos were generated. The prompt may have been blocked.');
    }

    const url = decodeURIComponent(videos[0].video.uri);
    const res = await fetch(`${url}&key=${currentApiKey}`);
    const blob = await res.blob();
    
    // Return both the blob URL (for preview) and original URL (for downloading)
    return {
        blobUrl: URL.createObjectURL(blob),
        originalUrl: `${url}&key=${currentApiKey}`
    };
}

// --- Queue Processing Logic ---
async function processNextJob() {
    const job = queue.find(j => j.status === 'queued');
    if (!job) {
        isProcessing = false;
        updateQueueControls();
        return;
    }

    if (!apiKey) {
        showError('API Key not configured. Please set it in the Configuration tab.');
        isProcessing = false;
        updateQueueControls();
        return;
    }

    job.status = 'generating';
    saveQueue();
    renderQueue();
    
    try {
        const videoData = await generateContent(job, apiKey);
        job.status = 'completed';
        job.resultUrl = videoData.blobUrl; // For preview in browser
        job.downloadUrl = videoData.originalUrl; // For downloading via Python
        
        // Auto-download to custom folder
        try {
            const filename = generateFilename(job.id);
            const downloadResult = await eel.download_video_to_custom_path(job.downloadUrl, filename)();
            
            if (downloadResult.success) {
                job.downloadPath = downloadResult.path;
                // Show success notification with download path
                await eel.show_native_notification(
                    'Video Generated & Downloaded!', 
                    `Saved to: ${filename}`
                )();
            } else {
                // Generation succeeded but download failed - show notification
                await eel.show_native_notification(
                    'Video Generated!', 
                    `Video ready, but auto-download failed. Use the download button.`
                )();
            }
        } catch (downloadError) {
            console.error('Auto-download failed:', downloadError);
            // Generation succeeded but download failed - still show as completed
            await eel.show_native_notification(
                'Video Generated!', 
                `Video ready, but auto-download failed. Use the download button.`
            )();
        }
        
    } catch (e) {
        job.status = 'failed';
        job.error = e instanceof Error ? e.message : 'An unknown error occurred.';
        if (e instanceof Error && e.message.includes('API key not valid')) {
            job.error = 'API key not valid. Please check it in the Configuration tab.';
        }
        
        // Show error notification
        await eel.show_native_notification('Generation Failed', `Error: ${job.error}`)();
    }

    saveQueue();
    renderQueue();
    await processNextJob();
}

function startQueue() {
    if (isProcessing) return;
    isProcessing = true;
    updateQueueControls();
    processNextJob();
}

// --- UI Navigation ---
function showView(view) {
    if (view === 'generation') {
        generationView.classList.remove('hidden');
        configView.classList.add('hidden');
        navGenerationBtn.classList.add('active');
        navConfigBtn.classList.remove('active');
    } else {
        generationView.classList.add('hidden');
        configView.classList.remove('hidden');
        navGenerationBtn.classList.remove('active');
        navConfigBtn.classList.add('active');
    }
}

function showError(message) {
    errorMessageEl.textContent = message;
    setTimeout(() => errorMessageEl.textContent = '', 5000);
}

// --- Event Listeners ---
fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (file) {
        fileNameEl.textContent = file.name;
        base64data = await blobToBase64(file);
        imgPreview.src = `data:image/png;base64,${base64data}`;
        imgPreview.style.display = 'block';
    } else {
        fileNameEl.textContent = 'No file chosen';
        base64data = '';
        imgPreview.style.display = 'none';
    }
});

randomSeedBtn.addEventListener('click', () => {
    seedInput.value = String(Math.floor(Math.random() * 1000000000));
});

addToQueueBtn.addEventListener('click', () => {
    const prompt = promptEl.value.trim();
    if (!prompt) {
        showError('Please enter a prompt.');
        return;
    }

    // Get batch size (how many copies to add)
    const batchSize = parseInt(batchSizeInput.value, 10) || 1;
    if (batchSize < 1 || batchSize > 20) {
        showError('Batch size must be between 1 and 20.');
        return;
    }

    // Add multiple jobs to the queue
    for (let i = 0; i < batchSize; i++) {
        const newJob = new Job(
            generateId(),
            prompt,
            base64data,
            modelSelect.value,
            {
                seed: seedInput.value ? parseInt(seedInput.value, 10) : undefined,
                aspectRatio: aspectRatioSelect.value,
            }
        );
        queue.push(newJob);
    }
    
    saveQueue();
    renderQueue();

    // Show success message
    showError(`Added ${batchSize} job${batchSize > 1 ? 's' : ''} to queue!`);

    // Clear form
    promptEl.value = '';
    base64data = '';
    fileInput.value = '';
    fileNameEl.textContent = 'No file chosen';
    imgPreview.style.display = 'none';
    batchSizeInput.value = '1'; // Reset batch size to 1
});

startQueueBtn.addEventListener('click', startQueue);

clearQueueBtn.addEventListener('click', () => {
    if (isProcessing) {
        showError("Cannot clear queue while processing.");
        return;
    }
    if (queue.length === 0) {
        showError("Queue is already empty.");
        return;
    }

    if (confirm('Are you sure you want to clear the entire queue and history? This action cannot be undone.')) {
        queue = [];
        saveQueue();
        renderQueue();
    }
});

// Navigation
navGenerationBtn.addEventListener('click', () => showView('generation'));
navConfigBtn.addEventListener('click', () => showView('config'));

// API Key Management
saveApiKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key && key.length > 10 && !key.includes('•')) { // Basic validation and not masked
        saveApiKey(key);
        showError('API Key saved successfully!');
        apiKeyInput.value = '••••••••••••••••••••' + key.slice(-4);
    } else {
        showError('Please enter a valid API key.');
    }
});

// Native App Features
selectFolderBtn.addEventListener('click', async () => {
    try {
        const selectedFolder = await eel.select_output_folder()();
        if (selectedFolder) {
            currentFolderPathEl.textContent = selectedFolder;
            showError('Output folder updated successfully!');
        }
    } catch (error) {
        console.error('Error selecting folder:', error);
        showError('Failed to select folder.');
    }
});

openFolderBtn.addEventListener('click', async () => {
    try {
        const success = await eel.open_folder_in_finder()();
        if (!success) {
            showError('Failed to open folder.');
        }
    } catch (error) {
        console.error('Error opening folder:', error);
        showError('Failed to open folder.');
    }
});

// Naming convention listeners
[namingPrefixInput, namingStartNumberInput, namingPositionSelect].forEach(el => {
    el.addEventListener('input', () => {
        namingPrefix = namingPrefixInput.value;
        namingStartNumber = parseInt(namingStartNumberInput.value, 10) || 1;
        namingPosition = namingPositionSelect.value;
        saveNamingSettings();
        updateNamingPreview();
    });
});

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log('VEO Native App - Initializing...');
    
    // Initialize native features
    await initializeNativeFeatures();
    
    // Load saved data
    loadQueue();
    loadApiKey();
    loadNamingSettings();
    
    // Set default view
    showView('generation');
    
    console.log('VEO Native App - Ready!');
});

// Handle window close
window.addEventListener('beforeunload', () => {
    saveQueue();
    saveNamingSettings();
});
