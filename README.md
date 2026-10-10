# Word Wind · 英语单词学习 + 文章阅读

在原有单文件版 [Word Wind](../word-wind-login/index.html) 的基础上，用 **Vue 3 + Tailwind CSS** 重写并扩展的组件化单页应用。
新增两大功能：**顶部导航栏「📖 阅读」入口** 与 **英语文章阅读页（点击查词弹窗）**。阅读模块可实时获取 Breaking News English 最新新闻，支持 Level 0-6、同级随机换稿和相邻级别回退；同时完整保留原有的登录、背单词、收藏夹、生词本、搜索、夜间模式等能力。

## 快速开始

**方式一（推荐，可获取实时新闻）**：双击 `start.bat`，脚本会启动服务器并自动打开浏览器。也可以手动运行：

```powershell
node server.js
# 然后访问 http://127.0.0.1:8899/
```

服务器负责同源代理 Breaking News English，避免浏览器 CORS 限制。也可以直接双击 `word-wind.standalone.html` 使用内置回退文章；如需实时新闻，请同时运行上面的服务器。

手动更新新闻与词典缓存：

```powershell
npm run crawl
npm run crawl:dict
```

**方式二（仅静态/离线）**：直接双击打开 `index.html` 或 `word-wind.standalone.html`，登录、背单词和内置阅读文章均可使用；实时新闻接口不可用时页面会自动保留内置文章并显示提示。

演示登录：**用户名 ≥ 2 位、密码 ≥ 6 位**，任意输入即可进入。
校验不通过时会**同时**给出三处反馈：输入框红框抖动 + 行内红字提示 + 弹窗提示条，不会出现"点了没反应"。

## 目录结构

```
word-wind-vue/
├─ index.html                     # 应用外壳：加载依赖、挂载 #app、启动
├─ start.bat                     # Windows 双击启动：启动服务器并打开浏览器
├─ server.js                      # 零依赖静态服务器 + Breaking News English 同源代理/解析
├─ word-wind.standalone.html      # 单文件版（由 tools/build-standalone.js 生成）
├─ css/style.css                  # 自定义样式（渐变背景 / 阅读排版 / 可点击单词 / 弹窗动画 / 校验抖动）
├─ data/news-cache.json           # 爬虫生成的最新新闻与各 Level 静态缓存
├─ data/dictionary-cache.json     # 文章词汇词典缓存（释义、音标、词形变化）
├─ vendor/                        # 本地化的第三方库（离线可用）
│  ├─ vue.global.prod.js          #   Vue 3.5.13
│  └─ tailwind.js                 #   Tailwind CSS 3.4.16 Play CDN 构建
├─ js/
│  ├─ tailwind-config.js          # Tailwind 主题定制（cream / ink / brand 色板）
│  ├─ router.js                   # 极简 hash 路由：#/login #/app #/reading
│  ├─ store.js                    # 全局响应式状态 + localStorage 持久化
│  ├─ app.js                      # 入口：注册组件、挂载、快捷键
│  ├─ lib/reading-utils.js        # 分词 / 词形还原 / 查词（纯函数，可单测）
│  ├─ lib/breaking-news.js        # 新闻列表/正文解析、Level 回退、随机选文、前端 API 客户端
│  ├─ lib/dictionary.js           # 静态/在线词典查询、中文翻译与词形分析
│  ├─ data/
│  │  ├─ words.js                 # 原版 7 大词库（26 词，结构不变）
│  │  └─ reading.js               # 阅读文章（305 词）+ 词典（30 词 + 6 词组）
│  └─ components/                 # 12 个组件，见下表
└─ tools/                         # 开发与验证工具（非运行时依赖）
   ├─ verify-data.js              #   数据自检：词数 / 词典覆盖 / 词形还原
   ├─ verify-app.js               #   静态自检：模板闭合、组件注册、store API、Tailwind 类名
   ├─ crawl-breaking-news.js      #   爬取最新新闻与各 Level 正文，生成静态缓存
   ├─ crawl-dictionary.js         #   抓取文章词汇释义、音标、词形、中文翻译
   ├─ build-standalone.js         #   打包单文件版
   ├─ login-test.js               #   注入脚本生成「登录流程自动化测试页」
   ├─ shot.html                   #   截图验证页（可直达某个界面）
   ├─ seed.html                   #   写入登录态后跳转，用于验证单文件版
   └─ shots/                      #   各界面截图
```

## 组件

| 组件 | 职责 |
| --- | --- |
| `LoginView` | 登录页（页面中央仅保留登录表单卡片） |
| `RegisterModal` | 注册弹窗，前端校验 + 模拟提交 |
| `AppTopBar` | 顶部导航栏：Logo / 搜索框 / **📖 阅读入口** / 夜间模式 / 头像 / 退出（主页与阅读页共用） |
| `StudyView` | 背单词主页布局 |
| `LibrarySidebar` | 词库选择、进度、跳转、隐藏释义 |
| `WordCard` | 单词卡：单词、美音/英音朗读、释义、收藏、不会 |
| `MeaningBlock` | 释义区块（翻译 / 例句 / 短语），主页与查词弹窗共用 |
| `WordDetailModal` | 单词详情弹窗（搜索、收藏夹、生词本、阅读查词统一复用） |
| `ListModal` | 通用列表弹窗（收藏夹 / 生词本） |
| `ReadingView` | Breaking News English 阅读页：Level 0-6、随机换稿、回退提示、字号与阅读进度 |
| `ArticleText` | 正文渲染：把每个单词 / 词组包成可点击 `<span>` |
| `ToastHost` | 全局轻提示 |

