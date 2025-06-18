// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { multerMiddleware } from '../../../utils/multerconfig';
import { IncomingMessage } from 'http';
import { Readable } from 'stream';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const name = formData.get('name') as string;
    const parentId = formData.get('parentId') as string | null;

    if (!file || !name) {
      return NextResponse.json(
        { success: false, message: 'Missing file or name' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'app', 'api', 'uploads');
    if (!existsSync(uploadDir)) {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const fullPath = path.join(uploadDir, fileName);
    
    // Save file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(fullPath, buffer);

    const fileType = file.type.split('/')[0];
    const fileUrl = `/api/uploads/${fileName}`;

    // Handle parent folder logic
    let validParentId: number | null = null;
    if (parentId && parentId !== 'null') {
      const checkParent = await client.execute({
        sql: `SELECT id FROM documents WHERE id = ? AND type = 'folder'`,
        args: [parentId],
      });
      if (checkParent.rows.length > 0) {
        validParentId = Number(parentId);
      }
    }

    // Save to database
    await client.execute({
      sql: `INSERT INTO documents (name, type, file_url, file_type, parent_id)
            VALUES (?, 'file', ?, ?, ?)`,
      args: [name, fileUrl, fileType, validParentId],
    });

    return NextResponse.json(
      { success: true, message: 'File uploaded successfully', fileUrl },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}


// Keep your existing GET and DELETE handlers
export async function GET() {
  try {
    const result = await client.execute({
      sql: `SELECT id, name, type, file_url, file_type, parent_id FROM documents WHERE type = 'file' ORDER BY id DESC`,
      args: [],
    });

    const files = result.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      fileUrl: row.file_url, // relative path like /uploads/123_file.png
      fileType: row.file_type,
      parentId: row.parent_id,
    }));

    return NextResponse.json({ success: true, data: files }, { status: 200 });
  } catch (error: any) {
    console.error("Fetch error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ success: false, message: "File ID required" }, { status: 400 });
        }

        const result = await client.execute({
            sql: "SELECT file_url FROM documents WHERE id = ?",
            args: [id],
        });

        const fileRow = result.rows[0];
        if (!fileRow) {
            return NextResponse.json({ success: false, message: "File not found" }, { status: 404 });
        }

        const fileUrl = fileRow.file_url as string | null;
        if (!fileUrl) {
            return NextResponse.json({ success: false, message: "File URL is missing" }, { status: 404 });
        }
        const filePath = path.join(process.cwd(), fileUrl);
        if (existsSync(filePath)) await fs.unlink(filePath);

        await client.execute({
            sql: "DELETE FROM documents WHERE id = ?",
            args: [id],
        });

        return NextResponse.json({ success: true, message: "File deleted" });
    } catch (error: any) {
        console.error("Delete error:", error);
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }
}
