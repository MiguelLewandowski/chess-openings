'use server';

import { prisma } from '@/lib/prisma';
import { createSession, logout } from '@/lib/session';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export async function registerAction(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password || !name) {
    return { error: 'Please fill out all fields.' };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: 'Email already in use.' };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

  } catch (error) {
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
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return { error: 'Invalid credentials.' };
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return { error: 'Invalid credentials.' };
    }

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      styleArchetype: user.styleArchetype,
    });

  } catch (error) {
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
  const { getSession } = await import('@/lib/session');
  const session = await getSession();
  
  if (!session) {
    return { success: false, error: 'User not logged in' };
  }

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { styleArchetype: archetype },
    });
    
    // Update session
    await createSession({
      ...session,
      styleArchetype: archetype
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to save archetype:', error);
    return { success: false, error: 'Failed to save to database' };
  }
}
