---
name: 成长派克
description: 家庭儿童成长激励小程序 — 任务、积分、抽奖、成就
colors:
  accent: "#007AFF"
  green: "#34C759"
  orange: "#FF9500"
  red: "#FF3B30"
  purple: "#AF52DE"
  background: "#F2F2F7"
  surface: "#FFFFFF"
  ink: "#1d1d1f"
  muted: "#8E8E93"
  faint: "#C7C7CC"
  separator: "#C6C6C8"
typography:
  body:
    fontFamily: "-apple-system, SF Pro Display, SF Pro Text, PingFang SC, Helvetica Neue, sans-serif"
    fontSize: "28rpx"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "-apple-system, SF Pro Display, SF Pro Text, PingFang SC, Helvetica Neue, sans-serif"
    fontSize: "28rpx"
    fontWeight: 600
    lineHeight: 1.3
  headline:
    fontFamily: "-apple-system, SF Pro Display, SF Pro Text, PingFang SC, Helvetica Neue, sans-serif"
    fontSize: "34rpx"
    fontWeight: 600
    lineHeight: 1.2
  caption:
    fontFamily: "-apple-system, SF Pro Display, SF Pro Text, PingFang SC, Helvetica Neue, sans-serif"
    fontSize: "24rpx"
    fontWeight: 500
    lineHeight: 1.4
  label:
    fontFamily: "-apple-system, SF Pro Display, SF Pro Text, PingFang SC, Helvetica Neue, sans-serif"
    fontSize: "20rpx"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: "999px"
spacing:
  tight: "8rpx"
  element: "16rpx"
  card: "24rpx"
  page: "32rpx"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.full}"
    padding: "16rpx 48rpx"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "24rpx"
  chip-category:
    backgroundColor: "#F2F2F7"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "8rpx 16rpx"
---

# Design System: 成长派克

## 1. Overview

**Creative North Star: "家庭游乐场 Family Playground"**

成长派克是一个轻量级的家庭游戏化系统。它不是一个冷冰冰的任务管理器，也不是一个过度装饰的儿童游戏——而是一个让家长和孩子都觉得自然、好用的「家庭游乐场」。家长在这里高效管理任务和积分，孩子在这里感受成长的乐趣和抽奖的惊喜。

视觉基调是**明快但克制**（像 Duolingo：活泼但不幼稚，大人用也不尴尬）。iOS 原生设计语言提供了稳定、可信的骨架；emoji 图标、等级树、宝箱动画和积分反馈注入了游戏化的灵魂。关键原则：**有趣来自内容（成就、宝箱、等级），而不是来自装饰。**

系统明确拒绝：幼稚卡通风格（家长不会信任）、企业后台的冷感（家庭产品需要温度）、以及过度设计的 AI 痕迹（渐变色文字、玻璃态卡片、无意义的动效）。

**Key Characteristics:**
- iOS 17 系统色 + SF Pro 字栈，信任感来自熟悉的原生语言
- 白色卡片 + 浅灰背景的经典分层，用轻微阴影和毛玻璃区分深度
- Emoji 作为图标系统（降低设计成本，增加童趣表达）
- 功能性色彩编码（蓝=运动、绿=生活、橙=学习），家长无需学习即可理解
- 动画服务于反馈（积分变化、等级提升、抽奖结果），不做装饰性动效

## 2. Colors

iOS 系统色为基础的功能性调色板。三个类别色（蓝/绿/橙）是核心语义色，每种映射到一种任务类型和稀有度梯度。强调色蓝（#007AFF）作为全局主操作色和选中态。这不是一套「品牌色」，而是一套「被千万 iOS 用户验证过的可读色」。

