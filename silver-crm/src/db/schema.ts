  // app/lib/db/schema.ts
  import { endOfDay } from "date-fns";
  import { sql } from 'drizzle-orm';
  import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
  import { assign } from "nodemailer/lib/shared";

  export const users = sqliteTable("users", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    password_hash: text("password_hash").notNull(),
    is_verified: integer("is_verified", { mode: "boolean" }).default(false),
    reset_password_token: text("reset_password_token"),
    reset_password_expires: text("reset_password_expires"),
    verification_code: text("verification_code"),
    verification_code_expires: text("verification_code_expires"),
    is_first_login: integer("is_first_login", { mode: "boolean" }).default(true),
    created_at: text("created_at").default(new Date().toISOString()),
    updated_at: text("updated_at").default(new Date().toISOString()),
  });


  export const owners = sqliteTable("owners", {
    id: text("id").primaryKey(),
    logo: text("logo"),
    companyName: text("company_name"),
    ownerName: text("owner_name"),
    contactNumber: text("contact_number"),
    emailAddress: text("email_address"),
    website: text("website"),

    documentType: text("document_type"), // Enum manually validated in backend
    documentNumber: text("document_number"),
    panNumber: text("pan_number"),
    companyType: text("company_type"),

    employeeSize: text("employee_size"), // Enum manually validated in backend
    businessRegistration: text("business_registration"), // Enum manually validated

    dataFilled: integer("data_filled", { mode: "boolean" }).default(false),
    gstNumber: text("gst_number"),

    createdAt: text("created_at").default(new Date().toISOString()),
    updatedAt: text("updated_at").default(new Date().toISOString()),
  });


  // app/lib/db/schema.ts
  export const accounts = sqliteTable("accounts", {
    id: text("id").primaryKey(),
    accountHolderName: text("account_holder_name").notNull(),
    accountType: text("account_type").notNull(), // Will store "Current", "Savings", "Other"
    accountNumber: text("account_number").notNull(),
    bankName: text("bank_name").notNull(),
    IFSCCode: text("ifsc_code").notNull(), // Changed to match component
    UpiId: text("upi_id").notNull(), // Changed to match component
    createdAt: text("created_at").default(new Date().toISOString()),
    updatedAt: text("updated_at").default(new Date().toISOString()),
  });


  // app/lib/db/schema.ts
  export const complaints = sqliteTable("complaints", {
    id: text("id").primaryKey(),
    companyName: text("company_name"),
    complainerName: text("complainer_name"),
    contactNumber: text("contact_number"),
    emailAddress: text("email_address"),
    subject: text("subject"),
    date: text("date"),
    caseStatus: text("case_status")
      .$type<"Pending" | "Resolved" | "InProgress">()
      .default("Pending"),
    priority: text("priority")
      .$type<"High" | "Medium" | "Low">()
      .default("Medium"),
    caseOrigin: text("case_origin"),
    createdAt: text("created_at").default(new Date().toISOString()),
    updatedAt: text("updated_at").default(new Date().toISOString()),
  });

  export const calendar = sqliteTable("calendar", {
    id: text("id").primaryKey(),
    date: text("date").notNull(),
    event: text("event").notNull(),
    calendarID: text("calendar_id").notNull(),
    createdAt: text("created_at").default(new Date().toISOString()),
    updatedAt: text("updated_at").default(new Date().toISOString()),
  });

  export const tasks = sqliteTable("tasks", {
    id: text("id").primaryKey(),
    subject: text("subject"),
    name: text("name"),
    relatedTo: text("related_to"), 
    date: text("date"),
    endDate: text("end_date"),
    status: text("status")
      .$type<"Pending" | "Resolved" | "InProgress">()
      .default("Pending"),
    priority: text("priority")
      .$type<"High" | "Medium" | "Low">()
      .default("Medium"),
    assignedTo: text("assigned_to"), 
    notes: text("notes").default(""),
    createdAt: text("created_at").default(new Date().toISOString()),
      updatedAt: text("updated_at").default(new Date().toISOString())
      });

      // app/lib/db/schema.ts
  export const leads = sqliteTable("leads", {
    id: text("id").primaryKey(),
    companyName: text("company_name").notNull(),
    customerName: text("customer_name").notNull(),
    contactNumber: text("contact_number"),
    emailAddress: text("email_address").notNull(),
    address: text("address").notNull(),
    productName: text("product_name").notNull(),
    amount: integer("amount").notNull(), // Using integer for monetary values
    gstNumber: text("gst_number"),
    status: text("status").$type<"New" | "Discussion" | "Demo" | "Proposal" | "Decided">(),
    date: text("date").notNull(),
    endDate: text("end_date"),
    notes: text("notes").default(""),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at").default(new Date().toISOString()),
    updatedAt: text("updated_at").default(new Date().toISOString()),
  });


  export const contacts = sqliteTable("contacts", () => ({
    id: text("id").primaryKey(),
    companyName: text("company_name").notNull(),
    customerName: text("customer_name").notNull(),
    contactNumber: text("contact_number").notNull(),
    emailAddress: text("email_address").notNull(),
    address: text("address").notNull(),
    gstNumber: text("gst_number"),
    description: text("description").default(""),
    createdAt: text("created_at").default(new Date().toISOString()),
    updatedAt: text("updated_at").default(new Date().toISOString()),
  }));

 export const invoices = sqliteTable("invoices", {
  id: text("id").primaryKey(),
  companyName: text("company_name").notNull(),
  customerName: text("customer_name").notNull(),
  contactNumber: text("contact_number").notNull(),
  emailAddress: text("email_address").notNull(),
  address: text("address").notNull(),
  gstNumber: text("gst_number"),
  productName: text("product_name").notNull(),
  amount: integer("amount").notNull(),
  discount: integer("discount").default(0),
  gstRate: integer("gst_rate").default(18),
  status: text("status").$type<"Unpaid" | "Paid" | "Pending">().default("Unpaid"),
  date: text("date").notNull(),
  endDate: text("end_date").notNull(),
  totalWithoutGst: integer("total_without_gst").default(0),
  totalWithGst: integer("total_with_gst").default(0),
  paidAmount: integer("paid_amount").default(0),
  remainingAmount: integer("remaining_amount").default(0),
  createdAt: text("created_at").default(new Date().toISOString()),
  updatedAt: text("updated_at").default(new Date().toISOString()),
});


  export const deals = sqliteTable("deals", {
    id: text("id").primaryKey(),
    companyName: text("company_name").notNull(),
    customerName: text("customer_name").notNull(),
    contactNumber: text("contact_number"),
    emailAddress: text("email_address").notNull(),
    address: text("address").notNull(),
    productName: text("product_name").notNull(),
    amount: integer("amount").notNull(), // Using integer for monetary values
    gstNumber: text("gst_number"),
    status: text("status").$type<"New" | "Discussion" | "Demo" | "Proposal" | "Decided">(),
    date: text("date").notNull(),
    endDate: text("end_date"),
    notes: text("notes").default(""),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at").default(new Date().toISOString()),
    updatedAt: text("updated_at").default(new Date().toISOString()),
  });


