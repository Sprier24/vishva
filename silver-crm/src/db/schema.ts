// app/lib/db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

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
