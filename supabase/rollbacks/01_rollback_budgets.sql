-- =========================================================================
-- ⚠️ AVISO: OPERAÇÃO DESTRUTIVA
-- Este script apaga a tabela 'budgets' e TODOS os orçamentos cadastrados.
-- Não pode ser desfeito.
-- =========================================================================

-- 1. Remove as Políticas de Segurança (RLS)
DROP POLICY IF EXISTS "user_can_read_own_budgets" ON budgets;
DROP POLICY IF EXISTS "user_can_insert_own_budgets" ON budgets;
DROP POLICY IF EXISTS "user_can_update_own_budgets" ON budgets;
DROP POLICY IF EXISTS "user_can_delete_own_budgets" ON budgets;

-- 2. Desativa o RLS
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;

-- 3. Remove a tabela
-- Nota: Usando DROP TABLE simples (sem CASCADE) por segurança. 
-- Se algo depender de budgets, o comando falhará, prevenindo exclusão acidental em cascata.
DROP TABLE IF EXISTS budgets;
