import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../../utils/db';
import { buyerHistory, buyers } from '../../../../../utils/db/schema';
import { auth } from '@clerk/nextjs/server';
import { eq, desc } from 'drizzle-orm';
import { isUserAdmin } from '../../../../../utils/admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: buyerId } = await params;
    const isAdmin = await isUserAdmin();
    
    // Check if user has access to this buyer
    if (!isAdmin) {
      const [buyer] = await db.select().from(buyers)
        .where(eq(buyers.id, buyerId));
      
      if (!buyer || buyer.ownerId !== userId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    
    // Fetch history records for this buyer
    const history = await db.select().from(buyerHistory)
      .where(eq(buyerHistory.buyerId, buyerId))
      .orderBy(desc(buyerHistory.changedAt));
    
    return NextResponse.json(history);
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch buyer history' },
      { status: 500 }
    );
  }
}