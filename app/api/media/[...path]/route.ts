import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { lookup } from 'mime-types';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = join(process.cwd(), 'media', ...params.path);

    // Check if file exists
    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    // Read the file
    const fileBuffer = await readFile(filePath);
    
    // Get the file's MIME type
    const mimeType = lookup(filePath) || 'application/octet-stream';

    // Convert the Node.js Buffer into a Uint8Array:
    const typedArray = new Uint8Array(fileBuffer);

    // Now create a Blob from a valid TypedArray:
    const blob = new Blob([typedArray], { type: mimeType });

    // Return the blob with appropriate headers
    return new NextResponse(blob, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving media file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}