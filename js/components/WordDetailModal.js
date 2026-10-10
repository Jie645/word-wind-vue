/* ============================================================
 * WordDetailModal · 单词详情弹窗
 *   主页点搜索结果 / 点收藏与生词本中的词 / 阅读页点单词，都用这一个弹窗
 *   关闭方式：右上角 ✕、点遮罩、Esc（Esc 在主 App 统一监听）
 * ============================================================ */
(function (global) {
  'use strict';
  const WW = global.WW = global.WW || {};
  WW.components = WW.components || {};
  const { computed } = global.Vue;

  WW.components.WordDetailModal = {
    name: 'WordDetailModal',
    components: {},
    setup() {
      const store = WW.store;
      const detail = computed(() => store.state.detail);
      const isPhrase = computed(() => !!(detail.value && detail.value.entry && detail.value.entry.type === 'phrase'));
      const faved = computed(() => {
        const d = detail.value;
        return !!(d && d.entry) && store.isFav(d.lib, d.word);
      });
      // 未收录时，顺便提示该词是否能在背单词词库中找到
      const libHit = computed(() => {
        const d = detail.value;
        if (!d || d.entry || !d.word) return null;
        const all = store.libs();
        for (const k of Object.keys(all)) {
          const hit = all[k].words.find((w) => w.word.toLowerCase() === String(d.word).toLowerCase());
          if (hit) return { lib: k, entry: hit };
        }
        return null;
      });

      function close() { store.closeDetail(); }
      function speakIt(lang) {
        const d = store.state.detail;
        if (d) store.speak(d.word, lang, null);
      }
      function toggleFav() {
        const d = store.state.detail;
        if (!d || !d.entry) return;
        const on = store.toggleFav(d.lib, d.word);
        store.toast(on ? '已加入「收藏」' : '已取消收藏');
      }
      function jumpToLibrary() {
        const hit = libHit.value;
        if (!hit) return;
        store.setLib(hit.lib);
        store.closeDetail();
        if (store.state.route !== 'app') WW.router.navigate('app');
        store.toast('已切换到 ' + store.libLabel(hit.lib) + ' 词库');
      }

      return { store, detail, isPhrase, faved, libHit, close, speakIt, toggleFav, jumpToLibrary };
    },
    template: `
<transition name="ww-fade">
  <div v-if="detail" class="fixed inset-0 z-[140] flex items-center justify-center p-4
                            bg-[rgba(60,48,32,.42)] dark:bg-black/60 backdrop-blur-[5px]"
       @click.self="close">
    <transition name="ww-pop" appear>
      <div class="relative w-full max-w-[640px] max-h-[90vh] overflow-y-auto ww-scroll
                  rounded-[22px] ww-card ww-solid px-6 sm:px-9 pt-8 pb-7">
        <button @click="close" aria-label="关闭"
                class="absolute top-3 right-3.5 w-9 h-9 rounded-[9px] grid place-items-center
                       text-ink-400 hover:bg-cream-200 dark:hover:bg-slate-700 hover:text-ink transition">✕</button>

        <h2 class="text-center text-[30px] sm:text-[40px] font-extrabold leading-tight break-words
                   text-ink dark:text-slate-50">{{ detail.word }}</h2>
        <p class="text-center text-[12px] tracking-[2px] text-ink-400 dark:text-slate-400 mt-1 mb-3">
          {{ store.libLabel(detail.lib) }}<template v-if="isPhrase"> · 词组</template>
        </p>

        <!-- 音标 + 发音 -->
        <div class="flex flex-wrap justify-center gap-3 mb-2">
          <template v-if="detail.entry && (detail.entry.us || detail.entry.uk)">
            <button v-if="detail.entry.us" @click="speakIt('en-US')"
                    class="phon-btn flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-semibold text-white
                           bg-gradient-to-br from-[#ff8fb1] to-brand-pink shadow-lg shadow-brand-pink/30 transition
                           hover:-translate-y-0.5 active:scale-95">
              🇺🇸 🔊 <span>{{ detail.entry.us }}</span>
            </button>
            <button v-if="detail.entry.uk" @click="speakIt('en-GB')"
                    class="phon-btn flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-semibold text-white
                           bg-gradient-to-br from-[#ff8fb1] to-brand-pink shadow-lg shadow-brand-pink/30 transition
                           hover:-translate-y-0.5 active:scale-95">
              🇬🇧 🔊 <span>{{ detail.entry.uk }}</span>
            </button>
          </template>
          <button v-else @click="speakIt('en-US')"
                  class="flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-semibold text-white
                         bg-gradient-to-br from-brand-violet to-brand-blue shadow-lg shadow-brand-violet/30 transition
                         hover:-translate-y-0.5">
            🔊 <span>朗读</span>
          </button>
        </div>

        <!-- 已收录：完整释义 -->
        <MeaningBlock v-if="detail.entry" :entry="detail.entry" />

        <!-- 未收录兜底 -->
        <div v-else class="mt-5 rounded-2xl px-5 py-6 text-center
                           bg-gradient-to-r from-[#e9f3fd] to-[#fdeaf2]
                           dark:from-[#26313f] dark:to-[#342732]">
          <p class="text-[15px] font-bold text-ink-700 dark:text-slate-100">这个词还没有收录进演示词典 📭</p>
          <p class="mt-1.5 text-[13px] text-ink-500 dark:text-slate-300">
            演示词典收录了本文的 30 个重点词与 6 个词组，其余单词点击后会走到这个兜底状态。
          </p>
          <button v-if="libHit" @click="jumpToLibrary"
                  class="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white
                         bg-gradient-to-br from-brand-blue2 to-brand-blue shadow-md transition hover:-translate-y-0.5">
            在「{{ store.libLabel(libHit.lib) }}」词库中找到它 →
          </button>
        </div>

        <div class="flex gap-2.5 mt-6">
          <button v-if="detail.entry" @click="toggleFav"
                  :class="faved
                    ? 'text-white bg-gradient-to-br from-[#ffd76e] to-[#f0a93b] border-transparent'
                    : 'text-[#c08a2e] bg-cream-100 dark:bg-slate-800 border-[#f0d9a8] dark:border-slate-600'"
                  class="flex-1 py-3 rounded-xl font-bold text-sm border transition hover:-translate-y-0.5">
            {{ faved ? '★ 已收藏' : '☆ 收藏' }}
          </button>
          <button @click="close"
                  class="flex-1 py-3 rounded-xl font-bold text-sm text-white
                         bg-gradient-to-br from-brand-blue2 to-brand-blue shadow-md transition hover:-translate-y-0.5">关闭</button>
        </div>
      </div>
    </transition>
  </div>
</transition>
`
  };
})(window);
