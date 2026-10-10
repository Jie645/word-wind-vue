/* ============================================================
 * AppTopBar · 顶部导航栏（主页与阅读页共用）
 *   Logo | 搜索框 | 📖 阅读（新增入口） | 夜间模式 · 头像 · 用户名 · 退出
 * ============================================================ */
(function (global) {
  'use strict';
  const WW = global.WW = global.WW || {};
  WW.components = WW.components || {};
  const { ref, computed } = global.Vue;

  WW.components.AppTopBar = {
    name: 'AppTopBar',
    setup() {
      const store = WW.store;
      const q = ref('');
      const onReading = computed(() => store.state.route === 'reading');
      const initial = computed(() => (store.state.user[0] || 'U').toUpperCase());

      function onSearch() {
        if (store.search(q.value)) q.value = '';
      }
      function goHome() { WW.router.navigate('app'); }
      function goReading() { WW.router.navigate('reading'); }

      return { store, q, onReading, initial, onSearch, goHome, goReading };
    },
    template: `
<header class="ww-glass sticky top-0 z-40 flex flex-wrap items-center gap-3 md:gap-4
               px-4 md:px-6 py-3 border-b border-cream-300/70 dark:border-white/5">
  <button @click="goHome" title="返回单词主页"
          class="flex items-center gap-2.5 font-extrabold text-[17px] whitespace-nowrap order-1">
    <i class="w-8 h-8 rounded-[10px] grid place-items-center not-italic text-white text-base
              bg-gradient-to-br from-brand-blue to-brand-violet shadow-md">W</i>
    <span class="hidden sm:inline">Word Wind</span>
  </button>

  <form @submit.prevent="onSearch"
        class="order-3 md:order-2 w-full md:w-auto md:flex-1 md:max-w-[560px] md:mx-auto
               flex items-center gap-2 pl-4 pr-1.5 bg-white dark:bg-slate-800
               border border-cream-300 dark:border-slate-700 rounded-2xl shadow-sm
               focus-within:ring-4 focus-within:ring-brand-blue/15 focus-within:border-brand-blue2">
    <input v-model="q" type="search" placeholder="搜索英文单词" autocomplete="off" aria-label="搜索单词"
           class="flex-1 min-w-0 bg-transparent border-none outline-none py-2.5 text-[15px] text-ink dark:text-slate-100 placeholder:text-ink-400 dark:placeholder:text-slate-500" />
    <button type="submit" :disabled="!q.trim()"
            class="px-4 py-2 rounded-xl text-sm font-bold text-white
                   bg-gradient-to-br from-brand-blue2 to-brand-blue
                   disabled:opacity-50 disabled:cursor-not-allowed transition hover:brightness-105">搜索</button>
  </form>

  <!-- ★ 新增：文章阅读入口（位于搜索框与右侧用户区之间） -->
  <button id="readingNavBtn" @click="goReading"
          :title="onReading ? '已在阅读页' : '进入英语文章阅读'"
          :class="onReading
            ? 'text-white bg-gradient-to-br from-brand-violet to-brand-pink border-transparent shadow-md shadow-brand-violet/30'
            : 'text-ink-600 dark:text-slate-300 bg-white dark:bg-slate-800 border-cream-300 dark:border-slate-700 hover:text-brand-bluedeep hover:border-brand-blue2'"
          class="order-4 md:order-3 flex items-center gap-2 px-4 py-2.5 rounded-2xl border
                 text-sm font-extrabold whitespace-nowrap transition
                 hover:-translate-y-0.5 active:translate-y-0">
    <span class="text-base leading-none">📖</span><span>阅读</span>
  </button>

  <div class="order-2 md:order-4 flex items-center gap-2 md:gap-3 ml-auto whitespace-nowrap">
    <button @click="store.toggleTheme()"
            :title="store.state.theme === 'dark' ? '切换到日间模式' : '切换到夜间模式'"
            class="w-9 h-9 rounded-full grid place-items-center text-[17px] bg-white dark:bg-slate-800
                   border border-cream-300 dark:border-slate-700 shadow-sm transition
                   hover:-translate-y-0.5 hover:rotate-12 hover:border-brand-blue2">
      {{ store.state.theme === 'dark' ? '☀️' : '🌙' }}
    </button>
    <div class="w-9 h-9 rounded-full grid place-items-center text-white font-extrabold text-sm
                bg-gradient-to-br from-brand-pink to-brand-violet">{{ initial }}</div>
    <span class="hidden md:inline text-sm font-bold text-ink-600 dark:text-slate-300 max-w-[110px] truncate">{{ store.state.user }}</span>
    <button @click="store.logout()"
            class="px-2.5 py-1.5 rounded-lg text-[13px] text-ink-400 dark:text-slate-400
                   hover:bg-cream-200 dark:hover:bg-slate-800 hover:text-ink transition">退出</button>
  </div>
</header>
`
  };
})(window);
