import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function saveImageLocally(file: File, folder?: string): Promise<string> {
  try {
    // Define the subfolder (default to 'images' if not specified)
    const subfolder = folder || 'images';
    
    // Create media directory path (ROOT/media/subfolder)
    const mediaDir = join(process.cwd(), 'media', subfolder);
    if (!existsSync(mediaDir)) {
      await mkdir(mediaDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(/\.[^.]*$/, '');
    const fileName = `${timestamp}-${randomId}-${sanitizedName}.${fileExtension}`;
    const filePath = join(mediaDir, fileName);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return the API URL path
    return `/api/media/${subfolder}/${fileName}`;
  } catch (error) {
    console.error('Failed to save image locally:', error);
    throw error;
  }
}

// Specific functions for different types of media
export async function saveProfileImage(file: File): Promise<string> {
  return saveImageLocally(file, 'profile-images');
}

export async function saveBookCover(file: File): Promise<string> {
  return saveImageLocally(file, 'book-covers');
}

export async function saveBookVideo(file: File): Promise<string> {
  return saveImageLocally(file, 'book-videos');
}

export function convertImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}