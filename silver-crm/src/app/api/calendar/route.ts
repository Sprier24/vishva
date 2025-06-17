import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";


const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

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

    return NextResponse.json({
      success: true,
      message: 'Event created',
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

    if(!id){
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
