import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

function createToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "1d" });
}

type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string | null;
  is_verified: number;
  is_first_login: number;
};

// 👇 THIS is the required export
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const result = await client.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email],
    });

    const user = result.rows[0] as unknown as UserRow | undefined;

    if (!user) {
      return NextResponse.json({ success: false, message: "User doesn't exist" });
    }

    if (user.is_verified === 0) {
      return NextResponse.json({ success: false, message: "Please verify your email to log in." });
    }

    if (!user.password_hash) {
      return NextResponse.json({ success: false, message: "Password not set for this account." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: "Invalid password" });
    }

  const isFirstLogin = user.is_first_login === 1;

    if (isFirstLogin) {
      await client.execute({
        sql: "UPDATE users SET is_first_login = 0, updated_at = ? WHERE id = ?",
        args: [new Date().toISOString(), user.id],
      });
    }

    const token = createToken(user.id);

    return NextResponse.json({
      success: true,
      isFirstLogin,
      message: "Login successful",
      token,
      email: user.email,
      userId: user.id,
      redirectTo: isFirstLogin ?  "/dashboard": "/Profile",
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
