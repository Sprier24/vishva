import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  isVerified: integer("isVerified", { mode: "boolean" }).default(false),
  resetPasswordToken: text("resetPasswordToken"),
  resetPasswordExpires: text("resetPasswordExpires"), // ISO format string
  verificationCode: text("verificationCode"),
  verificationCodeExpires: text("verificationCodeExpires"),
  isFirstLogin: integer("isFirstLogin", { mode: "boolean" }).default(true),
  createdAt: text("created_at").default(new Date().toISOString()),
  updatedAt: text("updated_at").default(new Date().toISOString()),
});

