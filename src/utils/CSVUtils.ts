import Papa from 'papaparse';
import { buyerSchema } from '../validations/buyer';

function transformCsvRow(row: any): any {
  const transformedRow: any = {};
  
  Object.keys(row).forEach(key => {
    let value = row[key];
    
    // Handle special transformations
    if (key === 'tags' && value) {
      // Convert comma-separated tags to array
      if (typeof value === 'string') {
        value = value.split(',').map((tag: string) => tag.trim()).filter(tag => tag.length > 0);
      }
    }
    
    // Convert numeric strings to numbers for budget fields
    if ((key === 'budgetMin' || key === 'budgetMax') && value) {
      const numValue = parseInt(value, 10);
      value = isNaN(numValue) ? undefined : numValue;
    }
    
    // Convert empty strings to undefined for optional fields
    if (value === '' || value === null) {
      value = undefined;
    }
    
    transformedRow[key] = value;
  });
  
  return transformedRow;
}

export async function parseAndValidateCSV(file: File) {
  return new Promise<{
    validItems: any[];
    invalidItems: { row: number; errors: string[] }[];
  }>((resolve) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validItems: any[] = [];
        const invalidItems: { row: number; errors: string[] }[] = [];

        results.data.forEach((row: any, index: number) => {
          try {
            // Transform CSV row
            const transformedRow = transformCsvRow(row);
            
            // Validate with buyer schema
            const validatedData = buyerSchema.parse(transformedRow);
            validItems.push(validatedData);
          } catch (e: any) {
            invalidItems.push({
              row: index + 2, // +2 to account for header line
              errors: e.errors?.map((err: any) => `${err.path?.join('.')}: ${err.message}`) || ['Invalid data'],
            });
          }
        });

        resolve({ validItems, invalidItems });
      },
      error: (error) => {
        resolve({ validItems: [], invalidItems: [{ row: 0, errors: [error.message] }] });
      },
    });
  });
}
