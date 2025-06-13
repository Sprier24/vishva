import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});


export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ success: false, message: "Missing required fields." }, { status: 400 });
  }

  try {
    const normalizedEmail = email.toLowerCase();

  const existingUser = await client.execute({
      sql: `SELECT * FROM users WHERE email = ?`,
      args: [email],
    });

    if (existingUser) {
      if (!existingUser.isVerified) {
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationCodeExpires = new Date(Date.now() + 3600000).toISOString();

        await db.update(users)
          .set({
            verificationCode,
            verificationCodeExpires
          })
          .where(eq(users.email, normalizedEmail));

        await sendVerificationCode(normalizedEmail, verificationCode);

        return NextResponse.json({
          success: false,
          message: "User already exists but is not verified. A new verification code has been sent."
        });
      }

      return NextResponse.json({ success: false, message: "User Already Exists" });
    }

    if (!validator.isEmail(normalizedEmail)) {
      return NextResponse.json({ success: false, message: "Please enter a valid email" });
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json({
        success: false,
        message: "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character."
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpires = new Date(Date.now() + 3600000).toISOString();

    await db.insert(users).values({
      id: uuidv4(),
      name,
      email: normalizedEmail,
      password: hashedPassword,
      isVerified: false,
      verificationCode,
      verificationCodeExpires,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await sendVerificationCode(normalizedEmail, verificationCode);

    return NextResponse.json({ success: true, message: "Registration successful. Please verify your email." });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
