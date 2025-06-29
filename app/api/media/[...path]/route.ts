import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { lookup } from "mime-types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    // Construct the file path from ROOT/media/...
    const filePath = join(process.cwd(), "media", ...(await params).path);

    // Security check: ensure the path is within the media directory
    const mediaDir = join(process.cwd(), "media");
    if (!filePath.startsWith(mediaDir)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Check if file exists
    if (!existsSync(filePath)) {
      return new NextResponse("File not found", { status: 404 });
    }

    // Get file stats for additional headers
    const fileStats = await stat(filePath);

    // Read the file
    const fileBuffer = await readFile(filePath);

    // Get the file's MIME type
    const mimeType = lookup(filePath) || "application/octet-stream";

    // Convert the Node.js Buffer into a Uint8Array
    const typedArray = new Uint8Array(fileBuffer);

    // Create a Blob from the TypedArray
    const blob = new Blob([typedArray], { type: mimeType });

    // Return the blob with appropriate headers
    return new NextResponse(blob, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileStats.size.toString(),
        "Last-Modified": fileStats.mtime.toUTCString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: `"${fileStats.mtime.getTime()}-${fileStats.size}"`,
      },
    });
  } catch (error) {
    console.error("Error serving media file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// Optional: Add HEAD method for efficient metadata requests
export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const filePath = join(process.cwd(), "media", ...(await params).path);
    const mediaDir = join(process.cwd(), "media");

    if (!filePath.startsWith(mediaDir)) {
      return new NextResponse(null, { status: 403 });
    }

    if (!existsSync(filePath)) {
      return new NextResponse(null, { status: 404 });
    }

    const fileStats = await stat(filePath);
    const mimeType = lookup(filePath) || "application/octet-stream";

    return new NextResponse(null, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileStats.size.toString(),
        "Last-Modified": fileStats.mtime.toUTCString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        ETag: `"${fileStats.mtime.getTime()}-${fileStats.size}"`,
      },
    });
  } catch (error) {
    console.error("Error serving media file metadata:", error);
    return new NextResponse(null, { status: 500 });
  }
}
