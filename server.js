const path = require('path');
const fs = require('fs/promises');
const express = require('express');
const dotenv = require('dotenv');
const LanguageDetect = require('languagedetect');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'https://libretranslate.com/translate';
const LIBRETRANSLATE_API_KEY = process.env.LIBRETRANSLATE_API_KEY || '';
const MYMEMORY_API_URL = process.env.MYMEMORY_API_URL || 'https://api.mymemory.translated.net/get';
const MYMEMORY_EMAIL = process.env.MYMEMORY_EMAIL || '';
const CACHE_FILE = path.join(__dirname, 'cache.json');
const DICTIONARY_FILE = path.join(__dirname, 'dictionary.json');
const CONTRIBUTIONS_FILE = path.join(__dirname, 'contributions.json');
const PENDING_TERMS_FILE = path.join(__dirname, 'pending-terms.json');
const FEEDBACK_LOG_FILE = path.join(__dirname, 'feedback-log.json');
const DOCS_DIR = path.join(__dirname, 'docs');
const CHAPTERS_DIR = path.join(DOCS_DIR, 'chapters');
const CACHE_FLUSH_INTERVAL_MS = 5 * 60 * 1000;
const languageDetector = new LanguageDetect();
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || 'admin-dev-key-change-in-production';
const ADMIN_ACCESS_KEY = process.env.ADMIN_ACCESS_KEY || 'QuyenLinhFPT2026'; // Mã khóa truy cập Admin Dashboard
const FEEDBACK_DB_TYPE = process.env.FEEDBACK_DB_TYPE || 'local'; // 'firebase', 'supabase', or 'local'
const FIREBASE_URL = process.env.FIREBASE_URL || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';
const REQUEST_LIMIT_PER_HOUR = Number(process.env.REQUEST_LIMIT_PER_HOUR || 1000);
const ERROR_RATE_THRESHOLD = Number(process.env.ERROR_RATE_THRESHOLD || 0.1); // 10%
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'postmessage';

// Email Configuration for Contribution Notifications
const SMTP_ENABLED = process.env.SMTP_ENABLED === 'true';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const USERS_FILE = path.join(__dirname, 'users.json');
const googleOAuthClient =
  GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
    ? new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI)
    : null;

let emailTransporter = null;
if (SMTP_ENABLED && SMTP_USER && SMTP_PASS) {
  try {
    emailTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error.message);
    emailTransporter = null;
  }
}

let translationCache = {};
let dictionaryIndex = {};
let dictionaryAliases = [];
let cacheDirty = false;
let contributionsWriteQueue = Promise.resolve();
const inFlightTranslations = new Map();
let slideCorpusNormalized = '';
const slideMatchCache = new Map();

// Metrics tracking
const metrics = {
  translationCountToday: 0,
  translationErrors: 0,
  totalRequests: 0,
  totalErrors: 0,
  responseTimes: [],
  lastReset: new Date(),
  hourlyRequests: new Map(),
  hourlyTrafficByKey: new Map(),
  requestsLastHour: 0,
  sourceCounts: {
    asi101: 0,
    ai: 0,
  },
};

// Pending terms for admin approval
let pendingTerms = [];

