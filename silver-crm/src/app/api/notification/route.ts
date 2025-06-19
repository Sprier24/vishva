// app/lib/actions/notifications/storeNotification.ts
import { createClient } from "@libsql/client";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});


export const storeNotification = async (notificationData: {
  title: string;
  message: string;
  scheduledAt?: string; // ISO date string
}) => {
  try {
    const id = uuidv4();

    await client.execute({
      sql: `
        INSERT INTO notifications (id, title, message, scheduled_at)
        VALUES (?, ?, ?, ?)
      `,
      args: [
        id,
        notificationData.title,
        notificationData.message,
        notificationData.scheduledAt ?? null,
      ],
    });

    console.log("✅ Notification stored successfully:", notificationData.title);
  } catch (error) {
    console.error("❌ Error storing notification:", error);
  }
};


export async function GET() {
  try {
    const result = await client.execute({
      sql: "SELECT * FROM notifications ORDER BY created_at DESC",
      args: [],
    });

    const notifications = result.rows.map((row) => ({
      _id: row.id,
      title: row.title,
      message: row.message,
      createdAt: row.created_at,
      type: "calendar", // or "reminder" based on your schema
    }));

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch notifications",
    }, { status: 500 });
  }
}


