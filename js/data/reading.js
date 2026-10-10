/* ============================================================
 * 阅读模块数据
 *  - ARTICLE      : 演示用英语短文（约 300 词，原创文本，无版权问题）
 *  - READING_DICT : 文章词汇词典（30 个单词 + 6 个词组）
 *  - READING_PHRASES : 需要在文章中被当作「词组」整体点击的键
 *
 * 词典条目结构与 js/data/words.js 完全一致：
 *   { word, us, uk, trans:[[词性, 释义]], sentences:[[英文, 中文]], phrases:[[英文, 中文]] }
 * 因此主页的单词详情弹窗可以原样复用来渲染阅读页的查词结果。
 * ============================================================ */
(function (global) {
  'use strict';

  const ARTICLE = {
    id: 'small-habits',
    title: 'The Quiet Power of Small Habits',
    titleZh: '微小习惯的安静力量',
    level: 'CET4 / 高中',
    minutes: 3,
    tag: '成长 · 效率',
    paragraphs: [
      'Most people believe that success depends on one great decision. In reality, it usually grows out of small habits that we repeat every day. A habit is simply an action we perform so often that it becomes automatic. Because it costs almost no effort, we rarely notice how much it shapes our lives.',
      'Consider reading. Ten pages a day sounds unimportant, yet it adds up to more than fifteen books a year. The same principle applies to language learning. If you review twenty words each morning, your vocabulary will expand steadily, and within a few months you will understand conversations that once seemed impossible.',
      'The difficulty is that progress is invisible at the beginning. We expect immediate results, and when they fail to appear, we abandon the plan. Scientists who study behaviour suggest a different approach: focus on the system rather than the goal. Make the habit so easy that you cannot refuse it. Put your book beside your bed. Keep your word list on the phone.',
      'Environment matters as much as willpower. When a good habit is convenient, it needs less motivation. When a bad habit is inconvenient, it slowly disappears. In the long run, patience and consistency beat sudden enthusiasm. Remember that every expert was once a beginner who refused to quit. Small steps, taken daily, carry you further than a single great leap.',
      'Of course, nobody is perfect. You will miss a day, and that is acceptable. The rule is simple: never miss twice. A broken habit is not a failed life; it is only a signal to begin again. Treat your mistakes with curiosity instead of shame, and they will teach you more than praise ever could.',
      'Start today, with something so small that it feels almost silly. Six months from now, that small thing may quietly change who you are.'
    ]
  };

  /* 词组优先匹配：文章渲染时会先整体识别这些词组，其余按单个单词切分 */
  const READING_PHRASES = [
    'in reality',
    'adds up to',
    'in the long run',
    'instead of',
    'rather than',
    'of course'
  ];

  const READING_DICT = {
    success: {
      word: 'success', us: '/səkˈses/', uk: '/səkˈses/',
      trans: [['n', '成功；成就'], ['n', '成功的人（或事物）']],
      sentences: [['Hard work is the key to success.', '努力是成功的关键。'], ['The party was a great success.', '这次聚会非常成功。']],
      phrases: [['achieve success', '取得成功'], ['a huge success', '巨大的成功']]
    },
    depend: {
      word: 'depend', us: '/dɪˈpend/', uk: '/dɪˈpend/',
      trans: [['v', '取决于；依赖'], ['v', '依靠，指望']],
      sentences: [['Our plan depends on the weather.', '我们的计划取决于天气。'], ['You can always depend on her.', '你总是可以信赖她。']],
      phrases: [['depend on', '取决于；依赖'], ['it depends', '视情况而定']]
    },
    habit: {
      word: 'habit', us: '/ˈhæbɪt/', uk: '/ˈhæbɪt/',
      trans: [['n', '习惯；习性'], ['n', '（容易上瘾的）嗜好']],
      sentences: [['Reading before bed is a good habit.', '睡前阅读是个好习惯。'], ['It is hard to break a habit.', '改掉一个习惯很难。']],
      phrases: [['form a habit', '养成习惯'], ['break a habit', '戒掉习惯'], ['out of habit', '出于习惯']]
    },
    automatic: {
      word: 'automatic', us: '/ˌɔːtəˈmætɪk/', uk: '/ˌɔːtəˈmætɪk/',
      trans: [['adj', '自动的；无意识的'], ['adj', '必然的，当然的']],
      sentences: [['The door is automatic.', '这扇门是自动的。'], ['Breathing is an automatic process.', '呼吸是一个无意识的过程。']],
      phrases: [['automatic response', '自动反应'], ['fully automatic', '全自动的']]
    },
    effort: {
      word: 'effort', us: '/ˈefərt/', uk: '/ˈefət/',
      trans: [['n', '努力；气力'], ['n', '尝试，努力的成果']],
      sentences: [['It takes effort to learn a language well.', '学好一门语言需要付出努力。'], ['She made an effort to smile.', '她努力挤出一个微笑。']],
      phrases: [['make an effort', '作出努力'], ['spare no effort', '不遗余力'], ['a waste of effort', '白费力气']]
    },
    shape: {
      word: 'shape', us: '/ʃeɪp/', uk: '/ʃeɪp/',
      trans: [['v', '塑造；影响……的发展'], ['n', '形状；状态']],
      sentences: [['Early experiences shape our character.', '早期经历塑造我们的性格。'], ['The room is in good shape.', '这个房间状况良好。']],
      phrases: [['shape the future', '塑造未来'], ['in good shape', '状态良好'], ['take shape', '成形']]
    },
    principle: {
      word: 'principle', us: '/ˈprɪnsəpl/', uk: '/ˈprɪnsəpl/',
      trans: [['n', '原则；原理'], ['n', '准则，道德标准']],
      sentences: [['This rule follows a simple principle.', '这条规则遵循一个简单的原理。'], ['He never lies; it is a matter of principle.', '他从不撒谎，这是原则问题。']],
      phrases: [['in principle', '原则上'], ['basic principle', '基本原理'], ['on principle', '出于原则']]
    },
    vocabulary: {
      word: 'vocabulary', us: '/vəˈkæbjəleri/', uk: '/vəˈkæbjələri/',
      trans: [['n', '词汇；词汇量'], ['n', '词汇表']],
      sentences: [['Reading widely builds a large vocabulary.', '广泛阅读能积累大量词汇。'], ['Her vocabulary is surprisingly rich.', '她的词汇量出奇地丰富。']],
      phrases: [['build vocabulary', '积累词汇'], ['basic vocabulary', '基础词汇']]
    },
    expand: {
      word: 'expand', us: '/ɪkˈspænd/', uk: '/ɪkˈspænd/',
      trans: [['v', '扩大；扩展'], ['v', '详述，展开']],
      sentences: [['Metal expands when it is heated.', '金属受热会膨胀。'], ['We plan to expand the team next year.', '我们计划明年扩大团队。']],
      phrases: [['expand into', '扩展为；拓展到'], ['expand on', '详述'], ['expand rapidly', '迅速扩张']]
    },
    steadily: {
      word: 'steadily', us: '/ˈstedəli/', uk: '/ˈstedəli/',
      trans: [['adv', '稳步地；持续地'], ['adv', '镇定地']],
      sentences: [['Her health improved steadily.', '她的健康状况稳步好转。'], ['Prices have risen steadily this year.', '今年物价持续上涨。']],
      phrases: [['grow steadily', '稳步增长'], ['work steadily', '踏实工作']]
    },
    invisible: {
      word: 'invisible', us: '/ɪnˈvɪzəbl/', uk: '/ɪnˈvɪzəbl/',
      trans: [['adj', '看不见的；无形的'], ['adj', '被忽视的']],
      sentences: [['Air is invisible but essential.', '空气看不见，却必不可少。'], ['Progress is often invisible at first.', '进步起初往往是无形的。']],
      phrases: [['invisible to the eye', '肉眼看不见的'], ['invisible hand', '看不见的手']]
    },
    abandon: {
      word: 'abandon', us: '/əˈbændən/', uk: '/əˈbændən/',
      trans: [['v', '放弃；抛弃'], ['n', '放任；狂热']],
      sentences: [['He abandoned his car in the snow.', '他把车丢在了雪地里。'], ['Never abandon your plan too early.', '不要过早放弃你的计划。']],
      phrases: [['abandon oneself to', '沉溺于'], ['abandon ship', '弃船'], ['with abandon', '放纵地']]
    },
    approach: {
      word: 'approach', us: '/əˈproʊtʃ/', uk: '/əˈprəʊtʃ/',
      trans: [['n', '方法；途径'], ['v', '接近；着手处理']],
      sentences: [['We need a different approach.', '我们需要一种不同的方法。'], ['Winter is approaching.', '冬天即将来临。']],
      phrases: [['a new approach to', '……的新方法'], ['approach a problem', '着手处理问题']]
    },
    system: {
      word: 'system', us: '/ˈsɪstəm/', uk: '/ˈsɪstəm/',
      trans: [['n', '系统；体系'], ['n', '制度；方法']],
      sentences: [['The education system needs reform.', '教育制度需要改革。'], ['A good system beats a good goal.', '好的体系胜过好的目标。']],
      phrases: [['operating system', '操作系统'], ['a system of rules', '一套规则体系']]
    },
    behaviour: {
      word: 'behaviour', us: '/bɪˈheɪvjər/', uk: '/bɪˈheɪvjə/',
      trans: [['n', '行为；举止'], ['n', '（事物的）活动方式']],
      sentences: [['His behaviour surprised everyone.', '他的行为让所有人吃惊。'], ['Scientists study animal behaviour.', '科学家研究动物行为。']],
      phrases: [['good behaviour', '良好行为'], ['human behaviour', '人类行为']]
    },
    refuse: {
      word: 'refuse', us: '/rɪˈfjuːz/', uk: '/rɪˈfjuːz/',
      trans: [['v', '拒绝；回绝'], ['n', '废物，垃圾（读 /ˈrefjuːs/）']],
      sentences: [['She refused to answer the question.', '她拒绝回答这个问题。'], ['He never refuses to help a friend.', '他从不会拒绝帮助朋友。']],
      phrases: [['refuse to do sth.', '拒绝做某事'], ['flatly refuse', '断然拒绝']]
    },
    environment: {
      word: 'environment', us: '/ɪnˈvaɪrənmənt/', uk: '/ɪnˈvaɪrənmənt/',
      trans: [['n', '环境；周围状况'], ['n', '自然环境']],
      sentences: [['A quiet environment helps you focus.', '安静的环境有助于专注。'], ['We must protect the environment.', '我们必须保护环境。']],
      phrases: [['natural environment', '自然环境'], ['working environment', '工作环境']]
    },
    willpower: {
      word: 'willpower', us: '/ˈwɪlpaʊər/', uk: '/ˈwɪlpaʊə/',
      trans: [['n', '意志力；自制力']],
      sentences: [['Willpower alone is not enough.', '仅靠意志力是不够的。'], ['He used all his willpower to finish the race.', '他用尽全部意志力跑完了比赛。']],
      phrases: [['lack willpower', '缺乏意志力'], ['sheer willpower', '纯粹的意志力']]
    },
    convenient: {
      word: 'convenient', us: '/kənˈviːniənt/', uk: '/kənˈviːniənt/',
      trans: [['adj', '方便的；便利的'], ['adj', '合适的，近便的']],
      sentences: [['Online shopping is very convenient.', '网上购物非常方便。'], ['Would Monday be convenient for you?', '周一对你方便吗？']],
      phrases: [['convenient for', '对……方便'], ['at a convenient time', '在方便的时候']]
    },
    motivation: {
      word: 'motivation', us: '/ˌmoʊtɪˈveɪʃn/', uk: '/ˌməʊtɪˈveɪʃn/',
      trans: [['n', '动力；积极性'], ['n', '动机，原因']],
      sentences: [['Clear goals give us motivation.', '明确的目标给我们动力。'], ['Money was not his main motivation.', '金钱不是他的主要动机。']],
      phrases: [['lack of motivation', '缺乏动力'], ['inner motivation', '内在动机']]
    },
    patience: {
      word: 'patience', us: '/ˈpeɪʃns/', uk: '/ˈpeɪʃns/',
      trans: [['n', '耐心；忍耐力']],
      sentences: [['Learning a language requires patience.', '学一门语言需要耐心。'], ['My patience finally ran out.', '我终于失去了耐心。']],
      phrases: [['lose patience', '失去耐心'], ['with patience', '耐心地']]
    },
    consistency: {
      word: 'consistency', us: '/kənˈsɪstənsi/', uk: '/kənˈsɪstənsi/',
      trans: [['n', '连贯性；一致性'], ['n', '（努力的）持之以恒']],
      sentences: [['Consistency matters more than speed.', '持之以恒比速度更重要。'], ['There is no consistency between his words and actions.', '他的言行不一致。']],
      phrases: [['consistency of quality', '质量的稳定性'], ['with consistency', '一贯地']]
    },
    enthusiasm: {
      word: 'enthusiasm', us: '/ɪnˈθuːziæzəm/', uk: '/ɪnˈθjuːziæzəm/',
      trans: [['n', '热情；热忱'], ['n', '热衷的事物']],
      sentences: [['She talked about the project with enthusiasm.', '她满怀热情地谈论这个项目。'], ['His enthusiasm soon disappeared.', '他的热情很快就消失了。']],
      phrases: [['full of enthusiasm', '充满热情'], ['arouse enthusiasm', '激起热情']]
    },
    expert: {
      word: 'expert', us: '/ˈekspɜːrt/', uk: '/ˈekspɜːt/',
      trans: [['n', '专家；行家'], ['adj', '熟练的；专家的']],
      sentences: [['She is an expert in child psychology.', '她是儿童心理学专家。'], ['We need expert advice.', '我们需要专业建议。']],
      phrases: [['an expert in / at', '……方面的专家'], ['expert knowledge', '专业知识']]
    },
    quit: {
      word: 'quit', us: '/kwɪt/', uk: '/kwɪt/',
      trans: [['v', '停止；放弃；辞职'], ['n', '辞职；退出']],
      sentences: [['He quit smoking last year.', '他去年戒了烟。'], ['Do not quit when it gets hard.', '遇到困难时不要放弃。']],
      phrases: [['quit doing sth.', '停止做某事'], ['quit one\u2019s job', '辞职']]
    },
    signal: {
      word: 'signal', us: '/ˈsɪɡnəl/', uk: '/ˈsɪɡnəl/',
      trans: [['n', '信号；暗号'], ['v', '发信号；表明']],
      sentences: [['The phone signal is weak here.', '这里手机信号很弱。'], ['The result signals a big change.', '这一结果预示着重大变化。']],
      phrases: [['signal to sb.', '向某人发信号'], ['a warning signal', '警告信号']]
    },
    curiosity: {
      word: 'curiosity', us: '/ˌkjʊriˈɑːsəti/', uk: '/ˌkjʊəriˈɒsəti/',
      trans: [['n', '好奇心；求知欲'], ['n', '奇特的物（或人）']],
      sentences: [['Curiosity drives children to explore.', '好奇心驱使孩子去探索。'], ['I opened the box out of curiosity.', '我出于好奇打开了盒子。']],
      phrases: [['out of curiosity', '出于好奇'], ['arouse curiosity', '引起好奇']]
    },
    shame: {
      word: 'shame', us: '/ʃeɪm/', uk: '/ʃeɪm/',
      trans: [['n', '羞愧；羞耻'], ['v', '使羞愧；使蒙羞']],
      sentences: [['He felt no shame about his mistake.', '他对自己的错误毫不羞愧。'], ['There is no shame in asking for help.', '寻求帮助并不丢人。']],
      phrases: [['a sense of shame', '羞耻感'], ['what a shame', '真遗憾']]
    },
    praise: {
      word: 'praise', us: '/preɪz/', uk: '/preɪz/',
      trans: [['n', '赞扬；称赞'], ['v', '表扬；赞美']],
      sentences: [['Her teacher praised her progress.', '老师表扬了她的进步。'], ['Praise works better than blame.', '表扬比责备更有效。']],
      phrases: [['praise sb. for sth.', '因某事表扬某人'], ['high praise', '高度赞扬']]
    },
    immediate: {
      word: 'immediate', us: '/ɪˈmiːdiət/', uk: '/ɪˈmiːdiət/',
      trans: [['adj', '立即的；直接的'], ['adj', '最接近的，紧邻的']],
      sentences: [['The medicine had an immediate effect.', '这种药立刻见效。'], ['We need an immediate answer.', '我们需要立即答复。']],
      phrases: [['immediate effect', '即时效果'], ['in the immediate future', '在最近的将来']]
    },

    /* ---------- 词组 ---------- */
    'in reality': {
      word: 'in reality', type: 'phrase', us: '', uk: '',
      trans: [['phr', '事实上；实际上']],
      sentences: [['In reality, the problem is much simpler.', '事实上，这个问题要简单得多。']],
      phrases: []
    },
    'adds up to': {
      word: 'adds up to', type: 'phrase', us: '', uk: '',
      trans: [['phr', '总计达；（积少成多）变成'], ['phr', '意味着，等同于']],
      sentences: [['Ten minutes a day adds up to sixty hours a year.', '每天十分钟，一年就是六十小时。'], ['All this adds up to one conclusion.', '这一切都指向一个结论。']],
      phrases: [['add up', '加起来；说得通'], ['add up to nothing', '毫无结果']]
    },
    'in the long run': {
      word: 'in the long run', type: 'phrase', us: '', uk: '',
      trans: [['phr', '从长远来看；最终']],
      sentences: [['In the long run, honesty pays.', '从长远来看，诚实是有回报的。'], ['Cheap shoes cost more in the long run.', '便宜的鞋子最终反而更费钱。']],
      phrases: []
    },
    'instead of': {
      word: 'instead of', type: 'phrase', us: '', uk: '',
      trans: [['phr', '代替；而不是']],
      sentences: [['Walk instead of taking the bus.', '走路去吧，别坐公交了。'], ['He chose tea instead of coffee.', '他要了茶而不是咖啡。']],
      phrases: []
    },
    'rather than': {
      word: 'rather than', type: 'phrase', us: '', uk: '',
      trans: [['phr', '而不是；与其……（不如）']],
      sentences: [['Focus on the system rather than the goal.', '关注体系，而不是目标。'], ['She smiled rather than answered.', '她笑了笑，没有回答。']],
      phrases: []
    },
    'of course': {
      word: 'of course', type: 'phrase', us: '', uk: '',
      trans: [['phr', '当然；当然可以']],
      sentences: [['Of course, nobody is perfect.', '当然，没有人是完美的。'], ['\u201cCan I help?\u201d \u201cOf course!\u201d', '“我能帮忙吗？”“当然！”']],
      phrases: []
    }
  };

  global.WW = global.WW || {};
  global.WW.ARTICLE = ARTICLE;
  global.WW.READING_DICT = READING_DICT;
  global.WW.READING_PHRASES = READING_PHRASES;
})(typeof window !== 'undefined' ? window : globalThis);
