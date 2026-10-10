/* ============================================================
 * LoginView · 登录页（仅保留登录栏）
 * 说明：演示页面，用户名 ≥2、密码 ≥6 即可登录，不校验真实账号
 * ============================================================ */
(function (global) {
  'use strict';
  const WW = global.WW = global.WW || {};
  WW.components = WW.components || {};
  const { ref } = global.Vue;

  WW.components.LoginView = {
    name: 'LoginView',
    setup() {
      const store = WW.store;
      const user = ref('');
      const pwd = ref('');
      const showPwd = ref(false);
      const remember = ref(false);
      const loading = ref(false);
      const errors = ref({ user: '', pwd: '' });
      const shakeUser = ref(false);
      const shakePwd = ref(false);

      function shake(which) {
        const r = which === 'user' ? shakeUser : shakePwd;
        r.value = false;
        requestAnimationFrame(() => {
          r.value = true;
          setTimeout(() => { r.value = false; }, 600);
        });
      }

      /* 浏览器自动填充（autofill）有时不会触发 input 事件，
         会让 v-model 停在旧值，提交前从 DOM 同步一次，避免"明明填了却说没填" */
      function syncFromDom() {
        const u = document.getElementById('username');
        const p = document.getElementById('password');
        if (u && u.value !== user.value) user.value = u.value;
        if (p && p.value !== pwd.value) pwd.value = p.value;
      }

      /* 校验：notify=true 时用弹窗提示把错误"喊出来"，避免看起来像点击没反应 */
      function validate(notify) {
        if (notify) syncFromDom();
        const e = { user: '', pwd: '' };
        const u = user.value.trim();
        if (!u) e.user = '请输入用户名';
        else if (u.length < 2) e.user = '用户名至少 2 个字符';
        if (!pwd.value) e.pwd = '请输入密码';
        else if (pwd.value.length < 6) e.pwd = '密码至少 6 位';
        errors.value = e;
        const first = e.user || e.pwd;
        if (first) {
          shake(e.user ? 'user' : 'pwd');
          if (notify) store.toast('⚠️ ' + first, 2400);
        }
        return !first;
      }

      async function submit() {
        syncFromDom();
        if (!validate(true)) return;
        loading.value = true;
        await new Promise((r) => setTimeout(r, 900));   // 模拟请求
        loading.value = false;
        store.login(user.value.trim(), remember.value);
        store.toast('登录成功，欢迎回来！', 1500);
      }

      function forgot() {
        store.toast('演示页面：请输入任意用户名（≥2 位）和密码（≥6 位）直接登录', 2600);
      }

      return { store, user, pwd, showPwd, remember, loading, errors, shakeUser, shakePwd, submit, forgot, validate };
    },
    template: `
<div class="min-h-screen grid place-items-center px-5 py-10">
  <section class="w-full max-w-[430px] rounded-[24px] px-6 sm:px-10 pt-10 pb-8 ww-card">
    <h1 class="text-center text-[26px] font-extrabold text-[#2f3b4a] dark:text-slate-50 mb-7">登录</h1>

    <form @submit.prevent="submit" novalidate>
      <div class="mb-4">
        <label for="username" class="block text-[13px] font-semibold text-ink-600 dark:text-slate-300 mb-1.5">用户名</label>
        <div :class="[errors.user ? 'border-red-400 ring-4 ring-red-400/15' : 'border-cream-300 dark:border-slate-700 focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-blue/15', shakeUser ? 'ww-shake' : '']"
             class="flex items-center gap-2 px-3 rounded-xl bg-cream-50 dark:bg-slate-800 border transition">
          <span class="text-[15px] opacity-80">👤</span>
          <input id="username" v-model="user" type="text" placeholder="请输入用户名（2 位以上）" autocomplete="username"
                 @blur="validate(false)"
                 class="flex-1 bg-transparent border-none outline-none py-3 text-[15px] text-ink dark:text-slate-100 placeholder:text-ink-400 dark:placeholder:text-slate-500" />
        </div>
        <p class="text-[13px] font-semibold text-red-500 mt-1.5 min-h-[18px]">{{ errors.user ? '⚠️ ' + errors.user : '' }}</p>
      </div>

      <div class="mb-2">
        <label for="password" class="block text-[13px] font-semibold text-ink-600 dark:text-slate-300 mb-1.5">密码</label>
        <div :class="[errors.pwd ? 'border-red-400 ring-4 ring-red-400/15' : 'border-cream-300 dark:border-slate-700 focus-within:border-brand-blue focus-within:ring-4 focus-within:ring-brand-blue/15', shakePwd ? 'ww-shake' : '']"
             class="flex items-center gap-2 px-3 rounded-xl bg-cream-50 dark:bg-slate-800 border transition">
          <span class="text-[15px] opacity-80">🔒</span>
          <input id="password" v-model="pwd" :type="showPwd ? 'text' : 'password'" placeholder="请输入密码（6 位以上）" autocomplete="current-password"
                 @blur="validate(false)"
                 class="flex-1 bg-transparent border-none outline-none py-3 text-[15px] text-ink dark:text-slate-100 placeholder:text-ink-400 dark:placeholder:text-slate-500" />
          <button type="button" @click="showPwd = !showPwd" class="text-[15px] opacity-70 hover:opacity-100">{{ showPwd ? '🙈' : '👁️' }}</button>
        </div>
        <p class="text-[13px] font-semibold text-red-500 mt-1.5 min-h-[18px]">{{ errors.pwd ? '⚠️ ' + errors.pwd : '' }}</p>
      </div>

      <div class="flex items-center justify-between my-5 text-[13px]">
        <label class="flex items-center gap-2 cursor-pointer text-ink-600 dark:text-slate-300">
          <input v-model="remember" type="checkbox" class="w-4 h-4 accent-brand-blue cursor-pointer" />
          <span>记住我</span>
        </label>
        <button type="button" @click="forgot" class="font-semibold text-brand-bluedeep hover:underline">忘记密码？</button>
      </div>

      <button id="loginBtn" type="submit" :disabled="loading"
              class="w-full py-3.5 rounded-xl text-[15px] font-bold tracking-[3px] text-white
                     bg-gradient-to-br from-brand-blue2 to-brand-blue shadow-lg shadow-brand-blue/30
                     flex items-center justify-center gap-2 transition
                     hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
        <span v-if="loading" class="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin"></span>
        {{ loading ? '登录中...' : '登 录' }}
      </button>
    </form>
  </section>
</div>
`
  };
})(window);