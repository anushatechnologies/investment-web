import { Bell, BriefcaseBusiness, Home, Share2, Target, Wallet } from 'lucide-react';
import { Box, Paper } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

const mobileNavItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Invest', path: '/investments', icon: BriefcaseBusiness },
  { label: 'Goals', path: '/watchlist', icon: Target },
  { label: 'Wallet', path: '/wallet', icon: Wallet },
  { label: 'Referral', path: '/referral-network', icon: Share2 },
  { label: 'Alerts', path: '/notifications', icon: Bell },
];

function MobileInvestorNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <Box
      sx={{
        display: { xs: 'block', lg: 'none' },
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1250,
        px: 1.5,
        pb: 'calc(env(safe-area-inset-bottom, 0px) + 10px)',
        pointerEvents: 'none',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          pointerEvents: 'auto',
          borderRadius: '16px',
          border: '1px solid',
          borderColor: (theme) =>
            theme.palette.mode === 'light'
              ? '#e2e8f0'
              : '#334155',
          overflow: 'hidden',
          bgcolor: (theme) =>
            theme.palette.mode === 'light'
              ? '#ffffff'
              : '#0f172a',
          boxShadow: (theme) =>
            theme.palette.mode === 'light'
              ? '0 -4px 12px rgba(0,0,0,0.05)'
              : 'none',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'stretch',
            height: 66,
            px: 0.5,
          }}
        >
          {mobileNavItems.map(({ label, path, icon: Icon }) => {
            const isActive = pathname === path || (path !== '/' && pathname.startsWith(path));
            return (
              <Box
                key={path}
                component="button"
                onClick={() => navigate(path)}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderRadius: '18px',
                  mx: 0.25,
                  py: 1,
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  '&:active': {
                    transform: 'scale(0.92)',
                  },
                }}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 6,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 28,
                      height: 28,
                      borderRadius: '10px',
                      bgcolor: 'primary.main',
                      opacity: 0.12,
                    }}
                  />
                )}
                <Box
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    color: isActive ? 'primary.main' : 'text.secondary',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={isActive ? 20 : 19} strokeWidth={isActive ? 2.5 : 1.8} />
                </Box>
                <Box
                  component="span"
                  sx={{
                    fontSize: '9.5px',
                    fontWeight: isActive ? 800 : 600,
                    letterSpacing: '0.02em',
                    lineHeight: 1,
                    color: isActive ? 'primary.main' : 'text.secondary',
                    whiteSpace: 'nowrap',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {label}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}

export default MobileInvestorNav;
