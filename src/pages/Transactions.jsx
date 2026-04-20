import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Filter, Download, Search, Edit2, Trash2, ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Landmark, Banknote, Smartphone, CreditCard, MoreHorizontal } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import TransactionModal from '../components/transactions/TransactionModal'

const PAGE_SIZE = 15

const CATEGORIES = [
  { value: 'Food', label: 'Food & Canteen', emoji: '🍜', color: '#f87171' },
  { value: 'Rent', label: 'Hostel/Rent', emoji: '🏠', color: '#a78bfa' },
  { value: 'Salary', label: 'Pocket Money/Job', emoji: '💸', color: '#34d399' },
  { value: 'EMI', label: 'Fees/Loans', emoji: '🎓', color: '#818cf8' },
  { value: 'Medical', label: 'Medical', emoji: '🏥', color: '#f472b6' },
  { value: 'Entertainment', label: 'Entertainment', emoji: '🎬', color: '#fb7185' },
  { value: 'Shopping', label: 'Shopping', emoji: '🛍️', color: '#2dd4bf' },
  { value: 'Other', label: 'Other/Study', emoji: '📋', color: '#94a3b8' },
]

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash', icon: Banknote },
  { value: 'bank', label: 'Bank', icon: Landmark }
]

const TYPE_COLORS = { expense: '#ef4444', income: '#22c55e' }

const getCatEmoji = val => CATEGORIES.find(c => c.value === val)?.emoji || '💰'
const getPayIcon = val => PAYMENT_METHODS.find(pm => pm.value === val)?.icon || MoreHorizontal

