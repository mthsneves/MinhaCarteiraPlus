import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../providers/AuthProvider';
import { Link } from 'expo-router';
import { Feather } from '@expo/vector-icons';

// Esquema de validação com Zod
const loginSchema = z.object({
  email: z.string().email('Digite um e-mail válido.'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      await signIn(data.email, data.password);
      // Se der certo, o AuthProvider detecta e nos manda pra Home pelo _layout
    } catch (error: any) {
      Alert.alert('Erro no Login', error.message);
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
        <Text className="font-['Space_Grotesk'] text-[36px] font-bold mb-2 text-center text-text-1">Minha Carteira +</Text>
        <Text className="text-text-2 text-[15px] mb-10 text-center">Entre com a sua conta para acessar suas finanças.</Text>
        
        {/* Input de E-mail */}
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

        {/* Input de Senha */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View className="mb-6">
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

        {/* Botão de Entrar */}
        <TouchableOpacity 
          className="bg-cyan p-[14px] rounded-xl items-center mb-8"
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#04232A" /> : <Text className="text-cyan-ink font-medium text-[15px]">Entrar</Text>}
        </TouchableOpacity>

        <Link href="/register" asChild>
          <TouchableOpacity>
            <Text className="text-center text-text-2 text-[14px]">
              Ainda não tem conta? <Text className="text-cyan font-semibold">Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
