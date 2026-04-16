import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mountedRef.current) return
        
        if (error) {
          console.error('getSession error:', error)
          setLoading(false)
          return
        }

        if (session?.user) {
          setUser(session.user)
          await loadProfile(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Auth init error:', err)
        if (mountedRef.current) setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mountedRef.current) return
        
        console.log('Auth event:', event)
        
        if (session?.user) {
          setUser(session.user)
          if (event === 'SIGNED_IN') {
            await loadProfile(session.user.id)
          }
        } else {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mountedRef.current = false
      subscription.unsubscribe()
    }
  }, [])

  const loadProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (!mountedRef.current) return

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet — create one
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert([{ user_id: userId, name: 'User', bank_balance: 0, cash_balance: 0, liabilities: 0 }])
          .select()
          .single()
        
        if (!createError && mountedRef.current) {
          setProfile(newProfile)
        } else if (createError) {
          console.error('Profile create error:', createError)
        }
      } else if (error) {
        // Table might not exist or RLS is blocking — still let user in
        console.error('Profile fetch error:', error.message)
      } else {
        setProfile(data)
      }
    } catch (err) {
      console.error('loadProfile exception:', err)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user' }
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .single()
    if (!error) setProfile(data)
    return { data, error }
  }

  const signIn = async (email, password) => {
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) {
      setLoading(false)
    }
    // On success, onAuthStateChange will fire and call loadProfile
    return { data, error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, updateProfile, refreshProfile: () => user && loadProfile(user.id) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
