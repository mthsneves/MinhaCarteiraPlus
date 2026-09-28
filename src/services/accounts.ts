import { supabase } from './supabase';
import { Database } from '../types/database';

type AccountRow = Database['public']['Tables']['accounts']['Row'];
type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
type AccountUpdate = Database['public']['Tables']['accounts']['Update'];

// Helper para lidar com erro de 'JWT issued at future' comum ao logar em emuladores
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function fetchWithRetry<T>(queryFn: () => Promise<{data: T, error: any}>, retries = 2, delayMs = 1500): Promise<{data: T, error: any}> {
  const res = await queryFn();
  if (res.error && res.error.message.includes('JWT issued at future') && retries > 0) {
    await delay(delayMs);
    return fetchWithRetry(queryFn, retries - 1, delayMs);
  }
  return res;
}

/**
 * Busca todas as contas do usuário logado
 */
export async function getAccounts(): Promise<AccountRow[]> {
  const { data, error } = await fetchWithRetry(() => supabase
    .from('accounts')
    .select('*')
    .order('created_at', { ascending: false })
  );

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Cria uma nova conta
 */
export async function createAccount(account: Omit<AccountInsert, 'user_id'>): Promise<AccountRow> {
  // Pegamos o ID do usuário atualmente logado para garantir segurança
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('accounts')
    .insert({
      ...account,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Atualiza uma conta existente
 */
export async function updateAccount(id: string, updates: Omit<AccountUpdate, 'user_id'>): Promise<AccountRow> {
  const { data, error } = await supabase
    .from('accounts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Deleta uma conta
 */
export async function deleteAccount(id: string): Promise<void> {
  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
