'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function login(password: string) {
    const correctPassword = process.env.APP_PASSWORD

    if (password === correctPassword) {
        const cookieStore = await cookies()
        cookieStore.set('mush_auth', 'true', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        })
        return { success: true }
    }

    return { success: false, error: 'Senha incorreta' }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('mush_auth')
    redirect('/login')
}