export const scheduledevents = sqliteTable("scheduledevents", {
  id: text("id").primaryKey(),
  subject: text("subject"),
  assignedUser: text("assigned_user"),
  customer: text("customer"),
  location: text("location"),
  status: text("status")
    .$type<"Scheduled" | "Completed" | "Cancelled" | "Postpone">()
    .default("Scheduled"),
  eventType: text("event_type")
    .$type<"Call" | "Meeting" | "Demo" | "FollowUp">(), // We'll normalize casing later
  priority: text("priority")
    .$type<"Low" | "Medium" | "High">()
    .default("Medium"),
  date: text("date"), // ISO format, convert to Date when needed
  recurrence: text("recurrence")
    .$type<"OneTime" | "Daily" | "Weekly" | "Monthly" | "Yearly">()
    .default("OneTime"),
  description: text("description").default(""),

  createdAt: text("created_at").default(new Date().toISOString()),
  updatedAt: text("updated_at").default(new Date().toISOString()),
});


export const document = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  type: text('type').notNull(), // "folder" or "file"
  fileUrl: text('file_url'),    // Optional
  fileType: text('file_type'),  // Optional
  parentId: integer('parent_id').references(((): any => document.id), {
    onDelete: 'set null',
  }),
});

export const emailLogs = sqliteTable("email_logs", {
  id: text("id").primaryKey(),
  recipient: text("recipient").notNull(),
  sender: text("sender").notNull(),
  subject: text("subject"),
  status: text("status").$type<"sent" | "failed" | "delivered" | "opened">().notNull(),
  error: text("error"),
  sentAt: text("sent_at").default(new Date().toISOString()),
  openedAt: text("opened_at"),
});


export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type'), // 'calendar' or other types
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  scheduledAt: text('scheduled_at'), // The date when notification should trigger
  relatedEventId: text('related_event_id').references(() => calendar.id), // Links to calendar event
  isSent: integer('is_sent', { mode: 'boolean' }).default(false), // Track if sent
});