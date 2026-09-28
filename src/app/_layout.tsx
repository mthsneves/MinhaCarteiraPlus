import '../../global.css';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../providers/AuthProvider';
import { useEffect } from 'react';

// Criamos um componente interno para poder usar o hook useAuth (que precisa estar DENTRO do AuthProvider)
function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    // Se ainda está carregando a sessão do armazenamento, não faz nada
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register';

    if (!session && !inAuthGroup) {
      // Usuário não tá logado e tentou acessar tela protegida -> Manda pro login
      router.replace('/login');
    } else if (session && inAuthGroup) {
      // Usuário logado tentou acessar login/cadastro -> Manda pra home
      router.replace('/');
    }
  }, [session, isLoading, segments]);

  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'Home' }} />
        <Stack.Screen name="login" options={{ title: 'Login' }} />
        <Stack.Screen name="register" options={{ title: 'Cadastro' }} />
        <Stack.Screen name="quick-expense" options={{ title: 'Lançamentos' }} />
        <Stack.Screen name="transactions" options={{ title: 'Meus Gastos' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
