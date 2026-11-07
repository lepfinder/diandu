/**
 * 依据《红楼梦》正文增补 / 校正的关系边。
 * 与 data/content.json 的 relations 合并（同 (s,t,type) 覆盖，不同类型可并存）。
 * fromCh/toCh：该关系在书中成立的回目区间（可选）。
 */
export type RelPatch = {
  s: string;
  t: string;
  type: 'blood' | 'marriage' | 'master-servant' | 'love' | 'friend' | 'foe' | 'teacher';
  label: string;
  fromCh?: number;
  toCh?: number;
};

export const RELATION_PATCHES: RelPatch[] = [
  // ── 补孤点 ──────────────────────────────────────────
  { s: 'yingér', t: 'baochai', type: 'master-servant', label: '贴身丫鬟', fromCh: 8, toCh: 120 },
  { s: 'ziying', t: 'qinzhong', type: 'love', label: '庵中私情', fromCh: 15, toCh: 16 },
  { s: 'jiajing-zhen', t: 'baoyu', type: 'friend', label: '真假镜像', fromCh: 56, toCh: 115 },
  { s: 'wanggour', t: 'liulaolao', type: 'blood', label: '女婿', fromCh: 6, toCh: 119 },
  { s: 'jiaxuan', t: 'wangfuren', type: 'master-servant', label: '陪房', fromCh: 6, toCh: 120 },
  { s: 'lǐmo', t: 'baoyu', type: 'master-servant', label: '乳母', fromCh: 3, toCh: 57 },

  // ── 一人两重：表亲 + 情缘 ────────────────────────────
  { s: 'baoyu', t: 'daiyu', type: 'blood', label: '姑表兄妹', fromCh: 3, toCh: 98 },
  { s: 'baoyu', t: 'baochai', type: 'blood', label: '姨表姐弟', fromCh: 4, toCh: 120 },
  { s: 'baoyu', t: 'xiangyun', type: 'blood', label: '姑表姐弟', fromCh: 19, toCh: 120 },
  { s: 'daiyu', t: 'jiamin', type: 'blood', label: '母女' }, // 已有，保底

  // ── 关键情节线（带回目）────────────────────────────────
  // 钗黛：猜忌 → 金兰契（45回）
  { s: 'daiyu', t: 'baochai', type: 'foe', label: '情场猜忌', fromCh: 8, toCh: 45 },
  { s: 'daiyu', t: 'baochai', type: 'friend', label: '金兰契', fromCh: 45, toCh: 98 },

  // 尤二姐：偷娶 → 借剑（63–69）
  { s: 'jialian', t: 'youerjie', type: 'love', label: '偷娶外室', fromCh: 63, toCh: 69 },
  { s: 'xifeng', t: 'youerjie', type: 'foe', label: '借剑杀人', fromCh: 68, toCh: 69 },
  { s: 'qiutong', t: 'youerjie', type: 'foe', label: '作践', fromCh: 69, toCh: 69 },
  { s: 'youshi', t: 'youerjie', type: 'friend', label: '接进宁府', fromCh: 63, toCh: 69 },

  // 尤三姐 / 柳湘莲：定亲 → 悲剧（63–66）
  { s: 'liuxianglian', t: 'yousanjie', type: 'love', label: '鸳鸯剑定亲', fromCh: 63, toCh: 66 },
  { s: 'liuxianglian', t: 'baoyu', type: 'friend', label: '冷面知交', fromCh: 47, toCh: 66 },
  { s: 'liuxianglian', t: 'xuepan', type: 'friend', label: '打后相救', fromCh: 66, toCh: 120 },

  // 晴雯：撕扇 → 抄检 → 夭亡（→78）
  { s: 'qingwen', t: 'baoyu', type: 'master-servant', label: '撕扇知己', fromCh: 31, toCh: 77 },
  { s: 'wangfuren', t: 'qingwen', type: 'foe', label: '撵逐', fromCh: 77, toCh: 77 },
  { s: 'qingwen', t: 'xiren', type: 'foe', label: '一床两好', fromCh: 20, toCh: 77 },

  // 袭人：进言王夫人（34），终嫁蒋玉菡
  { s: 'xiren', t: 'wangfuren', type: 'master-servant', label: '密告进言', fromCh: 34, toCh: 120 },
  { s: 'xiren', t: 'baochai', type: 'friend', label: '金玉同盟', fromCh: 21, toCh: 120 },
  { s: 'xiren', t: 'baoyu', type: 'master-servant', label: '初试云雨', fromCh: 6, toCh: 120 },

  // 金钏：玩笑 → 投井（7–32）
  { s: 'wangfuren', t: 'jinchuan', type: 'master-servant', label: '撵逐致死', fromCh: 7, toCh: 32 },
  { s: 'baoyu', t: 'jinchuan', type: 'friend', label: '玩笑致祸', fromCh: 7, toCh: 32 },

  // 鸳鸯：抗婚 → 殉主
  { s: 'yuanyang', t: 'jiamu', type: 'master-servant', label: '贴身侍奉', fromCh: 24, toCh: 111 },
  { s: 'yuanyang', t: 'jiashe', type: 'foe', label: '誓绝鸳鸯偶', fromCh: 46, toCh: 46 },

  // 刘姥姥：一进 → 两宴 → 三进救巧姐
  { s: 'liulaolao', t: 'jiamu', type: 'friend', label: '两宴大观园', fromCh: 39, toCh: 41 },
  { s: 'liulaolao', t: 'qiaojie', type: 'friend', label: '三进救孤', fromCh: 113, toCh: 119 },
  { s: 'liulaolao', t: 'xifeng', type: 'friend', label: '托孤之交', fromCh: 6, toCh: 113 },

  // 妙玉：品茶 → 嫌脏 → 遭劫
  { s: 'miaoyu', t: 'baoyu', type: 'love', label: '槛外情愫', fromCh: 41, toCh: 87 },
  { s: 'miaoyu', t: 'daiyu', type: 'friend', label: '中秋联诗', fromCh: 76, toCh: 76 },
  { s: 'miaoyu', t: 'xiangyun', type: 'friend', label: '中秋联诗', fromCh: 76, toCh: 76 },
  { s: 'miaoyu', t: 'liulaolao', type: 'foe', label: '嫌脏弃杯', fromCh: 41, toCh: 41 },

  // 香菱：学诗 → 被折磨
  { s: 'xiangling', t: 'daiyu', type: 'teacher', label: '拜师学诗', fromCh: 48, toCh: 49 },
  { s: 'xiangling', t: 'baochai', type: 'friend', label: '同住蘅芜', fromCh: 4, toCh: 80 },
  { s: 'xiajingui', t: 'xuepan', type: 'foe', label: '河东狮吼', fromCh: 79, toCh: 103 },

  // 龄官 / 贾蔷
  { s: 'jiaqiang', t: 'lingguan', type: 'love', label: '划蔷痴情', fromCh: 30, toCh: 36 },
  { s: 'lingguan', t: 'baoyu', type: 'friend', label: '局外悟分定', fromCh: 36, toCh: 36 },

  // 秦可卿：病 → 丧（5–13）
  { s: 'keqing', t: 'xifeng', type: 'friend', label: '婶侄密友', fromCh: 7, toCh: 13 },
  { s: 'jiazhen', t: 'keqing', type: 'love', label: '翁媳暧昧', fromCh: 5, toCh: 13 },
  { s: 'jiaqiang', t: 'keqing', type: 'marriage', label: '夫妻', fromCh: 5, toCh: 13 },

  // 迎春：误嫁 → 虐死
  { s: 'jiajing-sun', t: 'yingchun', type: 'foe', label: '中山狼虐妻', fromCh: 79, toCh: 109 },

  // 司棋：抄检 → 触墙（74–77）
  { s: 'sima', t: 'yingchun', type: 'master-servant', label: '贴身丫鬟', fromCh: 71, toCh: 77 },
  { s: 'shagua', t: 'sima', type: 'foe', label: '误拾香囊', fromCh: 73, toCh: 74 },

  // 贾瑞 / 凤姐：相思局（11–12）
  { s: 'jiaqiang', t: 'xifeng', type: 'friend', label: '弄权亲信', fromCh: 6, toCh: 114 },
  { s: 'xifeng', t: 'liulaolao', type: 'friend', label: '接济巧姐', fromCh: 6, toCh: 119 },

  // 贾雨村 / 冷子兴 / 甄士隐
  { s: 'lengzixing', t: 'jiaxuan', type: 'marriage', label: '女婿', fromCh: 2, toCh: 120 },
  { s: 'jiayu', t: 'linruhai', type: 'friend', label: '西席之交', fromCh: 2, toCh: 14 },
  { s: 'jiayu', t: 'baoyu', type: 'foe', label: '禄蠹之厌', fromCh: 32, toCh: 119 },

  // 元春：省亲 → 薨逝
  { s: 'yuanchun', t: 'baoyu', type: 'blood', label: '姐弟', fromCh: 2, toCh: 95 },
  { s: 'yuanchun', t: 'jiamu', type: 'blood', label: '祖孙', fromCh: 2, toCh: 95 },
  { s: 'yuanchun', t: 'jiazheng', type: 'blood', label: '父女', fromCh: 2, toCh: 95 },

  // 探春：理家 / 远嫁
  { s: 'tanchun', t: 'liwan', type: 'friend', label: '兴利除弊', fromCh: 55, toCh: 56 },
  { s: 'tanchun', t: 'zhaoyiniang', type: 'foe', label: '母女嫌隙', fromCh: 20, toCh: 119 },
  { s: 'tanchun', t: 'xifeng', type: 'friend', label: '惺惺相惜', fromCh: 55, toCh: 74 },

  // 芳官等伶人
  { s: 'fangguan', t: 'baoyu', type: 'friend', label: '斩情前亲近', fromCh: 36, toCh: 77 },

  // 薛蝌 / 宝琴 / 岫烟
  { s: 'baoqin', t: 'xueyima', type: 'blood', label: '堂伯母侄女', fromCh: 49, toCh: 120 },
  { s: 'xiuyan', t: 'xueke', type: 'marriage', label: '梅窗定亲', fromCh: 49, toCh: 120 },
  { s: 'xiuyan', t: 'miaoyu', type: 'friend', label: '栊翠庵续诗', fromCh: 50, toCh: 50 },

  // 秋桐 / 凤姐借剑
  { s: 'xifeng', t: 'qiutong', type: 'friend', label: '借剑工具', fromCh: 69, toCh: 69 },

  // 小红 / 贾芸（贾芸不在册）—— 只连小红与凤姐已有
  { s: 'xiaohong', t: 'baoyu', type: 'master-servant', label: '怡红院小丫鬟', fromCh: 24, toCh: 28 },

  // 傻大姐 / 绣春囊
  { s: 'shagua', t: 'xifeng', type: 'foe', label: '引出抄检', fromCh: 73, toCh: 74 },

  // 贾环进谗 / 赵姨娘
  { s: 'zhaoyiniang', t: 'xifeng', type: 'foe', label: '魇魔法', fromCh: 25, toCh: 25 },
  { s: 'jiahuan', t: 'wangfuren', type: 'foe', label: '嫡庶偏心', fromCh: 20, toCh: 120 },

  // 北静王 / 蒋玉菡 / 宝玉汗巾
  { s: 'jiangyuhan', t: 'xuepan', type: 'friend', label: '酒肆知交', fromCh: 28, toCh: 120 },
  { s: 'jiangyuhan', t: 'beijingwang', type: 'friend', label: '王府供奉', fromCh: 28, toCh: 120 },

  // 校正：贾母—凤孙媳属姻亲
  { s: 'jiamu', t: 'xifeng', type: 'marriage', label: '祖孙媳', fromCh: 2, toCh: 110 },

  // ── 次级人物关系 ──────────────────────────────────────
  { s: 'mingyan', t: 'baoyu', type: 'master-servant', label: '心腹小厮', fromCh: 9, toCh: 120 },
  { s: 'ligui', t: 'baoyu', type: 'master-servant', label: '长随', fromCh: 9, toCh: 120 },
  { s: 'ligui', t: 'lǐmo', type: 'blood', label: '母子', fromCh: 3, toCh: 57 },
  { s: 'sheyue', t: 'baoyu', type: 'master-servant', label: '一等丫鬟', fromCh: 20, toCh: 120 },
  { s: 'sheyue', t: 'xiren', type: 'friend', label: '同房姊妹', fromCh: 20, toCh: 120 },
  { s: 'qiuwen', t: 'baoyu', type: 'master-servant', label: '二等丫鬟', fromCh: 20, toCh: 77 },
  { s: 'bihen', t: 'baoyu', type: 'master-servant', label: '二等丫鬟', fromCh: 20, toCh: 77 },
  { s: 'zhui-er', t: 'qingwen', type: 'foe', label: '撵逐', fromCh: 52, toCh: 52 },
  { s: 'zhui-er', t: 'baoyu', type: 'master-servant', label: '小丫头', fromCh: 20, toCh: 52 },
  { s: 'xueyan', t: 'daiyu', type: 'master-servant', label: '扬州带来的', fromCh: 2, toCh: 98 },
  { s: 'cuilv', t: 'xiangyun', type: 'master-servant', label: '贴身丫鬟', fromCh: 21, toCh: 120 },
  { s: 'ruhua', t: 'xichun', type: 'master-servant', label: '贴身丫鬟', fromCh: 3, toCh: 74 },
  { s: 'shishu', t: 'tanchun', type: 'master-servant', label: '贴身丫鬟', fromCh: 27, toCh: 119 },
  { s: 'xiuju', t: 'yingchun', type: 'master-servant', label: '贴身丫鬟', fromCh: 73, toCh: 109 },
  { s: 'wenxing', t: 'baochai', type: 'master-servant', label: '次等丫鬟', fromCh: 8, toCh: 120 },
  { s: 'yingér', t: 'wenxing', type: 'friend', label: '同房', fromCh: 8, toCh: 120 },
  { s: 'yuchuan', t: 'jinchuan', type: 'blood', label: '姐妹', fromCh: 7, toCh: 32 },
  { s: 'yuchuan', t: 'wangfuren', type: 'master-servant', label: '丫鬟', fromCh: 7, toCh: 120 },
  { s: 'yuchuan', t: 'baoyu', type: 'friend', label: '莲叶羹', fromCh: 35, toCh: 35 },
  { s: 'caiyun', t: 'jiahuan', type: 'love', label: '有私', fromCh: 20, toCh: 61 },
  { s: 'caiyun', t: 'wangfuren', type: 'master-servant', label: '丫鬟', fromCh: 20, toCh: 61 },
  { s: 'caixia', t: 'jiahuan', type: 'love', label: '有私', fromCh: 20, toCh: 72 },
  { s: 'hupo', t: 'jiamu', type: 'master-servant', label: '一等丫鬟', fromCh: 24, toCh: 110 },
  { s: 'zhenzhu', t: 'jiamu', type: 'master-servant', label: '旧名袭人', fromCh: 3, toCh: 3 },
  { s: 'zhenzhu', t: 'xiren', type: 'friend', label: '同一人旧名', fromCh: 3, toCh: 120 },
  { s: 'ouguan', t: 'diguan', type: 'love', label: '假凤虚凰', fromCh: 36, toCh: 36 },
  { s: 'ouguan', t: 'ruiguan', type: 'love', label: '续弦', fromCh: 36, toCh: 77 },
  { s: 'ouguan', t: 'baoyu', type: 'friend', label: '杏子阴烧纸', fromCh: 58, toCh: 58 },
  { s: 'kuiguan', t: 'xiangyun', type: 'master-servant', label: '归湘云', fromCh: 36, toCh: 120 },
  { s: 'douguan', t: 'baoqin', type: 'master-servant', label: '归宝琴', fromCh: 36, toCh: 120 },
  { s: 'aiguan', t: 'tanchun', type: 'master-servant', label: '归探春', fromCh: 36, toCh: 77 },
  { s: 'qieguan', t: 'youshi', type: 'master-servant', label: '归尤氏', fromCh: 36, toCh: 77 },
  { s: 'fangguan', t: 'diguan', type: 'friend', label: '女伶同伴', fromCh: 36, toCh: 77 },
  { s: 'jiaoda', t: 'jiazhen', type: 'foe', label: '醉骂爬灰', fromCh: 7, toCh: 7 },
  { s: 'jiaoda', t: 'keqing', type: 'foe', label: '醉骂爬灰', fromCh: 7, toCh: 7 },
  { s: 'laida', t: 'jiamu', type: 'master-servant', label: '大管家', fromCh: 9, toCh: 110 },
  { s: 'laimomo', t: 'laida', type: 'blood', label: '母子', fromCh: 9, toCh: 110 },
  { s: 'laimomo', t: 'jiamu', type: 'master-servant', label: '老嬷嬷', fromCh: 9, toCh: 43 },
  { s: 'laimomo', t: 'baoyu', type: 'friend', label: '训诫', fromCh: 43, toCh: 43 },
  { s: 'wangshanbao', t: 'xingshi', type: 'master-servant', label: '陪房', fromCh: 73, toCh: 74 },
  { s: 'wangshanbao', t: 'sima', type: 'blood', label: '外孙女', fromCh: 73, toCh: 77 },
  { s: 'wangshanbao', t: 'xifeng', type: 'foe', label: '抄检对头', fromCh: 73, toCh: 74 },
  { s: 'wangshanbao', t: 'tanchun', type: 'foe', label: '掌掴', fromCh: 74, toCh: 74 },
  { s: 'zhourui', t: 'jiaxuan', type: 'marriage', label: '夫妻', fromCh: 2, toCh: 120 },
  { s: 'zhourui', t: 'wangfuren', type: 'master-servant', label: '陪房', fromCh: 2, toCh: 120 },
  { s: 'jiaxuan', t: 'lengzixing', type: 'marriage', label: '岳母女婿', fromCh: 2, toCh: 120 },
  { s: 'jiaxuan', t: 'wangfuren', type: 'master-servant', label: '陪房', fromCh: 6, toCh: 120 },
  { s: 'jiaxuan', t: 'xifeng', type: 'master-servant', label: '报信', fromCh: 6, toCh: 120 },
  { s: 'zhaomomo', t: 'jialian', type: 'master-servant', label: '乳母', fromCh: 16, toCh: 16 },
  { s: 'zhaomomo', t: 'xifeng', type: 'friend', label: '求差', fromCh: 16, toCh: 16 },
  { s: 'wujinxiao', t: 'jiazhen', type: 'master-servant', label: '庄头交租', fromCh: 53, toCh: 53 },
  { s: 'fengziying', t: 'baoyu', type: 'friend', label: '贵游', fromCh: 14, toCh: 120 },
  { s: 'fengziying', t: 'xuepan', type: 'friend', label: '酒友', fromCh: 26, toCh: 120 },
  { s: 'fengziying', t: 'zhang-youshi', type: 'friend', label: '荐医', fromCh: 10, toCh: 10 },
  { s: 'weiruolan', t: 'xiangyun', type: 'marriage', label: '金麒麟姻缘', fromCh: 31, toCh: 120 },
  { s: 'weiruolan', t: 'baoyu', type: 'friend', label: '王孙', fromCh: 31, toCh: 120 },
  { s: 'pan-youan', t: 'sima', type: 'love', label: '表弟私情', fromCh: 71, toCh: 77 },
  { s: 'feng-yuan', t: 'xiangling', type: 'love', label: '买妾丧命', fromCh: 4, toCh: 4 },
  { s: 'feng-yuan', t: 'xuepan', type: 'foe', label: '被殴致死', fromCh: 4, toCh: 4 },
  { s: 'feng-yuan', t: 'jiayu', type: 'foe', label: '葫芦案', fromCh: 4, toCh: 4 },
  { s: 'ni2', t: 'jiaxun', type: 'friend', label: '借银义气', fromCh: 24, toCh: 24 },
  { s: 'bu-shiren', t: 'jiaxun', type: 'blood', label: '舅甥', fromCh: 24, toCh: 24 },
  { s: 'qinye', t: 'keqing', type: 'blood', label: '父女', fromCh: 5, toCh: 13 },
  { s: 'qinye', t: 'qinzhong', type: 'blood', label: '父子', fromCh: 7, toCh: 16 },
  { s: 'youlaoniang', t: 'youerjie', type: 'blood', label: '母女', fromCh: 63, toCh: 69 },
  { s: 'youlaoniang', t: 'yousanjie', type: 'blood', label: '母女', fromCh: 63, toCh: 66 },
  { s: 'youlaoniang', t: 'youshi', type: 'blood', label: '继母女', fromCh: 63, toCh: 69 },
  { s: 'jingxu', t: 'xifeng', type: 'friend', label: '说情弄权', fromCh: 15, toCh: 15 },
  { s: 'jingxu', t: 'zhang-jinge', type: 'foe', label: '断姻', fromCh: 15, toCh: 15 },
  { s: 'wang-yitie', t: 'baoyu', type: 'friend', label: '疗妒汤', fromCh: 80, toCh: 80 },
  { s: 'zhang-youshi', t: 'keqing', type: 'teacher', label: '论病细穷源', fromCh: 10, toCh: 10 },
  { s: 'hu-yongyi', t: 'qingwen', type: 'foe', label: '虎狼药', fromCh: 51, toCh: 51 },
  { s: 'hu-yongyi', t: 'youerjie', type: 'foe', label: '误诊', fromCh: 69, toCh: 69 },
  { s: 'jin-wenxiang', t: 'yuanyang', type: 'blood', label: '兄妹', fromCh: 46, toCh: 46 },
  { s: 'jin-wenxiang', t: 'jiashe', type: 'master-servant', label: '说亲', fromCh: 46, toCh: 46 },
  { s: 'zhang-jinge', t: 'jingxu', type: 'foe', label: '退婚之祸', fromCh: 15, toCh: 15 },
  { s: 'feng-su', t: 'zhenshiyin', type: 'marriage', label: '翁婿', fromCh: 1, toCh: 2 },
  { s: 'feng-su', t: 'xiu-chun', type: 'master-servant', label: '主仆', fromCh: 1, toCh: 2 },
  { s: 'hulu-seng', t: 'jiayu', type: 'friend', label: '献护官符', fromCh: 4, toCh: 4 },
  { s: 'hulu-seng', t: 'feng-yuan', type: 'foe', label: '枉法', fromCh: 4, toCh: 4 },
  { s: 'zhanguang', t: 'jiazheng', type: 'master-servant', label: '清客', fromCh: 8, toCh: 120 },
  { s: 'shan-pingren', t: 'jiazheng', type: 'master-servant', label: '清客', fromCh: 8, toCh: 120 },
  { s: 'cheng-rixing', t: 'jiazheng', type: 'master-servant', label: '清客', fromCh: 16, toCh: 120 },
  { s: 'daiquan', t: 'jiazhen', type: 'friend', label: '卖龙禁尉', fromCh: 13, toCh: 13 },
  { s: 'xiu-chun', t: 'zhenshiyin', type: 'master-servant', label: '甄家丫鬟', fromCh: 1, toCh: 2 },
  { s: 'xiu-chun', t: 'jiayu', type: 'marriage', label: '侥幸成夫人', fromCh: 2, toCh: 120 },
  { s: 'jiaxun', t: 'xifeng', type: 'master-servant', label: '钻营谋差', fromCh: 23, toCh: 24 },
  { s: 'jiaxun', t: 'xiaohong', type: 'love', label: '遗帕惹相思', fromCh: 24, toCh: 28 },
  { s: 'jiarui', t: 'xifeng', type: 'love', label: '相思局', fromCh: 11, toCh: 12 },
  { s: 'jiarui', t: 'jiaqiang', type: 'friend', label: '家塾', fromCh: 9, toCh: 12 },
  { s: 'jiaqin', t: 'jingxu', type: 'master-servant', label: '管水月庵', fromCh: 23, toCh: 93 },
  { s: 'jiahuang-qi', t: 'keqing', type: 'friend', label: '问罪又气短', fromCh: 9, toCh: 10 },
  { s: 'jiajun', t: 'jialan', type: 'friend', label: '家塾同窗', fromCh: 9, toCh: 9 },
  { s: 'laiwang', t: 'xifeng', type: 'master-servant', label: '弄权爪牙', fromCh: 16, toCh: 114 },
  { s: 'laiwang-qi', t: 'xifeng', type: 'master-servant', label: '陪房爪牙', fromCh: 15, toCh: 114 },
  { s: 'feng-er', t: 'xifeng', type: 'master-servant', label: '贴身丫鬟', fromCh: 3, toCh: 114 },
  { s: 'jiahui', t: 'xiaohong', type: 'friend', label: '不平', fromCh: 26, toCh: 28 },
  { s: 'wangrong', t: 'baoyu', type: 'master-servant', label: '长随', fromCh: 43, toCh: 120 },
];
