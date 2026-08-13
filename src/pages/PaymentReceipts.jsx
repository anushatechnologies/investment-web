import { useEffect, useMemo, useState } from 'react';
import { 
  CheckCheck, 
  FileText, 
  Receipt, 
  ShieldCheck, 
  UploadCloud, 
  X, 
  Coins, 
  Calendar, 
  CreditCard, 
  Hash, 
  Lock,
  ArrowUpRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { getOwnInvestments, uploadPaymentReceipt } from '../services/api';
import { formatCurrency } from '../utils/formatters';

function ReceiptPreview({ url, method }) {
  if (!url) return <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">No Receipt</span>;
  const isUpi = String(method || '').toUpperCase().includes('UPI');
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noreferrer" 
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-indigo-900/50 dark:hover:bg-indigo-950/10 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all duration-300 group"
    >
      <FileText className="h-4 w-4 text-indigo-500 group-hover:scale-110 transition duration-300 flex-shrink-0" />
      <span className="truncate max-w-[80px]">{isUpi ? 'UPI Receipt' : 'Bank Proof'}</span>
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

  const totalReceipts = useMemo(() => investments.filter(i => i.paymentReceiptUrl).length, [investments]);
  const verifiedReceipts = useMemo(() => investments.filter(i => i.paymentReceiptUrl && i.status === 'Active').length, [investments]);
  const pendingReceipts = useMemo(() => investments.filter(i => i.paymentReceiptUrl && (i.status === 'Pending' || i.status === 'Payment Under Review')).length, [investments]);
  const latestAmount = useMemo(() => {
    const list = investments.filter(i => i.paymentReceiptUrl).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return list[0]?.investmentAmount || 0;
  }, [investments]);

  const stats = useMemo(
    () => [
      { 
        title: 'Total Uploads', 
        value: totalReceipts, 
        icon: Receipt, 
        gradColor: 'from-blue-500 to-indigo-500', 
        shadowColor: 'shadow-blue-500/20',
        note: 'submitted receipts' 
      },
      { 
        title: 'Verified Payments', 
        value: verifiedReceipts, 
        icon: CheckCheck, 
        gradColor: 'from-emerald-500 to-teal-500', 
        shadowColor: 'shadow-emerald-500/20',
        note: 'cleared successfully' 
      },
      { 
        title: 'Pending Verification', 
        value: pendingReceipts, 
        icon: ShieldCheck, 
        gradColor: 'from-amber-500 to-orange-500', 
        shadowColor: 'shadow-amber-500/20',
        note: 'under compliance review' 
      },
      { 
        title: 'Latest Payment', 
        value: latestAmount, 
        icon: FileText, 
        gradColor: 'from-purple-500 to-fuchsia-500', 
        shadowColor: 'shadow-purple-500/20',
        valueType: 'currency', 
        note: 'most recent amount' 
      },
    ],
    [totalReceipts, verifiedReceipts, pendingReceipts, latestAmount],
  );

  const pendingInvestments = useMemo(() => investments.filter(i => i.status === 'Pending' || i.status === 'Pending Payment'), [investments]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setUploadError('');
    if (!form.investmentId) return setUploadError('Please select a pending investment plan.');
    if (!form.receiptFile) return setUploadError('Please select a receipt document.');
    if (!form.paymentAmount) return setUploadError('Please specify the amount paid.');

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
      setUploadError(err.message || 'Failed to submit receipt. Please check values and try again.');
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    { 
      key: 'id', 
      label: 'Inv. ID', 
      render: (row) => (
        <span className="font-mono font-bold text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-lg border border-slate-200/40 dark:border-slate-800">
          #{row.id?.slice(-6).toUpperCase() || '-'}
        </span>
      )
    },
    { 
      key: 'plan', 
      label: 'Selected Plan', 
      render: (row) => (
        <span className="font-semibold text-slate-900 dark:text-white">
          {row.plan?.name || row.planName || 'Investment Plan'}
        </span>
      )
    },
    {
      key: 'amount',
      label: 'Amount Paid',
      render: (row) => (
        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
          {formatCurrency(row.investmentAmount || row.amount)}
        </span>
      )
    },
    { 
      key: 'date', 
      label: 'Date Uploaded', 
      render: (row) => new Date(row.createdAt || row.date || new Date()).toLocaleDateString() 
    },
    { 
      key: 'method', 
      label: 'Method', 
      render: (row) => (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300">
          <CreditCard className="h-3.5 w-3.5 text-indigo-500" />
          {row.paymentMethod || 'Bank Transfer'}
        </span>
      )
    },
    {
      key: 'receipt',
      label: 'Receipt Proof',
      render: (row) => <ReceiptPreview url={row.paymentReceiptUrl || row.receiptUrl} method={row.paymentMethod} />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  return (
    <div className="space-y-8 pt-2">
      
      {/* Redundant title and overlap block removed. Displaying control bar trigger only */}
      <div className="flex justify-end border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
        <button 
          onClick={() => {
            setUploadError('');
            setShowUploadModal(true);
          }} 
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-500/15 hover:from-indigo-700 hover:to-blue-700 active:scale-[0.97] transition-all duration-300"
        >
          <UploadCloud className="h-4.5 w-4.5" />
          <span>Upload New Receipt</span>
        </button>
      </div>

      {/* Premium 3D Stats Counter Grid */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx}
              className="group relative rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-900 flex items-center justify-between overflow-hidden"
            >
              <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full opacity-5 bg-gradient-to-tr ${stat.gradColor} group-hover:scale-125 transition-transform duration-500`} />
              
              <div className="space-y-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-200">
                  {stat.title}
                </span>
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {stat.valueType === 'currency' ? formatCurrency(stat.value) : stat.value}
                </h3>
                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-200">
                  {stat.note}
                </p>
              </div>

              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr ${stat.gradColor} text-white shadow-lg ${stat.shadowColor} transition-transform duration-300 group-hover:scale-115`}>
                <Icon className="h-5.5 w-5.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* DataTable List wrapper */}
      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition duration-300">
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
      </div>

      {/* Upload Modal (Premium glassmorphic dashboard design) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-md rounded-[28px] border border-slate-100 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 relative animate-fade-in-up">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="absolute right-6 top-6 h-8 w-8 inline-flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 dark:hover:text-white transition"
            >
              <X className="h-4.5 w-4.5" />
            </button>
            
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Upload Payment Receipt</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">Attach proof of bank/UPI transfer for pending investments.</p>

            <form onSubmit={handleUploadSubmit} className="mt-5 space-y-4">
              {uploadError && (
                <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs font-semibold text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400">
                  {uploadError}
                </div>
              )}

              {/* select plan field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">Select Pending Investment</label>
                <div className="relative mt-1">
                  <select
                    className="input-shell pl-10 w-full bg-slate-50/50 focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950/40"
                    value={form.investmentId}
                    onChange={(e) => setForm({ ...form, investmentId: e.target.value })}
                    required
                  >
                    <option value="" className="dark:bg-slate-900">-- Select Plan --</option>
                    {pendingInvestments.map(inv => (
                      <option key={inv.id} value={inv.id} className="dark:bg-slate-900">
                        {inv.plan?.name || inv.planName || 'Plan'} - {formatCurrency(inv.investmentAmount || inv.amount)}
                      </option>
                    ))}
                  </select>
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 pointer-events-none" />
                </div>
                {pendingInvestments.length === 0 && (
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-amber-600 dark:text-amber-500 leading-snug">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>No pending plans found. Create a plan first from Dashboard.</span>
                  </div>
                )}
              </div>

              {/* amount and date side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">Amount Paid</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      className="input-shell pl-10 w-full bg-slate-50/50 focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950/40"
                      placeholder="₹0"
                      value={form.paymentAmount}
                      onChange={(e) => setForm({ ...form, paymentAmount: e.target.value })}
                      required
                    />
                    <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 pointer-events-none" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">Payment Date</label>
                  <div className="relative mt-1">
                    <input
                      type="date"
                      className="input-shell pl-10 w-full bg-slate-50/50 focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950/40"
                      value={form.paymentDate}
                      onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
                      required
                    />
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* mode and reference side-by-side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">Payment Mode</label>
                  <div className="relative mt-1">
                    <select
                      className="input-shell pl-10 w-full bg-slate-50/50 focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950/40"
                      value={form.paymentMode}
                      onChange={(e) => setForm({ ...form, paymentMode: e.target.value })}
                    >
                      <option value="Bank Transfer" className="dark:bg-slate-900">Bank Transfer</option>
                      <option value="UPI" className="dark:bg-slate-900">UPI</option>
                      <option value="NEFT" className="dark:bg-slate-900">NEFT</option>
                      <option value="RTGS" className="dark:bg-slate-900">RTGS</option>
                    </select>
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">Ref / UTR Number</label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      className="input-shell pl-10 w-full bg-slate-50/50 focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950/40"
                      placeholder="e.g. 123456789"
                      value={form.bankReference}
                      onChange={(e) => setForm({ ...form, bankReference: e.target.value })}
                    />
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Premium Drag and Drop Upload Card */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">Receipt Image / PDF</label>
                <div className="relative rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-500 dark:border-slate-800 dark:hover:border-indigo-500/80 bg-slate-50/50 dark:bg-slate-950/20 p-5 text-center transition cursor-pointer">
                  {form.receiptFile ? (
                    <div className="flex items-center justify-between p-3 bg-indigo-50/30 dark:bg-indigo-950/15 rounded-xl border border-indigo-100/40 dark:border-indigo-900/30">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{form.receiptFile.name}</p>
                          <p className="text-[9px] text-slate-500 dark:text-slate-300 mt-0.5">{(form.receiptFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={(e) => { e.stopPropagation(); setForm({ ...form, receiptFile: null }); }}
                        className="h-6 w-6 inline-flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 dark:text-slate-300 hover:text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer justify-center py-2">
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        className="hidden" 
                        onChange={(e) => setForm({ ...form, receiptFile: e.target.files[0] })}
                        required
                      />
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white shadow-md shadow-indigo-500/15 mb-3">
                        <UploadCloud className="h-5 w-5 animate-pulse" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Upload transaction receipt</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-300 mt-1">PDF, JPG, JPEG or PNG (Max 5MB)</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Submit trigger button */}
              <button
                type="submit"
                disabled={uploading || pendingInvestments.length === 0}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-500/10 transition hover:from-indigo-700 hover:to-blue-700 active:scale-[0.97] disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Uploading Receipt...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-4 w-4" />
                    <span>Submit Receipt</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default PaymentReceipts;
