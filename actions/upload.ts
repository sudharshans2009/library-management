"use server";

import {
  saveProfileImage,
  saveBookCover,
  saveBookVideo,
  saveImageLocally,
} from "@/lib/blob";

export async function uploadImageAction(file: File): Promise<string> {
  return await saveProfileImage(file);
}

export async function uploadBookCoverAction(file: File): Promise<string> {
  return await saveBookCover(file);
}

export async function uploadBookVideoAction(file: File): Promise<string> {
  return await saveBookVideo(file);
}

export async function uploadMediaAction(
  file: File,
  folder?: string,
): Promise<string> {
  return await saveImageLocally(file, folder);
}
