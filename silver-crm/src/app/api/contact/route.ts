import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

const client = createClient({
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            companyName,
            customerName,
            contactNumber,
            emailAddress,
            address,
            gstNumber,
            description,
        } = body;
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const updatedAt = new Date().toISOString();
        await client.execute({
            sql: `
                INSERT INTO contacts (
                    id, company_name, customer_name, contact_number,
                    email_address, address, gst_number, description,
                    created_at
                                    ) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?)
                                                    `,
        args: [
            id,
            companyName,
            customerName,
            contactNumber,
            emailAddress,
            address,
            gstNumber,
            description,
            createdAt,
        ],
    });

        return NextResponse.json(
            {
                success: true,
                message: "Contact added successfully",
                data: {
                    id,
                    companyName,
                    customerName,
                    contactNumber,
                    emailAddress,
                    address,
                    gstNumber,
                    description,
                    createdAt,
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error adding contact:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to add contact",
                error: error.message,
            },
            { status: 500 }
        );
    }

    }

 export async function GET() {
    try {
        const result = await client.execute({
            sql: "SELECT * FROM contacts  ORDER BY created_at DESC",
            args: [],
        });

        const contacts = result.rows.map((row) => ({
            id: row.id,
            companyName: row.company_name,
            customerName: row.customer_name,
            contactNumber: row.contact_number,
            emailAddress: row.email_address,
            address: row.address,
            gstNumber: row.gst_number,
            description: row.description,
            createdAt: row.created_at,
        }));
        return NextResponse.json(
            {
                success: true,
                data: contacts,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error fetching contacts:", error);
        return NextResponse.json(
            {
                success: false,
                message: "Failed to fetch contacts",
                error: error.message,
            },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Contact ID is required'
      }, { status: 400 })
    }

    const body = await req.json()
    const { companyName, customerName, contactNumber, emailAddress, address, gstNumber, description } = body
    const updatedAt = new Date().toISOString()

    await client.execute({
      sql: `
        UPDATE contacts SET
          company_name = ?,
          customer_name = ?,
          contact_number = ?,
          email_address = ?,
          address = ?,
          gst_number = ?,
          description = ?,
          updated_at = ?
        WHERE id = ?
      `,
      args: [
        companyName, customerName, contactNumber, emailAddress,
        address, gstNumber, description, updatedAt, id
      ]
    })

    return NextResponse.json({
      success: true,
      message: 'Contact updated successfully',
      data: { id, ...body, updatedAt }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Failed to update contact',
      error: error.message
    }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        message: 'Contact ID is required'
      }, { status: 400 })
    }

    await client.execute({
      sql: 'DELETE FROM contacts WHERE id = ?',
      args: [id]
    })

    return NextResponse.json({
      success: true,
      message: 'Contact deleted successfully'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: 'Failed to delete contact',
      error: error.message
    }, { status: 500 })
  }
}