import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/utils/supabase/server'

// Validate that the redirect path is safe (relative path, not an open redirect)
function getSafeRedirectPath(path: string | null): string {
    if (!path) return '/';

    // Must start with single slash (relative path)
    // Must NOT start with // (protocol-relative URL) or contain ://
    if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
        return '/';
    }

    // Additional check: decode and re-check for encoded attacks
    try {
        const decoded = decodeURIComponent(path);
        if (decoded.startsWith('//') || decoded.includes('://')) {
            return '/';
        }
    } catch (_e) {
        // If decoding fails, reject the path
        return '/';
    }

    return path;
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null
    const next = getSafeRedirectPath(searchParams.get('next'))

    const redirectTo = request.nextUrl.clone()
    redirectTo.pathname = next
    redirectTo.searchParams.delete('token_hash')
    redirectTo.searchParams.delete('type')

    if (token_hash && type) {
        const supabase = await createClient()

        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash,
        })

        if (error) {
            console.error('OTP verification failed:', error.message);
        }

        if (!error) {
            redirectTo.searchParams.delete('next')
            return NextResponse.redirect(redirectTo)
        }
    }
    // return the user to an error page with some instructions
    redirectTo.pathname = '/error'
    return NextResponse.redirect(redirectTo)
}