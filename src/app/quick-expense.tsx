import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categories';
import { createMultipleTransactions, createTransaction, updateTransaction, deleteTransaction } from '../services/transactions';
import { supabase } from '../services/supabase';
import { maskCurrencyInput, formatCurrency } from '../utils/currency';
import { getAccounts } from '../services/accounts';
import { Header } from '../components/Header';

const PAYMENT_METHODS = ['Débito', 'Crédito', 'Dinheiro', 'PIX'];

interface ExpenseEntry {
  formatted: string;
  numeric: number;
  paymentMethod: string | null;
}

export default function QuickExpenseScreen() {
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);

  
  // Controle de Abas
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');

  // Estado para Despesas (Múltiplas)
  const [expenses, setExpenses] = useState<Record<string, ExpenseEntry>>({});
  
  // Estado para Entradas (Única)
  const [incomeDescription, setIncomeDescription] = useState('');
  const [incomeAmountFormatted, setIncomeAmountFormatted] = useState('');
  const [incomeAmountNumeric, setIncomeAmountNumeric] = useState(0);
  const [isGlobalIncome, setIsGlobalIncome] = useState(false);

  // Estado para Investimentos
  const INVESTMENT_TYPES = ['Poupança', 'Investimentos', 'Caixinha', 'Reserva', '+ Cadastrar novo tipo'];
  const [isInvestment, setIsInvestment] = useState(false);
  const [showInvestmentPicker, setShowInvestmentPicker] = useState(false);
  const [selectedInvestmentType, setSelectedInvestmentType] = useState('Poupança');
  const [customInvestmentType, setCustomInvestmentType] = useState('');
  const [investmentAmountFormatted, setInvestmentAmountFormatted] = useState('');
  const [investmentAmountNumeric, setInvestmentAmountNumeric] = useState(0);

  // Estados Compartilhados
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Categoria e Modal
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [pickerVisibleFor, setPickerVisibleFor] = useState<string | null>(null);

  // Edição de Categoria
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [cats, accs] = await Promise.all([
          getCategories(),
          getAccounts()
        ]);
        
        setCategories(cats.filter(c => c.type === 'expense'));
        setAccounts(accs);
        
        if (accs.length > 0) {
          setSelectedAccountId(accs[0].id);
        }
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os dados.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleExpenseChange = (categoryId: string, text: string) => {
    const { formatted, numeric } = maskCurrencyInput(text);
    
    setExpenses(prev => {
      const current = prev[categoryId] || { paymentMethod: null };
      
      if (numeric === 0 && !current.paymentMethod) {
        const newExpenses = { ...prev };
        delete newExpenses[categoryId];
        return newExpenses;
      }
      
      return {
        ...prev,
        [categoryId]: { ...current, formatted, numeric }
      };
    });
  };

  const handleIncomeChange = (text: string) => {
    const { formatted, numeric } = maskCurrencyInput(text);
    setIncomeAmountFormatted(formatted);
    setIncomeAmountNumeric(numeric);
  };

  const handleInvestmentChange = (text: string) => {
    const { formatted, numeric } = maskCurrencyInput(text);
    setInvestmentAmountFormatted(formatted);
    setInvestmentAmountNumeric(numeric);
  };

  const handlePaymentMethodSelect = (categoryId: string, method: string) => {
    setExpenses(prev => {
      const current = prev[categoryId] || { formatted: '', numeric: 0 };
      return {
        ...prev,
        [categoryId]: { ...current, paymentMethod: method }
      };
    });
    setPickerVisibleFor(null);
  };

  const handleCreateNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      const newCat = await createCategory({
        name: newCategoryName,
        type: 'expense',
        icon: 'tag',
        color: '#8FA3AB',
      });
      
      setCategories([...categories, newCat]);
      setNewCategoryName('');
      setShowNewCategory(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a categoria.');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;
    if (!editCategoryName.trim()) {
      Alert.alert('Aviso', 'O nome não pode ser vazio.');
      return;
    }
    
    setIsUpdatingCategory(true);
    try {
      await updateCategory(editingCategory.id, { name: editCategoryName.trim() });
      setCategories(prev => prev.map(c => 
        c.id === editingCategory.id ? { ...c, name: editCategoryName.trim() } : c
      ));
      setEditingCategory(null);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao atualizar categoria.');
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  const handleDeleteCategory = (id: string, name: string) => {
    Alert.alert('Excluir Despesa', `Tem certeza que deseja excluir "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try {
            await deleteCategory(id);
            setCategories(prev => prev.filter(c => c.id !== id));
            setExpenses(prev => {
              const newExp = { ...prev };
              delete newExp[id];
              return newExp;
            });
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível excluir. Esta despesa já deve ter lançamentos salvos no histórico.');
          }
        }
      }
    ]);
  };

  const handleSaveExpense = async () => {
    const entries = Object.entries(expenses).filter(([_, val]) => val.numeric > 0);
    
    if (entries.length === 0) {
      Alert.alert('Aviso', 'Preencha ao menos um valor antes de salvar.');
      return;
    }

    const missingPayment = entries.find(([_, val]) => !val.paymentMethod);
    if (missingPayment) {
      const catName = categories.find(c => c.id === missingPayment[0])?.name || 'uma categoria';
      Alert.alert('Aviso', `Selecione a forma de pagamento para: ${catName}`);
      return;
    }

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const transactionsToSave = entries.map(([categoryId, value]) => ({
        account_id: selectedAccountId!,
        category_id: categoryId,
        amount: value.numeric,
        type: 'expense' as const,
        description: categories.find(c => c.id === categoryId)?.name || 'Lançamento Rápido',
        date: today,
        is_recurring: false,
        source: 'manual',
        payment_method: value.paymentMethod
      }));

      await createMultipleTransactions(transactionsToSave);
      
      Alert.alert('Sucesso', 'Despesas salvas com sucesso!', [
        { 
          text: 'Continuar Lançando', 
          onPress: () => setExpenses({}), // Limpa o formulário
          style: 'cancel' 
        },
        { text: 'Ver Meus Gastos', onPress: () => router.replace('/transactions') }
      ]);
    } catch (error: any) {
      console.error("ERRO AO SALVAR:", error);
      Alert.alert('Erro ao Salvar', error.message || JSON.stringify(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveIncome = async () => {
    if (!incomeDescription.trim()) {
      Alert.alert('Aviso', 'Preencha a descrição da entrada (Ex: Salário).');
      return;
    }
    if (incomeAmountNumeric <= 0) {
      Alert.alert('Aviso', 'O valor deve ser maior que zero.');
      return;
    }

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await createTransaction({
        account_id: isGlobalIncome ? null : selectedAccountId!,
        amount: incomeAmountNumeric,
        type: 'income',
        description: incomeDescription,
        date: today,
        is_recurring: false,
        source: 'manual',
        payment_method: null
      });

      Alert.alert('Sucesso', 'Entrada salva com sucesso!', [
        { 
          text: 'Continuar Lançando', 
          onPress: () => {
            setIncomeDescription('');
            setIncomeAmountFormatted('');
            setIncomeAmountNumeric(0);
          },
          style: 'cancel'
        },
        { text: 'Ver Meus Gastos', onPress: () => router.replace('/transactions') }
      ]);
    } catch (error: any) {
      console.error("ERRO AO SALVAR ENTRADA:", error);
      Alert.alert('Erro ao Salvar', error.message || JSON.stringify(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInvestment = async () => {
    const finalDescription = selectedInvestmentType === '+ Cadastrar novo tipo' 
      ? customInvestmentType.trim() 
      : selectedInvestmentType;

    if (!finalDescription) {
      Alert.alert('Aviso', 'Defina a categoria do investimento.');
      return;
    }
    if (investmentAmountNumeric <= 0) {
      Alert.alert('Aviso', 'O valor do investimento deve ser maior que zero.');
      return;
    }

    setSaving(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await createTransaction({
        account_id: selectedAccountId!,
        amount: investmentAmountNumeric,
        type: 'investment',
        description: finalDescription,
        date: today,
        is_recurring: false,
        source: 'manual',
        payment_method: null
      });

      Alert.alert('Sucesso', 'Investimento salvo com sucesso!', [
        { 
          text: 'Continuar Lançando', 
          onPress: () => {
            setCustomInvestmentType('');
            setInvestmentAmountFormatted('');
            setInvestmentAmountNumeric(0);
          },
          style: 'cancel'
        },
        { text: 'Ver Meus Gastos', onPress: () => router.replace('/transactions') }
      ]);
    } catch (error: any) {
      console.error("ERRO AO SALVAR INVESTIMENTO:", error);
      Alert.alert('Erro ao Salvar', error.message || JSON.stringify(error));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = () => {
    if (!selectedAccountId && !isGlobalIncome) {
      Alert.alert('Aviso', 'Você precisa ter pelo menos uma carteira cadastrada.');
      return;
    }
    
    if (transactionType === 'expense') {
      if (isInvestment) {
        handleSaveInvestment();
      } else {
        handleSaveExpense();
      }
    } else {
      handleSaveIncome();
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-ink">
        <ActivityIndicator size="large" color="#22D8F0" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-ink">
      <ScrollView className="flex-1 p-6">
        <Header title="Lançamentos" />

        {/* Abas de Seleção de Tipo */}
        <View className="flex-row bg-carbon rounded-xl p-1 mb-6 border border-line">
          <TouchableOpacity 
            className={`flex-1 p-3 rounded-lg items-center ${transactionType === 'expense' ? 'bg-ink border border-line' : ''}`}
            onPress={() => setTransactionType('expense')}
          >
            <Text className={`font-medium ${transactionType === 'expense' ? 'text-coral' : 'text-text-3'}`}>Saída (Despesa)</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 p-3 rounded-lg items-center ${transactionType === 'income' ? 'bg-ink border border-line' : ''}`}
            onPress={() => setTransactionType('income')}
          >
            <Text className={`font-medium ${transactionType === 'income' ? 'text-mint' : 'text-text-3'}`}>Entrada (Receita)</Text>
          </TouchableOpacity>
        </View>
        
        {/* Seletor de Contas (Compartilhado) - Só exibe se não for Entrada Global */}
        {accounts.length > 0 && (transactionType === 'expense' || !isGlobalIncome) && (
          <View className="mb-6 bg-carbon p-3 rounded-xl border border-line flex-row items-center">
            <Text className="text-text-2 text-[13px] mr-2">
              {transactionType === 'expense' ? 'Conta Origem:' : 'Conta Destino:'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {accounts.map(acc => (
                <TouchableOpacity 
                  key={acc.id}
                  className={`mr-2 px-3 py-1.5 rounded-lg border ${selectedAccountId === acc.id ? 'border-cyan bg-cyan/10' : 'border-line'}`}
                  onPress={() => setSelectedAccountId(acc.id)}
                >
                  <Text className={selectedAccountId === acc.id ? 'text-cyan font-medium' : 'text-text-3'}>{acc.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ================= FORMULÁRIO DE DESPESA ================= */}
        {transactionType === 'expense' && (
          <>
            <TouchableOpacity 
              className="flex-row items-center mb-6"
              onPress={() => setIsInvestment(!isInvestment)}
            >
              <Feather 
                name={isInvestment ? 'check-square' : 'square'} 
                size={20} 
                color={isInvestment ? '#22D8F0' : '#8FA3AB'} 
              />
              <Text className="text-text-2 ml-3 text-[14px]">
                É investimento ou poupança?
              </Text>
            </TouchableOpacity>

            {!isInvestment ? (
              <>
                <Text className="text-text-2 text-[14px] mb-6">
                  Insira o valor e escolha a forma de pagamento para cada despesa gerada.
                </Text>

                {categories.map((cat) => {
                  const catState = expenses[cat.id] || { formatted: '', numeric: 0, paymentMethod: null };
                  const hasValue = catState.numeric > 0;
                  
                  return (
                    <View key={cat.id} className={`mb-4 bg-carbon p-3 rounded-xl border ${hasValue ? 'border-coral/50' : 'border-line'}`}>
                      <View className="flex-row items-center mb-3">
                        <Text className="text-text-1 font-medium text-[15px]">{cat.name}</Text>
                        <TouchableOpacity 
                          onPress={() => {
                            setEditingCategory(cat);
                            setEditCategoryName(cat.name);
                          }} 
                          className="ml-3 p-1"
                        >
                          <Feather name="edit-2" size={16} color="#22D8F0" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteCategory(cat.id, cat.name)} className="ml-1 p-1">
                          <Feather name="trash-2" size={16} color="#FF7A6E" />
                        </TouchableOpacity>
                      </View>
                      
                      <View className="flex-row items-center justify-between">
                        <TouchableOpacity 
                          className="flex-1 mr-3 bg-ink border border-line rounded-lg p-3 flex-row justify-between items-center"
                          onPress={() => setPickerVisibleFor(cat.id)}
                        >
                          <Text className={catState.paymentMethod ? 'text-cyan font-medium' : 'text-text-3'}>
                            {catState.paymentMethod || 'Forma de Pagamento'}
                          </Text>
                          <Text className="text-text-3 text-[10px]">▼</Text>
                        </TouchableOpacity>

                        <TextInput
                          className="text-right text-[15px] text-coral font-bold p-3 bg-ink rounded-lg w-28 border border-line"
                          keyboardType="numeric"
                          placeholder="R$ 0,00"
                          placeholderTextColor="#5A6970"
                          value={catState.formatted}
                          onChangeText={(text) => handleExpenseChange(cat.id, text)}
                        />
                      </View>
                    </View>
                  );
                })}

                {showNewCategory ? (
                  <View className="mb-4 bg-carbon p-4 rounded-xl border border-line flex-row items-center">
                    <TextInput
                      className="flex-1 text-text-1 text-[15px] p-2 bg-ink rounded-lg border border-line mr-2"
                      placeholder="Nome da categoria"
                      placeholderTextColor="#5A6970"
                      value={newCategoryName}
                      onChangeText={setNewCategoryName}
                      autoFocus
                    />
                    <TouchableOpacity className="bg-cyan p-2 rounded-lg" onPress={handleCreateNewCategory}>
                      <Text className="text-cyan-ink font-bold">Criar</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity 
                    className="mb-8 p-4 items-center"
                    onPress={() => setShowNewCategory(true)}
                  >
                    <Text className="text-cyan text-[14px] font-medium">+ Adicionar Categoria</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View className="mb-8 mt-2">
                <Text className="text-text-3 text-[12px] mb-2">Categoria do Investimento</Text>
                <TouchableOpacity 
                  className="bg-carbon border border-line rounded-lg p-4 mb-4 flex-row justify-between items-center"
                  onPress={() => setShowInvestmentPicker(true)}
                >
                  <Text className={selectedInvestmentType ? 'text-text-1 text-[15px]' : 'text-text-3'}>
                    {selectedInvestmentType || 'Selecione...'}
                  </Text>
                  <Text className="text-text-3 text-[10px]">▼</Text>
                </TouchableOpacity>

                {selectedInvestmentType === '+ Cadastrar novo tipo' && (
                  <TextInput
                    className="bg-carbon border border-line rounded-lg p-4 text-text-1 text-[15px] mb-6"
                    placeholder="Nome do Investimento/Reserva"
                    placeholderTextColor="#5A6970"
                    value={customInvestmentType}
                    onChangeText={setCustomInvestmentType}
                    autoFocus
                  />
                )}

                <Text className="text-text-3 text-[12px] mb-2 mt-4">Valor a Reservar</Text>
                <TextInput
                  className="bg-carbon border border-line rounded-lg p-4 text-cyan font-bold text-[20px]"
                  keyboardType="numeric"
                  placeholder="R$ 0,00"
                  placeholderTextColor="#5A6970"
                  value={investmentAmountFormatted}
                  onChangeText={handleInvestmentChange}
                />
              </View>
            )}
          </>
        )}

        {/* ================= FORMULÁRIO DE ENTRADA ================= */}
        {transactionType === 'income' && (
          <View className="mb-8 mt-2">
            
            <TouchableOpacity 
              className="flex-row items-center mb-6"
              onPress={() => setIsGlobalIncome(!isGlobalIncome)}
            >
              <Feather 
                name={isGlobalIncome ? 'check-square' : 'square'} 
                size={20} 
                color={isGlobalIncome ? '#4ADE80' : '#8FA3AB'} 
              />
              <Text className="text-text-2 ml-3 text-[14px]">
                Aplicar saldo para todas as contas?
              </Text>
            </TouchableOpacity>

            <Text className="text-text-3 text-[12px] mb-2">Descrição da Entrada</Text>
            <TextInput
              className="bg-carbon border border-line rounded-lg p-4 text-text-1 text-[15px] mb-6"
              placeholder="Ex: Salário Mensal, Pix de amigo..."
              placeholderTextColor="#5A6970"
              value={incomeDescription}
              onChangeText={setIncomeDescription}
            />

            <Text className="text-text-3 text-[12px] mb-2">Valor Recebido</Text>
            <TextInput
              className="bg-carbon border border-line rounded-lg p-4 text-mint font-bold text-[20px]"
              keyboardType="numeric"
              placeholder="R$ 0,00"
              placeholderTextColor="#5A6970"
              value={incomeAmountFormatted}
              onChangeText={handleIncomeChange}
            />
          </View>
        )}

        {/* Botão de Salvar Global */}
        <TouchableOpacity 
          className="bg-cyan p-[14px] rounded-xl items-center mb-12"
          onPress={handleSaveAll}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#04232A" />
          ) : (
            <Text className="text-cyan-ink font-bold text-[15px]">
              {transactionType === 'expense' ? 'Salvar Despesas' : 'Salvar Entrada'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal Reutilizável do Combobox de Despesa */}
      <Modal
        visible={pickerVisibleFor !== null}
        transparent={true}
        animationType="fade"
      >
        <Pressable 
          className="flex-1 bg-black/60 justify-center items-center p-6"
          onPress={() => setPickerVisibleFor(null)}
        >
          <View className="bg-carbon w-full rounded-2xl border border-line overflow-hidden">
            <View className="p-4 border-b border-line bg-ink">
              <Text className="text-text-1 font-bold text-[16px] text-center">Forma de Pagamento</Text>
            </View>
            {PAYMENT_METHODS.map((method, index) => (
              <TouchableOpacity
                key={method}
                className={`p-4 border-line ${index < PAYMENT_METHODS.length - 1 ? 'border-b' : ''}`}
                onPress={() => pickerVisibleFor && handlePaymentMethodSelect(pickerVisibleFor, method)}
              >
                <Text className="text-text-2 text-[15px] text-center">{method}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Modal Reutilizável do Combobox de Investimento */}
      <Modal
        visible={showInvestmentPicker}
        transparent={true}
        animationType="fade"
      >
        <Pressable 
          className="flex-1 bg-black/60 justify-center items-center p-6"
          onPress={() => setShowInvestmentPicker(false)}
        >
          <View className="bg-carbon w-full rounded-2xl border border-line overflow-hidden">
            <View className="p-4 border-b border-line bg-ink">
              <Text className="text-text-1 font-bold text-[16px] text-center">Tipo de Investimento</Text>
            </View>
            {INVESTMENT_TYPES.map((type, index) => (
              <TouchableOpacity
                key={type}
                className={`p-4 border-line ${index < INVESTMENT_TYPES.length - 1 ? 'border-b' : ''}`}
                onPress={() => {
                  setSelectedInvestmentType(type);
                  setShowInvestmentPicker(false);
                }}
              >
                <Text className={`text-[15px] text-center ${type === '+ Cadastrar novo tipo' ? 'text-cyan font-medium' : 'text-text-2'}`}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Modal de Edição de Categoria */}
      <Modal
        visible={!!editingCategory}
        transparent={true}
        animationType="fade"
      >
        <Pressable 
          className="flex-1 bg-black/60 justify-center items-center p-6"
          onPress={() => setEditingCategory(null)}
        >
          <View className="bg-carbon w-full rounded-2xl border border-line p-6" onStartShouldSetResponder={() => true}>
            <Text className="text-text-1 font-bold text-[18px] mb-4 text-center">Renomear Despesa</Text>
            
            <TextInput
              className="bg-ink border border-line rounded-lg p-4 text-text-1 text-[15px] mb-6"
              placeholder="Nome da despesa"
              placeholderTextColor="#5A6970"
              value={editCategoryName}
              onChangeText={setEditCategoryName}
              autoFocus
            />

            <View className="flex-row gap-3">
              <TouchableOpacity 
                className="flex-1 bg-ink border border-line p-3 rounded-lg items-center"
                onPress={() => setEditingCategory(null)}
              >
                <Text className="text-text-2 font-medium">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 bg-cyan p-3 rounded-lg items-center"
                onPress={handleUpdateCategory}
                disabled={isUpdatingCategory}
              >
                {isUpdatingCategory ? (
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