app.use((req, res, next) => {
  const origin = String(req.headers.origin || '');
  const isLocalOrigin = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/i.test(origin);

  if (isLocalOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use(express.json({ limit: '15mb' }));

// Middleware: Set proper Content-Type and cache headers for static files
app.use((req, res, next) => {
  // CSS files
  if (req.url.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  // JavaScript files
  else if (req.url.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  // HTML files
  else if (req.url.endsWith('.html') || req.url === '/') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
  }
  next();
});

app.use(express.static(__dirname));

const targetMap = {
  english: 'en',
  vietnamese: 'vi',
  japanese: 'ja',
  chinese_simplified: 'zh-CN',
};

const wikipediaLangMap = {
  english: 'en',
  vietnamese: 'vi',
  japanese: 'ja',
  chinese_simplified: 'zh',
};

const getCacheKey = (text) => String(text || '').trim().toLowerCase();
const normalizeText = (text) => String(text || '').trim().toLowerCase();
const normalizeLooseText = (text) => normalizeText(text).replace(/[^\p{L}\p{N}\s]+/gu, ' ').replace(/\s+/g, ' ').trim();
const normalizeCategoryKey = (key) => normalizeText(key).replace(/\s+/g, '_');
const normalizeSlideText = (text) =>
  ` ${String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;

const detectSourceLanguage = (text) => {
  if (/[àáảãạăắằẳẵặâấầẩẫậđèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]/i.test(text)) {
    return 'vi';
  }

  if (/[ぁ-んァ-ン]/.test(text)) {
    return 'ja';
  }

  if (/[\u4E00-\u9FFF]/.test(text)) {
    return 'zh-CN';
  }

  const guesses = languageDetector.detect(String(text || ''), 3);
  const topGuess = guesses && guesses[0] ? String(guesses[0][0]).toLowerCase() : '';

  if (topGuess.includes('vietnamese')) {
    return 'vi';
  }
  if (topGuess.includes('japanese')) {
    return 'ja';
  }
  if (topGuess.includes('chinese')) {
    return 'zh-CN';
  }

  return 'en';
};

const CONTRIBUTION_CATEGORY_MAP = {
  auto: { key: 'auto', vi: 'Tự động gợi ý', en: 'Auto Suggestion' },
  engine: { key: 'engine', vi: 'Động cơ', en: 'Engine' },
  brake: { key: 'brake', vi: 'Phanh', en: 'Brake' },
  ev: { key: 'ev', vi: 'Xe điện', en: 'EV' },
  chassis: { key: 'chassis', vi: 'Khung gầm', en: 'Chassis' },
};

function resolveContributionCategory(inputKey) {
  const key = normalizeCategoryKey(inputKey || 'auto') || 'auto';
  return CONTRIBUTION_CATEGORY_MAP[key] || {
    key,
    vi: key.toUpperCase(),
    en: key.toUpperCase(),
  };
}

/**
 * Send email notification to admin about new contribution
 * @param {string} sourceText - Original term
 * @param {string} englishTranslation - Suggested English translation
 * @param {string} vietnameseTranslation - Suggested Vietnamese translation
 * @param {object} category - Category object with key, vi, en properties
 * @param {string} note - User's additional notes
 * @returns {Promise<boolean>} - true if sent, false if skipped/failed
 */
async function sendContributionEmail(sourceText, englishTranslation, vietnameseTranslation, category, note) {
  if (!SMTP_ENABLED || !emailTransporter || !ADMIN_EMAIL) {
    console.log('Email notification skipped: SMTP not enabled or configured');
    return false;
  }

  try {
    const htmlContent = `
      <style>
        .email-footer { color: #666; font-size: 12px; margin-top: 20px; }
        .reset-token { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
      </style>
      <h2>Thông báo Đóng góp Từ Vựng Mới</h2>
      <p>Có một đóng góp từ vựng mới đã được gửi lên:</p>
      <hr/>
      <p><strong>Từ gốc:</strong> ${sourceText}</p>
      <p><strong>Dịch tiếng Anh:</strong> ${englishTranslation || '(không có)'}</p>
      <p><strong>Dịch tiếng Việt:</strong> ${vietnameseTranslation || '(không có)'}</p>
      <p><strong>Danh mục:</strong> ${category.vi} (${category.key})</p>
      ${note ? `<p><strong>Ghi chú từ người đóng góp:</strong><br/>${note}</p>` : ''}
      <hr/>
      <p>Vui lòng đăng nhập vào Admin Dashboard để kiểm duyệt.</p>
      <footer class="email-footer">
        <p>Thời gian: ${new Date().toLocaleString('vi-VN')}</p>
      </footer>
    `;

    await emailTransporter.sendMail({
      from: SMTP_USER,
      to: ADMIN_EMAIL,
      subject: `[Auto-Translate] Đóng góp từ vựng mới: ${sourceText}`,
      html: htmlContent,
    });

    console.log(`Email sent to ${ADMIN_EMAIL} for contribution: ${sourceText}`);
    return true;
  } catch (error) {
    console.error('Failed to send contribution email:', error.message);
    return false;
  }
}

function buildDictionaryIndex(terms) {
  const index = {};
  const aliases = [];
  const entries = Object.values(terms || {});

  for (const entry of entries) {
    const entryAliases = [
      entry?.english,
      entry?.vietnamese,
      entry?.japanese?.kanji,
      entry?.japanese?.romaji,
      entry?.chinese_simplified,
    ];

    for (const alias of entryAliases) {
      const key = normalizeText(alias);
      if (key) {
        index[key] = entry;
        aliases.push({ alias: key, entry });
      }
    }
  }

  aliases.sort((a, b) => b.alias.length - a.alias.length);
  return { index, aliases };
}

async function loadDictionaryFromDisk() {
  try {
    const raw = await fs.readFile(DICTIONARY_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const built = buildDictionaryIndex(parsed?.terms || {});
    dictionaryIndex = built.index;
    dictionaryAliases = built.aliases;
  } catch (error) {
    console.error('Failed to load dictionary.json:', error.message);
    dictionaryIndex = {};
    dictionaryAliases = [];
  }
}

async function findTextFiles(dirPath) {
  let entries = [];
  try {
    entries = await fs.readdir(dirPath, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }

  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const nested = await findTextFiles(fullPath);
      files.push(...nested);
      continue;
    }

    if (entry.isFile() && /\.txt$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function loadSlideCorpus() {
  try {
    const chapterFiles = await findTextFiles(CHAPTERS_DIR);
    const docsFiles = await findTextFiles(DOCS_DIR);
    const allFiles = [...new Set([...chapterFiles, ...docsFiles])];

    if (!allFiles.length) {
      slideCorpusNormalized = '';
      return;
    }

    const chunks = [];
    for (const filePath of allFiles) {
      const raw = await fs.readFile(filePath, 'utf8');
      chunks.push(raw);
    }

    slideCorpusNormalized = normalizeSlideText(chunks.join('\n'));
    slideMatchCache.clear();
  } catch (error) {
    console.error('Failed to load slide corpus:', error.message);
    slideCorpusNormalized = '';
    slideMatchCache.clear();
  }
}

function checkTermInSlides(inputTerm) {
  const normalized = normalizeSlideText(inputTerm).trim();
  if (!normalized) {
    return { existsInSlides: false, matchedTerm: '' };
  }

  if (slideMatchCache.has(normalized)) {
    return slideMatchCache.get(normalized);
  }

  if (!slideCorpusNormalized) {
    const result = { existsInSlides: false, matchedTerm: normalized };
    slideMatchCache.set(normalized, result);
    return result;
  }

  const exactNeedle = ` ${normalized} `;
  let exists = slideCorpusNormalized.includes(exactNeedle);

  if (!exists && normalized.includes(' ')) {
    // Fallback for punctuation-boundary cases in corpus.
    exists = slideCorpusNormalized.includes(` ${normalized}`) || slideCorpusNormalized.includes(`${normalized} `);
  }

  const result = { existsInSlides: exists, matchedTerm: normalized };
  slideMatchCache.set(normalized, result);
  return result;
}

function findInInternalDictionary(text) {
  const exactKey = getCacheKey(text);
  if (dictionaryIndex[exactKey]) {
    return dictionaryIndex[exactKey];
  }

  const looseInput = normalizeLooseText(text);
  if (!looseInput) {
    return null;
  }

  // Try longest alias first so phrase-level matches are preferred.
  for (const item of dictionaryAliases) {
    const alias = item.alias;
    if (!alias || alias.length < 3) {
      continue;
    }

    if (alias.includes(' ')) {
      if (looseInput.includes(alias)) {
        return item.entry;
      }
      continue;
    }

    const wrapped = ` ${looseInput} `;
    const wordNeedle = ` ${alias} `;
    if (wrapped.includes(wordNeedle)) {
      return item.entry;
    }
  }

  return null;
}

async function loadContributions() {
  try {
    const raw = await fs.readFile(CONTRIBUTIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function saveContributions(contributions) {
  await fs.writeFile(CONTRIBUTIONS_FILE, JSON.stringify(contributions, null, 2), 'utf8');
}

function enqueueContributionWrite(task) {
  contributionsWriteQueue = contributionsWriteQueue
    .then(task)
    .catch((error) => {
      console.error('Contribution write queue error:', error.message);
      throw error;
    });

  return contributionsWriteQueue;
}

async function loadCacheFromDisk() {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      translationCache = parsed;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to load cache.json:', error.message);
    }
  }
}

async function flushCacheToDisk() {
  if (!cacheDirty) {
    return;
  }

  try {
    await fs.writeFile(CACHE_FILE, JSON.stringify(translationCache, null, 2), 'utf8');
    cacheDirty = false;
  } catch (error) {
    console.error('Failed to write cache.json:', error.message);
  }
}

// Load pending terms from disk
async function loadPendingTerms() {
  try {
    const raw = await fs.readFile(PENDING_TERMS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    pendingTerms = Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Failed to load pending-terms.json:', error.message);
    }
    pendingTerms = [];
  }
}

// Save pending terms to disk
async function savePendingTerms() {
  try {
    await fs.writeFile(PENDING_TERMS_FILE, JSON.stringify(pendingTerms, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to write pending-terms.json:', error.message);
  }
}

// Log feedback from users
async function logFeedback(feedbackData) {
  try {
    let feedbackLog = [];
    try {
      const raw = await fs.readFile(FEEDBACK_LOG_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      feedbackLog = Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Cannot read feedback-log.json:', error.message);
      }
    }

    const entry = {
      id: `feedback-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...feedbackData,
    };

    feedbackLog.push(entry);

    // Keep last 1000 entries
    if (feedbackLog.length > 1000) {
      feedbackLog = feedbackLog.slice(-1000);
    }

    await fs.writeFile(FEEDBACK_LOG_FILE, JSON.stringify(feedbackLog, null, 2), 'utf8');

    // Also send to Firebase/Supabase if configured
    if (FEEDBACK_DB_TYPE === 'firebase' && FIREBASE_URL) {
      await sendFeedbackToFirebase(entry);
    } else if (FEEDBACK_DB_TYPE === 'supabase' && SUPABASE_URL && SUPABASE_KEY) {
      await sendFeedbackToSupabase(entry);
    }

    return entry;
  } catch (error) {
    console.error('Failed to log feedback:', error.message);
    throw error;
  }
}

// Send feedback to Firebase (mock)
async function sendFeedbackToFirebase(data) {
  try {
    const response = await fetch(`${FIREBASE_URL}/feedback.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Firebase HTTP ${response.status}`);
    }
  } catch (error) {
    console.warn('Firebase feedback send failed:', error.message);
  }
}

// Send feedback to Supabase (mock)
async function sendFeedbackToSupabase(data) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Supabase HTTP ${response.status}`);
    }
  } catch (error) {
    console.warn('Supabase feedback send failed:', error.message);
  }
}

// Track metrics
function recordMetrics(responseTime, isError = false, sourceType = 'ai') {
  const now = new Date();
  const hour = now.getHours();
  const key = now.toISOString().slice(0, 13); // YYYY-MM-DDTHH
  
  metrics.totalRequests++;
  if (isError) {
    metrics.totalErrors++;
    metrics.translationErrors++;
  } else {
    metrics.translationCountToday++;
    if (sourceType === 'asi101') {
      metrics.sourceCounts.asi101++;
    } else {
      metrics.sourceCounts.ai++;
    }
  }
  
  metrics.responseTimes.push(responseTime);
  if (metrics.responseTimes.length > 100) {
    metrics.responseTimes.shift();
  }
  
  if (!metrics.hourlyRequests.has(hour)) {
    metrics.hourlyRequests.set(hour, 0);
  }
  metrics.hourlyRequests.set(hour, metrics.hourlyRequests.get(hour) + 1);

  if (!metrics.hourlyTrafficByKey.has(key)) {
    metrics.hourlyTrafficByKey.set(key, 0);
  }
  metrics.hourlyTrafficByKey.set(key, metrics.hourlyTrafficByKey.get(key) + 1);
  
  metrics.requestsLastHour = Array.from(metrics.hourlyRequests.values()).reduce((a, b) => a + b, 0);
}

// Get metrics
function getMetrics() {
  const errorRate = metrics.totalRequests > 0 ? metrics.totalErrors / metrics.totalRequests : 0;
  const avgResponseTime = metrics.responseTimes.length > 0
    ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
    : 0;
  
  const now = new Date();
  const hourlyTraffic24h = [];
  for (let i = 23; i >= 0; i--) {
    const point = new Date(now.getTime() - i * 60 * 60 * 1000);
    const key = point.toISOString().slice(0, 13);
    hourlyTraffic24h.push({
      label: `${String(point.getHours()).padStart(2, '0')}:00`,
      value: metrics.hourlyTrafficByKey.get(key) || 0,
    });
  }

  const sourceTotal = metrics.sourceCounts.asi101 + metrics.sourceCounts.ai;
  const sourceBreakdown = {
    asi101: metrics.sourceCounts.asi101,
    ai: metrics.sourceCounts.ai,
    asi101Percentage: sourceTotal > 0 ? Number(((metrics.sourceCounts.asi101 / sourceTotal) * 100).toFixed(1)) : 0,
    aiPercentage: sourceTotal > 0 ? Number(((metrics.sourceCounts.ai / sourceTotal) * 100).toFixed(1)) : 0,
  };
  
  return {
    translationCountToday: metrics.translationCountToday,
    translationErrors: metrics.translationErrors,
    totalRequests: metrics.totalRequests,
    errorRate: errorRate.toFixed(3),
    errorRatePercentage: (errorRate * 100).toFixed(1) + '%',
    avgResponseTimeMs: avgResponseTime.toFixed(0),
    requestsLastHour: metrics.requestsLastHour,
    isOverLimit: metrics.requestsLastHour > REQUEST_LIMIT_PER_HOUR,
    isErrorRateHigh: errorRate > ERROR_RATE_THRESHOLD,
    lastReset: metrics.lastReset,
    hourlyTraffic24h,
    sourceBreakdown,
  };
}

// Middleware: Check admin auth
const checkAdminAuth = (req, res, next) => {
  // Support both Bearer token and X-Admin-Key header for backward compatibility
  const authHeader = req.headers['authorization'] || '';
  const bearerToken = authHeader.replace('Bearer ', '');
  const expectedToken = Buffer.from(ADMIN_ACCESS_KEY).toString('base64');
  
  if (bearerToken === expectedToken) {
    return next();
  }
  
  // Fallback to X-Admin-Key for backward compatibility
  const adminKey = req.headers['x-admin-key'] || req.body?.adminKey || '';
  if (adminKey === ADMIN_ACCESS_KEY) {
    return next();
  }
  
  return res.status(403).json({ success: false, message: 'Unauthorized: Invalid authentication' });
};

// Endpoint: Verify admin access key
app.post('/api/admin/verify-key', (req, res) => {
  const providedKey = String(req.body?.key || '').trim();
  
  if (!providedKey) {
    return res.status(400).json({ 
      success: false, 
      message: 'Key không được để trống' 
    });
  }
  
  if (providedKey === ADMIN_ACCESS_KEY) {
    return res.json({ 
      success: true, 
      message: 'Key chính xác, truy cập được cấp', 
      sessionToken: Buffer.from(providedKey).toString('base64')
    });
  } else {
    return res.status(401).json({ 
      success: false, 
      message: 'Key không chính xác, vui lòng liên hệ Lê Trọng Quyền Linh' 
    });
  }
});

async function translateWithGoogle(text, target, sourceLanguage = 'auto') {

  if (!GOOGLE_TRANSLATE_API_KEY) {
    throw new Error('GOOGLE_TRANSLATE_API_KEY is missing');
  }

  const endpoint = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(GOOGLE_TRANSLATE_API_KEY)}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: text,
      source: sourceLanguage,
      target,
      format: 'text',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Translate HTTP ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data?.data?.translations?.[0]?.translatedText || '';
}

async function fetchWikipediaDefinitionByLanguage(queryTerm, wikiLang) {
  const searchUrl = `https://${wikiLang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(queryTerm)}&srlimit=1&utf8=1&format=json`;
  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    throw new Error(`Wikipedia search HTTP ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();
  const topResult = searchData?.query?.search?.[0];
  if (!topResult?.title) {
    return '';
  }

  const extractUrl = `https://${wikiLang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(topResult.title)}&utf8=1&format=json`;
  const extractResponse = await fetch(extractUrl);
  if (!extractResponse.ok) {
    throw new Error(`Wikipedia extract HTTP ${extractResponse.status}`);
  }

  const extractData = await extractResponse.json();
  const pages = extractData?.query?.pages || {};
  const firstPage = Object.values(pages)[0];
  return String(firstPage?.extract || '').trim();
}

async function fetchTechnicalDefinitions(translationResult) {
  const queryByLanguage = {
    english: translationResult.english,
    vietnamese: translationResult.vietnamese,
    japanese: translationResult.japanese?.kanji,
    chinese_simplified: translationResult.chinese_simplified,
  };

  const entries = Object.entries(queryByLanguage);
  const definitions = {};

  await Promise.all(
    entries.map(async ([field, query]) => {
      try {
        const wikiLang = wikipediaLangMap[field];
        const definition = await fetchWikipediaDefinitionByLanguage(`${query} automobile`, wikiLang);
        definitions[field] = definition;
      } catch (_error) {
        definitions[field] = '';
      }
    })
  );

  return definitions;
}

const sanitizeAiValue = (value) => String(value || '').trim();

function parseJsonLoose(rawText) {
  const text = String(rawText || '').trim();
  try {
    return JSON.parse(text);
  } catch (_error) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error('AI response is not valid JSON');
    }
    return JSON.parse(match[0]);
  }
}

