import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        console.log('=== PDF Parser API Called ===');

        const formData = await request.formData();
        const file = formData.get('file') as File;
        // Accept webhook URL from the request (user-configured) OR fall back to env var
        const clientWebhookUrl = formData.get('webhookUrl') as string | null;
        // Company context passed from the frontend
        const companyId = formData.get('company_id') as string | null;
        const companyName = formData.get('company_name') as string | null;
        const userId = formData.get('user_id') as string | null;
        const filename = formData.get('filename') as string | null;
        const bankAccountId = formData.get('bank_account_id') as string | null;
        const bankName = formData.get('bank_name') as string | null;
        const bankCode = formData.get('bank_code') as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Priority: 1) URL sent from frontend (user configured in Settings)
        //           2) N8N_WEBHOOK_URL environment variable
        //           3) MAKE_WEBHOOK_URL environment variable
        const envN8n = process.env.N8N_WEBHOOK_URL;
        const envMake = process.env.MAKE_WEBHOOK_URL;

        let webhookUrl = clientWebhookUrl || envN8n || envMake;

        console.log('DEBUG: Client webhook URL provided?', !!clientWebhookUrl);
        console.log('DEBUG: Env N8N_WEBHOOK_URL?', !!envN8n);
        console.log('DEBUG: Resolved webhook URL:', webhookUrl ? webhookUrl.substring(0, 50) + '...' : 'NONE');

        // Skip placeholder values
        const PLACEHOLDERS = [
            'https://your-n8n-instance.com/webhook/pdf-parser',
            'https://your-n8n-webhook-url-here',
            'YOUR_WEBHOOK_ID_HERE'
        ];

        if (!webhookUrl || PLACEHOLDERS.some(p => webhookUrl!.includes(p))) {
            console.error('No valid Webhook URL configured');
            return NextResponse.json({
                error: "Webhook not configured",
                details: "Please save your n8n Webhook URL in Settings → n8n Integration first.",
                suggestion: "Go to Settings, paste your n8n Webhook URL, and click Save."
            }, { status: 500 });
        }

        const isN8n = webhookUrl === clientWebhookUrl || webhookUrl === envN8n;
        const provider = isN8n ? 'n8n' : 'Make.com';
        console.log(`Forwarding PDF to ${provider}:`, file.name);

        // Build n8n URL with company metadata as query params
        // n8n reads FormData text fields unreliably but ALWAYS reads query params via $query.*
        const n8nUrl = new URL(webhookUrl);
        if (companyId) n8nUrl.searchParams.set('company_id', companyId);
        if (companyName) n8nUrl.searchParams.set('company_name', companyName);
        if (userId) n8nUrl.searchParams.set('user_id', userId);
        if (filename) n8nUrl.searchParams.set('filename', filename || file.name);
        if (bankAccountId) n8nUrl.searchParams.set('bank_account_id', bankAccountId);
        if (bankName) n8nUrl.searchParams.set('bank_name', bankName);
        if (bankCode) n8nUrl.searchParams.set('bank_code', bankCode);
        const finalWebhookUrl = n8nUrl.toString();

        console.log(`Forwarding PDF to ${provider} with query params:`, finalWebhookUrl);

        // Forward only the file as binary — metadata goes via URL params
        const forwardFormData = new FormData();
        forwardFormData.append('file', file);

        const response = await fetch(finalWebhookUrl, {
            method: 'POST',
            body: forwardFormData,
        });

        console.log(`${provider} Response Status:`, response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`${provider} Error:`, errorText);
            return NextResponse.json({
                error: `${provider} processing failed`,
                details: errorText,
                status: response.status
            }, { status: response.status });
        }

        const data = await response.json();
        console.log(`${provider} response received - parsing transactions...`);

        // Handle various response formats from n8n workflows
        let transactions: any[] = [];
        if (Array.isArray(data)) {
            // n8n often returns an array of objects directly
            transactions = data.flatMap((item: any) => {
                if (item.transactions) return item.transactions;
                if (item.json) return [item.json];
                return [item];
            });
        } else if (data.transactions) {
            transactions = data.transactions;
        } else if (data.data && Array.isArray(data.data)) {
            transactions = data.data;
        } else {
            transactions = [data];
        }

        if (transactions.length === 0) {
            return NextResponse.json({
                error: "No transactions found",
                details: `${provider} did not return any transaction data. Check your n8n workflow output format.`
            }, { status: 400 });
        }

        return NextResponse.json({ transactions, provider });

    } catch (error: any) {
        console.error('Unexpected error in PDF parser:', error);
        return NextResponse.json({
            error: "Unexpected server error",
            details: error.message
        }, { status: 500 });
    }
}
