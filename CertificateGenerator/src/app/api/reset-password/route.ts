import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Initialize the client for the database
const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Adjusted POST function with Promise-based params
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    // Await the promise to get the token
    const { token } = await params; // This will resolve the promise
    const { password } = await request.json();

    // Decode the JWT token to get user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: number };

    // Query the user from the database
    const result = await client.execute({
      sql: `SELECT * FROM users WHERE id = ?`,
      args: [decoded.id],
    });

    // Check if user exists and token is valid
    const user = result.rows[0];
    if (
      !user ||
      user.reset_password_token !== token ||
      !user.reset_password_expires ||
      Number(user.reset_password_expires) < Date.now()
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update the user's password and clear reset-related fields
    await client.execute({
      sql: `UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?`,
      args: [hashedPassword, user.id],
    });

    // Return a success response
    return NextResponse.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
