/* ============================================================
 * Breaking News English 数据解析与前端数据源
 *   浏览器：通过同源 /api 获取实时新闻，避免目标站点 CORS 限制
 *   Node：server.js 复用同一模块解析首页和文章页
 * ============================================================ */
(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) {
    root.WW = root.WW || {};
    root.WW.breakingNews = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function (root) {
  'use strict';

  const HOME_URL = 'https://breakingnewsenglish.com/';
  const SOURCE_NAME = 'Breaking News English';
  const LEVEL_BANDS = ['A2', 'A2-B1', 'A2-B1', 'B1', 'B1-B2', 'B2-C1', 'C1-C2'];
  const ENTITIES = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    ndash: '-', mdash: '-', hellip: '...', rsquo: "'", lsquo: "'",
    rdquo: '"', ldquo: '"', copy: '(c)', reg: '(R)'
  };

  function decodeHtml(value) {
    return String(value || '')
      .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
      .replace(/&([a-z][a-z0-9]+);/gi, (m, name) => {
        const key = String(name).toLowerCase();
        return Object.prototype.hasOwnProperty.call(ENTITIES, key) ? ENTITIES[key] : m;
      });
  }

  function textFromHtml(value, preserveBreaks) {
    let s = String(value || '')
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ');
    if (preserveBreaks) {
      s = s.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h[1-6])>/gi, '\n\n');
    } else {
      s = s.replace(/<br\s*\/?>/gi, ' ');
    }
    s = decodeHtml(s.replace(/<[^>]*>/g, ' ')).replace(/\u00a0/g, ' ');
    if (preserveBreaks) {
      return s
        .replace(/[ \t\f\v]+/g, ' ')
        .replace(/ *\n */g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }
    return s.replace(/\s+/g, ' ').trim();
  }

  function compactText(value) {
    return textFromHtml(value, false);
  }

  function extractAttr(tag, name) {
    const re = new RegExp(name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i');
    const m = String(tag || '').match(re);
    return m ? decodeHtml(m[1] || m[2] || m[3] || '') : '';
  }

  function getMetaContent(html, wanted) {
    const tags = String(html || '').match(/<meta\b[^>]*>/gi) || [];
    for (let i = 0; i < tags.length; i++) {
      const key = extractAttr(tags[i], 'property') || extractAttr(tags[i], 'name');
      if (key.toLowerCase() === String(wanted).toLowerCase()) return extractAttr(tags[i], 'content');
    }
    return '';
  }

  function absoluteUrl(href, baseUrl) {
    const raw = String(href || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    const base = String(baseUrl || HOME_URL);
    const origin = (base.match(/^https?:\/\/[^/]+/i) || [HOME_URL])[0];
    if (raw.charAt(0) === '/') return origin + raw;
    const path = base.split(/[?#]/)[0].replace(/[^/]*$/, '');
    return path + raw.replace(/^\.\//, '');
  }

  function parseLevelLinks(html, baseUrl) {
    const levels = {};
    const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = re.exec(String(html || ''))) !== null) {
      const levelMatch = compactText(m[2]).match(/\bLevel\s*([0-6])\b/i);
      const href = extractAttr(m[1], 'href');
      if (!levelMatch || !href || /^javascript:/i.test(href)) continue;
      levels[String(parseInt(levelMatch[1], 10))] = absoluteUrl(href, baseUrl);
    }
    return levels;
  }

  function levelNumbers(levels) {
    return Object.keys(levels || {})
      .map((n) => parseInt(n, 10))
      .filter((n) => n >= 0 && n <= 6)
      .sort((a, b) => a - b);
  }

  function resolveLevel(levels, requestedLevel) {
    const available = levelNumbers(levels);
    if (!available.length) return null;
    const target = Math.max(0, Math.min(6, parseInt(requestedLevel, 10) || 0));
    if (available.indexOf(target) > -1) return target;
    return available.slice().sort((a, b) => {
      const da = Math.abs(a - target);
      const db = Math.abs(b - target);
      if (da !== db) return da - db;
      return a - b;
    })[0];
  }

  function resolveItemLevel(item, requestedLevel) {
    const level = resolveLevel(item && item.availableLevels, requestedLevel);
    return level === null ? null : {
      level: level,
      url: item.availableLevels[String(level)],
      fallback: level !== parseInt(requestedLevel, 10)
    };
  }

  function parseHomepage(html, baseUrl) {
    const source = String(html || '');
    const blocks = source.match(/<div\b[^>]*class=["'][^"']*lesson-excerpt[^"']*["'][^>]*>[\s\S]*?<\/article>\s*<\/div>/gi) || [];
    const items = [];
    const seen = {};

    blocks.forEach((block) => {
      const header = block.match(/<header[^>]*>\s*<h3[^>]*>\s*<a\b([^>]*)>([\s\S]*?)<\/a>/i);
      let href = header ? extractAttr(header[1], 'href') : '';
      let title = header ? compactText(header[2]) : '';
      if (!href) {
        const thumb = block.match(/<a\b([^>]*class=["'][^"']*thumbnail[^"']*["'][^>]*)>/i);
        href = thumb ? extractAttr(thumb[1], 'href') : '';
      }
      const levels = parseLevelLinks(block, baseUrl || HOME_URL);
      if (!href || !title || !levelNumbers(levels).length) return;
      const url = absoluteUrl(href, baseUrl || HOME_URL);
      if (seen[url]) return;
      seen[url] = true;

      const meta = block.match(/<div\b[^>]*class=["'][^"']*smallfont[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      const metaText = meta ? compactText(meta[1]) : '';
      const kindMatch = metaText.match(/\b(Easier|Harder)\b/i);
      const date = metaText.replace(/\s*-\s*["']?(?:Easier|Harder)["']?\s*$/i, '').trim();
      const summaryMatch = block.match(/<div\b[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
      const relative = url.replace(/^https?:\/\/[^/]+/i, '').replace(/^\//, '');

      items.push({
        id: relative,
        title: title,
        url: url,
        date: date,
        kind: kindMatch ? kindMatch[1].charAt(0).toUpperCase() + kindMatch[1].slice(1).toLowerCase() : 'News',
        summary: summaryMatch ? compactText(summaryMatch[1]) : '',
        availableLevels: levels
      });
    });
    return items;
  }

  function extractArticleBody(html) {
    const source = String(html || '');
    const marker = source.search(/<div\b[^>]*id=["']lesson-archive["']/i);
    const area = marker > -1 ? source.slice(marker) : source;
    const article = area.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i);
    return article ? article[1] : '';
  }

  function extractParagraphs(bodyHtml) {
    const body = String(bodyHtml || '').replace(/<br\s*\/?>/gi, '\n');
    const paragraphs = [];
    const pRe = /<p\b[^>]*>([\s\S]*?)<\/p>/gi;
    let m;
    while ((m = pRe.exec(body)) !== null) {
      const chunks = textFromHtml(m[1], true).split(/\n\s*\n/);
      chunks.forEach((chunk) => {
        const clean = chunk.replace(/\s+/g, ' ').trim();
        if (clean.length > 20) paragraphs.push(clean);
      });
    }
    if (!paragraphs.length) {
      const fallback = textFromHtml(body, true).split(/\n\s*\n/);
      fallback.forEach((chunk) => {
        const clean = chunk.replace(/\s+/g, ' ').trim();
        if (clean.length > 20) paragraphs.push(clean);
      });
    }
    return paragraphs;
  }

  function countWords(paragraphs) {
    return (paragraphs || []).reduce((total, p) => {
      const words = String(p).match(/[A-Za-z][A-Za-z'’-]*/g);
      return total + (words ? words.length : 0);
    }, 0);
  }

  function parseArticlePage(html, pageUrl, item, requestedLevel) {
    const source = String(html || '');
    const headings = [];
    const hRe = /<h([1-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
    let h;
    while ((h = hRe.exec(source)) !== null) headings.push({ level: parseInt(h[1], 10), text: compactText(h[2]) });

    const levelHeading = headings.find((x) => /The Reading\s*\/\s*Listening/i.test(x.text) && /\bLevel\s*[0-6]\b/i.test(x.text));
    const currentMatch = levelHeading && levelHeading.text.match(/\bLevel\s*([0-6])\b/i);
    const availableLevels = parseLevelLinks(source, pageUrl);
    if (currentMatch) availableLevels[currentMatch[1]] = absoluteUrl(pageUrl, HOME_URL);

    const target = requestedLevel === undefined || requestedLevel === null
      ? (currentMatch ? parseInt(currentMatch[1], 10) : resolveLevel(availableLevels, 3))
      : parseInt(requestedLevel, 10);
    const resolvedLevel = resolveLevel(availableLevels, target);

    const titleHeading = headings.find((x) => x.level === 2 && /\(\d{4}\)/.test(x.text));
    const titleLine = titleHeading ? titleHeading.text : '';
    const dateMatch = titleLine.match(/\(([^()]*\d{4}[^()]*)\)\s*$/);
    const title = getMetaContent(source, 'og:title') || titleLine.replace(/\s*\([^()]*\d{4}[^()]*\)\s*$/, '').trim() || (item && item.title) || 'Breaking News English';
    const paragraphs = extractParagraphs(extractArticleBody(source));
    if (!paragraphs.length) throw new Error('未能从文章页解析出正文段落');
    if (resolvedLevel === null) throw new Error('未能识别文章可用难度');

    const words = countWords(paragraphs);
    const date = dateMatch ? dateMatch[1].trim() : ((item && item.date) || '');
    return {
      id: (item && item.id) || pageUrl,
      title: title,
      titleZh: '',
      tag: (item && item.kind) || 'News',
      level: 'Level ' + resolvedLevel + ' · ' + LEVEL_BANDS[resolvedLevel],
      levelBand: LEVEL_BANDS[resolvedLevel],
      resolvedLevel: resolvedLevel,
      requestedLevel: target,
      fallback: resolvedLevel !== target,
      minutes: Math.max(1, Math.ceil(words / 170)),
      words: words,
      published: date,
      summary: (item && item.summary) || '',
      paragraphs: paragraphs,
      sourceName: SOURCE_NAME,
      sourceUrl: pageUrl,
      availableLevels: availableLevels
    };
  }

  function scoreItem(item, requestedLevel) {
    const available = levelNumbers(item && item.availableLevels);
    if (!available.length) return Infinity;
    const target = Math.max(0, Math.min(6, parseInt(requestedLevel, 10) || 0));
    return available.reduce((best, level) => Math.min(best, Math.abs(level - target)), Infinity);
  }

  function pickRandomItem(items, requestedLevel, excludeId) {
    let pool = (items || []).filter((item) => item && levelNumbers(item.availableLevels).length);
    if (!pool.length) return null;
    if (excludeId) pool = pool.filter((item) => {
      if (item.id === excludeId || item.url === excludeId) return false;
      const urls = Object.keys(item.availableLevels || {}).map((key) => item.availableLevels[key]);
      return urls.indexOf(excludeId) < 0;
    });
    if (!pool.length) return null;
    const exact = pool.filter((item) => levelNumbers(item.availableLevels).indexOf(parseInt(requestedLevel, 10)) > -1);
    const candidates = exact.length ? exact : pool.filter((item) => scoreItem(item, requestedLevel) === Math.min.apply(null, pool.map((x) => scoreItem(x, requestedLevel))));
    return candidates[Math.floor(Math.random() * candidates.length)] || null;
  }

  function apiBase() {
    const configured = root && root.WW_NEWS_API;
    if (configured) return String(configured).replace(/\/$/, '');
    if (root && root.location && root.location.protocol === 'file:') return 'http://127.0.0.1:8899/api';
    return '/api';
  }

  async function requestJson(path) {
    if (typeof fetch !== 'function') throw new Error('当前浏览器不支持 fetch');
    const res = await fetch(apiBase() + path, { cache: 'no-store', headers: { Accept: 'application/json' } });
    const type = res.headers.get('content-type') || '';
    if (!res.ok || type.indexOf('application/json') < 0) {
      throw new Error('实时新闻服务未启动或不可用，请运行 node server.js 后重试');
    }
    return res.json();
  }

  let listCache = null;
  async function getLatestNews(force) {
    if (listCache && !force) return listCache;
    const data = await requestJson('/news/list');
    if (!data || !Array.isArray(data.items) || !data.items.length) throw new Error('未获取到最新新闻列表');
    listCache = data.items;
    return listCache;
  }

  const articleCache = {};
  async function getArticle(item, requestedLevel, force) {
    const requested = Math.max(0, Math.min(6, parseInt(requestedLevel, 10) || 0));
    const target = resolveItemLevel(item, requested);
    if (!target) throw new Error('这篇新闻没有可用的阅读级别');
    const key = target.url + '::' + requested;
    if (articleCache[key] && !force) return articleCache[key];
    const data = await requestJson('/news/article?url=' + encodeURIComponent(target.url) + '&level=' + requested);
    if (!data || !data.article || !Array.isArray(data.article.paragraphs)) throw new Error('文章解析失败');
    articleCache[key] = data.article;
    return data.article;
  }

  return {
    HOME_URL: HOME_URL,
    SOURCE_NAME: SOURCE_NAME,
    LEVEL_BANDS: LEVEL_BANDS,
    decodeHtml: decodeHtml,
    textFromHtml: textFromHtml,
    absoluteUrl: absoluteUrl,
    parseLevelLinks: parseLevelLinks,
    resolveLevel: resolveLevel,
    resolveItemLevel: resolveItemLevel,
    parseHomepage: parseHomepage,
    parseArticlePage: parseArticlePage,
    extractParagraphs: extractParagraphs,
    countWords: countWords,
    pickRandomItem: pickRandomItem,
    getLatestNews: getLatestNews,
    getArticle: getArticle
  };
});