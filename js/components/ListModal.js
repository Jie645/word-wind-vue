/* ============================================================
 * ListModal · 通用列表弹窗（收藏夹 / 不会的单词共用）
 *   props: show / title / emptyText / items
 *   emits: close / remove(key) / clear / open(item)
 * ============================================================ */
(function (global) {
  'use strict';
  const WW = global.WW = global.WW || {};
  WW.components = WW.components || {};

  WW.components.ListModal = {
    name: 'ListModal',
    props: {
      show: { type: Boolean, default: false },
      title: { type: String, default: '' },
      emptyText: { type: String, default: '列表还是空的～' },
      items: { type: Array, default: () => [] }
    },
    emits: ['close', 'remove', 'clear', 'open'],
    setup() { return { store: WW.store }; },
    template: `
<transition name="ww-fade">
  <div v-if="show" class="fixed inset-0 z-[130] flex items-center justify-center p-5
                          bg-[rgba(60,48,32,.42)] dark:bg-black/60 backdrop-blur-[5px]"
       @click.self="$emit('close')">
    <transition name="ww-pop" appear>
      <div class="relative w-full max-w-[520px] max-h-[90vh] overflow-y-auto ww-scroll
                  rounded-[22px] ww-card ww-solid px-6 sm:px-8 pt-8 pb-6">
        <button @click="$emit('close')" aria-label="关闭"
                class="absolute top-3 right-3.5 w-9 h-9 rounded-[9px] grid place-items-center
                       text-ink-400 hover:bg-cream-200 dark:hover:bg-slate-700 hover:text-ink transition">✕</button>

        <h2 class="text-center text-[22px] font-extrabold text-ink dark:text-slate-50">{{ title }}</h2>
        <p class="text-center text-[13px] text-ink-400 dark:text-slate-400 mt-1 mb-5">
          {{ items.length ? '共 ' + items.length + ' 个，点击单词可查看详情' : emptyText }}
        </p>

        <ul class="space-y-2.5">
          <li v-for="it in items" :key="it.key"
              class="flex items-center gap-3 rounded-xl px-4 py-3
                     bg-gradient-to-r from-[#eef5fd] to-[#fdeaf2] dark:from-[#26313f] dark:to-[#342732]">
            <button @click="$emit('open', it)"
                    class="min-w-[104px] text-left text-[16px] font-extrabold text-ink dark:text-slate-50
                           underline decoration-dotted underline-offset-4 hover:text-brand-bluedeep transition">
              {{ it.w.word }}
            </button>
            <span class="flex-1 text-[13px] leading-snug text-ink-500 dark:text-slate-300">
              {{ it.w.trans[0][0] }}: {{ it.w.trans[0][1] }}<br>
              <em class="not-italic text-ink-400 dark:text-slate-500">{{ store.libLabel(it.lib) }}</em>
            </span>
            <button @click="$emit('remove', it.key)"
                    class="px-2.5 py-1.5 rounded-lg text-[13px] font-bold text-red-500
                           hover:bg-red-50 dark:hover:bg-red-500/10 transition">移除</button>
          </li>
        </ul>

        <div class="flex gap-2.5 mt-6">
          <button @click="$emit('clear')"
                  class="flex-1 py-3 rounded-xl text-sm font-bold text-[#5a4b36] dark:text-slate-200
                         bg-cream-200 dark:bg-slate-700 hover:bg-cream-300 dark:hover:bg-slate-600 transition">清空列表</button>
          <button @click="$emit('close')"
                  class="flex-1 py-3 rounded-xl text-sm font-bold text-white
                         bg-gradient-to-br from-brand-blue2 to-brand-blue shadow-md transition hover:-translate-y-0.5">完成</button>
        </div>
      </div>
    </transition>
  </div>
</transition>
`
  };
})(window);
