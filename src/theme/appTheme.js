import { createTheme } from '@mui/material/styles';

const FONT_FAMILY = '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

const lightPalette = {
  mode: 'light',
  primary: {
    main: '#4f46e5', // Indigo 600
    light: '#818cf8',
    dark: '#3730a3',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#334155', // Slate 700
    light: '#64748b',
    dark: '#0f172a',
    contrastText: '#ffffff',
  },
  success: { main: '#10b981', light: '#34d399', dark: '#047857' },
  warning: { main: '#f59e0b', light: '#fbbf24', dark: '#b45309' },
  error: { main: '#ef4444', light: '#f87171', dark: '#b91c1c' },
  info: { main: '#3b82f6', light: '#60a5fa', dark: '#1d4ed8' },
  background: {
    default: '#f8fafc', // Slate 50
    paper: '#ffffff',
  },
  text: {
    primary: '#0f172a', // Slate 900
    secondary: '#64748b', // Slate 500
    disabled: '#cbd5e1', // Slate 300
  },
  divider: '#e2e8f0', // Slate 200
  action: {
    active: '#475569',
    hover: 'rgba(15, 23, 42, 0.04)',
    selected: 'rgba(79, 70, 229, 0.08)',
    disabled: '#cbd5e1',
    disabledBackground: '#f1f5f9',
  },
};

const darkPalette = {
  mode: 'dark',
  primary: {
    main: '#6366f1', // Indigo 500
    light: '#818cf8',
    dark: '#4f46e5',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#94a3b8', // Slate 400
    light: '#cbd5e1',
    dark: '#475569',
    contrastText: '#ffffff',
  },
  success: { main: '#10b981', light: '#34d399', dark: '#047857' },
  warning: { main: '#f59e0b', light: '#fbbf24', dark: '#b45309' },
  error: { main: '#ef4444', light: '#f87171', dark: '#b91c1c' },
  info: { main: '#3b82f6', light: '#60a5fa', dark: '#1d4ed8' },
  background: {
    default: '#0f172a', // Slate 900
    paper: '#1e293b', // Slate 800
  },
  text: {
    primary: '#f8fafc', // Slate 50
    secondary: '#94a3b8', // Slate 400
    disabled: '#475569', // Slate 600
  },
  divider: '#334155', // Slate 700
  action: {
    active: '#cbd5e1',
    hover: 'rgba(255, 255, 255, 0.04)',
    selected: 'rgba(99, 102, 241, 0.16)',
    disabled: '#475569',
    disabledBackground: '#1e293b',
  },
};

export function getAppTheme(paletteMode) {
  const isDark = paletteMode === 'dark';
  const palette = isDark ? darkPalette : lightPalette;

  return createTheme({
    palette,
    typography: {
      fontFamily: FONT_FAMILY,
      h1: { fontWeight: 800, letterSpacing: '-0.025em', fontFamily: '"Sora", sans-serif' },
      h2: { fontWeight: 800, letterSpacing: '-0.025em', fontFamily: '"Sora", sans-serif' },
      h3: { fontWeight: 700, letterSpacing: '-0.025em', fontFamily: '"Sora", sans-serif' },
      h4: { fontWeight: 700, letterSpacing: '-0.025em', fontFamily: '"Sora", sans-serif' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em', fontFamily: '"Sora", sans-serif' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em', fontFamily: '"Sora", sans-serif' },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          body {
            background-color: ${palette.background.default};
            background-image: none !important;
            color: ${palette.text.primary};
            font-family: ${FONT_FAMILY};
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          ::selection {
            background-color: ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(79, 70, 229, 0.2)'};
            color: ${palette.text.primary};
          }
        `,
      },
      MuiButtonBase: {
        styleOverrides: {
          root: {
            transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1) !important',
            '&:active': {
              transform: 'scale(0.96)',
            },
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            padding: '8px 16px',
            transition: 'all 0.2s ease',
          },
          containedPrimary: {
            backgroundColor: palette.primary.main,
            color: '#fff',
            border: '1px solid transparent',
            boxShadow: isDark 
              ? '0 1px 2px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' 
              : '0 1px 2px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.1)',
            '&:hover': {
              backgroundColor: palette.primary.dark,
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            },
            '&:active': {
              transform: 'scale(0.96) !important',
            }
          },
          outlined: {
            borderColor: palette.divider,
            color: palette.text.primary,
            backgroundColor: palette.background.paper,
            '&:hover': {
              backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc',
              borderColor: isDark ? '#475569' : '#cbd5e1',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: '16px',
            backgroundColor: palette.background.paper,
            backgroundImage: 'none !important',
            border: `1px solid ${palette.divider}`,
            backdropFilter: 'none !important',
            boxShadow: isDark 
              ? '0 10px 40px -10px rgba(0,0,0,0.4) !important' 
              : '0 12px 32px -4px rgba(15,23,42,0.04), 0 4px 12px -4px rgba(15,23,42,0.02) !important',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none !important',
            backdropFilter: 'none !important',
            boxShadow: isDark 
              ? '0 10px 40px -10px rgba(0,0,0,0.4) !important' 
              : '0 12px 32px -4px rgba(15,23,42,0.04), 0 4px 12px -4px rgba(15,23,42,0.02) !important',
          },
          elevation1: {
            boxShadow: isDark 
              ? '0 10px 40px -10px rgba(0,0,0,0.4) !important' 
              : '0 12px 32px -4px rgba(15,23,42,0.04), 0 4px 12px -4px rgba(15,23,42,0.02) !important',
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              backgroundColor: palette.background.paper,
              transition: 'all 0.2s ease',
              '& fieldset': {
                borderColor: palette.divider,
                borderWidth: '1px',
              },
              '&:hover fieldset': {
                borderColor: isDark ? '#64748b' : '#94a3b8',
              },
              '&.Mui-focused fieldset': {
                borderColor: palette.primary.main,
                borderWidth: '2px',
              },
              '&.Mui-focused': {
                boxShadow: `0 0 0 3px ${isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(79, 70, 229, 0.1)'}`,
              }
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '6px',
            fontWeight: 600,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: `1px solid ${palette.divider}`,
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${palette.divider}`,
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(8px)',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontSize: '11px',
            borderBottom: `1px solid ${palette.divider}`,
            color: palette.text.secondary,
          },
          body: {
            borderBottom: `1px solid ${palette.divider}`,
            color: palette.text.primary,
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: '12px',
            border: `1px solid ${palette.divider}`,
          },
        },
      },
    },
  });
}
