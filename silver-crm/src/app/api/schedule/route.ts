import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";


const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const {
      subject,
      assignedUser,
      customer,
      location,
      status = 'Scheduled',
      eventType = 'Meeting',
      priority = 'Medium',
      date,
      recurrence = 'Daily',
      description,
    } = await req.json();

    // Generate UUID for the complaint
    const scheduleId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    // Execute the insert query
    const result = await client.execute({
      sql: `
        INSERT INTO scheduledevents (
          id, subject, assigned_user, customer, location, status, event_type, priority, date, recurrence, description, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `,
      args: [
        scheduleId,
        subject,
        assignedUser,
        customer,
        location,
        status,
        eventType,
        priority,
        date || createdAt, 
        recurrence,
        description || '', 
        createdAt,
        updatedAt
      ]
    });

    // Fetch the newly created complaint to return it
    const { rows } = await client.execute({
      sql: 'SELECT * FROM scheduledevents WHERE id = ?',
      args: [scheduleId]
    });

    if (rows.length === 0) {
      throw new Error('Failed to retrieve created scheduleEvent');
    }

    return NextResponse.json({
      success: true,
      message: 'Schedule created successfully',
      scheduleEvent: {
        id: rows[0].id,
        subject: rows[0].subject,
        assignedUser: rows[0].assigned_user,
        customer: rows[0].customer,
        location: rows[0].location,
        status: rows[0].status,
        eventType: rows[0].event_type,
        priority: rows[0].priority,
        date: rows[0].date,
        recurrence: rows[0].recurrence,
        description: rows[0].description,
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating schedule event:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}


export async function GET() {
  try {
    const result = await client.execute({
      sql: "SELECT * FROM scheduledevents ORDER BY created_at DESC",
      args: [],
    });

    const scheduleEvents = result.rows.map((row) => ({
      _id: row.id, // Changed to match component expectation
      subject: row.subject,
      assignedUser: row.assigned_user,
      customer: row.customer,
      location: row.location,
      status: row.status,
      eventType: row.event_type,
      priority: row.priority,
      date: row.date,
      recurrence: row.recurrence,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({
      success: true,
      message: "Schedule events fetched successfully",
      data: scheduleEvents,
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching schedule events:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch accounts",
      error: error.message,
    }, { status: 500 });
  }
}


export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({
        success: false,
        message: "Schedule ID is required",
      }, { status: 400 });
    }

    const body = await req.json();
    const {
      subject,
      assignedUser,
      customer,
      location,
      status,
      eventType,
      priority,
      date,
      recurrence,
      description,
    } = body;

    const updatedAt = new Date().toISOString();

    await client.execute({
      sql: `
   UPDATE scheduledevents SET
  assigned_user = ?,
  customer = ?,
  location = ?,
  status = ?,
  event_type = ?,
  priority = ?,
  date = ?,
  recurrence = ?,
  description = ?,
  updated_at = ?
WHERE id = ?
`,
     args: [
  assignedUser,
  customer,
  location,
  status,
  eventType,
  priority,
  date,
  recurrence,
  description,
  updatedAt,
  id,
],

    });

    return NextResponse.json({
      success: true,
      message: "Complaint updated successfully",
      data: {
        id,
        subject,
        assignedUser,
        customer,
        location,
        status,
        eventType,
        priority,
        date,
        recurrence,
        description


      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error updating account:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to update account",
      error: error.message
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
        message: "Schedule ID is required",
      }, { status: 400 });
    }

    await client.execute({
      sql: "DELETE FROM scheduledevents WHERE id = ?",
      args: [id]
    });

    return NextResponse.json({
      success: true,
      message: "Schedule deleted successfully",
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete schedule",
      error: error.message
    }, { status: 500 });
  }
}