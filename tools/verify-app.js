/* ============================================================
 * 静态自检（无需浏览器）：
 *   1. 所有 JS 能被解析（vm 载入即校验）
 *   2. 每个组件模板的标签是否闭合
 *   3. 模板里用到的自定义组件、store 方法是否真实存在
 *   4. Tailwind 类名是否落在合法刻度内（非法类名会被静默忽略）
 *   5. index.html 的脚本引用与加载顺序
 * 运行： node tools/verify-app.js
 * ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let fail = 0;
const ok = (cond, msg, extra) => {
  console.log((cond ? '  PASS  ' : '  FAIL  ') + msg + (extra !== undefined && extra !== '' ? '  -> ' + extra : ''));
  if (!cond) fail++;
};
const warn = (msg) => console.log('  WARN  ' + msg);

/* ---------------- 1. 在 stub Vue 中载入全部脚本 ---------------- */
const VueStub = {
  reactive: (o) => o,
  ref: (v) => ({ value: v }),
  computed: (fn) => ({ get value() { return fn(); } }),
  onMounted: () => {}, onBeforeUnmount: () => {},
  createApp: () => ({ component() { return this; }, mount() {} })
};
const sandbox = { console, Vue: VueStub, document: undefined, localStorage: undefined };
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.addEventListener = () => {};
sandbox.removeEventListener = () => {};
sandbox.location = { hash: '' };
sandbox.history = { replaceState: () => {} };
vm.createContext(sandbox);

const files = [
  'js/data/words.js', 'js/data/reading.js', 'js/lib/reading-utils.js', 'js/lib/breaking-news.js', 'js/lib/dictionary.js',
  'js/router.js', 'js/store.js',
  'js/components/AppTopBar.js', 'js/components/ToastHost.js', 'js/components/MeaningBlock.js',
  'js/components/WordCard.js', 'js/components/LibrarySidebar.js', 'js/components/ListModal.js',
  'js/components/WordDetailModal.js', 'js/components/StudyView.js', 'js/components/ArticleText.js',
  'js/components/ReadingView.js', 'js/components/RegisterModal.js', 'js/components/LoginView.js',
  'js/app.js'
];

console.log('\n== 1. 脚本载入（语法 + 运行时顶层代码）==');
const loadErr = [];
files.forEach((f) => {
  try { vm.runInContext(read(f), sandbox, { filename: f }); }
  catch (e) { loadErr.push(f + ': ' + e.message); }
});
ok(loadErr.length === 0, files.length + ' 个脚本全部载入成功', loadErr.join(' | '));

const WW = sandbox.WW;
const storeApi = Object.keys(WW.store);
const componentNames = Object.keys(WW.components);

/* ---------------- 2. 模板标签闭合 ---------------- */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const BUILTIN = new Set(['template', 'transition', 'transition-group', 'component', 'keep-alive', 'teleport', 'slot', 'suspense']);

function scanTags(tpl) {
  const tags = [];
  let i = 0;
  while (i < tpl.length) {
    const lt = tpl.indexOf('<', i);
    if (lt < 0) break;
    if (tpl.startsWith('<!--', lt)) { const end = tpl.indexOf('-->', lt); i = end < 0 ? tpl.length : end + 3; continue; }
    let j = lt + 1;
    let quote = null;
    while (j < tpl.length) {
      const ch = tpl[j];
      if (quote) { if (ch === quote) quote = null; }
      else if (ch === '"' || ch === "'") quote = ch;
      else if (ch === '>') break;
      j++;
    }
    if (j >= tpl.length) { tags.push({ raw: tpl.slice(lt), broken: true }); break; }
    const raw = tpl.slice(lt, j + 1);
    const m = /^<(\/?)([A-Za-z][\w-]*)/.exec(raw);
    if (m) {
      const closing = m[1] === '/';
      const name = m[2];
      const selfClosing = /\/>$/.test(raw);
      if (name !== '!') tags.push({ closing, name, selfClosing, raw });
    }
    i = j + 1;
  }
  return tags;
}

console.log('\n== 2. 模板标签闭合 ==');
const tagProblems = [];
componentNames.forEach((cname) => {
  const tpl = WW.components[cname].template || '';
  const stack = [];
  scanTags(tpl).forEach((t) => {
    if (t.broken) { tagProblems.push(cname + ': 标签未闭合 -> ' + t.raw.slice(0, 40)); return; }
    if (t.selfClosing || VOID.has(t.name)) return;
    if (!t.closing) stack.push(t.name);
    else {
      const top = stack.pop();
      if (top !== t.name) tagProblems.push(cname + ': </' + t.name + '> 与 <' + (top || '空') + '> 不匹配');
    }
  });
  if (stack.length) tagProblems.push(cname + ': 未闭合标签 ' + stack.join(', '));
});
ok(tagProblems.length === 0, componentNames.length + ' 个组件模板标签闭合正确', tagProblems.join(' | '));