function normalizeAiTranslationResponse(payload) {
  const english = sanitizeAiValue(payload?.english);
  const vietnamese = sanitizeAiValue(payload?.vietnamese);
  const japaneseKanji = sanitizeAiValue(payload?.japanese?.kanji);
  const japaneseRomaji = sanitizeAiValue(payload?.japanese?.romaji) || 'N/A';
  const chineseSimplified = sanitizeAiValue(payload?.chinese_simplified);

  if (!english || !vietnamese || !japaneseKanji || !chineseSimplified) {
    throw new Error('AI response missing required translation fields');
  }

  return {
    english,
    vietnamese,
    japanese: {
      kanji: japaneseKanji,
      romaji: japaneseRomaji,
    },
    chinese_simplified: chineseSimplified,
  };
}

function normalizeVietnameseRestorationResponse(payload, fallbackText = '') {
  const english = sanitizeAiValue(payload?.english);
  const vietnamese = sanitizeAiValue(payload?.vietnamese);
  const japaneseKanji = sanitizeAiValue(payload?.japanese?.kanji) || 'N/A';
  const japaneseRomaji = sanitizeAiValue(payload?.japanese?.romaji) || 'N/A';
  const chineseSimplified = sanitizeAiValue(payload?.chinese_simplified) || 'N/A';

  const restored = english || vietnamese || sanitizeAiValue(fallbackText);
  if (!restored) {
    throw new Error('AI restoration response is empty');
  }

  return {
    english: restored,
    vietnamese: vietnamese || restored,
    japanese: {
      kanji: japaneseKanji,
      romaji: japaneseRomaji,
    },
    chinese_simplified: chineseSimplified,
  };
}

