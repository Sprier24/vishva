import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import { v4 as uuidv4 } from "uuid"; 
import { Server } from "socket.io";
import cron from "node-cron";
import nodemailer from "nodemailer";

// Import or define sendEmailReminder
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


// Email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const remindEvent = async ( io:Server) => {
 cron.schedule("* * * * *", async () => {
     const now = new Date();
 
   // Convert UTC now to IST
   const istNow = new Date(now.getTime() + (5 * 60 + 30) * 60000); // UTC + 5:30
   const istDateOnly = istNow.toISOString().split("T")[0]; // "YYYY-MM-DD"
   const todayIST = istDateOnly;

try {
    // Fetch owner details
    const ownerResult = await client.execute({
      sql: "SELECT * FROM owners LIMIT 1",
      args: [],
    });
    const owner = ownerResult.rows[0];

    if (!owner) {
      console.error("Owner details not found!");
      return;
    }

    // Fetch unpaid invoices
    const invoicesResult = await client.execute({
      sql: "SELECT * FROM invoices WHERE status = ?",
      args: ["Unpaid"],
    });
    const unpaidInvoices = invoicesResult.rows;

    if (!unpaidInvoices.length) {
      console.log('No unpaid invoices to remind');
      return;
    }

    for (const invoice of unpaidInvoices) {
      if (!invoice.date) {
        console.error(`Missing due date for invoice: ${invoice.id}`);
        continue;
      }

      const dueDate = new Date(invoice.date as string);
      if (isNaN(dueDate.getTime())) {
        console.error(`Invalid due date for invoice: ${invoice.id}`);
        continue;
      }

      const threeDaysBefore = new Date(dueDate);
      threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);

      const oneDayBefore = new Date(dueDate);
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);

      const reminderDateType = todayIST === threeDaysBefore.toISOString().split('T')[0]
        ? "3 Days Before"
        : todayIST === oneDayBefore.toISOString().split('T')[0]
          ? "1 Day Before"
          : todayIST === dueDate.toISOString().split('T')[0]
            ? "On Due Date"
            : null;

      if (reminderDateType) {
        console.log(`Reminder (${reminderDateType}): ${invoice.customer_name} has an unpaid invoice`);

        // Emit socket events
        io.emit('reminder', {
          id: invoice.id,
          customerName: invoice.customer_name,
          companyName: invoice.company_name,
          amount: invoice.remaining_amount,
          dueDate: dueDate.toISOString().split('T')[0],
          reminderType: reminderDateType,
        });

        // Create and store notification
        try {
          const notificationId = uuidv4();
          await client.execute({
            sql: `
              INSERT INTO notifications (
                id, title, message, type, 
                created_at, scheduled_at, 
                related_event_id, is_sent
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            args: [
              notificationId,
              `Invoice Reminder (${reminderDateType})`,
              `Customer ${invoice.customer_name} has an unpaid invoice of ₹${invoice.remaining_amount} for "${invoice.product_name}". Due date: ${dueDate.toISOString().split('T')[0]}.`,
              'invoice',
              new Date().toISOString(),
              dueDate.toISOString(),
              invoice.id,
              false
            ]
          });

          io.emit('notification', {
            _id: notificationId,
            title: `Invoice Reminder (${reminderDateType})`,
            message: `Customer ${invoice.customer_name} has an unpaid invoice of ₹${invoice.remaining_amount} for "${invoice.product_name}". Due date: ${dueDate.toISOString().split('T')[0]}.`,
            type: 'invoice',
            createdAt: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to store notification:', error);
        }

        // Send email directly
        try {
          const emailMessage = `
            <p>Dear ${invoice.customer_name},</p>
            <p>I hope this email finds you well. This is a gentle reminder <strong>(${reminderDateType})</strong> to pay your outstanding invoice of <strong>₹${invoice.remaining_amount}</strong>.</p>
            <p>We kindly request you to make the payment at your earliest convenience to avoid any inconvenience.</p>
            <p>Thank you for your prompt attention to this matter.</p>
            <p><strong>Best regards,</strong><br/>
            [${owner.company_name}]</p>
          `;

          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: invoice.email_address ?? "", // Ensure 'to' is a string
            subject: "Invoice Payment Reminder",
            html: emailMessage,
          };

          // Send email
          const info = await transporter.sendMail(mailOptions);
          console.log(`Email sent (${reminderDateType}) for invoice #${invoice.id}`);

          // Log email in database
          await client.execute({
            sql: `
              INSERT INTO email_logs (
                id, sender, recipient, subject, status, sent_at
              ) VALUES (?, ?, ?, ?, ?, ?)
            `,
            args: [
              uuidv4(),
              process.env.EMAIL_USER!,
              invoice.email_address,
              "Invoice Payment Reminder",
              "sent",
              new Date().toISOString()
            ]
          });
        } catch (emailError) {
          console.error(`Failed to send email for invoice #${invoice.id}:`, emailError);

          // Log failed email
          await client.execute({
            sql: `
              INSERT INTO email_logs (
                id, sender, recipient, subject, status, error, sent_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            args: [
              uuidv4(),
              process.env.EMAIL_USER!,
              invoice.email_address,
              "Invoice Payment Reminder",
              "failed",
              emailError instanceof Error ? emailError.message : String(emailError),
              new Date().toISOString()
            ]
          });
        }
      }
    }
  } catch (error) {
    console.error('Error executing remindEvent API:', error);
  } finally {
    // Close the transporter when done
    transporter.close();
  }
})
};


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

        // Create notification for unpaid invoices
        if (status === "Unpaid") {
            const notificationTitle = `New Unpaid Invoice: ${productName}`;
            const notificationMessage = `Invoice #${id.slice(0, 8)} for ${customerName} (${companyName}) - Amount: ₹${(totalWithGst / 100).toFixed(2)}`;
            
            await client.execute({
                sql: `
                    INSERT INTO notifications (
                        id, title, message, type, 
                        created_at, scheduled_at, 
                        related_event_id, is_sent
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `,
                args: [
                    uuidv4(),
                    notificationTitle,
                    notificationMessage,
                    'invoice', // notification type
                    createdAt,
                    endDate ?? date ?? new Date().toISOString(), // schedule for payment due date
                    id, // link to invoice
                    false // not sent yet
                ]
            });
            console.log("✅ Invoice notification created successfully");  
        }

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