export default function Transactions() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [goals, setGoals] = useState([])
  const [budgets, setBudgets] = useState([])
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  
  const [filters, setFilters] = useState({
    dateFrom: '', dateTo: '', types: [], categories: [], methods: [], search: '',
    sortBy: 'date_time', sortDir: 'desc'
  })
  
  const [draftFilters, setDraftFilters] = useState(filters)
  const [timePeriod, setTimePeriod] = useState('All')

  const fetchTransactions = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      let query = supabase.from('transactions').select('*', { count: 'exact' }).eq('user_id', user.id)
      
      let finalDateFrom = filters.dateFrom
      let finalDateTo = filters.dateTo
      
      if (!finalDateFrom && !finalDateTo && timePeriod !== 'All') {
         if (timePeriod === 'This Week') {
            const d = new Date()
            const day = d.getDay()
            const diff = d.getDate() - day + (day === 0 ? -6 : 1)
            const start = new Date(d.setDate(diff))
            start.setHours(0,0,0,0)
            const end = new Date(start)
            end.setDate(end.getDate() + 6)
            end.setHours(23,59,59,999)
            finalDateFrom = start.toISOString()
            finalDateTo = end.toISOString()
         } else if (timePeriod === 'This Month') {
            const d = new Date()
            const start = new Date(d.getFullYear(), d.getMonth(), 1)
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
            finalDateFrom = start.toISOString()
            finalDateTo = end.toISOString()
         }
      } else {
         if (finalDateFrom) finalDateFrom = new Date(finalDateFrom).toISOString()
         if (finalDateTo) finalDateTo = new Date(finalDateTo + 'T23:59:59').toISOString()
      }

      if (finalDateFrom) query = query.gte('date_time', finalDateFrom)
      if (finalDateTo) query = query.lte('date_time', finalDateTo)
      
      if (filters.types?.length > 0) query = query.in('type', filters.types)
      if (filters.categories?.length > 0) query = query.in('category', filters.categories)
      if (filters.methods?.length > 0) query = query.in('payment_method', filters.methods)
      if (filters.search) query = query.ilike('note', `%${filters.search}%`)
      query = query.order(filters.sortBy, { ascending: filters.sortDir === 'asc' })
      query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
      const { data, count, error } = await query
      if (error) throw error
      setTransactions(data || [])
      setTotalCount(count || 0)
    } catch (err) {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [user, filters, timePeriod, page])

  const fetchGoals = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('goals').select('*').eq('user_id', user.id).eq('status', 'active')
    setGoals(data || [])
  }, [user])

  useEffect(() => { fetchTransactions() }, [fetchTransactions])
  useEffect(() => { fetchGoals() }, [fetchGoals])

  const handleSubmit = async (payload, editId) => {
    try {
      if (editId) {
        const { error } = await supabase.from('transactions').update(payload).eq('id', editId).eq('user_id', user.id)
        if (error) throw error
        toast.success('Updated!')
      } else {
        const { error } = await supabase.from('transactions').insert([payload])
        if (error) throw error
        toast.success('Saved!')
      }
      fetchTransactions()
    } catch (err) {
      toast.error('Operation failed')
    }
  }

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
      if (error) throw error
      toast.success('Deleted')
      setDeleteConfirm(null)
      fetchTransactions()
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  const handleExportCSV = () => {
    if (transactions.length === 0) return toast.error('No data to export')
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Method', 'Note']
    const content = transactions.map(t => [
      format(new Date(t.date_time), 'yyyy-MM-dd HH:mm'),
      t.type, t.category, t.amount, t.payment_method, t.note
    ])
    const csv = [headers, ...content].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  const activeFilterCount = Object.keys(filters).filter(k => 
    k !== 'sortBy' && k !== 'sortDir' && 
    (Array.isArray(filters[k]) ? filters[k].length > 0 : !!filters[k])
  ).length

  return (
    <div className="page-container">
      <div className="stack-mobile" style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Transactions</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => {
            setShowFilters(!showFilters)
            if (!showFilters) setDraftFilters(filters)
          }}>
            <Filter size={16} /> Filters {activeFilterCount > 0 && <span className="badge badge-primary">{activeFilterCount}</span>}
          </button>
          <button className="btn btn-ghost" onClick={handleExportCSV}>
            <Download size={16} /> Export
          </button>
          <button className="btn btn-primary" onClick={() => { setEditData(null); setModalOpen(true) }}>
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card" style={{ marginBottom: 20, animation: 'fadeIn 0.2s ease' }}>
          <div className="grid-responsive" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="form-group">
              <label>From Date</label>
              <input type="date" value={draftFilters.dateFrom} onChange={e => setDraftFilters(f => ({ ...f, dateFrom: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <input type="date" value={draftFilters.dateTo} onChange={e => setDraftFilters(f => ({ ...f, dateTo: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Search Notes</label>
              <div className="search-input-wrapper">
                <Search size={16} />
                <input type="text" placeholder="Search..." value={draftFilters.search} onChange={e => setDraftFilters(f => ({ ...f, search: e.target.value }))} />
              </div>
            </div>
          </div>
          
          <div className="form-actions" style={{ marginTop: 16 }}>
            <button className="btn btn-ghost" onClick={() => {
              const reset = { dateFrom: '', dateTo: '', types: [], categories: [], methods: [], search: '', sortBy: 'date_time', sortDir: 'desc' }
              setDraftFilters(reset); setFilters(reset); setPage(0); setShowFilters(false)
            }}>Reset</button>
            <button className="btn btn-primary" onClick={() => { setFilters(draftFilters); setPage(0); setShowFilters(false) }}>Apply</button>
          </div>
        </div>
      )}

      <div className="scroll-x" style={{ marginBottom: 20 }}>
        {['All', 'This Week', 'This Month'].map(t => (
          <button key={t} onClick={() => { setTimePeriod(t); setPage(0) }}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-border)',
              background: timePeriod === t ? 'var(--color-primary)' : 'var(--color-input-bg)',
              color: timePeriod === t ? '#fff' : 'inherit', cursor: 'pointer', fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap'
            }}>{t}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-secondary)' }}>Loading...</div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>No records found</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <div className="tx-table tx-table-desktop">
                <div className="tx-table-header">
                  <span>Date</span>
                  <span>Type</span>
                  <span>Category</span>
                  <span>Method</span>
                  <span>Amount</span>
                  <span>Actions</span>
                </div>
                {transactions.map(t => (
                  <div key={t.id} className="tx-table-row">
                    <span style={{ whiteSpace: 'nowrap' }}>{format(new Date(t.date_time), 'MMM d, HH:mm')}</span>
                    <span className="badge" style={{ background: TYPE_COLORS[t.type]+'20', color: TYPE_COLORS[t.type] }}>{t.type}</span>
                    <span style={{ whiteSpace: 'nowrap' }}>{getCatEmoji(t.category)} {t.category}</span>
                    <span className="badge badge-sm">{t.payment_method}</span>
                    <span className={`tx-amount ${t.type}`} style={{ fontWeight: 700 }}>₹{t.amount.toLocaleString('en-IN')}</span>
                    <div className="tx-actions">
                      <button className="icon-btn" onClick={() => { setEditData(t); setModalOpen(true) }}><Edit2 size={14}/></button>
                      <button className="icon-btn danger" onClick={() => setDeleteConfirm(t.id)}><Trash2 size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="tx-cards-mobile">
              {transactions.map(t => (
                <div key={`m-${t.id}`} className="tx-card">
                  <div className="tx-card-top">
                    <div className="tx-card-category">
                      <span className="tx-card-emoji">{getCatEmoji(t.category)}</span>
                      <span className="tx-card-cat-name">{t.category}</span>
                    </div>
                    <span className={`tx-card-amount ${t.type}`}>₹{t.amount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="tx-card-details">
                    <span>{format(new Date(t.date_time), 'MMM d, yyyy · HH:mm')}</span>
                    <span style={{ textTransform: 'capitalize' }}>{t.payment_method} · {t.type}</span>
                    {t.note && <span style={{ fontStyle: 'italic' }}>"{t.note}"</span>}
                  </div>
                  <div className="tx-card-actions">
                    <button className="btn btn-ghost btn-sm btn-full" onClick={() => { setEditData(t); setModalOpen(true) }}>Edit</button>
                    <button className="btn btn-danger btn-sm btn-full" onClick={() => setDeleteConfirm(t.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pagination" style={{ padding: 16, borderTop: '1px solid var(--color-border)' }}>
              <button className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Prev</button>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Page {page + 1}/{totalPages}</span>
              <button className="btn btn-ghost btn-sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </>
        )}
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null) }}
        onSubmit={handleSubmit}
        editData={editData}
        cashBalance={profile?.cash_balance || 0}
        bankBalance={profile?.bank_balance || 0}
      />

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()} style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 12 }}>Confirm Delete</h3>
            <p style={{ marginBottom: 20, opacity: 0.8, fontSize: 14 }}>Are you sure you want to remove this transaction?</p>
            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
