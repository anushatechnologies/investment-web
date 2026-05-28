import { alpha, useTheme } from '@mui/material/styles';
import { Box, Card, Chip, Stack, Typography } from '@mui/material';
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../utils/formatters';

const toneMap = {
  blue: { main: '#2563eb', soft: '#dbeafe' },
  emerald: { main: '#059669', soft: '#d1fae5' },
  violet: { main: '#7c3aed', soft: '#ede9fe' },
  amber: { main: '#d97706', soft: '#fef3c7' },
  rose: { main: '#e11d48', soft: '#ffe4e6' },
  cyan: { main: '#0891b2', soft: '#cffafe' },
};

function StatCard({
  title,
  value,
  change,
  note,
  icon: Icon,
  tone = 'blue',
  valueType = 'number',
  compact = false,
  formatter,
}) {
  const theme = useTheme();
  const colors = toneMap[tone] ?? toneMap.blue;
  const valueFormatter =
    formatter ??
    (valueType === 'currency'
      ? compact
        ? formatCompactCurrency
        : formatCurrency
      : formatNumber);
  const displayValue = typeof value === 'string' ? value : valueFormatter(value);
  const darkMode = false;

  return (
    <Card
      className="glass-card"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: `linear-gradient(135deg, ${alpha(colors.soft, 0.88)} 0%, ${alpha('#ffffff', 0.96)} 55%)`,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -36,
          right: -24,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(colors.main, 0.18)} 0%, transparent 70%)`,
        }}
      />
      <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ p: { xs: 2.5, sm: 3 }, position: 'relative' }}>
        <div>
          <Typography variant="body2" className="theme-card-kicker" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
          <Typography
            variant="h3"
            className="theme-card-value"
            sx={{ mt: 2, fontSize: { xs: 28, sm: 34 }, color: darkMode ? '#fff' : theme.palette.text.primary }}
          >
            {displayValue}
          </Typography>
          {typeof change === 'number' ? (
            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mt: 2 }}>
              <Chip
                size="small"
                label={formatPercent(change)}
                sx={{
                  bgcolor: alpha(change >= 0 ? '#059669' : '#dc2626', 0.12),
                  color: change >= 0 ? '#047857' : '#b91c1c',
                  fontWeight: 800,
                }}
              />
              {note && (
                <Typography variant="body2" className="theme-card-note">
                  {note}
                </Typography>
              )}
            </Stack>
          ) : (
            note && (
              <Typography variant="body2" className="theme-card-note" sx={{ mt: 2 }}>
                {note}
              </Typography>
            )
          )}
        </div>
        {Icon && (
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: 54,
              height: 54,
              borderRadius: '18px',
              bgcolor: alpha(colors.main, 0.12),
              color: colors.main,
              boxShadow: `inset 0 0 0 1px ${alpha(colors.main, 0.12)}`,
              flexShrink: 0,
            }}
          >
            <Icon className="h-5 w-5" />
          </Box>
        )}
      </Stack>
    </Card>
  );
}

export default StatCard;
