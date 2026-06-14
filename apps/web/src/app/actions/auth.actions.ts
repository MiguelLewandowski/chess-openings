'use server';

import { createSession, getSession, logout } from '@/lib/session';
import { apiClient, type AuthResponse } from '@/lib/api-client';
import { redirect } from 'next/navigation';

async function startSession({ token, user }: AuthResponse) {
  await createSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    styleArchetype: user.styleArchetype,
    apiToken: token,
  });
}

export async function registerAction(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password || !name) {
    return { error: 'Preencha todos os campos.' };
  }

  try {
    const auth = await apiClient.auth.register(email, password, name);
    await startSession(auth);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('API error 409')) {
      return { error: 'Este e-mail já está em uso.' };
    }
    console.error('Register error:', error);
    return { error: 'Não foi possível criar a conta.' };
  }

  redirect('/');
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Informe e-mail e senha.' };
  }

  try {
    const auth = await apiClient.auth.login(email, password);
    await startSession(auth);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('API error 401')) {
      return { error: 'Credenciais inválidas.' };
    }
    console.error('Login error:', error);
    return { error: 'Não foi possível entrar.' };
  }

  redirect('/');
}

export async function logoutAction() {
  await logout();
  redirect('/login');
}

export async function saveUserArchetype(archetype: string) {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'User not logged in' };
  }

  try {
    await apiClient.auth.updateProfile(archetype, session.apiToken);
    await createSession({ ...session, styleArchetype: archetype });
    return { success: true };
  } catch (error) {
    console.error('Failed to save archetype:', error);
    return { success: false, error: 'Failed to save archetype' };
  }
}
