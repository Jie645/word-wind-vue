/* ============================================================
 * 极简 hash 路由（无需构建工具，file:// 直接打开也能工作）
 *   #/login   登录页
 *   #/app     背单词主页
 *   #/reading 英语文章阅读页
 * ============================================================ */
(function (global) {
  'use strict';

  const ROUTES = { login: '#/login', app: '#/app', reading: '#/reading' };
  const ALIAS = { '': 'login', '#': 'login', '#/': 'login', '#/index': 'login' };

  function parse(hash) {
    const h = String(hash || '').trim();
    if (ALIAS[h] !== undefined) return ALIAS[h];
    if (h === ROUTES.app) return 'app';
    if (h === ROUTES.reading) return 'reading';
    if (h === ROUTES.login) return 'login';
    return 'login';
  }

  function current() { return parse(global.location.hash); }

  function navigate(route) {
    const target = ROUTES[route] || ROUTES.login;
    // 先直接切视图，保证不依赖 hashchange：
    // 某些预览沙箱 / file:// 环境下改写 location.hash 可能被拦截或不触发事件
    const store = global.WW && global.WW.store;
    if (store && store.state) store.state.route = route;
    try {
      if (global.location.hash !== target) global.location.hash = target;
    } catch (e) { /* 沙箱禁止改 hash 时忽略，视图已经切过去了 */ }
  }

  function start(onChange) {
    const handler = () => onChange(current());
    global.addEventListener('hashchange', handler);
    if (!global.location.hash) {
      try { global.history.replaceState(null, '', ROUTES.login); } catch (e) { global.location.hash = ROUTES.login; }
    }
    onChange(current());
  }

  global.WW = global.WW || {};
  global.WW.router = { ROUTES: ROUTES, parse: parse, current: current, navigate: navigate, start: start };
})(typeof window !== 'undefined' ? window : globalThis);
