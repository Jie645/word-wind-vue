/* ============================================================
 * ArticleText · 文章正文渲染
 *   把每个英文单词包成 <span class="rd-word">，词组包成 <span class="rd-phrase">
 *   悬浮变色 + 下划线提示可点击，点击后向上抛出 lookup 事件
 * ============================================================ */
(function (global) {
  'use strict';
  const WW = global.WW = global.WW || {};
  WW.components = WW.components || {};

  WW.components.ArticleText = {
    name: 'ArticleText',
    props: {
      tokens: { type: Array, required: true },   // [[token, ...], ...] 每段一个数组
      seen: { type: Array, default: () => [] },  // 已查过的词
      fontSize: { type: String, default: 'md' }
    },
    emits: ['lookup'],
    setup() { return { store: WW.store }; },
    template: `
<div class="article-body" :class="{ 'font-sm': fontSize === 'sm', 'font-lg': fontSize === 'lg' }">
  <p v-for="(para, pi) in tokens" :key="'p' + pi" class="article-para">
    <template v-for="(t, ti) in para" :key="pi + '-' + ti">
      <span v-if="t.type === 'word'"
            class="rd-word"
            :class="{ 'is-seen': seen.indexOf(t.key) > -1 }"
            role="button" tabindex="0"
            :title="'点击查看 ' + t.text + ' 的释义'"
            @click="$emit('lookup', t)"
            @keydown.enter.prevent="$emit('lookup', t)"
            @keydown.space.prevent="$emit('lookup', t)">{{ t.text }}</span>
      <span v-else-if="t.type === 'phrase'"
            class="rd-phrase"
            role="button" tabindex="0"
            :title="'点击查看词组 ' + t.text + ' 的释义'"
            @click="$emit('lookup', t)"
            @keydown.enter.prevent="$emit('lookup', t)"
            @keydown.space.prevent="$emit('lookup', t)">{{ t.text }}</span>
      <template v-else>{{ t.text }}</template>
    </template>
  </p>
</div>
`
  };
})(window);
