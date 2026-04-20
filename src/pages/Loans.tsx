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
    <div className="page-container">
      <div className="stack-mobile" style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Loans</h1>
          <p className="header-date">
            Personal lendings and borrowings between friends
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <NotificationBell />
          <button 
            onClick={() => setIsNewModalOpen(true)}
            className="btn btn-primary"
          >
            <Plus size={18} />
            <span>New Request</span>
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

      <div className="scroll-x" style={{ borderBottom: '1px solid var(--color-border)', marginBottom: '20px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px', background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', 
              whiteSpace: 'nowrap'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
            {tab.count > 0 && (
              <span className="badge badge-sm" style={{ background: tab.color || 'var(--color-primary)', color: 'white' }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center' }}>Loading...</div>
      ) : (
        <div className="grid-responsive">
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
            <div className="empty-state" style={{ gridColumn: '1 / -1', border: '1px dashed var(--color-border)', borderRadius: '12px' }}>
               <AlertCircle className="empty-state-icon" size={32} />
               <p className="empty-state-title">{getEmptyMessage()}</p>
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