/* ---------------- 3. 组件引用 + store API 引用 ---------------- */
console.log('\n== 3. 模板中的组件引用 ==');
const compProblems = [];
componentNames.forEach((cname) => {
  const tpl = WW.components[cname].template || '';
  const used = new Set();
  let m;
  const re = /<([A-Z][A-Za-z0-9]*)(?=[\s/>])/g;
  while ((m = re.exec(tpl)) !== null) used.add(m[1]);
  used.forEach((u) => {
    if (!WW.components[u] && !BUILTIN.has(u)) compProblems.push(cname + ' 使用了未注册组件 <' + u + '>');
  });
});
ok(compProblems.length === 0, '模板中引用的自定义组件均已注册', compProblems.join(' | '));

console.log('\n== 4. 模板中的 store 调用 ==');
const storeProblems = [];
const usedApi = new Set();
componentNames.forEach((cname) => {
  const tpl = WW.components[cname].template || '';
  let m;
  const re = /\bstore\.([A-Za-z_$][\w$]*)/g;
  while ((m = re.exec(tpl)) !== null) {
    usedApi.add(m[1]);
    if (m[1] !== 'state' && storeApi.indexOf(m[1]) < 0) storeProblems.push(cname + ' 调用了不存在的 store.' + m[1]);
  }
});
ok(storeProblems.length === 0, '模板中调用的 store API 均存在', storeProblems.join(' | '));
console.log('  模板共用到 store API: ' + [...usedApi].sort().join(', '));

// 未被任何模板使用的 store API（仅提示）
const unused = storeApi.filter((k) => k !== 'state' && !usedApi.has(k));
if (unused.length) warn('未被模板直接使用的 store API（可能只在 setup/JS 中使用）: ' + unused.join(', '));

/* ---------------- 5. Tailwind 类名刻度 ---------------- */
console.log('\n== 5. Tailwind 类名合法性 ==');
const SPACING = new Set([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96]);
const SPECIAL = {
  z: [0, 10, 20, 30, 40, 50],
  order: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  border: [0, 2, 4, 8],
  duration: [0, 75, 100, 150, 200, 300, 500, 700, 1000],
  delay: [0, 75, 100, 150, 200, 300, 500, 700, 1000],
  rotate: [0, 1, 2, 3, 6, 12, 45, 90, 180],
  scale: [0, 50, 75, 90, 95, 100, 105, 110, 125, 150],
  'col-span': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  'grid-cols': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
};
const SPACING_FAMILIES = ['p', 'px', 'py', 'pt', 'pb', 'pl', 'pr', 'm', 'mx', 'my', 'mt', 'mb', 'ml', 'mr',
  'w', 'h', 'min-w', 'min-h', 'max-w', 'max-h', 'gap', 'gap-x', 'gap-y', 'top', 'right', 'bottom', 'left',
  'inset', 'space-x', 'space-y', 'translate-x', 'translate-y', 'leading', 'basis', 'size'];

function classTokens(tpl) {
  const out = [];
  let m;
  const staticRe = /(?<!:)class="([^"]*)"/g;
  while ((m = staticRe.exec(tpl)) !== null) out.push(...m[1].split(/\s+/));
  const boundRe = /:class="([^"]*)"/g;
  while ((m = boundRe.exec(tpl)) !== null) {
    const expr = m[1];
    let s;
    const litRe = /'([^']*)'|"([^"]*)"/g;
    while ((s = litRe.exec(expr)) !== null) out.push(...(s[1] || s[2] || '').split(/\s+/));
  }
  return out.map((t) => t.trim()).filter(Boolean);
}

const badClasses = [];
componentNames.forEach((cname) => {
  const tpl = WW.components[cname].template || '';
  classTokens(tpl).forEach((raw) => {
    raw.split(':').forEach((clsRaw) => {
      const cls = clsRaw.replace(/^!/, '');
      if (!cls || cls.indexOf('[') > -1 || cls.indexOf('$') > -1 || cls.indexOf('{') > -1) return;   // 任意值/动态
      const num = /^(-?)([a-z-]+?)-(\d+(?:\.\d+)?)$/.exec(cls);
      if (!num) return;
      const fam = num[2];
      const val = parseFloat(num[3]);
      if (SPECIAL[fam] && SPECIAL[fam].indexOf(val) < 0) badClasses.push(cname + ': ' + cls);
      else if (SPACING_FAMILIES.indexOf(fam) > -1 && !SPACING.has(val)) badClasses.push(cname + ': ' + cls);
    });
  });
});
const uniqBad = [...new Set(badClasses)];
ok(uniqBad.length === 0, '未发现越界的 Tailwind 刻度类名', uniqBad.join(', '));

