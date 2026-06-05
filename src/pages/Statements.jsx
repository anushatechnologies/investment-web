import { Download, FileText, Printer, ReceiptText, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/DataTable';
import StatCard from '../components/StatCard';
import { getInvestorStatements } from '../services/api';
import { formatCurrency } from '../utils/formatters';

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function readableTransactionType(type) {
  const value = String(type || '').toUpperCase();
  if (value === 'REFERRAL_INSTANT_CASHBACK') return 'Referral Instant Cashback';
  if (value === 'REFERRAL_MONTHLY_INCOME') return 'Referral Monthly Income';
  if (value === 'INTEREST_CREDIT') return 'Monthly Interest';
  if (value === 'REFERRAL_COMMISSION') return 'Referral Income';
  return String(type || '-').replaceAll('_', ' ');
}

function referralTypeLabel(item) {
  const value = String(item.commissionType || '').toUpperCase();
  if (value.includes('INSTANT')) return 'Instant Cashback';
  if (value.includes('MONTHLY')) return 'Monthly Income';
  return 'Referral Income';
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function Statements() {
  const [data, setData] = useState({});

  useEffect(() => {
    getInvestorStatements().then(setData).catch(() => setData({}));
  }, []);

  const transactions = useMemo(
    () =>
      asArray(data.walletTransactions).map((item) => ({
        id: item.id,
        date: item.createdAt ? new Date(item.createdAt).toLocaleString() : '-',
        type: readableTransactionType(item.transactionType),
        direction: item.direction,
        amount: Number(item.amount || 0),
        balanceAfter: Number(item.balanceAfter || 0),
        description: item.description || '-',
      })),
    [data.walletTransactions],
  );

  const commissions = useMemo(
    () =>
      asArray(data.referralCommissions).map((item) => ({
        id: item.id,
        month: item.commissionMonth,
        type: referralTypeLabel(item),
        level: item.referralLevel,
        sourceLabel: referralTypeLabel(item) === 'Instant Cashback' ? 'Investment Amount' : 'Interest Amount',
        sourceAmount: Number(item.sourceInterestAmount || 0),
        commissionAmount: Number(item.commissionAmount || 0),
        status: item.status,
      })),
    [data.referralCommissions],
  );

  const summary = data.summary || {};
  const stats = [
    { title: 'Wallet Credits', value: Number(summary.totalCredits || 0), icon: Wallet, tone: 'emerald', valueType: 'currency', note: 'all credited transactions' },
    { title: 'Wallet Debits', value: Number(summary.totalDebits || 0), icon: ReceiptText, tone: 'rose', valueType: 'currency', note: 'withdrawals and debits' },
    { title: 'Interest Earned', value: Number(summary.totalInterest || 0), icon: FileText, tone: 'blue', valueType: 'currency', note: 'lifetime interest' },
    { title: 'Referral Earned', value: Number(summary.totalReferral || 0), icon: Download, tone: 'amber', valueType: 'currency', note: 'lifetime commission' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="section-title">Statements</h2>
          <p className="section-copy mt-3 max-w-3xl">Download wallet, interest, and referral commission records.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            <span>Print / PDF Statement</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              downloadCsv('wallet-statement.csv', [
                ['Date', 'Type', 'Direction', 'Amount', 'Balance After', 'Description'],
                ...transactions.map((row) => [row.date, row.type, row.direction, row.amount, row.balanceAfter, row.description]),
              ])
            }
          >
            <Download className="h-4 w-4" />
            <span>Download Wallet CSV</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </div>

      <DataTable
        title="Wallet Statement"
        description="Chronological credit and debit statement."
        data={transactions}
        columns={[
          { key: 'date', label: 'Date' },
          { key: 'type', label: 'Type' },
          { key: 'direction', label: 'Direction' },
          { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
          { key: 'balanceAfter', label: 'Balance After', render: (row) => formatCurrency(row.balanceAfter) },
          { key: 'description', label: 'Description' },
        ]}
        searchableKeys={['date', 'type', 'direction', 'description']}
        filterKey="direction"
        filterOptions={['CREDIT', 'DEBIT']}
      />

      <DataTable
        title="Referral Commission Statement"
        description="Level-wise referral commission history."
        data={commissions}
        columns={[
          { key: 'month', label: 'Due / Event' },
          { key: 'type', label: 'Type' },
          { key: 'level', label: 'Level' },
          { key: 'sourceAmount', label: 'Source Amount', render: (row) => (
            <div>
              <p className="font-semibold">{formatCurrency(row.sourceAmount)}</p>
              <p className="text-xs text-slate-500">{row.sourceLabel}</p>
            </div>
          ) },
          { key: 'commissionAmount', label: 'Commission', render: (row) => formatCurrency(row.commissionAmount) },
          { key: 'status', label: 'Status' },
        ]}
        searchableKeys={['month', 'type', 'level', 'status']}
        filterKey="type"
        filterOptions={['Instant Cashback', 'Monthly Income', 'Referral Income']}
      />
    </div>
  );
}

export default Statements;
