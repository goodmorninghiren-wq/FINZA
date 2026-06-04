import { NextRequest, NextResponse } from 'next/server';
import { qboClient } from '@/lib/qbo';
import { createClient } from '@/utils/supabase/server';
import { tokenStorage } from '@/lib/token-storage';

/** Build the correct base URL for redirects, handling local dev vs production. */
function getBaseUrl(request: NextRequest): string {
    const host = request.headers.get('host') || 'localhost:3000';
    // x-forwarded-proto is only set by reverse proxies (Vercel, Render, nginx).
    // For local development it won't be present, so we detect by host.
    const forwardedProto = request.headers.get('x-forwarded-proto');
    const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
    const protocol = forwardedProto ?? (isLocalhost ? 'http' : 'https');
    return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const realmId = searchParams.get('realmId');

    // intuit-oauth expects the full URL including query params
    const fullUrl = request.url;
    const baseUrl = getBaseUrl(request);

    if (!code || !realmId) {
        return NextResponse.redirect(`${baseUrl}/?qbo_error=Missing+code+or+realmId`);
    }

    try {
        const supabase = await createClient();

        // Check if we already have a fresh token for this realmId (last 30 seconds).
        // This handles double-triggering in Next.js dev mode.
        const existingToken = await tokenStorage.load(supabase, realmId);
        if (existingToken && (Date.now() - existingToken.createdAt < 30000)) {
            console.log('[QBO Callback] Token already fresh. Redirecting to dashboard.');
            return NextResponse.redirect(`${baseUrl}/`);
        }

        await qboClient.createToken(supabase, fullUrl);

        // Fetch company name to store alongside the token
        const companyInfo = await qboClient.getCompanyInfo(supabase, realmId);
        const companyName =
            companyInfo.CompanyInfo?.CompanyName ||
            companyInfo.companyName ||
            `Company ${realmId}`;

        // Update the token record with the company name
        const tokens = await tokenStorage.load(supabase, realmId);
        if (tokens) {
            await tokenStorage.save(supabase, tokens, realmId, companyName);
        }

        console.log(`[QBO Callback] Connected "${companyName}". Redirecting to ${baseUrl}/`);

        // Success — go back to dashboard
        return NextResponse.redirect(`${baseUrl}/`);
    } catch (error: any) {
        console.error('[QBO Callback] Error:', {
            message: error.message,
            code: error.code,
            response: error.response?.body,
        });

        // Redirect back with error message so the UI can display it
        const errorMsg = encodeURIComponent(error.message || 'QuickBooks connection failed');
        return NextResponse.redirect(`${baseUrl}/?qbo_error=${errorMsg}`);
    }
}
