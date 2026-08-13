import { useTheme } from '@mui/material/styles';
import { Card, CardContent, Stack, Typography } from '@mui/material';

function SectionCard({ title, subtitle, action, className = '', children }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      elevation={0}
      className={`investor-section-card ${className}`}
      sx={{
        overflow: 'hidden',
        minWidth: 0,
        border: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(148, 163, 184, 0.18)',
        bgcolor: isDark ? 'rgba(11, 19, 41, 0.85)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(14px)',
        boxShadow: isDark
          ? '0 20px 50px rgba(0,0,0,0.3)'
          : '0 20px 50px rgba(15,23,42,0.07)',
        borderRadius: '24px',
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, '&:last-child': { pb: { xs: 2, sm: 2.5 } } }}>
        {(title || action || subtitle) && (
          <Stack
            direction={{ xs: 'row', sm: 'row' }}
            spacing={1.5}
            alignItems="flex-start"
            justifyContent="space-between"
            sx={{ mb: { xs: 1.75, sm: 2.5 }, minWidth: 0 }}
          >
            <div className="min-w-0 flex-1">
              {title && (
                <Typography
                  variant="h5"
                  sx={{
                    fontSize: { xs: 16, sm: 18 },
                    lineHeight: 1.25,
                    fontWeight: 700,
                    color: 'text.primary',
                    overflowWrap: 'anywhere',
                    fontFamily: '"Sora", sans-serif',
                  }}
                >
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography
                  variant="body2"
                  sx={{ mt: 0.5, lineHeight: 1.6, color: 'text.secondary', fontSize: { xs: 12, sm: 13 } }}
                >
                  {subtitle}
                </Typography>
              )}
            </div>
            {action && <div className="flex-shrink-0">{action}</div>}
          </Stack>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

export default SectionCard;
