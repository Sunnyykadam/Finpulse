import React from 'react';
import { TrendingDown, TrendingUp, Wallet, Bell, Calendar } from 'lucide-react';
import { formatCurrency } from '../../lib/loanHelpers';

export default function LoanSummaryBar({ totalOwed, totalToReceive, netBalance, nextDue, pendingActionCount }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '20px',
      marginBottom: '32px'
    }}>
      {/* 1. Primary Net Position Card */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #161625 100%)',
        border: '1px solid #2d2d44',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)'
      }}>
        <div style={{ 
          position: 'absolute', right: '-20px', top: '-20px', opacity: 0.05 
        }}>
          <Wallet size={120} strokeWidth={1} />
        </div>
        
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Net Financial Position
        </span>
        <div style={{ fontSize: '32px', fontWeight: '700', color: netBalance >= 0 ? '#4ade80' : '#f87171', margin: '8px 0' }}>
          {formatCurrency(netBalance)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
          {netBalance >= 0 ? <TrendingUp size={14} color="#4ade80" /> : <TrendingDown size={14} color="#f87171" />}
          {netBalance >= 0 ? 'Surplus Credit' : 'Net Debt'}
        </div>
      </div>

      {/* 2. Breakdown and Alerts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{
          flex: 1, background: '#161625', border: '1px solid #2d2d44', borderRadius: '16px',
          padding: '16px', display: 'flex', alignItems: 'center', gap: '16px'
        }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(91, 76, 245, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5b4cf5'
          }}>
            <Bell size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Attention Required</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: pendingActionCount > 0 ? '#fbbf24' : 'white' }}>
              {pendingActionCount} {pendingActionCount === 1 ? 'Request' : 'Requests'} waiting for you
            </div>
          </div>
        </div>

        <div style={{
          flex: 1, background: '#161625', border: '1px solid #2d2d44', borderRadius: '16px',
          padding: '16px', display: 'flex', alignItems: 'center', gap: '16px'
        }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(45, 212, 191, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2dd4bf'
          }}>
            <Calendar size={20} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>Next Payment Due</div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>
              {nextDue ? `${formatCurrency(nextDue.amount)} on ${nextDue.date}` : 'No upcoming payments'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Quick Cashflow Card */}
      <div style={{
        background: '#161625', border: '1px solid #2d2d44', borderRadius: '20px',
        padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #2d2d44' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Receivable</span>
          <span style={{ fontWeight: '600', color: '#4ade80' }}>{formatCurrency(totalToReceive)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>Payable</span>
          <span style={{ fontWeight: '600', color: '#f87171' }}>{formatCurrency(totalOwed)}</span>
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
          <div style={{ height: '6px', background: '#2d2d44', borderRadius: '10px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ 
              width: `${(totalToReceive / (totalToReceive + totalOwed || 1)) * 100}%`, 
              background: '#4ade80' 
            }} />
            <div style={{ 
              width: `${(totalOwed / (totalToReceive + totalOwed || 1)) * 100}%`, 
              background: '#f87171' 
            }} />
          </div>
          <div style={{ marginTop: '6px', fontSize: '10px', textAlign: 'center', color: 'rgba(255,255,255,0.3)' }}>
            Credit-to-Debt Ratio
          </div>
        </div>
      </div>
    </div>
  );
}
