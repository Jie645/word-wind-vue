/* ============================================================
 * 阅读工具（纯函数，无 Vue 依赖，可在 Node 中直接测试）
 *   tokenizeArticle()  把文章切成「可点击单词 / 可点击词组 / 普通文本」三种 token
 *   lookupWord()       查词：精确匹配 → 词形还原（复数、时态、副词等）后匹配
 *   countWords()       统计文章词数
 * ============================================================ */
(function (global) {
  'use strict';

  const WORD_RE = /[A-Za-z][A-Za-z'\u2019-]*/g;

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /* 把一串普通文本切成 单词 / 非单词 片段 */
  function pushPlain(tokens, text) {
    if (!text) return;
    let last = 0;
    WORD_RE.lastIndex = 0;
    let m;
    while ((m = WORD_RE.exec(text)) !== null) {
      if (m.index > last) tokens.push({ type: 'text', text: text.slice(last, m.index) });
      tokens.push({ type: 'word', text: m[0], key: normalizeKey(m[0]) });
      last = m.index + m[0].length;
    }
    if (last < text.length) tokens.push({ type: 'text', text: text.slice(last) });
  }

  /* 归一化：小写、去首尾标点、统一撇号、去所有格 */
  function normalizeKey(raw) {
    let s = String(raw)
      .replace(/[\u2018\u2019\u02bc]/g, "'")
      .toLowerCase()
      .replace(/^[^a-z]+/, '')
      .replace(/[^a-z]+$/, '');
    s = s.replace(/'s$/, '').replace(/'$/, '');
    return s;
  }

  /* 词形还原候选：habits→habit、studies→study、running→run、refused→refuse … */
  function candidates(word) {
    const out = [];
    const push = (x) => { if (x && x.length > 1 && out.indexOf(x) === -1) out.push(x); };
    push(word);
    if (word.endsWith('ies')) push(word.slice(0, -3) + 'y');
    if (word.endsWith('es')) { push(word.slice(0, -2)); push(word.slice(0, -1)); }
    else if (word.endsWith('s')) push(word.slice(0, -1));
    if (word.endsWith('ing')) {
      const base = word.slice(0, -3);
      push(base);
      push(base + 'e');
      if (/([b-df-hj-np-tv-z])\1$/.test(base)) push(base.slice(0, -1));
    }
    if (word.endsWith('ed')) {
      const base = word.slice(0, -2);
      push(base);
      push(word.slice(0, -1));
      if (/([b-df-hj-np-tv-z])\1$/.test(base)) push(base.slice(0, -1));
    }
    if (word.endsWith('ly')) push(word.slice(0, -2));
    if (word.endsWith('est')) push(word.slice(0, -3));
    else if (word.endsWith('er')) push(word.slice(0, -2));
    if (word.endsWith('ise')) push(word.slice(0, -3) + 'ize');
    if (word.endsWith('our')) push(word.slice(0, -3) + 'or');
    return out;
  }

  /* 在词典中查词，命中返回词条对象，未命中返回 null */
  function lookupWord(dict, raw) {
    if (!dict) return null;
    const key = normalizeKey(raw);
    if (!key) return null;
    if (dict[key]) return dict[key];
    const list = candidates(key);
    for (let i = 0; i < list.length; i++) {
      if (dict[list[i]]) return dict[list[i]];
    }
    return null;
  }

  /* 把文章段落切成 token；词组优先于单词 */
  function tokenizeArticle(paragraphs, phraseList) {
    const phrases = (phraseList || []).slice().sort((a, b) => b.length - a.length);
    let phraseRe = null;
    if (phrases.length) {
      phraseRe = new RegExp('\\b(' + phrases.map(escapeRe).join('|') + ')\\b', 'gi');
    }
    return (paragraphs || []).map((para) => {
      const tokens = [];
      if (!phraseRe) {
        pushPlain(tokens, para);
        return tokens;
      }
      let last = 0;
      let m;
      phraseRe.lastIndex = 0;
      while ((m = phraseRe.exec(para)) !== null) {
        if (m.index > last) pushPlain(tokens, para.slice(last, m.index));
        tokens.push({ type: 'phrase', text: m[0], key: normalizeKey(m[0]) });
        last = m.index + m[0].length;
      }
      if (last < para.length) pushPlain(tokens, para.slice(last));
      return tokens;
    });
  }

  function countWords(paragraphs) {
    return (paragraphs || []).reduce((sum, p) => {
      const m = String(p).match(WORD_RE);
      return sum + (m ? m.length : 0);
    }, 0);
  }

  const api = { tokenizeArticle, lookupWord, countWords, normalizeKey, candidates, WORD_RE };
  global.WW = global.WW || {};
  global.WW.readingUtils = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
