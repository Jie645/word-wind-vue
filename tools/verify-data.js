/* Node 校验脚本：检查文章 / 词典 / 查词逻辑
 * 运行： node tools/verify-data.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const sandbox = { console, window: undefined };
sandbox.window = sandbox;            // 让 UMD 包装走 window 分支
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

['js/data/words.js', 'js/data/reading.js', 'js/lib/reading-utils.js'].forEach((f) => {
  const code = fs.readFileSync(path.join(root, f), 'utf8');
  vm.runInContext(code, sandbox, { filename: f });
});

const { ARTICLE, READING_DICT, READING_PHRASES, LIBRARIES, readingUtils } = sandbox.WW;
const { tokenizeArticle, lookupWord, countWords, normalizeKey } = readingUtils;

let fail = 0;
const ok = (cond, msg, extra) => {
  console.log((cond ? '  PASS  ' : '  FAIL  ') + msg + (extra !== undefined ? '  -> ' + extra : ''));
  if (!cond) fail++;
};

console.log('\n== 1. 文章 ==');
const total = countWords(ARTICLE.paragraphs);
console.log('  标题: ' + ARTICLE.title);
console.log('  段落数: ' + ARTICLE.paragraphs.length);
console.log('  词数: ' + total);
ok(total >= 250 && total <= 380, '文章词数在 250–380 之间（目标约 300）', total);

console.log('\n== 2. 词典规模 ==');
const dictKeys = Object.keys(READING_DICT);
const wordEntries = dictKeys.filter((k) => !READING_DICT[k].type);
const phraseEntries = dictKeys.filter((k) => READING_DICT[k].type === 'phrase');
ok(wordEntries.length >= 10, '单词条目 ≥ 10', wordEntries.length + ' 个单词 + ' + phraseEntries.length + ' 个词组');

console.log('\n== 3. 每个词条在正文中都能点到 ==');
const tokens = tokenizeArticle(ARTICLE.paragraphs, READING_PHRASES);
const clickable = new Set();
tokens.forEach((toks) => toks.forEach((t) => { if (t.type === 'word' || t.type === 'phrase') clickable.add(t.key); }));
// 从句子里每一个可点击的词反查词典，统计哪些词条能被点到
const reachable = new Set();
clickable.forEach((key) => {
  const hit = lookupWord(READING_DICT, key);
  if (hit) reachable.add(hit.type === 'phrase' ? hit.word : hit.word);
});
const missing = dictKeys.filter((k) => !reachable.has(READING_DICT[k].word));
ok(missing.length === 0, '词典中所有词条都能在文章里点击到', missing.length ? '缺失: ' + missing.join(', ') : '全部命中（' + reachable.size + ' 个）');
console.log('  未收录但可点的词（点击后走「未收录」兜底）: ' +
  [...clickable].filter((k) => !lookupWord(READING_DICT, k)).slice(0, 12).join(', ') + ' …');

console.log('\n== 4. 词组切分 ==');
tokens.forEach((toks) => toks.forEach((t) => {
  if (t.type === 'phrase') console.log('  词组 token: "' + t.text + '" -> key=' + t.key);
}));
const phraseHits = tokens.flat().filter((t) => t.type === 'phrase').length;
ok(phraseHits >= 5, '文章里识别出至少 5 处词组', phraseHits);

console.log('\n== 5. 词形还原查词 ==');
const cases = [
  ['habits', 'habit'], ['refused', 'refuse'], ['depends', 'depend'], ['shapes', 'shape'],
  ['steadily', 'steadily'], ['success', 'success'], ['behaviour', 'behaviour'],
  ['In Reality', 'in reality'], ['impossible', null], ['zzzz', null]
];
cases.forEach(([q, expect]) => {
  const hit = lookupWord(READING_DICT, q);
  const got = hit ? hit.word : '未命中';
  const label = expect === null ? '（预期未命中）' : '（预期 ' + expect + '）';
  ok(expect === null ? hit === null : (hit && hit.word === expect), q + ' -> ' + got, label);
});

console.log('\n== 6. 词条结构完整性 ==');
let bad = [];
dictKeys.forEach((k) => {
  const e = READING_DICT[k];
  if (!e.word) bad.push(k + ': 缺少 word');
  if (!Array.isArray(e.trans) || !e.trans.length) bad.push(k + ': 缺少 trans');
  if (!Array.isArray(e.sentences) || !e.sentences.length) bad.push(k + ': 缺少 sentences');
  if (!Array.isArray(e.phrases)) bad.push(k + ': 缺少 phrases');
  if (typeof e.us !== 'string' || typeof e.uk !== 'string') bad.push(k + ': 缺少音标字段');
  if (!e.type && (!e.us || !e.uk)) bad.push(k + ': 单词缺少音标');
  (e.trans || []).forEach((t) => { if (t.length !== 2) bad.push(k + ': trans 结构错误'); });
  (e.sentences || []).forEach((t) => { if (t.length !== 2) bad.push(k + ': sentences 结构错误'); });
});
ok(bad.length === 0, '全部词条字段完整', bad.length ? bad.join(' | ') : 'OK');

console.log('\n== 7. 原版词库迁移完整性 ==');
const libKeys = Object.keys(LIBRARIES);
console.log('  词库: ' + libKeys.map((k) => k + '(' + LIBRARIES[k].words.length + ')').join(', '));
ok(libKeys.length === 7, '7 个词库', libKeys.length);
ok(libKeys.reduce((s, k) => s + LIBRARIES[k].words.length, 0) === 26, '共 26 个单词', libKeys.reduce((s, k) => s + LIBRARIES[k].words.length, 0));

console.log('\n' + (fail === 0 ? '全部通过 ✅' : fail + ' 项未通过 ❌'));
process.exit(fail === 0 ? 0 : 1);
