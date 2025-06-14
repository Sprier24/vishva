// app/api/users/verify/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function POST(request: Request) {
  try {
    const { verificationCode } = await request.json();

    if (!verificationCode) {
      return NextResponse.json(
        { error: "Verification code is required" },
        { status: 400 }
      );
    }

    // Find user by verification code
    const result = await client.execute({
      sql: "SELECT * FROM users WHERE verification_code = ?",
      args: [verificationCode],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 404 }
      );
    }

    const user = result.rows[0] as any;

    // Mark user as verified
    await client.execute({
      sql: "UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?",
      args: [user.id],
    });

    return NextResponse.json(
      { 
        success: true,
        message: "Email verified successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      }
    );

  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}