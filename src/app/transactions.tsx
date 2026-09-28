import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, LayoutAnimation, UIManager, Platform, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getTransactions, deleteTransaction, deleteTransactionsByAccountId, updateTransaction } from '../services/transactions';
import { getAccounts, deleteAccount, updateAccount } from '../services/accounts';
import { formatCurrency, maskCurrencyInput } from '../utils/currency';
import { Header } from '../components/Header';

const PAYMENT_METHODS = ['Débito', 'Crédito', 'Dinheiro', 'PIX'];

export default function TransactionsScreen() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactionsByAccount, setTransactionsByAccount] = useState<Record<string, any[]>>({});
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Estados do Modal de Edição
  const [editingTransaction, setEditingTransaction] = useState<any | null>(null);
  const [editAmountFormatted, setEditAmountFormatted] = useState('');
  const [editAmountNumeric, setEditAmountNumeric] = useState(0);
  const [editDescription, setEditDescription] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Estados do Modal de Carteira
  const [editingWallet, setEditingWallet] = useState<any | null>(null);
  const [editWalletName, setEditWalletName] = useState('');
  const [isUpdatingWallet, setIsUpdatingWallet] = useState(false);

  const [globalIncomes, setGlobalIncomes] = useState<any[]>([]);
  const [expandedIncomes, setExpandedIncomes] = useState<Record<string, boolean>>({});
  const [expandedExpenses, setExpandedExpenses] = useState<Record<string, boolean>>({});
  const [expandedInvestments, setExpandedInvestments] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [fetchedAccounts, fetchedTransactions] = await Promise.all([
        getAccounts(),
        getTransactions()
      ]);

      const grouped: Record<string, any[]> = {};
      fetchedAccounts.forEach(acc => { grouped[acc.id] = []; });
      const globals: any[] = [];

      fetchedTransactions.forEach(t => {
        if (!t.account_id) {
          globals.push(t);
        } else {
          if (!grouped[t.account_id]) grouped[t.account_id] = [];
          grouped[t.account_id].push(t);
        }
      });

      const initialExpanded: Record<string, boolean> = {};
      if (fetchedAccounts.length > 0) initialExpanded[fetchedAccounts[0].id] = true;

      setAccounts(fetchedAccounts);
      setGlobalIncomes(globals);
      setTransactionsByAccount(grouped);
      setExpandedAccounts(initialExpanded);
    } catch (error: any) {
      console.error("ERRO AO CARREGAR:", error);
      Alert.alert('Erro ao Carregar', error.message || JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (accountId: string) => {
    setExpandedAccounts(prev => ({
      ...prev,
      [accountId]: !prev[accountId]
    }));
  };

  const toggleSubAccordion = (type: 'incomes' | 'expenses' | 'investments', accountId: string) => {
    if (type === 'incomes') {
      setExpandedIncomes(prev => ({ ...prev, [accountId]: !prev[accountId] }));
    } else if (type === 'expenses') {
      setExpandedExpenses(prev => ({ ...prev, [accountId]: !prev[accountId] }));
    } else {
      setExpandedInvestments(prev => ({ ...prev, [accountId]: !prev[accountId] }));
    }
  };

  // Exclui uma Carteira Inteira (Cascata)
  const handleDeleteWallet = (accountId: string, accountName: string) => {
    Alert.alert(
      'Atenção: Excluir Carteira',
      `Tem certeza que deseja excluir a carteira "${accountName}"? Todos os gastos vinculados a ela também serão perdidos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sim, Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Apaga os gastos vinculados primeiro para respeitar chaves estrangeiras
              await deleteTransactionsByAccountId(accountId);
              // 2. Apaga a conta em si
              await deleteAccount(accountId);
              
              // 3. Atualiza interface
              setAccounts(prev => prev.filter(a => a.id !== accountId));
              setTransactionsByAccount(prev => {
                const newState = { ...prev };
                delete newState[accountId];
                return newState;
              });
            } catch (error: any) {
              Alert.alert('Erro', 'Falha ao excluir a carteira: ' + error.message);
            }
          }
        }
      ]
    );
  };

  // Renomeia uma Carteira
  const handleRenameWallet = async () => {
    if (!editingWallet) return;
    if (!editWalletName.trim()) {
      Alert.alert('Aviso', 'O nome da carteira não pode ficar vazio.');
      return;
    }
    
    setIsUpdatingWallet(true);
    try {
      await updateAccount(editingWallet.id, { name: editWalletName.trim() });
      
      setAccounts(prev => prev.map(a => 
        a.id === editingWallet.id ? { ...a, name: editWalletName.trim() } : a
      ));
      
      setEditingWallet(null);
    } catch (error: any) {
      Alert.alert('Erro', 'Falha ao renomear carteira: ' + error.message);
    } finally {
      setIsUpdatingWallet(false);
    }
  };

  // Exclui uma Transação individual
  const handleDelete = (item: any, currentAccountId: string) => {
    Alert.alert('Excluir Gasto', 'Tem certeza que deseja excluir este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await deleteTransaction(item.id);
            if (!item.account_id) { // is global income
              setGlobalIncomes(prev => prev.filter((t: any) => t.id !== item.id));
            } else {
              setTransactionsByAccount(prev => {
                const updatedAccountTransactions = prev[currentAccountId].filter((t: any) => t.id !== item.id);
                return { ...prev, [currentAccountId]: updatedAccountTransactions };
              });
            }
          } catch (error) {
            Alert.alert('Erro', 'Falha ao excluir a transação.');
          }
        }
      }
    ]);
  };

  // Abre Modal preenchendo os dados
  const openEditModal = (item: any) => {
    setEditingTransaction(item);
    setEditDescription(item.description || item.categories?.name || '');
    setEditPaymentMethod(item.payment_method || null);
    
    const stringAmount = (item.amount * 100).toFixed(0).toString();
    const { formatted, numeric } = maskCurrencyInput(stringAmount);
    setEditAmountFormatted(formatted);
    setEditAmountNumeric(numeric);
  };

  const handleEditAmountChange = (text: string) => {
    const { formatted, numeric } = maskCurrencyInput(text);
    setEditAmountFormatted(formatted);
    setEditAmountNumeric(numeric);
  };

  // Salva edição no banco
  const handleUpdateExpense = async () => {
    if (!editingTransaction) return;
    if (editAmountNumeric <= 0) {
      Alert.alert('Aviso', 'O valor deve ser maior que zero.');
      return;
    }

    setIsUpdating(true);
    try {
      await updateTransaction(editingTransaction.id, {
        description: editDescription,
        amount: editAmountNumeric,
        payment_method: editPaymentMethod
      });

      // Atualiza estado local
      const isGlobal = !editingTransaction.account_id;
      if (isGlobal) {
        setGlobalIncomes(prev => prev.map(t => {
          if (t.id === editingTransaction.id) {
            return { ...t, description: editDescription, amount: editAmountNumeric };
          }
          return t;
        }));
      } else {
        setTransactionsByAccount(prev => {
          const accountId = editingTransaction.account_id;
          const updatedTransactions = prev[accountId].map(t => {
            if (t.id === editingTransaction.id) {
              return {
                ...t,
                description: editDescription,
                amount: editAmountNumeric,
                payment_method: editPaymentMethod
              };
            }
            return t;
          });
          return { ...prev, [accountId]: updatedTransactions };
        });
      }

      setEditingTransaction(null); // Fecha modal
    } catch (error: any) {
      Alert.alert('Erro', 'Falha ao editar: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const renderTransactionItem = (item: any, currentAccountId: string) => {
    let amountColor = 'text-coral';
    if (item.type === 'income') amountColor = 'text-mint';
    if (item.type === 'investment') amountColor = 'text-cyan';

    // Se o nome for 'Lançamento Rápido', usamos o nome da categoria para corrigir o histórico antigo
    let displayName = item.description;
    if (!displayName || displayName === 'Lançamento Rápido') {
      displayName = item.categories?.name || 'Sem Categoria';
    }

    return (
      <View key={item.id} className="bg-carbon border border-line p-4 rounded-xl mb-3 flex-row items-center justify-between">
        <View className="flex-1 justify-center">
          
          <View className="flex-row items-center mb-1">
            <Text className="text-text-1 font-medium text-[15px] mr-2 flex-shrink" numberOfLines={1}>
              {displayName}
              {!item.account_id && <Text className="text-mint text-[10px]"> (Global)</Text>}
            </Text>
            
            <TouchableOpacity onPress={() => openEditModal(item)} className="p-1 ml-1">
              <Feather name="edit-2" size={16} color="#22D8F0" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => handleDelete(item, currentAccountId)} className="p-1 ml-1">
              <Feather name="trash-2" size={16} color="#FF7A6E" />
            </TouchableOpacity>
          </View>

          <Text className="text-text-3 text-[12px]">
            {item.date ? new Date(item.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''} 
            {item.payment_method ? ` • ${item.payment_method}` : ''}
          </Text>
        </View>
        
        <View className="items-end pl-2">
          <Text className={`${amountColor} font-bold text-[15px]`}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
      </View>
    );
  };

  const renderAccountCard = ({ item: account }: { item: any }) => {
    const isExpanded = expandedAccounts[account.id];
    const isIncomeExpanded = expandedIncomes[account.id];
    const isExpenseExpanded = expandedExpenses[account.id];
    const isInvestmentExpanded = expandedInvestments[account.id];
    
    const accountSpecificTransactions = transactionsByAccount[account.id] || [];
    const accountTransactions = [...accountSpecificTransactions, ...globalIncomes];
    
    const incomes = accountTransactions.filter(t => t.type === 'income');
    const expenses = accountTransactions.filter(t => t.type === 'expense');
    const investments = accountTransactions.filter(t => t.type === 'investment');

    const totalIncome = incomes.reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalInvestment = investments.reduce((acc, curr) => acc + curr.amount, 0);
    
    const balance = totalIncome - totalExpense - totalInvestment;

    return (
      <View className="mb-4">
        <TouchableOpacity 
          className={`bg-carbon p-4 border border-line flex-row items-center justify-between ${isExpanded ? 'rounded-t-xl' : 'rounded-xl'}`}
          onPress={() => toggleAccordion(account.id)}
          activeOpacity={0.7}
        >
          <View className="flex-1 mr-2">
            <Text className="text-text-1 font-medium text-[16px]">{account.name}</Text>
            <Text className="text-text-3 text-[13px] mt-1">{accountTransactions.length} lançamentos</Text>
          </View>
          
          <View className="items-end flex-row gap-4">
            <Text className={`font-bold text-[15px] ${balance >= 0 ? 'text-mint' : 'text-coral'}`}>
              {balance < 0 ? '-' : ''}{formatCurrency(Math.abs(balance))}
            </Text>
            <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#8FA3AB" />
            
            <View className="flex-row gap-2">
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  setEditingWallet(account);
                  setEditWalletName(account.name);
                }}
                className="p-1 bg-ink rounded-md border border-cyan/30"
              >
                <Feather name="edit-2" size={16} color="#22D8F0" />
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteWallet(account.id, account.name);
                }}
                className="p-1 bg-ink rounded-md border border-coral/30"
              >
                <Feather name="trash-2" size={16} color="#FF7A6E" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View className="bg-ink p-3 border border-t-0 border-line rounded-b-xl">
            {/* ENTRADAS */}
            <TouchableOpacity 
              className="p-3 flex-row justify-between items-center bg-carbon border border-line rounded-lg mb-2"
              onPress={() => toggleSubAccordion('incomes', account.id)}
            >
              <Text className="text-mint font-medium">Entradas ({incomes.length})</Text>
              <Feather name={isIncomeExpanded ? "chevron-up" : "chevron-down"} size={16} color="#4ADE80" />
            </TouchableOpacity>
            {isIncomeExpanded && incomes.length > 0 && (
              <View className="px-2 mb-2">
                {incomes.map(t => renderTransactionItem(t, account.id))}
              </View>
            )}

            {/* SAÍDAS */}
            <TouchableOpacity 
              className="p-3 flex-row justify-between items-center bg-carbon border border-line rounded-lg mb-2"
              onPress={() => toggleSubAccordion('expenses', account.id)}
            >
              <Text className="text-coral font-medium">Saídas ({expenses.length})</Text>
              <Feather name={isExpenseExpanded ? "chevron-up" : "chevron-down"} size={16} color="#FF7A6E" />
            </TouchableOpacity>
            {isExpenseExpanded && expenses.length > 0 && (
              <View className="px-2 mb-2">
                {expenses.map(t => renderTransactionItem(t, account.id))}
              </View>
            )}

            {/* INVESTIMENTOS */}
            <TouchableOpacity 
              className="p-3 flex-row justify-between items-center bg-carbon border border-line rounded-lg mb-2"
              onPress={() => toggleSubAccordion('investments', account.id)}
            >
              <Text className="text-cyan font-medium">Investimentos/Poupança ({investments.length})</Text>
              <Feather name={isInvestmentExpanded ? "chevron-up" : "chevron-down"} size={16} color="#22D8F0" />
            </TouchableOpacity>
            {isInvestmentExpanded && investments.length > 0 && (
              <View className="px-2 mb-2">
                {investments.map(t => renderTransactionItem(t, account.id))}
              </View>
            )}
            
            {accountTransactions.length === 0 && (
              <Text className="text-text-3 text-center py-4 text-[14px]">Nenhum lançamento nesta conta.</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-ink">
        <ActivityIndicator size="large" color="#22D8F0" />
      </View>
    );
  }

  const renderSummaryGraphic = () => {
    let totalIncome = 0;
    let totalExpense = 0;

    const allTransactions = [
      ...Object.values(transactionsByAccount).flat(),
      ...globalIncomes
    ];

    allTransactions.forEach(t => {
      const amount = Number(t.amount) || 0;
      if (t.type === 'income') totalIncome += amount;
      if (t.type === 'expense') totalExpense += amount;
    });

    return (
      <View className="bg-carbon border border-line rounded-2xl p-5 mb-6">
        <View className="flex-row items-center mb-4">
          <Feather name="calendar" size={16} color="#8FA3AB" />
          <Text className="text-text-2 text-[14px] font-medium ml-2">Balanço Geral</Text>
        </View>

        <View className="flex-row gap-4">
          {/* Ganhos */}
          <View className="flex-1 bg-ink border border-line rounded-xl p-4">
            <Text className="text-text-3 text-[12px] mb-1">Entradas</Text>
            <View className="flex-row items-center mt-1">
              <Feather name="trending-up" size={16} color="#4ADE80" />
              <Text className="text-mint font-bold text-[16px] ml-2" numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(totalIncome)}
              </Text>
            </View>
          </View>

          {/* Gastos */}
          <View className="flex-1 bg-ink border border-line rounded-xl p-4">
            <Text className="text-text-3 text-[12px] mb-1">Saídas</Text>
            <View className="flex-row items-center mt-1">
              <Feather name="trending-down" size={16} color="#FF7A6E" />
              <Text className="text-coral font-bold text-[16px] ml-2" numberOfLines={1} adjustsFontSizeToFit>
                {formatCurrency(totalExpense)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-ink p-6">
      <Header title="Meus Gastos" />

      <FlatList
        data={accounts}
        keyExtractor={item => item.id}
        renderItem={renderAccountCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListHeaderComponent={renderSummaryGraphic}
        ListEmptyComponent={
          <View className="items-center mt-10">
            <Feather name="inbox" size={48} color="#5A6970" className="mb-4" />
            <Text className="text-text-2 text-center text-[15px]">Nenhuma conta criada ainda.</Text>
          </View>
        }
      />

      {/* MODAL DE EDIÇÃO DE GASTO */}
      <Modal
        visible={!!editingTransaction}
        transparent={true}
        animationType="slide"
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-ink p-6 rounded-t-3xl border-t border-line">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-text-1 font-bold text-[20px]">Editar Gasto</Text>
              <TouchableOpacity onPress={() => setEditingTransaction(null)} className="p-2">
                <Feather name="x" size={24} color="#8FA3AB" />
              </TouchableOpacity>
            </View>

            <Text className="text-text-3 text-[12px] mb-2">Descrição / Título</Text>
            <TextInput
              className="bg-carbon border border-line rounded-lg p-4 text-text-1 text-[15px] mb-4"
              placeholder="Ex: Conta de Luz"
              placeholderTextColor="#5A6970"
              value={editDescription}
              onChangeText={setEditDescription}
            />

            <Text className="text-text-3 text-[12px] mb-2">Valor (R$)</Text>
            <TextInput
              className="bg-carbon border border-line rounded-lg p-4 text-cyan font-bold text-[18px] mb-4"
              keyboardType="numeric"
              value={editAmountFormatted}
              onChangeText={handleEditAmountChange}
            />

            <Text className="text-text-3 text-[12px] mb-2">Forma de Pagamento</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8">
              {PAYMENT_METHODS.map(method => (
                <TouchableOpacity 
                  key={method}
                  className={`mr-2 px-4 py-2 rounded-full border ${editPaymentMethod === method ? 'border-cyan bg-cyan/10' : 'border-line bg-carbon'}`}
                  onPress={() => setEditPaymentMethod(method)}
                >
                  <Text className={editPaymentMethod === method ? 'text-cyan font-medium' : 'text-text-2'}>{method}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity 
              className="bg-cyan p-[14px] rounded-xl items-center mb-4"
              onPress={handleUpdateExpense}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#04232A" />
              ) : (
                <Text className="text-cyan-ink font-bold text-[15px]">Salvar Alterações</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL DE EDIÇÃO DE CARTEIRA */}
      <Modal
        visible={!!editingWallet}
        transparent={true}
        animationType="fade"
      >
        <Pressable 
          className="flex-1 bg-black/60 justify-center items-center p-6"
          onPress={() => setEditingWallet(null)}
        >
          <View className="bg-carbon w-full rounded-2xl border border-line p-6" onStartShouldSetResponder={() => true}>
            <Text className="text-text-1 font-bold text-[18px] mb-4 text-center">Renomear Carteira</Text>
            
            <TextInput
              className="bg-ink border border-line rounded-lg p-4 text-text-1 text-[15px] mb-6"
              placeholder="Nome da carteira"
              placeholderTextColor="#5A6970"
              value={editWalletName}
              onChangeText={setEditWalletName}
              autoFocus
            />

            <View className="flex-row gap-3">
              <TouchableOpacity 
                className="flex-1 bg-ink border border-line p-3 rounded-lg items-center"
                onPress={() => setEditingWallet(null)}
              >
                <Text className="text-text-2 font-medium">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 bg-cyan p-3 rounded-lg items-center"
                onPress={handleRenameWallet}
                disabled={isUpdatingWallet}
              >
                {isUpdatingWallet ? (
                  <ActivityIndicator color="#04232A" />
                ) : (
                  <Text className="text-cyan-ink font-bold">Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
