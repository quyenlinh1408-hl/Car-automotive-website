(() => {
  const sourceText = document.getElementById('sourceText');
  const ocrDropZone = document.getElementById('ocrDropZone');
  const ocrOverlay = document.getElementById('ocrOverlay');
  const ocrPreviewWrapper = document.getElementById('ocrPreviewWrapper');
  const ocrPreviewImage = document.getElementById('ocrPreviewImage');
  const ocrPreviewCloseButton = document.getElementById('ocrPreviewCloseButton');
  const ocrDropHint = document.getElementById('ocrDropHint');
  const sourceWordCounter = document.getElementById('sourceWordCounter');
  const languageButtons = document.getElementById('languageButtons');
  const translateButton = document.getElementById('translateButton');
  const translateButtonText = document.getElementById('translateButtonText');
  const aiTranslateButton = document.getElementById('aiTranslateButton');
  const aiTranslateButtonText = document.getElementById('aiTranslateButtonText');
  const aiApiStatus = document.getElementById('aiApiStatus');
  const themeToggleButton = document.getElementById('themeToggleButton');
  const themeToggleText = document.getElementById('themeToggleText');
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const infoButton = document.getElementById('infoButton');
  const adminAccessButton = document.getElementById('adminAccessButton');
  const adminSpaPanel = document.getElementById('adminSpaPanel');
  const adminSpaFrame = document.getElementById('adminSpaFrame');
  const adminSpaBackButton = document.getElementById('adminSpaBackButton');
  const infoModal = document.getElementById('infoModal');
  const infoModalCloseButton = document.getElementById('infoModalCloseButton');
  const translateSpinner = document.getElementById('translateSpinner');
  const statusMessage = document.getElementById('statusMessage');
  const resultSection = document.getElementById('resultSection');
  const resultCategoryBadge = document.getElementById('resultCategoryBadge');
  const resultSourceBadge = document.getElementById('resultSourceBadge');
  const aiAttributionNote = document.getElementById('aiAttributionNote');
  const aiSuggestionPanel = document.getElementById('aiSuggestionPanel');
  const aiSuggestionContent = document.getElementById('aiSuggestionContent');
  const slideMatchBadge = document.getElementById('slideMatchBadge');
  const resultTableBody = document.getElementById('resultTableBody');
  const resultCards = document.getElementById('resultCards');
  const resultExpandControls = document.getElementById('resultExpandControls');
  const resultExpandHint = document.getElementById('resultExpandHint');
  const resultExpandButton = document.getElementById('resultExpandButton');
  const resultExpandButtonText = document.getElementById('resultExpandButtonText');
  const quickFeedbackButton = document.getElementById('quickFeedbackButton');
  const browseModeTableBody = document.getElementById('browseModeTableBody');
  const browseModeCaption = document.getElementById('browseModeCaption');
  const categoryFilterButtons = document.getElementById('categoryFilterButtons');
  const activeCategoryLabel = document.getElementById('activeCategoryLabel');
  const strictModeToggle = document.getElementById('strictModeToggle');
  const qualityModeLabel = document.getElementById('qualityModeLabel');
  const ocrUploadButton = document.getElementById('ocrUploadButton');
  const ocrImageInput = document.getElementById('ocrImageInput');
  const ocrProgressWrapper = document.getElementById('ocrProgressWrapper');
  const ocrProgressBar = document.getElementById('ocrProgressBar');
  const ocrStatusText = document.getElementById('ocrStatusText');
  const temporaryTermsPanel = document.getElementById('temporaryTermsPanel');
  const temporaryTermsList = document.getElementById('temporaryTermsList');
  const contributionForm = document.getElementById('contributionForm');
  const contribSourceText = document.getElementById('contribSourceText');
  const contribAiSuggestButton = document.getElementById('contribAiSuggestButton');
  const contribSystemCategory = document.getElementById('contribSystemCategory');
  const contribEnglish = document.getElementById('contribEnglish');
  const contribVietnamese = document.getElementById('contribVietnamese');
  const contribJapaneseKanji = document.getElementById('contribJapaneseKanji');
  const contribJapaneseRomaji = document.getElementById('contribJapaneseRomaji');
  const contribChinese = document.getElementById('contribChinese');
  const contribNote = document.getElementById('contribNote');
  const contributionSubmitButton = document.getElementById('contributionSubmitButton');
  const contributionStatus = document.getElementById('contributionStatus');
  const contributionToast = document.getElementById('contributionToast');
  
  // 4 Language View Elements
  const quadLangToggle = document.getElementById('quadLangToggle');
  const quadLangView = document.getElementById('quadLangView');
  const quadLangEnglish = document.getElementById('quadLangEnglish');
  const quadLangEnglishPhonetic = document.getElementById('quadLangEnglishPhonetic');
  const quadLangVietnamese = document.getElementById('quadLangVietnamese');
  const quadLangJaKanji = document.getElementById('quadLangJaKanji');
  const quadLangJaRomaji = document.getElementById('quadLangJaRomaji');
  const quadLangChinese = document.getElementById('quadLangChinese');
  const quadLangChinesePinyin = document.getElementById('quadLangChinesePinyin');
  const quadLangSpeakEn = document.getElementById('quadLangSpeakEn');
  const quadLangSpeakVi = document.getElementById('quadLangSpeakVi');
  const quadLangSpeakJa = document.getElementById('quadLangSpeakJa');
  const quadLangSpeakZh = document.getElementById('quadLangSpeakZh');

  const TRANSLATE_API_URL = window.TRANSLATE_API_URL || '/api/translate-fallback';
  const OCR_VISION_API_URL = '/api/ocr-vision';
  const OCR_RESTORE_VI_API_URL = '/api/ocr-restore-vi';
  const SOURCE_WORD_LIMIT = 5000;
  const SOURCE_INPUT_PROCESS_DELAY_MS = 120;
  const INITIAL_PARALLEL_RESULTS_LIMIT = 8;
  const TRANSLATE_REQUEST_TIMEOUT_MS = 30000;
  const AI_TRANSLATION_CACHE_KEY = 'autotranslate-ai-cache-v1';
  const AI_TRANSLATION_CACHE_MAX_ITEMS = 200;
  const OCR_TERM_CHUNK_SIZE = 12;

  let dictionaryTerms = [];
  let dictionaryLookup = new Map();
  let dictionaryAliases = [];
  let categoryDefinitions = [];
  let activeCategoryKey = 'all';
  let strictModeEnabled = true;
  let temporaryTranslatedTerms = [];
  const runtimeTranslationCache = new Map();
  let persistentAiCacheStore = null;
  let sourceInputProcessTimer = null;
  let lastStatusMessage = '';
  let quadLangViewMode = false;
  let currentQuadLangData = null;
  let resultExpandAll = false;
  let lastParallelItems = [];
  const englishPhoneticCache = new Map();
  const englishPhoneticRequestCache = new Map();
  const chinesePinyinCache = new Map();
  let aiApiOnline = null;
  let aiApiProbeIntervalId = null;
  let currentOcrFile = null;
  let adminSpaLoaded = false;

  const normalize = (value) => String(value || '').trim().toLowerCase();
  const normalizeLoose = (value) => normalize(value).replace(/[^\p{L}\p{N}\s]+/gu, ' ').replace(/\s+/g, ' ').trim();
  const sanitizeTranslationInput = (value) =>
    String(value || '')
      .replace(/[\u0000-\u001F\u007F]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  const sanitizeMultilineTranslationInput = (value) =>
    String(value || '')
      .replace(/\r\n?/g, '\n')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]+/g, ' ')
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .filter(Boolean)
      .join('\n');
  const getTranslationCacheKey = (text) => normalize(sanitizeTranslationInput(text));

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const encodeDataText = (value) => encodeURIComponent(String(value || ''));

  const encodeDataAttr = (value) =>
    String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const decodeDataAttr = (value) => {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = String(value || '');
    return textarea.value;
  };

  const ensurePersistentAiCacheStore = () => {
    if (persistentAiCacheStore && typeof persistentAiCacheStore === 'object') {
      return persistentAiCacheStore;
    }

    try {
      const rawCache = localStorage.getItem(AI_TRANSLATION_CACHE_KEY);
      const parsed = rawCache ? JSON.parse(rawCache) : {};
      persistentAiCacheStore = parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      persistentAiCacheStore = {};
    }

    return persistentAiCacheStore;
  };

  const persistAiCacheStore = () => {
    try {
      localStorage.setItem(AI_TRANSLATION_CACHE_KEY, JSON.stringify(ensurePersistentAiCacheStore()));
    } catch (error) {
      console.warn('Cannot persist AI cache:', error);
    }
  };

  const getCachedAiTranslation = (cacheKey) => {
    if (!cacheKey) {
      return null;
    }

    if (runtimeTranslationCache.has(cacheKey)) {
      return runtimeTranslationCache.get(cacheKey);
    }

    const store = ensurePersistentAiCacheStore();
    const entry = store?.[cacheKey];
    if (!entry) {
      return null;
    }

    const translation = entry?.term && typeof entry.term === 'object' ? entry.term : entry;
    if (!translation || typeof translation !== 'object') {
      return null;
    }

    runtimeTranslationCache.set(cacheKey, translation);
    return translation;
  };

  const setCachedAiTranslation = (cacheKey, translation) => {
    if (!cacheKey || !translation || typeof translation !== 'object') {
      return;
    }

    runtimeTranslationCache.set(cacheKey, translation);

    const store = ensurePersistentAiCacheStore();
    store[cacheKey] = {
      term: translation,
      updatedAt: Date.now(),
    };

    const entries = Object.entries(store);
    if (entries.length > AI_TRANSLATION_CACHE_MAX_ITEMS) {
      entries
        .sort((left, right) => (right[1]?.updatedAt || 0) - (left[1]?.updatedAt || 0))
        .slice(AI_TRANSLATION_CACHE_MAX_ITEMS)
        .forEach(([key]) => {
          delete store[key];
        });
    }

    persistAiCacheStore();
  };

  const setTheme = (mode) => {
    const resolvedMode = mode === 'dark' ? 'dark' : 'light';
    document.body.classList.toggle('dark', resolvedMode === 'dark');
    document.documentElement.classList.toggle('dark', resolvedMode === 'dark');

    if (themeToggleText) {
      themeToggleText.textContent = resolvedMode === 'dark' ? 'Light Mode' : 'Dark Mode';
    }

    if (themeToggleIcon) {
      themeToggleIcon.innerHTML = resolvedMode === 'dark'
        ? '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z"></path>'
        : '<path d="M12 3a6 6 0 0 0 0 12a6 6 0 0 1 0 12a9 9 0 1 1 0-18Z"></path>';
    }

    try {
      localStorage.setItem('autotranslate-theme', resolvedMode);
    } catch (error) {
      console.warn('Unable to persist theme:', error);
    }
  };

  const loadTheme = () => {
    try {
      const savedTheme = localStorage.getItem('autotranslate-theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
        return;
      }
    } catch (error) {
      console.warn('Unable to read saved theme:', error);
    }

    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  };

  const showAdminSpaPanel = () => {
    if (!adminSpaPanel || !adminSpaFrame) {
      window.location.href = '/admin.html';
      return;
    }

    if (!adminSpaLoaded) {
      adminSpaFrame.src = '/admin.html?embedded=1';
      adminSpaLoaded = true;
    }

    adminSpaPanel.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  };

  const hideAdminSpaPanel = () => {
    if (!adminSpaPanel) {
      return;
    }
    adminSpaPanel.classList.add('hidden');
    document.body.style.overflow = '';
  };

  const verifyAndOpenAdmin = async () => {
    const existingToken = sessionStorage.getItem('admin-session-token');
    if (existingToken) {
      showAdminSpaPanel();
      return;
    }

    const key = String(window.prompt('Nhập Admin Key:') || '').trim();
    if (!key) {
      return;
    }

    const response = await fetch('/api/admin/verify-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key }),
    });

    let data = {};
    try {
      data = await response.json();
    } catch (_error) {
      data = {};
    }

    if (!response.ok || !data.sessionToken) {
      alert(data.message || 'Admin key không hợp lệ.');
      return;
    }

    sessionStorage.setItem('admin-session-token', data.sessionToken);
    showAdminSpaPanel();
  };

  const openInfoModal = () => {
    if (!infoModal) {
      return;
    }

    infoModal.classList.remove('hidden');
    infoModal.classList.add('flex');
    infoModal.setAttribute('aria-hidden', 'false');
  };

  const closeInfoModal = () => {
    if (!infoModal) {
      return;
    }

    infoModal.classList.add('hidden');
    infoModal.classList.remove('flex');
    infoModal.setAttribute('aria-hidden', 'true');
  };

  const updateAiTranslateButtonState = (isLoading = false) => {
    if (!aiTranslateButton) {
      return;
    }

    const isOffline = aiApiOnline === false;
    aiTranslateButton.disabled = isLoading || isOffline;
    aiTranslateButton.classList.toggle('opacity-60', isLoading || isOffline);
    aiTranslateButton.classList.toggle('cursor-not-allowed', isLoading || isOffline);
    aiTranslateButton.title = isOffline
      ? 'API AI chưa sẵn sàng. Khi bật backend, nút này sẽ hoạt động lại.'
      : 'Bo qua tu dien noi bo va dich qua AI';
  };

  const setAiApiStatus = (state, details = '') => {
    aiApiOnline = state;

    if (aiApiStatus) {
      aiApiStatus.classList.remove(
        'border-slate-200',
        'bg-slate-50',
        'text-slate-600',
        'border-emerald-200',
        'bg-emerald-50',
        'text-emerald-700',
        'border-rose-200',
        'bg-rose-50',
        'text-rose-700'
      );

      if (state === true) {
        aiApiStatus.classList.add('border-emerald-200', 'bg-emerald-50', 'text-emerald-700');
        aiApiStatus.textContent = details || 'API AI: Sẵn sàng';
      } else if (state === false) {
        aiApiStatus.classList.add('border-amber-200', 'bg-amber-50', 'text-amber-800');
        aiApiStatus.textContent = details || 'API AI: Chưa sẵn sàng, sẽ tự bật khi server phản hồi';
      } else {
        aiApiStatus.classList.add('border-slate-200', 'bg-slate-50', 'text-slate-600');
        aiApiStatus.textContent = details || 'API AI: Đang kiểm tra...';
      }
    }

    updateAiTranslateButtonState(false);
  };

  const checkAiApiAvailability = async () => {
    if (typeof TRANSLATE_API_URL !== 'string' || !TRANSLATE_API_URL) {
      setAiApiStatus(false, 'API AI: Chưa sẵn sàng để kiểm tra');
      return false;
    }

    try {
      const response = await fetch(TRANSLATE_API_URL, {
        method: 'OPTIONS',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      const reachable = response.ok || [400, 404, 405].includes(response.status);
      setAiApiStatus(
        reachable,
        reachable
          ? 'API AI: Sẵn sàng'
          : 'API AI: Máy chủ đang phản hồi chậm'
      );
      return reachable;
    } catch (error) {
      setAiApiStatus(false, 'API AI: Chưa sẵn sàng, kiểm tra lại sau vài giây');
      return false;
    }
  };

  const getChinesePinyin = (text) => {
    const cleaned = String(text || '').trim();
    if (!cleaned) {
      return '';
    }

    if (chinesePinyinCache.has(cleaned)) {
      return chinesePinyinCache.get(cleaned);
    }

    let pinyinValue = '';
    try {
      if (window.pinyinPro && typeof window.pinyinPro.pinyin === 'function') {
        pinyinValue = window.pinyinPro.pinyin(cleaned, {
          type: 'array',
          toneType: 'symbol',
          nonZh: 'consecutive',
        }).join(' ');
      }
    } catch (error) {
      console.warn('Cannot generate pinyin:', error);
    }

    if (!pinyinValue) {
      pinyinValue = 'Chua co pinyin';
    }

    chinesePinyinCache.set(cleaned, pinyinValue);
    return pinyinValue;
  };

  const fetchEnglishWordPhonetic = async (word) => {
    const normalizedWord = normalize(word).replace(/[^a-z']/g, '');
    if (!normalizedWord) {
      return '';
    }

    if (englishPhoneticCache.has(normalizedWord)) {
      return englishPhoneticCache.get(normalizedWord);
    }

    if (!englishPhoneticRequestCache.has(normalizedWord)) {
      englishPhoneticRequestCache.set(normalizedWord, (async () => {
        try {
          const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }

          const payload = await response.json();
          const firstEntry = Array.isArray(payload) ? payload[0] : null;
          const fromEntry = String(firstEntry?.phonetic || '').trim();
          const fromList = Array.isArray(firstEntry?.phonetics)
            ? String(firstEntry.phonetics.find((item) => String(item?.text || '').trim())?.text || '').trim()
            : '';
          const phonetic = fromEntry || fromList || normalizedWord;
          englishPhoneticCache.set(normalizedWord, phonetic);
          return phonetic;
        } catch (error) {
          englishPhoneticCache.set(normalizedWord, normalizedWord);
          return normalizedWord;
        } finally {
          englishPhoneticRequestCache.delete(normalizedWord);
        }
      })());
    }

    return englishPhoneticRequestCache.get(normalizedWord);
  };

  const getEnglishPhoneticForText = async (text) => {
    const cleaned = String(text || '').trim();
    if (!cleaned) {
      return '';
    }

    const words = cleaned.match(/[A-Za-z']+/g) || [];
    if (!words.length) {
      return cleaned;
    }

    const limitedWords = words.slice(0, 6);
    const parts = await Promise.all(limitedWords.map((word) => fetchEnglishWordPhonetic(word)));
    return parts.join(' ');
  };

  const loadImageFromFile = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = String(reader.result || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const preprocessImageForOcr = async (file) => {
    try {
      const image = await loadImageFromFile(file);
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });

      if (!context) {
        return file;
      }

      const maxDimension = 2400;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
      const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
      const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
      canvas.width = width;
      canvas.height = height;

      context.drawImage(image, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const pixels = imageData.data;
      const grayChannel = new Uint8ClampedArray(width * height);

      // Step 1: grayscale conversion.
      for (let pixelIndex = 0; pixelIndex < grayChannel.length; pixelIndex += 1) {
        const rgbaIndex = pixelIndex * 4;
        grayChannel[pixelIndex] = Math.round(
          pixels[rgbaIndex] * 0.299 + pixels[rgbaIndex + 1] * 0.587 + pixels[rgbaIndex + 2] * 0.114
        );
      }

      // Step 2: simple 3x3 box blur to reduce high-frequency noise.
      const denoised = new Uint8ClampedArray(grayChannel.length);
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          let sum = 0;
          let count = 0;

          for (let ky = -1; ky <= 1; ky += 1) {
            const ny = y + ky;
            if (ny < 0 || ny >= height) {
              continue;
            }

            for (let kx = -1; kx <= 1; kx += 1) {
              const nx = x + kx;
              if (nx < 0 || nx >= width) {
                continue;
              }

              sum += grayChannel[ny * width + nx];
              count += 1;
            }
          }

          denoised[y * width + x] = count ? Math.round(sum / count) : grayChannel[y * width + x];
        }
      }

      // Step 3: contrast boost + adaptive threshold to sharpen character edges.
      const contrastFactor = 1.35;
      const thresholdBase = 150;
      for (let pixelIndex = 0; pixelIndex < denoised.length; pixelIndex += 1) {
        const boosted = Math.max(0, Math.min(255, Math.round((denoised[pixelIndex] - 128) * contrastFactor + 128)));
        const binary = boosted > thresholdBase ? 255 : 0;
        const rgbaIndex = pixelIndex * 4;
        pixels[rgbaIndex] = binary;
        pixels[rgbaIndex + 1] = binary;
        pixels[rgbaIndex + 2] = binary;
        pixels[rgbaIndex + 3] = 255;
      }

      context.putImageData(imageData, 0, 0);
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.warn('OCR preprocessing failed, using original file:', error);
      return file;
    }
  };

  const blobToDataUrl = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const extractTextFromImageViaVision = async (file) => {
    const imageDataUrl = await blobToDataUrl(file);
    if (!imageDataUrl) {
      throw new Error('imageDataUrl is empty');
    }

    const response = await fetch(OCR_VISION_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageDataUrl,
        instruction: 'Bạn là chuyên gia ngôn ngữ ô tô của FPT. Hãy nhìn vào hình ảnh này và trích xuất lại văn bản chính xác 100%. Nếu chữ bị mờ, hãy dựa vào ngữ cảnh kỹ thuật ô tô để đoán từ đúng (Ví dụ: Nếu thấy chữ mờ giống "Brake specific fuel...", hãy tự động sửa lại cho đúng thuật ngữ kỹ thuật). Trả về plain text, giữ đúng thứ tự dòng như ảnh gốc, không thêm giải thích hay ký hiệu markdown.',
      }),
    });

    if (!response.ok) {
      throw new Error(`Vision OCR HTTP ${response.status}`);
    }

    const payload = await response.json();
    return String(payload?.text || '').trim();
  };

  const showOcrPreview = async (blob) => {
    if (!ocrPreviewWrapper || !ocrPreviewImage || !blob) {
      return;
    }

    try {
      const dataUrl = await blobToDataUrl(blob);
      currentOcrFile = blob;
      ocrPreviewImage.src = dataUrl;
      ocrPreviewWrapper.classList.remove('hidden');
      if (ocrDropHint) {
        ocrDropHint.classList.add('hidden');
      }
    } catch (error) {
      ocrPreviewWrapper.classList.add('hidden');
      if (ocrDropHint) {
        ocrDropHint.classList.remove('hidden');
      }
    }
  };

  const clearOcrPreviewState = ({ clearSourceText = true } = {}) => {
    currentOcrFile = null;

    if (ocrPreviewImage) {
      ocrPreviewImage.src = '';
    }

    if (ocrPreviewWrapper) {
      ocrPreviewWrapper.classList.add('hidden');
    }

    if (ocrDropHint) {
      ocrDropHint.classList.remove('hidden');
    }

    if (ocrImageInput) {
      ocrImageInput.value = '';
    }

    if (clearSourceText && sourceText) {
      sourceText.value = '';
      enforceSourceWordLimit();
      updateSourceWordCounter();
    }

    setOcrInputAreaState({ dragActive: false, processing: false });
  };

  const setOcrInputAreaState = ({ dragActive = false, processing = false } = {}) => {
    if (!ocrDropZone) {
      return;
    }

    ocrDropZone.classList.toggle('ocr-zone-active', dragActive || processing);
    ocrDropZone.classList.toggle('ocr-zone-processing', processing);
    ocrDropZone.classList.toggle('border-blue-500', dragActive || processing);
    ocrDropZone.classList.toggle('bg-blue-50/60', dragActive);
    ocrDropZone.classList.toggle('dark:bg-blue-950/30', dragActive);

    if (ocrOverlay) {
      ocrOverlay.classList.toggle('hidden', !processing);
      ocrOverlay.classList.toggle('flex', processing);
    }
  };

  const normalizeOcrLine = (line) =>
    String(line || '')
      .replace(/[•●▪◦]/g, '-')
      .replace(/^\s*[-–—*]+\s*/, '')
      .replace(/^\s*\d+[\.)\-:]\s*/, '')
      .replace(/\s+/g, ' ')
      .trim();

  const cleanOcrLineNoise = (line) => {
    let cleaned = String(line || '').trim();
    if (!cleaned) {
      return '';
    }

    // Remove trailing punctuation noise and OCR leftovers like ";", "Q", "a3".
    for (let index = 0; index < 4; index += 1) {
      const next = cleaned
        .replace(/[;:,.!?]+$/g, '')
        .replace(/\s+(?:[Qq]|[Aa]\d+|\d+[A-Za-z]|[A-Za-z]\d+)$/g, '')
        .trim();

      if (next === cleaned) {
        break;
      }

      cleaned = next;
      if (!cleaned) {
        return '';
      }
    }

    return cleaned;
  };

  const normalizeMultilineOcrText = (text) =>
    String(text || '')
      .replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => cleanOcrLineNoise(normalizeOcrLine(line)))
      .filter((line) => line.length >= 2)
      .join('\n');

  const extractOcrTerms = (text) => {
    const lines = String(text || '')
      .split(/\r?\n/)
      .map((line) => cleanOcrLineNoise(normalizeOcrLine(line)))
      .filter((line) => line.length >= 2)
      .filter((line) => /[\p{L}\p{N}]/u.test(line));

    // Remove duplicate adjacent rows caused by OCR ghosting while preserving order.
    const deduped = [];
    for (const line of lines) {
      const previous = deduped[deduped.length - 1] || '';
      if (normalize(previous) === normalize(line)) {
        continue;
      }
      deduped.push(line);
    }

    return deduped;
  };

  const chunkArray = (items, size) => {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) {
      chunks.push(items.slice(index, index + size));
    }
    return chunks;
  };

  const renderOcrComparisonResults = (rows) => {
    if (!Array.isArray(rows) || !rows.length) {
      renderEmptyResults('Không có dữ liệu OCR để hiển thị.');
      return;
    }

    hideResultCategory();
    showSlideMatch(false);
    if (resultSourceBadge) {
      resultSourceBadge.textContent = 'Kết quả tổng hợp: ASI101 + AI (theo thứ tự trong ảnh)';
      resultSourceBadge.className = 'mb-4 rounded-lg bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700';
      resultSourceBadge.classList.remove('hidden');
    }

    if (aiAttributionNote) {
      const hasAiRows = rows.some((row) => row.source === 'AI');
      aiAttributionNote.classList.toggle('hidden', !hasAiRows);
    }

    resultTableBody.innerHTML = rows
      .map((row) => {
        const isAsi101 = row.source.includes('ASI101');
        const sourceTone = isAsi101
          ? 'bg-amber-100 text-amber-800'
          : 'bg-violet-100 text-violet-800';
        const sourceLabel = isAsi101 ? row.source : 'AI';
        const term = row.term || {};
        const japaneseDisplay = `${term.japanese?.kanji || ''} (${term.japanese?.romaji || 'N/A'})`;

        return `
          <tr>
            <td class="px-2 py-2 font-medium">
              <p>${escapeHtml(row.original || '-')}</p>
              <span class="mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${sourceTone}">${sourceLabel}</span>
            </td>
            <td class="px-2 py-2">${escapeHtml(term.english || '-')}</td>
            <td class="px-2 py-2 font-semibold text-emerald-700">${escapeHtml(term.vietnamese || '-')}</td>
            <td class="px-2 py-2">${escapeHtml(japaneseDisplay)}</td>
            <td class="px-2 py-2">${escapeHtml(term.chinese_simplified || '-')}</td>
          </tr>
        `;
      })
      .join('');

    resultCards.innerHTML = rows
      .map((row) => {
        const isAsi101 = row.source.includes('ASI101');
        const sourceTone = isAsi101
          ? 'bg-amber-100 text-amber-800'
          : 'bg-violet-100 text-violet-800';
        const term = row.term || {};
        return `
          <article class="rounded-xl border border-slate-200 bg-white p-4">
            <div class="flex items-center justify-between gap-2">
              <p class="font-semibold text-slate-900">${escapeHtml(row.original || '-')}</p>
              <span class="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${sourceTone}">${escapeHtml(isAsi101 ? row.source : 'AI')}</span>
            </div>
            <div class="mt-2 space-y-1 text-sm text-slate-700">
              <p><span class="font-semibold">English:</span> ${escapeHtml(term.english || '-')}</p>
              <p><span class="font-semibold text-emerald-700">Tiếng Việt:</span> <span class="text-emerald-700 font-semibold">${escapeHtml(term.vietnamese || '-')}</span></p>
              <p><span class="font-semibold">日本語:</span> ${escapeHtml(term.japanese?.kanji || '-')} (${escapeHtml(term.japanese?.romaji || 'N/A')})</p>
              <p><span class="font-semibold">中文:</span> ${escapeHtml(term.chinese_simplified || '-')}</p>
            </div>
          </article>
        `;
      })
      .join('');

    if (resultExpandControls) {
      resultExpandControls.classList.add('hidden');
      resultExpandControls.classList.remove('flex');
    }

    hydrateResultPhonetics();
  };

  const processOcrTermList = async (extractedText, skipAiTranslation = false) => {
    const terms = extractOcrTerms(extractedText);
    if (!terms.length) {
      showStatus('Không nhận diện được danh sách thuật ngữ rõ ràng từ ảnh.');
      return false;
    }

    if (terms.length < 2) {
      showStatus('Đã OCR xong văn bản. Bạn có thể bấm Dịch để xử lý nội dung này.');
      return false;
    }

    const rows = terms.map((term, index) => ({
      index,
      original: term,
      source: 'pending',
      term: null,
    }));

    const scopedAsiTerms = getScopedAsiTerms();
    const pendingAi = [];

    rows.forEach((row) => {
      const foundAsi = findTerm(row.original, scopedAsiTerms);
      if (foundAsi) {
        row.source = 'ASI101';
        row.term = foundAsi.term;
      } else if (!skipAiTranslation) {
        pendingAi.push(row);
      }
    });

    // If skipAiTranslation is true and no ASI101 matches, fill with dummy data
    if (skipAiTranslation) {
      rows.forEach((row) => {
        if (!row.term) {
          row.source = 'SKIPPED';
          row.term = {
            english: row.original,
            vietnamese: row.original,
            japanese: { kanji: row.original, romaji: 'N/A' },
            chinese_simplified: row.original,
          };
        }
      });
    } else if (pendingAi.length) {
      const chunks = chunkArray(pendingAi, OCR_TERM_CHUNK_SIZE);
      let done = 0;
      for (const [chunkIndex, chunk] of chunks.entries()) {
        showStatus(`Trợ lý AI đang xử lý danh sách thuật ngữ (lô ${chunkIndex + 1}/${chunks.length})...`);
        for (const row of chunk) {
          const cacheKey = getTranslationCacheKey(row.original);
          const cached = getCachedAiTranslation(cacheKey);
          if (cached) {
            row.source = 'AI';
            row.term = cached;
            done += 1;
            continue;
          }

          try {
            const translated = await translateViaBackend(
              row.original,
              'en',
              true,
              'You are translating an automotive technical glossary list. Keep list-item semantics and preserve term formatting like "ABC - Active Body Control".'
            );
            setCachedAiTranslation(cacheKey, translated);
            row.source = 'AI';
            row.term = translated;
            
            // Kiểm tra lại ASI101 dựa trên kết quả AI (English)
            // Ưu tiên hiển thị định nghĩa chuẩn từ ASI101 nếu khớp
            if (translated?.english) {
              const asiMatch = findTerm(translated.english, scopedAsiTerms);
              if (asiMatch) {
                row.source = 'ASI101 (via AI)';
                row.term = asiMatch.term;
              } else {
                // Thử kiếm với English từ ASI101
                const normalizedTranslated = normalize(sanitizeTranslationInput(translated.english));
                const asiLookup = scopedAsiTerms.find(t => 
                  normalize(sanitizeTranslationInput(t.term.english)) === normalizedTranslated
                );
                if (asiLookup) {
                  row.source = 'ASI101 (via AI)';
                  row.term = asiLookup.term;
                }
              }
            }
          } catch (error) {
            row.source = 'AI';
            row.term = {
              english: row.original,
              vietnamese: row.original,
              japanese: { kanji: row.original, romaji: 'N/A' },
              chinese_simplified: row.original,
            };
          }

          done += 1;
          showStatus(`Đang dịch danh sách thuật ngữ: ${done}/${pendingAi.length}`);
        }
      }
    }

    rows.sort((left, right) => left.index - right.index);
    renderOcrComparisonResults(rows);
    const asiCount = rows.filter((row) => row.source.includes('ASI101')).length;
    const aiCount = rows.filter((row) => row.source === 'AI').length;
    const skippedCount = rows.filter((row) => row.source === 'SKIPPED').length;
    
    if (skipAiTranslation && skippedCount > 0) {
      showStatus(`Hoàn tất OCR: ${rows.length} dòng (${asiCount} từ ASI101, ${skippedCount} không dịch AI)`);
    } else {
      showStatus(`Hoàn tất OCR: ${rows.length} dòng (${asiCount} từ ASI101, ${aiCount} từ AI).`);
    }
    
    return true;
  };

  const hydrateResultPhonetics = () => {
    if (!resultTableBody && !resultCards) {
      return;
    }

    const allPhoneticTargets = document.querySelectorAll('[data-english-phonetic-target]');
    allPhoneticTargets.forEach((node) => {
      const encodedText = node.getAttribute('data-english-phonetic-target') || '';
      const sourceText = decodeDataAttr(encodedText).trim();
      if (!sourceText) {
        node.textContent = '-';
        return;
      }

      node.textContent = 'Dang tao IPA...';
      getEnglishPhoneticForText(sourceText)
        .then((value) => {
          node.textContent = value || 'Khong co IPA';
        })
        .catch(() => {
          node.textContent = 'Khong co IPA';
        });
    });

    const allPinyinTargets = document.querySelectorAll('[data-chinese-pinyin-target]');
    allPinyinTargets.forEach((node) => {
      const encodedText = node.getAttribute('data-chinese-pinyin-target') || '';
      const sourceText = decodeDataAttr(encodedText).trim();
      node.textContent = getChinesePinyin(sourceText) || 'Chua co pinyin';
    });
  };

  const volumeIconSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-3 w-3 sm:h-4 sm:w-4"><path d="M13.5 4.06A1.5 1.5 0 0011 5.22V7.5H8.25a3.75 3.75 0 00-3.75 3.75v1.5a3.75 3.75 0 003.75 3.75H11v2.28a1.5 1.5 0 002.5 1.16l4.5-3.9a1.5 1.5 0 000-2.27l-4.5-3.9zm4.82 2.17a.75.75 0 011.06 0 8.25 8.25 0 010 11.67.75.75 0 01-1.06-1.06 6.75 6.75 0 000-9.55.75.75 0 010-1.06z"/></svg>';

  const renderSpeakButton = (text, lang, label) =>
    `<button type="button" class="hidden sm:inline-flex rounded-md p-0.5 sm:p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700" data-speak-text="${encodeDataText(text)}" data-speak-lang="${escapeHtml(lang)}" aria-label="${escapeHtml(label)}">${volumeIconSvg}</button>`;

  const renderSpeakRow = (label, text, lang, ariaLabel) =>
    `<p class="flex items-center justify-between gap-2"><span><span class="font-semibold">${escapeHtml(label)}:</span> ${escapeHtml(text)}</span>${renderSpeakButton(text, lang, ariaLabel)}</p>`;

  const setTranslateLoading = (isLoading, isAiMode = false) => {
    translateButton.disabled = isLoading;
    updateAiTranslateButtonState(isLoading);
    translateSpinner.classList.toggle('hidden', !isLoading);
    translateButtonText.textContent = isLoading && !isAiMode ? 'Đang dịch...' : 'Dịch';
    if (aiTranslateButtonText) {
      aiTranslateButtonText.textContent = isLoading && isAiMode ? 'Đang xử lý...' : 'Dịch AI';
    }
  };

  const setOcrLoading = (isLoading, progressPercent = 0, statusText = 'Đang xử lý ảnh...') => {
    if (!ocrProgressWrapper || !ocrProgressBar || !ocrStatusText || !ocrUploadButton) {
      return;
    }

    ocrProgressWrapper.classList.toggle('hidden', !isLoading);
    ocrUploadButton.disabled = isLoading;
    ocrUploadButton.classList.toggle('opacity-70', isLoading);
    ocrUploadButton.classList.toggle('cursor-not-allowed', isLoading);
    ocrProgressBar.style.width = `${Math.max(0, Math.min(progressPercent, 100))}%`;
    ocrStatusText.textContent = statusText;
  };

  const showStatus = (message) => {
    const safeMessage = String(message || '');
    if (safeMessage === lastStatusMessage) {
      return;
    }

    lastStatusMessage = safeMessage;

    if (!safeMessage) {
      statusMessage.textContent = '';
      statusMessage.classList.add('hidden');
      return;
    }

    statusMessage.textContent = safeMessage;
    statusMessage.classList.remove('hidden');
  };

  const countWords = (text) => {
    const words = String(text || '').trim().match(/\S+/g);
    return words ? words.length : 0;
  };

  const updateSourceWordCounter = () => {
    if (!sourceText || !sourceWordCounter) {
      return;
    }

    const wordCount = countWords(sourceText.value);
    sourceWordCounter.textContent = `${wordCount} / ${SOURCE_WORD_LIMIT} từ`;
    sourceWordCounter.classList.toggle('text-rose-600', wordCount >= SOURCE_WORD_LIMIT);
    sourceWordCounter.classList.toggle('text-slate-600', wordCount < SOURCE_WORD_LIMIT);
  };

  const enforceSourceWordLimit = () => {
    if (!sourceText) {
      return false;
    }

    const words = String(sourceText.value || '').match(/\S+/g) || [];
    if (words.length <= SOURCE_WORD_LIMIT) {
      return false;
    }

    sourceText.value = words.slice(0, SOURCE_WORD_LIMIT).join(' ');
    updateSourceWordCounter();
    showStatus(`Đã giới hạn tối đa ${SOURCE_WORD_LIMIT} từ cho mỗi lần nhập.`);
    return true;
  };

  const hideResultCategory = () => {
    if (!resultCategoryBadge) {
      return;
    }

    resultCategoryBadge.textContent = '';
    resultCategoryBadge.classList.add('hidden');
  };

  const showResultCategory = (category, prefix = 'Danh mục') => {
    if (!resultCategoryBadge) {
      return;
    }

    if (!category) {
      hideResultCategory();
      return;
    }

    const vi = category.vi || 'Chưa phân loại';
    const en = category.en || '';
    const suffix = en ? ` (${en})` : '';
    resultCategoryBadge.textContent = `${prefix}: ${vi}${suffix}`;
    resultCategoryBadge.classList.remove('hidden');
  };

  const providerLabelMap = {
    'internal-dictionary': 'Từ điển nội bộ',
    gemini: 'Gemini AI',
    openai: 'OpenAI',
    google: 'Google Translate',
    libretranslate: 'LibreTranslate',
    mymemory: 'MyMemory',
    backend: 'Backend API',
    'local-fallback': 'Fallback local',
  };

  const providerToneMap = {
    'internal-dictionary': 'bg-emerald-50 text-emerald-700',
    gemini: 'bg-violet-50 text-violet-700',
    openai: 'bg-indigo-50 text-indigo-700',
    google: 'bg-sky-50 text-sky-700',
    libretranslate: 'bg-cyan-50 text-cyan-700',
    mymemory: 'bg-amber-50 text-amber-700',
    backend: 'bg-slate-100 text-slate-700',
    'local-fallback': 'bg-rose-50 text-rose-700',
  };

  const showProviderBadge = (provider, fromCache = false) => {
    if (!resultSourceBadge) {
      return;
    }

    const key = String(provider || 'backend').trim();
    const cacheText = fromCache ? ' (cache)' : '';

    if (key === 'internal-dictionary') {
      resultSourceBadge.textContent = 'Nguồn: ASI101 (Đã kiểm chứng)';
      resultSourceBadge.className = 'mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700';
      resultSourceBadge.classList.remove('hidden');
      if (aiAttributionNote) {
        aiAttributionNote.classList.add('hidden');
      }
      return;
    }

    resultSourceBadge.textContent = `Dịch bởi AI${cacheText}`;
    resultSourceBadge.className = 'mb-4 rounded-lg bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700';
    resultSourceBadge.classList.remove('hidden');
    if (aiAttributionNote) {
      aiAttributionNote.classList.remove('hidden');
    }
  };

  const hideTranslationSourceBadge = () => {
    if (!resultSourceBadge) {
      return;
    }

    resultSourceBadge.textContent = '';
    resultSourceBadge.classList.add('hidden');
    if (aiAttributionNote) {
      aiAttributionNote.classList.add('hidden');
    }
  };

  const hideAiSuggestion = () => {
    if (!aiSuggestionPanel || !aiSuggestionContent) {
      return;
    }

    aiSuggestionContent.innerHTML = '';
    aiSuggestionPanel.classList.add('hidden');
  };

  const renderAiSuggestionSkeleton = () => {
    if (!aiSuggestionPanel || !aiSuggestionContent) {
      return;
    }

    aiSuggestionContent.innerHTML = `
      <div class="space-y-2.5 animate-pulse" aria-live="polite" aria-label="Đang tạo gợi ý AI">
        <div class="h-3 w-1/2 rounded bg-slate-200"></div>
        <div class="h-3 w-5/6 rounded bg-slate-200"></div>
        <div class="h-3 w-4/5 rounded bg-slate-200"></div>
        <div class="h-3 w-3/4 rounded bg-slate-200"></div>
        <div class="h-3 w-2/3 rounded bg-slate-200"></div>
      </div>
    `;
    aiSuggestionPanel.classList.remove('hidden');
  };

  const renderAiSuggestion = (term, provider = 'AI') => {
    if (!aiSuggestionPanel || !aiSuggestionContent || !term) {
      return;
    }

    const japaneseDisplay = `${term?.japanese?.kanji || '-'} (${term?.japanese?.romaji || 'N/A'})`;
    aiSuggestionContent.innerHTML = `
      <p><span class="font-semibold">Nguồn:</span> ${escapeHtml(provider)}</p>
      <p><span class="font-semibold">English:</span> ${escapeHtml(term.english || '-')}</p>
      <p><span class="font-semibold">Tiếng Việt:</span> ${escapeHtml(term.vietnamese || '-')}</p>
      <p><span class="font-semibold">日本語:</span> ${escapeHtml(japaneseDisplay)}</p>
      <p><span class="font-semibold">中文:</span> ${escapeHtml(term.chinese_simplified || '-')}</p>
    `;
    aiSuggestionPanel.classList.remove('hidden');
    if (aiAttributionNote) {
      aiAttributionNote.classList.remove('hidden');
    }
  };

  const scrollToLatestResult = () => {
    if (!resultSection) {
      return;
    }

    resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAIDictionary = async () => {
    await handleTranslate({ forceAI: true });
  };

  const showSlideMatch = (exists, matchedFrom = '', matchedTerm = '') => {
    if (!slideMatchBadge) {
      return;
    }

    if (!exists) {
      slideMatchBadge.textContent = '';
      slideMatchBadge.classList.add('hidden');
      return;
    }

    const sourceLabel = matchedFrom === 'english' ? 'English' : 'đầu vào';
    slideMatchBadge.textContent = `✓ Có trong slide (${sourceLabel}): ${matchedTerm}`;
    slideMatchBadge.classList.remove('hidden');
  };

  const showContributionStatus = (message, isError = false) => {
    if (!contributionStatus) {
      return;
    }

    contributionStatus.textContent = message;
    contributionStatus.classList.remove('text-slate-600', 'text-emerald-700', 'text-rose-700');
    contributionStatus.classList.add(isError ? 'text-rose-700' : 'text-emerald-700');
  };

  const showContributionToast = (message) => {
    if (!contributionToast) {
      return;
    }

    contributionToast.textContent = message;
    contributionToast.classList.add('show');
    clearTimeout(showContributionToast._timer);
    showContributionToast._timer = setTimeout(() => {
      contributionToast.classList.remove('show');
    }, 3200);
  };

  const getDefaultContributionCategories = () => [
    { key: 'auto', vi: 'Auto / Chưa rõ', en: 'Auto / Unspecified' },
    { key: 'engine', vi: 'Engine', en: 'Engine' },
    { key: 'brake', vi: 'Brake', en: 'Brake' },
    { key: 'ev', vi: 'EV', en: 'EV' },
    { key: 'chassis', vi: 'Chassis', en: 'Chassis' },
  ];

  const populateContributionCategorySelect = () => {
    if (!contribSystemCategory) {
      return;
    }

    const categoryMap = new Map();
    for (const category of getDefaultContributionCategories()) {
      categoryMap.set(category.key, category);
    }

    for (const category of categoryDefinitions || []) {
      if (!category?.key) {
        continue;
      }
      categoryMap.set(category.key, {
        key: category.key,
        vi: category.vi || category.en || category.key,
        en: category.en || category.vi || category.key,
      });
    }

    const previousValue = contribSystemCategory.value || 'auto';
    contribSystemCategory.innerHTML = Array.from(categoryMap.values())
      .map((category) => `<option value="${escapeHtml(category.key)}">${escapeHtml(category.en || category.vi || category.key)}</option>`)
      .join('');
    contribSystemCategory.value = categoryMap.has(previousValue) ? previousValue : 'auto';
  };

  const handleContributionAiSuggest = async () => {
    const sourceValue = sanitizeTranslationInput(contribSourceText?.value || '');
    if (!sourceValue) {
      showContributionStatus('Vui lòng nhập thuật ngữ gốc trước khi AI gợi ý.', true);
      return;
    }

    if (contribAiSuggestButton) {
      contribAiSuggestButton.disabled = true;
      contribAiSuggestButton.textContent = 'Đang gợi ý...';
    }

    try {
      const sourceLanguageHint = detectSourceLanguage(sourceValue);
      const aiSuggestion = await translateViaBackend(sourceValue, sourceLanguageHint, true);
      prefillContributionForm(sourceValue, aiSuggestion);
      showContributionStatus('AI đã tự điền các trường. Bạn kiểm tra lại rồi bấm Gửi.', false);
    } catch (error) {
      console.error('Contribution AI suggest failed:', error);
      showContributionStatus('Không thể lấy gợi ý AI lúc này. Vui lòng thử lại.', true);
    } finally {
      if (contribAiSuggestButton) {
        contribAiSuggestButton.disabled = false;
        contribAiSuggestButton.textContent = 'AI Gợi ý';
      }
    }
  };

  const renderTemporaryTerms = () => {
    if (!temporaryTermsPanel || !temporaryTermsList) {
      return;
    }

    if (!temporaryTranslatedTerms.length) {
      temporaryTermsPanel.classList.add('hidden');
      temporaryTermsList.innerHTML = '';
      return;
    }

    temporaryTermsPanel.classList.remove('hidden');
    temporaryTermsList.innerHTML = temporaryTranslatedTerms
      .map((item) => {
        const definitionSnippet = item.englishDefinition
          ? ` - ${escapeHtml(item.englishDefinition.slice(0, 140))}${item.englishDefinition.length > 140 ? '...' : ''}`
          : '';
        return `<li>- ${escapeHtml(item.input)} -> ${escapeHtml(item.english)} (${escapeHtml(item.provider)}, source: ${escapeHtml(item.detectedSourceLanguage)})${definitionSnippet}</li>`;
      })
      .join('');
  };

  const pushTemporaryTerm = (inputText, translatedTerm, provider) => {
    const normalizedInput = normalize(inputText);
    if (!normalizedInput) {
      return;
    }

    const exists = temporaryTranslatedTerms.some((item) => normalize(item.input) === normalizedInput);
    if (exists) {
      return;
    }

    temporaryTranslatedTerms.unshift({
      input: inputText,
      english: translatedTerm.english || '',
      provider,
      detectedSourceLanguage: translatedTerm.detectedSourceLanguage || 'en',
      englishDefinition: translatedTerm?.definitions?.english || '',
    });

    temporaryTranslatedTerms = temporaryTranslatedTerms.slice(0, 10);
    renderTemporaryTerms();
  };

  const normalizeCategory = (category) => {
    if (!category) {
      return { key: 'uncategorized', vi: 'Chưa phân loại', en: '' };
    }

    if (typeof category === 'string') {
      return { key: normalize(category).replace(/\s+/g, '_'), vi: category, en: '' };
    }

    return {
      key: category.key || normalize(category.vi || category.en || 'uncategorized').replace(/\s+/g, '_'),
      vi: category.vi || category.en || 'Chưa phân loại',
      en: category.en || '',
    };
  };

  const getModeFilteredTerms = (items = dictionaryTerms) =>
    strictModeEnabled ? items.filter((item) => item.isVerified) : items;

  const getScopedTerms = () => {
    const modeTerms = getModeFilteredTerms(dictionaryTerms);
    if (activeCategoryKey === 'all') {
      return modeTerms;
    }

    return modeTerms.filter((item) => item.category.key === activeCategoryKey);
  };

  const getScopedAsiTerms = () => getScopedTerms().filter((item) => item.source === 'ASI101');

  const toSearchTerms = (itemKey, term) => {
    const candidates = [
      itemKey,
      itemKey.replace(/_/g, ' '),
      term.english,
      term.vietnamese,
      term.japanese?.kanji,
      term.japanese?.romaji,
      term.chinese_simplified,
    ];

    return candidates.map(normalize).filter(Boolean);
  };

  const prefillContributionForm = (sourceInput, translatedTerm) => {
    if (!contributionForm) {
      return;
    }

    contribSourceText.value = String(sourceInput || '').trim();
    contribEnglish.value = translatedTerm?.english || '';
    contribVietnamese.value = translatedTerm?.vietnamese || '';
    contribJapaneseKanji.value = translatedTerm?.japanese?.kanji || '';
    contribJapaneseRomaji.value = translatedTerm?.japanese?.romaji || '';
    contribChinese.value = translatedTerm?.chinese_simplified || '';
  };

  // Browse Mode: render full term list of the selected category in a dedicated 4-column table.
  const renderBrowseMode = (categoryKey = activeCategoryKey) => {
    if (!browseModeTableBody || !browseModeCaption) {
      return;
    }

    const scoped = categoryKey === 'all'
      ? getModeFilteredTerms(dictionaryTerms)
      : getModeFilteredTerms(dictionaryTerms).filter((item) => item.category.key === categoryKey);

    const selectedCategory = categoryDefinitions.find((item) => item.key === categoryKey);
    const categoryLabel = categoryKey === 'all'
      ? 'Tất cả hệ thống'
      : selectedCategory?.vi || 'Hệ thống đã chọn';

    const modeLabel = strictModeEnabled ? 'đã kiểm chứng' : 'toàn bộ';
    browseModeCaption.textContent = `Browse Mode: ${categoryLabel} • ${scoped.length} thuật ngữ (${modeLabel})`;

    if (!scoped.length) {
      browseModeTableBody.innerHTML =
        '<tr><td colspan="4" class="px-4 py-4 text-center text-sm text-slate-500">Không có thuật ngữ trong hệ thống này.</td></tr>';
      return;
    }

    browseModeTableBody.innerHTML = scoped
      .map((item) => {
        const term = item.term;
        const japaneseDisplay = `${term.japanese.kanji} (${term.japanese.romaji})`;
        const sourceBadge = item.source === 'ASI101'
          ? '<a href="./asi101-source.html" target="_blank" rel="noopener noreferrer" class="ml-2 inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-200 transition" title="Nguồn: ASI101">ASI101</a>'
          : '';
        return `
          <tr>
            <td class="px-1 py-1.5 sm:px-2 sm:py-2">
              <div class="flex items-center justify-between gap-0 sm:gap-1">
                <span>${escapeHtml(term.english)}${sourceBadge}</span>
                ${renderSpeakButton(term.english, 'en-US', 'Phat am tieng Anh')}
              </div>
            </td>
            <td class="px-1 py-1.5 sm:px-2 sm:py-2">${escapeHtml(term.vietnamese)}</td>
            <td class="px-1 py-1.5 sm:px-2 sm:py-2">
              <div class="flex items-center justify-between gap-0 sm:gap-1">
                <span>${escapeHtml(japaneseDisplay)}</span>
                ${renderSpeakButton(japaneseDisplay, 'ja-JP', 'Phat am tieng Nhat')}
              </div>
            </td>
            <td class="px-1 py-1.5 sm:px-2 sm:py-2">
              <div class="flex items-center justify-between gap-0 sm:gap-1">
                <span>${escapeHtml(term.chinese_simplified)}</span>
                ${renderSpeakButton(term.chinese_simplified, 'zh-CN', 'Phat am tieng Trung')}
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  };

  const renderEmptyResults = (message = 'Chưa có dữ liệu hiển thị') => {
    resultTableBody.innerHTML =
      `<tr><td colspan="5" class="px-4 py-4 text-center text-sm text-slate-500">${escapeHtml(message)}</td></tr>`;

    resultCards.innerHTML =
      `<article class="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">${escapeHtml(message)}</article>`;

    if (resultExpandControls) {
      resultExpandControls.classList.add('hidden');
      resultExpandControls.classList.remove('flex');
    }

    hideTranslationSourceBadge();
  };

  const renderResultSkeleton = () => {
    resultTableBody.innerHTML = Array.from({ length: 3 }, () => `
      <tr class="animate-pulse">
        <td class="px-1 py-2 sm:px-2 sm:py-2"><div class="h-3 rounded bg-slate-200 w-5/6"></div></td>
        <td class="px-1 py-2 sm:px-2 sm:py-2"><div class="h-3 rounded bg-slate-200 w-4/5"></div></td>
        <td class="px-1 py-2 sm:px-2 sm:py-2"><div class="h-3 rounded bg-slate-200 w-4/5"></div></td>
        <td class="px-1 py-2 sm:px-2 sm:py-2"><div class="h-3 rounded bg-slate-200 w-3/4"></div></td>
        <td class="px-1 py-2 sm:px-2 sm:py-2"><div class="h-3 rounded bg-slate-200 w-3/4"></div></td>
      </tr>
    `).join('');

    resultCards.innerHTML = `
      <article class="rounded-xl border border-slate-200 bg-white p-4 animate-pulse">
        <div class="h-3 w-1/3 rounded bg-slate-200"></div>
        <div class="mt-2 h-4 w-3/4 rounded bg-slate-200"></div>
        <div class="mt-4 space-y-2">
          <div class="h-3 w-full rounded bg-slate-200"></div>
          <div class="h-3 w-5/6 rounded bg-slate-200"></div>
          <div class="h-3 w-4/6 rounded bg-slate-200"></div>
        </div>
      </article>
    `;

    if (resultExpandControls) {
      resultExpandControls.classList.add('hidden');
      resultExpandControls.classList.remove('flex');
    }

    hideTranslationSourceBadge();
  };

  const updateResultExpandControls = ({ totalCount, visibleCount, canCollapse }) => {
    if (!resultExpandControls || !resultExpandHint || !resultExpandButtonText) {
      return;
    }

    if (!canCollapse) {
      resultExpandControls.classList.add('hidden');
      resultExpandControls.classList.remove('flex');
      return;
    }

    resultExpandControls.classList.remove('hidden');
    resultExpandControls.classList.add('flex');
    resultExpandHint.textContent = `Đang hiển thị ${visibleCount}/${totalCount} thuật ngữ`;
    resultExpandButtonText.textContent = resultExpandAll
      ? 'Thu gọn'
      : `Xem thêm (${Math.max(0, totalCount - visibleCount)})`;
  };

  const renderResultsList = (items, options = {}) => {
    const { allowCollapse = true, resetExpand = false } = options;

    if (resetExpand) {
      resultExpandAll = false;
    }

    lastParallelItems = Array.isArray(items) ? items.slice() : [];

    if (!items.length) {
      renderEmptyResults('Không có thuật ngữ trong danh mục này.');
      return;
    }

    const canCollapse = allowCollapse && items.length > INITIAL_PARALLEL_RESULTS_LIMIT;
    const visibleItems = canCollapse && !resultExpandAll
      ? items.slice(0, INITIAL_PARALLEL_RESULTS_LIMIT)
      : items;

    resultTableBody.innerHTML = visibleItems
      .map((item) => {
        const term = item.term;
        const japaneseDisplay = `${term.japanese.kanji} (${term.japanese.romaji})`;
        const categoryVi = item.category.vi;
        const sourceLabel = item.source === 'ASI101' 
          ? `<a href="./asi101-source.html" target="_blank" rel="noopener noreferrer" title="Từ bài giảng ASI101" class="inline-block mt-1 text-[11px] font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md transition">📚 ASI101</a>`
          : `<p class="mt-1 text-[11px] font-semibold ${item.isVerified ? 'text-emerald-600' : 'text-amber-600'}">${item.isVerified ? 'Da kiem chung' : 'Tu dong - can duyet'}</p>`;
        
        return `
          <tr>
            <td class="px-1 py-1.5 sm:px-2 sm:py-2 font-medium">
              <p>${escapeHtml(term.vietnamese)}</p>
              <p class="mt-1 text-xs font-medium text-slate-500">${escapeHtml(categoryVi)}</p>
              ${sourceLabel}
            </td>
            <td class="px-1 py-1.5 sm:px-2 sm:py-2">
              <div class="flex items-center justify-between gap-0 sm:gap-1">
                <div>
                  <span>${escapeHtml(term.english)}</span>
                  <p class="mt-0.5 text-[10px] text-slate-500">IPA: <span data-english-phonetic-target="${encodeDataAttr(term.english)}">Dang tao IPA...</span></p>
                </div>
                ${renderSpeakButton(term.english, 'en-US', 'Phat am tieng Anh')}
              </div>
            </td>
            <td class="px-1 py-1.5 sm:px-2 sm:py-2">${escapeHtml(term.vietnamese)}</td>
            <td class="px-1 py-1.5 sm:px-2 sm:py-2">
              <div class="flex items-center justify-between gap-0 sm:gap-1">
                <span>${escapeHtml(japaneseDisplay)}</span>
                ${renderSpeakButton(japaneseDisplay, 'ja-JP', 'Phat am tieng Nhat')}
              </div>
            </td>
            <td class="px-1 py-1.5 sm:px-2 sm:py-2">
              <div class="flex items-center justify-between gap-0 sm:gap-1">
                <div>
                  <span>${escapeHtml(term.chinese_simplified)}</span>
                  <p class="mt-0.5 text-[10px] text-slate-500">Pinyin: <span data-chinese-pinyin-target="${encodeDataAttr(term.chinese_simplified)}">Dang tao...</span></p>
                </div>
                ${renderSpeakButton(term.chinese_simplified, 'zh-CN', 'Phat am tieng Trung')}
              </div>
            </td>
            <td class="px-1 py-1.5 sm:px-2 sm:py-2 text-center">
              <div class="flex items-center justify-center gap-1 flex-wrap">
                <button type="button" id="savevocab-${encodeURIComponent(term.english)}" class="save-vocab-btn inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 transition dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50" title="Lưu vào từ vựng của tôi" onclick="saveVocabToList('${encodeDataText(term.english)}', '${encodeDataText(term.vietnamese)}', '${encodeDataText(term.japanese.kanji)}', '${encodeDataText(term.chinese_simplified)}', this)">
                  ⭐ Lưu
                </button>
                <button type="button" onclick="openFeedbackModal('${encodeDataText(term.english)}', '${encodeDataText(term.vietnamese)}')" class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 transition dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50" title="Báo lỗi hoặc gợi ý cho thuật ngữ này">
                  🐛 Báo lỗi
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    resultCards.innerHTML = visibleItems
      .map((item) => {
        const term = item.term;
        const japaneseDisplay = `${term.japanese.kanji} (${term.japanese.romaji})`;
        const sourceLabel = item.source === 'ASI101' 
          ? `<a href="./asi101-source.html" target="_blank" rel="noopener noreferrer" title="Từ bài giảng ASI101" class="inline-block mt-1 text-[11px] font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-md transition">📚 ASI101</a>`
          : `<p class="mt-1 text-[11px] font-semibold ${item.isVerified ? 'text-emerald-600' : 'text-amber-600'}">${item.isVerified ? 'Da kiem chung' : 'Tu dong - can duyet'}</p>`;

        return `
          <article class="rounded-xl border border-slate-200 bg-white p-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(item.category.vi)}</p>
            <p class="mt-1 font-semibold text-slate-900">${escapeHtml(term.vietnamese)}</p>
            ${sourceLabel}
            <div class="mt-3 space-y-2 text-sm text-slate-700">
              ${renderSpeakRow('English', term.english, 'en-US', 'Phat am tieng Anh')}
              <p><span class="font-semibold">IPA:</span> <span data-english-phonetic-target="${encodeDataAttr(term.english)}">Dang tao IPA...</span></p>
              <p><span class="font-semibold">Tiếng Việt:</span> ${escapeHtml(term.vietnamese)}</p>
              ${renderSpeakRow('日本語', japaneseDisplay, 'ja-JP', 'Phat am tieng Nhat')}
              ${renderSpeakRow('中文', term.chinese_simplified, 'zh-CN', 'Phat am tieng Trung')}
              <p><span class="font-semibold">Pinyin:</span> <span data-chinese-pinyin-target="${encodeDataAttr(term.chinese_simplified)}">Dang tao...</span></p>
              <div class="pt-1">
                <button type="button" onclick="openFeedbackModal('${encodeDataText(term.english)}', '${encodeDataText(term.vietnamese)}')" class="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs bg-amber-100 text-amber-700 hover:bg-amber-200 transition" title="Báo lỗi hoặc gợi ý cho thuật ngữ này">
                  🐛 Báo lỗi
                </button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    hydrateResultPhonetics();

    updateResultExpandControls({
      totalCount: items.length,
      visibleCount: visibleItems.length,
      canCollapse,
    });
  };

  const renderResult = (item) => {
    resultExpandAll = false;
    renderResultsList([item], { allowCollapse: false });
  };

  const renderQuadLangView = (item) => {
    if (!quadLangView) {
      return;
    }

    currentQuadLangData = item;

    const term = item?.term || {};
    const japaneseDisplay = `${term.japanese?.kanji || '-'} (${term.japanese?.romaji || '-'})`;

    if (quadLangEnglish) quadLangEnglish.textContent = escapeHtml(term.english || '-');
    if (quadLangEnglishPhonetic) {
      quadLangEnglishPhonetic.textContent = 'Dang tao IPA...';
      getEnglishPhoneticForText(term.english || '')
        .then((value) => {
          quadLangEnglishPhonetic.textContent = value || 'Khong co IPA';
        })
        .catch(() => {
          quadLangEnglishPhonetic.textContent = 'Khong co IPA';
        });
    }
    if (quadLangVietnamese) quadLangVietnamese.textContent = escapeHtml(term.vietnamese || '-');
    if (quadLangJaKanji) quadLangJaKanji.textContent = escapeHtml(term.japanese?.kanji || '-');
    if (quadLangJaRomaji) quadLangJaRomaji.textContent = escapeHtml(term.japanese?.romaji || '-');
    if (quadLangChinese) quadLangChinese.textContent = escapeHtml(term.chinese_simplified || '-');
    if (quadLangChinesePinyin) quadLangChinesePinyin.textContent = getChinesePinyin(term.chinese_simplified || '');

    quadLangView.classList.remove('hidden');
  };

  const toggleQuadLangView = () => {
    if (!quadLangToggle || !quadLangView) {
      return;
    }

    quadLangViewMode = !quadLangViewMode;
    quadLangToggle.classList.toggle('bg-indigo-100', quadLangViewMode);
    quadLangToggle.classList.toggle('text-indigo-700', quadLangViewMode);
    quadLangToggle.classList.toggle('border-indigo-300', quadLangViewMode);

    if (quadLangViewMode) {
      if (currentQuadLangData) {
        quadLangView.classList.remove('hidden');
      } else {
        quadLangView.classList.add('hidden');
      }
    } else {
      quadLangView.classList.add('hidden');
    }
  };

  const renderCategoryButtons = () => {
    if (!categoryFilterButtons) {
      return;
    }

    const modeTerms = getModeFilteredTerms(dictionaryTerms);
    const countsByCategory = new Map();
    for (const item of modeTerms) {
      const key = item?.category?.key || 'uncategorized';
      countsByCategory.set(key, (countsByCategory.get(key) || 0) + 1);
    }

    const buttons = [
      { key: 'all', vi: 'Tất cả hệ thống', en: 'All Systems' },
      ...categoryDefinitions,
    ];

    categoryFilterButtons.innerHTML = buttons
      .map((category) => {
        const isActive = category.key === activeCategoryKey;
        const count = category.key === 'all'
          ? modeTerms.length
          : (countsByCategory.get(category.key) || 0);

        const activeClass = isActive
          ? 'border-slate-800 bg-slate-900 text-white shadow-sm'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50';

        return `
          <button
            type="button"
            data-category-key="${escapeHtml(category.key)}"
            class="w-full rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${activeClass}"
          >
            <span class="block">${escapeHtml(category.vi)}</span>
            <span class="mt-0.5 block text-xs font-medium ${isActive ? 'text-slate-200' : 'text-slate-500'}">${escapeHtml(category.en)} • ${count} từ</span>
          </button>
        `;
      })
      .join('');
  };

  const renderActiveCategoryLabel = () => {
    if (!activeCategoryLabel) {
      return;
    }

    if (activeCategoryKey === 'all') {
      activeCategoryLabel.textContent = 'Đang xem: Tất cả hệ thống';
      return;
    }

    const selected = categoryDefinitions.find((item) => item.key === activeCategoryKey);
    if (!selected) {
      activeCategoryLabel.textContent = 'Đang xem: Tất cả hệ thống';
      return;
    }

    activeCategoryLabel.textContent = `Đang xem: ${selected.vi}`;
  };

  const renderFilteredTerms = ({ showFilterBadge = true } = {}) => {
    const scoped = getScopedTerms();
    renderResultsList(scoped, { allowCollapse: true, resetExpand: true });
    hideTranslationSourceBadge();

    if (!showFilterBadge) {
      return;
    }

    if (activeCategoryKey === 'all') {
      showResultCategory({ vi: 'Tất cả hệ thống', en: 'All Systems' }, 'Bộ lọc');
      return;
    }

    const selected = categoryDefinitions.find((item) => item.key === activeCategoryKey);
    showResultCategory(selected, 'Bộ lọc');
  };

  const setActiveCategory = (key) => {
    activeCategoryKey = key || 'all';
    renderCategoryButtons();
    renderActiveCategoryLabel();
    renderFilteredTerms();
    renderBrowseMode(activeCategoryKey);
    showSlideMatch(false);
    showStatus('');
  };

  const renderQualityModeLabel = () => {
    if (!qualityModeLabel) {
      return;
    }

    qualityModeLabel.textContent = strictModeEnabled
      ? 'Đang bật: Chỉ dùng thuật ngữ đã kiểm chứng.'
      : 'Đang tắt: Hiển thị cả dữ liệu tự động cần kiểm tra.';
  };

  const speakTerm = (text, lang) => {
    if (!('speechSynthesis' in window)) {
      showStatus('Trình duyệt không hỗ trợ phát âm.');
      return;
    }

    const cleanedText = String(text || '').trim();
    if (!cleanedText) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  const findTerm = (query, searchPool = dictionaryTerms) => {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) {
      return null;
    }

    const allowedKeys = new Set(searchPool.map((item) => item.key));

    const exact = dictionaryLookup.get(normalizedQuery);
    if (exact && allowedKeys.has(exact.key)) {
      if (strictModeEnabled && !exact.isVerified) {
        return null;
      }
      return exact;
    }

    const looseInput = normalizeLoose(query);
    if (!looseInput) {
      return null;
    }

    for (const entry of dictionaryAliases) {
      if (!allowedKeys.has(entry.item.key)) {
        continue;
      }

      if (strictModeEnabled && !entry.item.isVerified) {
        continue;
      }

      const alias = entry.alias;
      if (!alias || alias.length < 3) {
        continue;
      }

      if (alias.includes(' ')) {
        if (looseInput.includes(alias)) {
          return entry.item;
        }
        continue;
      }

      const wrapped = ` ${looseInput} `;
      if (wrapped.includes(` ${alias} `)) {
        return entry.item;
      }
    }

    return null;
  };

  const detectSourceLanguage = (input) => {
    const text = String(input || '').trim();
    if (!text) {
      return 'en';
    }

    const vietnameseRegex = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i;
    const hiraganaRegex = /[\u3040-\u309F]/;
    const katakanaRegex = /[\u30A0-\u30FF\u31F0-\u31FF\uFF66-\uFF9D]/;
    const cjkRegex = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/;
    const japanesePunctuationRegex = /[々〆ヵヶー「」『』【】]/;
    const chinesePunctuationRegex = /[，。！？；：（）《》“”‘’、]/;
    const chineseFunctionWordsRegex = /[的了在是和与及为对把被将]/;

    if (vietnameseRegex.test(text)) {
      return 'vi';
    }

    const hasHiragana = hiraganaRegex.test(text);
    const hasKatakana = katakanaRegex.test(text);
    if (hasHiragana || hasKatakana) {
      return 'ja';
    }

    if (cjkRegex.test(text)) {
      if (japanesePunctuationRegex.test(text)) {
        return 'ja';
      }

      if (chinesePunctuationRegex.test(text) || chineseFunctionWordsRegex.test(text)) {
        return 'zh-CN';
      }

      return 'zh-CN';
    }

    return 'en';
  };

  const translateViaBackend = async (text, sourceLanguageHint, forceAI = false, aiInstruction = '', preserveLineBreaks = false) => {
    const cleanedText = preserveLineBreaks
      ? sanitizeMultilineTranslationInput(text)
      : sanitizeTranslationInput(text);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, TRANSLATE_REQUEST_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(TRANSLATE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cleanedText, sourceLanguageHint, includeDefinitions: false, forceAI, aiInstruction }),
        signal: controller.signal,
      });
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error('Backend timeout');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Backend HTTP ${response.status}`);
    }

    const data = await response.json();
    const japaneseKanji = data?.japanese?.kanji || '';
    const japaneseRomaji = data?.japanese?.romaji || 'N/A';

    return {
      english: data?.english || '',
      vietnamese: data?.vietnamese || '',
      japanese: {
        kanji: japaneseKanji,
        romaji: japaneseRomaji,
      },
      chinese_simplified: data?.chinese_simplified || '',
      provider: data?.provider || 'backend',
      fromCache: Boolean(data?.fromCache),
      detectedSourceLanguage: data?.detected_source_language || 'en',
      definitions: data?.definitions || {},
    };
  };

  const checkSlideTermPresence = async (text, english) => {
    const response = await fetch('/api/slide-term-check', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, english }),
    });

    if (!response.ok) {
      throw new Error(`Slide check HTTP ${response.status}`);
    }

    return response.json();
  };

  const restoreVietnameseOcrWithAi = async (rawText) => {
    const text = String(rawText || '').trim();
    if (!text) {
      return text;
    }

    // Kiểm tra xem văn bản có phải là tiếng Việt (có hoặc không có dấu)
    const hasVietnameseDiacritics = /[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i.test(text);
    
    // Từ vựng automotive chuyên ngành tiếng Việt (có thể bị quét sai)
    // Regex tìm từ riêng hoặc chuỗi con
    const automotiveVietnamesePatterns = [
      /ly\s*hop/i,       // lý hợp
      /banh\s*da/i,      // bánh đà
      /hop\s*s[oa0]?/i,  // hộp số
      /mom\s*men/i,      // mô men xoắn
      /xi\s*lanh/i,      // xi lanh
      /dau\s*may/i,      // dầu máy
      /phan\s*ngat/i,    // phần ngắt
      /ket\s*noi/i,      // kết nối
      /o\s*to/i,         // ô tô
      /dong\s*co/i,      // động cơ
    ];
    
    const hasAutomotiveKeywords = automotiveVietnamesePatterns.some(pattern => pattern.test(text));
    const mightBeVietnamese = hasVietnameseDiacritics || hasAutomotiveKeywords;

    console.log('[restoreVietnameseOcrWithAi] Input:', text);
    console.log('[restoreVietnameseOcrWithAi] Has diacritics:', hasVietnameseDiacritics);
    console.log('[restoreVietnameseOcrWithAi] Has automotive keywords:', hasAutomotiveKeywords);
    console.log('[restoreVietnameseOcrWithAi] Might be Vietnamese:', mightBeVietnamese);

    if (!mightBeVietnamese) {
      console.log('[restoreVietnameseOcrWithAi] Not detected as Vietnamese, skipping');
      return text;
    }

    const vietnamseRestoreInstruction = `Đây là văn bản chuyên ngành ô tô tiếng Việt bị quét lỗi từ ảnh mờ. Nhiệm vụ:
1. Khôi phục lại từng dòng thành câu tiếng Việt hoàn chỉnh, chính tả đúng 100%, có dấu
2. Dựa vào từ vựng ô tô để sửa lỗi quét, điền ký tự bị mất
3. GIỮ NGUYÊN cấu trúc dòng - mỗi câu trên 1 dòng, không nối dòng

Từ vựng tham khảo:
- ly hợp (Clutch) | bánh đà (Flywheel) | hộp số (Transmission) | mô men xoắn (Torque)
- xi lanh (Cylinder) | dầu máy (Engine oil) | piston | bộ phận ngắt | kết nối
- ổ bi (Bearing) | trục cam (Camshaft) | bugi (Spark plug) | cánh quạt | van xả

Ví dụ sửa:
- "ly hop 14 bd phan ngat" → "Lý hợp có 14 bánh phanh ngắt"
- "hop sb" → "hộp số"
- "ket ndi" → "kết nối"
- "mé men soan" → "mô men xoắn"

Chỉ trả text đã khôi phục, không markdown`;

    try {
      const response = await fetch(OCR_RESTORE_VI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, instruction: vietnamseRestoreInstruction }),
      });

      if (!response.ok) {
        throw new Error(`VI restoration HTTP ${response.status}`);
      }

      const payload = await response.json();
      const correctedText = sanitizeMultilineTranslationInput(payload?.restoredText || '');
      if (!correctedText) {
        return text;
      }

      const sourceLineCount = text.split('\n').length;
      const correctedLineCount = correctedText.split('\n').length;
      if (sourceLineCount > 1 && correctedLineCount === 1) {
        return text;
      }

      return correctedText;
    } catch (error) {
      console.warn('Vietnamese OCR restoration failed, using original text:', error);
      return text;
    }
  };

  const correctOcrTextWithAi = async (rawText) => {
    const cleanedRaw = normalizeMultilineOcrText(rawText);
    if (!cleanedRaw) {
      return '';
    }

    const sourceLanguageHint = detectSourceLanguage(cleanedRaw);
    const correctionInstruction = sourceLanguageHint === 'vi' 
      ? 'Đây là kết quả quét từ ảnh mờ tiếng Việt chuyên ngành ô tô. Sửa lỗi chính tả, thêm dấu, giữ nguyên cấu trúc dòng. Chỉ trả text sửa trong english field.'
      : 'Đây là kết quả quét từ ảnh mờ chuyên ngành ô tô tiếng Anh. Sửa các từ bị quét sai (ví dụ: temparalure→temperature, systm→system). Giữ cấu trúc dòng, không nối dòng. Chỉ trả text sửa trong english field.';

    try {
      const correctedResult = await translateViaBackend(cleanedRaw, sourceLanguageHint, true, correctionInstruction, true);
      const correctedText = sanitizeMultilineTranslationInput(correctedResult?.english || '');
      if (!correctedText) {
        return cleanedRaw;
      }

      const sourceLineCount = cleanedRaw.split('\n').length;
      const correctedLineCount = correctedText.split('\n').length;
      if (sourceLineCount > 1 && correctedLineCount === 1) {
        return cleanedRaw;
      }

      return correctedText;
    } catch (error) {
      console.warn('AI OCR correction failed, using raw OCR text:', error);
      return cleanedRaw;
    }
  };

  const handleTranslate = async (options = {}) => {
    const forceAI = Boolean(options?.forceAI);
    const skipAiForVietnamese = Boolean(options?.skipAiForVietnamese);
    
    setTranslateLoading(true, forceAI);
    hideTranslationSourceBadge();
    if (!forceAI) {
      hideAiSuggestion();
    }

    try {
      enforceSourceWordLimit();
      const inputValue = sanitizeTranslationInput(sourceText.value);
      const normalizedInput = getTranslationCacheKey(inputValue);
      const sourceLanguageHint = detectSourceLanguage(inputValue);

      if (!normalizedInput) {
        showStatus('Vui lòng nhập thuật ngữ cần dịch.');
        renderFilteredTerms();
        showSlideMatch(false);
        hideResultCategory();
        hideTranslationSourceBadge();
        return;
      }

      const scopedAsiTerms = getScopedAsiTerms();
      const asiFound = findTerm(inputValue, scopedAsiTerms);

      if (asiFound) {
        showStatus(`Đã tìm thấy trong ASI101. Ngôn ngữ đầu vào nhận diện: ${sourceLanguageHint}.`);
        showResultCategory(asiFound.category, 'Thuộc hệ thống');
        showProviderBadge('internal-dictionary', false);
        renderResult(asiFound);
        renderQuadLangView(asiFound);
        prefillContributionForm(inputValue, asiFound.term);
        scrollToLatestResult();

        try {
          const slideCheck = await checkSlideTermPresence(inputValue, asiFound.term.english);
          showSlideMatch(Boolean(slideCheck?.existsInSlides), slideCheck?.matchedFrom, slideCheck?.matchedTerm);
        } catch (slideError) {
          console.warn('Slide check failed:', slideError);
          showSlideMatch(false);
        }

        // Skip AI for restored Vietnamese
        if (skipAiForVietnamese && sourceLanguageHint === 'vi') {
          showStatus('Đã khôi phục văn bản tiếng Việt từ OCR, chỉ hiển thị từ ASI101.');
          return;
        }

        if (forceAI) {
          try {
            showStatus('Trợ lý AI đang xử lý bản dịch...');
            renderAiSuggestionSkeleton();
            const aiSuggestion = await translateViaBackend(inputValue, sourceLanguageHint, true);
            renderAiSuggestion(aiSuggestion, aiSuggestion.provider || 'AI');
            showStatus('Đã hiển thị kết quả ASI101 và gợi ý từ AI.');
            scrollToLatestResult();
          } catch (error) {
            hideAiSuggestion();
            showStatus('Kết nối AI đang bận, vui lòng thử lại sau giây lát');
          }
        }

        return;
      }

      // If skipAiForVietnamese and Vietnamese, don't translate
      if (skipAiForVietnamese && sourceLanguageHint === 'vi') {
        showStatus('Đã khôi phục văn bản tiếng Việt. Hiện tại chỉ tra cứu ASI101.');
        hideResultCategory();
        renderEmptyResults('Không tìm thấy trong ASI101. Văn bản này đã được khôi phục từ OCR và không được dịch lại.');
        return;
      }

      if (forceAI && aiApiOnline === false) {
        showStatus('API AI chưa sẵn sàng. Bạn có thể thử lại sau vài giây.');
        return;
      }

      if (forceAI) {
        renderResultSkeleton();
      }

      if (strictModeEnabled) {
        showStatus('Đang tối ưu hóa kết quả dịch chuyên ngành...');
      } else {
        showStatus('Đang tối ưu hóa kết quả dịch chuyên ngành...');
      }
      setTranslateLoading(true, true);
      hideResultCategory();
      showSlideMatch(false);

      const cachedRuntime = getCachedAiTranslation(normalizedInput);
      if (cachedRuntime) {
        const cachedItem = {
          key: 'runtime-cache',
          term: cachedRuntime,
          category: { key: 'uncategorized', vi: 'Bản dịch tạm thời', en: 'Temporary Translation' },
        };
        renderResult(cachedItem);
        renderQuadLangView(cachedItem);
        showProviderBadge(cachedRuntime.provider, true);
        prefillContributionForm(inputValue, cachedRuntime);
        showSlideMatch(false);
        scrollToLatestResult();
        return;
      }

      try {
        const backendResult = await translateViaBackend(inputValue, sourceLanguageHint, true);
        setCachedAiTranslation(normalizedInput, backendResult);

        const cacheHint = backendResult.fromCache ? ' (cache)' : '';

        const backendItem = {
          key: 'backend-result',
          term: backendResult,
          category: { key: 'uncategorized', vi: 'Bản dịch API', en: 'API Translation' },
        };
        setAiApiStatus(true, 'API AI: Sẵn sàng');
        renderResult(backendItem);
        renderQuadLangView(backendItem);
        scrollToLatestResult();

        const categoryFromGlobal = findTerm(backendResult.english, getScopedTerms());
        if (categoryFromGlobal) {
          showResultCategory(categoryFromGlobal.category, 'Thuộc hệ thống');
        }
        showProviderBadge(backendResult.provider, backendResult.fromCache);

        pushTemporaryTerm(inputValue, backendResult, 'AI');
        prefillContributionForm(inputValue, backendResult);
        showStatus(`Đã dịch bởi AI${cacheHint}. Ngôn ngữ đầu vào: ${backendResult.detectedSourceLanguage}.`);

        try {
          const slideCheck = await checkSlideTermPresence(inputValue, backendResult.english);
          showSlideMatch(Boolean(slideCheck?.existsInSlides), slideCheck?.matchedFrom, slideCheck?.matchedTerm);
        } catch (slideError) {
          console.warn('Slide check failed:', slideError);
          showSlideMatch(false);
        }
      } catch (error) {
        console.error('Backend translation failed:', error);
        setAiApiStatus(false, 'API AI: Chưa sẵn sàng, sẽ tự thử lại');
        showStatus('Kết nối AI đang bận, vui lòng thử lại sau giây lát');
        renderFilteredTerms();
        showSlideMatch(false);
      }
    } finally {
      setTranslateLoading(false, false);
    }
  };

  const loadDictionary = async () => {
    try {
      const [mainResponse, verifiedResponse, asiResponse] = await Promise.allSettled([
        fetch('dictionary.json', { cache: 'no-store' }),
        fetch('verified-terms.json', { cache: 'no-store' }),
        fetch('asi-system-terms.json', { cache: 'no-store' }),
      ]);

      if (mainResponse.status !== 'fulfilled' || !mainResponse.value.ok) {
        const statusCode = mainResponse.status === 'fulfilled' ? mainResponse.value.status : 'fetch-error';
        throw new Error(`dictionary.json HTTP ${statusCode}`);
      }

      const mainData = await mainResponse.value.json();
      const mainTerms = mainData?.terms || {};
      const mainCategories = Array.isArray(mainData?.categories) ? mainData.categories : [];

      let verifiedData = { terms: {}, categories: [] };
      if (verifiedResponse.status === 'fulfilled' && verifiedResponse.value.ok) {
        verifiedData = await verifiedResponse.value.json();
      }
      const verifiedTerms = verifiedData?.terms || {};
      const verifiedCategories = Array.isArray(verifiedData?.categories) ? verifiedData.categories : [];

      let asiData = { terms: {}, categories: [] };
      if (asiResponse.status === 'fulfilled' && asiResponse.value.ok) {
        asiData = await asiResponse.value.json();
      }

      const asiTerms = asiData?.terms || {};

      const mergedCategoryMap = new Map();
      for (const category of [...mainCategories, ...verifiedCategories, ...(Array.isArray(asiData?.categories) ? asiData.categories : [])]) {
        const normalized = normalizeCategory(category);
        if (!mergedCategoryMap.has(normalized.key)) {
          mergedCategoryMap.set(normalized.key, normalized);
        }
      }

      categoryDefinitions = Array.from(mergedCategoryMap.values());

      const asiTermKeys = new Set(Object.keys(asiTerms));
      const asiSearchTermSet = new Set();
      const asiFrequencyBySearchTerm = new Map();

      const buildAsiSearchTerms = (entryKey, entryTerm) => {
        const rawCandidates = [
          entryKey,
          String(entryKey || '').replace(/_/g, ' '),
          entryTerm?.english,
          entryTerm?.vietnamese,
          entryTerm?.japanese?.kanji,
          entryTerm?.japanese?.romaji,
          entryTerm?.chinese_simplified,
        ];

        return rawCandidates.map(normalize).filter(Boolean);
      };

      for (const [asiKey, asiTerm] of Object.entries(asiTerms)) {
        const frequencyValue = Number(asiTerm?.frequency || 0);
        const searchTerms = buildAsiSearchTerms(asiKey, asiTerm);

        for (const searchTerm of searchTerms) {
          asiSearchTermSet.add(searchTerm);
          const existingFrequency = asiFrequencyBySearchTerm.get(searchTerm) || 0;
          if (frequencyValue > existingFrequency) {
            asiFrequencyBySearchTerm.set(searchTerm, frequencyValue);
          }
        }
      }

      const isAsiBackedTerm = (entryKey, entryTerm) => {
        if (asiTermKeys.has(entryKey)) {
          return true;
        }

        const searchTerms = buildAsiSearchTerms(entryKey, entryTerm);
        return searchTerms.some((searchTerm) => asiSearchTermSet.has(searchTerm));
      };

      const resolveAsiFrequency = (entryKey, entryTerm) => {
        if (asiTerms?.[entryKey]?.frequency) {
          return Number(asiTerms[entryKey].frequency) || 0;
        }

        let bestFrequency = 0;
        const searchTerms = buildAsiSearchTerms(entryKey, entryTerm);
        for (const searchTerm of searchTerms) {
          const candidateFrequency = asiFrequencyBySearchTerm.get(searchTerm) || 0;
          if (candidateFrequency > bestFrequency) {
            bestFrequency = candidateFrequency;
          }
        }

        return bestFrequency;
      };

      const verifiedMap = new Map([
        ...Object.entries(mainTerms),
        ...Object.entries(verifiedTerms),
      ]);

      const verifiedEntries = Array.from(verifiedMap.entries()).map(([key, term]) => {
        const hasAsiSource = isAsiBackedTerm(key, term);
        return {
          key,
          term,
          isVerified: true,
          source: hasAsiSource ? 'ASI101' : 'verified',
          frequency: hasAsiSource ? resolveAsiFrequency(key, term) : 0,
        };
      });
      const asiEntries = Object.entries(asiTerms)
        .filter(([key]) => !verifiedMap.has(key))
        .map(([key, term]) => ({ key, term, isVerified: true, source: 'ASI101', frequency: term.frequency || 0 }));

      dictionaryTerms = [...verifiedEntries, ...asiEntries].map(({ key, term, isVerified, source, frequency }) => {
        const category = normalizeCategory(term.category);
        const normalizedTerm = {
          english: String(term.english || '').trim(),
          vietnamese: String(term.vietnamese || term.english || '').trim(),
          japanese: {
            kanji: String(term?.japanese?.kanji || term.english || '').trim(),
            romaji: String(term?.japanese?.romaji || term.english || '').trim(),
          },
          chinese_simplified: String(term.chinese_simplified || term.english || '').trim(),
        };

        return {
          key,
          term: normalizedTerm,
          category,
          isVerified,
          source: source || 'system',
          frequency: frequency || 0,
          searchTerms: toSearchTerms(key, normalizedTerm),
        };
      });

      if (!categoryDefinitions.length) {
        const unique = new Map();
        for (const item of dictionaryTerms) {
          if (!unique.has(item.category.key)) {
            unique.set(item.category.key, {
              key: item.category.key,
              vi: item.category.vi,
              en: item.category.en,
            });
          }
        }
        categoryDefinitions = Array.from(unique.values());
      }

      dictionaryLookup = new Map();
      dictionaryAliases = [];

      for (const item of dictionaryTerms) {
        for (const searchTerm of item.searchTerms) {
          if (!dictionaryLookup.has(searchTerm)) {
            dictionaryLookup.set(searchTerm, item);
          }

          dictionaryAliases.push({ alias: normalizeLoose(searchTerm), item });
        }
      }

      dictionaryAliases.sort((a, b) => b.alias.length - a.alias.length);
      renderCategoryButtons();
      renderActiveCategoryLabel();
      renderQualityModeLabel();
      renderFilteredTerms();
      renderBrowseMode(activeCategoryKey);
      const verifiedCount = dictionaryTerms.filter((item) => item.isVerified).length;
      const asi101Count = dictionaryTerms.filter((item) => item.source === 'ASI101').length;
      populateContributionCategorySelect();
      showStatus(`Đã nạp ${dictionaryTerms.length} thuật ngữ (${asi101Count} từ ASI101, ${verifiedCount - asi101Count} kiểm chứng).`);
    } catch (error) {
      console.error('Cannot load dictionary.json:', error);
      showStatus('Không thể tải dữ liệu từ dictionary.json');
      dictionaryTerms = [];
      categoryDefinitions = [];
      populateContributionCategorySelect();
      hideResultCategory();
      renderEmptyResults();
    }
  };

  const handleOcrImage = async (file) => {
    if (!file) {
      return;
    }

    currentOcrFile = file;

    setOcrLoading(true, 0, 'Đang chuẩn bị ảnh...');
    setOcrInputAreaState({ processing: true });
    await showOcrPreview(file);

    let extractedText = '';

    try {
      // Multi-modal OCR first: send image base64 to GPT-4o Vision.
      setOcrLoading(true, 15, 'Đang nhận diện trực tiếp bằng AI Vision...');
      extractedText = await extractTextFromImageViaVision(file);
      if (extractedText) {
        showStatus('Đã nhận diện văn bản bằng AI Vision.');
      }
    } catch (visionError) {
      console.warn('Vision OCR failed, fallback to Tesseract:', visionError);

      if (!window.Tesseract) {
        throw new Error('Không tải được Tesseract.js và AI Vision chưa sẵn sàng.');
      }

      setOcrLoading(true, 25, 'AI Vision chưa sẵn sàng, chuyển sang OCR cục bộ...');
      const ocrInput = await preprocessImageForOcr(file);
      const result = await window.Tesseract.recognize(ocrInput, 'eng', {
        logger: (message) => {
          if (!message || typeof message.progress !== 'number') {
            return;
          }

          const percent = Math.round(25 + message.progress * 65);
          const status = message.status || 'Đang xử lý ảnh...';
          setOcrLoading(true, percent, `${status} (${percent}%)`);
        },
      });

      extractedText = String(result?.data?.text || '').trim();
    }

    try {
      if (extractedText) {
        // Vietnamese OCR restoration (if applicable)
        setOcrLoading(true, 88, 'Đang khôi phục tiếng Việt...');
        const restoredText = await restoreVietnameseOcrWithAi(extractedText);
        const restoredLanguage = detectSourceLanguage(restoredText);
        const wasVietnameseRestored = restoredLanguage === 'vi';

        // Avoid a second correction pass for restored Vietnamese text.
        let correctedText = restoredText;
        if (!wasVietnameseRestored) {
          setOcrLoading(true, 92, 'Đang AI hiệu chỉnh lỗi OCR...');
          correctedText = await correctOcrTextWithAi(restoredText);
        }
        sourceText.value = correctedText;
        enforceSourceWordLimit();
        updateSourceWordCounter();

        setOcrLoading(true, 100, 'Nhận diện hoàn tất.');
        // If Vietnamese was restored, only lookup ASI101 without AI translation
        const processedAsTermList = await processOcrTermList(correctedText, wasVietnameseRestored);
        if (!processedAsTermList) {
          // If not processed as term list, only lookup ASI101 if Vietnamese was restored
          await handleTranslate({ forceAI: false, skipAiForVietnamese: wasVietnameseRestored });
        }
      } else {
        setOcrLoading(true, 100, 'Không nhận diện được văn bản rõ ràng.');
      }
    } catch (error) {
      console.error('OCR post-processing failed:', error);
      setOcrLoading(true, 100, 'Quét ảnh thất bại.');
      showStatus('Không thể quét văn bản từ ảnh.');
    } finally {
      setTimeout(() => {
        setOcrLoading(false, 0, 'Đang xử lý ảnh...');
      }, 700);
      setOcrInputAreaState({ dragActive: false, processing: false });

      if (ocrImageInput) {
        ocrImageInput.value = '';
      }
    }
  };

  translateButton.addEventListener('click', () => handleTranslate({ forceAI: false }));
  if (aiTranslateButton) {
    aiTranslateButton.addEventListener('click', () => handleAIDictionary());
  }

  const scheduleSourceInputProcessing = () => {
    if (sourceInputProcessTimer) {
      clearTimeout(sourceInputProcessTimer);
    }

    sourceInputProcessTimer = setTimeout(() => {
      enforceSourceWordLimit();
      updateSourceWordCounter();
      sourceInputProcessTimer = null;
    }, SOURCE_INPUT_PROCESS_DELAY_MS);
  };

  if (sourceText) {
    sourceText.addEventListener('paste', (event) => {
      const clipboardText = event.clipboardData?.getData('text') || '';
      const pastedWordCount = countWords(clipboardText);

      if (!pastedWordCount) {
        return;
      }

      const currentWordCount = countWords(sourceText.value);
      const selectedText = sourceText.value.slice(sourceText.selectionStart || 0, sourceText.selectionEnd || 0);
      const selectedWordCount = countWords(selectedText);
      const projectedWordCount = currentWordCount - selectedWordCount + pastedWordCount;

      if (projectedWordCount > SOURCE_WORD_LIMIT) {
        event.preventDefault();
        showStatus(`Không thể dán thêm vì sẽ vượt quá ${SOURCE_WORD_LIMIT} từ.`);
      }
    });

    sourceText.addEventListener('input', () => {
      scheduleSourceInputProcessing();
    });

    updateSourceWordCounter();
  }

  if (languageButtons) {
    languageButtons.addEventListener('click', (event) => {
      const targetButton = event.target.closest('[data-lang-option]');
      if (!targetButton) {
        return;
      }

      languageButtons.querySelectorAll('[data-lang-option]').forEach((button) => {
        button.classList.remove('is-active');
      });
      targetButton.classList.add('is-active');
    });
  }

  if (categoryFilterButtons) {
    categoryFilterButtons.addEventListener('click', (event) => {
      const target = event.target.closest('[data-category-key]');
      if (!target) {
        return;
      }

      const categoryKey = target.getAttribute('data-category-key') || 'all';
      setActiveCategory(categoryKey);
    });
  }

  if (strictModeToggle) {
    strictModeToggle.addEventListener('change', () => {
      strictModeEnabled = Boolean(strictModeToggle.checked);
      renderQualityModeLabel();
      renderCategoryButtons();
      renderActiveCategoryLabel();
      renderFilteredTerms();
      renderBrowseMode(activeCategoryKey);
      showStatus(strictModeEnabled
        ? 'Đã bật Chế độ Chuẩn Ngành: chỉ hiển thị thuật ngữ đã kiểm chứng.'
        : 'Đã tắt Chế độ Chuẩn Ngành: hiển thị cả thuật ngữ tự động để tham khảo.');
    });
  }

  if (contributionForm) {
    contributionForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const sourceValue = String(contribSourceText.value || '').trim();
      if (!sourceValue) {
        showContributionStatus('Vui lòng nhập thuật ngữ gốc.', true);
        return;
      }

      const payload = {
        sourceText: sourceValue,
        suggestedEnglish: String(contribEnglish.value || '').trim(),
        suggestedVietnamese: String(contribVietnamese.value || '').trim(),
        suggestedJapaneseKanji: String(contribJapaneseKanji.value || '').trim(),
        suggestedJapaneseRomaji: String(contribJapaneseRomaji.value || '').trim(),
        suggestedChineseSimplified: String(contribChinese.value || '').trim(),
        relatedSystem: String(contribSystemCategory?.value || 'auto').trim(),
        note: String(contribNote.value || '').trim(),
      };

      const hasAnySuggested =
        payload.suggestedEnglish ||
        payload.suggestedVietnamese ||
        payload.suggestedJapaneseKanji ||
        payload.suggestedJapaneseRomaji ||
        payload.suggestedChineseSimplified;

      if (!hasAnySuggested) {
        showContributionStatus('Bạn cần nhập ít nhất một bản dịch đề xuất.', true);
        return;
      }

      try {
        contributionSubmitButton.disabled = true;
        const response = await fetch('/api/contributions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.message || `HTTP ${response.status}`);
        }

        showContributionStatus('Đã gửi đóng góp thành công. Cảm ơn bạn!', false);
        showContributionToast('Cảm ơn bạn! Đóng góp của bạn đang được Lê Trọng Quyền Linh kiểm duyệt.');
        try {
          localStorage.setItem('autotranslate-contribution-event', JSON.stringify({
            at: Date.now(),
            sourceText: payload.sourceText,
            relatedSystem: payload.relatedSystem,
          }));
        } catch (_storageError) {
          // ignore storage errors
        }
        contribNote.value = '';
      } catch (error) {
        console.error('Contribution submit failed:', error);
        showContributionStatus('Gửi đóng góp thất bại. Vui lòng thử lại.', true);
      } finally {
        contributionSubmitButton.disabled = false;
      }
    });
  }

  if (contribAiSuggestButton) {
    contribAiSuggestButton.addEventListener('click', async () => {
      await handleContributionAiSuggest();
    });
  }

  if (ocrUploadButton && ocrImageInput) {
    ocrUploadButton.addEventListener('click', () => {
      ocrImageInput.click();
    });

    ocrImageInput.addEventListener('change', () => {
      const file = ocrImageInput.files && ocrImageInput.files[0];
      handleOcrImage(file);
    });

    if (ocrDropZone) {
      ocrDropZone.addEventListener('dragover', (event) => {
        event.preventDefault();
        setOcrInputAreaState({ dragActive: true, processing: false });
      });

      ocrDropZone.addEventListener('dragleave', () => {
        setOcrInputAreaState({ dragActive: false, processing: false });
      });

      ocrDropZone.addEventListener('drop', (event) => {
        event.preventDefault();
        setOcrInputAreaState({ dragActive: false, processing: false });
        const file = event.dataTransfer?.files?.[0];
        if (!file) {
          return;
        }

        if (!file.type.startsWith('image/')) {
          showStatus('Vui lòng thả file ảnh để OCR.');
          return;
        }

        handleOcrImage(file);
      });
    }
  }

  if (ocrPreviewCloseButton) {
    ocrPreviewCloseButton.addEventListener('click', (event) => {
      const keepText = Boolean(event.shiftKey || event.altKey);
      clearOcrPreviewState({ clearSourceText: !keepText });
      showStatus(keepText
        ? 'Đã xóa ảnh xem trước và giữ lại nội dung văn bản.'
        : 'Đã xóa ảnh xem trước, sẵn sàng quét ảnh mới.');
    });
  }

  document.addEventListener('paste', (event) => {
    const clipboardItems = Array.from(event.clipboardData?.items || []);
    const imageItem = clipboardItems.find((item) => /^image\/(png|jpeg)$/i.test(item.type || ''));
    if (!imageItem) {
      return;
    }

    event.preventDefault();
    const blob = imageItem.getAsFile();
    if (!blob) {
      return;
    }

    const ocrBlob = new Blob([blob], { type: blob.type || 'image/png' });
    handleOcrImage(ocrBlob);
  });

  document.addEventListener('click', (event) => {
    const target = event.target.closest('[data-speak-text][data-speak-lang]');
    if (!target) {
      return;
    }

    const encodedText = target.getAttribute('data-speak-text') || '';
    const lang = target.getAttribute('data-speak-lang') || 'en-US';
    const text = decodeURIComponent(encodedText);
    speakTerm(text, lang);
  });

  sourceText.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      handleTranslate();
    }
  });

  // Event listeners for 4 Language View toggle button
  if (quadLangToggle) {
    quadLangToggle.addEventListener('click', toggleQuadLangView);
  }

  // Event listeners for speaking buttons in 4 Language View
  if (quadLangSpeakEn) {
    quadLangSpeakEn.addEventListener('click', () => {
      if (currentQuadLangData?.term?.english) {
        speakTerm(currentQuadLangData.term.english, 'en-US');
      }
    });
  }

  if (quadLangSpeakVi) {
    quadLangSpeakVi.addEventListener('click', () => {
      if (currentQuadLangData?.term?.vietnamese) {
        speakTerm(currentQuadLangData.term.vietnamese, 'vi-VN');
      }
    });
  }

  if (quadLangSpeakJa) {
    quadLangSpeakJa.addEventListener('click', () => {
      const kanji = currentQuadLangData?.term?.japanese?.kanji;
      if (kanji) {
        speakTerm(kanji, 'ja-JP');
      }
    });
  }

  if (quadLangSpeakZh) {
    quadLangSpeakZh.addEventListener('click', () => {
      if (currentQuadLangData?.term?.chinese_simplified) {
        speakTerm(currentQuadLangData.term.chinese_simplified, 'zh-CN');
      }
    });
  }

  if (resultExpandButton) {
    resultExpandButton.addEventListener('click', () => {
      if (lastParallelItems.length <= INITIAL_PARALLEL_RESULTS_LIMIT) {
        return;
      }

      resultExpandAll = !resultExpandAll;
      renderResultsList(lastParallelItems, { allowCollapse: true, resetExpand: false });
    });
  }

  loadTheme();
  if (themeToggleButton) {
    themeToggleButton.addEventListener('click', () => {
      const isDark = document.body.classList.contains('dark');
      setTheme(isDark ? 'light' : 'dark');
    });
  }

  if (infoButton) {
    infoButton.addEventListener('click', openInfoModal);
  }

  if (infoModalCloseButton) {
    infoModalCloseButton.addEventListener('click', closeInfoModal);
  }

  if (infoModal) {
    infoModal.addEventListener('click', (event) => {
      if (event.target === infoModal) {
        closeInfoModal();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeInfoModal();
    }
  });

  setAiApiStatus(null, 'API AI: Đang kiểm tra...');
  checkAiApiAvailability();
  if (!aiApiProbeIntervalId) {
    aiApiProbeIntervalId = setInterval(() => {
      checkAiApiAvailability();
    }, 30000);
  }

  // Feedback Modal Event Listeners
  const feedbackModal = document.getElementById('feedbackModal');
  const feedbackModalCloseButton = document.getElementById('feedbackModalCloseButton');
  const feedbackForm = document.getElementById('feedbackForm');

  window.openFeedbackModal = (sourceText, translatedText) => {
    if (!feedbackModal) return;
    document.getElementById('feedbackSourceText').value = sourceText;
    document.getElementById('feedbackTranslatedText').value = translatedText;
    document.getElementById('feedbackMessage').value = '';
    document.getElementById('feedbackEmail').value = '';
    document.getElementById('feedbackType').value = 'error';
    document.getElementById('feedbackStatus').textContent = '';
    feedbackModal.classList.remove('hidden');
    feedbackModal.classList.add('flex');
    feedbackModal.setAttribute('aria-hidden', 'false');
  };

  window.closeFeedbackModal = () => {
    if (!feedbackModal) return;
    feedbackModal.classList.add('hidden');
    feedbackModal.classList.remove('flex');
    feedbackModal.setAttribute('aria-hidden', 'true');
  };

  // Save vocabulary to user's list
  window.saveVocabToList = (english, vietnamese, japanese, chinese, btnElement) => {
    // Check if user is authenticated
    if (!Auth || !Auth.isAuthenticated()) {
      alert('Vui lòng đăng nhập để lưu từ vựng');
      window.location.href = 'login.html';
      return;
    }

    const term = {
      english: decodeURIComponent(english),
      vietnamese: decodeURIComponent(vietnamese),
      japanese: decodeURIComponent(japanese),
      chinese_simplified: decodeURIComponent(chinese)
    };

    const saved = Auth.saveVocabulary(term);
    
    if (saved) {
      // Change button appearance to show it's been saved
      if (btnElement) {
        btnElement.classList.remove('bg-blue-100', 'text-blue-700', 'hover:bg-blue-200', 'dark:bg-blue-900/30', 'dark:text-blue-300', 'dark:hover:bg-blue-900/50');
        btnElement.classList.add('bg-emerald-100', 'text-emerald-700', 'hover:bg-emerald-200', 'dark:bg-emerald-900/30', 'dark:text-emerald-300', 'dark:hover:bg-emerald-900/50');
        btnElement.textContent = '✓ Đã lưu';
        btnElement.disabled = true;
      }
      
      // Show feedback toast
      showToastMessage('✅ Từ vựng đã được lưu!', 'success');
    } else {
      // Term already saved
      showToastMessage('ℹ️ Từ vựng này đã được lưu rồi', 'info');
    }
  };

  // Show toast notification
  const showToastMessage = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded-lg text-white text-sm font-medium z-50 animate-fade-in ${
      type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  };


  if (feedbackModalCloseButton) {
    feedbackModalCloseButton.addEventListener('click', closeFeedbackModal);
  }

  if (feedbackModal) {
    feedbackModal.addEventListener('click', (event) => {
      if (event.target === feedbackModal) {
        closeFeedbackModal();
      }
    });
  }

  if (feedbackForm) {
    feedbackForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const sourceText = document.getElementById('feedbackSourceText').value;
      const translatedText = document.getElementById('feedbackTranslatedText').value;
      const feedbackType = document.getElementById('feedbackType').value;
      const message = document.getElementById('feedbackMessage').value;
      const userEmail = document.getElementById('feedbackEmail').value;

      if (!sourceText || !translatedText) {
        alert('Thiếu thông tin về bản dịch');
        return;
      }

      try {
        const statusEl = document.getElementById('feedbackStatus');
        statusEl.textContent = 'Đang gửi...';

        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceText,
            translatedText,
            feedbackType,
            message,
            userEmail,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          statusEl.textContent = '❌ Lỗi: ' + (data.message || 'Không thể gửi');
          return;
        }

        statusEl.textContent = `✅ Cảm ơn! Feedback đã được ghi nhận (ID: ${data.id})`;
        try {
          localStorage.setItem('autotranslate-feedback-event', JSON.stringify({
            at: Date.now(),
            sourceText,
            translatedText,
            feedbackType,
          }));
        } catch (_error) {
          // ignore storage issues
        }
        setTimeout(() => {
          closeFeedbackModal();
        }, 2000);
      } catch (error) {
        document.getElementById('feedbackStatus').textContent = '❌ Lỗi: ' + error.message;
      }
    });
  }

  if (quickFeedbackButton) {
    quickFeedbackButton.addEventListener('click', () => {
      const sourceValue = String(sourceText?.value || '').trim();
      const firstRowEnglish = resultTableBody?.querySelector('tr td:nth-child(2) span')?.textContent?.trim() || '';
      const firstRowVietnamese = resultTableBody?.querySelector('tr td:nth-child(3)')?.textContent?.trim() || '';
      openFeedbackModal(firstRowEnglish || sourceValue || 'Nội dung hiện tại', firstRowVietnamese || sourceValue || '');
    });
  }

  if (adminAccessButton) {
    adminAccessButton.addEventListener('click', async () => {
      try {
        await verifyAndOpenAdmin();
      } catch (error) {
        alert('Không thể mở trang quản trị: ' + error.message);
      }
    });
  }

  if (adminSpaBackButton) {
    adminSpaBackButton.addEventListener('click', () => {
      hideAdminSpaPanel();
    });
  }

  window.addEventListener('message', (event) => {
    if (event?.data?.type === 'ADMIN_BACK_TO_TRANSLATOR') {
      hideAdminSpaPanel();
    }
  });

  window.addEventListener('storage', (event) => {
    if (event.key === 'autotranslate-dictionary-updated-at' && event.newValue) {
      loadDictionary();
      showStatus('Đã đồng bộ từ điển mới từ trang Quản trị.');
    }
    if (event.key === 'autotranslate-theme' && event.newValue) {
      setTheme(event.newValue === 'dark' ? 'dark' : 'light');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeInfoModal();
      closeFeedbackModal();
    }
  });

  loadDictionary();
})();
