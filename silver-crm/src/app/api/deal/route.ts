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
      customerName,
      amount,
      productName,
      emailAddress,
      address,
      date,
      status = 'New',
      contactNumber,
      gstNumber,
      endDate,
      notes = '',
      isActive = true
    } = await req.json();

    // Generate UUID for the deal
    const dealId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    // Execute the insert query
    const result = await client.execute({
      sql: `
        INSERT INTO deals (
          id, company_name, customer_name, contact_number,
          email_address, address, product_name, amount,
          gst_number, status, date, end_date,
          notes, is_active, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `,
      args: [
        dealId,
        companyName,
        customerName,
        contactNumber,
        emailAddress,
        address,
        productName,
        amount,
        gstNumber,
        status,
        date,
        endDate,
        notes,
        isActive ? 1 : 0, // Convert boolean to integer
        createdAt,
        updatedAt
      ]
    });

    // Fetch the newly created deal
    const { rows } = await client.execute({
      sql: 'SELECT * FROM deals WHERE id = ?',
      args: [dealId]
    });

    if (rows.length === 0) {
      throw new Error('Failed to retrieve created deal');
    }

    return NextResponse.json({
      success: true,
      message: 'deal created successfully',
      data: {
        id: rows[0].id,
        companyName: rows[0].company_name,
        customerName: rows[0].customer_name,
        contactNumber: rows[0].contact_number,
        emailAddress: rows[0].email_address,
        address: rows[0].address,
        productName: rows[0].product_name,
        amount: rows[0].amount,
        gstNumber: rows[0].gst_number,
        status: rows[0].status,
        date: rows[0].date,
        endDate: rows[0].end_date,
        notes: rows[0].notes,
        isActive: Boolean(rows[0].is_active), // Convert back to boolean
        createdAt: rows[0].created_at,
        updatedAt: rows[0].updated_at
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await client.execute({
      sql: "SELECT * FROM deals ORDER BY created_at DESC",
      args: []
    });

    const deals = result.rows.map(row => ({
      id: row.id,
      companyName: row.company_name,
      customerName: row.customer_name,
      contactNumber: row.contact_number,
      emailAddress: row.email_address,
      address: row.address,
      productName: row.product_name,
      amount: row.amount,
      gstNumber: row.gst_number,
      status: row.status,
      date: row.date,
      endDate: row.end_date,
      notes: row.notes,
      isActive: Boolean(row.is_active), // Convert integer to boolean
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    return NextResponse.json({
      success: true,
      data: deals
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching deals:', error);
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
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({
        success: false,
        message: "deal ID is required",
      }, { status: 400 });
    }

    const body = await req.json();

    const {
      companyName,
      customerName,
      amount,
      productName,
      emailAddress,
      address,
      date,
      status,
      contactNumber,
      gstNumber,
      endDate,
      notes,
      isActive,
    } = body;

    const updatedAt = new Date().toISOString();

    await client.execute({
      sql: `
        UPDATE deals SET
          company_name = ?,
          customer_name = ?,
          contact_number = ?,
          email_address = ?,
          address = ?,
          product_name = ?,
          amount = ?,
          gst_number = ?,
          status = ?,
          date = ?,
          end_date = ?,
          notes = ?,
          is_active = ?,
          updated_at = ?
        WHERE id = ?
      `,
      args: [
        companyName,
        customerName,
        contactNumber,
        emailAddress,
        address,
        productName,
        amount,
        gstNumber,
        status,
        date,
        endDate,
        notes,
        isActive ? 1 : 0,
        updatedAt,
        id,
      ],
    });

    return NextResponse.json({
      success: true,
      message: "deal updated successfully",
      data: {
        id,
        companyName,
        customerName,
        contactNumber,
        emailAddress,
        address,
        productName,
        amount,
        gstNumber,
        status,
        date,
        endDate,
        notes,
        isActive,
        updatedAt,
      },
    }, { status: 200 });

  } catch (error) {
    console.error("Error updating deal:", error);
    return NextResponse.json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
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
        message: "deal ID is required",
      }, { status: 400 });
    }

    await client.execute({
      sql: "DELETE FROM deals WHERE id = ?",
      args: [id]
    });

    return NextResponse.json({
      success: true,
      message: "deal deleted successfully",
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error deleting deal:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete deal",
      error: error.message
    }, { status: 500 });
  }
}

