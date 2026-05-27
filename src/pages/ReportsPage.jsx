import { AlertTriangle, Download, FileText, Pencil, Plus, TrendingUp, X } from 'lucide-react';
import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { auditTrail, reportPerformanceData, reportStats, scheduledReports } from '../data/adminData';
import { formatCompactCurrency, formatCurrency, formatShortTick } from '../utils/formatters';

const statIcons = [FileText, Download, AlertTriangle, TrendingUp];
const statTones = ['blue', 'emerald', 'violet', 'amber'];

function ReportsPage() {
  const [reports, setReports] = useState(scheduledReports);
  const [message, setMessage] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editReportName, setEditReportName] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    frequency: 'Daily',
    nextRun: '',
    format: 'CSV',
    status: 'Scheduled',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveReport = (e) => {
    e.preventDefault();
    if (editReportName) {
      setReports(reports.map(r => r.name === editReportName ? { ...r, ...formData } : r));
    } else {
      setReports([formData, ...reports]);
    }
    setIsModalOpen(false);
    setEditReportName(null);
    setMessage(`Successfully saved schedule for "${formData.name}".`);
  };

  const handleEditClick = (row) => {
    setFormData({
      name: row.name,
      frequency: row.frequency,
      nextRun: row.nextRun,
      format: row.format,
      status: row.status,
    });
    setEditReportName(row.name);
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setFormData({
      name: '',
      frequency: 'Daily',
      nextRun: '15 May 2026, 09:00 AM',
      format: 'CSV',
      status: 'Scheduled',
    });
    setEditReportName(null);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8,Month,Revenue,Investments\n" + 
      reportPerformanceData.map(e => `${e.month},${e.revenue},${e.investments}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "performance_snapshot.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setMessage("Successfully exported performance snapshot as CSV.");
  };

  const handleGeneratePDF = () => {
    window.print();
    setMessage("Triggered browser print/PDF export dialog.");
  };

  const scheduledColumns = [
    { key: 'name', label: 'Report Name' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'nextRun', label: 'Next Run' },
    { key: 'format', label: 'Format' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <button
          type="button"
          onClick={() => handleEditClick(row)}
          className="text-slate-400 transition hover:text-blue-500"
        >
          <Pencil className="h-4 w-4" />
        </button>
      ),
    },
  ];

  const auditColumns = [
    { key: 'event', label: 'Event' },
    { key: 'owner', label: 'Owner' },
    { key: 'date', label: 'Date' },
    { key: 'channel', label: 'Channel' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-gold-soft">
          Reporting and audit exports
        </p>
        <h1 className="section-title mt-3">Reports</h1>
        <p className="section-copy mt-3 max-w-3xl">
          Generate investor, revenue, referral, and compliance reports with a dashboard-ready view
          of exports and audit history.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {reportStats.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            note={stat.note}
            icon={statIcons[index]}
            tone={statTones[index]}
            valueType={index === 3 ? 'currency' : 'number'}
          />
        ))}
      </div>

      <SectionCard
        title="Performance Snapshot"
        subtitle="Compare revenue and total invested amount trends across recent months."
        action={
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="btn-secondary"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleGeneratePDF}
              className="btn-primary"
            >
              <FileText className="h-4 w-4" />
              Generate PDF
            </button>
          </div>
        }
      >
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reportPerformanceData}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
              <XAxis dataKey="month" stroke="#64748b" tickLine={false} axisLine={false} />
              <YAxis
                stroke="#64748b"
                tickLine={false}
                axisLine={false}
                tickFormatter={formatShortTick}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === 'revenue' ? formatCurrency(value) : formatCompactCurrency(value),
                  name === 'revenue' ? 'Revenue' : 'Invested amount',
                ]}
                contentStyle={{
                  background: 'rgba(7, 17, 38, 0.95)',
                  border: '1px solid rgba(148, 163, 184, 0.18)',
                  borderRadius: '18px',
                }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#3b82f6' }}
              />
              <Line
                type="monotone"
                dataKey="investments"
                stroke="#f7b500"
                strokeWidth={3}
                dot={{ r: 4, fill: '#f7b500' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>
      
      {message && <p className="text-sm text-emerald-400 font-medium">{message}</p>}

      <DataTable
        title="Scheduled Reports"
        description="Monitor delivery cadence for operational and compliance report exports."
        data={reports}
        columns={scheduledColumns}
        searchableKeys={['name', 'frequency', 'format']}
        searchPlaceholder="Search scheduled reports..."
        filterKey="status"
        filterOptions={['Scheduled', 'Active', 'Under Review']}
        itemsPerPage={20}
        actions={[{ label: 'Schedule Report', icon: Plus, variant: 'primary', onClick: handleAddClick }]}
      />

      <DataTable
        title="Audit Trail"
        description="Recent report-related actions and delivery events across admin teams."
        data={auditTrail}
        columns={auditColumns}
        searchableKeys={['event', 'owner', 'channel']}
        searchPlaceholder="Search audit events..."
        filterKey="status"
        filterOptions={['Completed', 'Pending']}
        itemsPerPage={20}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md overflow-hidden border border-white/10 bg-[#08152f]">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              <h3 className="font-heading text-lg font-semibold text-white">{editReportName ? 'Configure Schedule' : 'New Schedule'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveReport} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Report Name</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} disabled={!!editReportName} className="input-shell w-full disabled:opacity-50" placeholder="e.g. Daily revenue extract" />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Frequency</label>
                  <select name="frequency" value={formData.frequency} onChange={handleInputChange} className="input-shell w-full appearance-none">
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">Next Run Schedule</label>
                  <input required name="nextRun" value={formData.nextRun} onChange={handleInputChange} className="input-shell w-full" placeholder="e.g. 15 May 2026, 09:00 AM" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Format</label>
                    <select name="format" value={formData.format} onChange={handleInputChange} className="input-shell w-full appearance-none">
                      <option value="CSV">CSV</option>
                      <option value="XLSX">XLSX</option>
                      <option value="PDF">PDF</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-300">Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="input-shell w-full appearance-none">
                      <option value="Scheduled">Scheduled</option>
                      <option value="Active">Active</option>
                      <option value="Under Review">Under Review</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editReportName ? 'Save Schedule' : 'Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReportsPage;
