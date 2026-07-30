import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const { webhookUrl } = await request.json();

        if (!webhookUrl || typeof webhookUrl !== 'string') {
            return NextResponse.json({ error: "Invalid webhook URL" }, { status: 400 });
        }

        // Attempt a test ping to the n8n webhook
        const testRes = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'test', source: 'rise360' }),
            signal: AbortSignal.timeout(8000)
        });

        if (testRes.ok) {
            return NextResponse.json({ success: true, message: "Connection successful" });
        } else {
            return NextResponse.json(
                { success: false, error: `n8n responded with status ${testRes.status}` },
                { status: 400 }
            );
        }
    } catch (err: any) {
        if (err.name === 'TimeoutError') {
            return NextResponse.json({ error: "Connection timed out. Is n8n running?" }, { status: 408 });
        }
        return NextResponse.json({ error: err.message || "Connection failed" }, { status: 500 });
    }
}
