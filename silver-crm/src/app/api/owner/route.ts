import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("logo") as File | null;

    const companyName = formData.get("companyName")?.toString() ?? "";
    const ownerName = formData.get("ownerName")?.toString() ?? "";
    const contactNumber = formData.get("contactNumber")?.toString() ?? "";
    const emailAddress = formData.get("emailAddress")?.toString() ?? "";
    const website = formData.get("website")?.toString() ?? "";
    const businessRegistration = formData.get("businessRegistration")?.toString() ?? "";
    const companyType = formData.get("companyType")?.toString() ?? "";
    const employeeSize = formData.get("employeeSize")?.toString() ?? "";
    const panNumber = formData.get("panNumber")?.toString() ?? "";
    const documentType = formData.get("documentType")?.toString() ?? "";
    const documentNumber = formData.get("documentNumber")?.toString() ?? "";
    const gstNumber = formData.get("gstNumber")?.toString() ?? "";

    let logoPath: string | null = null;

    if (file) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
      const filePath = path.join(uploadDir, fileName);
      await writeFile(filePath, buffer);
      logoPath = `/uploads/${fileName}`;
    }

    const id = nanoid();
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    await client.execute({
      sql: `
        INSERT INTO owners (
          id, logo, companyName, ownerName, contactNumber, emailAddress, website,
          businessRegistration, companyType, employeeSize, panNumber, documentType,
          documentNumber, gstNumber, dataFilled, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id, logoPath, companyName, ownerName, contactNumber, emailAddress, website,
        businessRegistration, companyType, employeeSize, panNumber, documentType,
        documentNumber, gstNumber, true, createdAt, updatedAt
      ]
    });

    return NextResponse.json({
      success: true,
      message: "Owner added successfully",
      data: {
        id, logo: logoPath, companyName, ownerName, contactNumber,
        emailAddress, website, businessRegistration, companyType, employeeSize,
        panNumber, documentType, documentNumber, gstNumber, createdAt, updatedAt,
      },
    });

  } catch (error: any) {
    console.error("Add Owner Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add owner", error: error.message },
      { status: 500 }
    );
  }
}
