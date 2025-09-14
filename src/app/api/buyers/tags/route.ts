import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "../../../../utils/db";
import { sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query to get all unique tags from all buyers
    const result = await db.execute(sql`
      SELECT DISTINCT jsonb_array_elements_text(tags) AS tag 
      FROM buyers 
      WHERE tags IS NOT NULL 
      AND jsonb_array_length(tags) > 0
      ORDER BY tag ASC
    `);

    // Extract tags from the result
    const tags = result.rows.map((row: any) => row.tag).filter(Boolean);

    return NextResponse.json(tags);
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}