async function translateWithOpenAI(text, aiInstruction = '') {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing');
  }

  // Detect restoration prompts robustly (case-insensitive, with/without Vietnamese diacritics).
  const normalizedInstruction = String(aiInstruction || '').toLowerCase();
  const isVietnameseRestoration =
    normalizedInstruction.includes('khôi phục') || normalizedInstruction.includes('khoi phuc');
  
  let prompt;
  if (isVietnameseRestoration) {
    // Specialized prompt for Vietnamese OCR restoration
    prompt = [
      aiInstruction,
      'Respond with valid JSON only in this format:',
      '{"english":"<restored Vietnamese text with correct diacritics>","vietnamese":"<same as english>","japanese":{"kanji":"N/A","romaji":"N/A"},"chinese_simplified":"N/A"}',
      `Input text: ${text}`,
    ].filter(Boolean).join('\n');
  } else {
    // Standard translation prompt
    prompt = [
      'You are an automotive technical translator.',
      aiInstruction ? `Additional instruction: ${aiInstruction}` : '',
      'Translate the input text into English, Vietnamese, Japanese, and Simplified Chinese.',
      'Japanese must include kanji and romaji.',
      'Return strictly valid JSON with this shape only:',
      '{"english":"...","vietnamese":"...","japanese":{"kanji":"...","romaji":"..."},"chinese_simplified":"..."}',
      `Input: ${text}`,
    ].filter(Boolean).join('\n');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: isVietnameseRestoration ? 0 : 0.1,
      messages: [
        {
          role: 'system',
          content: 'You return only valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI HTTP ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '';
  if (isVietnameseRestoration) {
    let parsed;
    try {
      parsed = parseJsonLoose(content);
    } catch (_error) {
      return normalizeVietnameseRestorationResponse({ english: String(content || '').trim() }, text);
    }
    return normalizeVietnameseRestorationResponse(parsed, text);
  }

  const parsed = parseJsonLoose(content);
  return normalizeAiTranslationResponse(parsed);
}

async function extractTextWithOpenAIVision(imageDataUrl, instruction = '') {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is missing');
  }

  const systemPrompt = instruction || 'Bạn là chuyên gia ngôn ngữ ô tô của FPT. Hãy nhìn vào hình ảnh này và trích xuất lại văn bản chính xác 100%. Nếu chữ bị mờ, hãy dựa vào ngữ cảnh kỹ thuật ô tô để đoán từ đúng. Ví dụ: Nếu thấy chữ mờ giống "Brake specific fuel...", hãy tự động sửa lại cho đúng thuật ngữ kỹ thuật. Trả về plain text, giữ đúng thứ tự dòng như ảnh gốc, không thêm giải thích hay ký hiệu markdown.';

  const prompt = [
    systemPrompt,
    'Không được nối dòng, không được thêm ghi chú. Chỉ trả về văn bản đã trích xuất.',
  ].join('\n');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_VISION_MODEL,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Không được nối dòng, không được thêm ghi chú. Chỉ trả về văn bản đã trích xuất.',
            },
            {
              type: 'image_url',
              image_url: {
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI Vision HTTP ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const content = String(data?.choices?.[0]?.message?.content || '').trim();
  if (!content) {
    throw new Error('OpenAI Vision returned empty content');
  }

  return content;
}

async function translateWithGemini(text, aiInstruction = '') {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  
  // Detect restoration prompts robustly (case-insensitive, with/without Vietnamese diacritics).
  const normalizedInstruction = String(aiInstruction || '').toLowerCase();
  const isVietnameseRestoration =
    normalizedInstruction.includes('khôi phục') || normalizedInstruction.includes('khoi phuc');
  
  let prompt;
  if (isVietnameseRestoration) {
    // Specialized prompt for Vietnamese OCR restoration
    prompt = [
      aiInstruction,
      'Respond with valid JSON only in this format:',
      '{"english":"<restored Vietnamese text with correct diacritics>","vietnamese":"<same as english>","japanese":{"kanji":"N/A","romaji":"N/A"},"chinese_simplified":"N/A"}',
      `Input text: ${text}`,
    ].filter(Boolean).join('\n');
  } else {
    // Standard translation prompt
    prompt = [
      'Translate this automotive technical text into English, Vietnamese, Japanese (kanji + romaji), and Simplified Chinese.',
      aiInstruction ? `Additional instruction: ${aiInstruction}` : '',
      'Respond with valid JSON only, no markdown, no explanation.',
      'Required JSON format:',
      '{"english":"...","vietnamese":"...","japanese":{"kanji":"...","romaji":"..."},"chinese_simplified":"..."}',
      `Input: ${text}`,
    ].filter(Boolean).join('\n');
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: isVietnameseRestoration ? 0 : 0.1,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini HTTP ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const content = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('\n') || '';
  if (isVietnameseRestoration) {
    let parsed;
    try {
      parsed = parseJsonLoose(content);
    } catch (_error) {
      return normalizeVietnameseRestorationResponse({ english: String(content || '').trim() }, text);
    }
    return normalizeVietnameseRestorationResponse(parsed, text);
  }

  const parsed = parseJsonLoose(content);
  return normalizeAiTranslationResponse(parsed);
}

async function translateWithLibreTranslate(text, target, sourceLanguage = 'auto') {
  const payload = {
    q: text,
    source: sourceLanguage,
    target,
    format: 'text',
  };

  if (LIBRETRANSLATE_API_KEY) {
    payload.api_key = LIBRETRANSLATE_API_KEY;
  }

  const response = await fetch(LIBRETRANSLATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LibreTranslate HTTP ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data?.translatedText || '';
}

async function translateWithMyMemory(text, source, target) {
  if (source === target) {
    return text;
  }

  const query = new URLSearchParams({
    q: text,
    langpair: `${source}|${target}`,
  });

  if (MYMEMORY_EMAIL) {
    query.set('de', MYMEMORY_EMAIL);
  }

  const response = await fetch(`${MYMEMORY_API_URL}?${query.toString()}`);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`MyMemory HTTP ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data?.responseData?.translatedText || '';
}

const formatTranslationResult = (english, vietnamese, japanese, chineseSimplified, provider, fromCache = false) => ({
  english,
  vietnamese,
  japanese: {
    kanji: japanese,
    romaji: 'N/A',
  },
  chinese_simplified: chineseSimplified,
  provider,
  fromCache,
});

function applyDetectedSourceText(result, sourceLanguage, sourceText) {
  const output = { ...result, japanese: { ...result.japanese } };

  if (sourceLanguage === 'en') {
    output.english = sourceText;
  } else if (sourceLanguage === 'vi') {
    output.vietnamese = sourceText;
  } else if (sourceLanguage === 'ja') {
    output.japanese.kanji = sourceText;
  } else if (sourceLanguage === 'zh-CN') {
    output.chinese_simplified = sourceText;
  }

  return output;
}

function createLocalFallbackPayload(text, sourceLanguage) {
  const payload = {
    english: '',
    vietnamese: '',
    japanese: {
      kanji: '',
      romaji: 'N/A',
    },
    chinese_simplified: '',
    provider: 'local-fallback',
    fromCache: false,
  };

  if (sourceLanguage === 'vi') {
    payload.vietnamese = text;
  } else if (sourceLanguage === 'ja') {
    payload.japanese.kanji = text;
  } else if (sourceLanguage === 'zh-CN') {
    payload.chinese_simplified = text;
  } else {
    payload.english = text;
  }

  return payload;
}

async function translateUsingOpenAI(text, aiInstruction = '') {
  const aiResult = await translateWithOpenAI(text, aiInstruction);
  return {
    ...aiResult,
    provider: 'openai',
    fromCache: false,
  };
}

async function translateUsingGemini(text, aiInstruction = '') {
  const aiResult = await translateWithGemini(text, aiInstruction);
  return {
    ...aiResult,
    provider: 'gemini',
    fromCache: false,
  };
}

async function translateUsingGoogle(text, sourceLanguage = 'auto') {
  const [english, vietnamese, japanese, chineseSimplified] = await Promise.all([
    sourceLanguage === targetMap.english ? text : translateWithGoogle(text, targetMap.english, sourceLanguage),
    sourceLanguage === targetMap.vietnamese ? text : translateWithGoogle(text, targetMap.vietnamese, sourceLanguage),
    sourceLanguage === targetMap.japanese ? text : translateWithGoogle(text, targetMap.japanese, sourceLanguage),
    sourceLanguage === targetMap.chinese_simplified ? text : translateWithGoogle(text, targetMap.chinese_simplified, sourceLanguage),
  ]);

  return formatTranslationResult(english, vietnamese, japanese, chineseSimplified, 'google');
}

async function translateUsingLibreTranslate(text, sourceLanguage = 'auto') {
  const libreSource = sourceLanguage === 'zh-CN' ? 'zh' : sourceLanguage;
  const [english, vietnamese, japanese, chineseSimplified] = await Promise.all([
    sourceLanguage === targetMap.english ? text : translateWithLibreTranslate(text, targetMap.english, libreSource),
    sourceLanguage === targetMap.vietnamese ? text : translateWithLibreTranslate(text, targetMap.vietnamese, libreSource),
    sourceLanguage === targetMap.japanese ? text : translateWithLibreTranslate(text, targetMap.japanese, libreSource),
    sourceLanguage === targetMap.chinese_simplified ? text : translateWithLibreTranslate(text, 'zh', libreSource),
  ]);

  return formatTranslationResult(english, vietnamese, japanese, chineseSimplified, 'libretranslate');
}

async function translateUsingMyMemory(text, sourceLanguage = 'en') {
  const source = sourceLanguage;

  const [english, vietnamese, japanese, chineseSimplified] = await Promise.all([
    translateWithMyMemory(text, source, targetMap.english),
    translateWithMyMemory(text, source, targetMap.vietnamese),
    translateWithMyMemory(text, source, targetMap.japanese),
    translateWithMyMemory(text, source, targetMap.chinese_simplified),
  ]);

  return formatTranslationResult(english, vietnamese, japanese, chineseSimplified, 'mymemory');
}

async function translateWithFallbacks(text, sourceLanguage = 'auto', aiInstruction = '') {
  const errors = [];

  try {
    if (GEMINI_API_KEY) {
      return await translateUsingGemini(text, aiInstruction);
    }
    errors.push('Gemini skipped: GEMINI_API_KEY is missing');
  } catch (error) {
    errors.push(`Gemini failed: ${error.message}`);
  }

  try {
    if (OPENAI_API_KEY) {
      return await translateUsingOpenAI(text, aiInstruction);
    }
    errors.push('OpenAI skipped: OPENAI_API_KEY is missing');
  } catch (error) {
    errors.push(`OpenAI failed: ${error.message}`);
  }

  try {
    if (GOOGLE_TRANSLATE_API_KEY) {
      return await translateUsingGoogle(text, sourceLanguage);
    }
    errors.push('Google skipped: GOOGLE_TRANSLATE_API_KEY is missing');
  } catch (error) {
    errors.push(`Google failed: ${error.message}`);
  }

  try {
    return await translateUsingLibreTranslate(text, sourceLanguage);
  } catch (error) {
    errors.push(`LibreTranslate failed: ${error.message}`);
  }

  try {
    return await translateUsingMyMemory(text, sourceLanguage);
  } catch (error) {
    errors.push(`MyMemory failed: ${error.message}`);
  }

  throw new Error(errors.join(' | '));
}

async function restoreVietnameseOcrText(text, instruction = '') {
  const restorationInstruction = String(instruction || '').trim() || [
    'Bạn là chuyên gia ngôn ngữ ô tô của FPT.',
    'Đây là văn bản tiếng Việt chuyên ngành ô tô bị OCR lỗi từ ảnh mờ.',
    'Hãy khôi phục chính xác chính tả và dấu tiếng Việt dựa trên ngữ cảnh kỹ thuật ô tô.',
    'Giữ nguyên cấu trúc từng dòng, không nối dòng, không thêm giải thích.',
    'Chỉ trả về văn bản đã khôi phục trong trường english và vietnamese.',
  ].join(' ');

  const errors = [];

  try {
    if (GEMINI_API_KEY) {
      const result = await translateWithGemini(text, restorationInstruction);
      return {
        restoredText: String(result?.english || result?.vietnamese || '').trim(),
        provider: 'gemini',
      };
    }
    errors.push('Gemini skipped: GEMINI_API_KEY is missing');
  } catch (error) {
    errors.push(`Gemini failed: ${error.message}`);
  }

  try {
    if (OPENAI_API_KEY) {
      const result = await translateWithOpenAI(text, restorationInstruction);
      return {
        restoredText: String(result?.english || result?.vietnamese || '').trim(),
        provider: 'openai',
      };
    }
    errors.push('OpenAI skipped: OPENAI_API_KEY is missing');
  } catch (error) {
    errors.push(`OpenAI failed: ${error.message}`);
  }

  throw new Error(errors.join(' | '));
}

app.post('/api/translate-fallback', async (req, res) => {
  const text = String(req.body?.text || '').trim();
  const sourceLanguageHint = String(req.body?.sourceLanguageHint || '').trim();
  const includeDefinitions = Boolean(req.body?.includeDefinitions);
  const forceAI = Boolean(req.body?.forceAI);
  const aiInstruction = String(req.body?.aiInstruction || '').trim();
  const cacheKey = getCacheKey(
    `${text}||${sourceLanguageHint}||${forceAI ? 'ai' : 'std'}||${includeDefinitions ? 'defs' : 'nodefs'}||${aiInstruction}`
  );
  const allowedHints = new Set(['en', 'vi', 'ja', 'zh-CN']);
  const detectedSourceLanguage = allowedHints.has(sourceLanguageHint)
    ? sourceLanguageHint
    : detectSourceLanguage(text);

  if (!text) {
    return res.status(400).json({ message: 'text is required' });
  }

  const internalDictionaryTerm = forceAI ? null : findInInternalDictionary(text);
  if (internalDictionaryTerm) {
    recordMetrics(1, false, 'asi101');
    return res.json({
      ...internalDictionaryTerm,
      provider: 'internal-dictionary',
      fromCache: false,
      detected_source_language: detectedSourceLanguage,
      definitions: {},
    });
  }

  if (translationCache[cacheKey]) {
    const cached = translationCache[cacheKey];
    const cachedSourceType = cached.provider === 'internal-dictionary' ? 'asi101' : 'ai';
    recordMetrics(1, false, cachedSourceType);
    return res.json({
      ...cached,
      provider: cached.provider || 'backend',
      definitions: cached.definitions || {},
      fromCache: true,
      detected_source_language: detectedSourceLanguage,
    });
  }

  if (inFlightTranslations.has(cacheKey)) {
    try {
      const sharedPayload = await inFlightTranslations.get(cacheKey);
      const sharedSourceType = sharedPayload.provider === 'internal-dictionary' ? 'asi101' : 'ai';
      recordMetrics(1, false, sharedSourceType);
      return res.json({
        ...sharedPayload,
        fromCache: true,
        detected_source_language: detectedSourceLanguage,
      });
    } catch (error) {
      return res.status(502).json({
        message: 'Translation API request failed',
        error: error.message,
      });
    }
  }

  const translationPromise = (async () => {
    const startTime = Date.now();
    try {
      const translatedResult = await translateWithFallbacks(text, detectedSourceLanguage, aiInstruction);
      const normalizedResult = applyDetectedSourceText(translatedResult, detectedSourceLanguage, text);
      const definitions = includeDefinitions ? await fetchTechnicalDefinitions(normalizedResult) : {};
      const payload = {
        ...normalizedResult,
        detected_source_language: detectedSourceLanguage,
        definitions,
      };

      translationCache[cacheKey] = payload;
      cacheDirty = true;
      
      // Track metrics
      const responseTime = Date.now() - startTime;
      const sourceType = translatedResult.provider === 'internal-dictionary' ? 'asi101' : 'ai';
      recordMetrics(responseTime, false, sourceType);
      
      // Add to pending terms if it came from AI and not in internal dictionary
      if ((translatedResult.provider === 'openai' || translatedResult.provider === 'gemini') && !internalDictionaryTerm) {
        const existingPending = pendingTerms.find(
          (t) => normalizeText(t.english) === normalizeText(translatedResult.english)
        );
        if (!existingPending) {
          pendingTerms.push({
            id: `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            timestamp: new Date().toISOString(),
            english: translatedResult.english,
            vietnamese: translatedResult.vietnamese,
            japanese: translatedResult.japanese,
            chinese_simplified: translatedResult.chinese_simplified,
            category: { key: 'auto', vi: 'Tự động gợi ý', en: 'Auto Suggestion' },
            source: translatedResult.provider,
          });
          await savePendingTerms();
        }
      }
      
      return payload;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      recordMetrics(responseTime, true);
      throw error;
    }
  })();

  inFlightTranslations.set(cacheKey, translationPromise);

  try {
    const payload = await translationPromise;
    return res.json(payload);
  } catch (error) {
    const localFallback = createLocalFallbackPayload(text, detectedSourceLanguage);
    return res.json({
      ...localFallback,
      detected_source_language: detectedSourceLanguage,
      definitions: {},
      warning: `Fallback local mode: ${error.message}`,
    });
  } finally {
    inFlightTranslations.delete(cacheKey);
  }
});

