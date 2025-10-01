import { NextRequest, NextResponse } from 'next/server'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { corsHeaders } from '@/lib/cors'

export interface AuthTokenPayload extends JwtPayload {
  userId: string
  email: string
  role?: string
  name?: string
}

type AuthResult = { user: AuthTokenPayload } | { error: NextResponse }

const JWT_SECRET = process.env.JWT_SECRET || process.env.NEXT_PUBLIC_JWT_SECRET

export function requireAuth(request: NextRequest): AuthResult {
  if (!JWT_SECRET) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: 'Server misconfiguration: missing JWT secret',
        },
        {
          status: 500,
          headers: corsHeaders,
        }
      ),
    }
  }

  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')

  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
        },
        {
          status: 401,
          headers: corsHeaders,
        }
      ),
    }
  }

  const token = authHeader.substring(authHeader.indexOf(' ') + 1)

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthTokenPayload

    if (!payload?.userId || !payload?.email) {
      throw new Error('Invalid token payload')
    }

    return { user: payload }
  } catch (error) {
    return {
      error: NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token',
        },
        {
          status: 401,
          headers: corsHeaders,
        }
      ),
    }
  }
}
