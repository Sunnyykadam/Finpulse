import React from 'react';
import { ArrowRight, Calendar, Info, Clock, CheckCircle2, X } from 'lucide-react';
import { formatCurrency, getStatusColor, calculateDaysOverdue } from '../../lib/loanHelpers';

export default function LoanCard({ loan, currentUserId, onAccept, onReject, onRepay }) {
  const isBorrower = loan.borrower_id === currentUserId;
  const isLender = loan.lender_id === currentUserId;
  const isRecipient = loan.recipient_id === currentUserId;
  const isRequester = loan.requester_id === currentUserId;
  
  const statusStyle = getStatusColor(loan.status);
  const overdueDays = calculateDaysOverdue(loan.due_date);

  // Determine display names
  const borrowerName = loan.borrower?.name || (loan.loan_type === 'borrow' ? loan.requester?.name : loan.recipient?.name) || 'Unknown';
  const lenderName = loan.lender?.name || (loan.loan_type === 'lend' ? loan.requester?.name : loan.recipient?.name) || 'Unknown';

  return (
    <div style={{
      background: 'var(--color-background-primary)',
      border: '0.5px solid var(--color-border-tertiary)',
      borderRadius: '10px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default'
    }}>
      {/* Top Row: Borrower -> Lender + Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500' }}>
          <span>{borrowerName}</span>
          <ArrowRight size={14} style={{ color: 'var(--color-text-secondary)' }} />
          <span>{lenderName}</span>
        </div>
        <div style={{
          background: statusStyle.bg,
          color: statusStyle.color,
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: statusStyle.fontWeight || '500',
          textTransform: 'capitalize'
        }}>
          {loan.status}
        </div>
      </div>

      {/* Row 2: Amount & Due Date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: '600' }}>{formatCurrency(loan.amount)}</div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} />
            Due: {new Date(loan.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </div>
        </div>
        {loan.status === 'overdue' && (
          <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} />
            {overdueDays} days overdue
          </div>
        )}
      </div>

      {/* Row 3: Remaining, Payment Method, Interest */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <div style={{ 
          fontSize: '12px', 
          background: 'var(--color-background-secondary)', 
          padding: '4px 8px', 
          borderRadius: '6px',
          border: '0.5px solid var(--color-border-secondary)'
        }}>
          Remaining: {formatCurrency(loan.remaining_amount)}
        </div>
        <div style={{ 
          fontSize: '11px', 
          background: 'var(--color-background-secondary)', 
          padding: '4px 8px', 
          borderRadius: '6px',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          color: 'var(--color-text-secondary)'
        }}>
          {loan.payment_method}
        </div>
      </div>

      {/* Notes Row */}
      {loan.notes && (
        <div style={{ 
          fontSize: '12px', 
          color: 'var(--color-text-secondary)', 
          fontStyle: 'italic',
          borderTop: '0.5px solid var(--color-border-tertiary)',
          paddingTop: '8px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          "{loan.notes}"
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ marginTop: '4px', display: 'flex', gap: '8px' }}>
        {loan.status === 'pending' && isRecipient && (
          <>
            <button 
              onClick={() => onAccept(loan.id)}
              style={{
                flex: 1,
                padding: '8px',
                background: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Accept
            </button>
            <button 
              onClick={() => onReject(loan.id)}
              style={{
                flex: 1,
                padding: '8px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Reject
            </button>
          </>
        )}

        {loan.status === 'pending' && isRequester && (
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--color-text-secondary)', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            width: '100%',
            justifyContent: 'center',
            padding: '8px',
            background: 'var(--color-background-secondary)',
            borderRadius: '6px'
          }}>
            <Clock size={14} />
            Awaiting response
          </div>
        )}

        {(loan.status === 'active' || loan.status === 'overdue') && isBorrower && (
          <button 
            onClick={() => onRepay(loan)}
            style={{
              width: '100%',
              padding: '10px',
              background: '#5b4cf5',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Repay Loan
          </button>
        )}

        {loan.status === 'completed' && (
          <div style={{ 
            width: '100%',
            padding: '8px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#065f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: '#d1fae5',
            borderRadius: '6px'
          }}>
            <CheckCircle2 size={14} />
            Completed
          </div>
        )}

        {loan.status === 'rejected' && (
          <div style={{ 
            width: '100%',
            padding: '8px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: '#fee2e2',
            borderRadius: '6px',
            fontWeight: '600'
          }}>
            <X size={14} />
            Rejected
          </div>
        )}
      </div>
    </div>
  );
}
