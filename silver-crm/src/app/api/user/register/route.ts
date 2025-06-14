// app/api/users/register/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import validator from "validator";
import nodemailer from "nodemailer";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Email transporter (same as in your verify route)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});



export async function POST(request: Request) {
  try {
    const { name, email, password, confirmPassword } = await request.json();

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match" },
        { status: 400 }
      );
    }

    if (!validator.isEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email" },
        { status: 400 }
      );
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await client.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email],
    });

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0] as any;
      if (!user.is_verified) {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 3600000).toISOString();

        await client.execute({
          sql: "UPDATE users SET verification_code = ?, verification_code_expires = ? WHERE email = ?",
          args: [verificationCode, verificationCodeExpires, email]
        });

        // In production, you would send the verification email here
        console.log("Verification code:", verificationCode);

        return NextResponse.json({
          success: false,
          error: "User already exists but is not verified. A new verification code has been sent."
        });
      }

      return NextResponse.json(
        { success: false, error: "User already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 3600000).toISOString();
    const createdAt = new Date().toISOString();

    await client.execute({
      sql: `
        INSERT INTO users (id, name, email, password_hash, verification_code, verification_code_expires, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        uuidv4(),
        name,
        email,
        hashedPassword,
        verificationCode,
        verificationCodeExpires,
        new Date().toISOString()
      ],
    });

    // Send verification email
    try {
      const mailOptions = {
        from: '"Verification Team" <your_email@example.com>', 
            to: email, 
            subject: "Email Verification Code", 
            text: `Your verification code is ${verificationCode}`,
            html: `              
               <!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Email Verification</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                line-height: 1.6;
                                color: #333;
                                margin: 0;
                                padding: 0;
                                background-color: #f9f9f9;
                            }
                            .email-container {
                                max-width: 600px;
                                margin: 20px auto;
                                padding: 25px;
                                background-color: #ffffff;
                                border: 1px solid #ddd;
                                border-radius: 8px;
                                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                            }
                            .alert {
                                background-color: #e6f2ff;
                                color: #0056b3;
                                padding: 12px;
                                border-radius: 5px;
                                text-align: center;
                                font-weight: bold;
                                margin-bottom: 15px;
                                border: 1px solid #0056b3;
                            }
                            h4 {
                                color: #333;
                                font-size: 18px;
                                margin: 0 0 15px 0;
                            }
                            p {
                                font-size: 14px;
                                color: #555;
                                margin-bottom: 15px;
                                line-height: 1.5;
                            }
                            .verification-code {
                                font-size: 20px;
                                font-weight: bold;
                                color: #0056b3;
                                text-align: center;
                                margin: 20px 0;
                                padding: 10px;
                                background-color: #f1f1f1;
                                border-radius: 5px;
                            }
                            .footer {
                                margin-top: 20px;
                                font-size: 13px;
                                color: #777;
                            }
                            hr {
                                border: 0;
                                height: 1px;
                                background: #ddd;
                                margin: 20px 0;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="email-container">
                            <div class="alert">🔐 Verify Your Email</div>
                            <h4>Hello ${name},</h4>
                            <hr> <!-- Visual separation -->
                            <p>Welcome to CRM! Thank you for signing up. To complete your registration, please verify your email address by entering the verification code below:</p>
                            <div class="verification-code">${verificationCode}</div>
                            <p>This code is valid for the next <strong>15 minutes</strong>. If you did not sign up for a CRM account, you can safely ignore this email.</p>
                            <p>Need help? Contact our support team at <a href="mailto:support@crmteam.com">support@crmteam.com</a>.</p>
                            <div class="footer">
                                <p>Best regards,<br><strong>The CRM Team</strong></p>
                            </div>
                        </div>
                    </body>
                    </html>

            `, 
      };

      await transporter.sendMail(mailOptions);
      console.log(`Verification email sent to ${email}`);
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      // Continue registration even if email fails
    }

    return NextResponse.json(
      { 
        success: true,
        message: "Registration successful. Please check your email for the verification code.",
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}