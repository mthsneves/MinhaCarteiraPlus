import { Text, View, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useAuth } from '../providers/AuthProvider';
import { router } from 'expo-router';
import { createAccount, getAccounts } from '../services/accounts';
import { updateUserName } from '../services/auth';
import { useState } from 'react';

export default function HomeScreen() {
  const { signOut, user } = useAuth();

  // Estados para a criação de conta personalizada
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [loadingAccount, setLoadingAccount] = useState(false);

  // Estados para edição do nome
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [loadingName, setLoadingName] = useState(false);

  const handleCreateCustomAccount = async () => {
    if (!newAccountName.trim()) {
      Alert.alert('Aviso', 'Por favor, digite um nome para a conta.');
      return;
    }

    setLoadingAccount(true);
    try {
      await createAccount({
        name: newAccountName.trim(),
        type: 'checking', // Por padrão, vamos considerar como conta corrente/carteira
        balance: 0,
        currency: 'BRL'
      });
      
      Alert.alert('Sucesso', 'Sua conta de lançamentos foi criada!');
      setNewAccountName('');
      setIsCreatingAccount(false);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao criar conta.');
    } finally {
      setLoadingAccount(false);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setLoadingName(true);
    try {
      await updateUserName(newName.trim());
      Alert.alert('Sucesso', 'Seu nome foi atualizado!');
      setIsEditingName(false);
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    } finally {
      setLoadingName(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-ink p-6">
      <Text className="font-['Space_Grotesk'] text-[36px] font-bold mb-4 text-text-1">Minha Carteira +</Text>
      
      {!isEditingName ? (
        <TouchableOpacity onPress={() => setIsEditingName(true)}>
          <Text className="text-text-2 text-[15px] mb-8 text-center">
            Bem vindo, você está logado como:{"\n"}
            <Text className="font-medium text-cyan">
              {user?.user_metadata?.display_name || user?.email}
            </Text>
            {"\n"}
            <Text className="text-[12px] text-text-3">(Toque para alterar o nome)</Text>
          </Text>
        </TouchableOpacity>
      ) : (
        <View className="w-full bg-carbon border border-line p-4 rounded-xl mb-8">
          <Text className="text-text-2 text-[13px] mb-2">Qual seu nome ou apelido?</Text>
          <TextInput
            className="bg-ink border border-line p-3 rounded-lg text-text-1 text-[15px] mb-3"
            placeholder="Ex: Matheus"
            placeholderTextColor="#5A6970"
            value={newName}
            onChangeText={setNewName}
            autoFocus
          />
          <View className="flex-row gap-2">
            <TouchableOpacity 
              className="flex-1 bg-transparent border border-line p-3 rounded-lg items-center"
              onPress={() => setIsEditingName(false)}
            >
              <Text className="text-text-2 font-medium">Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-1 bg-cyan p-3 rounded-lg items-center"
              onPress={handleUpdateName}
              disabled={loadingName}
            >
              <Text className="text-cyan-ink font-bold">{loadingName ? 'Salvando...' : 'Salvar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Fluxo de Criação de Conta */}
      {isCreatingAccount ? (
        <View className="w-full bg-carbon border border-line p-4 rounded-xl mb-4">
          <Text className="text-text-2 text-[13px] mb-2">Como quer chamar essa origem de fundos?</Text>
          <TextInput
            className="bg-ink border border-line p-3 rounded-lg text-text-1 text-[15px] mb-3"
            placeholder="Ex: Gastos do Nubank, Despesas da Casa..."
            placeholderTextColor="#5A6970"
            value={newAccountName}
            onChangeText={setNewAccountName}
            autoFocus
          />
          <View className="flex-row gap-2">
            <TouchableOpacity 
              className="flex-1 bg-transparent border border-line p-3 rounded-lg items-center"
              onPress={() => setIsCreatingAccount(false)}
            >
              <Text className="text-text-2 font-medium">Cancelar</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="flex-1 bg-cyan p-3 rounded-lg items-center"
              onPress={handleCreateCustomAccount}
              disabled={loadingAccount}
            >
              <Text className="text-cyan-ink font-bold">{loadingAccount ? 'Salvando...' : 'Salvar Conta'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          className="bg-carbon border border-line p-[14px] rounded-xl w-full items-center mb-4"
          onPress={() => setIsCreatingAccount(true)}
        >
          <Text className="text-text-1 font-medium text-[15px]">Nova Conta de Lançamento</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        className="bg-cyan p-[14px] rounded-xl w-full items-center mb-4"
        onPress={() => router.push('/quick-expense')}
      >
        <Text className="text-cyan-ink font-bold text-[15px]">Ir para Lançamento Rápido</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        className="bg-carbon border border-line p-[14px] rounded-xl w-full items-center mb-8"
        onPress={() => router.push('/transactions')}
      >
        <Text className="text-text-1 font-medium text-[15px]">Ver Meus Gastos</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        className="bg-transparent border border-coral/30 p-[14px] rounded-xl w-full items-center"
        onPress={signOut}
      >
        <Text className="text-coral font-medium text-[15px]">Sair da Conta</Text>
      </TouchableOpacity>
    </View>
  );
}
