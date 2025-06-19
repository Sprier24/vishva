// app/api/emailsend/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';

const tursoClient = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

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
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;
  const files = formData.getAll('files') as File[];

  if (!to) {
    return NextResponse.json(
      { success: false, message: "Recipient email is required" },
      { status: 400 }
    );
  }

  try {
    // Process attachments
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
      from: process.env.EMAIL_USER, // Using env variable as sender
      to,
      subject: subject || "(No Subject)",
      html: message || "(No Message)",
      attachments,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    const emailId = uuidv4();

    // Log to Turso - INCLUDING SENDER
    await tursoClient.execute({
      sql: `
        INSERT INTO email_logs (id, sender, recipient, subject, status, sent_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      args: [
        emailId,
        process.env.EMAIL_USER ?? '',
        to,
        subject,
        'sent'
      ],
    });

    return NextResponse.json({
      success: true,
      message: `Email sent to ${to}`,
      data: info.response,
    });

  } catch (error: any) {
    const errorId = uuidv4();
    
    // Log failure - INCLUDING SENDER
    await tursoClient.execute({
      sql: `
        INSERT INTO email_logs (id, sender, recipient, subject, status, error, sent_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      args: [
        errorId,
        process.env.EMAIL_USER, // Sender from env
        to,
        subject,
        'failed',
        error.message
      ],
    });

    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}