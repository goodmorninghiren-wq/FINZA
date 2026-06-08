import { NextResponse } from 'next/server';
import { qboClient } from '@/lib/qbo';

import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();

        // Enforce user identity — never return another user's companies
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const includeInactive = searchParams.get('all') === 'true';

        let query = supabase
            .from('quickbooks_clients')
            .select('id, name, client_email, is_active, created_at')
            .eq('user_id', user.id); // ← scope to current user only

        if (!includeInactive) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;

        if (error) throw error;

        const companies = (data || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            client_email: c.client_email || ""
        }));

        return NextResponse.json(companies);
    } catch (error) {
        console.error('Error fetching connected companies:', error);
        return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();

        // Enforce user identity — only allow editing the current user's own companies
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, client_email } = body;

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        const { error } = await supabase
            .from('quickbooks_clients')
            .update({ client_email })
            .eq('id', id)
            .eq('user_id', user.id); // ← scope to current user only

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating company email:', error);
        return NextResponse.json({ error: 'Failed to update company' }, { status: 500 });
    }
}