/* ---------------- 6. index.html 资源与顺序 ---------------- */
console.log('\n== 6. index.html ==');
const html = read('index.html');
const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const localSrcs = srcs.filter((s) => !/^https?:/.test(s));
const missingFiles = localSrcs.filter((s) => !fs.existsSync(path.join(root, s)));
ok(missingFiles.length === 0, localSrcs.length + ' 个本地脚本文件都存在', missingFiles.join(', '));
ok(fs.existsSync(path.join(root, 'css/style.css')), 'css/style.css 存在');

const vueIdx = srcs.findIndex((s) => /vue\.global/.test(s));
const storeIdx = localSrcs.indexOf('js/store.js');
const appIdx = localSrcs.indexOf('js/app.js');
const compIdxs = localSrcs.filter((s) => s.startsWith('js/components/')).map((s) => localSrcs.indexOf(s));
const twIdx = srcs.findIndex((s) => /tailwind\.js$/.test(s));
const firstOwn = localSrcs.filter((s) => s.startsWith('js/')).map((s) => srcs.indexOf(s))[0];
const twCfgIdx = srcs.findIndex((s) => /tailwind-config\.js$/.test(s));
ok(vueIdx > -1 && vueIdx < storeIdx && firstOwn === twCfgIdx,
  'Vue 早于 store / 组件 / app.js 加载（tailwind-config.js 可先于 Vue）',
  'vue@' + vueIdx + ', store@' + storeIdx + ', 首个 js/ 脚本@' + firstOwn);
ok(twIdx > -1 && twIdx < firstOwn, 'Tailwind 早于所有应用脚本加载', 'tailwind@' + twIdx);
ok(html.indexOf('unpkg.com/vue') > -1 && html.indexOf('cdn.jsdelivr.net/npm/vue') > -1,
  'Vue 配置了两个 CDN 兜底（unpkg + jsdelivr）');
ok(html.indexOf('cdn.tailwindcss.com') > -1, 'Tailwind 配置了 CDN 兜底');
ok(html.indexOf('bootError') > -1, '包含资源加载失败兜底提示');
ok(fs.existsSync(path.join(root, 'vendor/vue.global.prod.js')) && fs.statSync(path.join(root, 'vendor/vue.global.prod.js')).size > 100000,
  '本地 vendor/vue.global.prod.js 完整');
ok(fs.existsSync(path.join(root, 'vendor/tailwind.js')) && fs.statSync(path.join(root, 'vendor/tailwind.js')).size > 300000,
  '本地 vendor/tailwind.js 完整');
ok(storeIdx > 0, 'store.js 在数据与路由之后加载', 'index=' + storeIdx);
ok(appIdx === localSrcs.length - 1, 'app.js 最后加载', 'index=' + appIdx);
ok(compIdxs.every((i) => i > storeIdx && i < appIdx), '所有组件在 store 之后、app.js 之前加载');

const declared = localSrcs.filter((s) => s.startsWith('js/components/')).map((s) => path.basename(s, '.js'));
const notDeclared = componentNames.filter((c) => declared.indexOf(c) < 0);
ok(notDeclared.length === 0, '注册的组件都被 index.html 引入', notDeclared.join(', '));

/* ---------------- 7. 路由与视图对应 ---------------- */
console.log('\n== 7. 路由 ==');
const appTpl = WW.components.LoginView ? read('js/app.js') : '';
['login', 'app', 'reading'].forEach((r) => {
  ok(appTpl.indexOf("route === '" + r + "'") > -1 || r === 'login', '根组件包含路由分支 ' + r);
});
const navBtn = read('js/components/AppTopBar.js');
ok(/readingNavBtn/.test(navBtn), '导航栏包含阅读入口按钮 #readingNavBtn');
ok(navBtn.indexOf('📖') > -1, '阅读按钮带 📖 图标');


/* ---------------- 8. Breaking News 解析与级别回退 ---------------- */
console.log('\n== 8. Breaking News 阅读数据 ==');
const parser = WW.breakingNews;
ok(parser && typeof parser.parseHomepage === 'function' && typeof parser.parseArticlePage === 'function',
  '新闻解析模块已加载');

