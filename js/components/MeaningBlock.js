/* ============================================================
 * MeaningBlock · 释义区块（主页单词卡与阅读查词弹窗共用）
 *   翻译（带词性标签）/ 例句（英中对照）/ 短语
 * ============================================================ */
(function (global) {
  'use strict';
  const WW = global.WW = global.WW || {};
  WW.components = WW.components || {};

  WW.components.MeaningBlock = {
    name: 'MeaningBlock',
    props: {
      entry: { type: Object, required: true }
    },
    setup() { return { store: WW.store }; },
    template: `
<div>
  <p class="mt-5 mb-2.5 text-sm font-extrabold tracking-wide text-[#8a7256] dark:text-[#c9a978]">翻译</p>
  <ul class="space-y-2.5">
    <li v-for="(t, i) in entry.trans" :key="'t' + i"
        class="flex items-start gap-2.5 rounded-xl px-4 py-3
               bg-gradient-to-r from-[#e9f3fd] to-[#fdeaf2]
               dark:from-[#26313f] dark:to-[#342732]">
      <span class="shrink-0 mt-0.5 px-2 py-0.5 rounded-md text-[11px] font-extrabold
                   bg-brand-blue/12 text-brand-bluedeep dark:bg-brand-blue/20 dark:text-[#9cc4ff]">{{ t[0] }}</span>
      <span class="text-[15px] leading-relaxed text-ink-700 dark:text-slate-200">{{ t[1] }}</span>
    </li>
  </ul>

  <template v-if="entry.sentences && entry.sentences.length">
    <p class="mt-5 mb-2.5 text-sm font-extrabold tracking-wide text-[#8a7256] dark:text-[#c9a978]">例句</p>
    <ul class="space-y-2.5">
      <li v-for="(s, i) in entry.sentences" :key="'s' + i"
          class="rounded-xl px-4 py-3 bg-gradient-to-r from-[#eef5fd] to-[#fdeaf2]
                 dark:from-[#26313f] dark:to-[#342732]">
        <strong class="block text-[15px] font-bold text-ink-700 dark:text-slate-100">{{ s[0] }}</strong>
        <span class="mt-0.5 block text-[13px] text-ink-500 dark:text-slate-300">{{ s[1] }}</span>
      </li>
    </ul>
  </template>

  <template v-if="entry.phrases && entry.phrases.length">
    <p class="mt-5 mb-2.5 text-sm font-extrabold tracking-wide text-[#8a7256] dark:text-[#c9a978]">短语搭配</p>
    <ul class="grid sm:grid-cols-2 gap-2.5">
      <li v-for="(p, i) in entry.phrases" :key="'p' + i"
          class="rounded-xl px-3.5 py-2.5 text-[14px]
                 bg-gradient-to-r from-[#e9f3fd] to-[#fdeaf2]
                 dark:from-[#26313f] dark:to-[#342732]">
        <strong class="font-bold text-ink-700 dark:text-slate-100">{{ p[0] }}</strong>
        <span class="text-ink-500 dark:text-slate-300"> · {{ p[1] }}</span>
      </li>
    </ul>
  </template>
</div>
`
  };
})(window);
