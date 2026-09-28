import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../providers/AuthProvider';
import { Link, router } from 'expo-router';

const registerSchema = z.object({
  displayName: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('Digite um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      await signUp(data.email, data.password, data.displayName);
      Alert.alert(
        'Conta criada!', 
        'Verifique sua caixa de e-mail para confirmar seu cadastro (se habilitado no Supabase).',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (error: any) {
      Alert.alert('Erro no Cadastro', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center p-6 bg-white">
      <Text className="text-3xl font-bold mb-8 text-center text-slate-800">Criar Conta</Text>
      
      <Controller
        control={control}
        name="displayName"
        render={({ field: { onChange, onBlur, value } }) => (
          <View className="mb-4">
            <Text className="text-slate-600 mb-2">Nome ou Apelido</Text>
            <TextInput
              className="border border-slate-300 p-4 rounded-xl text-base"
              placeholder="Como quer ser chamado?"
              autoCapitalize="words"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
            {errors.displayName && <Text className="text-red-500 mt-1">{errors.displayName.message}</Text>}
          </View>
        )}
      />

      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <View className="mb-4">
            <Text className="text-slate-600 mb-2">E-mail</Text>
            <TextInput
              className="border border-slate-300 p-4 rounded-xl text-base"
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
            {errors.email && <Text className="text-red-500 mt-1">{errors.email.message}</Text>}
          </View>
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <View className="mb-4">
            <Text className="text-slate-600 mb-2">Senha</Text>
            <TextInput
              className="border border-slate-300 p-4 rounded-xl text-base"
              placeholder="******"
              secureTextEntry
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
            {errors.password && <Text className="text-red-500 mt-1">{errors.password.message}</Text>}
          </View>
        )}
      />

      <Controller
        control={control}
        name="confirmPassword"
        render={({ field: { onChange, onBlur, value } }) => (
          <View className="mb-6">
            <Text className="text-slate-600 mb-2">Confirmar Senha</Text>
            <TextInput
              className="border border-slate-300 p-4 rounded-xl text-base"
              placeholder="******"
              secureTextEntry
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
            />
            {errors.confirmPassword && <Text className="text-red-500 mt-1">{errors.confirmPassword.message}</Text>}
          </View>
        )}
      />

      <TouchableOpacity 
        className="bg-blue-600 p-4 rounded-xl items-center mb-6"
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-lg">Cadastrar</Text>}
      </TouchableOpacity>

      <Link href="/login" asChild>
        <TouchableOpacity>
          <Text className="text-center text-slate-500">
            Já tem uma conta? <Text className="text-blue-600 font-bold">Faça login</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
