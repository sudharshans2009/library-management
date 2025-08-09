import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/database-utils";

export async function GET() {
  try {
    const health = await checkDatabaseHealth();
    
    return NextResponse.json(
      {
        status: health.healthy ? "healthy" : "unhealthy",
        timestamp: new Date().toISOString(),
        database: {
          connected: health.healthy,
          latency: health.latency,
          error: health.error,
        },
      },
      { status: health.healthy ? 200 : 503 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
