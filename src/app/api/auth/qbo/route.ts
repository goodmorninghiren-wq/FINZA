import { NextRequest, NextResponse } from 'next/server';
import { qboClient } from '@/lib/qbo';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Build the redirect URI dynamically from the actual running host+port.
        // This avoids issues when the dev server is on port 3001 instead of 3000.
        const host = request.headers.get('host') || 'localhost:3000';
        const forwardedProto = request.headers.get('x-forwarded-proto');
        const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
        const protocol = forwardedProto ?? (isLocalhost ? 'http' : 'https');
        const dynamicRedirectUri = `${protocol}://${host}/api/auth/qbo/callback`;

        console.log(`[QBO Auth] Using dynamic redirect URI: ${dynamicRedirectUri}`);

        const authUri = await qboClient.getAuthUri(supabase, dynamicRedirectUri);
        return NextResponse.redirect(authUri);
    } catch (error) {
        console.error('OAuth Start Error:', error);
        return NextResponse.json({ error: 'Failed to initiate OAuth flow' }, { status: 500 });
    }
}
