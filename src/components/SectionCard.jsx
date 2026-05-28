import { Card, CardContent, Stack, Typography } from '@mui/material';

function SectionCard({ title, subtitle, action, className = '', children }) {
  return (
    <Card className={`glass-card ${className}`} sx={{ overflow: 'hidden' }}>
      <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
        {(title || action || subtitle) && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'flex-start' }}
            justifyContent="space-between"
            sx={{ mb: 3 }}
          >
            <div>
              {title && (
                <Typography variant="h5" className="theme-panel-title" sx={{ fontSize: { xs: 20, sm: 22 } }}>
                  {title}
                </Typography>
              )}
              {subtitle && (
                <Typography className="theme-panel-subtitle" variant="body2" sx={{ mt: 1 }}>
                  {subtitle}
                </Typography>
              )}
            </div>
            {action}
          </Stack>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

export default SectionCard;
