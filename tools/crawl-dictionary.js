/* ============================================================
 * 阅读词典爬虫
 *   node tools/crawl-dictionary.js --limit=1000 --concurrency=8
 *
 * 从 data/news-cache.json 提取所有文章词汇，并为缺失词抓取
 * 英文释义、音标、词形变化和中文翻译，增量写入
 * data/dictionary-cache.json。
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const readingUtils = require('../js/lib/reading-utils');
const dictionary = require('../js/lib/dictionary');

const ROOT = path.join(__dirname, '..');
const NEWS_CACHE = path.join(ROOT, 'data', 'news-cache.json');
const DICT_CACHE = path.join(ROOT, 'data', 'dictionary-cache.json');
const SOURCE_NAME = 'Free Dictionary API + Wiktionary + MyMemory';

function readArg(name, fallback) {
  const prefix = '--' + name + '=';
  const found = process.argv.find((arg) => arg.indexOf(prefix) === 0);
  return found ? found.slice(prefix.length) : fallback;
}
const LIMIT = process.argv.indexOf('--all') > -1 ? Infinity : Math.max(1, parseInt(readArg('limit', '1000'), 10) || 1000);
const CONCURRENCY = Math.max(1, Math.min(12, parseInt(readArg('concurrency', '8'), 10) || 8));

function readJson(file, fallback) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; }
}

function collectWords(news) {
  const words = new Set();
  Object.keys(news.articles || {}).forEach((key) => {
    const article = news.articles[key];
    (article.paragraphs || []).forEach((paragraph) => {
      readingUtils.tokenizeArticle([paragraph], []).forEach((tokens) => {
        tokens.forEach((token) => {
          if (token.type !== 'word') return;
          const key = readingUtils.normalizeKey(token.text);
          if (key && key.length > 1 && !words.has(key)) words.add(key);
        });
      });
    });
  });
  return Array.from(words).sort();
}

function hasEntry(cache, word) {
  return dictionary.candidates(word).some((candidate) => !!cache.words[candidate]);
}

async function runPool(jobs, worker, concurrency) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
    while (cursor < jobs.length) {
      const index = cursor++;
      await worker(jobs[index], index);
    }
  });
  await Promise.all(runners);
}

async function main() {
  const news = readJson(NEWS_CACHE, null);
  if (!news || !news.articles) throw new Error('请先运行 tools/crawl-breaking-news.js 生成新闻缓存');

  const oldCache = readJson(DICT_CACHE, { words: {} });
  const cache = {
    source: SOURCE_NAME,
    count: 0,
    failed: 0,
    words: Object.assign({}, oldCache.words || {})
  };

  const allWords = collectWords(news);
  const missing = allWords.filter((word) => !hasEntry(cache, word));
  const jobs = missing.slice(0, LIMIT);
  console.log('文章词汇：' + allWords.length + '，已收录：' + (allWords.length - missing.length) + '，本次抓取：' + jobs.length);

  let failed = 0;
  let completed = 0;
  if (jobs.length) {
    await runPool(jobs, async (word) => {
      try {
        const entry = await dictionary.fetchEntry(word, { translate: false });
        if (entry) cache.words[word] = entry;
        else failed++;
      } catch (error) {
        failed++;
      } finally {
        completed++;
        if (completed % 25 === 0 || completed === jobs.length) {
          console.log('  进度 ' + completed + '/' + jobs.length + '，缓存 ' + Object.keys(cache.words).length + '，失败 ' + failed);
        }
      }
    }, CONCURRENCY);
  }

  cache.count = Object.keys(cache.words).length;
  cache.failed = failed;
  fs.mkdirSync(path.dirname(DICT_CACHE), { recursive: true });
  fs.writeFileSync(DICT_CACHE, JSON.stringify(cache, null, 2) + '\n', 'utf8');
  console.log('已生成：' + DICT_CACHE);
  console.log('词典缓存共 ' + cache.count + ' 词，本次失败 ' + failed + ' 个');
}

main().catch((error) => {
  console.error('词典爬虫失败：' + error.message);
  process.exit(1);
});