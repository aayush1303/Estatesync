import { validateCSVRow, validateCSVData, CSVValidationResult } from '../utils/csv-validator';

describe('CSV Validator', () => {
  describe('validateCSVRow', () => {
    it('should validate a correct CSV row', () => {
      const validRow = {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '2',
        purpose: 'Buy',
        budgetMin: '1000000',
        budgetMax: '2000000',
        timeline: '0-3m',
        source: 'Website',
        notes: 'Looking for a nice apartment',
        tags: 'urgent,family',
        status: 'New'
      };

      const result = validateCSVRow(validRow, 1);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should catch missing required fields', () => {
      const invalidRow = {
        fullName: 'John Doe',
        // phone missing - required field
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '2',
        purpose: 'Buy',
        timeline: '0-3m',
        source: 'Website'
      };

      const result = validateCSVRow(invalidRow, 1);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('phone');
      expect(result.errors[0].row).toBe(1);
    });

    it('should catch invalid enum values', () => {
      const invalidRow = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'InvalidCity', // Invalid enum value
        propertyType: 'Apartment',
        bhk: '2',
        purpose: 'Buy',
        timeline: '0-3m',
        source: 'Website'
      };

      const result = validateCSVRow(invalidRow, 2);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('city');
      expect(result.errors[0].row).toBe(2);
    });

    it('should catch budget validation errors', () => {
      const invalidRow = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        bhk: '2',
        purpose: 'Buy',
        budgetMin: '2000000',
        budgetMax: '1000000', // Max less than min
        timeline: '0-3m',
        source: 'Website'
      };

      const result = validateCSVRow(invalidRow, 3);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Budget maximum must be greater than or equal to minimum');
      expect(result.errors[0].row).toBe(3);
    });

    it('should catch BHK requirement for residential properties', () => {
      const invalidRow = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh',
        propertyType: 'Apartment',
        // bhk missing for Apartment
        purpose: 'Buy',
        timeline: '0-3m',
        source: 'Website'
      };

      const result = validateCSVRow(invalidRow, 4);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('BHK is required for Apartment and Villa properties');
      expect(result.errors[0].row).toBe(4);
    });

    it('should handle multiple errors in one row', () => {
      const invalidRow = {
        fullName: 'A', // Too short
        phone: '123', // Too short
        city: 'InvalidCity', // Invalid enum
        propertyType: 'Apartment',
        // bhk missing for Apartment
        purpose: 'Buy',
        timeline: '0-3m',
        source: 'Website'
      };

      const result = validateCSVRow(invalidRow, 5);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors.every(error => error.row === 5)).toBe(true);
    });
  });

  describe('validateCSVData', () => {
    it('should validate multiple rows and separate valid/invalid', () => {
      const csvData = [
        {
          fullName: 'John Doe',
          phone: '1234567890',
          city: 'Chandigarh',
          propertyType: 'Office',
          purpose: 'Buy',
          timeline: '0-3m',
          source: 'Website'
        },
        {
          fullName: 'Jane Smith',
          phone: '123', // Invalid - too short
          city: 'Mohali',
          propertyType: 'Apartment',
          purpose: 'Rent',
          timeline: '3-6m',
          source: 'Referral'
        },
        {
          fullName: 'Bob Wilson',
          phone: '9876543210',
          city: 'Zirakpur',
          propertyType: 'Villa',
          bhk: '3',
          purpose: 'Buy',
          timeline: '>6m',
          source: 'Walk-in'
        }
      ];

      const result: CSVValidationResult = validateCSVData(csvData);
      
      expect(result.isValid).toBe(false); // Has some invalid rows
      expect(result.validRows).toHaveLength(2); // First and third rows
      expect(result.invalidRows).toHaveLength(1); // Second row
      expect(result.errors.length).toBeGreaterThan(0); // Has validation errors
      
      // Check that errors reference correct row numbers
      expect(result.errors.every(error => error.row === 2)).toBe(true);
    });

    it('should return valid when all rows are correct', () => {
      const csvData = [
        {
          fullName: 'John Doe',
          phone: '1234567890',
          city: 'Chandigarh',
          propertyType: 'Office',
          purpose: 'Buy',
          timeline: '0-3m',
          source: 'Website'
        },
        {
          fullName: 'Jane Smith',
          phone: '9876543210',
          city: 'Mohali',
          propertyType: 'Villa',
          bhk: '4',
          purpose: 'Rent',
          timeline: '3-6m',
          source: 'Referral'
        }
      ];

      const result: CSVValidationResult = validateCSVData(csvData);
      
      expect(result.isValid).toBe(true);
      expect(result.validRows).toHaveLength(2);
      expect(result.invalidRows).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle empty data', () => {
      const result: CSVValidationResult = validateCSVData([]);
      
      expect(result.isValid).toBe(true);
      expect(result.validRows).toHaveLength(0);
      expect(result.invalidRows).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});