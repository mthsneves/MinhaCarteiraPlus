import { supabase } from './supabase';
import { Database } from '../types/database';

type BudgetRow = Database['public']['Tables']['budgets']['Row'];
type BudgetInsert = Database['public']['Tables']['budgets']['Insert'];
type BudgetUpdate = Database['public']['Tables']['budgets']['Update'];

/**
 * Busca todos os orçamentos do usuário para um mês específico
 * @param month Formato YYYY-MM (ex: '2023-10')
 */
export async function getBudgetsByMonth(month: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('budgets')
    .select(`
      *,
      categories ( name, icon, color )
    `)
    .eq('month', month);

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Cria um novo orçamento
 */
export async function createBudget(budget: Omit<BudgetInsert, 'user_id'>): Promise<BudgetRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('budgets')
    .insert({
      ...budget,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Atualiza um orçamento existente
 */
export async function updateBudget(id: string, updates: Omit<BudgetUpdate, 'user_id'>): Promise<BudgetRow> {
  const { data, error } = await supabase
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Deleta um orçamento
 */
export async function deleteBudget(id: string): Promise<void> {
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
