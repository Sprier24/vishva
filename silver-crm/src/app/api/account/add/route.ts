import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
// Update your POST and GET endpoints to use consistent field names
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      accountHolderName,
      accountNumber,
      bankName,
      accountType,
      IFSCCode,
      UpiId,
    } = body;

    const id = nanoid();
    const createdAt = new Date().toISOString();

    await client.execute({
      sql: `
        INSERT INTO accounts (
          id, account_holder_name, account_number, bank_name,
          account_type, ifsc_code, upi_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        accountHolderName,
        accountNumber,
        bankName,
        accountType,
        IFSCCode,
        UpiId,
        createdAt
      ]
    });

    return NextResponse.json({
      success: true,
      message: "Account added successfully",
      data: {
        id,
        accountHolderName,
        accountNumber,
        bankName,
        accountType,
        IFSCCode,
        UpiId,
        createdAt
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding account:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to add account",
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const result = await client.execute({
      sql: "SELECT * FROM accounts ORDER BY created_at DESC",
      args: [],
    });

    const accounts = result.rows.map((row) => ({
      _id: row.id, // Changed to match component expectation
      accountHolderName: row.account_holder_name,
      accountNumber: row.account_number,
      bankName: row.bank_name,
      accountType: row.account_type,
      IFSCCode: row.ifsc_code,
      UpiId: row.upi_id,
      createdAt: row.created_at,
    }));

    return NextResponse.json({
      success: true,
      message: "Accounts fetched successfully",
      data: accounts,
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
        message: "Account ID is required",
      }, { status: 400 });
    }

    const body = await req.json();
    const {
      accountHolderName,
      accountNumber,
      bankName,
      accountType,
      IFSCCode,
      UpiId,
    } = body;

    const updatedAt = new Date().toISOString();

    await client.execute({
      sql: `
    UPDATE accounts SET
      account_holder_name = ?,
      account_number = ?,
      bank_name = ?,
      account_type = ?,
      ifsc_code = ?,
      upi_id = ?,
      updated_at = ?
    WHERE id = ?
  `,
      args: [
        accountHolderName,
        accountNumber,
        bankName,
        accountType,
        IFSCCode,
        UpiId,
        updatedAt,
        id,
      ],
    });


    return NextResponse.json({
      success: true,
      message: "Account updated successfully",
      data: {
        id,
        accountHolderName,
        accountNumber,
        bankName,
        accountType,
        IFSCCode,
        UpiId,
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
        message: "Account ID is required",
      }, { status: 400 });
    }

    await client.execute({
      sql: "DELETE FROM accounts WHERE id = ?",
      args: [id]
    });

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error deleting account:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to delete account",
      error: error.message
    }, { status: 500 });
  }
}

