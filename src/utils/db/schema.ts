import { 
  pgTable, 
  uuid, 
  varchar, 
  integer, 
  timestamp, 
  text, 
  jsonb,
  pgEnum 
} from 'drizzle-orm/pg-core';

// Define enums for type safety
export const cityEnum = pgEnum('city', [
  'Chandigarh', 
  'Mohali', 
  'Zirakpur', 
  'Panchkula', 
  'Other'
]);

export const propertyTypeEnum = pgEnum('property_type', [
  'Apartment', 
  'Villa', 
  'Plot', 
  'Office', 
  'Retail'
]);

export const bhkEnum = pgEnum('bhk', ['1', '2', '3', '4', 'Studio']);

export const purposeEnum = pgEnum('purpose', ['Buy', 'Rent']);

export const timelineEnum = pgEnum('timeline', [
  '0-3m', 
  '3-6m', 
  '>6m', 
  'Exploring'
]);

export const sourceEnum = pgEnum('source', [
  'Website', 
  'Referral', 
  'Walk-in', 
  'Call', 
  'Other'
]);

export const statusEnum = pgEnum('status', [
  'New', 
  'Qualified', 
  'Contacted', 
  'Visited', 
  'Negotiation', 
  'Converted', 
  'Dropped'
]);

// Buyers table (aka leads)
export const buyers = pgTable('buyers', {
  id: uuid('id').defaultRandom().primaryKey(),
  fullName: varchar('full_name', { length: 80 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 15 }).notNull(),
  city: cityEnum('city').notNull(),
  propertyType: propertyTypeEnum('property_type').notNull(),
  bhk: bhkEnum('bhk'), // Optional for non-residential
  purpose: purposeEnum('purpose').notNull(),
  budgetMin: integer('budget_min'), // Optional, in INR
  budgetMax: integer('budget_max'), // Optional, in INR
  timeline: timelineEnum('timeline').notNull(),
  source: sourceEnum('source').notNull(),
  status: statusEnum('status').notNull().default('New'),
  notes: text('notes'), // Optional, ≤ 1,000 chars (enforced in Zod)
  tags: jsonb('tags').$type<string[]>().default([]), // String array
  attachmentUrl: varchar('attachment_url', { length: 500 }), // Optional document URL from Cloudinary
  ownerId: varchar('owner_id', { length: 255 }).notNull(), // User ID from auth
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Buyer history table for tracking changes
export const buyerHistory = pgTable('buyer_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  buyerId: uuid('buyer_id').references(() => buyers.id, { onDelete: 'cascade' }).notNull(),
  changedBy: varchar('changed_by', { length: 255 }).notNull(), // User ID
  changedByName: varchar('changed_by_name', { length: 255 }).notNull(), // User display name (for UI)
  changedAt: timestamp('changed_at').defaultNow().notNull(),
  field: varchar('field', { length: 100 }).notNull(), // Which field was changed (for better UX)
  oldValue: text('old_value'), // Previous value (for display)
  newValue: text('new_value'), // New value (for display) 
  attachmentUrl: varchar('attachment_url', { length: 500 }), // Optional document URL from Cloudinary
  diff: jsonb('diff'), // Complete diff object for changes
});

// Type exports for TypeScript
export type Buyer = typeof buyers.$inferSelect;
export type NewBuyer = typeof buyers.$inferInsert;
export type BuyerHistory = typeof buyerHistory.$inferSelect;
export type NewBuyerHistory = typeof buyerHistory.$inferInsert;

// Enum type exports
export type City = typeof cityEnum.enumValues[number];
export type PropertyType = typeof propertyTypeEnum.enumValues[number];
export type BHK = typeof bhkEnum.enumValues[number];
export type Purpose = typeof purposeEnum.enumValues[number];
export type Timeline = typeof timelineEnum.enumValues[number];
export type Source = typeof sourceEnum.enumValues[number];
export type Status = typeof statusEnum.enumValues[number];
