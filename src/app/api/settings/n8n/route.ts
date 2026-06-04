import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ webhookUrl: null });

        const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', user.id)
            .single();

        if (!profile?.company_id) return NextResponse.json({ webhookUrl: null });

        const { data: company } = await supabase
            .from('companies')
            .select('n8n_webhook_url')
            .eq('id', profile.company_id)
            .single();

        return NextResponse.json({ webhookUrl: company?.n8n_webhook_url || null });
    } catch {
        return NextResponse.json({ webhookUrl: null });
    }
}

export async function POST(request: Request) {
    try {
        const { webhookUrl } = await request.json();

        if (!webhookUrl || typeof webhookUrl !== 'string') {
            return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 });
        }

        // Try to save to company settings in Supabase for persistence
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('company_id')
                    .eq('id', user.id)
                    .single();

                if (profile?.company_id) {
                    await supabase
                        .from('companies')
                        .update({ n8n_webhook_url: webhookUrl })
                        .eq('id', profile.company_id);
                }
            }
        } catch (dbErr) {
            // Non-fatal, localStorage is the fallback
            console.warn('Could not save n8n URL to DB:', dbErr);
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to save settings" }, { status: 500 });
    }
}
