import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@libsql/client';

// Initialize Turso client
const tursoClient = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const to = formData.get('to') as string;
  const subject = formData.get('subject') as string || "(No Subject)";
  const message = formData.get('message') as string || "(No Message)";
  const files = formData.getAll('files') as File[];

  if (!to) {
    return NextResponse.json(
      { success: false, message: "Recipient email (to) is required" },
      { status: 400 }
    );
  }

  try {
    // Process attachments if any
    const attachments = await Promise.all(
      files.map(async (file) => {
        const buffer = await file.arrayBuffer();
        return {
          filename: file.name,
          content: Buffer.from(buffer),
        };
      })
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html: message,
      attachments,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // Log to Turso without requiring schema
    await tursoClient.execute({
      sql: `
        INSERT INTO email_logs (recipient, subject, status, sent_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `,
      args: [to, subject, 'sent'],
    });

    return NextResponse.json({
      success: true,
      message: `Email sent to ${to}`,
      data: info.response,
    });

  } catch (error: any) {
    // Log failure to Turso
    await tursoClient.execute({
      sql: `
        INSERT INTO email_logs (recipient, subject, status, error, sent_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      args: [to, subject, 'failed', error.message],
    });

    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}