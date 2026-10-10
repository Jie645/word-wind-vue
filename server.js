/* ============================================================
 * Word Wind 本地服务器
 *   1. 静态托管当前目录，便于脱离 file:// 运行
 *   2. 提供 /api/news/*，代理并解析 Breaking News English
 * 运行：node server.js
 * ============================================================ */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const newsParser = require('./js/lib/breaking-news');

const ROOT = __dirname;
const PORT = parseInt(process.env.PORT, 10) || 8899;
const HOME_URL = newsParser.HOME_URL;
const LIST_TTL = 10 * 60 * 1000;
const ARTICLE_TTL = 30 * 60 * 1000;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

let listCache = { expires: 0, value: null };
const articleCache = new Map();

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(body);
}

function sendError(res, status, message) {
  sendJson(res, status, { ok: false, error: message });
}

async function fetchRemote(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WordWindReader/1.0; educational reading tool)',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });
    if (!response.ok) throw new Error('目标网站返回 HTTP ' + response.status);
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function getNewsList(force) {
  if (!force && listCache.value && listCache.expires > Date.now()) return listCache.value;
  const html = await fetchRemote(HOME_URL);
  const items = newsParser.parseHomepage(html, HOME_URL);
  if (!items.length) throw new Error('首页解析后没有得到新闻列表');
  listCache = { value: items, expires: Date.now() + LIST_TTL };
  return items;
}

function validateArticleUrl(raw) {
  let parsed;
  try { parsed = new URL(raw); } catch (e) { throw new Error('文章 URL 无效'); }
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (parsed.protocol !== 'https:' || host !== 'breakingnewsenglish.com') {
    throw new Error('只允许读取 Breaking News English 的文章');
  }
  if (!/\.html$/i.test(parsed.pathname)) throw new Error('文章 URL 格式无效');
  return parsed.toString();
}

async function getArticle(rawUrl, requestedLevel) {
  const url = validateArticleUrl(rawUrl);
  const level = Math.max(0, Math.min(6, parseInt(requestedLevel, 10) || 0));
  const key = url + '::' + level;
  const cached = articleCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;

  const html = await fetchRemote(url);
  const item = { id: url, title: '', date: '', kind: 'News', summary: '' };
  const article = newsParser.parseArticlePage(html, url, item, level);
  articleCache.set(key, { value: article, expires: Date.now() + ARTICLE_TTL });
  return article;
}

async function handleApi(req, res, parsedUrl) {
  if (parsedUrl.pathname === '/api/health') {
    sendJson(res, 200, { ok: true, service: 'word-wind-news', source: HOME_URL });
    return true;
  }
  if (parsedUrl.pathname === '/api/news/list' || parsedUrl.pathname === '/api/news') {
    try {
      const items = await getNewsList(parsedUrl.searchParams.get('refresh') === '1');
      sendJson(res, 200, { ok: true, source: HOME_URL, fetchedAt: new Date().toISOString(), items: items });
    } catch (error) {
      sendError(res, 502, error.message || '获取新闻列表失败');
    }
    return true;
  }
  if (parsedUrl.pathname === '/api/news/article') {
    try {
      const article = await getArticle(parsedUrl.searchParams.get('url'), parsedUrl.searchParams.get('level'));
      sendJson(res, 200, { ok: true, article: article });
    } catch (error) {
      sendError(res, 502, error.message || '获取文章失败');
    }
    return true;
  }
  return false;
}

function sendFile(req, res, filePath) {
  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Not found'); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'no-cache'
    });
    if (req.method === 'HEAD') { res.end(); return; }
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  let parsedUrl;
  try { parsedUrl = new URL(req.url, 'http://localhost'); } catch (e) { sendError(res, 400, '请求地址无效'); return; }

  if (parsedUrl.pathname.indexOf('/api/') === 0) {
    if (req.method !== 'GET' && req.method !== 'HEAD') { sendError(res, 405, '只支持 GET 请求'); return; }
    const handled = await handleApi(req, res, parsedUrl);
    if (!handled) sendError(res, 404, '接口不存在');
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end('Method not allowed'); return; }
  let pathname;
  try { pathname = decodeURIComponent(parsedUrl.pathname); } catch (e) { res.writeHead(400); res.end('Bad request'); return; }
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.resolve(ROOT, '.' + pathname);
  const relative = path.relative(ROOT, filePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) { res.writeHead(403); res.end('Forbidden'); return; }
  sendFile(req, res, filePath);
});

server.listen(PORT, () => {
  console.log('Word Wind 已启动：http://127.0.0.1:' + PORT);
  console.log('实时新闻 API：http://127.0.0.1:' + PORT + '/api/news/list');
});