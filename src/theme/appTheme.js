import { alpha, createTheme } from '@mui/material/styles';

export const getAppTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#2563eb' : '#3b82f6',
      light: '#60a5fa',
      dark: '#1d4ed8',
    },
    secondary: {
      main: mode === 'light' ? '#0f172a' : '#f8fafc',
      light: mode === 'light' ? '#334155' : '#cbd5e1',
      dark: mode === 'light' ? '#020617' : '#475569',
    },
    success: {
      main: mode === 'light' ? '#059669' : '#10b981',
    },
    warning: {
      main: mode === 'light' ? '#d97706' : '#f59e0b',
    },
    error: {
      main: mode === 'light' ? '#dc2626' : '#ef4444',
    },
    background: {
      default: mode === 'light' ? '#f4f7fb' : '#070c17',
      paper: mode === 'light' ? '#ffffff' : '#0b1329',
    },
    text: {
      primary: mode === 'light' ? '#0f172a' : '#f8fafc',
      secondary: mode === 'light' ? '#64748b' : '#94a3b8',
    },
  },
  shape: {
    borderRadius: 24,
  },
  typography: {
    fontFamily: '"Manrope", sans-serif',
    h1: {
      fontFamily: '"Sora", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontFamily: '"Sora", sans-serif',
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontFamily: '"Sora", sans-serif',
      fontWeight: 600,
      letterSpacing: '-0.015em',
    },
    h4: {
      fontFamily: '"Sora", sans-serif',
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 700,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: mode === 'light'
            ? `
              radial-gradient(circle at 15% 15%, rgba(37, 99, 235, 0.10), transparent 22%),
              radial-gradient(circle at 85% 80%, rgba(14, 165, 233, 0.10), transparent 20%),
              linear-gradient(180deg, #f8fbff 0%, #f3f7fb 50%, #edf3f9 100%)
            `
            : `
              radial-gradient(circle at 15% 15%, rgba(59, 130, 246, 0.12), transparent 25%),
              radial-gradient(circle at 85% 80%, rgba(14, 165, 233, 0.10), transparent 22%),
              linear-gradient(180deg, #070c17 0%, #0c1527 50%, #030712 100%)
            `,
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 24,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          border: mode === 'light' ? '1px solid rgba(148, 163, 184, 0.18)' : '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: mode === 'light' ? '0 24px 60px rgba(15, 23, 42, 0.08)' : '0 24px 60px rgba(0, 0, 0, 0.35)',
          backgroundImage: mode === 'light'
            ? 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,255,255,0.9))'
            : 'linear-gradient(180deg, rgba(11, 19, 41, 0.95), rgba(11, 19, 41, 0.85))',
          backdropFilter: 'blur(14px)',
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 18,
          paddingInline: 18,
          paddingBlock: 10,
        },
        containedPrimary: {
          boxShadow: mode === 'light' ? '0 16px 30px rgba(37, 99, 235, 0.22)' : '0 16px 30px rgba(59, 130, 246, 0.15)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          fontWeight: 700,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'medium',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          backgroundColor: mode === 'light' ? alpha('#ffffff', 0.88) : alpha('#070c17', 0.65),
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'light' ? 'rgba(148, 163, 184, 0.24)' : 'rgba(255, 255, 255, 0.08)',
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          border: mode === 'light' ? '1px solid rgba(148, 163, 184, 0.16)' : '1px solid rgba(255, 255, 255, 0.06)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: mode === 'light' ? '#64748b' : '#94a3b8',
          borderBottomColor: mode === 'light' ? 'rgba(148, 163, 184, 0.18)' : 'rgba(255, 255, 255, 0.08)',
        },
        body: {
          borderBottomColor: mode === 'light' ? 'rgba(226, 232, 240, 0.9)' : 'rgba(255, 255, 255, 0.04)',
          color: mode === 'light' ? '#0f172a' : '#cbd5e1',
        },
      },
    },
  },
});
