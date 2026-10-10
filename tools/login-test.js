/* ============================================================
 * 登录流程自动化测试
 *   复制 word-wind.standalone.html 并注入脚本，模拟「填表 → 点登录」，
 *   输出路由切换结果、可见的错误提示、以及所有捕获到的异常。
 *   通过 URL 查询参数选择场景： ?case=A|B|C
 *     A: 用户名 2 字符（小明）      —— 预期被校验拦下
 *     B: 用户名 8 字符（xiaoming）  —— 预期登录成功
 *     C: 全空                       —— 预期看到错误提示
 * 运行： node tools/login-test.js
 * ============================================================ */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
let html = fs.readFileSync(path.join(root, 'word-wind.standalone.html'), 'utf8');

const test = `
<div id="testResult">PENDING</div>
<script>
(function () {
  var log = [];
  window.addEventListener('error', function (e) { log.push('onerror: ' + e.message + ' @' + e.lineno); });
  window.addEventListener('unhandledrejection', function (e) { log.push('rejection: ' + ((e.reason && e.reason.message) || e.reason)); });

  var CASES = { A: ['小明', '123456'], B: ['xiaoming', '123456'], C: ['', ''] };

  function visibleErrors() {
    var out = [];
    document.querySelectorAll('.text-red-500').forEach(function (el) {
      var t = (el.textContent || '').trim();
      if (t) out.push(t);
    });
    return out;
  }
  function report(extra) {
    var r = document.getElementById('testResult');
    r.textContent = 'RESULT ' + JSON.stringify(Object.assign({
      errors: log,
      hash: location.hash,
      route: window.WW.store.state.route,
      user: window.WW.store.state.user,
      topbarRendered: !!document.getElementById('readingNavBtn'),
      loginFormStillThere: !!document.getElementById('username'),
      errorMsgs: visibleErrors()
    }, extra || {}));
  }
  function type(el, v) { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }

  var K = (new URLSearchParams(location.search).get('case') || 'A').toUpperCase();
  var vals = CASES[K] || CASES.A;

  setTimeout(function () {
    var u = document.getElementById('username'), p = document.getElementById('password'), btn = document.getElementById('loginBtn');
    if (!u || !p || !btn) { report({ fatal: 'no form' }); return; }
    type(u, vals[0]); type(p, vals[1]);
    var afterTyping = { user: window.WW.store.state.user, btnDisabled: btn.disabled };
    btn.click();
    setTimeout(function () { report({ case: K, input: vals, afterTyping: afterTyping, btnDisabledAfterClick: btn.disabled }); }, 1800);
  }, 400);
})();
</script>
`;

fs.writeFileSync(
  path.join(root, 'tools', 'tmp-login-test.html'),
  html.replace('</body>', test + '\n</body>'),
  'utf8'
);
console.log('已生成 tools/tmp-login-test.html');
