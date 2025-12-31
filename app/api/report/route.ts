import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Configure your Resend API Key here or in .env
// Defaults to a placeholder if not set, preventing crashes but logging errors
const resend = new Resend(process.env.RESEND_API_KEY || 're_123456789');

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { postId, reportedBy, reason } = body;

        // If no API key, log and return simulated success (dev mode safe)
        if (!process.env.RESEND_API_KEY) {
            console.warn("⚠️ RESEND_API_KEY not found. Email simulation:", { postId, reportedBy, reason });
            return NextResponse.json({ success: true, simulated: true });
        }

        // Send email to Admin
        const { data, error } = await resend.emails.send({
            from: 'Droplet Reports <onboarding@resend.dev>', // Default Resend testing domain
            to: 'delivered@resend.dev', // Default testing address, User should change this
            subject: `🚩 Report Alert: Post ${postId}`,
            html: `
                <h1>Post Reported</h1>
                <p><strong>Post ID:</strong> ${postId}</p>
                <p><strong>Reported By User:</strong> ${reportedBy}</p>
                <p><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
                <hr />
                <p>Please check Supabase dashboard to take action.</p>
            `,
        });

        if (error) {
            console.error("Resend Error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
