/* ============================================================
 * app.js · 应用入口
 *   注册全部组件 → 挂载根组件 → 启动 hash 路由 → 绑定全局快捷键
 * ============================================================ */
(function (global) {
  'use strict';
  const WW = global.WW = global.WW || {};
  const Vue = global.Vue;
  const { computed, onMounted, onBeforeUnmount } = Vue;

  const RootApp = {
    name: 'RootApp',
    setup() {
      const store = WW.store;
      const route = computed(() => store.state.route);

      function onKeydown(e) {
        if (e.key === 'Escape') { store.closeDetail(); return; }
        if (store.state.route !== 'app') return;
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
        if (e.key === 'ArrowLeft') store.go(-1);
        if (e.key === 'ArrowRight') store.go(1);
      }

      /* 兜底：任何未捕获的脚本错误都用提示条喊出来，
         避免在预览沙箱里表现为「点了没反应」却毫无线索 */
      function onError(e) {
        const msg = (e && (e.message || e.reason && e.reason.message)) || '未知脚本错误';
        if (WW.store) WW.store.toast('⚠️ 脚本错误：' + msg, 6000);
      }

      onMounted(() => {
        store.init();
        WW.router.start((r) => {
          // 未登录：除登录页外一律回到登录页
          if (!store.state.user && r !== 'login') { store.state.route = 'login'; WW.router.navigate('login'); return; }
          // 已登录（记住我）：直接进入主页
          if (store.state.user && r === 'login') { store.state.route = 'app'; WW.router.navigate('app'); return; }
          store.state.route = r;
        });
        global.addEventListener('keydown', onKeydown);
        global.addEventListener('error', onError);
        global.addEventListener('unhandledrejection', onError);
      });

      onBeforeUnmount(() => {
        global.removeEventListener('keydown', onKeydown);
        global.removeEventListener('error', onError);
        global.removeEventListener('unhandledrejection', onError);
      });

      return { store, route };
    },
    template: `
<div>
  <LoginView v-if="route === 'login'" />
  <StudyView v-else-if="route === 'app'" />
  <ReadingView v-else-if="route === 'reading'" />
  <WordDetailModal />
  <ToastHost />
</div>
`
  };

  function boot() {
    const app = Vue.createApp(RootApp);
    Object.keys(WW.components).forEach((name) => app.component(name, WW.components[name]));
    app.mount('#app');
    WW.app = app;
  }

  WW.boot = boot;
})(window);
