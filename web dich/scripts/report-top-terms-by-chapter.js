const fs = require('fs/promises');
const path = require('path');
const natural = require('natural');

const ROOT_DIR = path.join(__dirname, '..');
const CHAPTER_DIR = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT_DIR, 'docs', 'chapters');
const TOP_N = Number(process.argv[3] || 80);
const REPORT_DIR = path.join(ROOT_DIR, 'reports');
const REPORT_CHAPTER_DIR = path.join(REPORT_DIR, 'chapters');
const REPORT_JSON = path.join(REPORT_DIR, 'chapter_top_terms.json');
const REPORT_CSV = path.join(REPORT_DIR, 'chapter_top_terms.csv');
const CHAPTER_INDEX_FILE = path.join(ROOT_DIR, 'docs', 'asi101_chapter_index.json');
const DICTIONARY_PATH = path.join(ROOT_DIR, 'dictionary.json');

const automotiveKeywords = new Set([
  'engine', 'motor', 'battery', 'cell', 'pack', 'charger', 'inverter', 'converter', 'transmission',
  'gear', 'gearbox', 'brake', 'caliper', 'rotor', 'pad', 'wheel', 'tire', 'tyre', 'axle', 'suspension',
  'damper', 'spring', 'chassis', 'steering', 'torque', 'sensor', 'radar', 'lidar', 'camera', 'ultrasonic',
  'ecu', 'controller', 'module', 'drivetrain', 'coolant', 'thermal', 'hv', 'voltage', 'current',
  'charging', 'port', 'bms', 'soc', 'soh', 'adas', 'lane', 'collision', 'blind', 'spot', 'cruise',
  'pedestrian', 'traffic', 'regenerative', 'autonomous', 'drive', 'powertrain', 'actuator',
]);

const lexicon = new natural.Lexicon(
  require('natural/lib/natural/brill_pos_tagger/data/English/lexicon_from_posjs.json'),
  'N'
);
const rules = new natural.RuleSet(
  require('natural/lib/natural/brill_pos_tagger/data/English/tr_from_posjs.txt')
);
const tagger = new natural.BrillPOSTagger(lexicon, rules);
const tokenizer = new natural.WordTokenizer();
const sentenceTokenizer = new natural.SentenceTokenizer();

const normalizeSpace = (text) => String(text || '').replace(/\s+/g, ' ').trim();
const normalize = (text) => normalizeSpace(text).toLowerCase();
const isNounTag = (tag) => /^NN/.test(tag);
const isAdjectiveTag = (tag) => /^JJ/.test(tag);

function csvEscape(value) {
  const text = String(value || '');
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function extractCandidateTermCounts(text) {
  const counter = new Map();
  const sentences = sentenceTokenizer.tokenize(String(text || ''));

  for (const sentence of sentences) {
    const tokens = tokenizer.tokenize(sentence).map((token) => token.toLowerCase());
    if (!tokens.length) {
      continue;
    }

    const tagged = tagger.tag(tokens).taggedWords;
    let phrase = [];

    for (const wordData of tagged) {
      const token = wordData.token;
      const tag = wordData.tag;
      const tokenClean = token.replace(/[^a-z0-9-]/g, '');

      if (!tokenClean) {
        phrase = [];
        continue;
      }

      if (isNounTag(tag) || isAdjectiveTag(tag) || tokenClean === 'of') {
        phrase.push({ token: tokenClean, tag });

        if (phrase.length > 5) {
          phrase.shift();
        }

        const nounCount = phrase.filter((item) => isNounTag(item.tag)).length;
        const hasKeyword = phrase.some((item) => automotiveKeywords.has(item.token));

        if (nounCount >= 1 && hasKeyword) {
          const phraseText = phrase.map((item) => item.token).join(' ').trim();
          const wordCount = phraseText.split(' ').length;

          if (wordCount >= 2 && wordCount <= 5) {
            counter.set(phraseText, (counter.get(phraseText) || 0) + 1);
          }
        }
      } else {
        phrase = [];
      }
    }
  }

  return counter;
}

async function loadDictionaryEnglishSet() {
  try {
    const raw = await fs.readFile(DICTIONARY_PATH, 'utf8');
    const json = JSON.parse(raw);
    return new Set(
      Object.values(json?.terms || {})
        .map((term) => normalize(term?.english))
        .filter(Boolean)
    );
  } catch (_error) {
    return new Set();
  }
}

async function loadChapterLabels() {
  try {
    const raw = await fs.readFile(CHAPTER_INDEX_FILE, 'utf8');
    const items = JSON.parse(raw);
    const map = new Map();

    for (const item of items) {
      const chapterFile = String(item.chapterFile || '').replace(/\\/g, '/');
      const fileName = path.basename(chapterFile);
      map.set(fileName, item.chapterLabel || fileName);
    }

    return map;
  } catch (_error) {
    return new Map();
  }
}

async function main() {
  const entries = await fs.readdir(CHAPTER_DIR, { withFileTypes: true });
  const chapterFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.txt'))
    .map((entry) => path.join(CHAPTER_DIR, entry.name))
    .sort((a, b) => a.localeCompare(b));

  if (!chapterFiles.length) {
    console.log(`No chapter .txt files found in: ${CHAPTER_DIR}`);
    return;
  }

  await fs.mkdir(REPORT_DIR, { recursive: true });
  await fs.mkdir(REPORT_CHAPTER_DIR, { recursive: true });

  const dictionaryEnglishSet = await loadDictionaryEnglishSet();
  const chapterLabelMap = await loadChapterLabels();
  const chapters = [];
  const csvRows = [['chapter_label', 'chapter_file', 'rank', 'term', 'count', 'in_dictionary']];

  for (const chapterPath of chapterFiles) {
    const chapterFileName = path.basename(chapterPath);
    const chapterLabel = chapterLabelMap.get(chapterFileName) || chapterFileName;
    const raw = await fs.readFile(chapterPath, 'utf8');
    const counts = extractCandidateTermCounts(raw);

    const sorted = [...counts.entries()]
      .map(([term, count]) => ({
        term,
        count,
        inDictionary: dictionaryEnglishSet.has(normalize(term)),
      }))
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.term.localeCompare(b.term);
      });

    const topTerms = sorted.slice(0, Math.max(1, TOP_N));

    topTerms.forEach((item, index) => {
      csvRows.push([
        chapterLabel,
        chapterFileName,
        String(index + 1),
        item.term,
        String(item.count),
        item.inDictionary ? 'yes' : 'no',
      ]);
    });

    const chapterReport = {
      chapterLabel,
      chapterFile: chapterFileName,
      totalUniqueTerms: sorted.length,
      topTerms,
    };

    chapters.push(chapterReport);

    const chapterReportFile = path.join(REPORT_CHAPTER_DIR, chapterFileName.replace(/\.txt$/i, '.json'));
    await fs.writeFile(chapterReportFile, JSON.stringify(chapterReport, null, 2), 'utf8');
  }

  const finalReport = {
    generatedAt: new Date().toISOString(),
    chapterDir: CHAPTER_DIR,
    topN: TOP_N,
    totalChapters: chapters.length,
    chapters,
  };

  await fs.writeFile(REPORT_JSON, JSON.stringify(finalReport, null, 2), 'utf8');

  const csvText = csvRows.map((row) => row.map(csvEscape).join(',')).join('\n');
  await fs.writeFile(REPORT_CSV, csvText, 'utf8');

  console.log(`Generated JSON report: ${REPORT_JSON}`);
  console.log(`Generated CSV report: ${REPORT_CSV}`);
  console.log(`Generated chapter JSON files: ${REPORT_CHAPTER_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
