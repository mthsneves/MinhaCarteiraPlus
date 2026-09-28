-- =========================================================================
-- ⚠️ AVISO: OPERAÇÃO DESTRUTIVA
-- Este script apaga a tabela 'categories' e TODAS as categorias.
-- Não pode ser desfeito.
-- NOTA: Você não pode rodar isso se houver transações ou orçamentos dependendo desta tabela!
-- =========================================================================

-- 1. Remove as Políticas de Segurança (RLS)
DROP POLICY IF EXISTS "user_can_read_own_categories" ON categories;
DROP POLICY IF EXISTS "user_can_insert_own_categories" ON categories;
DROP POLICY IF EXISTS "user_can_update_own_categories" ON categories;
DROP POLICY IF EXISTS "user_can_delete_own_categories" ON categories;

-- 2. Desativa o RLS
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- 3. Remove a tabela
DROP TABLE IF EXISTS categories;