app.post('/api/ocr-vision', async (req, res) => {
  const imageDataUrl = String(req.body?.imageDataUrl || '').trim();
  const instruction = String(req.body?.instruction || '').trim();

  if (!imageDataUrl || !/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(imageDataUrl)) {
    return res.status(400).json({ message: 'imageDataUrl (base64 data URL) is required' });
  }

  if (!OPENAI_API_KEY) {
    return res.status(503).json({ message: 'OPENAI_API_KEY is not configured for vision OCR' });
  }

  try {
    const text = await extractTextWithOpenAIVision(imageDataUrl, instruction);
    return res.json({
      text,
      provider: 'openai-vision',
      model: OPENAI_VISION_MODEL,
    });
  } catch (error) {
    return res.status(502).json({
      message: 'Vision OCR failed',
      error: error.message,
    });
  }
});

app.post('/api/ocr-restore-vi', async (req, res) => {
  const text = String(req.body?.text || '').trim();
  const instruction = String(req.body?.instruction || '').trim();

  if (!text) {
    return res.status(400).json({ message: 'text is required' });
  }

  if (!OPENAI_API_KEY && !GEMINI_API_KEY) {
    return res.status(503).json({ message: 'No AI provider configured for Vietnamese OCR restoration' });
  }

  try {
    const restoration = await restoreVietnameseOcrText(text, instruction);
    const restoredText = String(restoration?.restoredText || '').trim();
    if (!restoredText) {
      return res.status(502).json({ message: 'Vietnamese OCR restoration returned empty text' });
    }

    return res.json({
      restoredText,
      provider: restoration?.provider || 'unknown',
    });
  } catch (error) {
    return res.status(502).json({
      message: 'Vietnamese OCR restoration failed',
      error: error.message,
    });
  }
});

