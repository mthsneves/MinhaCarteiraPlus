import { supabase } from './supabase';
import { Database } from '../types/database';

type CategoryRow = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

/**
 * Busca todas as categorias do usuário logado
 */
export async function getCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true }); // Ordena por ordem alfabética

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Cria uma nova categoria
 */
export async function createCategory(category: Omit<CategoryInsert, 'user_id'>): Promise<CategoryRow> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('categories')
    .insert({
      ...category,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Atualiza uma categoria existente
 */
export async function updateCategory(id: string, updates: Omit<CategoryUpdate, 'user_id'>): Promise<CategoryRow> {
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Deleta uma categoria
 */
export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}
