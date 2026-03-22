import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { UserProfile } from '../types'

interface AuthContextType {
  session: Session | null
  userProfile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string, displayName?: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithProvider: (provider: 'google' | 'github' | 'discord') => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  const withTimeout = async <T,>(promise: PromiseLike<T>, ms: number): Promise<T> => {
    return await Promise.race([
      Promise.resolve(promise),
      new Promise<T>((_, reject) => {
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), ms)
      }),
    ])
  }

  const loadUserProfile = useCallback(async (userId: string) => {
    if (!supabase) return
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        10000,
      )

      if (error) {
        console.error('Failed to load user profile:', error)
        setUserProfile(null)
        return
      }

      if (data) {
        setUserProfile(data)
      } else {
        setUserProfile(null)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      setUserProfile(null)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return
    const client = supabase

    let isMounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await withTimeout(client.auth.getSession(), 10000)

        if (!isMounted) return

        setSession(session)
        setLoading(false)

        if (session?.user) {
          void loadUserProfile(session.user.id)
        }
      } catch (err) {
        if (!isMounted) return
        console.error('Auth session initialization failed:', err)
        setSession(null)
        setUserProfile(null)
        setLoading(false)
      }
    }

    void initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return

      setSession(session)
      setLoading(false)

      if (session?.user) {
        void loadUserProfile(session.user.id)
      } else {
        setUserProfile(null)
      }
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [loadUserProfile])

  const signUp = async (email: string, password: string, displayName?: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signInWithProvider = async (provider: 'google' | 'github' | 'discord') => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/whiteboard`,
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    if (!supabase) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!supabase || !session?.user) throw new Error('Not authenticated')
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', session.user.id)
    if (error) throw error
    await loadUserProfile(session.user.id)
  }

  return (
    <AuthContext.Provider
      value={{ session, userProfile, loading, signUp, signIn, signInWithProvider, signOut, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
