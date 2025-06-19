import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function saveImageLocally(file: File): Promise<string> {
  try {
    // Ensure media directory exists
    const mediaDir = join(process.cwd(), 'public', 'media', 'profile-images');
    if (!existsSync(mediaDir)) {
      await mkdir(mediaDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(mediaDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the public URL path
    return `/media/profile-images/${fileName}`;
  } catch (error) {
    console.error('Failed to save image locally:', error);
    throw error;
  }
}

export function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}