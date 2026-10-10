/* ============================================================
 * LibrarySidebar · 左侧侧边栏（词库选择 / 进度 / 跳转 / 隐藏释义）
 * ============================================================ */
(function (global) {
  'use strict';
  const WW = global.WW = global.WW || {};
  WW.components = WW.components || {};
  const { ref, computed } = global.Vue;

  WW.components.LibrarySidebar = {
    name: 'LibrarySidebar',
    setup() {
      const store = WW.store;
      const libList = computed(() => Object.keys(store.libs()).map((k) => ({ key: k, label: store.libs()[k].label })));
      const total = computed(() => store.words().length);
      const jump = ref('');

      function onLibChange(e) { store.setLib(e.target.value); jump.value = ''; }
      function onJump() {
        if (store.jumpTo(jump.value)) jump.value = '';
      }
      return { store, libList, total, jump, onLibChange, onJump };
    },
    template: `
<aside class="w-full lg:w-[236px] shrink-0 lg:sticky lg:top-[88px] ww-card rounded-[18px] px-[18px] py-5">
  <label class="block text-[12px] font-bold tracking-wider text-ink-400 dark:text-slate-400 mb-2">选择词库</label>
  <select :value="store.state.lib" @change="onLibChange"
          class="w-full px-3 py-2.5 rounded-xl text-sm font-semibold outline-none cursor-pointer
                 bg-cream-50 dark:bg-slate-800 border border-cream-300 dark:border-slate-700
                 text-ink dark:text-slate-100 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15">
    <option v-for="l in libList" :key="l.key" :value="l.key">{{ l.label }}</option>
  </select>

  <div class="my-4 rounded-xl px-3.5 py-3 text-[13px] leading-7 font-semibold
              text-ink-500 dark:text-slate-300 bg-gradient-to-r from-[#e4f0fc] to-[#fde6ef]
              dark:from-[#25344a] dark:to-[#3a2733]">
    当前是 {{ store.libLabel(store.state.lib) }} 词库<br>
    第 {{ store.state.index + 1 }} 个，共 {{ total }} 个
  </div>

  <form @submit.prevent="onJump" class="flex gap-2 mb-3.5">
    <input v-model="jump" type="number" min="1" :max="total" placeholder="页码" aria-label="跳转到第几个"
           class="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm outline-none
                  bg-cream-50 dark:bg-slate-800 border border-cream-300 dark:border-slate-700
                  text-ink dark:text-slate-100 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15" />
    <button type="submit"
            class="px-4 rounded-xl text-sm font-bold text-[#5a4b36] bg-cream-200 dark:bg-slate-700 dark:text-slate-200
                   hover:bg-cream-300 dark:hover:bg-slate-600 transition">跳转</button>
  </form>

  <button @click="store.toggleHide()"
          :class="store.state.hideMeaning
            ? 'text-white bg-gradient-to-br from-brand-blue2 to-brand-blue border-transparent'
            : 'text-ink-500 dark:text-slate-300 bg-white dark:bg-slate-800 border-cream-300 dark:border-slate-700 hover:text-brand-bluedeep hover:border-brand-blue2'"
          class="w-full py-2.5 rounded-xl text-sm font-bold border transition">
    {{ store.state.hideMeaning ? '显示释义' : '隐藏释义' }}
  </button>
</aside>
`
  };
})(window);
