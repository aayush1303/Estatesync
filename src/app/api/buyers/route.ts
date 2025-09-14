import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../utils/db';
import { buyers, type City, type Status, type PropertyType } from '../../../utils/db/schema';
import { buyerSchema } from '../../../validations/buyer';
import { auth } from '@clerk/nextjs/server';
import { desc, ilike, eq, or, and, count } from 'drizzle-orm'; 
import { createBuyerLimiter, checkRateLimit, getRateLimitIdentifier } from '../../../utils/rate-limiter';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth(); 

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const identifier = getRateLimitIdentifier(userId, ip);
    const rateLimitResult = await checkRateLimit(createBuyerLimiter, identifier);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      );
    }

    const body = await request.json();
    
    // Validate the data
    const validatedData = buyerSchema.parse(body);
    
    // Use authenticated user as owner
    const buyerData = {
      ...validatedData,
      ownerId: userId,
    };
    
    // Insert into database
    const [newBuyer] = await db.insert(buyers).values(buyerData).returning();
    
    return NextResponse.json(newBuyer, { 
      status: 201,
      headers: rateLimitResult.headers
    });
  } catch (error) {
    console.error('Error creating buyer:', error);
    return NextResponse.json(
      { error: 'Failed to create buyer' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get pagination parameters from URL
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') || '10'))); // Default 10, max 50
    const offset = (page - 1) * limit;

    // Get search and filter parameters
    const search = url.searchParams.get('search') || '';
    const city = url.searchParams.get('city') || '';
    const status = url.searchParams.get('status') || '';
    const propertyType = url.searchParams.get('propertyType') || '';

    // Define valid enum values for validation
    const validCities = ['Chandigarh', 'Mohali', 'Zirakpur', 'Panchkula', 'Other'];
    const validStatuses = ['New', 'Qualified', 'Contacted', 'Visited', 'Negotiation', 'Converted', 'Dropped'];
    const validPropertyTypes = ['Apartment', 'Villa', 'Plot', 'Office', 'Retail'];

    // Build the query with filters
    const whereConditions = [];
    
    // Apply filters if provided
    if (search) {
      whereConditions.push(
        or(
          ilike(buyers.fullName, `%${search}%`),
          ilike(buyers.email, `%${search}%`),
          ilike(buyers.phone, `%${search}%`)
        )
      );
    }

    if (city && validCities.includes(city)) {
      whereConditions.push(eq(buyers.city, city as City));
    }

    if (status && validStatuses.includes(status)) {
      whereConditions.push(eq(buyers.status, status as Status));
    }

    if (propertyType && validPropertyTypes.includes(propertyType)) {
      whereConditions.push(eq(buyers.propertyType, propertyType as PropertyType));
    }

    // Build where clause for filtering
    let whereClause = undefined;
    if (whereConditions.length > 0) {
      whereClause = whereConditions.length === 1 
        ? whereConditions[0] 
        : whereConditions.reduce((acc, condition) => and(acc, condition));
    }
    
    // Get total count for pagination
    const totalCount = whereClause 
      ? (await db.select({ count: count() }).from(buyers).where(whereClause))[0].count
      : (await db.select({ count: count() }).from(buyers))[0].count;
    
    // Get paginated results
    const queryBuilder = db.select().from(buyers);
    const finalQuery = whereClause 
      ? queryBuilder.where(whereClause)
      : queryBuilder;
    
    const allBuyers = await finalQuery
      .orderBy(desc(buyers.updatedAt))
      .limit(limit)
      .offset(offset);

    const totalPages = Math.ceil(totalCount / limit);
      
    return NextResponse.json({
      buyers: allBuyers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching buyers:', error);
    return NextResponse.json({ error: 'Failed to fetch buyers' }, { status: 500 });
  }
}