import { alpha, useTheme } from '@mui/material/styles';
import { Box, Card, Chip, Stack, Typography } from '@mui/material';
import {
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPercent,
} from '../utils/formatters';

const toneMap = {
  blue:    { main: '#2563eb', soft: '#dbeafe', darkMain: '#3b82f6', darkSoft: 'rgba(59,130,246,0.15)' },
  emerald: { main: '#059669', soft: '#d1fae5', darkMain: '#10b981', darkSoft: 'rgba(16,185,129,0.15)' },
  violet:  { main: '#7c3aed', soft: '#ede9fe', darkMain: '#a78bfa', darkSoft: 'rgba(167,139,250,0.15)' },
  amber:   { main: '#d97706', soft: '#fef3c7', darkMain: '#f59e0b', darkSoft: 'rgba(245,158,11,0.15)' },
  rose:    { main: '#e11d48', soft: '#ffe4e6', darkMain: '#fb7185', darkSoft: 'rgba(251,113,133,0.15)' },
  cyan:    { main: '#0891b2', soft: '#cffafe', darkMain: '#22d3ee', darkSoft: 'rgba(34,211,238,0.15)' },
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
  const isDark = theme.palette.mode === 'dark';
  const colors = toneMap[tone] ?? toneMap.blue;
  const mainColor = isDark ? colors.darkMain : colors.main;
  const softColor = isDark ? colors.darkSoft : colors.soft;

  const valueFormatter =
    formatter ??
    (valueType === 'currency'
      ? compact
        ? formatCompactCurrency
        : formatCurrency
      : formatNumber);
  const displayValue = typeof value === 'string' ? value : valueFormatter(value);

  return (
    <Card
      elevation={0}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        minWidth: 0,
        border: '1px solid',
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : alpha(colors.main, 0.12),
        backgroundImage: isDark
          ? `linear-gradient(135deg, ${softColor} 0%, rgba(11,19,41,0.92) 55%)`
          : `linear-gradient(135deg, ${alpha(colors.soft, 0.88)} 0%, ${alpha('#ffffff', 0.96)} 55%)`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDark
            ? `0 16px 40px ${alpha(mainColor, 0.2)}`
            : `0 16px 40px ${alpha(mainColor, 0.15)}`,
        },
      }}
    >
      {/* Decorative glow blob */}
      <Box
        sx={{
          position: 'absolute',
          top: -30,
          right: -20,
          width: 110,
          height: 110,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(mainColor, isDark ? 0.25 : 0.18)} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <Stack
        direction="row"
        justifyContent="space-between"
        spacing={{ xs: 1.5, sm: 2 }}
        sx={{ p: { xs: 2, sm: 2.5 }, position: 'relative', minWidth: 0 }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              fontSize: { xs: 11, sm: 12 },
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: isDark ? alpha(mainColor, 0.85) : mainColor,
            }}
          >
            {title}
          </Typography>
          <Typography
            variant="h3"
            sx={{
              mt: { xs: 1, sm: 1.5 },
              fontSize: { xs: 22, sm: 30 },
              lineHeight: 1.12,
              fontWeight: 700,
              color: 'text.primary',
              overflowWrap: 'anywhere',
              fontFamily: '"Sora", sans-serif',
            }}
          >
            {displayValue}
          </Typography>
          {typeof change === 'number' ? (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
              <Chip
                size="small"
                label={formatPercent(change)}
                sx={{
                  bgcolor: alpha(change >= 0 ? '#059669' : '#dc2626', isDark ? 0.2 : 0.12),
                  color: change >= 0
                    ? (isDark ? '#34d399' : '#047857')
                    : (isDark ? '#fb7185' : '#b91c1c'),
                  fontWeight: 800,
                  fontSize: 11,
                  height: 22,
                }}
              />
              {note && (
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: 12, lineHeight: 1.45 }}>
                  {note}
                </Typography>
              )}
            </Stack>
          ) : (
            note && (
              <Typography
                variant="body2"
                sx={{ mt: { xs: 1, sm: 1.5 }, lineHeight: 1.45, color: 'text.secondary', fontSize: 12 }}
              >
                {note}
              </Typography>
            )
          )}
        </Box>

        {Icon && (
          <Box
            sx={{
              display: 'grid',
              placeItems: 'center',
              width: { xs: 40, sm: 50 },
              height: { xs: 40, sm: 50 },
              borderRadius: { xs: '13px', sm: '16px' },
              bgcolor: alpha(mainColor, isDark ? 0.18 : 0.12),
              color: mainColor,
              boxShadow: `inset 0 0 0 1px ${alpha(mainColor, 0.15)}`,
              flexShrink: 0,
              alignSelf: 'flex-start',
            }}
          >
            <Icon size={18} strokeWidth={2} />
          </Box>
        )}
      </Stack>
    </Card>
  );
}

export default StatCard;