## 实现要点

**路由**：`js/router.js` 用 hash 路由（`#/login`、`#/app`、`#/reading`），不依赖 history API，`file://` 下也能正常跳转。未登录访问 `#/app`、`#/reading` 会被兜回登录页；勾选「记住我」后刷新直接进入主页。

**新闻爬虫**：`tools/crawl-breaking-news.js` 会读取首页、解析文章列表，再按并发限制逐篇抓取 Level 0-6 的可用版本，最终生成 `data/news-cache.json`。GitHub Actions 每 12 小时执行一次；本地服务器优先提供实时接口，GitHub Pages 则自动回退读取该缓存。

**实时新闻**：`server.js` 先抓取 Breaking News English 首页，解析文章标题、日期、Easier/Harder 类型以及该新闻可用的 Level 链接；用户切换难度或随机换稿时，再按需请求具体文章，避免一次性抓取所有正文。文章页解析标题、发布日期、正文段落和当前 Level；若同一篇新闻没有目标级别，则自动选择距离最近的可用级别并提示。主要接口为 `GET /api/news/list` 与 `GET /api/news/article?url=...&level=0..6`，列表缓存 10 分钟、文章缓存 30 分钟。

**文章词典**：`tools/crawl-dictionary.js` 会从所有已抓取文章中提取词汇，调用 Datamuse / Wiktionary 获取词性、英文释义、音标与词形变化，并调用 MyMemory 补充中文翻译。网页优先读取 `data/dictionary-cache.json`；遇到未缓存词时自动在线查询，因此不再只覆盖演示文章的 30 个重点词。

**点击查词**：`reading-utils.js` 先把段落按词组正则切分（词组优先），再用 `[A-Za-z][A-Za-z'’-]*` 切出单个单词，生成 `{type:'word'|'phrase'|'text', text, key}` token 序列。点击 token 时 `store.lookupInArticle()` 查词典：

1. 精确匹配；
2. 未命中则做轻量词形还原（`habits→habit`、`studies→study`、`running→run`、`refused→refuse`、`steadily→steadly→steadily`、`behaviour→behaviour`）后重试；
3. 仍未命中则自动调用在线词典与中文翻译，并支持浏览器朗读。

已查过的词会在正文中留下淡粉色下划线标记，可一键清除。

**数据持久化**：`localStorage` 键 `ww_unknown` / `ww_favorites` / `ww_theme` / `ww_user`，与旧版保持一致，键格式为 `词库::单词`（阅读页词条用 `reading::单词`），因此同一个单词在不同词库互不干扰。

## 自检

```powershell
node tools/verify-data.js    # 数据：305 词、36 个词条、全部可在正文点到、词形还原正确
node tools/crawl-breaking-news.js --limit=50  # 更新 50 篇新闻的 Level 缓存
node tools/crawl-dictionary.js --limit=1000 --concurrency=8  # 增量更新文章词典
node tools/verify-app.js     # 静态：20 个脚本、12 个组件模板闭合、组件/store API 引用、Tailwind 类名刻度
node tools/build-standalone.js   # 改动源码后重新生成单文件版
node tools/login-test.js         # 生成登录流程测试页（用 ?case=A|B|C 选择场景）
```

`verify-app.js` 在桩 Vue 环境中加载全部脚本，能捕获模板标签不闭合、引用了未注册组件、调用不存在的 store 方法，以及越界的 Tailwind 类名（Tailwind 对非法类名是静默忽略的，很容易漏掉）。

`login-test.js` 会复制单文件版并注入脚本，模拟「填表 → 点登录」的真实点击，输出路由切换结果、可见的错误提示与所有未捕获异常。用无头 Chrome 跑：

```powershell
chrome --headless=new --dump-dom "file:///<绝对路径>/tools/tmp-login-test.html?case=A#/login"
```

## 排查记录

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 点「登录」没反应 | 用户名少于 3 位被校验拦下，只在输入框下显示 12px 小字，容易被忽略 | 用户名门槛放宽到 2 位；校验失败时改为「红框抖动 + 13px ⚠️ 红字 + 弹窗提示条」三重反馈；登录表单保留行内校验和弹窗反馈 |
| 自动填充后仍提示"请输入用户名" | 浏览器 autofill 有时不触发 `input` 事件，`v-model` 停在空值 | 提交前从 DOM 同步一次输入值 |
| 沙箱/预览里改 hash 不生效导致点击无跳转 | 部分预览环境会拦截 `location.hash` 改写 | 路由改为**先直接切视图**，再尽力同步 hash（失败也忽略） |
| 任何未捕获异常都表现为"没反应" | 无全局错误出口 | 监听 `error` / `unhandledrejection`，用提示条显示错误信息 |

## 与旧版的关系

旧版 `../word-wind-login/index.html` 是零依赖单文件实现，仍然保留可用。本目录是它的 Vue 3 + Tailwind 组件化版本：视觉风格、配色、交互与旧版保持一致，词库数据直接从旧版提取（`js/data/words.js`），并新增阅读模块。
