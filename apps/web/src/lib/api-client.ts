import type { OpeningSummary, LessonDetail, MoveSummary } from '@chess-openings/domain'

export interface ApiUser {
  id: string
  email: string
  name: string | null
  role: string
  styleArchetype: string | null
  xp: number
  streak: number
}

export interface AuthResponse {
  token: string
  user: ApiUser
}

export interface DueReview {
  nextReview: string
  exercise: {
    id: string
    lesson: {
      id: string
      title: string
      order: number
      opening: { name: string; slug: string }
    }
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api'

type FetchOptions = Omit<RequestInit, 'body'> & { token?: string; body?: string }

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...init } = options
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: 'no-store' })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)

  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

async function apiFetchNullable<T>(path: string, options: FetchOptions = {}): Promise<T | null> {
  try {
    return await apiFetch<T>(path, options)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('API error 404')) return null
    throw error
  }
}

export const apiClient = {
  openings: {
    findAll: () => apiFetch<OpeningSummary[]>('/openings'),
    findBySlug: (slug: string) => apiFetchNullable<OpeningSummary>(`/openings/${slug}`),
    remove: (id: string, token: string) =>
      apiFetch<void>(`/openings/${id}`, { method: 'DELETE', token }),
  },
  puzzles: {
    list: (openingNames: string[], limit = 10, maxRating = 1800) => {
      const params = new URLSearchParams({ limit: String(limit), maxRating: String(maxRating) })
      if (openingNames.length > 0) params.set('openings', openingNames.join(','))
      return apiFetch<PuzzleData[]>(`/puzzles?${params.toString()}`)
    },
  },
  lessons: {
    findById: (id: string, token: string) => apiFetchNullable<LessonDetail>(`/lessons/${id}`, { token }),
  },
  progress: {
    complete: (exerciseId: string, quality: number, token: string) =>
      apiFetch<void>(`/progress/${exerciseId}`, {
        method: 'POST',
        body: JSON.stringify({ quality }),
        token,
      }),
    dueReviews: (token: string) => apiFetch<DueReview[]>('/progress/reviews/due', { token }),
    completedLessons: (openingId: string, token: string) =>
      apiFetch<string[]>(`/progress/openings/${openingId}/completed-lessons`, { token }),
  },
  auth: {
    register: (email: string, password: string, name?: string) =>
      apiFetch<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      }),
    login: (email: string, password: string) =>
      apiFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    updateProfile: (styleArchetype: string, token: string) =>
      apiFetch<ApiUser>('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ styleArchetype }),
        token,
      }),
    me: (token: string) => apiFetch<ApiUser>('/auth/me', { token }),
  },
  ingestor: {
    study: (dto: IngestStudyInput, token: string) =>
      apiFetch<{ id: string; name: string }>('/ingestor/study', {
        method: 'POST',
        body: JSON.stringify(dto),
        token,
      }),
  },
}

export interface IngestStudyInput {
  url: string
  openingName?: string
  chapterLimit?: number
  specificChapter?: number
  styleTags?: string[]
}

export interface PuzzleData {
  id: string
  lichessId: string
  openingName: string
  initialFen: string
  movesTree: MoveSummary[]
  playerColor: 'white' | 'black'
  rating: number
}
