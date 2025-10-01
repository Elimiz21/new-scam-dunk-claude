import { NextRequest } from 'next/server'
import { corsOptionsResponse, corsResponse } from '@/lib/cors'
import { getSupabaseClient } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET

export async function OPTIONS() {
  return corsOptionsResponse()
}

export async function POST(request: NextRequest) {
  try {
    if (!JWT_SECRET) {
      return corsResponse(
        {
          success: false,
          error: 'Server misconfiguration: missing JWT secret',
        },
        500
      )
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return corsResponse(
        {
          success: false,
          error: 'Email and password are required',
        },
        400
      )
    }

    const supabase = getSupabaseClient()

    if (!supabase) {
      return corsResponse(
        {
          success: false,
          error: 'Database connection failed',
        },
        500
      )
    }

    const { data: user, error } = await supabase
      .from('users')
      .select(
        `id, email, password_hash, first_name, last_name, role, preferences, settings, profile`
      )
      .eq('email', String(email).toLowerCase())
      .single()

    if (error || !user || !user.password_hash) {
      return corsResponse(
        {
          success: false,
          error: 'Invalid credentials',
        },
        401
      )
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatches) {
      return corsResponse(
        {
          success: false,
          error: 'Invalid credentials',
        },
        401
      )
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role ?? 'user',
        name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email,
      role: user.role ?? 'user',
      preferences: {
        theme: user.preferences?.theme ?? 'light',
        notifications: user.preferences?.notifications ?? true,
        twoFactorEnabled: user.preferences?.twoFactorEnabled ?? false,
      },
      subscription: {
        plan: 'free',
        status: 'active',
        expiresAt: undefined,
        ...(user.settings?.subscription ?? {}),
      },
      profile: user.profile ?? {},
    }

    return corsResponse({ success: true, user: sanitizedUser, token })
  } catch (error) {
    console.error('Login error:', error)
    return corsResponse(
      {
        success: false,
        error: 'Unable to login at this time',
      },
      500
    )
  }
}