### Primary
- **Accent Blue** (#007AFF): 主操作按钮、选中态标签、链接文字、稀有度「稀有」标记。App 全局唯一强调色，不与其他色竞争注意力。

### Secondary
- **Green** (#34C759): 生活类别色。进度条起始色（与蓝组成渐变）。成功/完成状态的默认语义色。
- **Orange** (#FF9500): 学习类别色。稀有度「传说」标记。温暖的提醒色，不做错误/警告用途。
- **Purple** (#AF52DE): 稀有度「史诗」标记。成就徽章装饰色。

### Neutral
- **Background** (#F2F2F7): 全局底色。iOS 标准系统背景 —— 微妙的冷灰，不是暖奶油。
- **Surface** (#FFFFFF): 卡片、列表项、所有浮起容器的背景。纯白，不添加透明度或色调。
- **Ink** (#1d1d1f): 正文、标题。近黑但不是纯黑（#000），避免刺眼对比。
- **Muted** (#8E8E93): 辅助文字、占位信息、未选中 tab。iOS 标准辅助色。
- **Faint** (#C7C7CC): 禁用态文字、极低优先级信息。
- **Separator** (#C6C6C8): 分割线、列表边界。

### Rarity Scale
颜色同时编码稀有度信息，形成可识别的梯度：
- **Common** (gray #8E8E93, bg #F2F2F7): 普通奖励
- **Rare** (blue #007AFF, bg #E8F2FF): 稀有奖励
- **Epic** (purple #AF52DE, bg #F3E8FF): 史诗奖励
- **Legendary** (orange #FF9500, bg #FFF3E0): 传说奖励

### Named Rules

**The One Accent Rule.** Accent Blue 出现在 ≤10% 的任何屏幕面积上。它的稀缺就是它的力量。永远不把蓝用作背景色、卡片底色、或装饰色。它只出现在：主按钮、当前选中态、链接、进度填充。

**The Function-Over-Fashion Rule.** 颜色选择服务于信息编码，不是审美偏好。蓝/绿/橙三类不是因为它们「好看」，而是因为它们在色盲模拟中保持可区分，并且在 iOS 生态中有既定的语义认知。

## 3. Typography

**Font Stack:** SF Pro (Display + Text) → PingFang SC → Helvetica Neue → system sans-serif

**Character:** SF Pro 是 iOS 原生字体，干净、中性、高度可读。PingFang SC 作为中文字体回退，在华文排版中同样清晰。单一家族，通过字重和大小区分层级——不需要第二套字体。

### Hierarchy
- **Headline** (600, 34rpx, 1.2): 页面主标题。仅用于页面顶部（如「成长之路」、「宝箱」）。
- **Title** (600, 28rpx, 1.3): 区域标题。卡片标题、列表项主文字。
- **Body** (400, 28rpx, 1.5): 正文。任务描述、积分说明、成就名称。最大行宽约 65–75 字符。
- **Caption** (500, 24rpx, 1.4): 辅助说明。排行榜条目、积分流水备注、徽章名称。
- **Label** (500, 20rpx, 1.3): 最小可读尺寸。标签、分类标记、时间戳。不做全大写处理。

### Named Rules

**The Single-Family Rule.** 全应用使用一个字体家族。标题、正文、按钮、标签、数字——全部 SF Pro / PingFang。不要引入第二套字体来做「设计感」。差异化通过字重（400 / 500 / 600 / 800）和大小来实现。

**The No-Caps Rule.** 不做全大写标签。中文不需要，英文场景保留常规大小写。大写在小程序中可读性差且显得生硬。

## 4. Elevation

系统使用三个明确的高度层级，对应三类 z-index 场景。层级之间通过阴影扩散距离和透明度区分：层级越高，阴影越大越淡。

### Shadow Vocabulary
- **Rest** (0 2px 16px rgba(0,0,0,0.04)): 卡片在背景上轻微浮起。用于：任务卡片、统计卡片、徽章项。从 0 开始——页面底色没有阴影。
- **Raised** (0 8px 32px rgba(0,0,0,0.08)): 临时浮层。用于：弹出结果表单、下拉菜单、操作选项面板。扩散更大、透明度更高，传达更远的空间距离。
- **Hairline** (0 0.5px 0 rgba(0,0,0,0.06)): 导航栏底部边界。半像素线代替硬分割，配合毛玻璃背景。

### Blur
- **Nav Bar** (saturate(180%) blur(20px)): 固定导航栏的毛玻璃背景。iOS 标准效果，透出底部内容但不影响可读性。
- **Overlay** (blur(10px)): 模态/弹窗的遮罩层。

### Named Rules

**The Hierarchy-Is-Light Rule.** 三个阴影层级就够了。不要引入更多层级，不要增加阴影颜色浓度。iOS 的深度的感觉来自微妙——如果阴影让人注意到「这是一个有阴影的卡片」，那就太重了。

## 5. Components

所有组件使用微信小程序原生标签（`<view>`, `<text>`, `<image>`, `<scroll-view>`），不引入第三方组件库。交互反馈使用 `:active` 伪类 + `transform: scale(0.97)` 的按压缩放。

### Buttons
- **Shape:** 全圆角胶囊（999px），无直角或小圆角按钮。
- **Primary:** Accent Blue 底色 + 白色文字，padding 16rpx × 48rpx。字重 500。按压态 opacity 0.7。
- **Ghost:** 透明底色 + Accent Blue 文字，用于次要操作（如「查看全部 →」）。按压态 opacity 0.55。
- **Action (卡片内):** 浅灰底色 + Ink 文字，小尺寸。用于卡片内的功能入口。
- **Danger:** 不使用红色按钮。删除/重置类操作使用红色文字 + 透明背景的文字按钮。

### Cards
- **Corner Style:** 大圆角（16rpx）。所有卡片同一圆角值，不做差异化。
- **Background:** 纯白 (#FFFFFF)。
- **Shadow:** Rest 层级（0 2px 16px rgba(0,0,0,0.04)）。
- **Border:** 无。白色卡片 + 浅灰背景的分层足以区分，不需要描边。
- **Internal Padding:** 24rpx（card spacing）。内容间距 12–16rpx。
- **Interaction:** 可点击卡片按压时 `transform: scale(0.97)`，过渡 0.2s ease。

### Category Tags
- **Style:** 全圆角胶囊（999px），浅灰底色 (#F2F2F7) + emoji 前缀 + 类别名。
- **Color Variants:** 运动=蓝、生活=绿、学习=橙。颜色通过左侧小圆点或文字色表达，不是整个标签的背景色。

### Score Stars
- **Style:** 三颗星评分组件。未选中态为浅灰空心星，选中态填充金色 (#FFCC00)。
- **Size:** 每颗星约 48rpx，间距 8rpx。
- **Interaction:** 点击第 N 颗星同时选中 1–N 颗，即时反馈。

### Progress Bar
- **Track:** 浅灰 (#F2F2F7)，20rpx 高，全圆角（10rpx）。
- **Fill:** 绿到蓝渐变（#34C759 → #007AFF）。过渡动画 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)（轻微弹性）。
- **Label:** 百分比数字 + 完成数/总数文字，位于进度条下方。

### Navigation
- **Nav Bar:** 固定顶部，毛玻璃背景（saturate(180%) blur(20px)），z-index 100。高度 88rpx。标题 34rpx / 600 居中或左对齐。
- **Tab Bar:** 底部 4 个 tab（首页/任务/抽奖/成就 + 设置），选中态 Accent Blue，未选中 Muted gray。背景 #F2F2F7。
- **Child Switcher:** 水平滚动头像列表，当前选中使用 Accent Blue 边框或文字高亮。

### Empty State
- **Style:** 居中排列：大号 emoji（60rpx）+ 提示文字（28rpx, Muted）+ 可选操作按钮。
- **Voice:** 友好的空状态提示，不使用「暂无数据」这种机械语言。例如：「还没有添加孩子哦~」「今天还没有任务」。

### Points Display
- **Style:** 大号数字（36–48rpx, 800 字重）+ 小号标签（24rpx, Muted）。数字颜色：正数 Ink，负数 Red。
- **Animation:** 积分变化时数字跳动（scale 1 → 1.3 → 1，250ms）。

### Draw Cards
- **Style:** 抽奖宝箱卡片，显示宝箱类型（emoji + 名称）、消耗积分、奖品预览列表。每个奖品用稀有度色标签标记。
- **CTA:** 大号「抽奖」按钮（Accent Blue），积分不足时置灰不可点击。

## 6. Do's and Don'ts

### Do:
- **Do** 使用 emoji 作为图标系统（🎯⚽📚⭐🌟🏅👑🔥🎁🎪🎬🍬🎰💰🌰🌱🌿🌳🌸🌟）
- **Do** 保持白色卡片 + 浅灰背景的经典 iOS 分层
- **Do** 用 Accent Blue 作为全局唯一强调色，不超过屏幕面积的 10%
- **Do** 用绿→蓝渐变进度条表示完成进度
- **Do** 用三个阴影层级（Rest / Raised / Hairline）区分深度
- **Do** 积分数字使用 800 字重，让积分成为视觉主角
- **Do** 卡片按压反馈统一使用 `transform: scale(0.97)` + 0.2s ease

### Don't:
- **Don't** 引入第二套字体家族。SF Pro 一套就够了。
- **Don't** 把 Accent Blue 用作背景色、卡片底色或装饰色
- **Don't** 使用渐变色文字（`background-clip: text`）
- **Don't** 使用 `border-left` / `border-right` 作为彩色侧边条纹装饰卡片
- **Don't** 在非抽奖结果页使用全屏动画或弹跳动效
- **Don't** 使用过于幼稚的卡通插图或绘本风格（家长不会信任）
- **Don't** 引入暗色模式。家庭场景日间使用为主，成长主题天然适合明亮氛围
- **Don't** 给每个区域加一个小标签 eyebrow（「ABOUT」「FEATURES」那种）。中文页面不需要。
- **Don't** 使用 npm 第三方组件库。所有 UI 用微信原生标签实现。