// ============================================
// JWT AUTHENTICATION MIDDLEWARE & FUNCTIONS
// ============================================

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Read users database
const readUsers = async () => {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      passwordResetTokens: Array.isArray(parsed.passwordResetTokens) ? parsed.passwordResetTokens : [],
    };
  } catch {
    return { users: [], passwordResetTokens: [] };
  }
};

// Write users database
const writeUsers = async (data) => {
  await fs.writeFile(USERS_FILE, JSON.stringify(data, null, 2));
};

// Find user by email
const findUserByEmail = async (email) => {
  const data = await readUsers();
  return data.users.find(u => u.email === email);
};

// Find user by ID
const findUserById = async (id) => {
  const data = await readUsers();
  return data.users.find(u => u.id === id);
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, fullname: user.fullname },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Hash password
const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

// Compare password
const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

// Generate password reset token
const generateResetToken = () => {
  return Math.random().toString(36).substr(2, 9).toUpperCase();
};

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// GET /api/auth/google-config - Expose only Google Client ID to frontend
app.get('/api/auth/google-config', (req, res) => {
  return res.json({
    clientId: GOOGLE_CLIENT_ID,
    configured: Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET),
  });
});

// POST /api/auth/google/code - Google OAuth code exchange and sign-in
app.post('/api/auth/google/code', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'code is required' });
  }

  if (!googleOAuthClient || !GOOGLE_CLIENT_ID) {
    return res.status(503).json({ message: 'Google OAuth is not configured on server' });
  }

  try {
    const tokenResponse = await googleOAuthClient.getToken({
      code,
      redirect_uri: GOOGLE_REDIRECT_URI,
    });
    const idToken = tokenResponse.tokens?.id_token;

    if (!idToken) {
      return res.status(401).json({ message: 'Google did not return id_token' });
    }

    const ticket = await googleOAuthClient.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const email = String(payload?.email || '').trim().toLowerCase();
    const fullname = String(payload?.name || '').trim();

    if (!email) {
      return res.status(401).json({ message: 'Google account email is missing' });
    }

    const data = await readUsers();
    let user = data.users.find((entry) => String(entry.email || '').toLowerCase() === email);

    if (!user) {
      user = {
        id: `user-google-${Date.now()}`,
        fullname: fullname || email.split('@')[0],
        email,
        employeeId: '',
        password: null,
        role: 'user',
        status: 'approved',
        authProvider: 'google',
        createdAt: new Date().toISOString(),
        avatar: payload?.picture || null,
      };
      data.users.push(user);
      await writeUsers(data);
    } else {
      if (user.status !== 'approved') {
        return res.status(403).json({
          message:
            user.status === 'pending'
              ? 'Tài khoản đang chờ phê duyệt từ Admin'
              : 'Tài khoản đã bị từ chối',
        });
      }

      if (fullname && user.fullname !== fullname) {
        user.fullname = fullname;
      }
      if (!user.authProvider) {
        user.authProvider = 'google';
      }
      if (payload?.picture) {
        user.avatar = payload.picture;
      }
      await writeUsers(data);
    }

    const token = generateToken(user);
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      googleProfile: {
        displayName: fullname || user.fullname,
        email,
      },
    });
  } catch (error) {
    console.error('Google login error:', error.message);
    return res.status(401).json({ message: 'Google login failed', error: error.message });
  }
});

// POST /api/auth/register - Register new user
app.post('/api/auth/register', async (req, res) => {
  const { fullname, email, employeeId, password } = req.body;

  if (!fullname || !email || !password) {
    return res.status(400).json({ message: 'fullname, email, password are required' });
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashedPassword = await hashPassword(password);
    const userId = `user-${Date.now()}`;

    const data = await readUsers();
    const newUser = {
      id: userId,
      fullname,
      email,
      employeeId: employeeId || '',
      password: hashedPassword,
      role: 'user',
      status: 'pending',
      createdAt: new Date().toISOString(),
      avatar: null
    };

    data.users.push(newUser);
    await writeUsers(data);

    // Send notification to admin about pending user
    if (emailTransporter && ADMIN_EMAIL) {
      try {
        await emailTransporter.sendMail({
          from: SMTP_USER,
          to: ADMIN_EMAIL,
          subject: '🔔 Có người dùng mới đăng ký',
          html: `
            <h2>Có tài khoản mới chờ phê duyệt</h2>
            <p><strong>Tên:</strong> ${fullname}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Mã NV:</strong> ${employeeId || 'N/A'}</p>
            <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
            <p><a href="http://localhost:3000/approval-users.html">Xem trang duyệt tài khoản</a></p>
          `
        });
      } catch (error) {
        console.error('Failed to send registration notification:', error);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please wait for admin approval.',
      user: {
        id: userId,
        fullname,
        email,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// POST /api/auth/login - Login user
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is approved
    if (user.status !== 'approved') {
      return res.status(403).json({ 
        message: user.status === 'pending' 
          ? 'Tài khoản đang chờ phê duyệt từ Admin' 
          : 'Tài khoản đã bị từ chối'
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// GET /api/auth/verify-token - Verify JWT token
app.get('/api/auth/verify-token', verifyToken, async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      success: true,
      user: {
        id: user.id,
        fullname: user.fullname,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Verification failed' });
  }
});

// POST /api/auth/forgot-password - Request password reset
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'email is required' });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists
      return res.json({ success: true, message: 'If email exists, reset code will be sent' });
    }

    const resetToken = generateResetToken();
    const data = await readUsers();

    // Remove old token for this user
    data.passwordResetTokens = data.passwordResetTokens.filter(t => t.email !== email);

    // Add new token
    data.passwordResetTokens.push({
      email,
      token: resetToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes
    });

    await writeUsers(data);

    // Send email with reset code
    if (emailTransporter) {
      try {
        await emailTransporter.sendMail({
          from: SMTP_USER,
          to: email,
          subject: '🔑 Mã khôi phục mật khẩu',
          html: `
            <style>
              .reset-token { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
            </style>
            <h2>Yêu cầu khôi phục mật khẩu</h2>
            <p>Mã xác nhận của bạn:</p>
            <p class="reset-token">${resetToken}</p>
            <p>Mã này sẽ hết hạn trong 15 phút.</p>
            <p>Nếu bạn không yêu cầu điều này, bạn có thể bỏ qua email này.</p>
          `
        });
      } catch (error) {
        console.error('Failed to send reset email:', error);
      }
    }

    return res.json({
      success: true,
      message: 'Reset code sent to email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Request failed', error: error.message });
  }
});

// POST /api/auth/reset-password - Reset password with code
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, verificationCode, newPassword } = req.body;

  if (!email || !verificationCode || !newPassword) {
    return res.status(400).json({ message: 'email, verificationCode, newPassword are required' });
  }

  try {
    const data = await readUsers();
    const tokenRecord = data.passwordResetTokens.find(t => t.email === email && t.token === verificationCode);

    if (!tokenRecord || new Date(tokenRecord.expiresAt) < new Date()) {
      return res.status(401).json({ message: 'Invalid or expired code' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update password
    const hashedPassword = await hashPassword(newPassword);
    const userIndex = data.users.findIndex(u => u.email === email);
    data.users[userIndex].password = hashedPassword;

    // Remove used token
    data.passwordResetTokens = data.passwordResetTokens.filter(t => t.token !== verificationCode);

    await writeUsers(data);

    return res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Password reset failed', error: error.message });
  }
});

// POST /api/auth/resend-code - Resend verification code
app.post('/api/auth/resend-code', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'email is required' });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.json({ success: true, message: 'If email exists, code will be resent' });
    }

    const resetToken = generateResetToken();
    const data = await readUsers();

    data.passwordResetTokens = data.passwordResetTokens.filter(t => t.email !== email);
    data.passwordResetTokens.push({
      email,
      token: resetToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });

    await writeUsers(data);

    if (emailTransporter) {
      try {
        await emailTransporter.sendMail({
          from: SMTP_USER,
          to: email,
          subject: '🔑 Mã khôi phục mật khẩu (tái gửi)',
          html: `
            <style>
              .reset-token { font-size: 24px; font-weight: bold; letter-spacing: 2px; }
            </style>
            <h2>Mã xác nhận mới</h2>
            <p class="reset-token">${resetToken}</p>
            <p>Mã này sẽ hết hạn trong 15 phút.</p>
          `
        });
      } catch (error) {
        console.error('Failed to resend code:', error);
      }
    }

    return res.json({ success: true, message: 'Code resent' });
  } catch (error) {
    console.error('Resend code error:', error);
    return res.status(500).json({ message: 'Resend failed', error: error.message });
  }
});

