// app/lib/actions/notifications/storeNotification.ts
import { createClient } from "@libsql/client";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});


export const storeNotification = async (notificationData: {
  title: string;
  message: string;
  type:string;
  scheduledAt?: string;
  createdAt?: string;
  relatedEventId : string;
  isSent : string;
}) => {
  try {
    const id = uuidv4();
    const createdAt = notificationData.createdAt || new Date().toISOString();

    await client.execute({
      sql: `
        INSERT INTO notifications (id, title, message, type, created_at, scheduled_at, related_event_id, is_sent)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id,
        notificationData.title,
        notificationData.message,
        notificationData.type || 'reminder',
        createdAt,
        notificationData.scheduledAt || createdAt, // Use current time if not scheduled
        notificationData.relatedEventId || null,
        notificationData.isSent || false
      ],
    });
    console.log("✅ Notification stored successfully:", notificationData.title);
  } catch (error) {
    console.error("❌ Error storing notification:", error);
  }
};


// In your API route (/api/notification)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date'); // IST date in YYYY-MM-DD format
    const type = searchParams.get('type'); // Optional filter
    
    let query = `
      SELECT n.*, 
             c.event as event_title,
             i.customer_name as invoice_customer,
             i.remaining_amount as invoice_amount,
             i.product_name as invoice_product
      FROM notifications n
      LEFT JOIN calendar c ON n.related_event_id = c.id
      LEFT JOIN invoices i ON n.related_event_id = i.id
      WHERE 1=1
    `;
    
    const args = [];
    
    if (type) {
      query += ` AND n.type = ?`;
      args.push(type);
    }
    
    if (date) {
      // Convert IST date to UTC date range for database comparison
      const startDate = new Date(`${date}T00:00:00+05:30`);
      const endDate = new Date(`${date}T23:59:59+05:30`);
      
      query += ` AND n.scheduled_at BETWEEN ? AND ?`;
      args.push(startDate.toISOString(), endDate.toISOString());
    }
    
    query += ` ORDER BY n.created_at DESC`;
    
    const result = await client.execute({ sql: query, args });
    
    return NextResponse.json({
      success: true,
      data: result.rows.map(row => {
        const baseNotification = {
          _id: row.id,
          title: row.title,
          message: row.message,
          type: row.type,
          createdAt: row.created_at,
          scheduledAt: row.scheduled_at,
          isRead: row.is_read || false,
          error: false
        };
        
        // Add type-specific data
        if (row.type === 'calendar') {
          return {
            ...baseNotification,
            relatedEvent: row.event_title
          };
        } else if (row.type === 'invoice') {
          return {
            ...baseNotification,
            invoiceDetails: {
              customerName: row.invoice_customer,
              amount: row.invoice_amount,
              productName: row.invoice_product
            }
          };
        }
        
        return baseNotification;
      })
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}


export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const deleteAll = searchParams.get("deleteAll") === "true";

    if (!id && !deleteAll) {
      return NextResponse.json({
        success: false,
        message: "Either Notification ID or deleteAll flag is required",
      }, { status: 400 });
    }

    if (deleteAll) {
      // Delete all notifications logic
      await client.execute({
        sql: "DELETE FROM notifications",
        args : []
      });

      return NextResponse.json({
        success: true,
        message: "All notifications deleted successfully",
      });
    }

    if (id) {
      // Single notification deletion logic
      await client.execute({
        sql: "DELETE FROM notifications WHERE id = ?",
        args: [id],
      });

      return NextResponse.json({
        success: true,
        message: "Notification deleted successfully",
      });
    }

  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
