// Theme constants - migrated from ppgeil/styles/globals.css
// Modern Dark Theme - Discord/Tailwind Inspired

export const colors = {
  // Background colors
  bgPrimary: '#0f172a',      // slate-900
  bgSecondary: '#1e293b',    // slate-800
  bgCard: '#1e293b',         // slate-800
  bgHover: 'rgba(59, 130, 246, 0.1)', // blue hover
  bgElevated: '#334155',     // slate-700

  // Text colors
  textPrimary: '#f8fafc',    // slate-50
  textSecondary: '#e2e8f0',  // slate-200
  textMuted: '#94a3b8',      // slate-400

  // Accent colors
  accentBlue: '#3b82f6',     // blue-500
  accentCyan: '#06b6d4',     // cyan-500
  accentPurple: '#3b82f6',   // blue-500 (aliased)
  accentRed: '#ef4444',      // red-500
  accentGreen: '#10b981',    // emerald-500
  accentOrange: '#f59e0b',   // amber-500
  accentYellow: '#eab308',   // yellow-500

  // Border colors
  borderColor: 'rgba(148, 163, 184, 0.2)', // slate-400 with opacity
  borderLight: 'rgba(148, 163, 184, 0.1)',

  // Difficulty level colors
  difficultyA1: '#10b981',   // emerald-500 (beginner)
  difficultyA2: '#34d399',   // emerald-400
  difficultyB1: '#f59e0b',   // amber-500 (intermediate)
  difficultyB2: '#fb923c',   // orange-400
  difficultyC1: '#f43f5e',   // rose-500 (advanced)
  difficultyC2: '#ef4444',   // red-500

  // Status colors
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Transparent overlays
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
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
  small: 8,
  medium: 12,
  large: 16,
  xl: 24,
  round: 9999, // Fully rounded
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 12,
  },
  hover: {
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
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
