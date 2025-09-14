import { buyerSchema } from '../validations/buyer';

describe('Buyer Validation', () => {
  describe('Budget Validator', () => {
    it('should accept valid budget range', () => {
      const validData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh' as const,
        propertyType: 'Apartment' as const,
        bhk: '2' as const,
        purpose: 'Buy' as const,
        budgetMin: 1000000,
        budgetMax: 2000000,
        timeline: '0-3m' as const,
        source: 'Website' as const,
        status: 'New' as const,
        tags: [],
      };

      const result = buyerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject when budgetMax < budgetMin', () => {
      const invalidData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh' as const,
        propertyType: 'Apartment' as const,
        bhk: '2' as const,
        purpose: 'Buy' as const,
        budgetMin: 2000000,
        budgetMax: 1000000, // Less than min
        timeline: '0-3m' as const,
        source: 'Website' as const,
        status: 'New' as const,
        tags: [],
      };

      const result = buyerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Budget maximum must be greater than or equal to minimum');
      }
    });

    it('should accept when only budgetMin is provided', () => {
      const validData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh' as const,
        propertyType: 'Apartment' as const,
        bhk: '2' as const,
        purpose: 'Buy' as const,
        budgetMin: 1000000,
        // budgetMax omitted
        timeline: '0-3m' as const,
        source: 'Website' as const,
        status: 'New' as const,
        tags: [],
      };

      const result = buyerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should accept when only budgetMax is provided', () => {
      const validData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh' as const,
        propertyType: 'Apartment' as const,
        bhk: '2' as const,
        purpose: 'Buy' as const,
        // budgetMin omitted
        budgetMax: 2000000,
        timeline: '0-3m' as const,
        source: 'Website' as const,
        status: 'New' as const,
        tags: [],
      };

      const result = buyerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('BHK Validator', () => {
    it('should require BHK for Apartment', () => {
      const invalidData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh' as const,
        propertyType: 'Apartment' as const,
        // bhk omitted - should be required
        purpose: 'Buy' as const,
        timeline: '0-3m' as const,
        source: 'Website' as const,
        status: 'New' as const,
        tags: [],
      };

      const result = buyerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('BHK is required for Apartment and Villa properties');
      }
    });

    it('should require BHK for Villa', () => {
      const invalidData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh' as const,
        propertyType: 'Villa' as const,
        // bhk omitted - should be required
        purpose: 'Buy' as const,
        timeline: '0-3m' as const,
        source: 'Website' as const,
        status: 'New' as const,
        tags: [],
      };

      const result = buyerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('BHK is required for Apartment and Villa properties');
      }
    });

    it('should not require BHK for Office', () => {
      const validData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh' as const,
        propertyType: 'Office' as const,
        // bhk omitted - should be optional for Office
        purpose: 'Buy' as const,
        timeline: '0-3m' as const,
        source: 'Website' as const,
        status: 'New' as const,
        tags: [],
      };

      const result = buyerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });
  });

  describe('Phone Validator', () => {
    it('should accept valid 10-digit phone', () => {
      const validData = {
        fullName: 'John Doe',
        phone: '1234567890',
        city: 'Chandigarh' as const,
        propertyType: 'Office' as const,
        purpose: 'Buy' as const,
        timeline: '0-3m' as const,
        source: 'Website' as const,
        status: 'New' as const,
        tags: [],
      };

      const result = buyerSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject phone with less than 10 digits', () => {
      const invalidData = {
        fullName: 'John Doe',
        phone: '123456789', // 9 digits
        city: 'Chandigarh' as const,
        propertyType: 'Office' as const,
        purpose: 'Buy' as const,
        timeline: '0-3m' as const,
        source: 'Website' as const,
        status: 'New' as const,
        tags: [],
      };

      const result = buyerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject phone with more than 15 digits', () => {
      const invalidData = {
        fullName: 'John Doe',
        phone: '1234567890123456', // 16 digits
        city: 'Chandigarh' as const,
        propertyType: 'Office' as const,
        purpose: 'Buy' as const,
        timeline: '0-3m' as const,
        source: 'Website' as const,
        status: 'New' as const,
        tags: [],
      };

      const result = buyerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject phone with non-numeric characters', () => {
      const invalidData = {
        fullName: 'John Doe',
        phone: '12345abcde',
        city: 'Chandigarh' as const,
        propertyType: 'Office' as const,
        purpose: 'Buy' as const,
        timeline: '0-3m' as const,
        source: 'Website' as const,
        status: 'New' as const,
        tags: [],
      };

      const result = buyerSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});