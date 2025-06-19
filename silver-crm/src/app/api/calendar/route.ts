import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { v4 as uuidv4 } from "uuid";
import { Server } from "socket.io";
import cron from "node-cron";


const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const remindEvent = (io: Server) => {
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    // Convert UTC now to IST
    const istNow = new Date(now.getTime() + (5 * 60 + 30) * 60000); // UTC + 5:30
    const istDateOnly = istNow.toISOString().split("T")[0]; // "YYYY-MM-DD"

    try {
      // Fetch all unsent calendar notifications
      const result = await client.execute({
        sql: `
          SELECT n.*, c.event as event_title 
          FROM notifications n
          JOIN calendar c ON n.related_event_id = c.id
          WHERE n.is_sent = false AND n.type = 'calendar'
        `,
        args: [],
      });

      // Filter notifications for today's IST date only
      const notifications = result.rows.filter((notification) => {
        if (!notification.scheduled_at) return false;
        const scheduledAt = new Date(notification.scheduled_at as string);
        const scheduledIST = new Date(scheduledAt.getTime() + (5 * 60 + 30) * 60000);
        const scheduledDateOnly = scheduledIST.toISOString().split("T")[0];
        return scheduledDateOnly === istDateOnly;
      });

      if (!notifications.length) {
        console.log("No calendar reminders to send at this minute (IST date check)");
        return;
      }

      for (const notification of notifications) {
        const { id, event_title, related_event_id, message } = notification;

        io.emit("calenderreminder", {
          id: related_event_id,
          event: event_title,
          followUpDate: istDateOnly,
        });

        io.emit("notification", {
          _id: id,
          title: `Event Reminder: ${event_title}`,
          createdAt: istNow.toISOString(),
          message: message,
          type: "calendar",
        });

        // Mark as sent
        await client.execute({
          sql: `UPDATE notifications SET is_sent = true WHERE id = ?`,
          args: [id],
        });

        console.log(`📅 Notification sent for event "${event_title}" on ${istDateOnly}`);
      }
    } catch (err) {
      console.error("❌ Error executing calendar reminder:", err);
    }
  });
};



export async function POST(req: Request) {
  try {
    const { event, date, calendarId } = await req.json();
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    await client.execute({
      sql: `INSERT INTO calendar (id, event, date, calendar_id, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [id, event, date, calendarId, createdAt, updatedAt]
    });

    // Insert notification
    await client.execute({
      sql: `INSERT INTO notifications 
            (id, title, message, type, created_at, scheduled_at, related_event_id, is_sent) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        uuidv4(),
        `Upcoming Event: ${event}`,
        `Your event "${event}" is scheduled for ${date}.`,
        'calendar',
        createdAt,
        date, // exact 12:00 AM IST in UTC
        id,
        false
      ],
    });

    return NextResponse.json({
      success: true,
      message: 'Event created and notification scheduled',
      data: { _id: id, event, date, calendarId, createdAt, updatedAt }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


// Handle GET (list)
export async function GET() {
  try {
    const result = await client.execute({
      sql: "SELECT * FROM calendar ORDER BY created_at DESC",
      args: []
    });

    const events = result.rows.map(row => ({
      _id: row.id,
      event: row.event,
      date: row.date,
      calendarId: row.calendar_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return NextResponse.json({
      success: true,
      message: 'Events fetched',
      data: events
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Event ID is required'
      }, { status: 400 });
    }

    const body = await req.json();

    const { event, date, calendarId } = body;
    const updatedAt = new Date().toISOString();
    await client.execute({
      sql: `UPDATE calendar SET event = ?, date = ?, calendar_id = ?, updated_at = ? WHERE id = ?`,
      args: [event, date, calendarId, updatedAt, id]
    });
    return NextResponse.json({
      success: true,
      message: 'Event updated',
      data: { _id: id, event, date, calendarId, updatedAt }
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({
        success: false,
        message: "Lead ID is required",
      }, { status: 400 });
    }

    await client.execute({
      sql: "DELETE FROM leads WHERE id = ?",
      args: [id]
    });

    return NextResponse.json({
      success: true,
      message: "Lead deleted successfully",
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error deleting lead:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete lead",
      error: error.message
    }, { status: 500 });
  }
}
