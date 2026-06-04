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
            report: 'aged-receivables',
            companyId,
            date,
        });
        const cached = getCachedReport<unknown>(cacheKey);
        if (cached) {
            return NextResponse.json(cached, {
                headers: { 'Cache-Control': 'private, max-age=300' },
            });
        }

        const report = await qboClient.getAgedReceivables(supabase, date, companyId);

        if (!report) {
            return NextResponse.json({ error: 'No report data returned from QuickBooks' }, { status: 500 });
        }

        setCachedReport(cacheKey, report);
        return NextResponse.json(report, {
            headers: { 'Cache-Control': 'private, max-age=300' },
        });
    } catch (error: any) {
        console.error('Error fetching Aged Receivables:', error);
        return NextResponse.json({
            error: 'Failed to fetch Aged Receivables report',
            details: error?.message || 'Unknown error'
        }, { status: 500 });
    }
}
