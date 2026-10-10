/* ============================================================
 * WordCard · 背单词主卡片（单词 / 音标朗读 / 释义 / 收藏 / 不会）
 * ============================================================ */
(function (global) {
  'use strict';
  const WW = global.WW = global.WW || {};
  WW.components = WW.components || {};
  const { computed } = global.Vue;

  WW.components.WordCard = {
    name: 'WordCard',
    setup() {
      const store = WW.store;
      const word = computed(() => store.current());
      const faved = computed(() => !!word.value && store.isFav(store.state.lib, word.value.word));
      const marked = computed(() => !!word.value && store.isUnknown(store.state.lib, word.value.word));

      function speak(lang, e) { if (word.value) store.speak(word.value.word, lang, e.currentTarget); }
      function toggleFav() {
        const on = store.toggleFav(store.state.lib, word.value.word);
        store.toast(on ? '已加入「收藏」' : '已取消收藏');
      }
      function markUnknown() {
        if (marked.value) { store.toast('已在「不会的单词」里啦'); return; }
        store.addUnknown(store.state.lib, word.value.word);
        store.toast('已加入「不会的单词」');
      }
      return { store, word, faved, marked, speak, toggleFav, markUnknown };
    },
    template: `
<div v-if="word" class="ww-card relative overflow-hidden rounded-[26px] px-5 sm:px-11 pt-9 pb-7">
  <div class="word-head text-center">
    <h1 class="text-[34px] sm:text-[52px] font-extrabold leading-tight break-words
               text-ink dark:text-slate-50">{{ word.word }}</h1>
    <div class="flex flex-wrap justify-center gap-3.5 mt-4">
      <button @click="speak('en-US', $event)"
              class="phon-btn flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white
                     bg-gradient-to-br from-[#ff8fb1] to-brand-pink shadow-lg shadow-brand-pink/30
                     transition hover:-translate-y-0.5 active:scale-95">
        🇺🇸 🔊 <span>{{ word.us }}</span>
      </button>
      <button @click="speak('en-GB', $event)"
              class="phon-btn flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold text-white
                     bg-gradient-to-br from-[#ff8fb1] to-brand-pink shadow-lg shadow-brand-pink/30
                     transition hover:-translate-y-0.5 active:scale-95">
        🇬🇧 🔊 <span>{{ word.uk }}</span>
      </button>
    </div>
  </div>

  <div class="relative mt-4">
    <div :class="store.state.hideMeaning ? 'blur-[9px] opacity-55 pointer-events-none select-none' : ''"
         class="transition duration-300">
      <MeaningBlock :entry="word" />
    </div>
    <div v-if="store.state.hideMeaning"
         class="absolute inset-0 z-[3] flex items-center justify-center text-base font-extrabold text-[#6b7a8d] dark:text-slate-400">
      点击左侧「显示释义」查看含义 👀
    </div>
  </div>

  <div class="relative flex flex-wrap justify-center items-center gap-3.5 mt-7">
    <button @click="toggleFav"
            :class="faved
              ? 'text-white bg-gradient-to-br from-[#ffd76e] to-[#f0a93b] border-transparent shadow-brand-pink/20'
              : 'text-[#c08a2e] border-[#f0d9a8]'"
            class="px-8 py-3 rounded-full text-base font-extrabold tracking-wider border
                   bg-white/90 dark:bg-slate-800/90 shadow-lg transition hover:-translate-y-0.5">
      {{ faved ? '★ 已收藏' : '☆ 收藏' }}
    </button>
    <button @click="markUnknown"
            :class="marked
              ? 'bg-gradient-to-br from-emerald-400 to-emerald-500 shadow-emerald-400/40 tracking-[3px]'
              : 'bg-gradient-to-br from-[#a78bfa] to-brand-pink shadow-brand-violet/40 tracking-[6px]'"
            class="px-12 py-3 rounded-full text-base font-extrabold text-white shadow-xl
                   transition hover:-translate-y-0.5 hover:scale-[1.02]">
      {{ marked ? '已加入' : '不会' }}
    </button>
  </div>
</div>
`
  };
})(window);
