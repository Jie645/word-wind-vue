/* ============================================================
 * Breaking News English 新闻爬虫
 *   node tools/crawl-breaking-news.js --limit=50
 *   node tools/crawl-breaking-news.js --all --concurrency=3
 *
 * 输出：data/news-cache.json
 * GitHub Actions 会定时运行本脚本，供 GitHub Pages 静态读取。
 * ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const parser = require('../js/lib/breaking-news');

const ROOT = path.join(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'news-cache.json');
const HOME_URL = parser.HOME_URL;
const USER_AGENT = 'Mozilla/5.0 (compatible; WordWindCrawler/1.0; educational reading tool)';

function readArg(name, fallback) {
  const prefix = '--' + name + '=';
  const found = process.argv.find((arg) => arg.indexOf(prefix) === 0);
  return found ? found.slice(prefix.length) : fallback;
}
const LIMIT = process.argv.indexOf('--all') > -1 ? Infinity : Math.max(1, parseInt(readArg('limit', '50'), 10) || 50);
const CONCURRENCY = Math.max(1, Math.min(6, parseInt(readArg('concurrency', '3'), 10) || 3));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchHtml(url, attempts) {
  const max = attempts || 3;
  let lastError;
  for (let attempt = 1; attempt <= max; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': USER_AGENT, 'Accept': 'text/html,application/xhtml+xml' }
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < max) await sleep(400 * attempt);
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error('抓取失败 ' + url + '：' + (lastError && lastError.message || '未知错误'));
}

async function runPool(jobs, worker, concurrency) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(concurrency, jobs.length) }, async () => {
    while (cursor < jobs.length) {
      const index = cursor++;
      await worker(jobs[index], index);
    }
  });
  if (process.env.DEBUG_CRAWLER) console.log('  DEBUG runners=' + runners.length + ' jobs=' + jobs.length);
  await Promise.all(runners);
}

async function main() {
  console.log('抓取首页：' + HOME_URL);
  const homeHtml = await fetchHtml(HOME_URL);
  const homeItems = parser.parseHomepage(homeHtml, HOME_URL);
  if (!homeItems.length) throw new Error('没有从首页解析出新闻列表');

  let allItems = homeItems;
  if (process.argv.indexOf('--home-only') < 0) {
    const archives = [
      { level: 0, url: parser.absoluteUrl('easy-news-english.html', HOME_URL) },
      { level: 1, url: parser.absoluteUrl('simple-english-news.html', HOME_URL) },
      { level: 2, url: parser.absoluteUrl('easy-english-news.html', HOME_URL) },
      { level: 3, url: parser.absoluteUrl('graded-news-stories.html', HOME_URL) },
      { level: 4, url: parser.absoluteUrl('graded-news-articles.html', HOME_URL) },
      { level: 5, url: parser.absoluteUrl('english-news-readings.html', HOME_URL) },
      { level: 6, url: parser.absoluteUrl('news-for-kids.html', HOME_URL) }
    ];
    console.log('抓取 Level 0-6 归档页...');
    const groups = await Promise.all(archives.map(async (archive) => {
      const html = await fetchHtml(archive.url);
      return parser.parseArchivePage(html, archive.url, archive.level);
    }));
    allItems = parser.mergeNewsItems([homeItems].concat(groups));
  }

  const items = allItems.slice(0, LIMIT).map((item) => ({
    id: item.id,
    title: item.title,
    url: item.url,
    date: item.date,
    dateIso: item.dateIso || '',
    kind: item.kind,
    summary: item.summary,
    availableLevels: item.availableLevels
  }));

  const jobs = [];
  items.forEach((item) => {
    Object.keys(item.availableLevels).forEach((level) => {
      jobs.push({ item: item, level: parseInt(level, 10), url: item.availableLevels[level] });
    });
  });

  console.log('文章：' + items.length + ' 篇，版本：' + jobs.length + ' 个，并发：' + CONCURRENCY);
  const articles = {};
  let failed = 0;
  let completed = 0;

  await runPool(jobs, async (job) => {
    try {
      const html = await fetchHtml(job.url);
      const article = parser.parseArticlePage(html, job.url, job.item, job.level);
      article.id = job.item.id;
      article.availableLevels = job.item.availableLevels;
      articles[job.url] = article;
    } catch (error) {
      failed++;
      console.warn('  WARN Level ' + job.level + ' ' + job.url + '：' + error.message);
    } finally {
      completed++;
      if (completed === jobs.length || completed % Math.max(1, Math.floor(jobs.length / 5)) === 0) {
        console.log('  进度 ' + completed + '/' + jobs.length + '，成功 ' + Object.keys(articles).length + '，失败 ' + failed);
      }
    }
  }, CONCURRENCY);

  if (!Object.keys(articles).length) throw new Error('所有文章都抓取失败');

  const orderedArticles = {};
  Object.keys(articles).sort().forEach((key) => { orderedArticles[key] = articles[key]; });
  const output = {
    source: HOME_URL,
    sourceName: parser.SOURCE_NAME,
    count: items.length,
    versions: Object.keys(orderedArticles).length,
    failed: failed,
    items: items,
    articles: orderedArticles
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log('已生成：' + OUTPUT);
  console.log('成功 ' + Object.keys(orderedArticles).length + ' 个版本，失败 ' + failed + ' 个');
}

main().catch((error) => {
  console.error('爬虫失败：' + error.message);
  process.exit(1);
});