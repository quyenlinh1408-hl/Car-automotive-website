const fs = require('fs/promises');
const path = require('path');
const AdmZip = require('adm-zip');

const SOURCE_DIR = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve('d:/CODE visual studio/ASI101/1. Slide');

const OUTPUT_DIR = path.resolve(__dirname, '..', 'docs');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'asi101_slides_corpus.txt');
const CHAPTER_DIR = path.join(OUTPUT_DIR, 'chapters');
const CHAPTER_INDEX_FILE = path.join(OUTPUT_DIR, 'asi101_chapter_index.json');

const decodeXmlEntities = (text) =>
  String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#10;/g, '\n');

const normalizeSpace = (text) => String(text || '').replace(/\s+/g, ' ').trim();

function extractTextFromSlideXml(xml) {
  const matches = [...String(xml).matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)];
  const raw = matches.map((match) => decodeXmlEntities(match[1]));
  const cleaned = raw.map(normalizeSpace).filter(Boolean);
  return cleaned.join('\n');
}

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120);
}

function parseChapterLabel(fileName) {
  const match = String(fileName).match(/\[(Chapter[^\]]+)\]/i);
  if (!match) {
    return 'chapter_unknown';
  }

  return match[1].replace(/\s+/g, ' ').trim();
}

async function main() {
  const entries = await fs.readdir(SOURCE_DIR, { withFileTypes: true });
  const pptxFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.pptx'))
    .map((entry) => path.join(SOURCE_DIR, entry.name))
    .sort((a, b) => a.localeCompare(b));

  if (!pptxFiles.length) {
    console.log(`No .pptx files found in ${SOURCE_DIR}`);
    return;
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(CHAPTER_DIR, { recursive: true });

  const chunks = [];
  const chapterBuckets = {};
  for (const filePath of pptxFiles) {
    const zip = new AdmZip(filePath);
    const slideEntries = zip
      .getEntries()
      .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/i.test(entry.entryName))
      .sort((a, b) => a.entryName.localeCompare(b.entryName));

    const title = path.basename(filePath);
    const chapterLabel = parseChapterLabel(title);

    if (!chapterBuckets[chapterLabel]) {
      chapterBuckets[chapterLabel] = {
        files: [],
        textChunks: [],
      };
    }

    chapterBuckets[chapterLabel].files.push(title);
    chunks.push(`\n===== FILE: ${title} =====`);
    chapterBuckets[chapterLabel].textChunks.push(`\n===== FILE: ${title} =====`);

    for (const slideEntry of slideEntries) {
      const xml = slideEntry.getData().toString('utf8');
      const slideText = extractTextFromSlideXml(xml);
      if (!slideText) {
        continue;
      }

      chunks.push(`\n--- ${slideEntry.entryName} ---`);
      chunks.push(slideText);
      chapterBuckets[chapterLabel].textChunks.push(`\n--- ${slideEntry.entryName} ---`);
      chapterBuckets[chapterLabel].textChunks.push(slideText);
    }
  }

  await fs.writeFile(OUTPUT_FILE, chunks.join('\n'), 'utf8');

  const chapterIndex = [];
  for (const [chapterLabel, payload] of Object.entries(chapterBuckets)) {
    const chapterSlug = slugify(chapterLabel || 'chapter_unknown');
    const chapterFileName = `${chapterSlug || 'chapter_unknown'}.txt`;
    const chapterFilePath = path.join(CHAPTER_DIR, chapterFileName);

    await fs.writeFile(chapterFilePath, payload.textChunks.join('\n'), 'utf8');

    chapterIndex.push({
      chapterLabel,
      chapterFile: path.relative(path.join(__dirname, '..'), chapterFilePath).replace(/\\/g, '/'),
      sourceFiles: payload.files,
    });
  }

  await fs.writeFile(CHAPTER_INDEX_FILE, JSON.stringify(chapterIndex, null, 2), 'utf8');

  console.log(`Extracted corpus from ${pptxFiles.length} files to: ${OUTPUT_FILE}`);
  console.log(`Created ${chapterIndex.length} chapter files in: ${CHAPTER_DIR}`);
  console.log(`Wrote chapter index: ${CHAPTER_INDEX_FILE}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
