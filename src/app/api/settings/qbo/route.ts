import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { QboSettingsPayload } from '@/types/qbo-settings';

function envFallback(): QboSettingsPayload {
    const client_id = process.env.NEXT_PUBLIC_QBO_CLIENT_ID?.trim() || '';
    const client_secret = process.env.QBO_CLIENT_SECRET?.trim() || '';
    const environment =
        process.env.NEXT_PUBLIC_QBO_ENVIRONMENT?.trim() || 'sandbox';

    if (client_id && client_secret) {
        return {
            client_id,
            client_secret,
            environment,
            source: 'environment',
        };
    }

    return {
        client_id: '',
        client_secret: '',
        environment: 'sandbox',
        source: null,
    };
}

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('qbo_settings')
            .select('client_id, client_secret, environment, updated_at')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) {
            const missingTable =
                error.code === '42P01' ||
                error.code === 'PGRST205' ||
                error.message?.toLowerCase().includes('qbo_settings');

            if (missingTable) {
                console.warn(
                    'qbo_settings table missing — run qbo_settings_schema.sql in Supabase'
                );
                return NextResponse.json(envFallback());
            }

            console.error('Error fetching QBO settings:', error);
            return NextResponse.json(
                { error: 'Failed to fetch settings' },
                { status: 500 }
            );
        }

        if (data?.client_id && data?.client_secret) {
            const payload: QboSettingsPayload = {
                client_id: data.client_id,
                client_secret: data.client_secret,
                environment: data.environment || 'sandbox',
                source: 'database',
                updated_at: data.updated_at ?? null,
            };
            return NextResponse.json(payload);
        }

        // No user-specific settings found — return blank credentials.
        // New users must set up their own QBO Client ID & Secret before connecting.
        // Do NOT fall back to shared environment credentials.
        return NextResponse.json({
            client_id: '',
            client_secret: '',
            environment: 'sandbox',
            source: null,
        } as QboSettingsPayload);
    } catch (error) {
        console.error('GET QBO settings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const client_id =
            typeof body.client_id === 'string' ? body.client_id.trim() : '';
        const client_secret =
            typeof body.client_secret === 'string' ? body.client_secret.trim() : '';
        const environment =
            typeof body.environment === 'string' ? body.environment.trim() : '';

        if (!client_id || !client_secret || !environment) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!['sandbox', 'production'].includes(environment)) {
            return NextResponse.json({ error: 'Invalid environment' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('qbo_settings')
            .upsert(
                {
                    user_id: user.id,
                    client_id,
                    client_secret,
                    environment,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' }
            )
            .select('client_id, client_secret, environment, updated_at')
            .single();

        if (error) {
            console.error('Error saving QBO settings:', error);
            const hint =
                error.code === '42P01' || error.code === 'PGRST205'
                    ? 'Run qbo_settings_schema.sql in the Supabase SQL editor first.'
                    : error.message;
            return NextResponse.json(
                { error: 'Failed to save settings', hint },
                { status: 500 }
            );
        }

        const payload: QboSettingsPayload = {
            client_id: data.client_id,
            client_secret: data.client_secret,
            environment: data.environment,
            source: 'database',
            updated_at: data.updated_at ?? null,
        };

        return NextResponse.json(payload);
    } catch (error) {
        console.error('POST QBO settings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
