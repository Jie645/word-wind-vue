/* ============================================================
 * ToastHost · 全局轻提示
 * ============================================================ */
(function (global) {
  'use strict';
  const WW = global.WW = global.WW || {};
  WW.components = WW.components || {};

  WW.components.ToastHost = {
    name: 'ToastHost',
    setup() { return { store: WW.store }; },
    template: `
<div class="pointer-events-none fixed inset-x-0 bottom-8 z-[200] flex justify-center px-4">
  <transition name="ww-fade">
    <div v-if="store.state.toastShow"
         class="max-w-[90vw] rounded-full bg-slate-900/88 dark:bg-slate-700/95 text-white
                text-sm font-bold px-5 py-2.5 shadow-2xl backdrop-blur">
      {{ store.state.toastText }}
    </div>
  </transition>
</div>
`
  };
})(window);
