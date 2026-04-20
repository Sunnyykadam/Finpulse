import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { 
  User, Mail, Phone, Calendar, Banknote, Landmark, 
  Lock, LogOut, Camera, Shield, GraduationCap, 
  Save, ChevronRight, Bell, Moon
} from 'lucide-react';

export default function Profile() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // States for different sections
  const [infoForm, setInfoForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    age: profile?.age || '',
    college: 'Your University', // Custom field example
  });

  const [balanceForm, setBalanceForm] = useState({
    cash_balance: profile?.cash_balance || 0,
    bank_balance: profile?.bank_balance || 0,
  });

  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: '',
  });

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: infoForm.name,
          phone: infoForm.phone,
          age: parseInt(infoForm.age as string) || 0,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id);

      if (error) throw error;
      toast.success('Information updated!');
      refreshProfile();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBalances = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          cash_balance: Number(balanceForm.cash_balance),
          bank_balance: Number(balanceForm.bank_balance),
        })
        .eq('user_id', user?.id);

      if (error) throw error;
      toast.success('Balances updated successfully!');
      refreshProfile();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return toast.error('Passwords do not match');
    }
    if (passwordForm.new_password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.new_password
      });
      if (error) throw error;
      toast.success('Password changed successfully!');
      setPasswordForm({ new_password: '', confirm_password: '' });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' }}>
      <style>{`
        .profile-header { display: flex; align-items: center; gap: 24px; margin-bottom: 32px; padding: 20px; background: var(--color-card); border-radius: 20px; border: 1px solid var(--color-border); }
        .avatar-wrap { position: relative; width: 100px; height: 100px; }
        .avatar { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 4px solid var(--color-primary-light); }
        .avatar-edit { position: absolute; bottom: 0; right: 0; background: var(--color-primary); color: white; padding: 8px; border-radius: 50%; border: 3px solid var(--color-card); cursor: pointer; }
        
        .profile-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .config-section { background: var(--color-card); border-radius: 20px; border: 1px solid var(--color-border); padding: 24px; }
        .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; border-bottom: 1px solid var(--color-border); padding-bottom: 12px; }
        .section-header h2 { font-size: 16px; font-weight: 700; margin: 0; }
        
        .field-group { margin-bottom: 16px; }
        .field-group label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-secondary); margin-bottom: 6px; }
        .input-wrap { position: relative; }
        .input-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--color-text-secondary); }
        .input-wrap input { width: 100%; padding: 12px 12px 12px 42px; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-input-bg); color: inherit; font-size: 14px; }
        
        .action-row { display: flex; justify-content: flex-end; margin-top: 12px; }
        .logout-btn { display: flex; align-items: center; gap: 8px; color: #ef4444; background: transparent; border: 1px solid #ef4444; padding: 12px 24px; border-radius: 14px; cursor: pointer; font-weight: 600; width: 100%; justify-content: center; transition: all 0.2s; margin-top: 20px; }
        .logout-btn:hover { background: #ef4444; color: white; }
      `}</style>

      <div className="profile-header">
        <div className="avatar-wrap">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name || 'Sunny'}`} alt="Avatar" className="avatar" />
          <div className="avatar-edit"><Camera size={16} /></div>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>{profile?.name || 'Student'}</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>{user?.email}</p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
             <span className="badge badge-primary">Student Account</span>
             <span className="badge badge-ghost">Verified</span>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        {/* PERSONAL INFO */}
        <div className="config-section">
          <div className="section-header">
            <User size={18} color="var(--color-primary)" />
            <h2>Personal Information</h2>
          </div>
          <form onSubmit={handleUpdateInfo}>
            <div className="field-group">
              <label>Full Name</label>
              <div className="input-wrap">
                <User size={16} />
                <input type="text" value={infoForm.name} onChange={e => setInfoForm({...infoForm, name: e.target.value})} />
              </div>
            </div>
            <div className="field-group">
              <label>Phone Number</label>
              <div className="input-wrap">
                <Phone size={16} />
                <input type="text" value={infoForm.phone} onChange={e => setInfoForm({...infoForm, phone: e.target.value})} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="field-group">
                <label>Age</label>
                <div className="input-wrap">
                  <Calendar size={16} />
                  <input type="number" value={infoForm.age} onChange={e => setInfoForm({...infoForm, age: e.target.value})} />
                </div>
              </div>
              <div className="field-group">
                <label>University/College</label>
                <div className="input-wrap">
                  <GraduationCap size={16} />
                  <input type="text" value={infoForm.college} onChange={e => setInfoForm({...infoForm, college: e.target.value})} />
                </div>
              </div>
            </div>
            <div className="action-row">
              <button className="btn btn-primary" type="submit" disabled={loading}>
                <Save size={16} /> Save Information
              </button>
            </div>
          </form>
        </div>

        {/* BALANCE MANAGEMENT */}
        <div className="config-section">
          <div className="section-header">
            <Banknote size={18} color="#22c55e" />
            <h2>Balance Management</h2>
          </div>
          <form onSubmit={handleUpdateBalances}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="field-group">
                <label>Cash Balance (₹)</label>
                <div className="input-wrap">
                  <Wallet size={16} />
                  <input type="number" value={balanceForm.cash_balance} onChange={e => setBalanceForm({...balanceForm, cash_balance: Number(e.target.value)})} />
                </div>
              </div>
              <div className="field-group">
                <label>Bank Balance (₹)</label>
                <div className="input-wrap">
                  <Landmark size={16} />
                  <input type="number" value={balanceForm.bank_balance} onChange={e => setBalanceForm({...balanceForm, bank_balance: Number(e.target.value)})} />
                </div>
              </div>
            </div>
            <div className="action-row">
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ background: '#22c55e' }}>
                <Save size={16} /> Update Balances
              </button>
            </div>
          </form>
        </div>

        {/* SECURITY */}
        <div className="config-section">
          <div className="section-header">
            <Shield size={18} color="#f59e0b" />
            <h2>Security & Authentication</h2>
          </div>
          <form onSubmit={handleChangePassword}>
            <div className="field-group">
              <label>New Password</label>
              <div className="input-wrap">
                <Lock size={16} />
                <input type="password" placeholder="Min. 6 characters" value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} />
              </div>
            </div>
            <div className="field-group">
              <label>Confirm Password</label>
              <div className="input-wrap">
                <Lock size={16} />
                <input type="password" placeholder="Confirm your password" value={passwordForm.confirm_password} onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})} />
              </div>
            </div>
            <div className="action-row">
              <button className="btn btn-primary" type="submit" disabled={loading} style={{ background: '#f59e0b' }}>
                Change Password
              </button>
            </div>
          </form>

          <button className="logout-btn" onClick={signOut}>
            <LogOut size={18} /> Logout and End Session
          </button>
        </div>

        {/* PREFERENCES (MOCKED) */}
        <div className="config-section" style={{ opacity: 0.8 }}>
          <div className="section-header">
            <Bell size={18} />
            <h2>App Preferences</h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
            <span>Dark Mode Appearance</span>
            <div style={{ width: '40px', height: '20px', background: 'var(--color-primary)', borderRadius: '20px' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', marginTop: '12px' }}>
            <span>Daily Budget Alerts</span>
            <div style={{ width: '40px', height: '20px', background: 'var(--color-border)', borderRadius: '20px' }}></div>
          </div>
        </div>

      </div>
    </div>
  );
}

const Wallet = Banknote; // Alias
