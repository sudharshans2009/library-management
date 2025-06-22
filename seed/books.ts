// filepath: c:\Users\bsoun\Documents\Codebase\library-management-v2\seed\books.ts
import dotenv from "dotenv";
import path from "path";
import { existsSync } from "fs";
import { db } from "@/database/drizzle";
import { books } from "@/database/schema";
import { saveBookCover, saveBookVideo } from "@/lib/blob";
import booksData from "./books.json";

// Load environment variables from multiple possible locations
function loadEnvironmentVariables() {
  const envFiles = [
    path.join(process.cwd(), '.env.local'),
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), '.env.development.local'),
  ];

  console.log("🔍 Looking for environment files...");
  
  for (const envFile of envFiles) {
    if (existsSync(envFile)) {
      console.log(`✅ Found environment file: ${envFile}`);
      const result = dotenv.config({ path: envFile });
      if (result.error) {
        console.warn(`⚠️  Warning: Error loading ${envFile}:`, result.error.message);
      } else {
        console.log(`✅ Successfully loaded environment from: ${envFile}`);
      }
    } else {
      console.log(`❌ Environment file not found: ${envFile}`);
    }
  }

  dotenv.config();
}

loadEnvironmentVariables();

interface UploadProgress {
  total: number;
  completed: number;
  failed: number;
  current: string;
}

async function downloadAndUploadFile(
  url: string, 
  type: 'cover' | 'video',
  bookTitle: string
): Promise<string> {
  try {
    console.log(`    Downloading ${type} for: ${bookTitle}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    const urlParts = url.split('/');
    const originalFilename = urlParts[urlParts.length - 1] || `${type}_file`;
    
    // Create a more descriptive filename
    const sanitizedTitle = bookTitle.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    
    // Determine proper extension based on type
    let extension: string;
    if (type === 'video') {
      extension = 'mp4'; // Always use mp4 for videos
    } else {
      // For covers, try to get extension from original filename or default to jpg
      const originalExtension = originalFilename.split('.').pop()?.toLowerCase();
      extension = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(originalExtension || '') 
        ? originalExtension! 
        : 'jpg';
    }
    
    const filename = `${sanitizedTitle}_${type}.${extension}`;
    
    const file = new File([blob], filename, { type: blob.type });
    
    console.log(`    Uploading ${type} to media folder...`);
    
    // Use the appropriate upload function based on type
    const localUrl = type === 'cover' 
      ? await saveBookCover(file)
      : await saveBookVideo(file);
    
    console.log(`    ✅ ${type} uploaded: ${localUrl}`);
    return localUrl;
    
  } catch (error) {
    console.error(`    ❌ Failed to upload ${type}:`, error);
    throw error;
  }
}

function updateProgress(progress: UploadProgress) {
  const percentage = Math.round((progress.completed / progress.total) * 100);
  console.log(`\n📊 Progress: ${progress.completed}/${progress.total} (${percentage}%) | Failed: ${progress.failed}`);
  console.log(`🔄 Currently processing: ${progress.current}\n`);
}

async function checkEnvironment() {
  console.log("🔍 Checking environment variables...");
  
  Object.keys(process.env)
    .filter(key => key.includes('DATABASE') || key.includes('URL'))
    .forEach(key => {
      console.log(`  ${key}: ${process.env[key] ? '[SET]' : '[NOT SET]'}`);
    });
  
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set.");
    console.error("Please create a .env.local file in your project root with:");
    console.error("DATABASE_URL=\"your_neon_database_connection_string\"");
    console.error("\nCurrent working directory:", process.cwd());
    console.error("Expected .env.local location:", path.join(process.cwd(), '.env.local'));
    
    throw new Error("DATABASE_URL environment variable is missing");
  }
  
  console.log("✅ Environment variables are properly configured\n");
}

async function seedBooksAdvanced() {
  console.log("🚀 Starting advanced book seeding process...\n");
  
  try {
    await checkEnvironment();
    
    const progress: UploadProgress = {
      total: booksData.length,
      completed: 0,
      failed: 0,
      current: ''
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const failedBooks: Array<{ book: any; error: string }> = [];
    
    console.log("🔌 Testing database connection...");
    try {
      await db.select().from(books).limit(1);
      console.log("✅ Database connection successful\n");
    } catch (dbError) {
      console.error("❌ Database connection failed:", dbError);
      throw new Error("Failed to connect to database. Please check your DATABASE_URL.");
    }
    
    console.log("🗑️  Clearing existing books...");
    await db.delete(books);
    console.log("✅ Existing books cleared\n");

    for (let i = 0; i < booksData.length; i++) {
      const book = booksData[i];
      progress.current = book.title;
      updateProgress(progress);
      
      try {
        console.log(`📚 Processing: ${book.title}`);
        
        // Upload cover image and video in parallel
        const [localCoverUrl, localVideoUrl] = await Promise.all([
          downloadAndUploadFile(book.coverUrl, 'cover', book.title),
          downloadAndUploadFile(book.videoUrl, 'video', book.title)
        ]);
        
        console.log(`    💾 Saving to database...`);
        await db.insert(books).values({
          id: book.id,
          title: book.title,
          author: book.author,
          genre: book.genre,
          rating: book.rating,
          coverUrl: localCoverUrl, // Now points to /api/media/book-covers/...
          coverColor: book.coverColor,
          description: book.description,
          totalCopies: book.totalCopies,
          availableCopies: book.availableCopies,
          videoUrl: localVideoUrl, // Now points to /api/media/book-videos/...
          summary: book.summary,
        });
        
        progress.completed++;
        console.log(`    ✅ Successfully seeded: ${book.title}\n`);
        
      } catch (error) {
        progress.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failedBooks.push({ book, error: errorMessage });
        console.error(`    ❌ Failed to seed: ${book.title} - ${errorMessage}\n`);
      }
    }
    
    console.log("🎉 Book seeding completed!");
    console.log(`📊 Final Results:`);
    console.log(`   ✅ Successfully seeded: ${progress.completed} books`);
    console.log(`   ❌ Failed: ${progress.failed} books`);
    
    if (failedBooks.length > 0) {
      console.log(`\n🔍 Failed Books Details:`);
      failedBooks.forEach(({ book, error }, index) => {
        console.log(`   ${index + 1}. ${book?.title || "DEFAULT"} - ${error}`);
      });
    }
    
    const dbCount = await db.select().from(books);
    console.log(`\n📈 Books in database: ${dbCount.length}`);
    
  } catch (error) {
    console.error("💥 Critical error during seeding:", error);
    process.exit(1);
  }
}

export { seedBooksAdvanced, downloadAndUploadFile };

if (require.main === module) {
  seedBooksAdvanced()
    .then(() => {
      console.log("\n🏁 Seeding process finished successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 Seeding failed:", error);
      process.exit(1);
    });
}