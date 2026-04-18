const fs = require('fs/promises');
const path = require('path');
const natural = require('natural');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ROOT_DIR = path.join(__dirname, '..');
const INPUT_DIR = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ROOT_DIR, 'docs');
const DICTIONARY_PATH = path.join(ROOT_DIR, 'dictionary.json');
const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY || '';

const automotiveKeywords = new Set([
  'engine', 'motor', 'battery', 'cell', 'pack', 'charger', 'inverter', 'converter', 'transmission',
  'gear', 'gearbox', 'brake', 'caliper', 'rotor', 'pad', 'wheel', 'tire', 'tyre', 'axle', 'suspension',
  'damper', 'spring', 'chassis', 'steering', 'torque', 'sensor', 'radar', 'lidar', 'camera', 'ultrasonic',
  'ecu', 'controller', 'module', 'drivetrain', 'coolant', 'thermal', 'hv', 'voltage', 'current',
  'charging', 'port', 'bms', 'soc', 'soh', 'adas', 'lane', 'collision', 'blind', 'spot', 'cruise',
  'pedestrian', 'traffic', 'battery', 'regenerative', 'autonomous', 'drive', 'powertrain', 'actuator',
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
const toKey = (text) => normalizeSpace(text).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
const isNounTag = (tag) => /^NN/.test(tag);
const isAdjectiveTag = (tag) => /^JJ/.test(tag);

async function findTextFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
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

function extractCandidateTerms(text) {
  const candidates = new Set();
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
            candidates.add(phraseText);
          }
        }
      } else {
        phrase = [];
      }
    }
  }

  return candidates;
}

async function translateWithGoogle(text, target) {
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
      source: 'en',
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

async function buildTranslatedEntry(termEnglish) {
  const [vietnamese, japaneseKanji, chineseSimplified] = await Promise.all([
    translateWithGoogle(termEnglish, 'vi'),
    translateWithGoogle(termEnglish, 'ja'),
    translateWithGoogle(termEnglish, 'zh-CN'),
  ]);

  return {
    english: termEnglish,
    vietnamese,
    japanese: {
      kanji: japaneseKanji,
      romaji: 'N/A',
    },
    chinese_simplified: chineseSimplified,
  };
}

async function main() {
  const dictionaryRaw = await fs.readFile(DICTIONARY_PATH, 'utf8');
  const dictionaryJson = JSON.parse(dictionaryRaw);
  const existingTerms = dictionaryJson.terms || {};

  const existingEnglish = new Set(
    Object.values(existingTerms)
      .map((item) => normalizeSpace(item.english).toLowerCase())
      .filter(Boolean)
  );

  const files = await findTextFiles(INPUT_DIR);
  if (!files.length) {
    console.log(`No .txt files found in: ${INPUT_DIR}`);
    return;
  }

  const extracted = new Set();
  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');
    const candidates = extractCandidateTerms(raw);
    for (const term of candidates) {
      extracted.add(normalizeSpace(term));
    }
  }

  const toTranslate = [...extracted]
    .map((term) => term.toLowerCase())
    .filter((term) => !existingEnglish.has(term));

  if (!toTranslate.length) {
    console.log('No new terms to translate.');
    return;
  }

  console.log(`Extracted ${toTranslate.length} new candidate terms.`);

  let added = 0;
  for (const term of toTranslate) {
    try {
      const translated = await buildTranslatedEntry(term);
      const key = toKey(term);

      if (!key || existingTerms[key]) {
        continue;
      }

      existingTerms[key] = translated;
      existingEnglish.add(term);
      added += 1;
      console.log(`Added: ${term}`);
    } catch (error) {
      console.error(`Failed term '${term}': ${error.message}`);
    }
  }

  dictionaryJson.terms = existingTerms;
  await fs.writeFile(DICTIONARY_PATH, JSON.stringify(dictionaryJson, null, 2), 'utf8');

  console.log(`Done. Added ${added} new terms to dictionary.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
