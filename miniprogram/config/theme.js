module.exports = {
  colors: {
    // === Duolingo ABC 风格色板 ===
    primary:      '#58CC02',
    primaryDark:  '#46A800',

    blue:         '#1CB0F6',
    blueDark:     '#1498D4',

    green:        '#58CC02',
    greenDark:    '#46A800',

    orange:       '#FF9600',
    orangeDark:   '#E08800',

    purple:       '#A85CFF',
    purpleDark:   '#8A3DE8',

    yellow:       '#FFC800',
    yellowDark:   '#E0B000',

    pink:         '#FF6BC1',

    red:          '#FF4B4B',
    redDark:      '#E03A3A',

    // 兼容旧引用
    systemBlue:   '#1CB0F6',
    systemGreen:  '#58CC02',
    systemOrange: '#FF9600',
    systemRed:    '#FF4B4B',
    systemTeal:   '#1CB0F6',
    systemPurple: '#A85CFF',
    systemYellow: '#FFC800',
    systemPink:   '#FF6BC1',

    // === 背景系统 ===
    background:       '#EAF5FA',
    backgroundWarm:   '#FFFBF5',
    backgroundBlue:   '#F5FAFF',
    backgroundCard:   '#FFFFFF',
    backgroundWhite:  '#FFFFFF',

    // === 文字 ===
    textPrimary:    '#3C3C3C',
    textSecondary:  '#A0A0A0',
    textTertiary:   '#CFCFCF',
    textQuaternary: '#E0E0E0',

    // === 分割线 ===
    separator:       '#E8E8E8',
    separatorOpaque: '#E8E8E8',

    // === 分类色 ===
    category: {
      sport: '#1CB0F6',
      life:  '#58CC02',
      study: '#FF9600'
    },

    // === 稀有度色 ===
    rarity: {
      common:    '#A0A0A0',
      rare:      '#1CB0F6',
      epic:      '#A85CFF',
      legendary: '#FFC800'
    },

    rarityBg: {
      common:    '#F5F5F5',
      rare:      '#EEF8FF',
      epic:      '#F6EEFF',
      legendary: '#FFF9E8'
    }
  },

  radius: {
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    full: 999
  },

  shadow: {
    card:     '0 4px 0 rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
    elevated: '0 6px 0 rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
    navBar:   '0 1px 0 rgba(0,0,0,0.06)',
    glow: {
      green:   '0 4px 16px rgba(88,204,2,0.25), 0 2px 4px rgba(88,204,2,0.12)',
      blue:    '0 4px 16px rgba(28,176,246,0.25), 0 2px 4px rgba(28,176,246,0.12)',
      orange:  '0 4px 16px rgba(255,150,0,0.25), 0 2px 4px rgba(255,150,0,0.12)',
      purple:  '0 4px 16px rgba(168,92,255,0.25), 0 2px 4px rgba(168,92,255,0.12)',
      yellow:  '0 4px 16px rgba(255,200,0,0.25), 0 2px 4px rgba(255,200,0,0.12)'
    }
  },

  gradients: {
    primary:      'linear-gradient(135deg, #46A800 0%, #58CC02 100%)',
    blue:         'linear-gradient(135deg, #1498D4 0%, #1CB0F6 100%)',
    orange:       'linear-gradient(135deg, #E08800 0%, #FF9600 100%)',
    purple:       'linear-gradient(135deg, #8A3DE8 0%, #A85CFF 100%)',
    yellow:       'linear-gradient(135deg, #E0B000 0%, #FFC800 100%)',
    progress:     'linear-gradient(90deg, #58CC02 0%, #1CB0F6 100%)',
    progressGold: 'linear-gradient(90deg, #FF9600 0%, #FFC800 100%)',
    welcome:      'linear-gradient(135deg, #EEF8FF 0%, #F6EEFF 100%)',
    streak:       'linear-gradient(135deg, #FFF9E8 0%, #FFE8C0 100%)'
  },

  spacing: {
    page: 32,
    card: 24,
    element: 16,
    tight: 8
  },

  fontSize: {
    display: 48,
    largeTitle: 36,
    title1: 32,
    title2: 30,
    body: 28,
    callout: 26,
    caption: 26,
    small: 24
  },

  fontWeight: {
    heavy: '800',
    bold: '700',
    semibold: '600',
    medium: '500',
    regular: '400'
  },

  blur: {
    navBar: 'blur(20px)',
    overlay: 'blur(10px)'
  },

  navBarHeight: 88,
  tabBarHeight: 98
};
