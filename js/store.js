/* ============================================================
 * 全局状态（Vue reactive store，组件通过 setup() 注入使用）
 * 负责：登录态 / 词库 / 收藏夹 / 生词本 / 主题 / 详情弹窗 / 查词 / 提示
 * 持久化：localStorage（ww_user / ww_unknown / ww_favorites / ww_theme）
 * ============================================================ */
(function (global) {
  'use strict';
  const Vue = global.Vue;
  const { reactive } = Vue;

  const LS = { user: 'ww_user', unknown: 'ww_unknown', fav: 'ww_favorites', theme: 'ww_theme' };
  const READING_LIB = 'reading';

  function readArray(key) {
    try {
      const v = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }

  const state = reactive({
    route: 'login',
    user: '',
    lib: 'cet4',
    index: 0,
    hideMeaning: false,
    unknown: [],
    favorites: [],
    theme: 'light',
    detail: null,          // { entry, lib, word, missing }
    toastText: '',
    toastShow: false,
    lookedUp: [],          // 阅读页已查过的词（用于轻量高亮）
    readingFont: 'md',     // sm | md | lg
    readingArticle: global.WW.ARTICLE,
    readingLevel: 3,
    readingNewsItems: [],
    readingSource: 'fallback'
  });

  const keyOf = (lib, word) => lib + '::' + word;

  /* ---------------- 主题 ---------------- */
  function applyTheme(dark) {
    state.theme = dark ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem(LS.theme, state.theme); } catch (e) {}
  }
  function toggleTheme() { applyTheme(state.theme !== 'dark'); }

  /* ---------------- 词库 ---------------- */
  function libLabel(key) {
    if (key === READING_LIB) return '文章生词';
    const L = global.WW.LIBRARIES[key];
    return L ? L.label : key;
  }
  function libs() { return global.WW.LIBRARIES; }
  function words() { return (libs()[state.lib] || { words: [] }).words; }
  function current() { const w = words(); return w[state.index] || w[0] || null; }
  function setLib(key) { state.lib = key; state.index = 0; state.hideMeaning = false; }
  function go(delta) {
    const n = words().length;
    state.index = Math.min(Math.max(state.index + delta, 0), n - 1);
  }
  function jumpTo(oneBased) {
    const n = words().length;
    const v = parseInt(oneBased, 10);
    if (isNaN(v) || v < 1 || v > n) { toast('请输入 1 - ' + n + ' 之间的序号'); return false; }
    state.index = v - 1;
    return true;
  }
  function toggleHide() { state.hideMeaning = !state.hideMeaning; }

  /* ---------------- 查词（词库 + 阅读词典通用） ---------------- */
  function findWord(lib, word) {
    if (lib === READING_LIB) {
      const d = global.WW.READING_DICT;
      return d[word] || global.WW.readingUtils.lookupWord(d, word) || null;
    }
    const L = libs()[lib];
    return L ? (L.words.find((x) => x.word === word) || null) : null;
  }

  /* ---------------- 收藏夹 / 生词本 ---------------- */
  function saveUnknown() { try { localStorage.setItem(LS.unknown, JSON.stringify(state.unknown)); } catch (e) {} }
  function saveFav() { try { localStorage.setItem(LS.fav, JSON.stringify(state.favorites)); } catch (e) {} }

  function isUnknown(lib, word) { return state.unknown.indexOf(keyOf(lib, word)) > -1; }
  function isFav(lib, word) { return state.favorites.indexOf(keyOf(lib, word)) > -1; }

  function addUnknown(lib, word) {
    const k = keyOf(lib, word);
    if (state.unknown.indexOf(k) < 0) { state.unknown.push(k); saveUnknown(); return true; }
    return false;
  }
  function removeKey(list, key) {
    const i = state[list].indexOf(key);
    if (i > -1) state[list].splice(i, 1);
  }
  function removeUnknown(key) { removeKey('unknown', key); saveUnknown(); }
  function clearUnknown() { state.unknown.splice(0); saveUnknown(); }
  function removeFav(key) { removeKey('favorites', key); saveFav(); }
  function clearFav() { state.favorites.splice(0); saveFav(); }
  function toggleFav(lib, word) {
    const k = keyOf(lib, word);
    const i = state.favorites.indexOf(k);
    if (i > -1) state.favorites.splice(i, 1); else state.favorites.push(k);
    saveFav();
    return i < 0;
  }
  function collect(listName) {
    const out = [];
    state[listName].forEach((key) => {
      const p = key.split('::');
      const w = findWord(p[0], p[1]);
      if (w) out.push({ key: key, lib: p[0], w: w });
    });
    return out;
  }

  /* ---------------- 详情弹窗 ---------------- */
  function openDetail(entry, lib, word) {
    state.detail = { entry: entry, lib: lib, word: word || (entry && entry.word) || '' };
  }
  function openMissing(raw) {
    state.detail = { entry: null, lib: READING_LIB, word: String(raw).replace(/^[^A-Za-z]+|[^A-Za-z]+$/g, ''), missing: true };
  }
  function closeDetail() { state.detail = null; }

  /* ---------------- 阅读页查词 ---------------- */
  function lookupInArticle(token) {
    const utils = global.WW.readingUtils;
    const entry = utils.lookupWord(global.WW.READING_DICT, token.text);
    const nk = utils.normalizeKey(token.text);
    if (state.lookedUp.indexOf(nk) < 0) state.lookedUp.push(nk);
    if (entry) openDetail(entry, READING_LIB, entry.word);
    else openMissing(token.text);
    return entry;
  }

  /* ---------------- 搜索（全词库精确 → 模糊 → 阅读词典） ---------------- */
  function search(q) {
    const query = String(q || '').trim().toLowerCase();
    if (!query) return false;
    const all = libs();
    for (const lib of Object.keys(all)) {
      let hit = all[lib].words.find((w) => w.word.toLowerCase() === query);
      if (!hit) hit = all[lib].words.find((w) => w.word.toLowerCase().indexOf(query) === 0);
      if (!hit) hit = all[lib].words.find((w) => w.word.toLowerCase().indexOf(query) > -1);
      if (hit) { openDetail(hit, lib, hit.word); return true; }
    }
    const rEntry = global.WW.readingUtils.lookupWord(global.WW.READING_DICT, query);
    if (rEntry) { openDetail(rEntry, READING_LIB, rEntry.word); return true; }
    toast('未找到「' + query + '」，换个单词试试');
    return false;
  }

  /* ---------------- 朗读 ---------------- */
  function speak(text, lang, el) {
    if (!('speechSynthesis' in window)) { toast('当前浏览器不支持语音朗读'); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.rate = 0.9;
    if (el) {
      el.classList.add('speaking');
      const stop = () => el.classList.remove('speaking');
      u.onend = stop; u.onerror = stop;
    }
    window.speechSynthesis.speak(u);
  }

  /* ---------------- 阅读内容 ---------------- */
  function setReadingArticle(article) {
    state.readingArticle = article || global.WW.ARTICLE;
    state.lookedUp.splice(0);
  }
  function setReadingLevel(level) {
    const n = parseInt(level, 10);
    state.readingLevel = isNaN(n) ? 3 : Math.max(0, Math.min(6, n));
  }
  function setReadingNews(items) {
    state.readingNewsItems = Array.isArray(items) ? items : [];
    state.readingSource = state.readingNewsItems.length ? 'live' : 'fallback';
  }

  /* ---------------- 轻提示 ---------------- */
  let toastTimer = null;
  function toast(text, ms) {
    state.toastText = text;
    state.toastShow = true;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { state.toastShow = false; }, ms || 1800);
  }

  /* ---------------- 登录 / 退出 ---------------- */
  function login(name, remember) {
    state.user = name;
    try {
      if (remember) localStorage.setItem(LS.user, name);
      else { localStorage.removeItem(LS.user); sessionStorage.setItem(LS.user, name); }
    } catch (e) {}
    go('app');
  }
  function logout() {
    try { localStorage.removeItem(LS.user); sessionStorage.removeItem(LS.user); } catch (e) {}
    state.user = '';
    go('login');
  }

  /* ---------------- 路由 ---------------- */
  function go(route) {
    global.WW.router.navigate(route);
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    state.unknown = readArray(LS.unknown);
    state.favorites = readArray(LS.fav);
    let theme = 'light';
    try { theme = localStorage.getItem(LS.theme) || 'light'; } catch (e) {}
    applyTheme(theme === 'dark');
    let remembered = '';
    try { remembered = localStorage.getItem(LS.user) || sessionStorage.getItem(LS.user) || ''; } catch (e) {}
    if (remembered) state.user = remembered;
  }

  global.WW = global.WW || {};
  global.WW.store = {
    state: state,
    READING_LIB: READING_LIB,
    keyOf: keyOf, libLabel: libLabel, libs: libs, words: words, current: current,
    setLib: setLib, go: go, jumpTo: jumpTo, toggleHide: toggleHide,
    findWord: findWord,
    isUnknown: isUnknown, addUnknown: addUnknown, removeUnknown: removeUnknown, clearUnknown: clearUnknown,
    isFav: isFav, toggleFav: toggleFav, removeFav: removeFav, clearFav: clearFav,
    collect: collect,
    openDetail: openDetail, openMissing: openMissing, closeDetail: closeDetail, lookupInArticle: lookupInArticle,
    setReadingArticle: setReadingArticle, setReadingLevel: setReadingLevel, setReadingNews: setReadingNews,
    search: search, speak: speak, toast: toast,
    applyTheme: applyTheme, toggleTheme: toggleTheme,
    login: login, logout: logout, init: init
  };
})(typeof window !== 'undefined' ? window : globalThis);
