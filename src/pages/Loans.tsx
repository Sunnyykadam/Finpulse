import React, { useState } from 'react';
import { Plus, LayoutDashboard, History, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLoans } from '../hooks/useLoans';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

import LoanSummaryBar from '../components/loans/LoanSummaryBar';
import LoanCard from '../components/loans/LoanCard';
import NewLoanModal from '../components/loans/NewLoanModal';
import RepayModal from '../components/loans/RepayModal';
import NotificationBell from '../components/loans/NotificationBell';

export default function Loans() {
  const { user } = useAuth();
  const { 
    pendingLoans, activeLoans, completedLoans, overdueLoans,
    totalOwed, totalToReceive, netBalance, loading, refetch
  } = useLoans();

  const [activeTab, setActiveTab] = useState('pending');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedRepayLoan, setSelectedRepayLoan] = useState(null);

  const pendingActionCount = pendingLoans.filter(l => l.recipient_id === user?.id).length;
  
  const nextDueLoan = activeLoans
    .filter(l => l.borrower_id === user?.id)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

  const nextDue = nextDueLoan ? {
    amount: nextDueLoan.remaining_amount,
    date: new Date(nextDueLoan.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  } : null;

  // Helper to call Edge Functions reliably
  const callLoanFunction = async (fnName, body) => {
    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${baseUrl}/functions/v1/${fnName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        'apikey': anonKey
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    if (result.error) throw new Error(result.error);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    return result;
  };

  const handleAccept = async (loanId) => {
    try {
      await callLoanFunction('accept-loan', { loan_id: loanId });
      toast.success('Loan accepted!');
      refetch();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleReject = async (loanId) => {
    try {
      await callLoanFunction('reject-loan', { loan_id: loanId });
      toast.success('Loan rejected.');
      refetch();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getFilteredLoans = () => {
    switch (activeTab) {
      case 'pending': return pendingLoans;
      case 'active': return activeLoans;
      case 'completed': return completedLoans;
      case 'overdue': return overdueLoans;
      default: return [];
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'pending': return 'No pending requests';
      case 'active': return 'No active loans';
      case 'completed': return 'No completed loans';
      case 'overdue': return 'No overdue loans!';
      default: return '';
    }
  };

  const tabs = [
    { id: 'pending', label: 'Requests', count: pendingLoans.length, icon: History },
    { id: 'active', label: 'Active', count: activeLoans.length, icon: LayoutDashboard },
    { id: 'overdue', label: 'Overdue', count: overdueLoans.length, icon: AlertCircle, color: overdueLoans.length > 0 ? '#ef4444' : undefined },
    { id: 'completed', label: 'History', count: completedLoans.length, icon: CheckCircle2 }
  ];

  return (
    <div className="page-container" style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Loans</h1>
          <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Personal lendings and borrowings between friends
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <NotificationBell />
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="primary-button"
            style={{ padding: '10px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            New Request
          </button>
        </div>
      </div>

      <LoanSummaryBar 
        totalOwed={totalOwed} 
        totalToReceive={totalToReceive} 
        netBalance={netBalance} 
        nextDue={nextDue}
        pendingActionCount={pendingActionCount}
      />

      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border-tertiary)', marginBottom: '20px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px', background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #7c6ff7' : '2px solid transparent',
              color: activeTab === tab.id ? '#7c6ff7' : 'var(--color-text-secondary)',
              cursor: 'pointer', fontSize: '13px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count > 0 && (
              <span style={{ fontSize: '10px', background: tab.color || '#7c6ff7', color: 'white', padding: '1px 6px', borderRadius: '10px' }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {getFilteredLoans().map(loan => (
            <LoanCard 
              key={loan.id} 
              loan={loan} 
              currentUserId={user?.id}
              onAccept={handleAccept}
              onReject={handleReject}
              onRepay={(l) => setSelectedRepayLoan(l)}
            />
          ))}
          {getFilteredLoans().length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '60px', textAlign: 'center', border: '1px dashed var(--color-border-tertiary)', borderRadius: '12px', color: 'var(--color-text-secondary)' }}>
              {getEmptyMessage()}
            </div>
          )}
        </div>
      )}

      <NewLoanModal isOpen={isNewModalOpen} onClose={() => setIsNewModalOpen(false)} onSuccess={refetch} />
      {selectedRepayLoan && (
        <RepayModal 
          loan={selectedRepayLoan} 
          isOpen={!!selectedRepayLoan} 
          onClose={() => setSelectedRepayLoan(null)} 
          onSuccess={refetch} 
        />
      )}
    </div>
  );
}
