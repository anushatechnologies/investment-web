import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Plus, Trash2, UserCheck, User, Heart, Phone, Percent, Shield, AlertCircle, CheckCircle2, Award, PieChart, ChevronDown } from 'lucide-react';
import SectionCard from '../components/SectionCard';
import StatusBadge from '../components/StatusBadge';

const STORAGE_KEY = 'anusha-investor-nominees';

const initialNominee = {
  name: '',
  relationship: 'Spouse',
  mobile: '',
  allocation: '',
  guardian: '',
};

function Nominees() {
  const [nominees, setNominees] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch (_) {
      return [];
    }
  });
  const [form, setForm] = useState(initialNominee);
  const [message, setMessage] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nominees));
  }, [nominees]);

  const totalAllocation = useMemo(
    () => nominees.reduce((sum, item) => sum + Number(item.allocation || 0), 0),
    [nominees],
  );
  const remainingAllocation = Math.max(0, 100 - totalAllocation);

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage('');

    const allocation = Number(form.allocation);
    if (!form.name.trim() || !form.mobile.trim() || !allocation) {
      setMessage('Enter nominee name, mobile number, and allocation.');
      return;
    }
    if (allocation > remainingAllocation) {
      setMessage(`Only ${remainingAllocation}% allocation is available.`);
      return;
    }

    setNominees((current) => [
      ...current,
      {
        ...form,
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        allocation,
        status: 'Pending',
      },
    ]);
    setForm(initialNominee);
    setMessage('Nominee added successfully. Awaiting operations review.');
  };

  const removeNominee = (id) => {
    setNominees((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Top Allocation Summary card */}
      <div className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/15">
              <PieChart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Nominee Share Allocation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">Split investment allocations between your family members.</p>
            </div>
          </div>
          
          <div className={`rounded-2xl border px-4 py-3 text-sm font-bold flex items-center gap-2 ${ remainingAllocation === 0 ? 'border-emerald-300 bg-emerald-50/50 text-emerald-700 dark:border-emerald-950/20 dark:bg-emerald-950/20 dark:text-emerald-400' : 'border-indigo-100 bg-indigo-50/50 text-indigo-700 dark:border-indigo-950/20 dark:bg-indigo-950/20 dark:text-indigo-400' }`}>
            <Award className="h-4.5 w-4.5" />
            {remainingAllocation}% share allocation remaining
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.2fr]">
        {/* Left Card: Add Nominee */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Add Nominee</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 font-medium">Split share allocations across nominees to total 100%.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Full Name</span>
              <div className="relative mt-1">
                <input
                  className="input-shell pl-10 focus:border-indigo-600 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="Enter nominee name"
                  required
                />
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-indigo-500 pointer-events-none" />
              </div>
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Relationship</span>
              <div className="relative mt-1">
                <select
                  className="input-shell pl-10 pr-10 focus:border-indigo-600 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                  value={form.relationship}
                  onChange={(event) => setForm({ ...form, relationship: event.target.value })}
                >
                  <option>Spouse</option>
                  <option>Parent</option>
                  <option>Child</option>
                  <option>Sibling</option>
                  <option>Other</option>
                </select>
                <Heart className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-rose-500 pointer-events-none" />
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 dark:text-slate-300 pointer-events-none" />
              </div>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Mobile Number</span>
                <div className="relative mt-1">
                  <input
                    className="input-shell pl-10 focus:border-indigo-600 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                    value={form.mobile}
                    onChange={(event) => setForm({ ...form, mobile: event.target.value })}
                    placeholder="Ten digit mobile"
                    required
                  />
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-500 pointer-events-none" />
                </div>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Allocation (%)</span>
                <div className="relative mt-1">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="input-shell pl-10 focus:border-indigo-600 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                    value={form.allocation}
                    onChange={(event) => setForm({ ...form, allocation: event.target.value })}
                    placeholder="e.g. 50"
                    required
                  />
                  <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500 pointer-events-none" />
                </div>
              </label>
            </div>

            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-300">Guardian Name (Optional)</span>
              <div className="relative mt-1">
                <input
                  className="input-shell pl-10 focus:border-indigo-600 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30"
                  value={form.guardian}
                  onChange={(event) => setForm({ ...form, guardian: event.target.value })}
                  placeholder="Required if nominee is a minor"
                />
                <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-500 pointer-events-none" />
              </div>
            </label>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition-all duration-300 hover:from-indigo-700 hover:to-blue-700 active:scale-[0.97]"
              >
                <Plus className="h-4 w-4" />
                Add Nominee
              </button>

              {message && (
                <div className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl border ${ message.toLowerCase().includes('success') || message.toLowerCase().includes('added') ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400' : 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400' }`}>
                  {message.toLowerCase().includes('success') || message.toLowerCase().includes('added') ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
                  {message}
                </div>
              )}
            </div>
          </form>
        </div>

        {/* Right Card: Nominee Register List */}
        <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
            <h3 className="font-heading text-lg font-bold text-slate-900 dark:text-white">Nominee Register</h3>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5 font-medium">Review submitted nominee listings and verify split balances.</p>
          </div>

          {/* Allocation progress bar */}
          <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/20">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <PieChart className="h-3.5 w-3.5 text-indigo-500" />
                Share Split
              </span>
              <span>{totalAllocation}% / 100% Allocated</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${ totalAllocation === 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/20' : 'bg-gradient-to-r from-indigo-500 to-blue-500 shadow-md shadow-indigo-500/20' }`}
                style={{ width: `${Math.min(100, totalAllocation)}%` }}
              />
            </div>
          </div>

          {nominees.length ? (
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1.5 scrollbar-thin">
              {nominees.map((nominee) => (
                <div key={nominee.id} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all duration-300 hover:shadow-sm dark:border-slate-800/80 dark:bg-slate-800/15">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 text-indigo-600 dark:text-indigo-400 shadow-inner flex-shrink-0">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-heading text-base font-bold text-slate-900 dark:text-white leading-tight">{nominee.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-300 mt-1">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{nominee.relationship}</span> • {nominee.mobile}
                        </p>
                        {nominee.guardian && (
                          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-300 flex items-center gap-1">
                            <Shield className="h-3 w-3 text-blue-500" /> Guardian: <span className="font-semibold">{nominee.guardian}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 self-end sm:self-start flex-shrink-0">
                      <StatusBadge label={nominee.status} />
                      <button
                        type="button"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30 hover:scale-105 active:scale-95 transition"
                        onClick={() => removeNominee(nominee.id)}
                        title="Remove nominee"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                    <span>Allocated Share</span>
                    <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-lg">
                      {nominee.allocation}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-300">
              <ClipboardList className="h-10 w-10 text-slate-300 dark:text-slate-700 mb-2 animate-bounce" />
              <p className="text-sm font-bold text-slate-800 dark:text-slate-300">No Nominees Registered</p>
              <p className="text-xs mt-1 leading-relaxed text-slate-500 dark:text-slate-300 max-w-[280px]">Add your first nominee on the left to begin splitting your investment allocations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Nominees;
