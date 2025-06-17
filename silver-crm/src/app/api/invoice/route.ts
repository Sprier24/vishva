import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { v4 as uuidv4 } from "uuid"; // for unique ID generation

const client = createClient({
    url: process.env.TURSO_CONNECTION_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
});

function toNormalizedNumber(value: unknown): number {
    return Number(value ?? 0) / 100;
}

// Sanitize helper function
function safeNumber(value: any): number {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}


// POST: Create a new invoice
export async function POST(req: Request) {
    try {
        const {
            companyName,
            customerName,
            contactNumber,
            emailAddress,
            address,
            gstNumber,
            productName,
            amount,
            discount,
            gstRate,
            date,
            endDate,
            paidAmount,
            status = "Unpaid",
        } = await req.json();

        if (!companyName || !customerName || !contactNumber || !productName) {
            return NextResponse.json(
                { message: "Required fields are missing" },
                { status: 400 }
            );
        }

        // Convert values to integer (cents) to avoid floating point issues
        const parsedAmount = Math.round(safeNumber(amount) * 100);
        const parsedDiscount = Math.round(safeNumber(discount) * 100);
        const parsedGstRate = Math.round(safeNumber(gstRate) * 100);
        const parsedPaidAmount = Math.round(safeNumber(paidAmount) * 100);

        const discountedAmount =
            parsedAmount - (parsedAmount * parsedDiscount) / 10000;
        const gstAmount = (discountedAmount * parsedGstRate) / 10000;
        const totalWithoutGst = discountedAmount;
        const totalWithGst = totalWithoutGst + gstAmount;
        const remainingAmount = totalWithGst - parsedPaidAmount;

        const id = uuidv4();
        const createdAt = new Date().toISOString();
        const updatedAt = createdAt;

        // Execute raw SQL
        await client.execute({
            sql: `
        INSERT INTO invoices (
          id, company_name, customer_name, contact_number, email_address,
          address, gst_number, product_name, amount, discount, gst_rate,
          status, date, end_date, total_without_gst, total_with_gst,
          paid_amount, remaining_amount, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
            args: [
                id,
                companyName ?? "",
                customerName ?? "",
                contactNumber ?? "",
                emailAddress ?? "",
                address ?? "",
                gstNumber ?? "",
                productName ?? "",
                parsedAmount,
                parsedDiscount,
                parsedGstRate,
                ["Unpaid", "Paid", "Pending"].includes(status) ? status : "Unpaid",
                date ?? new Date().toISOString(),
                endDate ?? new Date().toISOString(),
                totalWithoutGst,
                totalWithGst,
                parsedPaidAmount,
                remainingAmount,
                createdAt,
                updatedAt,
            ],

        });

        return NextResponse.json(
            {
                message: "Invoice created successfully",
                data: {
                    id,
                    companyName,
                    customerName,
                    contactNumber,
                    emailAddress,
                    address,
                    gstNumber,
                    productName,
                    amount: parsedAmount / 100,
                    discount: parsedDiscount / 100,
                    gstRate: parsedGstRate / 100,
                    totalWithoutGst: totalWithoutGst / 100,
                    totalWithGst: totalWithGst / 100,
                    paidAmount: parsedPaidAmount / 100,
                    remainingAmount: remainingAmount / 100,
                    date,
                    endDate,
                    status,
                    createdAt,
                    updatedAt,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating invoice:", error);
        return NextResponse.json(
            {
                message: "Failed to create invoice",
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}


// GET: Fetch all invoices
export async function GET() {
  try {
    const result = await client.execute({
      sql: `SELECT * FROM invoices ORDER BY created_at DESC`,
      args: [],
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

    return NextResponse.json({ data: invoices }, { status: 200 });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json(
      {
        message: "Failed to fetch invoices",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}


export async function PUT(req: Request) {
  try {
        const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const {
      companyName,
      customerName,
      contactNumber,
      emailAddress,
      address,
      gstNumber,
      productName,
      amount,
      discount,
      gstRate,
      date,
      endDate,
      paidAmount,
      status,
    } = await req.json();

    if (!id) {
      return NextResponse.json({ message: "Invoice ID is required" }, { status: 400 });
    }

    // Sanitize numeric values
    const parsedAmount = Math.round(safeNumber(amount) * 100);
    const parsedDiscount = Math.round(safeNumber(discount) * 100);
    const parsedGstRate = Math.round(safeNumber(gstRate ) * 100);
    const parsedPaidAmount = Math.round(safeNumber(paidAmount) * 100);

    // Recalculate totals
   const discountedAmount = parsedAmount - (parsedAmount * parsedDiscount) / 10000;
const gstAmount = parsedGstRate > 0 ? (discountedAmount * parsedGstRate) / 10000 : 0;
const totalWithoutGst = discountedAmount;
const totalWithGst = totalWithoutGst + gstAmount;
const remainingAmount = totalWithGst - parsedPaidAmount;


    const updatedAt = new Date().toISOString();

    await client.execute({
      sql: `
        UPDATE invoices SET
          company_name = ?,
          customer_name = ?,
          contact_number = ?,
          email_address = ?,
          address = ?,
          gst_number = ?,
          product_name = ?,
          amount = ?,
          discount = ?,
          gst_rate = ?,
          status = ?,
          date = ?,
          end_date = ?,
          total_without_gst = ?,
          total_with_gst = ?,
          paid_amount = ?,
          remaining_amount = ?,
          updated_at = ?
        WHERE id = ?
      `,
      args: [
        companyName ?? "",
        customerName ?? "",
        contactNumber ?? "",
        emailAddress ?? "",
        address ?? "",
        gstNumber ?? "",
        productName ?? "",
        parsedAmount,
        parsedDiscount,
        parsedGstRate,
        ["Unpaid", "Paid", "Pending"].includes(status) ? status : "Unpaid",
        date ?? new Date().toISOString(),
        endDate ?? new Date().toISOString(),
        totalWithoutGst,
        totalWithGst,
        parsedPaidAmount,
        remainingAmount,
        updatedAt,
        id,
      ],
    });

    return NextResponse.json({ message: "Invoice updated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json(
      {
        message: "Failed to update invoice",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ message: "Invoice ID is required" }, { status: 400 });
    }

    await client.execute({
      sql: `DELETE FROM invoices WHERE id = ?`,
      args: [id],
    });

    return NextResponse.json({ message: "Invoice deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json(
      {
        message: "Failed to delete invoice",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
