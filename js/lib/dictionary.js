/* ============================================================
 * Dictionary Service · 阅读词典
 *   1. 读取 data/dictionary-cache.json 静态词典
 *   2. 未命中时调用 Free Dictionary API + MyMemory 中文翻译
 *   3. 查询结果写入内存缓存；爬虫可复用 fetchEntry 生成静态缓存
 * ============================================================ */
(function (root, factory) {
  const api = factory(root);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) {
    root.WW = root.WW || {};
    root.WW.dictionary = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this), function (root) {
  'use strict';

  const DICT_URL = 'https://freedictionaryapi.com/api/v1/entries/en/';
  const DATAMUSE_URL = 'https://api.datamuse.com/words';
  const TRANS_URL = 'https://api.mymemory.translated.net/get';
  const STATIC_URL = 'data/dictionary-cache.json';
  const POS = {
    noun: 'n.', verb: 'v.', adjective: 'adj.', adverb: 'adv.', pronoun: 'pron.',
    preposition: 'prep.', conjunction: 'conj.', interjection: 'int.', determiner: 'det.',
    numeral: 'num.', article: 'art.', particle: 'part.', phrase: 'phr.', abbreviation: 'abbr.'
  };
  let cache = null;
  let cachePromise = null;

  function utils() {
    return (root && root.WW && root.WW.readingUtils) || null;
  }

  function normalize(raw) {
    const u = utils();
    return u ? u.normalizeKey(raw) : String(raw || '').toLowerCase().replace(/[^a-z'-]/g, '');
  }

  function candidates(raw) {
    const key = normalize(raw);
    const u = utils();
    if (!key) return [];
    const list = u ? u.candidates(key) : [key];
    return list.filter((word) => word && word.length > 1);
  }

  function htmlDecode(value) {
    return String(value || '')
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
      .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }

  function clean(value) {
    return htmlDecode(value).replace(/\s+/g, ' ').trim();
  }

  async function requestJson(url, timeoutMs) {
    if (typeof fetch !== 'function') return null;
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs || 15000) : null;
    try {
      const response = await fetch(url, {
        signal: controller ? controller.signal : undefined,
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function translate(raw) {
    const url = TRANS_URL + '?q=' + encodeURIComponent(raw) + '&langpair=' + encodeURIComponent('en|zh-CN');
    const data = await requestJson(url, 12000);
    const text = data && data.responseData && data.responseData.translatedText;
    const result = clean(text);
    return result && !/^MYMEMORY WARNING/i.test(result) ? result : '';
  }

  function pickPronunciation(entries, tag) {
    for (let i = 0; i < entries.length; i++) {
      const list = entries[i].pronunciations || [];
      for (let j = 0; j < list.length; j++) {
        const p = list[j];
        if (p && p.text && (!tag || (p.tags || []).indexOf(tag) > -1)) return clean(p.text);
      }
    }
    return '';
  }

  function mapDatamuse(item, translated, original) {
    const rows = item && Array.isArray(item.defs) ? item.defs : [];
    const trans = [];
    rows.slice(0, 8).forEach((row) => {
      const parts = String(row || '').split('\t');
      const tag = (parts.shift() || '').trim();
      const definition = clean(parts.join(' '));
      if (definition) trans.push([POS[tag] || tag || '释义', definition]);
    });
    if (translated) trans.unshift([trans.length ? trans[0][0] : '译', translated]);
    return {
      word: normalize(original) || (item && item.word) || original,
      type: 'word',
      us: '', uk: '',
      trans: trans.slice(0, 8),
      sentences: [],
      phrases: [],
      phraseLabel: '词形变化',
      sourceName: 'Datamuse / Wiktionary' + (translated ? ' / MyMemory' : ''),
      sourceUrl: 'https://www.datamuse.com/api/',
      online: true
    };
  }

  async function fetchDatamuse(word) {
    const url = DATAMUSE_URL + '?sp=' + encodeURIComponent(word) + '&md=dpr&max=1';
    const data = await requestJson(url, 10000);
    return data && data[0] ? data[0] : null;
  }
  function mapEntry(data, translated, original) {
    const entries = data && Array.isArray(data.entries) ? data.entries.filter((e) => !e.language || e.language.code === 'en') : [];
    const pos = entries.length && entries[0].partOfSpeech ? entries[0].partOfSpeech : '';
    const trans = [];
    if (translated) trans.push([POS[pos] || (pos ? pos : '译'), translated]);

    entries.slice(0, 3).forEach((entry) => {
      const label = POS[entry.partOfSpeech] || entry.partOfSpeech || '释义';
      (entry.senses || []).slice(0, 3).forEach((sense) => {
        const definition = clean(sense.definition);
        if (definition && !trans.some((row) => row[1] === definition)) trans.push([label, definition]);
      });
    });

    if (!trans.length) {
      trans.push(['分析', '已识别单词，但公开词典暂未返回可用释义。']);
    }

    const forms = [];
    entries.forEach((entry) => {
      (entry.forms || []).forEach((form) => {
        if (!form || !form.word) return;
        const label = (form.tags || []).join(' / ') || '词形';
        if (!forms.some((row) => row[0] === form.word && row[1] === label)) forms.push([form.word, label]);
      });
    });

    const source = data && data.source ? data.source : null;
    return {
      word: normalize(original) || (data && data.word) || original,
      type: 'word',
      us: pickPronunciation(entries, 'General American') || pickPronunciation(entries),
      uk: pickPronunciation(entries, 'Received Pronunciation') || '',
      trans: trans.slice(0, 6),
      sentences: [],
      phrases: forms.slice(0, 8),
      phraseLabel: '词形变化',
      sourceName: 'Wiktionary / MyMemory',
      sourceUrl: source && source.url ? source.url : '',
      online: true
    };
  }

  async function fetchEntry(raw, options) {
    const key = normalize(raw);
    if (!key) return null;
    const opts = options || {};
    const translationPromise = opts.translate === false ? Promise.resolve('') : translate(key);
    let datamuse = null;
    for (const candidate of candidates(key)) {
      datamuse = await fetchDatamuse(candidate);
      if (datamuse) break;
    }
    const translated = await Promise.race([
      translationPromise,
      new Promise((resolve) => setTimeout(() => resolve(''), opts.translate === false ? 0 : 2500))
    ]);
    if (datamuse) return mapDatamuse(datamuse, translated, key);

    let data = null;
    for (const candidate of candidates(key)) {
      data = await requestJson(DICT_URL + encodeURIComponent(candidate), 10000);
      if (data && Array.isArray(data.entries) && data.entries.length) break;
      data = null;
    }
    if (!data && !translated) return null;
    return mapEntry(data, translated, key);
  }

  async function loadCache(force) {
    if (cache && !force) return cache;
    if (cachePromise && !force) return cachePromise;
    cachePromise = requestJson(STATIC_URL, 10000).then((data) => {
      cache = data && data.words ? data : { words: {} };
      return cache;
    }).catch(() => {
      cache = { words: {} };
      return cache;
    });
    return cachePromise;
  }

  function hasChinese(entry) {
    return !!(entry && (entry.trans || []).some((row) => /[\u3400-\u9fff]/.test(String(row[1] || ''))));
  }

  async function lookup(raw) {
    const key = normalize(raw);
    if (!key) return null;
    const data = await loadCache(false);
    for (const candidate of candidates(key)) {
      const cached = data.words[candidate];
      if (!cached) continue;
      if (!hasChinese(cached)) {
        const translated = await Promise.race([
          translate(key),
          new Promise((resolve) => setTimeout(() => resolve(''), 2500))
        ]);
        if (translated) {
          const label = cached.trans && cached.trans.length ? cached.trans[0][0] : '译';
          cached.trans = [[label, translated]].concat(cached.trans || []);
          cached.sourceName = (cached.sourceName || 'Datamuse / Wiktionary') + ' / MyMemory';
        }
      }
      return Object.assign({}, cached, { trans: (cached.trans || []).slice() });
    }
    const entry = await fetchEntry(key);
    if (entry) {
      data.words[key] = entry;
      try { root.localStorage && root.localStorage.setItem('ww_dynamic_dict_' + key, JSON.stringify(entry)); } catch (e) {}
    }
    return entry;
  }

  return {
    DICT_URL: DICT_URL,
    DATAMUSE_URL: DATAMUSE_URL,
    TRANS_URL: TRANS_URL,
    STATIC_URL: STATIC_URL,
    normalize: normalize,
    candidates: candidates,
    translate: translate,
    mapEntry: mapEntry,
    fetchEntry: fetchEntry,
    loadCache: loadCache,
    lookup: lookup
  };
});