// GET /api/auth/pending-users - Get pending users (Admin only)
app.get('/api/auth/pending-users', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can access this' });
  }

  try {
    const data = await readUsers();
    const pendingUsers = data.users.map(u => ({
      id: u.id,
      fullname: u.fullname,
      email: u.email,
      employeeId: u.employeeId,
      status: u.status,
      createdAt: u.createdAt
    }));

    return res.json({
      success: true,
      users: pendingUsers
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

// POST /api/auth/approve-user - Approve user (Admin only)
app.post('/api/auth/approve-user', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can approve users' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  try {
    const data = await readUsers();
    const user = data.users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'approved';
    user.approvedAt = new Date().toISOString();
    user.approvedBy = req.user.id;

    await writeUsers(data);

    // Send approval email
    if (emailTransporter) {
      try {
        await emailTransporter.sendMail({
          from: SMTP_USER,
          to: user.email,
          subject: '✅ Tài khoản đã được phê duyệt',
          html: `
            <h2>Chào ${user.fullname}!</h2>
            <p>Tài khoản của bạn đã được phê duyệt thành công.</p>
            <p>Bạn có thể đăng nhập vào hệ thống ngay bây giờ.</p>
            <p><a href="http://localhost:3000/login.html">Đăng nhập</a></p>
          `
        });
      } catch (error) {
        console.error('Failed to send approval email:', error);
      }
    }

    return res.json({
      success: true,
      message: 'User approved successfully'
    });
  } catch (error) {
    console.error('Approve user error:', error);
    return res.status(500).json({ message: 'Approval failed', error: error.message });
  }
});

// POST /api/auth/reject-user - Reject user (Admin only)  
app.post('/api/auth/reject-user', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only admin can reject users' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }

  try {
    const data = await readUsers();
    const user = data.users.find(u => u.id === userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.status = 'rejected';
    user.rejectedAt = new Date().toISOString();
    user.rejectedBy = req.user.id;

    await writeUsers(data);

    // Send rejection email
    if (emailTransporter) {
      try {
        await emailTransporter.sendMail({
          from: SMTP_USER,
          to: user.email,
          subject: '❌ Tài khoản bị từ chối',
          html: `
            <h2>Chào ${user.fullname}!</h2>
            <p>Tài khoản của bạn không được phê duyệt vào lúc này.</p>
            <p>Vui lòng liên hệ với quản trị viên để biết thêm chi tiết.</p>
          `
        });
      } catch (error) {
        console.error('Failed to send rejection email:', error);
      }
    }

    return res.json({
      success: true,
      message: 'User rejected successfully'
    });
  } catch (error) {
    console.error('Reject user error:', error);
    return res.status(500).json({ message: 'Rejection failed', error: error.message });
  }
});

// POST /api/user/translation-history - Save translation to user history
app.post('/api/user/translation-history', verifyToken, async (req, res) => {
  const { sourceText, sourceLanguage, translations } = req.body;

  if (!sourceText) {
    return res.status(400).json({ message: 'sourceText is required' });
  }

  try {
    const data = await readUsers();
    const userId = req.user.id;

    if (!data.translationHistory) {
      data.translationHistory = {};
    }

    if (!data.translationHistory[userId]) {
      data.translationHistory[userId] = [];
    }

    data.translationHistory[userId].push({
      id: Date.now().toString(),
      sourceText,
      sourceLanguage,
      translations,
      timestamp: new Date().toISOString()
    });

    // Keep only last 500 entries
    if (data.translationHistory[userId].length > 500) {
      data.translationHistory[userId] = data.translationHistory[userId].slice(-500);
    }

    await writeUsers(data);

    return res.json({ success: true, message: 'Translation saved to history' });
  } catch (error) {
    console.error('Save history error:', error);
    return res.status(500).json({ message: 'Failed to save history', error: error.message });
  }
});

// GET /api/user/translation-history - Get user translation history
app.get('/api/user/translation-history', verifyToken, async (req, res) => {
  try {
    const data = await readUsers();
    const userId = req.user.id;
    const history = data.translationHistory?.[userId] || [];

    return res.json({
      success: true,
      history: history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch history', error: error.message });
  }
});

app.post('/api/contributions', async (req, res) => {
  const sourceText = String(req.body?.sourceText || '').trim();
  const suggestedEnglish = String(req.body?.suggestedEnglish || '').trim();
  const suggestedVietnamese = String(req.body?.suggestedVietnamese || '').trim();
  const suggestedJapaneseKanji = String(req.body?.suggestedJapaneseKanji || '').trim();
  const suggestedJapaneseRomaji = String(req.body?.suggestedJapaneseRomaji || '').trim();
  const suggestedChineseSimplified = String(req.body?.suggestedChineseSimplified || '').trim();
  const relatedSystem = String(req.body?.relatedSystem || 'auto').trim();
  const note = String(req.body?.note || '').trim();

  if (!sourceText) {
    return res.status(400).json({ message: 'sourceText is required' });
  }

  if (!suggestedEnglish && !suggestedVietnamese && !suggestedJapaneseKanji && !suggestedJapaneseRomaji && !suggestedChineseSimplified) {
    return res.status(400).json({ message: 'At least one suggested translation field is required' });
  }

  try {
    await enqueueContributionWrite(async () => {
      const contributions = await loadContributions();

      const normalizedSource = normalizeText(sourceText);
      const duplicate = contributions.find((item) => {
        return (
          normalizeText(item.sourceText) === normalizedSource &&
          normalizeText(item.suggestedEnglish) === normalizeText(suggestedEnglish) &&
          normalizeText(item.suggestedVietnamese) === normalizeText(suggestedVietnamese) &&
          normalizeText(item.suggestedJapaneseKanji) === normalizeText(suggestedJapaneseKanji) &&
          normalizeText(item.suggestedJapaneseRomaji) === normalizeText(suggestedJapaneseRomaji) &&
          normalizeText(item.suggestedChineseSimplified) === normalizeText(suggestedChineseSimplified)
        );
      });

      if (duplicate) {
        throw new Error('duplicate_contribution');
      }

      contributions.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        sourceText,
        suggestedEnglish,
        suggestedVietnamese,
        suggestedJapaneseKanji,
        suggestedJapaneseRomaji,
        suggestedChineseSimplified,
        relatedSystem,
        note,
      });

      await saveContributions(contributions);

      const category = resolveContributionCategory(relatedSystem);
      const englishField = suggestedEnglish || sourceText;
      const vietnameseField = suggestedVietnamese || sourceText;
      const duplicatePending = pendingTerms.find((item) =>
        normalizeText(item.english) === normalizeText(englishField) &&
        normalizeText(item.vietnamese) === normalizeText(vietnameseField) &&
        normalizeText(item.category?.key) === normalizeText(category.key)
      );

      if (!duplicatePending) {
        pendingTerms.push({
          id: `pending-contrib-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: new Date().toISOString(),
          english: englishField,
          vietnamese: vietnameseField,
          japanese: {
            kanji: suggestedJapaneseKanji || 'N/A',
            romaji: suggestedJapaneseRomaji || 'N/A',
          },
          chinese_simplified: suggestedChineseSimplified || '',
          category,
          source: 'user-contribution',
          sourceText,
          note,
        });
        await savePendingTerms();

        // Send email notification to admin
        await sendContributionEmail(sourceText, englishField, vietnameseField, category, note);
      }
    });

    return res.json({ message: 'Contribution saved' });
  } catch (error) {
    if (error.message === 'duplicate_contribution') {
      return res.status(409).json({ message: 'Đóng góp này đã tồn tại' });
    }

    return res.status(500).json({
      message: 'Cannot save contribution',
      error: error.message,
    });
  }
});

app.post('/api/slide-term-check', (req, res) => {
  const inputText = String(req.body?.text || '').trim();
  const englishText = String(req.body?.english || '').trim();

  const checks = [
    { field: 'text', value: inputText },
    { field: 'english', value: englishText },
  ].filter((item) => item.value);

  if (!checks.length) {
    return res.status(400).json({ message: 'text or english is required' });
  }

  for (const item of checks) {
    const result = checkTermInSlides(item.value);
    if (result.existsInSlides) {
      return res.json({
        existsInSlides: true,
        matchedFrom: item.field,
        matchedTerm: result.matchedTerm,
      });
    }
  }

  return res.json({
    existsInSlides: false,
    matchedFrom: '',
    matchedTerm: '',
  });
});

// Admin API Endpoints
app.post('/api/admin/metrics', checkAdminAuth, (_req, res) => {
  const metrics_data = getMetrics();
  const alertMessage = [];
  
  if (metrics_data.isOverLimit) {
    alertMessage.push(`⚠️ Request limit exceeded: ${metrics_data.requestsLastHour}/${REQUEST_LIMIT_PER_HOUR} per hour`);
  }
  if (metrics_data.isErrorRateHigh) {
    alertMessage.push(`⚠️ High error rate: ${metrics_data.errorRatePercentage}`);
  }
  
  return res.json({
    ...metrics_data,
    alerts: alertMessage,
  });
});

app.get('/api/admin/pending-terms', checkAdminAuth, (_req, res) => {
  return res.json({
    count: pendingTerms.length,
    terms: pendingTerms,
  });
});

app.post('/api/admin/approve-term', checkAdminAuth, async (req, res) => {
  const termId = String(req.body?.termId || '').trim();
  const action = String(req.body?.action || 'approve'); // 'approve' or 'reject'
  
  if (!termId) {
    return res.status(400).json({ message: 'termId is required' });
  }
  
  try {
    const index = pendingTerms.findIndex((t) => t.id === termId);
    if (index === -1) {
      return res.status(404).json({ message: 'Term not found' });
    }
    
    const term = pendingTerms[index];
    
    if (action === 'approve') {
      // Add to dictionary
      const dictRaw = await fs.readFile(DICTIONARY_FILE, 'utf8');
      const dictJson = JSON.parse(dictRaw);
      const key = `${Date.now()}-approved-${Math.random().toString(36).slice(2, 8)}`;
      
      dictJson.terms = dictJson.terms || {};
      dictJson.terms[key] = {
        category: term.category || { key: 'auto', vi: 'Tự động gợi ý', en: 'Auto Suggestion' },
        english: term.english,
        vietnamese: term.vietnamese,
        japanese: term.japanese || { kanji: 'N/A', romaji: 'N/A' },
        chinese_simplified: term.chinese_simplified,
        source: 'approved-from-ai',
      };
      
      await fs.writeFile(DICTIONARY_FILE, JSON.stringify(dictJson, null, 2), 'utf8');
      
      // Reload dictionary index
      await loadDictionaryFromDisk();
      
      pendingTerms.splice(index, 1);
      await savePendingTerms();
      
      return res.json({ message: 'Term approved and added to dictionary' });
    } else if (action === 'reject') {
      pendingTerms.splice(index, 1);
      await savePendingTerms();
      return res.json({ message: 'Term rejected' });
    } else {
      return res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Cannot approve term', error: error.message });
  }
});

app.post('/api/admin/crud-term', checkAdminAuth, async (req, res) => {
  const operation = String(req.body?.operation || '').trim(); // 'create', 'update', 'delete'
  const termKey = String(req.body?.termKey || '').trim();
  const termData = req.body?.termData || {};
  
  if (!operation || !['create', 'update', 'delete'].includes(operation)) {
    return res.status(400).json({ message: 'operation must be create, update, or delete' });
  }
  
  try {
    const dictRaw = await fs.readFile(DICTIONARY_FILE, 'utf8');
    const dictJson = JSON.parse(dictRaw);
    dictJson.terms = dictJson.terms || {};
    
    if (operation === 'create') {
      const newKey = termKey || `term-${Date.now()}`;
      if (dictJson.terms[newKey]) {
        return res.status(409).json({ message: 'Term key already exists' });
      }
      dictJson.terms[newKey] = {
        category: termData.category || {},
        english: termData.english || '',
        vietnamese: termData.vietnamese || '',
        japanese: termData.japanese || { kanji: '', romaji: '' },
        chinese_simplified: termData.chinese_simplified || '',
      };
      await fs.writeFile(DICTIONARY_FILE, JSON.stringify(dictJson, null, 2), 'utf8');
      await loadDictionaryFromDisk();
      return res.json({ message: 'Term created', key: newKey });
    } else if (operation === 'update') {
      if (!termKey || !dictJson.terms[termKey]) {
        return res.status(404).json({ message: 'Term not found' });
      }
      dictJson.terms[termKey] = { ...dictJson.terms[termKey], ...termData };
      await fs.writeFile(DICTIONARY_FILE, JSON.stringify(dictJson, null, 2), 'utf8');
      await loadDictionaryFromDisk();
      return res.json({ message: 'Term updated' });
    } else if (operation === 'delete') {
      if (!termKey || !dictJson.terms[termKey]) {
        return res.status(404).json({ message: 'Term not found' });
      }
      delete dictJson.terms[termKey];
      await fs.writeFile(DICTIONARY_FILE, JSON.stringify(dictJson, null, 2), 'utf8');
      await loadDictionaryFromDisk();
      return res.json({ message: 'Term deleted' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Cannot perform operation', error: error.message });
  }
});

app.post('/api/admin/export-excel', checkAdminAuth, async (req, res) => {
  try {
    const dictRaw = await fs.readFile(DICTIONARY_FILE, 'utf8');
    const dictJson = JSON.parse(dictRaw);
    const terms = dictJson.terms || {};
    
    // Generate CSV format (Excel compatible)
    const rows = [
      ['Key', 'English', 'Vietnamese', 'Japanese (Kanji)', 'Japanese (Romaji)', 'Chinese (Simplified)', 'Category'],
    ];
    
    for (const [key, term] of Object.entries(terms)) {
      rows.push([
        key,
        term.english || '',
        term.vietnamese || '',
        term.japanese?.kanji || '',
        term.japanese?.romaji || '',
        term.chinese_simplified || '',
        term.category?.en || '',
      ]);
    }
    
    // Convert to CSV
    const csv = rows
      .map((row) =>
        row
          .map((cell) => {
            const text = String(cell || '');
            if (text.includes(',') || text.includes('"') || text.includes('\n')) {
              return `"${text.replace(/"/g, '""')}"`;
            }
            return text;
          })
          .join(',')
      )
      .join('\n');
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="dictionary-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    return res.status(500).json({ message: 'Cannot export data', error: error.message });
  }
});

