import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

/**
 * Função para fazer login com Email e Senha
 */
export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(getErrorMessage(error.message));
  }

  return data;
}

/**
 * Função para criar uma nova conta com Email e Senha
 */
export async function signUpWithEmail(email: string, password: string, displayName?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      }
    }
  });

  if (error) {
    throw new Error(getErrorMessage(error.message));
  }

  return data;
}

/**
 * Função para fazer logout
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(getErrorMessage(error.message));
  }
}

/**
 * Função para login com Google (OAuth)
 */
export async function signInWithGoogle() {
  const redirectUrl = Linking.createURL('/');
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
    },
  });

  if (error) {
    throw new Error(getErrorMessage(error.message));
  }

  if (data?.url) {
    // Abre o navegador interno do celular
    const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);
    
    // Se a autenticação der certo, o Supabase já intercepta e atualiza a sessão sozinho
  }
  
  return data;
}

/**
 * Helper para traduzir os erros comuns do Supabase para Português
 */
function getErrorMessage(errorMsg: string): string {
  if (errorMsg.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (errorMsg.includes('User already registered')) {
    return 'Este e-mail já está cadastrado.';
  }
  if (errorMsg.includes('Password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (errorMsg.includes('Email not confirmed')) {
    return 'Por favor, confirme seu e-mail antes de fazer login.';
  }
  return `Erro inesperado: ${errorMsg}`;
}

/**
 * Função para atualizar o nome do usuário logado
 */
export async function updateUserName(displayName: string) {
  const { data, error } = await supabase.auth.updateUser({
    data: { display_name: displayName }
  });

  if (error) {
    throw new Error(getErrorMessage(error.message));
  }

  return data;
}
