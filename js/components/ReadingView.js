/* ============================================================
 * ReadingView · 英语新闻阅读页
 *   实时加载 Breaking News English，支持 Level 0-6、随机换稿
 *   点击任意单词 / 词组 → 弹出与主页一致的单词详情弹窗
 * ============================================================ */
(function (global) {
  'use strict';
  const WW = global.WW = global.WW || {};
  WW.components = WW.components || {};
  const { computed, ref, onMounted } = global.Vue;

  WW.components.ReadingView = {
    name: 'ReadingView',
    setup() {
      const store = WW.store;
      const utils = WW.readingUtils;
      const source = WW.breakingNews;
      const loading = ref(false);
      const liveError = ref('');

      const article = computed(() => store.state.readingArticle || WW.ARTICLE);
      const tokens = computed(() => utils.tokenizeArticle(article.value.paragraphs || [], WW.READING_PHRASES));
      const wordCount = computed(() => article.value.words || utils.countWords(article.value.paragraphs || []));
      const dictSize = Object.keys(WW.READING_DICT).filter((k) => !WW.READING_DICT[k].type).length;
      const phraseSize = Object.keys(WW.READING_DICT).filter((k) => WW.READING_DICT[k].type === 'phrase').length;
      const progress = computed(() => {
        const seen = store.state.lookedUp;
        const all = new Set();
        tokens.value.forEach((p) => p.forEach((t) => { if (t.type === 'word' || t.type === 'phrase') all.add(t.key); }));
        const hit = [...all].filter((k) => seen.indexOf(k) > -1).length;
        return { hit: hit, total: all.size };
      });

      const font = computed(() => store.state.readingFont);
      const levels = [0, 1, 2, 3, 4, 5, 6];
      const currentItem = computed(() => {
        const items = store.state.readingNewsItems || [];
        return items.find((item) => {
          if (item.id === article.value.id || item.url === article.value.sourceUrl) return true;
          const urls = Object.keys(item.availableLevels || {}).map((key) => item.availableLevels[key]);
          return urls.indexOf(article.value.sourceUrl) > -1;
        }) || null;
      });
      const liveReady = computed(() => store.state.readingSource === 'live' && store.state.readingNewsItems.length > 0);
      const liveArticleReady = computed(() => liveReady.value && !!article.value.sourceUrl);
      const currentArticleKey = computed(() => article.value.sourceUrl || article.value.id);
      const selectedBand = computed(() => source.LEVEL_BANDS[store.state.readingLevel] || '');

      function setFont(v) {
        store.state.readingFont = v;
        store.toast('正文字号：' + (v === 'sm' ? '小' : v === 'lg' ? '大' : '中'), 1200);
      }
      function onLookup(token) { store.lookupInArticle(token); }
      function resetLooked() { store.state.lookedUp.splice(0); }
      function goHome() { WW.router.navigate('app'); }
      function errorText(error) { return (error && error.message) || '实时新闻加载失败'; }

      async function loadArticle(item, requestedLevel, force) {
        if (!item || loading.value) return;
        loading.value = true;
        liveError.value = '';
        try {
          const next = await source.getArticle(item, requestedLevel, force);
          store.setReadingArticle(next);
          if (next.fallback) {
            store.toast('Level ' + requestedLevel + ' 暂无版本，已自动使用相邻的 Level ' + next.resolvedLevel, 2600);
          }
        } catch (error) {
          liveError.value = errorText(error);
          store.toast('文章加载失败：' + liveError.value, 3200);
        } finally {
          loading.value = false;
        }
      }

      async function loadLatest(force) {
        if (loading.value) return;
        loading.value = true;
        liveError.value = '';
        try {
          const items = await source.getLatestNews(force);
          store.setReadingNews(items);
          const item = source.pickRandomItem(items, store.state.readingLevel, currentArticleKey.value);
          if (!item) throw new Error('没有符合当前难度的新闻');
          const next = await source.getArticle(item, store.state.readingLevel, force);
          store.setReadingArticle(next);
          if (next.fallback) store.toast('已自动使用相邻的 Level ' + next.resolvedLevel, 2200);
        } catch (error) {
          liveError.value = errorText(error);
          store.state.readingSource = 'fallback';
        } finally {
          loading.value = false;
        }
      }

      async function setLevel(level) {
        if (loading.value || store.state.readingLevel === level) return;
        store.setReadingLevel(level);
        store.toast('已选择 Level ' + level, 1200);
        const item = currentItem.value;
        if (item) await loadArticle(item, level, false);
        else await loadLatest(true);
      }

      async function randomArticle() {
        if (loading.value) return;
        const items = store.state.readingNewsItems || [];
        if (!items.length) { await loadLatest(true); return; }
        const item = source.pickRandomItem(items, store.state.readingLevel, currentArticleKey.value);
        if (!item) { store.toast('文章库中没有其他可用新闻', 1800); return; }
        await loadArticle(item, store.state.readingLevel, false);
      }

      onMounted(() => { loadLatest(false); });

      return {
        store, source, article, tokens, wordCount, dictSize, phraseSize, progress, font, levels,
        currentItem, liveReady, liveArticleReady, selectedBand, loading, liveError,
        setFont, onLookup, resetLooked, goHome, loadLatest, setLevel, randomArticle
      };
    },
    template: `
<div class="min-h-screen flex flex-col pb-10">
  <AppTopBar />

  <main class="flex-1 w-full max-w-[860px] mx-auto px-4 md:px-6 py-6 md:py-9">
    <div class="flex items-center justify-between gap-3 mb-4">
      <button @click="goHome"
              class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold
                     text-ink-600 dark:text-slate-300 bg-white/80 dark:bg-slate-800/80
                     border border-cream-300 dark:border-slate-700 shadow-sm transition
                     hover:-translate-x-0.5 hover:text-brand-bluedeep hover:border-brand-blue2">
        ⬅️ 返回单词主页
      </button>
      <div class="flex items-center gap-2">
        <span class="hidden sm:inline text-[12px] font-bold text-ink-400 dark:text-slate-400 mr-1">字号</span>
        <button v-for="f in ['sm','md','lg']" :key="f" @click="setFont(f)"
                :class="font === f ? 'text-white bg-gradient-to-br from-brand-blue2 to-brand-blue border-transparent'
                                   : 'text-ink-500 dark:text-slate-300 bg-white dark:bg-slate-800 border-cream-300 dark:border-slate-700'"
                class="w-9 h-9 rounded-lg border text-[12px] font-extrabold leading-none whitespace-nowrap transition">
          {{ f === 'sm' ? 'A-' : f === 'md' ? 'A' : 'A+' }}
        </button>
      </div>
    </div>

    <section class="ww-card rounded-[22px] px-4 sm:px-6 py-4 mb-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-[12px] font-bold tracking-wide text-ink-400 dark:text-slate-400">阅读难度</p>
          <p class="mt-0.5 text-[18px] font-extrabold text-ink dark:text-slate-50">
            Level {{ store.state.readingLevel }}
            <span class="ml-1 text-[12px] font-bold text-brand-bluedeep dark:text-[#9cc4ff]">{{ selectedBand }}</span>
          </p>
        </div>
        <button @click="randomArticle" :disabled="loading"
                class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-extrabold
                       text-white bg-gradient-to-br from-brand-violet to-brand-blue shadow-lg shadow-brand-blue/25
                       transition hover:-translate-y-0.5 disabled:opacity-55 disabled:cursor-not-allowed">
          <span v-if="loading" class="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"></span>
          {{ loading ? '正在加载...' : '🎲 随机换一篇' }}
        </button>
      </div>

      <div class="grid grid-cols-7 gap-1.5 sm:gap-2 mt-3">
        <button v-for="n in levels" :key="n" @click="setLevel(n)" :disabled="loading"
                :class="store.state.readingLevel === n
                  ? 'text-white bg-gradient-to-br from-brand-blue2 to-brand-blue border-transparent shadow-md shadow-brand-blue/25'
                  : 'text-ink-500 dark:text-slate-300 bg-cream-50 dark:bg-slate-800 border-cream-300 dark:border-slate-700 hover:border-brand-blue2'"
                class="h-9 rounded-lg border text-[12px] font-extrabold transition disabled:opacity-55 disabled:cursor-not-allowed">
          L{{ n }}
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-[12px] font-semibold text-ink-400 dark:text-slate-400">
        <span :class="liveArticleReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'">
          {{ liveArticleReady ? '● 实时新闻已连接' : (liveReady ? '● 正在加载实时文章...' : '● 当前使用内置示例') }}
        </span>
        <span v-if="currentItem">更新：{{ currentItem.date }} · {{ currentItem.kind }} 版</span>
        <span v-if="article.fallback" class="text-amber-600 dark:text-amber-400">
          当前文章没有 Level {{ store.state.readingLevel }}，已回退到 Level {{ article.resolvedLevel }}
        </span>
      </div>

      <div v-if="liveError" class="mt-3 flex flex-wrap items-center gap-2 rounded-xl px-3 py-2
                                    bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800
                                    text-[12px] leading-5 text-amber-700 dark:text-amber-300">
        <span class="flex-1">实时新闻暂不可用：{{ liveError }}</span>
        <button @click="loadLatest(true)" :disabled="loading" class="font-extrabold underline underline-offset-2">重试</button>
      </div>
    </section>

    <article class="ww-card rounded-[26px] px-5 sm:px-10 md:px-12 py-8 md:py-10 transition"
             :class="{ 'opacity-55': loading }">
      <div class="flex flex-wrap items-center gap-2 mb-4">
        <span class="px-3 py-1 rounded-full text-[12px] font-extrabold text-brand-bluedeep bg-brand-blue/12 dark:bg-brand-blue/20 dark:text-[#9cc4ff]">{{ article.tag }}</span>
        <span class="px-3 py-1 rounded-full text-[12px] font-bold text-ink-500 dark:text-slate-300 bg-cream-200 dark:bg-slate-800">{{ article.level }}</span>
        <span v-if="article.published" class="px-3 py-1 rounded-full text-[12px] font-bold text-ink-500 dark:text-slate-300 bg-cream-200 dark:bg-slate-800">{{ article.published }}</span>
      </div>

      <h1 class="text-[26px] sm:text-[34px] font-extrabold leading-tight text-ink dark:text-slate-50">{{ article.title }}</h1>
      <p v-if="article.titleZh" class="mt-1.5 text-[14px] text-ink-500 dark:text-slate-400">{{ article.titleZh }}</p>

      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 pb-5 mb-6
                  text-[12.5px] font-semibold text-ink-400 dark:text-slate-400
                  border-b border-cream-300/80 dark:border-slate-700">
        <span>📄 约 {{ wordCount }} 词</span>
        <span>⏱️ {{ article.minutes }} 分钟</span>
        <span v-if="article.sourceUrl">🌐 Breaking News English</span>
        <span v-else>🔤 词典收录 {{ dictSize }} 词 + {{ phraseSize }} 词组</span>
        <span class="text-brand-pink dark:text-[#f7a6c4]">已查 {{ progress.hit }} / {{ progress.total }} 词</span>
      </div>

      <ArticleText :tokens="tokens" :seen="store.state.lookedUp" :font-size="font" @lookup="onLookup" />

      <div class="mt-8 pt-5 border-t border-cream-300/80 dark:border-slate-700 flex flex-wrap items-center gap-3
                  text-[12.5px] text-ink-400 dark:text-slate-400">
        <span>💡 点击任意单词或词组即可查看释义、音标和例句</span>
        <a v-if="article.sourceUrl" :href="article.sourceUrl" target="_blank" rel="noopener noreferrer"
           class="font-bold text-brand-bluedeep dark:text-[#9cc4ff] hover:underline">查看原文 ↗</a>
        <button @click="resetLooked"
                class="ml-auto px-3 py-1.5 rounded-lg font-bold text-ink-500 dark:text-slate-300
                       bg-cream-200 dark:bg-slate-800 hover:bg-cream-300 dark:hover:bg-slate-700 transition">清除标记</button>
      </div>
    </article>

    <p class="text-center text-[12px] text-ink-400 dark:text-slate-500 mt-6">
      Word Wind · 实时新闻阅读 · 来源 Breaking News English · 点击查词
    </p>
  </main>
</div>
`
  };
})(window);