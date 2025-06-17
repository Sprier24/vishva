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
      name,
      relatedTo,
      date,
      endDate,
      status = 'Pending',
      priority = 'Medium',
      assignedTo,
    } = await req.json();

    // Generate UUID for the task
    const taskId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    // Format dates (fallback to current time if not provided)
    const formattedDate = date ? new Date(date).toISOString() : createdAt;
const formattedEndDate = endDate ? new Date(endDate).toISOString() : null;

    // Execute the insert query with ALL parameters in correct order
    const result = await client.execute({
     sql: `
    INSERT INTO tasks (
      id, subject, name, related_to, date, end_date, 
      status, priority, assigned_to, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `,
   args : [
  taskId,
  subject ?? null,
  name ?? null,
  relatedTo ?? null,
  formattedDate,
  formattedEndDate,
  status ?? "Pending",
  priority ?? "Medium",
  assignedTo ?? null,
  createdAt,
  updatedAt,
]
    });

    // Fetch the newly created task to return it
    const { rows } = await client.execute({
      sql: 'SELECT * FROM tasks WHERE id = ?',
      args: [taskId]
    });

    if (rows.length === 0) {
      throw new Error('Failed to retrieve created task');
    }

    return NextResponse.json({
      success: true,
      message: 'Task created successfully',
      task: {
        id: rows[0].id,
        subject: rows[0].subject,
        name: rows[0].name,
        relatedTo: rows[0].related_to,
        date: rows[0].date,
        endDate: rows[0].end_date,
        status: rows[0].status,
        priority: rows[0].priority,
        assignedTo: rows[0].assigned_to,
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating task:', error);
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
      sql: "SELECT * FROM  tasks ORDER BY created_at DESC",
      args: [],
    });

    const tasks = result.rows.map((row) => ({
      _id: row.id, // Changed to match component expectation
      subject: row.subject,
      name: row.name,
      relatedTo: row.related_to,
      date: row.date,
      endDate: row.end_date,
      status: row.status,
      priority: row.priority,
      assignedTo: row.assigned_to,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error: any) {
    console.error("Error fetching tasks:", error);
    }
};



export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({
        success: false,
        message: "Task ID is required",
      }, { status: 400 });
    }

    const body = await req.json();
    const {
      subject,
      name,
      relatedTo,
      date,
      endDate,
      status = 'Pending',
      priority = 'Medium',
      assignedTo,
    } = body;

    const updatedAt = new Date().toISOString();

    await client.execute({
      sql: `
    UPDATE tasks SET
        subject = ?,
        name = ?,   
        related_to = ?,
        date = ?,
        end_date = ?,
        status = ?,
        priority = ?,
        assigned_to = ?,
        updated_at = ?
    WHERE id = ?
  `,
      args: [
        subject,
        name,
        relatedTo,
        date,
        endDate,
        status,
        priority,
        assignedTo,
        updatedAt,
        id,
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
        priority,
        assignedTo,
        updatedAt,
        id,
    });
  } catch (error: any) {
    console.error("Error updating task:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to update task",
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
        message: "Task ID is required",
      }, { status: 400 });
    }

    await client.execute({
      sql: "DELETE FROM tasks WHERE id = ?",
      args: [id]
    });

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error deleting task:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete task",
      error: error.message
    }, { status: 500 });
  }
}

