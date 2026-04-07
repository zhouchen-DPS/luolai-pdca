import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, ShadingType, UnderlineType,
  LevelFormat, convertInchesToTwip
} from 'docx';
import { writeFileSync } from 'fs';

const PRIMARY = '6B2D3E';
const PRIMARY_LIGHT = 'F0EBE3';
const ACCENT = 'B85C6E';
const INK = '1A1714';
const GRAY = '666666';
const WHITE = 'FFFFFF';
const LIGHT_GRAY = 'F7F4F1';

// ─── helpers ──────────────────────────────────────────────────────────────────

const sp = (before = 0, after = 0) => ({ before, after });

function h1(text) {
  return new Paragraph({
    children: [
      new TextRun({ text, bold: true, size: 32, color: WHITE, font: 'Microsoft YaHei' }),
    ],
    heading: HeadingLevel.HEADING_1,
    spacing: sp(400, 200),
    shading: { type: ShadingType.CLEAR, fill: PRIMARY },
    indent: { left: 200, right: 200 },
  });
}

function h2(text) {
  return new Paragraph({
    children: [
      new TextRun({ text: '▌ ', bold: true, size: 26, color: PRIMARY }),
      new TextRun({ text, bold: true, size: 26, color: PRIMARY, font: 'Microsoft YaHei' }),
    ],
    spacing: sp(360, 120),
  });
}

function h3(text) {
  return new Paragraph({
    children: [
      new TextRun({ text, bold: true, size: 23, color: INK, font: 'Microsoft YaHei' }),
    ],
    spacing: sp(240, 80),
  });
}

function body(text, options = {}) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const runs = parts.map(p => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return new TextRun({ text: p.slice(2, -2), bold: true, size: 22, color: options.color || INK, font: 'Microsoft YaHei' });
    }
    return new TextRun({ text: p, size: 22, color: options.color || INK, font: 'Microsoft YaHei' });
  });
  return new Paragraph({ children: runs, spacing: sp(0, 100), ...options._para });
}

function bullet(text, level = 0) {
  const indent = level === 0 ? 400 : 720;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const runs = parts.map(p => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return new TextRun({ text: p.slice(2, -2), bold: true, size: 22, color: INK, font: 'Microsoft YaHei' });
    }
    return new TextRun({ text: p, size: 22, color: INK, font: 'Microsoft YaHei' });
  });
  return new Paragraph({
    children: [new TextRun({ text: level === 0 ? '• ' : '◦ ', size: 22, color: PRIMARY }), ...runs],
    spacing: sp(0, 80),
    indent: { left: indent },
  });
}

function numbered(num, text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const runs = parts.map(p => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return new TextRun({ text: p.slice(2, -2), bold: true, size: 22, color: INK, font: 'Microsoft YaHei' });
    }
    return new TextRun({ text: p, size: 22, color: INK, font: 'Microsoft YaHei' });
  });
  return new Paragraph({
    children: [
      new TextRun({ text: `${num}. `, bold: true, size: 22, color: PRIMARY, font: 'Microsoft YaHei' }),
      ...runs,
    ],
    spacing: sp(0, 80),
    indent: { left: 360 },
  });
}

function blank(n = 1) {
  return Array.from({ length: n }, () => new Paragraph({ children: [new TextRun('')], spacing: sp(0, 0) }));
}

function divider() {
  return new Paragraph({
    children: [new TextRun('')],
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY_LIGHT, space: 1 } },
    spacing: sp(160, 160),
  });
}

function tag(text, fill = PRIMARY, color = WHITE) {
  return new TextRun({
    text: ` ${text} `,
    bold: true,
    size: 18,
    color,
    shading: { type: ShadingType.CLEAR, fill },
    font: 'Microsoft YaHei',
  });
}

