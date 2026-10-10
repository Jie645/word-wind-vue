/* ============================================================
 * 把多文件项目打包成「单文件 HTML」
 *   把 vendor/ 的 Vue、Tailwind，以及 css / js 全部内联进 index.html，
 *   产物 word-wind.standalone.html 可直接双击打开，不需要任何服务器。
 * 运行： node tools/build-standalone.js
 * ============================================================ */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

// 内联脚本里若出现 </script> 会提前终止脚本块，需要转义
const safe = (code) => code.replace(/<\/script/gi, '<\\/script');

let html = read('index.html');
let inlined = 0;
const missing = [];

// 1) 样式表 -> <style>
html = html.replace(/<link rel="stylesheet" href="([^"]+)"\s*\/?>/g, (m, href) => {
  if (/^https?:/.test(href)) return m;
  try { inlined++; return '<style>\n' + read(href) + '\n</style>'; }
  catch (e) { missing.push(href); return m; }
});

// 2) 本地脚本 -> 内联 <script>
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, src) => {
  if (/^https?:/.test(src)) return m;
  try { inlined++; return '<script>\n/* ==== ' + src + ' ==== */\n' + safe(read(src)) + '\n</script>'; }
  catch (e) { missing.push(src); return m; }
});

if (missing.length) {
  console.error('以下文件缺失，打包中止：\n  ' + missing.join('\n  '));
  process.exit(1);
}

// 3) 单文件模式下本地资源已内联，去掉「本地优先」相关描述
html = html.replace(
  /本页优先加载项目内[\s\S]*?后刷新页面。/,
  '本页已把 Vue 3 与 Tailwind CSS 全部内联，正常情况下无需任何网络与服务器。若这里仍然出现，说明浏览器过旧或不支持内联脚本。'
);

html = html.replace(
  '<title>Word Wind · 高效背单词 + 文章阅读</title>',
  '<title>Word Wind · 高效背单词 + 文章阅读（单文件版）</title>\n<!-- 由 tools/build-standalone.js 生成，请勿直接修改；改源码后重新运行该脚本 -->'
);

const out = path.join(root, 'word-wind.standalone.html');
fs.writeFileSync(out, html, 'utf8');

const leftovers = [...html.matchAll(/(?<!:)(?:src|href)="((?!https?:|#)[^"]+)"/g)].map((m) => m[1]);
console.log('已内联资源：' + inlined + ' 个');
console.log('产物：' + out + '  (' + (fs.statSync(out).size / 1024).toFixed(1) + ' KB)');
console.log(leftovers.length ? '仍存在外部引用：' + leftovers.join(', ') : '没有遗留的外部文件引用 ✅');
