-- =========================================================================
-- ⚠️ AVISO: OPERAÇÃO ALTAMENTE DESTRUTIVA
-- Este script RESETA COMPLETAMENTE todo o esquema do aplicativo,
-- apagando orçamentos, transações, categorias e contas, NESSA ORDEM.
-- Todos os dados financeiros dos usuários serão perdidos.
-- =========================================================================

-- Passo 1: Remover tabelas dependentes (Folhas)
-- Orçamentos e Transações dependem de Categorias e Contas. Devem ser apagadas primeiro.
DROP POLICY IF EXISTS "user_can_read_own_budgets" ON budgets;
DROP POLICY IF EXISTS "user_can_insert_own_budgets" ON budgets;
DROP POLICY IF EXISTS "user_can_update_own_budgets" ON budgets;
DROP POLICY IF EXISTS "user_can_delete_own_budgets" ON budgets;
DROP TABLE IF EXISTS budgets;

DROP POLICY IF EXISTS "user_can_read_own_transactions" ON transactions;
DROP POLICY IF EXISTS "user_can_insert_own_transactions" ON transactions;
DROP POLICY IF EXISTS "user_can_update_own_transactions" ON transactions;
DROP POLICY IF EXISTS "user_can_delete_own_transactions" ON transactions;
DROP TABLE IF EXISTS transactions;

-- Passo 2: Remover tabelas base (Raízes)
-- Agora que as dependências sumiram, podemos apagar contas e categorias.
DROP POLICY IF EXISTS "user_can_read_own_categories" ON categories;
DROP POLICY IF EXISTS "user_can_insert_own_categories" ON categories;
DROP POLICY IF EXISTS "user_can_update_own_categories" ON categories;
DROP POLICY IF EXISTS "user_can_delete_own_categories" ON categories;
DROP TABLE IF EXISTS categories;

DROP POLICY IF EXISTS "user_can_read_own_accounts" ON accounts;
DROP POLICY IF EXISTS "user_can_insert_own_accounts" ON accounts;
DROP POLICY IF EXISTS "user_can_update_own_accounts" ON accounts;
DROP POLICY IF EXISTS "user_can_delete_own_accounts" ON accounts;
DROP TABLE IF EXISTS accounts;

-- NOTA SOBRE DROP CASCADE:
-- Nós EVITAMOS usar `DROP TABLE nome_da_tabela CASCADE`.
-- O CASCADE força a exclusão não só da tabela, mas de QUALQUER coisa que dependa dela 
-- (outras tabelas, views, funções do banco). Isso é muito perigoso num banco de produção 
-- porque se você tiver uma View importante que não lembrou que dependia dessa tabela, ela é 
-- obliterada silenciosamente. Ao invés disso, seguimos a ordem correta de exclusão (Folha -> Raiz).
