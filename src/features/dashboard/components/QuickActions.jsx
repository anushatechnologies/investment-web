import { ArrowRight, Plus, ArrowUpFromLine, ArrowDownFromLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { label: 'Add Money', icon: Plus, to: '/wallet' },
    { label: 'Invest Now', icon: ArrowRight, to: '/invest' },
    { label: 'Withdraw', icon: ArrowDownFromLine, to: '/withdraw' },
    { label: 'Transactions', icon: ArrowUpFromLine, to: '/transactions' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map(({ label, icon: Icon, to }) => (
        <button
          key={label}
          onClick={() => navigate(to)}
          className="dashboard-action-btn"
        >
          <Icon className="h-5 w-5" />
          <span className="font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