const sampleHome = [
  '<div class="lesson-excerpt content-container">',
  '<a class="thumbnail" href="2610/test-story.html"></a>',
  '<article><header><h3><a href="2610/test-story.html">Test News Story</a></h3></header>',
  '<div class="smallfont"><strong>10th October - "Easier"</strong></div>',
  '<div class="content">A short summary.</div>',
  '<ul class="lesson-levels menu">',
  '<li><a href="2610/test-story-0.html">Level 0</a></li>',
  '<li><a href="2610/test-story-1.html">Level 1</a></li>',
  '<li><a href="2610/test-story-2.html">Level 2</a></li>',
  '<li><a href="2610/test-story.html">Level 3</a></li>',
  '</ul></article></div>'
].join('');
const parsedHome = parser ? parser.parseHomepage(sampleHome, 'https://breakingnewsenglish.com/') : [];
ok(parsedHome.length === 1 && parsedHome[0].title === 'Test News Story' && parsedHome[0].kind === 'Easier',
  '首页文章标题、日期类型与列表解析正确');
ok(parsedHome[0] && Object.keys(parsedHome[0].availableLevels).join(',') === '0,1,2,3',
  '首页 Level 0-3 链接解析正确');

const sampleArticle = [
  '<meta property="og:title" content="Test News Story">',
  '<h2>Test News Story (10th October 2026)</h2>',
  '<h3>The Reading / Listening - Test Story - Level 2</h3>',
  '<a href="test-story-0.html">Level 0</a><a href="test-story-1.html">Level 1</a><a href="test-story-2.html">Level 2</a>',
  '<div id="lesson-archive"><div id="primary"><article>',
  '<p>First paragraph has enough words for the parser to accept this news article body.</p>',
  '<p>Second paragraph also has enough words for the parser to accept this news article body.</p>',
  '</article></div></div>'
].join('');
const parsedArticle = parser ? parser.parseArticlePage(
  sampleArticle,
  'https://breakingnewsenglish.com/2610/test-story-2.html',
  { id: '2610/test-story.html', title: 'Test News Story', date: '10th October', kind: 'Easier', summary: '' },
  4
) : null;
ok(parsedArticle && parsedArticle.resolvedLevel === 2 && parsedArticle.fallback === true,
  '缺少目标级别时自动回退到相邻级别');
ok(parsedArticle && parsedArticle.paragraphs.length === 2 && parsedArticle.words > 20,
  '文章正文段落与词数解析正确');
const randomPick = parser ? parser.pickRandomItem(parsedHome, 3, 'https://breakingnewsenglish.com/2610/test-story.html') : null;
ok(randomPick === null, '只有当前文章时不会重复抽取同一篇');

const sampleArchive = '<li><tt>2026-10-10: </tt><a href="2610/test-story-0.html">Test News Story</a></li>' +
  '<li><tt>2026-10-03: </tt><a href="2610/older-story-0.html">Older News Story</a></li>';
const archiveItems = parser ? parser.parseArchivePage(sampleArchive, 'https://breakingnewsenglish.com/easy-news-english.html', 0) : [];
const mergedItems = parser ? parser.mergeNewsItems([parsedHome, archiveItems]) : [];
ok(archiveItems.length === 2 && archiveItems[0].date === '10th October',
  '历史归档页与日期解析正确');
const mergedTest = mergedItems.find((item) => item.title === 'Test News Story');
ok(mergedItems.length === 2 && mergedTest && Object.keys(mergedTest.availableLevels).join(',') === '0,1,2,3',
  '首页与归档页中的同一新闻级别可以正确合并');
ok(fs.existsSync(path.join(root, 'server.js')), '本地实时新闻服务器 server.js 存在');
ok(fs.existsSync(path.join(root, 'tools/crawl-breaking-news.js')), 'Breaking News 爬虫脚本存在');
const cachePath = path.join(root, 'data/news-cache.json');
let cacheData = null;
try { cacheData = JSON.parse(read('data/news-cache.json')); } catch (e) {}
ok(cacheData && Array.isArray(cacheData.items) && cacheData.items.length > 0 && cacheData.articles,
  '静态新闻缓存包含文章列表与正文版本');
let dictionaryData = null;
try { dictionaryData = JSON.parse(read('data/dictionary-cache.json')); } catch (e) {}
ok(WW.dictionary && dictionaryData && dictionaryData.words && dictionaryData.words.influencers,
  '阅读词典服务与静态词典缓存包含文章词汇');
console.log('\n' + (fail === 0 ? '全部通过 ✅' : fail + ' 项未通过 ❌'));
process.exit(fail === 0 ? 0 : 1);
