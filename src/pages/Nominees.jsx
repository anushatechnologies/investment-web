import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Plus, Trash2, UserCheck } from 'lucide-react';
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
    setMessage('Nominee added for review.');
  };

  const removeNominee = (id) => {
    setNominees((current) => current.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="section-title">Nominees</h2>
          <p className="section-copy mt-3 max-w-3xl">
            Add family nominee details, split allocation, and keep the profile ready for verification.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          {remainingAllocation}% allocation available
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.2fr]">
        <SectionCard title="Add Nominee" subtitle="Allocation across nominees should total 100%.">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Full name</span>
              <input className="input-shell mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Relationship</span>
              <select className="input-shell mt-2" value={form.relationship} onChange={(event) => setForm({ ...form, relationship: event.target.value })}>
                <option>Spouse</option>
                <option>Parent</option>
                <option>Child</option>
                <option>Sibling</option>
                <option>Other</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Mobile number</span>
              <input className="input-shell mt-2" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Allocation (%)</span>
              <input className="input-shell mt-2" value={form.allocation} onChange={(event) => setForm({ ...form, allocation: event.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Guardian, if nominee is minor</span>
              <input className="input-shell mt-2" value={form.guardian} onChange={(event) => setForm({ ...form, guardian: event.target.value })} />
            </label>
            <button type="submit" className="btn-primary w-full">
              <Plus className="h-4 w-4" />
              Add Nominee
            </button>
            {message && <p className="text-sm font-semibold text-blue-600">{message}</p>}
          </form>
        </SectionCard>

        <SectionCard title="Nominee Register" subtitle="Review saved nominees and verification state.">
          <div className="mb-5">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
              <span>Total allocation</span>
              <span>{totalAllocation}% / 100%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className={totalAllocation === 100 ? 'h-full rounded-full bg-emerald-500' : 'h-full rounded-full bg-blue-600'}
                style={{ width: `${Math.min(100, totalAllocation)}%` }}
              />
            </div>
          </div>

          {nominees.length ? (
            <div className="space-y-3">
              {nominees.map((nominee) => (
                <div key={nominee.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-heading text-lg font-semibold text-slate-900">{nominee.name}</p>
                        <p className="text-sm text-slate-500">
                          {nominee.relationship} - {nominee.mobile}
                        </p>
                        {nominee.guardian && <p className="mt-1 text-sm text-slate-500">Guardian: {nominee.guardian}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge label={nominee.status} />
                      <button type="button" className="btn-secondary !px-3 !py-2" onClick={() => removeNominee(nominee.id)}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 rounded-xl bg-white p-3 text-sm font-semibold text-slate-700">
                    Allocation: {nominee.allocation}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 p-5 text-slate-500">
              <ClipboardList className="h-5 w-5" />
              Add your first nominee to begin allocation tracking.
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export default Nominees;
