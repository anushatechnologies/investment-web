import { useDeferredValue, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

function ActionButton({ action }) {
  const Icon = action.icon;
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
  };

  return (
    <button
      type="button"
      onClick={action.onClick}
      className={variants[action.variant] ?? variants.secondary}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <span>{action.label}</span>
    </button>
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
    <div className="glass-card p-5 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="theme-panel-title font-heading text-xl font-semibold text-slate-900">
            {title}
          </h3>
          {description && (
            <p className="theme-panel-subtitle mt-2 text-sm text-slate-500">{description}</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {filterKey && filterOptions.length > 0 && (
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
                <ChevronDown className="h-4 w-4 rotate-90" />
              </span>
              <select
                value={selectedFilter}
                onChange={(event) => { setSelectedFilter(event.target.value); setCurrentPage(1); }}
                className="input-shell min-w-[160px] appearance-none pl-11 pr-10"
              >
                <option value="All">All</option>
                {filterOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                <ChevronDown className="h-4 w-4" />
              </span>
            </div>
          )}
          {actions.map((action) => (
            <ActionButton key={action.label} action={action} />
          ))}
        </div>
      </div>

      <div className="mb-5 max-w-xl">
        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            value={query}
            onChange={(event) => { setQuery(event.target.value); setCurrentPage(1); }}
            className="input-shell pl-11"
            placeholder={searchPlaceholder}
          />
        </label>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((column) => (
                  <th key={column.key} className="table-header-cell">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row) => (
                  <tr key={row.id ?? row.name} className="hover:bg-slate-50/80">
                    {columns.map((column) => (
                      <td key={column.key} className="table-cell">
                        {column.render ? column.render(row) : row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-5 py-12 text-center text-sm text-slate-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="theme-panel-subtitle mt-5 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Showing {paginatedRows.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredRows.length)} of {filteredRows.length} entries
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="h-10 px-3 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-sm font-semibold transition admin-theme:border-white/10 admin-theme:bg-slate-900 admin-theme:text-slate-300"
          >
            Prev
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => setCurrentPage(page)}
              className={`h-10 w-10 rounded-2xl border text-sm font-semibold transition ${
                page === currentPage
                  ? 'border-blue-600 bg-blue-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 admin-theme:border-white/10 admin-theme:bg-slate-900 admin-theme:text-slate-300'
              }`}
            >
              {page}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="h-10 px-3 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 text-sm font-semibold transition admin-theme:border-white/10 admin-theme:bg-slate-900 admin-theme:text-slate-300"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
