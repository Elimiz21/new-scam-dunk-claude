import { NextRequest } from 'next/server'
import { corsOptionsResponse, corsResponse } from '@/lib/cors'
import { getSupabaseClient } from '@/lib/supabase-admin'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET
const PASSWORD_MIN_LENGTH = 8

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

    const { name, email, password, phone } = await request.json()

    if (!name || !email || !password) {
      return corsResponse(
        {
          success: false,
          error: 'Name, email and password are required',
        },
        400
      )
    }

    if (String(password).length < PASSWORD_MIN_LENGTH) {
      return corsResponse(
        {
          success: false,
          error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
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

    const emailLower = String(email).toLowerCase()

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', emailLower)
      .maybeSingle()

    if (existingUser) {
      return corsResponse(
        {
          success: false,
          error: 'An account with this email already exists',
        },
        409
      )
    }

    const [firstName, ...rest] = String(name).trim().split(' ')
    const lastName = rest.join(' ')

    const passwordHash = await bcrypt.hash(password, 12)

    const defaultPreferences = {
      theme: 'light',
      notifications: true,
      twoFactorEnabled: false,
    }

    const defaultSettings = {
      subscription: {
        plan: 'free',
        status: 'active',
      },
    }

    const { data: createdUser, error } = await supabase
      .from('users')
      .insert(
        {
          email: emailLower,
          first_name: firstName,
          last_name: lastName,
          password_hash: passwordHash,
          phone,
          role: 'user',
          preferences: defaultPreferences,
          settings: defaultSettings,
          created_at: new Date().toISOString(),
        }
      )
      .select(
        'id, email, first_name, last_name, role, preferences, settings, profile'
      )
      .single()

    if (error || !createdUser) {
      console.error('Register insert error:', error)
      return corsResponse(
        {
          success: false,
          error: 'Unable to create account',
        },
        500
      )
    }

    const token = jwt.sign(
      {
        userId: createdUser.id,
        email: createdUser.email,
        role: createdUser.role ?? 'user',
        name: `${createdUser.first_name ?? ''} ${createdUser.last_name ?? ''}`.trim(),
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    const sanitizedUser = {
      id: createdUser.id,
      email: createdUser.email,
      name: `${createdUser.first_name ?? ''} ${createdUser.last_name ?? ''}`.trim() || createdUser.email,
      role: createdUser.role ?? 'user',
      preferences: {
        theme: createdUser.preferences?.theme ?? defaultPreferences.theme,
        notifications: createdUser.preferences?.notifications ?? defaultPreferences.notifications,
        twoFactorEnabled: createdUser.preferences?.twoFactorEnabled ?? defaultPreferences.twoFactorEnabled,
      },
      subscription: {
        plan: createdUser.settings?.subscription?.plan ?? 'free',
        status: createdUser.settings?.subscription?.status ?? 'active',
        expiresAt: createdUser.settings?.subscription?.expiresAt,
      },
      profile: createdUser.profile ?? {},
    }

    return corsResponse({ success: true, user: sanitizedUser, token }, 201)
  } catch (error) {
    console.error('Registration error:', error)
    return corsResponse(
      {
        success: false,
        error: 'Unable to register at this time',
      },
      500
    )
  }
}
