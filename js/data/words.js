/* ============================================================
 * 词库数据（沿用原 Word Wind 的 7 大词库）
 * 结构与原版一致：{ word, us, uk, trans[][], sentences[][], phrases[][] }
 * ============================================================ */
(function (global) {
  'use strict';
  const LIBRARIES = {
  chuzhong: { label: '初中', words: [
    { word:'apple', us:'/ˈæpl/', uk:'/ˈæpl/',
      trans:[['n','苹果；苹果树'],['n','宝贝，珍爱之物']],
      sentences:[['I eat an apple every morning.','我每天早上吃一个苹果。'],['She is the apple of her father\'s eye.','她是她父亲的掌上明珠。']],
      phrases:[['apple pie','苹果派'],['the apple of one\'s eye','掌上明珠'],['Adam\'s apple','喉结']] },
    { word:'beautiful', us:'/ˈbjuːtɪfl/', uk:'/ˈbjuːtɪfl/',
      trans:[['adj','美丽的；漂亮的'],['adj','出色的；令人愉快的']],
      sentences:[['What a beautiful girl she is!','她真是个漂亮的女孩！'],['It was a beautiful sunny day.','那是个阳光明媚的好日子。']],
      phrases:[['beautiful scenery','美丽的风景'],['beautifully designed','设计精美的']] },
    { word:'computer', us:'/kəmˈpjuːtər/', uk:'/kəmˈpjuːtə(r)/',
      trans:[['n','计算机；电脑']],
      sentences:[['He spends hours on the computer every day.','他每天在电脑上花好几个小时。'],['My computer broke down yesterday.','我的电脑昨天坏了。']],
      phrases:[['computer science','计算机科学'],['personal computer','个人电脑'],['computer game','电脑游戏']] }
  ]},
  gaozhong: { label: '高中', words: [
    { word:'achieve', us:'/əˈtʃiːv/', uk:'/əˈtʃiːv/',
      trans:[['v','达到；完成；实现'],['v','取得（成功）']],
      sentences:[['She achieved her goal of becoming a doctor.','她实现了当医生的目标。'],['Hard work helps us achieve success.','努力工作帮助我们取得成功。']],
      phrases:[['achieve a goal','实现目标'],['achieve success','取得成功'],['achieve one\'s dream','实现梦想']] },
    { word:'challenge', us:'/ˈtʃælɪndʒ/', uk:'/ˈtʃælɪndʒ/',
      trans:[['n','挑战；难题'],['v','向……挑战；质疑']],
      sentences:[['Learning a new language is a real challenge.','学一门新语言是个真正的挑战。'],['He challenged me to a game of chess.','他向我挑战下一盘棋。']],
      phrases:[['face a challenge','面对挑战'],['meet the challenge','迎接挑战'],['pose a challenge','构成挑战']] },
    { word:'confidence', us:'/ˈkɑːnfɪdəns/', uk:'/ˈkɒnfɪdəns/',
      trans:[['n','信心；自信'],['n','信任；信赖']],
      sentences:[['She answered the question with confidence.','她自信地回答了这个问题。'],['I have great confidence in you.','我对你非常有信心。']],
      phrases:[['self-confidence','自信心'],['have confidence in','对……有信心'],['gain confidence','获得信心']] }
  ]},
  cet4: { label: 'CET4', words: [
    { word:'access', us:'/ˈækses/', uk:'/ˈækses/',
      trans:[['v','获取；访问；接近'],['n','接近；入口；使用权']],
      sentences:[['Users can access their voice mail remotely.','用户可以远程获取语音邮件。'],['Access to the papers is restricted to senior management.','只有高级管理层才有权查阅这些文件。']],
      phrases:[['access control','访问控制'],['have access to','使用；接近；可以利用'],['internet access','互联网接入'],['easy access','便于接近；容易获取'],['market access','市场准入'],['remote access','远程访问']] },
    { word:'abandon', us:'/əˈbændən/', uk:'/əˈbændən/',
      trans:[['v','放弃；抛弃；遗弃'],['n','放任；狂热']],
      sentences:[['He abandoned his car in the snow.','他把车丢在了雪地里。'],['Don\'t abandon your dream so easily.','不要这么轻易放弃你的梦想。']],
      phrases:[['abandon oneself to','沉溺于'],['abandon ship','弃船'],['with abandon','放纵地；尽兴地']] },
    { word:'ability', us:'/əˈbɪləti/', uk:'/əˈbɪləti/',
      trans:[['n','能力；才能；本领']],
      sentences:[['She has the ability to solve difficult problems.','她有解决难题的能力。'],['He showed great musical ability as a child.','他小时候就展现出很高的音乐才能。']],
      phrases:[['the ability to do sth.','做某事的能力'],['natural ability','天赋'],['to the best of one\'s ability','竭尽全力']] },
    { word:'absolute', us:'/ˈæbsəluːt/', uk:'/ˈæbsəluːt/',
      trans:[['adj','绝对的；完全的；专制的'],['n','绝对；绝对事物']],
      sentences:[['There is no absolute standard for beauty.','美没有绝对的标准。'],['She has absolute confidence in her team.','她对团队有绝对的信心。']],
      phrases:[['absolute majority','绝对多数'],['absolute zero','绝对零度'],['absolute truth','绝对真理']] },
    { word:'absorb', us:'/əbˈzɔːrb/', uk:'/əbˈzɔːb/',
      trans:[['v','吸收；理解；使专心'],['v','减轻（冲击）']],
      sentences:[['Plants absorb carbon dioxide from the air.','植物从空气中吸收二氧化碳。'],['He was completely absorbed in his book.','他完全沉浸在书里。']],
      phrases:[['be absorbed in','专心于；全神贯注于'],['absorb knowledge','吸收知识'],['absorb the shock','减轻冲击']] },
    { word:'abstract', us:'/ˈæbstrækt/', uk:'/ˈæbstrækt/',
      trans:[['adj','抽象的；深奥的'],['n','摘要；抽象派作品'],['v','提取；抽象化']],
      sentences:[['Beauty is an abstract concept.','美是一个抽象的概念。'],['Please write an abstract of the paper.','请写一份论文摘要。']],
      phrases:[['abstract art','抽象艺术'],['in the abstract','抽象地'],['abstract from','从……中提取']] },
    { word:'academic', us:'/ˌækəˈdemɪk/', uk:'/ˌækəˈdemɪk/',
      trans:[['adj','学术的；学院的；理论的'],['n','大学教师；学者']],
      sentences:[['She has a strong academic background.','她有很强的学术背景。'],['Academic performance is not everything.','学业成绩并不是一切。']],
      phrases:[['academic year','学年'],['academic performance','学业成绩'],['academic research','学术研究']] },
    { word:'accent', us:'/ˈæksent/', uk:'/ˈæksent/',
      trans:[['n','口音；重音；强调'],['v','强调；重读']],
      sentences:[['She spoke English with a French accent.','她讲英语带有法国口音。'],['The accent falls on the first syllable.','重音落在第一个音节上。']],
      phrases:[['with an accent','带有口音'],['foreign accent','外国口音'],['put an accent on','强调']] }
  ]},
  cet6: { label: 'CET6', words: [
    { word:'ambiguous', us:'/æmˈbɪɡjuəs/', uk:'/æmˈbɪɡjuəs/',
      trans:[['adj','模棱两可的；含糊不清的']],
      sentences:[['His reply was deliberately ambiguous.','他的回答故意含糊其辞。'],['The wording of the agreement is ambiguous.','协议措辞含糊不清。']],
      phrases:[['ambiguous statement','含糊的陈述'],['remain ambiguous','依然不明确']] },
    { word:'compensate', us:'/ˈkɑːmpenseɪt/', uk:'/ˈkɒmpenseɪt/',
      trans:[['v','补偿；赔偿'],['v','弥补；抵消']],
      sentences:[['The company compensated him for his loss.','公司赔偿了他的损失。'],['Nothing can compensate for the loss of time.','失去的时间是无法弥补的。']],
      phrases:[['compensate for','弥补；补偿'],['compensate sb. for sth.','就某事赔偿某人']] },
    { word:'deteriorate', us:'/dɪˈtɪriəreɪt/', uk:'/dɪˈtɪəriəreɪt/',
      trans:[['v','恶化；变坏；退化']],
      sentences:[['His health began to deteriorate rapidly.','他的健康状况开始迅速恶化。'],['Relations between the two countries deteriorated.','两国关系恶化了。']],
      phrases:[['deteriorate rapidly','迅速恶化'],['deteriorating situation','不断恶化的局势']] }
  ]},
  kaoyan: { label: '考研', words: [
    { word:'hypothesis', us:'/haɪˈpɑːθəsɪs/', uk:'/haɪˈpɒθəsɪs/',
      trans:[['n','假设；假说；前提']],
      sentences:[['The results support our hypothesis.','结果支持我们的假设。'],['Let us test this hypothesis.','让我们来验证这个假说。']],
      phrases:[['test a hypothesis','验证假设'],['form a hypothesis','提出假设'],['working hypothesis','作业假说']] },
    { word:'inevitable', us:'/ɪnˈevɪtəbl/', uk:'/ɪnˈevɪtəbl/',
      trans:[['adj','不可避免的；必然发生的']],
      sentences:[['Change is inevitable in life.','生活中变化是不可避免的。'],['It was an inevitable result of his actions.','这是他行为的必然结果。']],
      phrases:[['inevitable outcome','必然结果'],['it is inevitable that...','……是不可避免的']] },
    { word:'phenomenon', us:'/fəˈnɑːmɪnən/', uk:'/fəˈnɒmɪnən/',
      trans:[['n','现象；非凡的人（或事物）']],
      sentences:[['This is a common social phenomenon.','这是一个常见的社会现象。'],['The phenomenon puzzled scientists.','这一现象使科学家们困惑不解。']],
      phrases:[['natural phenomenon','自然现象'],['social phenomenon','社会现象'],['common phenomenon','普遍现象']] }
  ]},
  toefl: { label: '托福', words: [
    { word:'accelerate', us:'/əkˈseləreɪt/', uk:'/əkˈseləreɪt/',
      trans:[['v','加速；促进'],['v','（使）加快发生']],
      sentences:[['The car accelerated smoothly.','汽车平稳地加速。'],['Economic growth has accelerated recently.','经济增长最近加快了。']],
      phrases:[['accelerate growth','促进增长'],['accelerate the process','加快进程']] },
    { word:'biodiversity', us:'/ˌbaɪoʊdaɪˈvɜːrsəti/', uk:'/ˌbaɪəʊdaɪˈvɜːsəti/',
      trans:[['n','生物多样性']],
      sentences:[['The rainforest is famous for its biodiversity.','这片雨林以生物多样性闻名。'],['Human activity threatens biodiversity.','人类活动威胁着生物多样性。']],
      phrases:[['biodiversity loss','生物多样性丧失'],['protect biodiversity','保护生物多样性']] },
    { word:'cumulative', us:'/ˈkjuːmjəleɪtɪv/', uk:'/ˈkjuːmjələtɪv/',
      trans:[['adj','累积的；渐增的']],
      sentences:[['The cumulative effect is enormous.','累积效应是巨大的。'],['Learning is a cumulative process.','学习是一个日积月累的过程。']],
      phrases:[['cumulative effect','累积效应'],['cumulative knowledge','累积的知识']] }
  ]},
  sat: { label: 'SAT', words: [
    { word:'aberration', us:'/ˌæbəˈreɪʃn/', uk:'/ˌæbəˈreɪʃn/',
      trans:[['n','反常现象；偏差；过失']],
      sentences:[['The delay was an aberration, not the norm.','这次延误是个例外，并不正常。'],['Such behavior is an aberration for him.','这种行为对他来说很反常。']],
      phrases:[['a temporary aberration','暂时的反常'],['chromatic aberration','色差']] },
    { word:'benevolent', us:'/bəˈnevələnt/', uk:'/bɪˈnevələnt/',
      trans:[['adj','仁慈的；慈善的；善意的']],
      sentences:[['The benevolent old man helped everyone.','那位仁慈的老人帮助了每个人。'],['She gave him a benevolent smile.','她向他投以善意的微笑。']],
      phrases:[['benevolent smile','善意的微笑'],['benevolent fund','慈善基金']] },
    { word:'candid', us:'/ˈkændɪd/', uk:'/ˈkændɪd/',
      trans:[['adj','坦率的；直言不讳的'],['adj','（照片）偷拍的']],
      sentences:[['She gave a candid account of the events.','她坦率地叙述了事情的经过。'],['To be candid, I don\'t like the plan.','坦率地说，我不喜欢这个计划。']],
      phrases:[['to be candid','坦率地说'],['candid camera','偷拍镜头'],['candid opinion','直率的意见']] }
  ]}
  };
  global.WW = global.WW || {};
  global.WW.LIBRARIES = LIBRARIES;
})(typeof window !== 'undefined' ? window : globalThis);