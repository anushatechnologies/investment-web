import { useDeferredValue, useState } from 'react';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
  Card,
  FormControl,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

function ActionButton({ action }) {
  const Icon = action.icon;
  const colorMap = {
    primary: 'primary',
    secondary: 'inherit',
    danger: 'error',
  };

  return (
    <Button
      type="button"
      variant={action.variant === 'primary' ? 'contained' : 'outlined'}
      color={colorMap[action.variant] ?? 'inherit'}
      onClick={action.onClick}
      startIcon={Icon ? <Icon className="h-4 w-4" /> : null}
      sx={{ borderRadius: '16px' }}
    >
      {action.label}
    </Button>
  );
}

function DataTable({
  title,
  description,
  data,
  columns,
  searchableKeys = [],
  searchPlaceholder = 'Search...',
  filterKey,
  filterOptions = [],
  actions = [],
  emptyMessage = 'No matching records found.',
  itemsPerPage = 20,
  enableCsvExport = false,
  exportFileName,
  exportButtonLabel = 'Export CSV',
}) {
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());

  const filteredRows = data.filter((row) => {
    const matchesSearch =
      !deferredQuery ||
      searchableKeys.some((key) =>
        String(row[key] ?? '')
          .toLowerCase()
          .includes(deferredQuery),
      );

    const matchesFilter =
      !filterKey || selectedFilter === 'All' || String(row[filterKey]) === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / itemsPerPage));
  const paginatedRows = filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportColumns = columns.filter(
    (column) => !column.excludeFromExport && column.key !== 'action' && column.key !== 'actions',
  );

  const resolveExportValue = (column, row) => {
    const value = column.exportValue ? column.exportValue(row) : row[column.key];

    if (value == null) return '';
    if (Array.isArray(value)) return value.join('; ');
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const toCsvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

  const handleExportCsv = () => {
    const headers = exportColumns.map((column) => column.label);
    const rows = filteredRows.map((row) => exportColumns.map((column) => resolveExportValue(column, row)));
    const csv = [headers, ...rows].map((row) => row.map(toCsvCell).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (exportFileName || title || 'table-export')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    link.href = url;
    link.download = `${safeTitle || 'table-export'}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="glass-card investor-data-table" sx={{ p: { xs: 2, sm: 3 }, minWidth: 0 }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={{ xs: 1.5, sm: 2 }}
        alignItems={{ xs: 'flex-start', lg: 'flex-end' }}
        justifyContent="space-between"
        sx={{ mb: { xs: 2, sm: 3 }, minWidth: 0 }}
      >
        <div className="min-w-0">
          <Typography variant="h5" className="theme-panel-title" sx={{ fontSize: { xs: 18, sm: 22 }, lineHeight: 1.2, overflowWrap: 'anywhere' }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" className="theme-panel-subtitle" sx={{ mt: 1, lineHeight: 1.6 }}>
              {description}
            </Typography>
          )}
        </div>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ width: { xs: '100%', lg: 'auto' } }}>
          {filterKey && filterOptions.length > 0 && (
            <FormControl sx={{ minWidth: { xs: '100%', sm: 170 } }}>
              <Select
                value={selectedFilter}
                onChange={(event) => {
                  setSelectedFilter(event.target.value);
                  setCurrentPage(1);
                }}
                size="small"
              >
                <MenuItem value="All">All</MenuItem>
                {filterOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {enableCsvExport && (
            <Button
              type="button"
              variant="outlined"
              onClick={handleExportCsv}
              startIcon={<DownloadRoundedIcon fontSize="small" />}
              sx={{ borderRadius: '16px' }}
            >
              {exportButtonLabel}
            </Button>
          )}
          {actions.map((action) => (
            <ActionButton key={action.label} action={action} />
          ))}
        </Stack>
      </Stack>

      <Box sx={{ mb: { xs: 2, sm: 3 }, maxWidth: { xs: '100%', sm: 460 } }}>
        <TextField
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setCurrentPage(1);
          }}
          fullWidth
          placeholder={searchPlaceholder}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box className="mobile-card-list" sx={{ display: { xs: 'grid', md: 'none' }, gap: 1.25 }}>
        {paginatedRows.length > 0 ? (
          paginatedRows.map((row) => (
            <Box
              key={row.id ?? row.name}
              sx={{
                border: '1px solid',
                borderColor: (theme) =>
                  theme.palette.mode === 'light'
                    ? 'rgba(226,232,240,0.9)'
                    : 'rgba(255,255,255,0.07)',
                bgcolor: (theme) =>
                  theme.palette.mode === 'light'
                    ? 'rgba(248,250,252,0.95)'
                    : 'rgba(15,23,42,0.65)',
                borderRadius: '18px',
                overflow: 'hidden',
              }}
            >
              {columns.slice(0, 5).map((column, colIdx) => (
                <Stack
                  key={column.key}
                  direction="row"
                  spacing={1.25}
                  justifyContent="space-between"
                  alignItems="flex-start"
                  sx={{
                    px: 2,
                    py: 1.25,
                    borderBottom: colIdx < Math.min(4, columns.length - 1) ? '1px solid' : 'none',
                    borderColor: (theme) =>
                      theme.palette.mode === 'light'
                        ? 'rgba(226,232,240,0.6)'
                        : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontWeight: 700,
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      minWidth: 90,
                      pt: 0.25,
                    }}
                  >
                    {column.label}
                  </Typography>
                  <Box
                    sx={{
                      textAlign: 'right',
                      minWidth: 0,
                      fontSize: 13,
                      fontWeight: 600,
                      overflowWrap: 'anywhere',
                      color: 'text.primary',
                    }}
                  >
                    {column.render ? column.render(row) : row[column.key]}
                  </Box>
                </Stack>
              ))}
            </Box>
          ))
        ) : (
          <Box sx={{ py: 6, textAlign: 'center', color: 'text.secondary', fontSize: 14 }}>{emptyMessage}</Box>
        )}
      </Box>

      <TableContainer className="table-wrap" sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <Table className="min-w-full" sx={{ minWidth: { xs: 720, md: '100%' } }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key} className="table-header-cell" sx={{ color: 'text.secondary' }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length > 0 ? (
              paginatedRows.map((row) => (
                <TableRow
                  key={row.id ?? row.name}
                  hover
                  sx={{
                    '&:last-child td': { borderBottom: 'none' },
                  }}
                >
                  {columns.map((column) => (
                    <TableCell key={column.key} className="table-cell" sx={{ color: 'text.primary', verticalAlign: 'top' }}>
                      {column.render ? column.render(row) : row[column.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        sx={{ mt: 3 }}
      >
        <Typography variant="body2" className="theme-panel-subtitle">
          Showing {paginatedRows.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredRows.length)} of {filteredRows.length} entries
        </Typography>
        <Pagination
          page={currentPage}
          count={totalPages}
          onChange={(_, page) => setCurrentPage(page)}
          color="primary"
          shape="rounded"
          size="small"
        />
      </Stack>
    </Card>
  );
}

export default DataTable;
