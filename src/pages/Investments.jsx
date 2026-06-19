import { BriefcaseBusiness, CalendarClock, CreditCard, ShieldCheck, TrendingUp, Trophy, Coins, Sparkles, Info } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionCard from '../components/SectionCard';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { createRazorpayCheckoutOrder, getActiveCoupons, getActivePlans, getOwnInvestments, validateCoupon, verifyRazorpayPayment } from '../services/api';
import { formatCurrency, formatCompactCurrency } from '../utils/formatters';

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
        let activePlans = toArray(response).filter((plan) => plan.active !== false);
        if (activePlans.length === 0) {
          activePlans = [
            {
              id: 'plan_starter',
              planName: 'Starter Growth',
              description: 'Perfect for new investors seeking steady, low-risk monthly compounding returns.',
              monthlyInterestRate: 2.5,
              minimumAmount: 10000,
              maximumAmount: 100000,
              lockInMonths: 3,
              active: true,
            },
            {
              id: 'plan_balanced',
              planName: 'Balanced Wealth',
              description: 'An optimized asset matching profile designed for reliable medium-term capital velocity.',
              monthlyInterestRate: 3.2,
              minimumAmount: 50000,
              maximumAmount: 500000,
              lockInMonths: 6,
              active: true,
            },
            {
              id: 'plan_premium',
              planName: 'High-Yield Alpha',
              description: 'Maximum monthly credit rate. Reserved for dedicated capital allocations with extended terms.',
              monthlyInterestRate: 4.5,
              minimumAmount: 100000,
              maximumAmount: 2500000,
              lockInMonths: 12,
              active: true,
            }
          ];
        }
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
        if (active) {
          const fallback = [
            {
              id: 'plan_starter',
              planName: 'Starter Growth',
              description: 'Perfect for new investors seeking steady, low-risk monthly compounding returns.',
              monthlyInterestRate: 2.5,
              minimumAmount: 10000,
              maximumAmount: 100000,
              lockInMonths: 3,
              active: true,
            },
            {
              id: 'plan_balanced',
              planName: 'Balanced Wealth',
              description: 'An optimized asset matching profile designed for reliable medium-term capital velocity.',
              monthlyInterestRate: 3.2,
              minimumAmount: 50000,
              maximumAmount: 500000,
              lockInMonths: 6,
              active: true,
            },
            {
              id: 'plan_premium',
              planName: 'High-Yield Alpha',
              description: 'Maximum monthly credit rate. Reserved for dedicated capital allocations with extended terms.',
              monthlyInterestRate: 4.5,
              minimumAmount: 100000,
              maximumAmount: 2500000,
              lockInMonths: 12,
              active: true,
            }
          ];
          setPlans(fallback);
          setInvestmentForm({
            investmentPlanId: fallback[0].id,
            investmentAmount: String(fallback[0].minimumAmount || ''),
            couponCode: '',
          });
        }
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

  const calculatedStats = useMemo(() => {
    if (!selectedPlan) return null;
    const amount = Number(investmentForm.investmentAmount) || 0;
    const monthlyRate = Number(selectedPlan.monthlyInterestRate || 0);
    const months = Number(selectedPlan.lockInMonths || 0);
    
    const monthlyReturn = (amount * monthlyRate) / 100;
    const totalReturn = monthlyReturn * months;
    
    const maturityDateObj = new Date();
    maturityDateObj.setMonth(maturityDateObj.getMonth() + months);
    const formattedMaturity = maturityDateObj.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    
    return {
      monthlyReturn,
      totalReturn,
      maturityDate: formattedMaturity,
      netPayout: amount + totalReturn
    };
  }, [selectedPlan, investmentForm.investmentAmount]);

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
        title="Explore High-Yield Plans"
        subtitle="Select a premium lock-in plan, customize your capital allocation, and view real-time interest projections."
      >
        <form onSubmit={handleRazorpayInvest} className="flex flex-col lg:flex-row gap-6">
          {/* Left Side: Plan Selector Cards */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex flex-col flex-1 gap-4">
              {plans.map((plan) => {
                const active = String(plan.id) === String(investmentForm.investmentPlanId);
                
                // Select theme/tone based on plan return rate or tier
                let themeClasses = "border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700/80";
                let activeClasses = "border-indigo-600 bg-indigo-50/20 dark:border-indigo-500 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/10";
                let iconWrapperClass = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
                let iconColor = "text-indigo-600 dark:text-indigo-400";
                let PlanIcon = BriefcaseBusiness;
                let badgeText = "Balanced";
                
                if (Number(plan.monthlyInterestRate) >= 3.5) {
                  themeClasses = "border-slate-200/80 bg-white hover:border-amber-200 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-amber-950/30";
                  activeClasses = "border-amber-500 bg-amber-50/20 dark:border-amber-500 dark:bg-amber-950/20 shadow-md ring-2 ring-amber-500/10";
                  iconWrapperClass = "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400";
                  PlanIcon = Trophy;
                  badgeText = "Premium Yield";
                } else if (Number(plan.lockInMonths) <= 6) {
                  themeClasses = "border-slate-200/80 bg-white hover:border-emerald-200 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-emerald-950/30";
                  activeClasses = "border-emerald-500 bg-emerald-50/20 dark:border-emerald-500 dark:bg-emerald-950/20 shadow-md ring-2 ring-emerald-500/10";
                  iconWrapperClass = "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400";
                  PlanIcon = Coins;
                  badgeText = "Short Term";
                }

                return (
                  <button
                    type="button"
                    key={plan.id}
                    onClick={() => selectPlan(plan)}
                    className={`group relative flex flex-col flex-1 justify-between overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 active:scale-[0.98] ${ active ? activeClasses : themeClasses }`}
                  >
                    {active && (
                      <div className="absolute right-0 top-0 h-16 w-16 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full pointer-events-none" />
                    )}
                    
                    <div className="flex items-start justify-between gap-3 w-full">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition duration-300 ${active ? 'bg-indigo-600 text-white shadow-md' : iconWrapperClass}`}>
                          <PlanIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-heading text-[15px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {plan.planName}
                          </h4>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">
                            {badgeText}
                          </span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider ${ active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500' }`}>
                        {active ? 'SELECTED' : 'ACTIVE'}
                      </span>
                    </div>

                    <p className="mt-3.5 text-xs text-slate-500 dark:text-slate-300 leading-relaxed min-h-[32px] line-clamp-2">
                      {plan.description || 'Secure monthly returns plan with direct bank settlement.'}
                    </p>

                    {/* Stats strip */}
                    <div className="mt-auto pt-4 grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800/60 w-full">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Monthly Rate</span>
                        <span className="mt-0.5 font-heading text-lg font-black text-indigo-600 dark:text-indigo-400 block leading-tight">
                          {plan.monthlyInterestRate}%
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Min Capital</span>
                        <span className="mt-1 font-heading text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          {formatCompactCurrency(plan.minimumAmount)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Lock-in</span>
                        <span className="mt-1 font-heading text-xs font-bold text-slate-700 dark:text-slate-300 block">
                          {plan.lockInMonths} Mo
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {plans.length === 0 && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400">
                No active investment plans are available. Ask admin to activate a plan first.
              </div>
            )}
          </div>

          {/* Right Side: Interactive Investment Calculator & Checkout */}
          <div className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 w-full lg:w-[480px] shrink-0">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md">
                <CreditCard className="h-5 w-5" />
              </span>
              <div>
                <p className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100">Checkout & Projections</p>
                <p className="text-[10px] font-extrabold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Test Mode Active</p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Plan Tier</span>
                <select className="input-shell mt-1.5 w-full bg-slate-50/30 focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950/40 text-sm font-medium" value={investmentForm.investmentPlanId} onChange={handlePlanChange} required>
                  <option value="">Select plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.planName} ({plan.monthlyInterestRate}%)
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Principal Capital (INR)</span>
                <input
                  type="number"
                  min={selectedPlan?.minimumAmount || 1}
                  max={selectedPlan?.maximumAmount || undefined}
                  className="input-shell mt-1.5 w-full bg-slate-50/30 focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950/40 text-sm font-bold"
                  value={investmentForm.investmentAmount}
                  onChange={(event) => setInvestmentForm((current) => ({ ...current, investmentAmount: event.target.value }))}
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Promo Code</span>
                <div className="mt-1.5 flex gap-2">
                  <input
                    className="input-shell w-full bg-slate-50/30 focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950/40 text-sm font-semibold tracking-wider placeholder-slate-400"
                    value={investmentForm.couponCode}
                    onChange={handleCouponChange}
                    onBlur={checkCoupon}
                    placeholder="ENTER CODE"
                  />
                  <button type="button" onClick={checkCoupon} disabled={couponChecking} className="btn-secondary shrink-0 py-2.5 disabled:opacity-60 text-xs font-bold">
                    {couponChecking ? '...' : 'Apply'}
                  </button>
                </div>
              </label>
            </div>

            {/* Coupons list */}
            {activeCoupons.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300 block">Available Offers</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeCoupons.slice(0, 4).map((coupon) => (
                    <button
                      key={coupon.id || coupon.code}
                      type="button"
                      onClick={() => {
                        setInvestmentForm((current) => ({ ...current, couponCode: coupon.code || '' }));
                        setCouponPreview(null);
                      }}
                      className="rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300 dark:hover:bg-slate-800 transition"
                    >
                      {coupon.code}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Realtime Projections Receipt */}
            {calculatedStats && (
              <div className="mt-4 p-4 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center gap-1.5 border-b border-dashed border-slate-200 dark:border-slate-800 pb-2">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300">Projection Breakdown</span>
                </div>
                
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-300">Est. Monthly Return</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(calculatedStats.monthlyReturn)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-300">Total Yield ({selectedPlan.lockInMonths} mo)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">+{formatCurrency(calculatedStats.totalReturn)}</span>
                  </div>
                  {couponPreview?.valid && Number(couponPreview.cashbackAmount || 0) > 0 && (
                    <div className="flex justify-between bg-emerald-500/10 dark:bg-emerald-950/20 p-1 px-1.5 rounded text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <span>Applied Coupon Cashback</span>
                      <span>{formatCurrency(Number(couponPreview.cashbackAmount || 0))}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 text-[13px] font-extrabold">
                    <span className="text-slate-700 dark:text-slate-300">Total Net Value</span>
                    <span className="text-indigo-600 dark:text-indigo-400">{formatCurrency(calculatedStats.netPayout)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t border-slate-150 dark:border-slate-800/60 pt-2 text-[10px] text-slate-500 dark:text-slate-300 font-semibold leading-relaxed">
                  <Info className="h-3 w-3 text-slate-500 dark:text-slate-300 shrink-0" />
                  <span>Matures on {calculatedStats.maturityDate}.</span>
                </div>
              </div>
            )}

            {/* Warnings / Helpful notes */}
            {selectedPlan && !calculatedStats && (
              <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-[11px] text-slate-500 leading-relaxed dark:text-slate-300">
                <p className="font-semibold text-slate-600 dark:text-slate-300">Limit Guidelines:</p>
                <p className="mt-0.5">Min: {formatCurrency(selectedPlan.minimumAmount)} | Max: {formatCurrency(selectedPlan.maximumAmount)}</p>
                <p className="mt-1">For clean test execution, choose Netbanking inside the Razorpay gateway and trigger Success.</p>
              </div>
            )}

            <button type="submit" disabled={paymentLoading || plans.length === 0} className="btn-primary mt-4 w-full py-3 disabled:opacity-60 shadow-lg shadow-indigo-600/10 active:scale-[0.97] transition duration-200">
              {paymentLoading ? 'Opening Razorpay...' : 'Proceed to Checkout'}
            </button>
          </div>
        </form>
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <SectionCard title="Monthly Interest Calendar" subtitle="Upcoming monthly payout schedules for your active assets.">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {normalizedInvestments
            .filter((item) => item.status?.toLowerCase() === 'active')
            .map((item) => (
              <div key={item.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400">
                      <CalendarClock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-heading text-sm font-bold text-slate-900 dark:text-slate-100">{item.plan}</p>
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-300 mt-0.5">{formatCurrency(item.amount)}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                    {item.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-3 text-[11px] border-t border-slate-100 dark:border-slate-800/80 pt-3">
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300 block">Next Payout</span>
                    <span className="mt-1 font-semibold text-slate-900 dark:text-slate-200 block">{item.nextInterestDueDate}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-300 block">Last Payout</span>
                    <span className="mt-1 font-semibold text-slate-900 dark:text-slate-200 block">{item.lastInterestCreditedAt}</span>
                  </div>
                </div>
              </div>
            ))}
          {normalizedInvestments.filter((item) => item.status?.toLowerCase() === 'active').length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/20 md:col-span-2 lg:col-span-3 dark:text-slate-300">
              <CalendarClock className="h-8 w-8 mx-auto text-slate-500 dark:text-slate-300 mb-2" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">No active payouts scheduled</p>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">Start a new investment plan above to see your interest payout timeline.</p>
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
