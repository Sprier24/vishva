import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

function safeNumber(value: any): number {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}

export async function GET() {
  try {
    const result = await client.execute({
      sql: `
        SELECT * FROM invoices 
        WHERE status = ? 
        ORDER BY datetime(created_at) DESC
      `,
      args: ["Unpaid"],
    });

    const invoices = result.rows.map((row) => ({
      id: row.id,
      companyName: row.company_name,
      customerName: row.customer_name,
      contactNumber: row.contact_number,
      emailAddress: row.email_address,
      address: row.address,
      gstNumber: row.gst_number,
      productName: row.product_name,
      amount: safeNumber(row.amount) / 100,
      discount: safeNumber(row.discount) / 100,
      gstRate: safeNumber(row.gst_rate) / 100,
      status: row.status,
      date: row.date,
      endDate: row.end_date,
      totalWithoutGst: safeNumber(row.total_without_gst) / 100,
      totalWithGst: safeNumber(row.total_with_gst) / 100,
      paidAmount: safeNumber(row.paid_amount) / 100,
      remainingAmount: safeNumber(row.remaining_amount) / 100,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
    return NextResponse.json({ data : invoices }, { status: 200 });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      { message: "Failed to fetch unpaid invoices." },
      { status: 500 }
    );
  }
}
