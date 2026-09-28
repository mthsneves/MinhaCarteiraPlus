-- =========================================================================
-- ⚠️ AVISO: OPERAÇÃO DESTRUTIVA
-- Este script apaga a tabela 'transactions' e TODAS as transações lançadas.
-- Não pode ser desfeito.
-- =========================================================================

-- 1. Remove as Políticas de Segurança (RLS)
DROP POLICY IF EXISTS "user_can_read_own_transactions" ON transactions;
DROP POLICY IF EXISTS "user_can_insert_own_transactions" ON transactions;
DROP POLICY IF EXISTS "user_can_update_own_transactions" ON transactions;
DROP POLICY IF EXISTS "user_can_delete_own_transactions" ON transactions;

-- 2. Desativa o RLS
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;

-- 3. Remove a tabela
DROP TABLE IF EXISTS transactions;
