import { NextResponse } from 'next/server';
import { db } from '../../../utils/db';
import { buyers } from '../../../utils/db/schema';
import { count } from 'drizzle-orm';

export async function GET() {
  try {
    // Simple test to see if we can connect to the database
    const result = await db.select({ count: count() }).from(buyers);
    return NextResponse.json({ 
      status: 'success', 
      message: 'Database connection working',
      totalBuyers: result[0].count
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}