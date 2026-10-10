/* ============================================================
 * RegisterModal · 注册弹窗（演示：前端校验 + 模拟提交，不落库）
 * ============================================================ */
(function (global) {
  'use strict';
  const WW = global.WW = global.WW || {};
  WW.components = WW.components || {};
  const { ref } = global.Vue;

  WW.components.RegisterModal = {
    name: 'RegisterModal',
    props: { show: { type: Boolean, default: false } },
    emits: ['close', 'registered'],
    setup(props, ctx) {
      const store = WW.store;
      const user = ref('');
      const pwd = ref('');
      const confirm = ref('');
      const showPwd = ref(false);
      const errors = ref({ user: '', pwd: '', confirm: '' });
      const loading = ref(false);
      const done = ref(false);

      function validate(notify) {
        const e = { user: '', pwd: '', confirm: '' };
        if (!user.value.trim()) e.user = '请输入用户名';
        else if (user.value.trim().length < 2) e.user = '用户名至少 2 个字符';
        if (!pwd.value) e.pwd = '请输入密码';
        else if (pwd.value.length < 6) e.pwd = '密码至少 6 位';
        if (!confirm.value) e.confirm = '请再次输入密码';
        else if (confirm.value !== pwd.value) e.confirm = '两次密码不一致';
        errors.value = e;
        const first = e.user || e.pwd || e.confirm;
        if (first && notify) store.toast('⚠️ ' + first, 2400);
        return !first;
      }

      async function submit() {
        if (!validate(true)) return;
        loading.value = true;
        await new Promise((r) => setTimeout(r, 900));
        loading.value = false;
        done.value = true;
        const name = user.value.trim();
        setTimeout(() => {
          ctx.emit('registered', name);
          reset();
        }, 700);
      }
      function reset() {
        user.value = ''; pwd.value = ''; confirm.value = '';
        errors.value = { user: '', pwd: '', confirm: '' };
        done.value = false; showPwd.value = false;
      }
      function close() { reset(); ctx.emit('close'); }

      return { store, user, pwd, confirm, showPwd, errors, loading, done, submit, close };
    },
    template: `
<transition name="ww-fade">
  <div v-if="show" class="fixed inset-0 z-[150] flex items-center justify-center p-5
                          bg-[rgba(60,48,32,.42)] dark:bg-black/60 backdrop-blur-[5px]"
       @click.self="close">
    <transition name="ww-pop" appear>
      <div class="relative w-full max-w-[430px] max-h-[90vh] overflow-y-auto ww-scroll
                  rounded-[22px] ww-card ww-solid px-7 sm:px-9 pt-8 pb-7">
        <button @click="close" aria-label="关闭"
                class="absolute top-3 right-3.5 w-9 h-9 rounded-[9px] grid place-items-center
                       text-ink-400 hover:bg-cream-200 dark:hover:bg-slate-700 hover:text-ink transition">✕</button>

        <h2 class="text-center text-[22px] font-extrabold text-ink dark:text-slate-50">创建账号</h2>
        <p class="text-center text-[13px] text-ink-400 dark:text-slate-400 mt-1 mb-5">只需几秒，即可开启 Word Wind 之旅</p>

        <form @submit.prevent="submit" novalidate>
          <div class="mb-4">
            <label class="block text-[13px] font-semibold text-ink-600 dark:text-slate-300 mb-1.5">用户名</label>
            <div :class="errors.user ? 'border-red-400 ring-4 ring-red-400/15' : 'border-cream-300 dark:border-slate-700 focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-blue/15'"
                 class="flex items-center gap-2 px-3 rounded-xl bg-cream-50 dark:bg-slate-800 border transition">
              <span class="text-[15px] opacity-80">👤</span>
              <input v-model="user" type="text" placeholder="2 位以上字符" autocomplete="off"
                     class="flex-1 bg-transparent border-none outline-none py-3 text-[15px] text-ink dark:text-slate-100" />
            </div>
            <p class="text-[13px] font-semibold text-red-500 mt-1.5 min-h-[18px]">{{ errors.user ? '⚠️ ' + errors.user : '' }}</p>
          </div>

          <div class="mb-4">
            <label class="block text-[13px] font-semibold text-ink-600 dark:text-slate-300 mb-1.5">密码</label>
            <div :class="errors.pwd ? 'border-red-400 ring-4 ring-red-400/15' : 'border-cream-300 dark:border-slate-700 focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-blue/15'"
                 class="flex items-center gap-2 px-3 rounded-xl bg-cream-50 dark:bg-slate-800 border transition">
              <span class="text-[15px] opacity-80">🔒</span>
              <input v-model="pwd" :type="showPwd ? 'text' : 'password'" placeholder="至少 6 位" autocomplete="new-password"
                     class="flex-1 bg-transparent border-none outline-none py-3 text-[15px] text-ink dark:text-slate-100" />
              <button type="button" @click="showPwd = !showPwd" class="text-[15px] opacity-70 hover:opacity-100">{{ showPwd ? '🙈' : '👁️' }}</button>
            </div>
            <p class="text-[13px] font-semibold text-red-500 mt-1.5 min-h-[18px]">{{ errors.pwd ? '⚠️ ' + errors.pwd : '' }}</p>
          </div>

          <div class="mb-4">
            <label class="block text-[13px] font-semibold text-ink-600 dark:text-slate-300 mb-1.5">确认密码</label>
            <div :class="errors.confirm ? 'border-red-400 ring-4 ring-red-400/15' : 'border-cream-300 dark:border-slate-700 focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-blue/15'"
                 class="flex items-center gap-2 px-3 rounded-xl bg-cream-50 dark:bg-slate-800 border transition">
              <span class="text-[15px] opacity-80">🔐</span>
              <input v-model="confirm" type="password" placeholder="再次输入密码" autocomplete="new-password"
                     class="flex-1 bg-transparent border-none outline-none py-3 text-[15px] text-ink dark:text-slate-100" />
            </div>
            <p class="text-[13px] font-semibold text-red-500 mt-1.5 min-h-[18px]">{{ errors.confirm ? '⚠️ ' + errors.confirm : '' }}</p>
          </div>

          <button type="submit" :disabled="loading"
                  class="w-full py-3.5 rounded-xl text-[15px] font-bold tracking-[3px] text-white
                         bg-gradient-to-br from-brand-blue2 to-brand-blue shadow-lg shadow-brand-blue/30
                         flex items-center justify-center gap-2 transition
                         hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed">
            <span v-if="loading" class="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"></span>
            {{ loading ? '注册中...' : '注 册' }}
          </button>
          <p v-if="done" class="text-center text-[13px] font-semibold text-emerald-600 dark:text-emerald-400 mt-3">✅ 注册成功，快去登录吧！</p>
        </form>
      </div>
    </transition>
  </div>
</transition>
`
  };
})(window);
