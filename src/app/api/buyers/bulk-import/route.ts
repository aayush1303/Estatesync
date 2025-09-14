import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../utils/db';
import { buyers } from '../../../../utils/db/schema';
import { buyerSchema } from '../../../../validations/buyer';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { buyers: buyerData } = body;

    if (!Array.isArray(buyerData) || buyerData.length === 0) {
      return NextResponse.json({ error: 'No buyer data provided' }, { status: 400 });
    }

    // Validate each buyer record and add ownerId
    const validatedBuyers = [];
    const errors = [];

    for (let i = 0; i < buyerData.length; i++) {
      try {
        const buyerRecord = buyerSchema.parse(buyerData[i]);
        validatedBuyers.push({
          ...buyerRecord,
          ownerId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } catch (e: any) {
        errors.push(`Record ${i + 1}: ${e.errors?.map((err: any) => err.message).join(', ') || 'Invalid data'}`);
      }
    }

    if (validatedBuyers.length === 0) {
      return NextResponse.json({ 
        error: 'No valid buyer records found',
        details: errors
      }, { status: 400 });
    }

    // Insert all valid buyers
    const insertedBuyers = await db.insert(buyers).values(validatedBuyers).returning();

    return NextResponse.json({
      success: true,
      imported: insertedBuyers.length,
      total: buyerData.length,
      skipped: buyerData.length - insertedBuyers.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to import buyers' },
      { status: 500 }
    );
  }
}