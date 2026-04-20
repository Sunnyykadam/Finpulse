import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, Clock, UserPlus, CheckCircle, XCircle } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'new_request': return <UserPlus size={16} color="#7c6ff7" />;
      case 'accepted': return <CheckCircle size={16} color="#22c55e" />;
      case 'rejected': return <XCircle size={16} color="#ef4444" />;
      case 'repayment_made': return <Check size={16} color="#3b82f6" />;
      default: return <Bell size={16} />;
    }
  };

  const handleNotifClick = (n) => {
    markAsRead(n.id);
    if (n.loan_id) {
       navigate('/loans');
    }
    setIsOpen(false);
  };

  const formatTime = (date) => {
    const now = new Date();
    const then = new Date(date);
    const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return then.toLocaleDateString();
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '8px', color: 'var(--color-text-primary)',
          position: 'relative', display: 'flex', alignItems: 'center'
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '6px', right: '6px',
            background: '#ef4444', color: 'white',
            fontSize: '10px', height: '14px', minWidth: '14px',
            borderRadius: '10px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '0 4px',
            border: '2px solid var(--color-background-primary)'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, width: '300px',
          background: 'var(--color-background-primary)',
          border: '1px solid var(--color-border-tertiary)',
          borderRadius: '12px', marginTop: '8px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
          zIndex: 1000, overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid var(--color-border-tertiary)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontWeight: '600', fontSize: '14px' }}>Notifications</span>
            {unreadCount > 0 && (
              <button 
                onClick={markAllRead}
                style={{ 
                  background: 'none', border: 'none', color: '#7c6ff7', 
                  fontSize: '11px', cursor: 'pointer', fontWeight: '500' 
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  style={{
                    padding: '12px 16px', cursor: 'pointer',
                    background: n.is_read ? 'none' : 'rgba(124, 111, 247, 0.05)',
                    borderBottom: '0.5px solid var(--color-border-tertiary)',
                    display: 'flex', gap: '12px', position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-background-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = n.is_read ? 'none' : 'rgba(124, 111, 247, 0.05)'}
                >
                  <div style={{ marginTop: '2px' }}>{getIcon(n.type)}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.4', color: 'var(--color-text-primary)' }}>{n.message}</p>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <Clock size={10} />
                      {formatTime(n.created_at)}
                    </span>
                  </div>
                  {!n.is_read && (
                    <div style={{ 
                      width: '6px', height: '6px', background: '#7c6ff7', 
                      borderRadius: '50%', position: 'absolute', top: '14px', right: '8px' 
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
