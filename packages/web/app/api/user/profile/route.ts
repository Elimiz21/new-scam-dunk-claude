import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { corsOptionsResponse, corsResponse } from '@/lib/cors'

export async function OPTIONS() {
    return corsOptionsResponse()
}

export async function GET(request: NextRequest) {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return corsResponse({ success: false, error: 'Unauthorized' }, 401)
    }

    const { data: userRecord, error: dbError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role, preferences, settings, profile, phone')
        .eq('id', user.id)
        .single()

    if (dbError || !userRecord) {
        return corsResponse({ success: false, error: 'User not found' }, 404)
    }

    const sanitizedUser = {
        id: userRecord.id,
        email: userRecord.email,
        name: `${userRecord.first_name ?? ''} ${userRecord.last_name ?? ''}`.trim() || userRecord.email,
        role: userRecord.role ?? 'user',
        phone: userRecord.phone,
        preferences: {
            theme: userRecord.preferences?.theme ?? 'light',
            notifications: userRecord.preferences?.notifications ?? true,
            twoFactorEnabled: userRecord.preferences?.twoFactorEnabled ?? false,
        },
        subscription: {
            plan: 'free',
            status: 'active',
            expiresAt: undefined,
            ...(userRecord.settings?.subscription ?? {}),
        },
        profile: userRecord.profile ?? {},
    }

    return corsResponse({ success: true, user: sanitizedUser })
}

export async function PATCH(request: NextRequest) {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return corsResponse({ success: false, error: 'Unauthorized' }, 401)
    }

    try {
        const body = await request.json()
        const { name, preferences, profile, subscription, phone } = body

        const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
        }

        if (typeof name === 'string' && name.trim()) {
            const [firstName, ...rest] = name.trim().split(' ')
            updates.first_name = firstName
            updates.last_name = rest.join(' ') || null
        }

        if (typeof phone === 'string') {
            updates.phone = phone.trim()
        }

        // Fetch current data to merge
        const { data: currentUser } = await supabase
            .from('users')
            .select('preferences, settings, profile')
            .eq('id', user.id)
            .single()

        if (preferences && typeof preferences === 'object') {
            const currentPrefs = currentUser?.preferences ?? {}

            const newPrefs = {
                ...currentPrefs,
                theme: preferences.theme ?? currentPrefs.theme,
                notifications: preferences.notifications ?? currentPrefs.notifications,
                twoFactorEnabled: preferences.twoFactorEnabled ?? currentPrefs.twoFactorEnabled,
            }

            // Validate theme
            if (newPrefs.theme && !['light', 'dark', 'system'].includes(newPrefs.theme)) {
                newPrefs.theme = 'light'
            }

            updates.preferences = newPrefs
        }

        if (subscription && typeof subscription === 'object') {
            const currentSettings = currentUser?.settings ?? {}
            const currentSub = currentSettings.subscription ?? {}

            const newSub = {
                ...currentSub,
                plan: subscription.plan ?? currentSub.plan,
                status: subscription.status ?? currentSub.status,
                expiresAt: subscription.expiresAt ?? currentSub.expiresAt,
            }

            // Validate plan and status
            if (newSub.plan && !['free', 'pro', 'family'].includes(newSub.plan)) {
                newSub.plan = 'free'
            }
            if (newSub.status && !['active', 'canceled', 'past_due'].includes(newSub.status)) {
                newSub.status = 'active'
            }

            updates.settings = {
                ...currentSettings,
                subscription: newSub,
            }
        }

        if (profile && typeof profile === 'object') {
            updates.profile = {
                ...(currentUser?.profile ?? {}),
                ...profile,
            }
        }

        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id)
            .select('id, email, first_name, last_name, role, preferences, settings, profile, phone')
            .single()

        if (updateError || !updatedUser) {
            console.error('Profile update error:', updateError)
            return corsResponse({ success: false, error: 'Unable to update profile' }, 500)
        }

        const sanitizedUser = {
            id: updatedUser.id,
            email: updatedUser.email,
            name: `${updatedUser.first_name ?? ''} ${updatedUser.last_name ?? ''}`.trim() || updatedUser.email,
            role: updatedUser.role ?? 'user',
            phone: updatedUser.phone,
            preferences: {
                theme: updatedUser.preferences?.theme ?? 'light',
                notifications: updatedUser.preferences?.notifications ?? true,
                twoFactorEnabled: updatedUser.preferences?.twoFactorEnabled ?? false,
            },
            subscription: {
                plan: 'free',
                status: 'active',
                expiresAt: undefined,
                ...(updatedUser.settings?.subscription ?? {}),
            },
            profile: updatedUser.profile ?? {},
        }

        return corsResponse(sanitizedUser)

    } catch (error) {
        console.error('Profile update exception:', error)
        return corsResponse({ success: false, error: 'Unexpected error updating profile' }, 500)
    }
}
