import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../providers/AuthProvider';
import { Link, router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      await signUp(data.email, data.password, data.displayName);
      Alert.alert(
        'Conta criada!', 
        'Verifique sua caixa de e-mail para confirmar seu cadastro e em seguida faça o login.',
        [{ text: 'OK', onPress: () => router.replace('/login') }]
      );
    } catch (error: any) {
      Alert.alert('Erro no Cadastro', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-ink" 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <Text className="font-['Space_Grotesk'] text-[36px] font-bold mb-2 text-center text-text-1">Criar Conta</Text>
        <Text className="text-text-2 text-[15px] mb-8 text-center">Faça seu cadastro no Minha Carteira +</Text>
        
        <Controller
          control={control}
          name="displayName"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-4">
              <Text className="text-text-3 font-medium text-[13px] mb-2">Nome ou Apelido</Text>
              <TextInput
                className="bg-carbon border border-line p-4 rounded-xl text-[14px] text-text-2"
                placeholder="Como quer ser chamado?"
                placeholderTextColor="#5A6970"
                autoCapitalize="words"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.displayName && <Text className="text-coral mt-1 text-[13px]">{errors.displayName.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-4">
              <Text className="text-text-3 font-medium text-[13px] mb-2">E-mail</Text>
              <TextInput
                className="bg-carbon border border-line p-4 rounded-xl text-[14px] text-text-2"
                placeholder="seu@email.com"
                placeholderTextColor="#5A6970"
                keyboardType="email-address"
                autoCapitalize="none"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
              {errors.email && <Text className="text-coral mt-1 text-[13px]">{errors.email.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-4">
              <Text className="text-text-3 font-medium text-[13px] mb-2">Senha</Text>
              <View className="bg-carbon border border-line rounded-xl flex-row items-center">
                <TextInput
                  className="flex-1 p-4 text-[14px] text-text-2"
                  placeholder="********"
                  placeholderTextColor="#5A6970"
                  secureTextEntry={!showPassword}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-4">
                  <Feather name={showPassword ? "eye" : "eye-off"} size={20} color="#5A6970" />
                </TouchableOpacity>
              </View>
              {errors.password && <Text className="text-coral mt-1 text-[13px]">{errors.password.message}</Text>}
            </View>
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-8">
              <Text className="text-text-3 font-medium text-[13px] mb-2">Confirmar Senha</Text>
              <View className="bg-carbon border border-line rounded-xl flex-row items-center">
                <TextInput
                  className="flex-1 p-4 text-[14px] text-text-2"
                  placeholder="********"
                  placeholderTextColor="#5A6970"
                  secureTextEntry={!showConfirmPassword}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-4">
                  <Feather name={showConfirmPassword ? "eye" : "eye-off"} size={20} color="#5A6970" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && <Text className="text-coral mt-1 text-[13px]">{errors.confirmPassword.message}</Text>}
            </View>
          )}
        />

        <TouchableOpacity 
          className="bg-cyan p-[14px] rounded-xl items-center mb-6"
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#04232A" /> : <Text className="text-cyan-ink font-medium text-[15px]">Cadastrar</Text>}
        </TouchableOpacity>

        <Link href="/login" asChild>
          <TouchableOpacity>
            <Text className="text-center text-text-2 text-[14px]">
              Já tem uma conta? <Text className="text-cyan font-semibold">Faça login</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
