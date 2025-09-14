import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ManageProjectsTable from "../../components/ManageProjectsTable";
import Navbar from "../../components/Navbar";
import { db } from "../../utils/db";
import { buyers } from "../../utils/db/schema";
import { desc, ilike, eq, or, and, count } from "drizzle-orm";
import type { Buyer } from "../../utils/db/schema";

interface PageProps {
  searchParams: {
    page?: string;
    search?: string;
    city?: string;
    status?: string;
    propertyType?: string;
  };
}

async function fetchBuyers(searchParams: PageProps['searchParams']) {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  // Build query parameters
  const page = Math.max(1, parseInt(searchParams.page || '1'));
  const limit = 10; // Default limit
  const offset = (page - 1) * limit;

  // Get search and filter parameters
  const search = searchParams.search || '';
  const city = searchParams.city || '';
  const status = searchParams.status || '';
  const propertyType = searchParams.propertyType || '';

  try {
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

    if (city) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      whereConditions.push(eq(buyers.city, city as any));
    }

    if (status) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      whereConditions.push(eq(buyers.status, status as any));
    }

    if (propertyType) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      whereConditions.push(eq(buyers.propertyType, propertyType as any));
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

    // Transform the data to match the expected format (convert null to undefined for optional fields)
    const transformedBuyers = allBuyers.map(buyer => ({
      ...buyer,
      email: buyer.email || undefined,
      bhk: buyer.bhk || undefined,
      budgetMin: buyer.budgetMin || undefined,
      budgetMax: buyer.budgetMax || undefined,
      notes: buyer.notes || undefined,
      tags: buyer.tags || undefined,
      attachmentUrl: buyer.attachmentUrl || undefined,
      createdAt: buyer.createdAt.toISOString(),
      updatedAt: buyer.updatedAt.toISOString(),
    }));
      
    return {
      buyers: transformedBuyers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  } catch (error) {
    console.error('Failed to fetch buyers:', error);
    return null;
  }
}

export default async function Dashboard({ searchParams }: PageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  const buyersData = await fetchBuyers(searchParams);

  return (
    <div className="min-h-screen bg-zinc-900 text-white overflow-x-hidden">
      {/* Navigation Header */}
      <Navbar/>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Projects Table */}
        <main>
          <ManageProjectsTable 
            initialData={buyersData}
            searchParams={searchParams}
          />
        </main>
      </div>
    </div>
  );
}
