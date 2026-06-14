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
    return { error: 'Please fill out all fields.' };
  }

  try {
    const auth = await apiClient.auth.register(email, password, name);
    await startSession(auth);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('API error 409')) {
      return { error: 'Email already in use.' };
    }
    console.error('Register error:', error);
    return { error: 'Failed to create account.' };
  }

  redirect('/');
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter email and password.' };
  }

  try {
    const auth = await apiClient.auth.login(email, password);
    await startSession(auth);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('API error 401')) {
      return { error: 'Invalid credentials.' };
    }
    console.error('Login error:', error);
    return { error: 'Failed to sign in.' };
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
