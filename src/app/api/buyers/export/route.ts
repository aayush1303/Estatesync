import { NextResponse } from 'next/server';
import { db } from '../../../../utils/db';
import { buyers } from '../../../../utils/db/schema';
import { auth } from '@clerk/nextjs/server';
import { desc } from 'drizzle-orm';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all buyers (same logic as main buyers route for consistency)
    const allBuyers = await db.select().from(buyers)
      .orderBy(desc(buyers.updatedAt));

    // Check if there are any buyers to export
    if (allBuyers.length === 0) {
      return NextResponse.json(
        { error: 'No buyer data available to export' },
        { status: 404 }
      );
    }

    // Convert to CSV format
    const csvHeaders = [
      'fullName',
      'email', 
      'phone',
      'city',
      'propertyType',
      'bhk',
      'purpose',
      'budgetMin',
      'budgetMax',
      'timeline',
      'source',
      'notes',
      'tags',
      'status'
    ];

    // Create CSV content
    const csvRows = [
      csvHeaders.join(','), // Header row
      ...allBuyers.map(buyer => {
        return csvHeaders.map(header => {
          let value = buyer[header as keyof typeof buyer];
          
          // Handle special cases
          if (header === 'tags' && Array.isArray(value)) {
            value = value.join(',');
          }
          
          // Handle null/undefined values
          if (value === null || value === undefined) {
            value = '';
          }
          
          // Escape commas and quotes in CSV values
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          
          return stringValue;
        }).join(',');
      })
    ];

    const csvContent = csvRows.join('\n');

    // Create filename with current timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const filename = `buyers-export-${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to export buyers' },
      { status: 500 }
    );
  }
}