import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
        return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    try {
        const { data, error } = await supabase
            .from('rule_sync_log')
            .select('*')
            .eq('company_id', companyId)
            .order('synced_at', { ascending: false })
            .limit(20);

        if (error) {
            // Table may not exist yet — return empty array gracefully
            if (error.code === '42P01') {
                return NextResponse.json([]);
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch {
        return NextResponse.json([]);
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    try {
        const body = await request.json();
        const { company_id, direction, rules_count, status, error_message } = body;

        const { data, error } = await supabase
            .from('rule_sync_log')
            .insert({
                company_id,
                direction,
                rules_count: rules_count || 0,
                status: status || 'success',
                error_message: error_message || null,
                synced_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            if (error.code === '42P01') {
                // Table doesn't exist — return mock success
                return NextResponse.json({ id: 'mock', ...body });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
