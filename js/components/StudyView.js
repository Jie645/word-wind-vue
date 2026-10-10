/* ============================================================
 * StudyView · 背单词主页（侧边栏 + 单词卡 + 右侧收藏/生词本）
 * ============================================================ */
(function (global) {
  'use strict';
  const WW = global.WW = global.WW || {};
  WW.components = WW.components || {};
  const { ref, computed } = global.Vue;

  WW.components.StudyView = {
    name: 'StudyView',
    setup() {
      const store = WW.store;
      const showFav = ref(false);
      const showUnknown = ref(false);
      const favItems = computed(() => store.collect('favorites'));
      const unknownItems = computed(() => store.collect('unknown'));

      function openItem(it) {
        showFav.value = false; showUnknown.value = false;
        store.openDetail(it.w, it.lib, it.w.word);
      }
      function removeFav(key) { store.removeFav(key); }
      function removeUnknown(key) { store.removeUnknown(key); }
      function clearFav() { store.clearFav(); store.toast('收藏已清空'); }
      function clearUnknown() { store.clearUnknown(); store.toast('生词本已清空'); }
      function goReading() { WW.router.navigate('reading'); }

      return {
        store, showFav, showUnknown, favItems, unknownItems,
        openItem, removeFav, removeUnknown, clearFav, clearUnknown, goReading
      };
    },
    template: `
<div class="min-h-screen flex flex-col pb-20">
  <AppTopBar />

  <main class="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-6
               flex flex-col lg:flex-row gap-5 items-start">
    <LibrarySidebar />

    <section class="flex-1 min-w-0 w-full">
      <WordCard />
      <div class="flex justify-between gap-3.5 mt-5">
        <button @click="store.go(-1)" :disabled="store.state.index === 0"
                class="px-6 sm:px-8 py-3.5 rounded-2xl text-[15px] font-bold
                       bg-white/90 dark:bg-slate-800/90 border border-cream-300 dark:border-slate-700
                       text-ink-600 dark:text-slate-200 shadow-md transition
                       hover:-translate-y-0.5 hover:text-brand-bluedeep hover:border-brand-blue2
                       disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:translate-y-0">
          ⬅️ 上一个
        </button>
        <button @click="store.go(1)" :disabled="store.state.index >= store.words().length - 1"
                class="px-6 sm:px-8 py-3.5 rounded-2xl text-[15px] font-bold
                       bg-white/90 dark:bg-slate-800/90 border border-cream-300 dark:border-slate-700
                       text-ink-600 dark:text-slate-200 shadow-md transition
                       hover:-translate-y-0.5 hover:text-brand-bluedeep hover:border-brand-blue2
                       disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:translate-y-0">
          下一个 ➡️
        </button>
      </div>
      <p class="text-center text-[12px] text-ink-400 dark:text-slate-500 mt-3">
        提示：键盘 ← → 可快速翻词，Esc 关闭弹窗
      </p>
    </section>

    <aside class="w-full lg:w-[150px] shrink-0 lg:sticky lg:top-[88px] flex flex-wrap lg:flex-col gap-3">
      <button @click="showFav = true"
              class="relative flex-1 lg:flex-none px-3 py-3.5 rounded-2xl text-sm font-bold
                     bg-white/90 dark:bg-slate-800/90 border border-cream-300 dark:border-slate-700
                     text-ink-600 dark:text-slate-200 shadow-md transition
                     hover:-translate-y-0.5 hover:text-brand-bluedeep hover:border-brand-blue2">
        收藏
        <span v-if="favItems.length"
              class="absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-extrabold text-white
                     grid place-items-center bg-gradient-to-br from-brand-pink to-brand-violet">{{ favItems.length }}</span>
      </button>
      <button @click="showUnknown = true"
              class="relative flex-1 lg:flex-none px-3 py-3.5 rounded-2xl text-sm font-bold
                     bg-white/90 dark:bg-slate-800/90 border border-cream-300 dark:border-slate-700
                     text-ink-600 dark:text-slate-200 shadow-md transition
                     hover:-translate-y-0.5 hover:text-brand-bluedeep hover:border-brand-blue2">
        不会的单词
        <span v-if="unknownItems.length"
              class="absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-extrabold text-white
                     grid place-items-center bg-gradient-to-br from-brand-pink to-brand-violet">{{ unknownItems.length }}</span>
      </button>
      <button @click="goReading"
              class="flex-1 lg:flex-none px-3 py-3.5 rounded-2xl text-sm font-bold text-white
                     bg-gradient-to-br from-brand-violet to-brand-pink shadow-lg shadow-brand-violet/30
                     transition hover:-translate-y-0.5">
        📖 去阅读
      </button>
    </aside>
  </main>

  <footer class="ww-glass fixed inset-x-0 bottom-0 z-30 py-3 px-6 text-center
                 text-[12px] text-ink-400 dark:text-slate-400 border-t border-cream-300/70 dark:border-white/5">
    Word Wind · 高频词库 · 支持美音 / 英音朗读 · 生词本 &amp; 收藏夹 · 文章阅读
  </footer>

  <ListModal :show="showFav" title="收藏"
             empty-text="还没有收藏的单词，在卡片上点「☆ 收藏」试试吧～"
             :items="favItems"
             @close="showFav = false" @remove="removeFav" @clear="clearFav" @open="openItem" />

  <ListModal :show="showUnknown" title="不会的单词"
             empty-text="还没有标记的单词，去卡片里点「不会」试试吧～"
             :items="unknownItems"
             @close="showUnknown = false" @remove="removeUnknown" @clear="clearUnknown" @open="openItem" />
</div>
`
  };
})(window);
