import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export function useLoans() {
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLoans = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Mark overdue loans first
      await supabase.rpc('mark_overdue_loans');

      // Fetch loans with explicit relationship naming
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          requester:profiles!loans_requester_id_fkey(name),
          recipient:profiles!loans_recipient_id_fkey(name),
          borrower:profiles!loans_borrower_id_fkey(name),
          lender:profiles!loans_lender_id_fkey(name)
        `)
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('SUPABASE FETCH ERROR:', error);
        throw error;
      }
      
      console.log('LOANS DATA RECEIVED:', data);
      setLoans(data || []);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLoans();

    const channel = supabase
      .channel('finpulse-loans')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'loans' }, 
        () => fetchLoans()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLoans]);

  const pendingLoans = loans.filter(l => l.status === 'pending');
  const activeLoans = loans.filter(l => l.status === 'active');
  const completedLoans = loans.filter(l => l.status === 'completed' || l.status === 'rejected');
  const overdueLoans = loans.filter(l => l.status === 'overdue');

  const totalOwed = activeLoans
    .concat(overdueLoans)
    .filter(l => l.borrower_id === user?.id)
    .reduce((sum, l) => sum + Number(l.remaining_amount), 0);

  const totalToReceive = activeLoans
    .concat(overdueLoans)
    .filter(l => l.lender_id === user?.id)
    .reduce((sum, l) => sum + Number(l.remaining_amount), 0);

  const netBalance = totalToReceive - totalOwed;

  return {
    loans,
    pendingLoans,
    activeLoans,
    completedLoans,
    overdueLoans,
    totalOwed,
    totalToReceive,
    netBalance,
    loading,
    refetch: fetchLoans
  };
}
