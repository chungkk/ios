// Theme constants - migrated from ppgeil/styles/globals.css
// Neo-Retro Theme - 80s Inspired with Bold Colors

export const colors = {
  // Neo-Retro Background colors
  bgPrimary: '#2d3436',      // Retro dark gray
  bgSecondary: '#3d4448',    // Lighter gray
  bgCard: '#ffffff',         // White cards (retro style)
  bgHover: 'rgba(0, 206, 201, 0.2)', // Cyan hover
  bgElevated: '#4a5156',     // Elevated surface
  bgCream: '#FFF8E7',        // Retro cream (for cards)

  // Neo-Retro Text colors
  textPrimary: '#2d3436',    // Dark text on light cards
  textSecondary: '#636e72',  // Gray text
  textMuted: '#b2bec3',      // Muted text
  textLight: '#fef9e7',      // Light text for dark backgrounds
  textOnDark: '#fef9e7',     // Text on dark backgrounds

  // Neo-Retro Accent Colors (Bold & Vibrant)
  accentBlue: '#74b9ff',     // Soft blue
  accentCyan: '#00cec9',     // Teal/Cyan - Primary accent
  accentPurple: '#a29bfe',   // Soft purple
  accentRed: '#ff6b35',      // Retro coral/orange
  accentGreen: '#00b894',    // Mint green
  accentOrange: '#ff6b35',   // Coral orange
  accentYellow: '#FFE66D',   // Retro yellow
  accentPink: '#FF8ED4',     // Retro pink
  accentCoral: '#FF6B6B',    // Coral red

  // Neo-Retro specific colors
  retroCoral: '#FF6B6B',
  retroCyan: '#4ECDC4',
  retroYellow: '#FFE66D',
  retroPink: '#FF8ED4',
  retroPurple: '#A855F7',
  retroCream: '#FFF8E7',
  retroDark: '#2D3436',
  retroBorder: '#1a1a2e',
  retroShadow: '#1a1a2e',

  // Border colors (bold for retro look)
  borderColor: '#1a1a2e',    // Dark border
  borderLight: 'rgba(254, 249, 231, 0.2)',

  // Difficulty level colors - Vibrant Neo-Retro
  difficultyA1: '#4ECDC4',   // Cyan (beginner)
  difficultyA2: '#7FDBDA',   // Light cyan
  difficultyB1: '#FFE66D',   // Yellow (intermediate)
  difficultyB2: '#FF6B6B',   // Coral
  difficultyC1: '#FF8ED4',   // Pink (advanced)
  difficultyC2: '#A855F7',   // Purple

  // Status colors
  success: '#00b894',        // Mint green
  warning: '#FFE66D',        // Yellow
  error: '#FF6B6B',          // Coral
  info: '#74b9ff',           // Blue

  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Gradient colors
  gradientStart: '#00cec9',
  gradientEnd: '#ff6b35',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  small: 4,        // Sharper edges for retro look
  medium: 8,
  large: 16,
  xl: 20,
  round: 30,       // Rounded buttons
  full: 9999,      // Fully rounded
};

// Neo-Retro shadows - Bold offset shadows instead of blur
export const shadows = {
  sm: {
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 3,
  },
  md: {
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 5,
  },
  lg: {
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 0,
    elevation: 6,
  },
  xl: {
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 8,
  },
  hover: {
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 8, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 0,
    elevation: 8,
  },
  // Pressed/Active state - smaller shadow
  pressed: {
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 2,
  },
};

// iOS safe area insets (will be overridden by SafeAreaView)
export const safeArea = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

// Touch target minimum size (Apple HIG: 44x44px)
export const touchTarget = {
  minHeight: 44,
  minWidth: 44,
};

// Default theme export
export const theme = {
  colors,
  spacing,
  borderRadius,
  shadows,
  safeArea,
  touchTarget,
};

export default theme;
