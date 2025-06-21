import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  const { password } = await request.json();

  const secret = process.env.JWT_SECRET!;

  try {
    const decoded = jwt.verify(token, secret) as { id: string; exp: number };
    const userId = decoded.id;

    const userResult = await client.execute({
      sql: "SELECT * FROM users WHERE id = ?",
      args: [userId],
    });

    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await client.execute({
      sql: `
        UPDATE users 
        SET password_hash = ?, 
            reset_password_token = NULL, 
            reset_password_expires = NULL, 
            updated_at = ? 
        WHERE id = ?
      `,
      args: [hashedPassword, new Date().toISOString(), userId],
    });

    return NextResponse.json({ success: true, message: "Password has been reset successfully." });
  } catch (err) {
    console.error("Token error:", err);
    return NextResponse.json({ success: false, message: "Invalid or expired token." }, { status: 400 });
  }
}
