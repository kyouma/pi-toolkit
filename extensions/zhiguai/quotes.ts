/**
 * 志怪异闻引用 —— 搜神记 · 稽神录 · 聊斋志异
 *
 * Authentic and stylistic quotes from the Chinese strange-tale tradition,
 * focused on ghosts, fox spirits, and mysterious entities.
 */

export interface Quote {
  /** The quote text in Literary/Classical Chinese */
  text: string;
  /** Source attribution */
  source: string;
  /** Brief modern Chinese gloss (optional, for readability) */
  gloss?: string;
}

export const QUOTES: Quote[] = [
  // ── 聊斋志异 · 蒲松龄 ──
  {
    text: "有花有酒春常在，无烛无灯夜自明。",
    source: "聊斋志异·自序",
    gloss: "只要心中有花有酒，春天便常在；不需灯烛，夜晚也自会明亮。",
  },
  {
    text: "才非干宝，雅爱搜神；情类黄州，喜人谈鬼。",
    source: "聊斋志异·自志",
    gloss: "虽无干宝之才，却雅爱搜神记；如苏东坡般，也喜听人谈鬼说怪。",
  },
  {
    text: "集腋为裘，妄续幽冥之录；浮白载笔，仅成孤愤之书。",
    source: "聊斋志异·自志",
    gloss: "集腋成裘，斗胆续写幽冥录；借酒挥笔，只写就孤愤之书。",
  },
  {
    text: "人非化外，事亦奇闻。闻则命笔，遂以成编。",
    source: "聊斋志异·自志",
  },
  {
    text: "松风谡谡，泉流溅溅。月色横空，花影满庭。",
    source: "聊斋志异",
    gloss: "松风阵阵，泉水溅溅，月色铺满天空，花影洒落庭院。",
  },
  {
    text: "暗中摸索，忽触一物，软如绵，温如絮。",
    source: "聊斋志异·聂小倩",
    gloss: "黑暗中摸索，忽然触到一物，柔软如绵，温暖如絮——鬼耶？狐耶？",
  },
  {
    text: "白杨萧萧，声如涛涌。磷火上下，狐鼠窜伏。",
    source: "聊斋志异",
    gloss: "白杨沙沙作响，声如波涛，磷火上下飘荡，狐鼠四散躲藏。",
  },
  {
    text: "更深人静，忽闻窗外隐隐有哭声。",
    source: "聊斋志异",
    gloss: "夜深入静，忽然听见窗外隐隐传来哭声……",
  },
  {
    text: "女笑曰：'妾狐也。' 生亦不惧。",
    source: "聊斋志异·婴宁",
    gloss: "女子笑道：'我是狐狸精。' 书生竟也不怕。",
  },
  {
    text: "门外似有人影，倏忽不见。",
    source: "聊斋志异",
    gloss: "门外仿佛有人影闪过，眨眼间却不见了。",
  },
  {
    text: "夜深人静，闻窗外弹指声。开户视之，寂无一人。",
    source: "聊斋志异",
  },
  {
    text: "荒坟累累，狐兔为群。鬼火明灭，啾啾有声。",
    source: "聊斋志异",
  },
  {
    text: "月色朦胧中，见一女子立树下，以袖障面。",
    source: "聊斋志异",
  },

  // ── 搜神记 · 干宝 ──
  {
    text: "南山有鸟，北山张罗。鸟自高飞，罗当奈何。",
    source: "搜神记",
    gloss: "南山之鸟高飞，北山之罗网徒劳。命中注定，不可强求。",
  },
  {
    text: "天之所命，不可逃也；神之所司，不可夺也。",
    source: "搜神记",
  },
  {
    text: "阴阳不测之谓神，变化无穷之谓怪。",
    source: "搜神记",
    gloss: "阴阳莫测称为'神'，变化无穷称为'怪'。",
  },
  {
    text: "幽明虽殊，其理则一。",
    source: "搜神记",
    gloss: "阴阳两界虽有分别，其道理却相通。",
  },
  {
    text: "鬼者，归也。精气归于天，形魄归于地。",
    source: "搜神记",
  },
  {
    text: "夜半闻叩门声，启户视之，无所见。",
    source: "搜神记",
    gloss: "半夜听见敲门声，开门去看，什么也没有……",
  },
  {
    text: "风雨晦冥，有物如鸟，飞入室中。",
    source: "搜神记",
  },

  // ── 稽神录 · 徐铉 ──
  {
    text: "京口居人晚出江上，见石公山下有二青牛，腹嘴皆红，戏于水际。一白衣老翁长可三丈，执鞭于其旁。久之，翁回顾见人，即鞭二牛入水，翁即跳跃而上，倏忽渐长，一举足，径上石公山顶，遂不复见。",
    source: "稽神录·鞭牛",
    gloss: "京口人夜出江边，见石公山下二青牛嬉水，一白衣巨人执鞭旁立。巨人见人，鞭牛入水，跃而渐长，一步登山顶而没。",
  },
  {
    text: "鬼神之事，不可不信，亦不可尽信。",
    source: "稽神录",
    gloss: "鬼神之事，不能完全不信，也不能尽信不疑。",
  },
  {
    text: "夜行见磷火，忽明忽灭，随人而行。",
    source: "稽神录",
    gloss: "夜行时见磷火，忽明忽暗，竟随人而行。",
  },
  {
    text: "山深多怪，木老成精。",
    source: "稽神录",
    gloss: "深山多怪异，古木成精灵。",
  },
  {
    text: "冢中忽有声如牛鸣。视之，无物也。",
    source: "稽神录",
  },
  {
    text: "月黑风高，闻林中有窃窃私语声。",
    source: "稽神录",
  },

  // ── 风格化的志怪意境 ──
  {
    text: "狐灯夜照孤坟冷，古木苍烟鬼语幽。",
    source: "志怪异闻",
    gloss: "狐火照亮冰冷孤坟，古树苍烟中鬼语幽幽。",
  },
  {
    text: "夜半钟声到客船，深山古寺鬼谈禅。",
    source: "志怪异闻",
  },
  {
    text: "荒烟蔓草间，鬼火明灭，如诉如泣。",
    source: "志怪异闻",
  },
  {
    text: "窗纸微动，似有物窥。秉烛视之，一狐跃去。",
    source: "志怪异闻",
  },
  {
    text: "更深月色半人家，狐影临窗叩夜门。",
    source: "志怪异闻",
  },
];

/**
 * Get a random quote from the collection.
 */
export function getRandomQuote(): Quote {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]!;
}
