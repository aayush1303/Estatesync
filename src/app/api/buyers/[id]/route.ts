import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../utils/db';
import { buyers, buyerHistory } from '../../../../utils/db/schema';
import { buyerSchema } from '../../../../validations/buyer';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { eq, and } from 'drizzle-orm';
import { isUserAdmin } from '../../../../utils/admin';
import { updateBuyerLimiter, checkRateLimit, getRateLimitIdentifier } from '../../../../utils/rate-limiter';

// Utility function to calculate differences between old and new buyer data
function calculateDiff(oldBuyer: Record<string, any>, newBuyer: Record<string, any>) {
  const changes: Record<string, { old: any; new: any }> = {};
  const excludeFields = ['id', 'createdAt', 'updatedAt', 'ownerId'];
  
  for (const [key, newValue] of Object.entries(newBuyer)) {
    if (excludeFields.includes(key)) continue;
    
    const oldValue = oldBuyer[key];
    
    // Handle array comparison (for tags)
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      const oldSorted = [...oldValue].sort();
      const newSorted = [...newValue].sort();
      if (JSON.stringify(oldSorted) !== JSON.stringify(newSorted)) {
        changes[key] = { old: oldValue, new: newValue };
      }
    }
    // Handle regular value comparison
    else if (oldValue !== newValue) {
      changes[key] = { old: oldValue, new: newValue };
    }
  }
  
  return changes;
}

// Function to format value for display
function formatValueForDisplay(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}


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
    
    // All users can view any buyer (changed from role-based to universal access)
    const [buyer] = await db.select().from(buyers)
      .where(eq(buyers.id, buyerId));

    if (!buyer) {
      return NextResponse.json({ error: 'Buyer not found' }, { status: 404 });
    }

    return NextResponse.json(buyer);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch buyer' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('PUT request received');
    const { userId } = await auth();

    if (!userId) {
      console.log('No userId found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const identifier = getRateLimitIdentifier(userId, ip);
    const rateLimitResult = await checkRateLimit(updateBuyerLimiter, identifier);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      );
    }

    const { id: buyerId } = await params;
    console.log('Updating buyer:', buyerId);
    
    const body = await request.json();
    console.log('PUT request body received:', body);
    console.log('Body keys:', Object.keys(body));
    console.log('attachmentUrl in body:', body.attachmentUrl);
    
    const isAdmin = await isUserAdmin();
    console.log('Is admin:', isAdmin);

    // Get existing buyer first
    let existingBuyer;
    if (isAdmin) {
      console.log('Admin fetching buyer');
      [existingBuyer] = await db.select().from(buyers)
        .where(eq(buyers.id, buyerId));
    } else {
      console.log('User fetching own buyer');
      [existingBuyer] = await db.select().from(buyers)
        .where(and(eq(buyers.id, buyerId), eq(buyers.ownerId, userId)));
    }

    if (!existingBuyer) {
      console.log('Buyer not found');
      return NextResponse.json({ error: 'Buyer not found or access denied' }, { status: 404 });
    }

    console.log('Existing buyer found:', existingBuyer.id);
    
    // If only updating status, do a simple update
    if (Object.keys(body).length === 1 && body.status) {
      console.log('Simple status update to:', body.status);
      
      const [updatedBuyer] = await db.update(buyers)
        .set({
          status: body.status,
          updatedAt: new Date(),
        })
        .where(eq(buyers.id, buyerId))
        .returning();

      console.log('Status updated successfully');
      return NextResponse.json(updatedBuyer, {
        headers: rateLimitResult.headers
      });
    }
    
    // For other updates, use the full validation logic
    const mergedData = {
      ...existingBuyer,
      ...body,
    };
    
    console.log('Validating merged data:', mergedData);
    
    let validatedData;
    try {
      validatedData = buyerSchema.parse(mergedData);
      console.log('Validation successful');
    } catch (validationError) {
      console.error('Validation failed:', validationError);
      return NextResponse.json(
        { error: `Validation failed: ${validationError instanceof Error ? validationError.message : 'Invalid data'}` },
        { status: 400 }
      );
    }
    
    // Calculate what changed
    const changes = calculateDiff(existingBuyer, { ...existingBuyer, ...body });
    
    // If no changes, return existing buyer
    if (Object.keys(changes).length === 0) {
      console.log('No changes detected');
      return NextResponse.json(existingBuyer, {
        headers: rateLimitResult.headers
      });
    }
    
    console.log('Changes detected:', changes);
    
    // Get user details for history record
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.emailAddresses?.[0]?.emailAddress || 'Unknown User';
    
    // Update buyer first
    console.log('Updating buyer with validated data:', validatedData);
    const [updatedBuyer] = await db.update(buyers)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(buyers.id, buyerId))
      .returning();
    
    console.log('Buyer updated successfully:', updatedBuyer.id);
    
    // Insert history records
    const historyRecords = Object.entries(changes).map(([field, change]) => ({
      buyerId,
      changedBy: userId,
      changedByName: userName,
      field,
      oldValue: formatValueForDisplay(change.old),
      newValue: formatValueForDisplay(change.new),
      attachmentUrl: field === 'attachmentUrl' ? change.new as string : null, 
    }));
    
    console.log('Creating history records:', historyRecords);
    
    if (historyRecords.length > 0) {
      try {
        await db.insert(buyerHistory).values(historyRecords);
        console.log('History records created successfully');
      } catch (historyError) {
        console.error('Failed to create history records:', historyError);
        // Don't fail the entire update if history creation fails
      }
    }
    
    console.log('Full update completed');
    return NextResponse.json(updatedBuyer, {
      headers: rateLimitResult.headers
    });
  } catch (error) {
    console.error('PUT /api/buyers/[id] error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { error: `Failed to update buyer: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    
    let existingBuyer;
    if (isAdmin) {
      // Admin can delete any buyer
      [existingBuyer] = await db.select().from(buyers)
        .where(eq(buyers.id, buyerId));
    } else {
      // Regular users can only delete their own buyers
      [existingBuyer] = await db.select().from(buyers)
        .where(and(eq(buyers.id, buyerId), eq(buyers.ownerId, userId)));
    }

    if (!existingBuyer) {
      return NextResponse.json({ error: 'Buyer not found or access denied' }, { status: 404 });
    }
    
    // Delete the buyer
    await db.delete(buyers).where(eq(buyers.id, buyerId));
    
    return NextResponse.json({ message: 'Buyer deleted successfully' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete buyer' },
      { status: 500 }
    );
  }
}