function makeTable(headers, rows, colWidths) {
  const headerRow = new TableRow({
    children: headers.map((h, i) =>
      new TableCell({
        children: [new Paragraph({
          children: [new TextRun({ text: h, bold: true, size: 20, color: WHITE, font: 'Microsoft YaHei' })],
          alignment: AlignmentType.CENTER,
          spacing: sp(60, 60),
        })],
        shading: { type: ShadingType.CLEAR, fill: PRIMARY },
        width: { size: colWidths[i], type: WidthType.PERCENTAGE },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
      })
    ),
    tableHeader: true,
  });

  const dataRows = rows.map((row, ri) =>
    new TableRow({
      children: row.map((cell, ci) => {
        const parts = cell.split(/(\*\*[^*]+\*\*)/g);
        const runs = parts.map(p => {
          if (p.startsWith('**') && p.endsWith('**')) {
            return new TextRun({ text: p.slice(2, -2), bold: true, size: 20, color: INK, font: 'Microsoft YaHei' });
          }
          return new TextRun({ text: p, size: 20, color: INK, font: 'Microsoft YaHei' });
        });
        return new TableCell({
          children: [new Paragraph({ children: runs, spacing: sp(60, 60) })],
          shading: { type: ShadingType.CLEAR, fill: ri % 2 === 0 ? LIGHT_GRAY : WHITE },
          width: { size: colWidths[ci], type: WidthType.PERCENTAGE },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
        });
      }),
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function sectionLabel(text) {
  return new Paragraph({
    children: [
      new TextRun({ text, bold: true, size: 20, color: ACCENT, font: 'Microsoft YaHei' }),
    ],
    spacing: sp(160, 60),
    shading: { type: ShadingType.CLEAR, fill: PRIMARY_LIGHT },
    indent: { left: 160, right: 160 },
  });
}

// ─── document body ─────────────────────────────────────────────────────────

const children = [

  // ── TITLE PAGE ──────────────────────────────────────────────────────────
  new Paragraph({
    children: [
      new TextRun({ text: '罗莱 PDCA 智能化管理系统', bold: true, size: 48, color: PRIMARY, font: 'Microsoft YaHei' }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: sp(800, 200),
  }),
  new Paragraph({
    children: [
      new TextRun({ text: '飞书 × AI 驱动的销售作战平台', size: 28, color: GRAY, font: 'Microsoft YaHei', italics: true }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: sp(0, 800),
  }),

  divider(),

  // ── 一、团队信息 ─────────────────────────────────────────────────────────
  h1('一、团队信息'),
  ...blank(),
  body('部门：___________________________'),
  body('团队名：___________________________'),
  body('队长：___________________________'),
  body('队员：___________________________'),
  body('团队形象照：（请自行插入）'),
  ...blank(),
  divider(),

  // ── 二、业务背景 & 痛点 ───────────────────────────────────────────────────
  h1('二、业务背景 & 痛点'),
  ...blank(),

  h2('业务场景特点'),
  body('罗莱生活是中国高端家居品牌，在全国拥有近千家线下门店，形成"营销总监 → 片区经理 → 门店督导 → 店员"四层管理体系。销售目标逐级分解，执行压力层层传导，每一层的数据采集与反馈效率，直接决定着全国门店的整体销售表现。'),
  ...blank(1),
  body('然而，目前的门店销售管理完全依赖 **Excel 手工汇报**，在千店规模下已暴露出严重的系统性瓶颈：'),
  ...blank(1),

  h2('核心痛点'),

  h3('① 数据严重滞后'),
  bullet('信息链路长：店员 → 督导 → 片区经理 → 营销总监，层层汇报，关键数据延迟 1-2 天才能触达管理层'),
  bullet('总监无法实时掌握哪些门店正在"掉队"，错过最佳干预时机'),

  h3('② 执行过程断层'),
  bullet('目标下发后，过程完全"黑箱"——只能等月末复盘时才发现门店落后'),
  bullet('管理动作缺乏数据支撑，"拍脑袋"指挥多，精准跟进少'),

  h3('③ 激励机制缺失'),
  bullet('优秀门店、优秀店员的表现没有展示渠道，无法形成正向竞争氛围'),
  bullet('店员之间相互不知排名，缺乏"超越对手"的实时驱动力'),

  h3('④ 经验严重孤岛'),
  bullet('优秀的销售方法和话术停留在个人经验层面，无法系统化沉淀和传播'),
  bullet('新人和弱势门店得不到及时的经验赋能，优秀经验浪费严重'),

  ...blank(),
  divider(),

  // ── 三、方案概述 ─────────────────────────────────────────────────────────
  h1('三、方案概述'),
  ...blank(),

  body('我们基于飞书的**组织架构能力**与**消息机器人**，结合 **Claude AI 大模型**，构建了一套完整的线上化 PDCA 销售作战平台——**罗莱 PDCA 智能化管理系统**。'),
  ...blank(1),
  body('系统以 PDCA 管理循环为产品骨架，将四个管理动作线上化、自动化、智能化：'),
  ...blank(1),

  makeTable(
    ['阶段', '核心能力', '飞书/AI 技术支撑'],
    [
      ['**P · 目标与计划**', '月度目标逐级拆分下发，校验不少发不漏分', '飞书通讯录 API 同步组织层级；飞书机器人推送目标通知'],
      ['**D · 落地与执行**', '店员每日在线填报销售额与未达成原因', '飞书机器人 19:00 提醒、20:00 逾期汇总通知'],
      ['**C · 状态与监控**', '自动计算完成率，红/绿预警，督导一眼识别滞后门店', '实时计算引擎；飞书预警汇总推送'],
      ['**A · 复盘与总结**', 'AI 自动生成含具体数字的周复盘，督导编辑后发布全团队', 'Claude API 智能生成；飞书推送复盘至店员'],
    ],
    [18, 40, 42]
  ),
  ...blank(1),

  body('**额外亮点：**'),
  bullet('**排行榜**：全国 TOP10 实时可见，冠军风采照展示，激发正向竞争'),
  bullet('**经验推送**：管理员将优质销售总结推送首页，构建经验传播飞轮'),
  bullet('**飞书 OAuth 免密登录**：一键扫码，角色自动识别，零迁移成本'),

  ...blank(),
  body('**最终落地效果**：近千家门店、数千名店员，从"月末才知结果"升级为"每日实时掌控"；管理动作从被动响应变为主动预警；AI 每周自动生成复盘，督导管理效率大幅提升。'),
  ...blank(),
  divider(),

  // ── 四、前后对比 ─────────────────────────────────────────────────────────
  h1('四、前后对比'),
  ...blank(),

  makeTable(
    ['维度', 'Before（使用飞书+AI前）', 'After（使用飞书+AI后）'],
    [
      ['**数据获取**', '店员 Excel 填表 → 督导汇总 → 逐级上报，数据延迟 1-2 天', '店员每日在线填报，数据实时同步至各层级看板，延迟 < 1 分钟'],
      ['**目标管理**', '总监 Excel 拍目标，层级拆分靠邮件/微信，无校验，常出现漏分、少发', '系统校验目标分配合规性（不可少发），飞书自动通知，全程留痕'],
      ['**问题发现**', '只能月末复盘时发现门店落后，错过干预窗口', '自动红/绿状态标记；连续 2 日未填报、月完成率 < 60% 自动预警'],
      ['**激励竞争**', '店员不知自己在全国的排名，优秀表现无人知晓', '全国 TOP10 周排行实时公开，冠军风采照展示，激励效应显著'],
      ['**经验传播**', '优秀销售话术口口相传，范围有限，传播极慢', '管理员从成功总结中推送精华至首页，全国店员实时可见'],
      ['**周复盘**', '督导手动写周报，耗时 2-3 小时，质量参差不齐', 'Claude AI 自动生成含数据的复盘初稿，督导 10 分钟确认发布'],
      ['**登录管理**', '独立系统账号密码，维护成本高，人员变动需手动更新', '飞书 OAuth 扫码登录，组织架构自动同步，零运维成本'],
    ],
    [16, 42, 42]
  ),
  ...blank(),
  divider(),

  // ── 五、实践详述 ─────────────────────────────────────────────────────────
  h1('五、实践详述'),
  ...blank(),

  h2('系统架构'),
  body('**技术栈：** Next.js 14（全栈）+ PostgreSQL + Prisma ORM + 飞书 OAuth + Claude API + 阿里云 OSS + Vercel Cron Jobs'),
  ...blank(1),

  h2('模块一：飞书集成 — 登录与组织架构'),
  numbered(1, '用户通过飞书 OAuth 2.0 扫码登录，系统根据飞书通讯录中的职位自动分配角色（总监/片区经理/督导/店员/管理员）'),
  numbered(2, '系统通过飞书通讯录 API 自动同步组织层级，建立"总监→片区→督导→门店→店员"完整映射关系'),
  numbered(3, '人员入职、离职、调岗时，飞书组织架构变更自动同步，无需人工干预'),
  ...blank(1),

  h2('模块二：P · 目标与计划'),
  numbered(1, '营销总监在系统设定全国月度总目标，拆分至各片区经理，**飞书机器人自动推送通知**'),
  numbered(2, '片区经理收到通知后登录系统，将片区目标拆分至各督导'),
  numbered(3, '督导将目标拆分至门店，再拆分至每位店员；**系统实时校验：门店内店员目标之和必须等于门店目标，不可少发**'),
  numbered(4, '每月 1 日若某层级未完成拆分，**飞书自动催办提醒**'),
  numbered(5, '目标可随时修改，修改后自动触发下级重新分配通知'),
  ...blank(1),

  h2('模块三：D · 落地与执行'),
  numbered(1, '店员每天在系统填写当日实际销售额（必须在线提交）'),
  numbered(2, '**未达成日目标时，"未达成原因"为强制必填字段**，确保过程留痕；达成时可选填成功总结'),
  numbered(3, '每天 **19:00 飞书提醒**未填报店员；**20:00 截止**，逾期自动标记"未填报"'),
  numbered(4, '超时后督导收到**1 条汇总飞书通知**（未填报名单），而非多条逐一推送'),
  ...blank(1),

  h2('模块四：C · 状态与监控'),
  numbered(1, '系统自动计算每个店员、门店、督导的当日/当月累计完成率，实时更新**红（未达成）/ 绿（达成）**状态'),
  numbered(2, '**连续 2 日未填报**：自动向督导推送飞书预警汇总'),
  numbered(3, '**月累计完成率 < 60%**：自动向督导和片区经理推送飞书预警'),
  numbered(4, '督导可点击红色预警门店，直接下钻查看近期日报明细和未达成原因'),
  ...blank(1),

  h2('模块五：排行榜'),
  numbered(1, '每周（周一至周日）自动计算全国店员和门店 TOP10 排名，支持"目标完成率"与"销售额绝对值"两维度切换'),
  numbered(2, '本周销售冠军风采照、姓名、门店、销售额、完成率在排行榜显著展示'),
  numbered(3, '督导可为冠军上传风采照，照片长期沿用至被新冠军替代'),
  ...blank(1),

  h2('模块六：A · 复盘与总结（AI 核心能力）'),
  numbered(1, '每周一 Cron Job 自动触发：**Claude API** 为每位督导各自生成一份独立的周复盘报告，包含：完成率汇总、环比变化（含具体数字）、未达成原因分类、TOP 门店/店员亮点'),
  numbered(2, '督导收到飞书通知，进入系统查看 AI 初稿，可编辑加入个人管理意见'),
  numbered(3, '确认发布后，**飞书推送复盘至所有管辖店员**；发布后仍可修改再次发布'),
  ...blank(1),

  h2('模块七：经验推送'),
  numbered(1, '管理员从店员填写的成功总结中挑选优质内容，一键推送至系统首页经验区'),
  numbered(2, '首页展示最新 10 条经验（FIFO），附注来源店员姓名和门店，全国用户可见'),
  ...blank(),
  divider(),

  // ── 六、提效价值 ─────────────────────────────────────────────────────────
  h1('六、提效价值'),
  ...blank(),

  h2('可量化收益'),

  makeTable(
    ['提效场景', '使用前', '使用后', '提升幅度'],
    [
      ['**数据汇总时效**', '层层 Excel 汇报，延迟 1-2 天', '店员填报后实时同步看板', '**从天级→分钟级**'],
      ['**督导周复盘撰写**', '手动整理数据 + 撰写，约 2-3 小时/周', 'AI 生成初稿，督导审核约 10-15 分钟', '**效率提升 90%+**'],
      ['**目标拆分与通知**', '逐级微信/邮件传达，易漏发，约 30-60 分钟/月', '系统内一键下发+自动通知，约 5 分钟/月', '**效率提升 85%+**'],
      ['**问题门店发现**', '月末复盘时才发现，平均滞后 2-4 周', '连续 2 日未填报/月完成率 <60% 自动预警', '**响应速度提升 95%**'],
      ['**新人系统接入**', '独立账号密码申请、权限配置，约 1 天/人', '飞书组织架构自动同步，即时生效', '**从 1 天→0**'],
    ],
    [25, 25, 25, 25]
  ),
  ...blank(1),

  h2('管理收益（无形收益）'),
  bullet('**决策质量提升**：营销总监从"月末看结果"升级为"每日看趋势"，干预时机更精准'),
  bullet('**执行文化重塑**：强制每日填报 + 实时排行榜，形成全国数千店员的销售竞争文化'),
  bullet('**知识资产沉淀**：优秀销售话术从"个人经验"变为"组织财富"，经验传播覆盖近千门店'),
  bullet('**管理层精力释放**：自动预警聚焦问题门店，督导从"管所有人"变为"管需要管的人"'),
  bullet('**AI 赋能基层管理者**：督导无需具备数据分析能力，AI 直接输出洞察结论，管理门槛大幅降低'),
  ...blank(1),

  h2('系统建设成本估算'),
  body('若完全自研（无飞书能力复用）：'),
  bullet('需独立开发登录系统、组织架构管理、消息通知系统，预估额外增加 **60 人天**开发成本'),
  bullet('按研发平均日薪 2,000 元估算，**节省约 12 万元**建设成本'),
  bullet('飞书通讯录自动同步替代人工维护组织数据，**每年节省人力约 50-100 人天**'),
  ...blank(1),

  h2('业务价值展望'),
  bullet('全国近千家门店实时数据在线，**目标执行透明度达到 100%**'),
  bullet('AI 周复盘覆盖所有督导，**每位督导每年节省复盘时间约 100+ 小时**'),
  bullet('经验推送机制预计带动弱势门店完成率提升 **5-15%**（对标优秀经验执行）'),
  bullet('排行榜激励机制预计带动 TOP 层店员月均销售额提升 **10-20%**'),
  ...blank(),

];

// ─── assemble document ────────────────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: 'Microsoft YaHei', size: 22, color: INK },
      },
    },
  },
  sections: [{
    properties: {
      page: {
        margin: { top: 1440, bottom: 1440, left: 1800, right: 1800 },
      },
    },
    children,
  }],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('罗莱PDCA-竞赛提案.docx', buffer);
console.log('✅ 已生成：C:\\Users\\zhouchen\\luolai-pdca\\罗莱PDCA-竞赛提案.docx');
