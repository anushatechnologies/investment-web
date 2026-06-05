import { BriefcaseBusiness, CalendarClock, CreditCard, ShieldCheck, TrendingUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { createRazorpayCheckoutOrder, getActiveCoupons, getActivePlans, getOwnInvestments, validateCoupon, verifyRazorpayPayment } from '../services/api';
import { formatCurrency } from '../utils/formatters';

function toArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.investments)) return payload.investments;
  return [];
}

function Investments() {
  const [investments, setInvestments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [activeCoupons, setActiveCoupons] = useState([]);
  const [investmentForm, setInvestmentForm] = useState({ investmentPlanId: '', investmentAmount: '', couponCode: '' });
  const [couponPreview, setCouponPreview] = useState(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const loadInvestments = () =>
    getOwnInvestments()
      .then((response) => setInvestments(toArray(response)))
      .catch(() => setInvestments([]));

  useEffect(() => {
    let active = true;
    getOwnInvestments()
      .then((response) => {
        if (active) setInvestments(toArray(response));
      })
      .catch(() => {
        if (active) setInvestments([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getActivePlans()
      .then((response) => {
        if (!active) return;
        const activePlans = toArray(response).filter((plan) => plan.active !== false);
        setPlans(activePlans);
        const firstPlan = activePlans[0];
        if (firstPlan) {
          setInvestmentForm({
            investmentPlanId: firstPlan.id,
            investmentAmount: String(firstPlan.minimumAmount || ''),
            couponCode: '',
          });
        }
      })
      .catch(() => {
        if (active) setPlans([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getActiveCoupons()
      .then((response) => {
        if (active) setActiveCoupons(toArray(response));
      })
      .catch(() => {
        if (active) setActiveCoupons([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedPlan = useMemo(
    () => plans.find((plan) => String(plan.id) === String(investmentForm.investmentPlanId)),
    [plans, investmentForm.investmentPlanId],
  );

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error('Unable to load Razorpay Checkout. Check internet connection.'));
      document.body.appendChild(script);
    });

  const handlePlanChange = (event) => {
    const planId = event.target.value;
    const plan = plans.find((item) => String(item.id) === String(planId));
    setInvestmentForm({
      investmentPlanId: planId,
      investmentAmount: String(plan?.minimumAmount || ''),
      couponCode: investmentForm.couponCode,
    });
    setCouponPreview(null);
    setPaymentError('');
    setPaymentMessage('');
  };

  const selectPlan = (plan) => {
    setInvestmentForm({
      investmentPlanId: plan.id,
      investmentAmount: String(plan.minimumAmount || ''),
      couponCode: investmentForm.couponCode,
    });
    setCouponPreview(null);
    setPaymentError('');
    setPaymentMessage('');
  };

  const handleCouponChange = (event) => {
    setInvestmentForm((current) => ({ ...current, couponCode: event.target.value.toUpperCase() }));
    setCouponPreview(null);
    setPaymentError('');
    setPaymentMessage('');
  };

  const checkCoupon = async () => {
    const couponCode = investmentForm.couponCode.trim().toUpperCase();
    const amount = Number(investmentForm.investmentAmount);
    if (!couponCode) {
      setCouponPreview(null);
      return;
    }
    if (!investmentForm.investmentPlanId || !amount || amount <= 0) {
      setPaymentError('Select a plan and enter amount before applying coupon.');
      return;
    }
    setCouponChecking(true);
    setPaymentError('');
    try {
      const preview = await validateCoupon({
        investmentPlanId: investmentForm.investmentPlanId,
        investmentAmount: amount,
        couponCode,
      });
      setCouponPreview(preview);
      if (!preview?.valid) {
        setPaymentError(preview?.message || 'Coupon is not valid for this investment.');
      }
    } catch (error) {
      setCouponPreview(null);
      setPaymentError(error.message || 'Unable to validate coupon.');
    } finally {
      setCouponChecking(false);
    }
  };

  const handleRazorpayInvest = async (event) => {
    event.preventDefault();
    setPaymentError('');
    setPaymentMessage('');

    const amount = Number(investmentForm.investmentAmount);
    if (!investmentForm.investmentPlanId) {
      setPaymentError('Please select an investment plan.');
      return;
    }
    if (!amount || amount <= 0) {
      setPaymentError('Please enter a valid investment amount.');
      return;
    }
    if (selectedPlan && (amount < Number(selectedPlan.minimumAmount || 0) || amount > Number(selectedPlan.maximumAmount || Number.MAX_SAFE_INTEGER))) {
      setPaymentError(`Amount must be between ${formatCurrency(selectedPlan.minimumAmount)} and ${formatCurrency(selectedPlan.maximumAmount)}.`);
      return;
    }

    setPaymentLoading(true);
    try {
      await loadRazorpayScript();
      const response = await createRazorpayCheckoutOrder({
        investmentPlanId: investmentForm.investmentPlanId,
        investmentAmount: amount,
        couponCode: investmentForm.couponCode.trim().toUpperCase() || null,
      });
      const checkout = response.checkout || response.data?.checkout || {};
      const investment = response.investment || response.data?.investment || {};
      const orderAmount = Number(checkout.amount || amount) * 100;

      const razorpay = new window.Razorpay({
        key: checkout.keyId,
        amount: orderAmount,
        currency: checkout.currency || 'INR',
        name: 'Anusha Trade',
        description: checkout.description || checkout.planName || 'Investment payment',
        order_id: checkout.orderId,
        prefill: {
          name: checkout.investorName || '',
          email: checkout.investorEmail || '',
          contact: checkout.investorContact || '',
        },
        notes: {
          investmentId: investment.id,
          planId: investmentForm.investmentPlanId,
        },
        theme: { color: '#2563eb' },
        handler: async (paymentResponse) => {
          setPaymentLoading(true);
          setPaymentError('');
          try {
            await verifyRazorpayPayment({
              investmentId: investment.id,
              razorpayOrderId: paymentResponse.razorpay_order_id,
              razorpayPaymentId: paymentResponse.razorpay_payment_id,
              razorpaySignature: paymentResponse.razorpay_signature,
            });
            const cashback = Number(checkout.couponCashbackAmount || investment.couponCashbackAmount || 0);
            setPaymentMessage(cashback > 0
              ? `Payment successful. Investment activated and coupon cashback ${formatCurrency(cashback)} will appear in wallet.`
              : 'Payment successful. Your investment is activated.');
            await loadInvestments();
          } catch (error) {
            setPaymentError(error.message || 'Payment completed, but verification failed.');
          } finally {
            setPaymentLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentLoading(false);
            setPaymentMessage('Payment popup closed. You can try again anytime.');
          },
        },
      });

      razorpay.on('payment.failed', (failure) => {
        setPaymentLoading(false);
        setPaymentError(failure?.error?.description || 'Razorpay payment failed.');
      });

      razorpay.open();
    } catch (error) {
      setPaymentError(error.message || 'Unable to start Razorpay payment.');
      setPaymentLoading(false);
    }
  };

  const normalizedInvestments = useMemo(
    () =>
      investments.map((item, index) => ({
        id: item.id || item.investmentId || `INV${index + 1}`,
        plan: item.planName || item.plan || item.investmentPlanName || '-',
        amount: Number(item.investmentAmount ?? item.amount ?? 0),
        startDate: item.startDate || item.createdAt || '-',
        nextInterestDueDate: item.nextInterestDueDate || '-',
        lastInterestCreditedAt: item.lastInterestCreditedAt || '-',
        maturityDate: item.maturityDate || '-',
        monthlyReturn: item.monthlyReturn || item.monthlyInterestRate || '-',
        status: item.status || 'Unknown',
        coupon: item.appliedCouponCode || '-',
        couponCashback: Number(item.couponCashbackAmount || 0),
      })),
    [investments],
  );

  const stats = useMemo(() => {
    const totalInvestment = normalizedInvestments.reduce((sum, item) => sum + (item.amount || 0), 0);
    const activePlans = normalizedInvestments.filter((item) => item.status?.toLowerCase() === 'active').length;
    const nextInterestDate = normalizedInvestments
      .filter((item) => item.nextInterestDueDate && item.nextInterestDueDate !== '-')
      .sort((a, b) => new Date(a.nextInterestDueDate) - new Date(b.nextInterestDueDate))[0]?.nextInterestDueDate || '-';
    const nearestMaturity = normalizedInvestments.find((item) => item.maturityDate && item.maturityDate !== '-')?.maturityDate || '-';
    return [
      { title: 'Total Investment', value: totalInvestment, icon: BriefcaseBusiness, tone: 'blue', valueType: 'currency', note: 'across all plans' },
      { title: 'Active Plans', value: activePlans, icon: ShieldCheck, tone: 'emerald', note: 'currently earning' },
      { title: 'Next Interest', value: nextInterestDate, icon: TrendingUp, tone: 'violet', note: 'upcoming monthly credit' },
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
    { key: 'nextInterestDueDate', label: 'Next Interest Due' },
    { key: 'maturityDate', label: 'Maturity Date' },
    { key: 'monthlyReturn', label: 'Monthly Return' },
    {
      key: 'coupon',
      label: 'Coupon',
      render: (row) => (row.couponCashback > 0 ? `${row.coupon} (${formatCurrency(row.couponCashback)})` : row.coupon),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge label={row.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      {(paymentError || paymentMessage) && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${paymentError ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {paymentError || paymentMessage}
        </div>
      )}

      <SectionCard
        title="Start a New Investment"
        subtitle="Choose an active plan, enter an eligible amount, and continue through Razorpay test checkout."
      >
        <form onSubmit={handleRazorpayInvest} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              {plans.map((plan) => {
                const active = String(plan.id) === String(investmentForm.investmentPlanId);
                return (
                  <button
                    type="button"
                    key={plan.id}
                    onClick={() => selectPlan(plan)}
                    className={`min-h-[150px] rounded-[22px] border p-5 text-left transition ${
                      active
                        ? 'border-blue-500 bg-blue-50 shadow-[0_18px_40px_rgba(37,99,235,0.14)]'
                        : 'border-slate-200 bg-slate-50 hover:border-blue-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-heading text-lg font-semibold text-slate-950">{plan.planName}</p>
                        <p className="mt-2 line-clamp-2 text-sm text-slate-500">{plan.description || 'Investment plan'}</p>
                      </div>
                      <StatusBadge label={active ? 'SELECTED' : 'ACTIVE'} />
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Monthly</p>
                        <p className="font-semibold text-slate-900">{plan.monthlyInterestRate}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Min</p>
                        <p className="font-semibold text-slate-900">{formatCurrency(plan.minimumAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Lock-in</p>
                        <p className="font-semibold text-slate-900">{plan.lockInMonths} mo</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {plans.length === 0 && (
              <div className="rounded-[22px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
                No active investment plans are available. Ask admin to activate a plan first.
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_16px_36px_rgba(15,23,42,0.06)]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                <CreditCard className="h-5 w-5" />
              </span>
              <div>
                <p className="font-heading text-lg font-semibold text-slate-950">Razorpay Checkout</p>
                <p className="text-sm text-slate-500">Test mode enabled</p>
              </div>
            </div>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-700">Selected Plan</span>
              <select className="input-shell mt-2" value={investmentForm.investmentPlanId} onChange={handlePlanChange} required>
                <option value="">Select plan</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.planName} - {plan.monthlyInterestRate}% monthly
                  </option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-slate-700">Investment Amount</span>
              <input
                type="number"
                min={selectedPlan?.minimumAmount || 1}
                max={selectedPlan?.maximumAmount || undefined}
                className="input-shell mt-2"
                value={investmentForm.investmentAmount}
                onChange={(event) => setInvestmentForm((current) => ({ ...current, investmentAmount: event.target.value }))}
                required
              />
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-slate-700">Coupon Code</span>
              <div className="mt-2 flex gap-2">
                <input
                  className="input-shell"
                  value={investmentForm.couponCode}
                  onChange={handleCouponChange}
                  onBlur={checkCoupon}
                  placeholder="Optional cashback code"
                />
                <button type="button" onClick={checkCoupon} disabled={couponChecking} className="btn-secondary shrink-0 disabled:opacity-60">
                  {couponChecking ? 'Checking...' : 'Apply'}
                </button>
              </div>
            </label>

            {couponPreview?.valid && Number(couponPreview.cashbackAmount || 0) > 0 && (
              <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                Coupon applied. Cashback: {formatCurrency(Number(couponPreview.cashbackAmount || 0))}
              </div>
            )}

            {activeCoupons.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeCoupons.slice(0, 4).map((coupon) => (
                  <button
                    key={coupon.id || coupon.code}
                    type="button"
                    onClick={() => {
                      setInvestmentForm((current) => ({ ...current, couponCode: coupon.code || '' }));
                      setCouponPreview(null);
                    }}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {coupon.code}
                  </button>
                ))}
              </div>
            )}

            {selectedPlan && (
              <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <p>Allowed amount: {formatCurrency(selectedPlan.minimumAmount)} to {formatCurrency(selectedPlan.maximumAmount)}</p>
                <p className="mt-1">For a clean test payment, use Razorpay Netbanking and choose success.</p>
              </div>
            )}

            <button type="submit" disabled={paymentLoading || plans.length === 0} className="btn-primary mt-5 w-full disabled:opacity-60">
              {paymentLoading ? 'Opening Razorpay...' : 'Proceed to Razorpay'}
            </button>
          </div>
        </form>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <SectionCard title="Monthly Interest Calendar" subtitle="Upcoming wallet credit dates for active investments.">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {normalizedInvestments
            .filter((item) => item.status?.toLowerCase() === 'active')
            .map((item) => (
              <div key={item.id} className="rounded-[22px] border border-slate-200 bg-slate-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-lg font-semibold text-slate-950">{item.plan}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatCurrency(item.amount)}</p>
                  </div>
                  <StatusBadge label={item.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Next due</p>
                    <p className="mt-1 font-semibold text-slate-900">{item.nextInterestDueDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Last credited</p>
                    <p className="mt-1 font-semibold text-slate-900">{item.lastInterestCreditedAt}</p>
                  </div>
                </div>
              </div>
            ))}
          {normalizedInvestments.filter((item) => item.status?.toLowerCase() === 'active').length === 0 && (
            <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
              No active investments are scheduled yet.
            </div>
          )}
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
    </div>
  );
}

export default Investments;
