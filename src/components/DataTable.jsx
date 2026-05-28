import { useDeferredValue, useState } from 'react';
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

  return (
    <Card className="glass-card" sx={{ p: { xs: 2.5, sm: 3 } }}>
      <Stack
        direction={{ xs: 'column', lg: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', lg: 'flex-end' }}
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <div>
          <Typography variant="h5" className="theme-panel-title" sx={{ fontSize: { xs: 20, sm: 22 } }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" className="theme-panel-subtitle" sx={{ mt: 1 }}>
              {description}
            </Typography>
          )}
        </div>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', lg: 'auto' } }}>
          {filterKey && filterOptions.length > 0 && (
            <FormControl sx={{ minWidth: 170 }}>
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
          {actions.map((action) => (
            <ActionButton key={action.label} action={action} />
          ))}
        </Stack>
      </Stack>

      <Box sx={{ mb: 3, maxWidth: 460 }}>
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

      <TableContainer className="table-wrap">
        <Table className="min-w-full">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column.key}>{column.label}</TableCell>
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
                    <TableCell key={column.key}>
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
        />
      </Stack>
    </Card>
  );
}

export default DataTable;
