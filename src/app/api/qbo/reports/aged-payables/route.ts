import { NextResponse } from 'next/server';
import { qboClient } from '@/lib/qbo';
import { createClient } from '@/utils/supabase/server';
import {
    getCachedReport,
    reportCacheKey,
    setCachedReport,
} from '@/lib/qbo-report-cache';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get('companyId') || undefined;
        const date = searchParams.get('date') || undefined;

        const cacheKey = reportCacheKey({
            report: 'aged-payables',
            companyId,
            date,
        });
        const cached = getCachedReport<unknown>(cacheKey);
        if (cached) {
            return NextResponse.json(cached, {
                headers: { 'Cache-Control': 'private, max-age=300' },
            });
        }

        const report = await qboClient.getAgedPayables(supabase, date, companyId);

        if (!report) {
            return NextResponse.json({ error: 'No report data returned from QuickBooks' }, { status: 500 });
        }

        setCachedReport(cacheKey, report);
        return NextResponse.json(report, {
            headers: { 'Cache-Control': 'private, max-age=300' },
        });
    } catch (error: any) {
        console.error('Error fetching Aged Payables:', error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);

        return NextResponse.json({
            error: 'Failed to fetch Aged Payables report',
            details: error?.message || 'Unknown error',
            authenticated: error?.message?.includes('authenticated') ? false : undefined
        }, { status: 500 });
    }
}
