-- =========================================================================
-- ⚠️ AVISO: OPERAÇÃO DESTRUTIVA
-- Este script apaga a tabela 'accounts' e TODAS as contas.
-- Não pode ser desfeito.
-- NOTA: Você não pode rodar isso se houver transações dependendo desta tabela!
-- =========================================================================

-- 1. Remove as Políticas de Segurança (RLS)
DROP POLICY IF EXISTS "user_can_read_own_accounts" ON accounts;
DROP POLICY IF EXISTS "user_can_insert_own_accounts" ON accounts;
DROP POLICY IF EXISTS "user_can_update_own_accounts" ON accounts;
DROP POLICY IF EXISTS "user_can_delete_own_accounts" ON accounts;

-- 2. Desativa o RLS
ALTER TABLE accounts DISABLE ROW LEVEL SECURITY;

-- 3. Remove a tabela
DROP TABLE IF EXISTS accounts;