app.post('/api/feedback', async (req, res) => {
  const sourceText = String(req.body?.sourceText || '').trim();
  const translatedText = String(req.body?.translatedText || '').trim();
  const feedbackType = String(req.body?.feedbackType || '').trim(); // 'error', 'suggestion'
  const message = String(req.body?.message || '').trim();
  const userEmail = String(req.body?.userEmail || '').trim();
  
  if (!sourceText || !translatedText || !feedbackType) {
    return res.status(400).json({ message: 'Missing required fields: sourceText, translatedText, feedbackType' });
  }
  
  try {
    const feedback = await logFeedback({
      sourceText,
      translatedText,
      feedbackType,
      message,
      userEmail,
    });
    
    return res.json({ message: 'Feedback recorded', id: feedback.id });
  } catch (error) {
    return res.status(500).json({ message: 'Cannot record feedback', error: error.message });
  }
});

app.get('/admin.html', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'web.html'));
});

setInterval(() => {
  flushCacheToDisk();
}, CACHE_FLUSH_INTERVAL_MS);

const handleShutdown = async () => {
  await flushCacheToDisk();
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

async function startServer() {
  await loadDictionaryFromDisk();
  await loadCacheFromDisk();
  await loadSlideCorpus();
  await loadPendingTerms();

  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
