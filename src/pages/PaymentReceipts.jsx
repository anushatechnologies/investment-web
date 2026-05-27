import { CheckCheck, FileText, Receipt, ShieldCheck, UploadCloud, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getOwnInvestments, uploadPaymentReceipt } from '../services/api';
import { formatCurrency } from '../utils/formatters';

function ReceiptPreview({ url, method }) {
  if (!url) return <span className="text-sm text-slate-400">No Receipt</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex h-14 w-12 flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50 p-2 text-[7px] font-bold uppercase tracking-[0.2em] text-slate-600 transition-colors hover:border-blue-400 hover:bg-blue-50">
      <span>{String(method || '').toUpperCase().includes('UPI') ? 'UPI' : 'BANK'}</span>
      <div className="space-y-1">
        <div className="h-[2px] rounded bg-blue-300" />
        <div className="h-[2px] rounded bg-blue-300" />
        <div className="h-[2px] w-3/4 rounded bg-blue-300" />
      </div>
    </a>
  );
}

function PaymentReceipts() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [form, setForm] = useState({
    investmentId: '',
    paymentAmount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'Bank Transfer',
    bankReference: '',
    receiptFile: null,
  });

  const loadData = () => {
    setLoading(true);
    getOwnInvestments()
      .then((res) => {
        const list = res?.investments || res?.data || res || [];
        setInvestments(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalReceipts = investments.filter(i => i.paymentReceiptUrl).length;
  const verifiedReceipts = investments.filter(i => i.paymentReceiptUrl && i.status === 'Active').length;
  const pendingReceipts = investments.filter(i => i.paymentReceiptUrl && (i.status === 'Pending' || i.status === 'Payment Under Review')).length;
  const latestAmount = investments.filter(i => i.paymentReceiptUrl).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.investmentAmount || 0;

  const stats = [
    { title: 'Total Receipts', value: totalReceipts, icon: Receipt, tone: 'blue', note: 'uploaded receipts' },
    { title: 'Verified Receipts', value: verifiedReceipts, icon: CheckCheck, tone: 'emerald', note: 'cleared successfully' },
    { title: 'Pending Review', value: pendingReceipts, icon: ShieldCheck, tone: 'amber', note: 'under verification' },
    { title: 'Latest Payment', value: latestAmount, icon: FileText, tone: 'violet', valueType: 'currency', note: 'most recent upload' },
  ];

  const pendingInvestments = investments.filter(i => i.status === 'Pending' || i.status === 'Pending Payment');

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    if (!form.investmentId) return setUploadError('Please select an investment plan.');
    if (!form.receiptFile) return setUploadError('Please select a receipt file.');
    if (!form.paymentAmount) return setUploadError('Please enter the payment amount.');

    setUploading(true);
    try {
      await uploadPaymentReceipt({
        investmentId: form.investmentId,
        receiptFile: form.receiptFile,
        paymentAmount: form.paymentAmount,
        paymentDate: form.paymentDate,
        paymentMode: form.paymentMode,
        bankReference: form.bankReference,
      });
      setShowUploadModal(false);
      setForm({
        investmentId: '',
        paymentAmount: '',
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'Bank Transfer',
        bankReference: '',
        receiptFile: null,
      });
      loadData();
    } catch (err) {
      setUploadError(err.message || 'Failed to upload receipt. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    { key: 'id', label: 'Inv. ID', render: (row) => row.id?.slice(-6).toUpperCase() || '-' },
    { key: 'plan', label: 'Plan', render: (row) => row.plan?.name || row.planName || 'Investment Plan' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatCurrency(row.investmentAmount || row.amount),
    },
    { key: 'date', label: 'Date', render: (row) => new Date(row.createdAt || row.date || new Date()).toLocaleDateString() },
    { key: 'method', label: 'Method', render: (row) => row.paymentMethod || 'Bank Transfer' },
    {
      key: 'receipt',
      label: 'Preview',
      render: (row) => <ReceiptPreview url={row.paymentReceiptUrl || row.receiptUrl} method={row.paymentMethod} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-title">Payment Receipts</h2>
          <p className="section-copy mt-3 max-w-3xl">
            Review the receipts uploaded for your investments or upload a new receipt for a pending investment.
          </p>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="btn-primary flex items-center gap-2">
          <UploadCloud className="h-4 w-4" />
          Upload Receipt
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} valueType={stat.valueType ?? 'number'} />
        ))}
      </div>

      <DataTable
        title="Receipt History"
        description="All payment receipts submitted against your investment plans."
        data={investments}
        columns={columns}
        searchableKeys={['id', 'planName', 'paymentMethod', 'status']}
        searchPlaceholder="Search by ID, plan, or method..."
        filterKey="status"
        filterOptions={['Active', 'Pending', 'Pending Payment', 'Payment Under Review']}
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] bg-white p-6 shadow-xl relative">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900">Upload Receipt</h3>
            <p className="mt-2 text-sm text-slate-500">Attach proof of payment for your pending investments.</p>

            <form onSubmit={handleUploadSubmit} className="mt-6 space-y-4">
              {uploadError && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{uploadError}</div>}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Select Investment</label>
                <select
                  className="input-shell w-full bg-slate-50"
                  value={form.investmentId}
                  onChange={(e) => setForm({ ...form, investmentId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Pending Investment --</option>
                  {pendingInvestments.map(inv => (
                    <option key={inv.id} value={inv.id}>
                      {inv.plan?.name || inv.planName || 'Plan'} - {formatCurrency(inv.investmentAmount || inv.amount)}
                    </option>
                  ))}
                </select>
                {pendingInvestments.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">You don't have any pending investments to upload a receipt for.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Amount Paid</label>
                  <input
                    type="number"
                    className="input-shell w-full bg-slate-50"
                    placeholder="₹0"
                    value={form.paymentAmount}
                    onChange={(e) => setForm({ ...form, paymentAmount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Payment Date</label>
                  <input
                    type="date"
                    className="input-shell w-full bg-slate-50"
                    value={form.paymentDate}
                    onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Mode</label>
                  <select
                    className="input-shell w-full bg-slate-50"
                    value={form.paymentMode}
                    onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Ref / UTR No.</label>
                  <input
                    type="text"
                    className="input-shell w-full bg-slate-50"
                    placeholder="e.g. 123456789"
                    value={form.bankReference}
                    onChange={(e) => setForm({ ...form, bankReference: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Receipt Image/PDF</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                  onChange={(e) => setForm({ ...form, receiptFile: e.target.files[0] })}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={uploading || pendingInvestments.length === 0}
                className="btn-primary mt-2 w-full disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Submit Receipt'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentReceipts;
