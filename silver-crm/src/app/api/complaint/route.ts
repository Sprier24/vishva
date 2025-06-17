import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";


const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const {
      companyName,
      complainerName,
      contactNumber,
      emailAddress,
      subject,
      date,
      caseStatus = 'Pending',
      priority = 'Medium',
      caseOrigin,
    } = await req.json();

    // Generate UUID for the complaint
    const complaintId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    // Execute the insert query
    const result = await client.execute({
      sql: `
        INSERT INTO complaints (
          id, company_name, complainer_name, contact_number,
          email_address, subject, date, case_status,
          priority, case_origin, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `,
      args: [
        complaintId,
        companyName,
        complainerName,
        contactNumber,
        emailAddress,
        subject,
        date || createdAt,
        caseStatus,
        priority,
        caseOrigin,
        createdAt,
        updatedAt
      ]
    });

    // Fetch the newly created complaint to return it
    const { rows } = await client.execute({
      sql: 'SELECT * FROM complaints WHERE id = ?',
      args: [complaintId]
    });

    if (rows.length === 0) {
      throw new Error('Failed to retrieve created complaint');
    }

    return NextResponse.json({
      success: true,
      message: 'Complaint created successfully',
      complaint: {
        id: rows[0].id,
        companyName: rows[0].company_name,
        complainerName: rows[0].complainer_name,
        contactNumber: rows[0].contact_number,
        emailAddress: rows[0].email_address,
        subject: rows[0].subject,
        date: rows[0].date,
        caseStatus: rows[0].case_status,
        priority: rows[0].priority,
        caseOrigin: rows[0].case_origin,
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at,
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating complaint:', error);
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
      sql: "SELECT * FROM  complaints ORDER BY created_at DESC",
      args: [],
    });

    const complaints = result.rows.map((row) => ({
      _id: row.id, // Changed to match component expectation
      companyName: row.company_name,
      complainerName: row.complainer_name,
      contactNumber: row.contact_number,
      emailAddress: row.email_address,
      subject: row.subject,
      date: row.date,
      caseStatus: row.case_status,
      priority: row.priority,
      caseOrigin: row.case_origin,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({
      success: true,
      message: "Complaints fetched successfully",
      data: complaints,
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching accounts:", error);
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
        message: "Complaint ID is required",
      }, { status: 400 });
    }

    const body = await req.json();
    const {
      companyName,
      complainerName,
      contactNumber,
      emailAddress,
      subject,
      date,
      caseStatus,
      priority,
      caseOrigin,
    } = body;

    const updatedAt = new Date().toISOString();

    await client.execute({
      sql: `
    UPDATE complaints SET
      company_name = ?,
      complainer_name = ?,
      contact_number = ?,
      email_address = ?,
      subject = ?,
      date = ?,
      case_status = ?,
      priority = ?,
      case_origin = ?,
      updated_at = ?
    WHERE id = ?
  `,
      args: [
        companyName,
        complainerName,
        contactNumber,
        emailAddress,
        subject,
        date,
        caseStatus,
        priority,
        caseOrigin,
        updatedAt,
        id,
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Complaint updated successfully",
      data: {
        id,
        companyName,
        complainerName,
        contactNumber,
        emailAddress,
        subject,
        date,
        caseStatus,
        priority,
        caseOrigin,
        updatedAt
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
        message: "Complaint ID is required",
      }, { status: 400 });
    }

    await client.execute({
      sql: "DELETE FROM complaints WHERE id = ?",
      args: [id]
    });

    return NextResponse.json({
      success: true,
      message: "Complaint deleted successfully",
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error deleting complaint:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete complaint",
      error: error.message
    }, { status: 500 });
  }
}