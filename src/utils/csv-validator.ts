import { buyerSchema } from '../validations/buyer';

export interface CSVValidationResult {
  isValid: boolean;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  validRows: any[];
  invalidRows: any[];
}

export function validateCSVRow(row: any, rowNumber: number): { isValid: boolean; errors: Array<{ row: number; field: string; message: string }> } {
  const errors: Array<{ row: number; field: string; message: string }> = [];
  
  try {
    // Convert string values to appropriate types
    const processedRow = {
      fullName: row.fullName?.trim(),
      email: row.email?.trim() || undefined,
      phone: row.phone?.trim(),
      city: row.city?.trim(),
      propertyType: row.propertyType?.trim(),
      bhk: row.bhk?.trim() || undefined,
      purpose: row.purpose?.trim(),
      budgetMin: row.budgetMin ? parseInt(row.budgetMin, 10) : undefined,
      budgetMax: row.budgetMax ? parseInt(row.budgetMax, 10) : undefined,
      timeline: row.timeline?.trim(),
      source: row.source?.trim(),
      notes: row.notes?.trim() || undefined,
      tags: row.tags ? row.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : [],
      status: row.status?.trim() || 'New',
    };

    const result = buyerSchema.safeParse(processedRow);
    
    if (!result.success) {
      result.error.issues.forEach((error: any) => {
        errors.push({
          row: rowNumber,
          field: error.path.join('.'),
          message: error.message
        });
      });
    }
    
    return {
      isValid: result.success,
      errors
    };
  } catch (error) {
    errors.push({
      row: rowNumber,
      field: 'general',
      message: `Row parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    
    return {
      isValid: false,
      errors
    };
  }
}

export function validateCSVData(csvData: any[]): CSVValidationResult {
  const allErrors: Array<{ row: number; field: string; message: string }> = [];
  const validRows: any[] = [];
  const invalidRows: any[] = [];
  
  csvData.forEach((row, index) => {
    const rowNumber = index + 1; // 1-based row numbering
    const validation = validateCSVRow(row, rowNumber);
    
    if (validation.isValid) {
      validRows.push(row);
    } else {
      invalidRows.push(row);
      allErrors.push(...validation.errors);
    }
  });
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    validRows,
    invalidRows
  };
}

export const REQUIRED_CSV_HEADERS = [
  'fullName',
  'phone', 
  'city',
  'propertyType',
  'purpose',
  'timeline',
  'source'
];

export const OPTIONAL_CSV_HEADERS = [
  'email',
  'bhk',
  'budgetMin',
  'budgetMax', 
  'notes',
  'tags',
  'status'
];

export const ALL_CSV_HEADERS = [...REQUIRED_CSV_HEADERS, ...OPTIONAL_CSV_HEADERS];