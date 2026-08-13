import { BriefcaseBusiness, CalendarClock, ShieldCheck, TrendingUp, X, Loader2, CreditCard, ArrowRight, UploadCloud, CheckCircle2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { getOwnInvestments, getActivePlans, applyInvestment, uploadPaymentReceipt } from '../services/api';
import { formatCurrency } from '../utils/formatters';

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.investments)) return payload.investments;
  return [];
}

function Investments() {
  const navigate = useNavigate();
  const [investments, setInvestments] = useState([]);
  
  // Investing & Razorpay State
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [investAmount, setInvestAmount] = useState('');
  const [applying, setApplying] = useState(false);
  const [paymentStep, setPaymentStep] = useState('input'); // 'input', 'paymentSelect', 'razorpayMock', 'success'
  const [createdInvestmentId, setCreatedInvestmentId] = useState('');
  const [razorpayLoading, setRazorpayLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = () => {
    getOwnInvestments()
      .then((response) => {
        setInvestments(toArray(response));
      })
      .catch(() => {
        setInvestments([]);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const fetchPlans = () => {
    setLoadingPlans(true);
    setError('');
    getActivePlans()
      .then((res) => {
        const list = res?.plans || res?.data || res || [];
        setPlans(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error('Failed to fetch active plans:', err);
        // Fallback default plans if API fails or returns empty
        setPlans([
          { id: 'plan-prime', name: 'Prime Monthly Income Plan', interestRate: '1.5%', minInvestment: 10000 },
          { id: 'plan-growth', name: 'High Growth Plan', interestRate: '2.0%', minInvestment: 25000 },
          { id: 'plan-balanced', name: 'Balanced Yield Plan', interestRate: '1.2%', minInvestment: 5000 },
        ]);
      })
      .finally(() => {
        setLoadingPlans(false);
      });
  };

  useEffect(() => {
    if (isInvestModalOpen && plans.length === 0) {
      fetchPlans();
    }
  }, [isInvestModalOpen]);

  const handleProceedToPay = async (e) => {
    e.preventDefault();
    setError('');
    if (!selectedPlanId) {
      setError('Please select an investment plan.');
      return;
    }
    const amount = Number(investAmount);
    const selectedPlan = plans.find(p => p.id === selectedPlanId || p.planId === selectedPlanId);
    const minLimit = Number(selectedPlan?.minInvestment ?? selectedPlan?.minimumAmount ?? selectedPlan?.minAmount ?? 1000);
    if (isNaN(amount) || amount < minLimit) {
      setError(`Minimum investment amount for this plan is ${formatCurrency(minLimit)}.`);
      return;
    }

    setApplying(true);
    try {
      const response = await applyInvestment({
        investmentPlanId: selectedPlanId,
        investmentAmount: amount,
      });
      const invId = response?.id || response?.investmentId || response?.data?.id || response?.data?.investmentId;
      if (!invId) {
        throw new Error('Failed to retrieve investment ID from backend.');
      }
      setCreatedInvestmentId(invId);
      setPaymentStep('paymentSelect');
    } catch (err) {
      setError(err.message || 'Failed to initialize investment. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  const handleRazorpayPay = async () => {
    setRazorpayLoading(true);
    setError('');
    try {
      const referenceId = 'pay_' + Math.random().toString(36).substr(2, 12).toUpperCase();
      const dummyFile = new File(
        [`Razorpay Transaction ID: ${referenceId}\nAmount: ${investAmount}\nPlan ID: ${selectedPlanId}`],
        `razorpay_${referenceId}.txt`,
        { type: 'text/plain' }
      );

      // Upload mock receipt to link the payment in the backend
      await uploadPaymentReceipt({
        investmentId: createdInvestmentId,
        receiptFile: dummyFile,
        paymentAmount: investAmount,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMode: 'Razorpay',
        bankReference: referenceId,
      });

      setPaymentStep('success');
    } catch (err) {
      setError(err.message || 'Razorpay payment succeeded, but receipt synchronization failed.');
    } finally {
      setRazorpayLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setIsInvestModalOpen(false);
    setPaymentStep('input');
    setSelectedPlanId('');
    setInvestAmount('');
    setCreatedInvestmentId('');
    setError('');
    loadData();
  };

  const normalizedInvestments = useMemo(
    () =>
      investments.map((item, index) => ({
        id: item.id || item.investmentId || `INV${index + 1}`,
        plan: item.planName || item.plan || item.investmentPlanName || '-',
        amount: Number(item.investmentAmount ?? item.amount ?? 0),
        startDate: item.startDate || item.createdAt || '-',
        maturityDate: item.maturityDate || '-',
        monthlyReturn: item.monthlyReturn || item.monthlyInterestRate || '-',
        status: item.status || 'Unknown',
      })),
    [investments],
  );

  const stats = useMemo(() => {
    const totalInvestment = normalizedInvestments.reduce((sum, item) => sum + (item.amount || 0), 0);
    const activePlans = normalizedInvestments.filter((item) => item.status?.toLowerCase() === 'active').length;
    const nearestMaturity = normalizedInvestments.find((item) => item.maturityDate && item.maturityDate !== '-')?.maturityDate || '-';
    
    // Dynamically calculate expected monthly return from active plans
    const activeInvestments = normalizedInvestments.filter(i => i.status?.toLowerCase() === 'active');
    const expectedMonthlyInterest = activeInvestments.reduce((sum, item) => {
      let rate = parseFloat(item.monthlyReturn);
      if (isNaN(rate)) rate = 0;
      return sum + (item.amount * (rate / 100));
    }, 0);

    return [
      { title: 'Total Investment', value: totalInvestment, icon: BriefcaseBusiness, tone: 'blue', valueType: 'currency', note: 'across all plans' },
      { title: 'Active Plans', value: activePlans, icon: ShieldCheck, tone: 'emerald', note: 'currently earning' },
      { title: 'Monthly Return', value: expectedMonthlyInterest, icon: TrendingUp, tone: 'violet', valueType: 'currency', note: 'interest per month' },
      { title: 'Next Maturity', value: nearestMaturity, icon: CalendarClock, tone: 'amber', note: 'nearest maturity date' },
    ];
  }, [normalizedInvestments]);

  const columns = [
    { key: 'id', label: 'Investment ID' },
    { key: 'plan', label: 'Plan' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => formatCurrency(row.amount),
    },
    { key: 'startDate', label: 'Start Date' },
    { key: 'maturityDate', label: 'Maturity Date' },
    { key: 'monthlyReturn', label: 'Monthly Return' },
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
          <h2 className="section-title">My Investments</h2>
          <p className="section-copy mt-3 max-w-3xl">
            Review every investment plan, monthly return policy, maturity date, and current
            processing status.
          </p>
        </div>
        <button
          onClick={() => {
            setIsInvestModalOpen(true);
            setPaymentStep('input');
            setError('');
          }}
          className="btn-primary flex items-center gap-2 self-start sm:self-center"
        >
          <TrendingUp className="h-4 w-4" />
          Invest Now
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <SectionCard
        title="Portfolio Overview"
        subtitle="Your investments are diversified across monthly-income and growth-based plans."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Primary plan</p>
            <p className="mt-3 font-heading text-xl font-semibold text-slate-900">
              {normalizedInvestments.filter(i => i.status?.toLowerCase() === 'active').sort((a, b) => b.amount - a.amount)[0]?.plan || 'No Active Plan'}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Expected monthly interest</p>
            <p className="mt-3 font-heading text-xl font-semibold text-slate-900">
              {formatCurrency(
                normalizedInvestments
                  .filter(i => i.status?.toLowerCase() === 'active')
                  .reduce((sum, item) => {
                    let rate = parseFloat(item.monthlyReturn);
                    if (isNaN(rate)) rate = 0;
                    return sum + (item.amount * (rate / 100));
                  }, 0)
              )}
            </p>
          </div>
          <div className={`rounded-[24px] p-5 text-sm leading-7 ${
            normalizedInvestments.some(i => i.status?.toLowerCase() === 'processing' || i.status?.toLowerCase().includes('pending'))
              ? 'border border-blue-100 bg-blue-50 text-blue-700'
              : 'border border-slate-200 bg-slate-50 text-slate-600'
          }`}>
            {normalizedInvestments.some(i => i.status?.toLowerCase() === 'processing' || i.status?.toLowerCase().includes('pending'))
              ? 'The latest reinvestment is still processing, so it will move to active once the receipt verification is fully completed.'
              : 'All your investments are fully verified and actively generating monthly returns.'}
          </div>
        </div>
      </SectionCard>

      <DataTable
        title="Investment List"
        description="Complete list of your current and recently added investment plans."
        data={normalizedInvestments}
        columns={columns}
        searchableKeys={['id', 'plan', 'status']}
        searchPlaceholder="Search by plan, investment ID, or status..."
        filterKey="status"
        filterOptions={['Active', 'Processing']}
      />

      {/* Invest Modal */}
      {isInvestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-xl border border-slate-100 relative">
            
            {/* Modal Header */}
            {paymentStep !== 'razorpayMock' && (
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {paymentStep === 'input' && 'Create Investment'}
                  {paymentStep === 'paymentSelect' && 'Choose Payment Method'}
                  {paymentStep === 'success' && 'Investment Successful'}
                </h3>
                <button
                  onClick={() => setIsInvestModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Step 1: Input Amount and Select Plan */}
            {paymentStep === 'input' && (
              <form onSubmit={handleProceedToPay} className="p-6 space-y-4">
                {error && <div className="rounded-2xl bg-red-50 p-3.5 text-sm text-red-600 border border-red-100">{error}</div>}
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Select Plan</label>
                  {loadingPlans ? (
                    <div className="flex h-12 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </div>
                  ) : (
                    <select
                      className="input-shell w-full bg-slate-50"
                      value={selectedPlanId}
                      onChange={(e) => setSelectedPlanId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Investment Plan --</option>
                      {plans.map(p => (
                        <option key={p.id || p.planId} value={p.id || p.planId}>
                          {p.name || p.planName} ({p.interestRate || p.interestRatePercent || '1.5%'} Return)
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Investment Amount</label>
                  <input
                    type="number"
                    className="input-shell w-full bg-slate-50"
                    placeholder="₹10,000"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={applying || loadingPlans}
                  className="btn-primary w-full mt-2 disabled:opacity-50"
                >
                  {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Proceed to Pay'}
                </button>
              </form>
            )}

            {/* Step 2: Select Razorpay or Manual Receipt */}
            {paymentStep === 'paymentSelect' && (
              <div className="p-6 space-y-4">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 mb-2">
                  <p className="text-xs text-slate-500">Selected Plan</p>
                  <p className="font-semibold text-slate-900">
                    {plans.find(p => p.id === selectedPlanId || p.planId === selectedPlanId)?.name || 'Investment Plan'}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">Amount</p>
                  <p className="text-xl font-bold text-blue-600">{formatCurrency(Number(investAmount))}</p>
                </div>

                <button
                  onClick={() => setPaymentStep('razorpayMock')}
                  className="flex w-full items-center justify-between rounded-[24px] border border-blue-100 bg-blue-50/60 p-5 hover:bg-blue-50 transition active:scale-[0.99] text-left"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-900">Pay via Razorpay</p>
                      <p className="text-xs text-slate-500 mt-0.5">Cards, UPI, Netbanking, Wallets</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-blue-600" />
                </button>

                <button
                  onClick={() => {
                    setIsInvestModalOpen(false);
                    navigate('/payment-receipts');
                  }}
                  className="flex w-full items-center justify-between rounded-[24px] border border-slate-200 bg-slate-50/60 p-5 hover:bg-slate-50 transition active:scale-[0.99] text-left"
                >
                  <div className="flex items-center gap-3">
                    <UploadCloud className="h-6 w-6 text-slate-600" />
                    <div>
                      <p className="font-semibold text-slate-900">Upload Manual Receipt</p>
                      <p className="text-xs text-slate-500 mt-0.5">Pay via Bank Transfer or UPI QR</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-600" />
                </button>
              </div>
            )}

            {/* Step 3: Mock Razorpay Modal Overlay */}
            {paymentStep === 'razorpayMock' && (
              <div>
                {/* Razorpay Blue Header */}
                <div className="bg-blue-600 px-6 py-5 text-white flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/50 px-2 py-0.5 rounded">
                      Razorpay Checkout
                    </span>
                    <p className="text-sm opacity-90 mt-1">Anusha Trade Portal</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-75">Amount to Pay</p>
                    <p className="text-xl font-bold">{formatCurrency(Number(investAmount))}</p>
                  </div>
                </div>

                <div className="p-6 space-y-5 bg-slate-50">
                  {error && <div className="rounded-xl bg-red-100 p-3 text-xs text-red-700 border border-red-200">{error}</div>}

                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Select Payment Method
                    </p>
                    <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50">
                        <span className="text-sm font-medium text-slate-800">UPI (Google Pay, PhonePe, UPI ID)</span>
                        <span className="text-xs text-blue-600 font-semibold">Popular</span>
                      </div>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50">
                        <span className="text-sm font-medium text-slate-800">Card (Visa, MasterCard, RuPay)</span>
                        <span className="text-xs text-slate-400">Debit/Credit</span>
                      </div>
                      <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50">
                        <span className="text-sm font-medium text-slate-800">Net Banking (All Indian Banks)</span>
                        <span className="text-xs text-slate-400">Instant</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
                    <strong>Demo Mode:</strong> Click the pay button below to simulate a successful Razorpay callback. It will automatically upload payment confirmation to the backend.
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPaymentStep('paymentSelect')}
                      className="btn-secondary w-1/3 text-center py-3.5 rounded-2xl"
                      disabled={razorpayLoading}
                    >
                      Back
                    </button>
                    <button
                      onClick={handleRazorpayPay}
                      disabled={razorpayLoading}
                      className="btn-primary w-2/3 flex items-center justify-center gap-2 py-3.5 rounded-2xl shadow-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      {razorpayLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        `Pay ${formatCurrency(Number(investAmount))}`
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Success Milestone screen */}
            {paymentStep === 'success' && (
              <div className="p-6 text-center space-y-5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">Payment Successful!</h4>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Your investment of <strong className="text-slate-800">{formatCurrency(Number(investAmount))}</strong> has been registered. 
                    The Razorpay transaction was verified and is now under verification by the admin.
                  </p>
                </div>
                <button
                  onClick={handleSuccessClose}
                  className="btn-primary w-full py-3 rounded-2xl"
                >
                  Go to My Investments
                </button>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}

export default Investments;
