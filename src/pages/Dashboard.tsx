import React, { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { useAuth } from '../context/AuthContext';

import QuickActions from '../components/dashboard/QuickActions';
import BalanceCards from '../components/dashboard/BalanceCards';
import MonthlySummary from '../components/dashboard/MonthlySummary';
import ExpensePieChart from '../components/dashboard/ExpensePieChart';
import SpendingTrendChart from '../components/dashboard/SpendingTrendChart';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import ActiveLoansSummary from '../components/dashboard/ActiveLoansSummary';
import SavingsGoalsOverview from '../components/dashboard/SavingsGoalsOverview';
import NotificationBell from '../components/loans/NotificationBell';

// We'll need the transaction modal here
import TransactionModal from '../components/transactions/TransactionModal';

export default function Dashboard() {
  const { profile } = useAuth();
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const {
    loading, totalBalance, cashBalance, bankBalance,
    monthlyIncome, monthlyExpenses, monthlySavings,
    recentTransactions, loansGiven, loansTaken,
    savingsGoals, expenseCategories, spendingTrend, refetch
  } = useDashboard();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    if (hour < 22) return 'Good evening';
    return 'Good night';
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Header */}
      <div className="stack-mobile">
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p className="header-date">
            {getGreeting()}, {profile?.name || 'User'}
          </p>
        </div>
        <NotificationBell />
      </div>

      {/* Grid Layout */}
      <QuickActions onAddTransaction={() => setIsTxModalOpen(true)} />
      
      <BalanceCards 
        totalBalance={totalBalance} 
        cashBalance={cashBalance} 
        bankBalance={bankBalance} 
      />

      <MonthlySummary 
        income={monthlyIncome} 
        expenses={monthlyExpenses} 
        savings={monthlySavings} 
      />

      {/* Charts Row */}
      <div className="dashboard-grid-2">
        <div style={{ flex: '1 1 300px' }}>
          <ExpensePieChart categories={expenseCategories} totalExpenses={monthlyExpenses} />
        </div>
        <div style={{ flex: '1 1 400px' }}>
          <SpendingTrendChart trend={spendingTrend} />
        </div>
      </div>

      {/* Data Row */}
      <div className="dashboard-grid-7-5">
        <div style={{ flex: '1 1 min(100%, 700px)', minWidth: 0 }}>
          <div className="table-responsive">
            <RecentTransactions transactions={recentTransactions} />
          </div>
        </div>
        <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <ActiveLoansSummary loansGiven={loansGiven} loansTaken={loansTaken} />
          <SavingsGoalsOverview goals={savingsGoals} />
        </div>
      </div>

      {/* Modals */}
      {isTxModalOpen && (
        <TransactionModal 
          isOpen={isTxModalOpen} 
          onClose={() => setIsTxModalOpen(false)} 
          onSuccess={refetch} 
          cashBalance={cashBalance}
          bankBalance={bankBalance}
        />
      )}

      <style>{`
        .dashboard-grid-2, .dashboard-grid-7-5 {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
      `}</style>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ height: '40px', width: '200px', background: 'var(--color-muted)', borderRadius: '8px' }} className="pulse" />
      <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[1, 2, 3].map(i => <div key={i} style={{ height: '48px', background: 'var(--color-muted)', borderRadius: '10px' }} className="pulse" />)}
      </div>
      <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[1, 2, 3].map(i => <div key={i} style={{ height: '100px', background: 'var(--color-muted)', borderRadius: '10px' }} className="pulse" />)}
      </div>
      <div style={{ height: '140px', background: 'var(--color-muted)', borderRadius: '10px' }} className="pulse" />
      <div className="dashboard-grid-2">
        <div style={{ flex: 1, height: '300px', background: 'var(--color-muted)', borderRadius: '10px' }} className="pulse" />
        <div style={{ flex: 1, height: '300px', background: 'var(--color-muted)', borderRadius: '10px' }} className="pulse" />
      </div>
      <style>{`
        .pulse { animation: pulse 1.5s ease-in-out infinite; opacity: 0.5; }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.2; } }
      `}</style>
    </div>
  );
}
