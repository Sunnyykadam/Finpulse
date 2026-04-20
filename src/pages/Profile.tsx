import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { 
  User, Mail, Phone, Calendar, Banknote, Landmark, 
  Lock, LogOut, Camera, Shield, GraduationCap, 
  Save, ChevronRight, Bell, Moon, Wallet
} from 'lucide-react';

export default function Profile() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [infoForm, setInfoForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    age: String(profile?.age || ''),
    college: 'Your University',
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
          age: parseInt(infoForm.age) || 0,
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
      toast.success('Balances updated!');
      refreshProfile();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) return toast.error('Passwords mismatch');
    if (passwordForm.new_password.length < 6) return toast.error('Too short');

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.new_password });
      if (error) throw error;
      toast.success('Password changed!');
      setPasswordForm({ new_password: '', confirm_password: '' });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <style>{`
        .profile-header { display: flex; align-items: center; gap: 24px; margin-bottom: 24px; padding: clamp(16px, 4vw, 32px); background: var(--color-card); border-radius: 20px; border: 1px solid var(--color-border); flex-wrap: wrap; }
        .avatar-wrap { position: relative; width: clamp(80px, 15vw, 100px); height: clamp(80px, 15vw, 100px); }
        .avatar { width: 100%; height: 100%; border-radius: 50%; border: 4px solid var(--color-primary-light); }
        
        .config-section { background: var(--color-card); border-radius: 20px; border: 1px solid var(--color-border); padding: clamp(16px, 4vw, 24px); margin-bottom: 20px; }
        .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .section-header h2 { font-size: 16px; margin: 0; }
        
        .field-group label { display: block; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-secondary); margin-bottom: 6px; }
        .input-wrap { position: relative; width: 100%; }
        .input-wrap svg { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--color-text-secondary); }
        .input-wrap input { width: 100% !important; padding-left: 42px !important; }
      `}</style>

      <div className="profile-header">
        <div className="avatar-wrap">
          <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.name || 'Sunny'}`} alt="Avatar" className="avatar" />
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h1 style={{ margin: 0 }}>{profile?.name || 'Student'}</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>{user?.email}</p>
        </div>
      </div>

      <div className="stack-mobile" style={{ gap: '20px' }}>
        {/* INFO */}
        <div className="config-section" style={{ flex: 1 }}>
          <div className="section-header">
            <User size={18} color="var(--color-primary)" />
            <h2>Personal Info</h2>
          </div>
          <form onSubmit={handleUpdateInfo} className="stack-mobile" style={{ gap: '12px' }}>
            <div className="field-group">
              <label>Name</label>
              <div className="input-wrap"><User size={16} /><input type="text" value={infoForm.name} onChange={e => setInfoForm({...infoForm, name: e.target.value})} /></div>
            </div>
            <div className="field-group">
              <label>Phone</label>
              <div className="input-wrap"><Phone size={16} /><input type="text" value={infoForm.phone} onChange={e => setInfoForm({...infoForm, phone: e.target.value})} /></div>
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>Save Info</button>
          </form>
        </div>

        {/* BALANCES */}
        <div className="config-section" style={{ flex: 1 }}>
          <div className="section-header">
            <Banknote size={18} color="#22c55e" />
            <h2>Balances</h2>
          </div>
          <form onSubmit={handleUpdateBalances} className="stack-mobile" style={{ gap: '12px' }}>
            <div className="field-group">
              <label>Cash (₹)</label>
              <div className="input-wrap"><Wallet size={16} /><input type="number" value={balanceForm.cash_balance} onChange={e => setBalanceForm({...balanceForm, cash_balance: Number(e.target.value)})} /></div>
            </div>
            <div className="field-group">
              <label>Bank (₹)</label>
              <div className="input-wrap"><Landmark size={16} /><input type="number" value={balanceForm.bank_balance} onChange={e => setBalanceForm({...balanceForm, bank_balance: Number(e.target.value)})} /></div>
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ background: '#22c55e' }}>Update Balances</button>
          </form>
        </div>
      </div>

      {/* SECURITY */}
      <div className="config-section">
        <div className="section-header"><Shield size={18} color="#f59e0b" /><h2>Security</h2></div>
        <form onSubmit={handleChangePassword} className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', alignItems: 'flex-end' }}>
          <div className="field-group">
            <label>New Password</label>
            <div className="input-wrap"><Lock size={16} /><input type="password" value={passwordForm.new_password} onChange={e => setPasswordForm({...passwordForm, new_password: e.target.value})} /></div>
          </div>
          <div className="field-group">
            <label>Confirm</label>
            <div className="input-wrap"><Lock size={16} /><input type="password" value={passwordForm.confirm_password} onChange={e => setPasswordForm({...passwordForm, confirm_password: e.target.value})} /></div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ background: '#f59e0b', height: '44px' }}>Change Password</button>
        </form>
        
        <button className="btn btn-outline btn-full" onClick={signOut} style={{ marginTop: '24px', borderColor: '#ef4444', color: '#ef4444' }}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}
