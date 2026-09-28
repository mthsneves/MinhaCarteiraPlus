import { supabase } from './supabase';
import { Database } from '../types/database';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

/**
 * Busca todas as transações do usuário logado, ordenadas da mais recente para a mais antiga.
 * Traz também os dados da categoria e da conta para podermos mostrar na tela.
 */
export async function getTransactions(): Promise<any[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      categories ( name, icon, color ),
      accounts ( name )
    `)
    .order('date', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Cria uma nova transação individual
 */
export async function createTransaction(transaction: Omit<TransactionInsert, 'user_id'>): Promise<TransactionRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      ...transaction,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Cria múltiplas transações de uma vez (Lançamento Rápido)
 */
export async function createMultipleTransactions(transactions: Omit<TransactionInsert, 'user_id'>[]): Promise<TransactionRow[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Adiciona o user_id e a source padrão para todas as transações da lista
  const transactionsWithUser = transactions.map(t => ({
    ...t,
    user_id: user.id,
    source: t.source || 'manual'
  }));

  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionsWithUser)
    .select();

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Atualiza uma transação existente
 */
export async function updateTransaction(id: string, updates: Omit<TransactionUpdate, 'user_id'>): Promise<TransactionRow> {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Deleta uma transação
 */
export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/**
 * Deleta todas as transações de uma conta específica (Exclusão em Cascata)
 */
export async function deleteTransactionsByAccountId(accountId: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('account_id', accountId);

  if (error) throw new Error(error.message);
}
