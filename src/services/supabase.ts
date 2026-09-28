import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

// Adaptador para fazer o Supabase usar o Expo Secure Store (armazenamento criptografado do celular)
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key);
  },
};

// Pega as variáveis de ambiente que configuramos no .env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

import { Database } from '../types/database';

// Cria o cliente do Supabase com a configuração de persistência segura
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true, // Renova o token automaticamente
    persistSession: true, // Mantém o usuário logado ao fechar o app
    detectSessionInUrl: false, // Usado mais para web
  },
});
