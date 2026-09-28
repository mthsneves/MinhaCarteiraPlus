import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import * as authService from '../services/auth';

// Define o formato dos dados que nosso Contexto vai compartilhar com o app
type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: typeof authService.signInWithEmail;
  signUp: typeof authService.signUpWithEmail;
  signOut: typeof authService.signOut;
  signInWithGoogle: typeof authService.signInWithGoogle;
};

// Cria o contexto (inicialmente vazio)
const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Hook customizado para facilitar o uso do Contexto nas telas (ex: const { user } = useAuth())
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Busca a sessão atual assim que o app abre (usando o SecureStore)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 2. Fica escutando qualquer mudança (login, logout, token expirado)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Limpa o listener quando o componente for desmontado
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Disponibiliza as variáveis e funções para todo o aplicativo
  const value = {
    user,
    session,
    isLoading,
    signIn: authService.signInWithEmail,
    signUp: authService.signUpWithEmail,
    signOut: authService.signOut,
    signInWithGoogle: authService.signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
