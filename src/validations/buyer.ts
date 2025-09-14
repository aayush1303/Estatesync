import { z } from "zod";

const phoneRegex = /^\d{10,15}$/;

export const buyerSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Full name must not exceed 80 characters"),
  
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  
  phone: z
    .string()
    .regex(phoneRegex, "Phone must be 10-15 digits only")
    .min(10, "Phone must be at least 10 digits")
    .max(15, "Phone must not exceed 15 digits"),
  
  city: z.enum(["Chandigarh", "Mohali", "Zirakpur", "Panchkula", "Other"]),
  
  propertyType: z.enum(["Apartment", "Villa", "Plot", "Office", "Retail"]),
  
  bhk: z.enum(["1", "2", "3", "4", "Studio"]).optional(),
  
  purpose: z.enum(["Buy", "Rent"]),
  
  budgetMin: z.coerce.number().int().positive().optional(),
  
  budgetMax: z.coerce.number().int().positive().optional(),
  
  timeline: z.enum(["0-3m", "3-6m", ">6m", "Exploring"]),
  
  source: z.enum(["Website", "Referral", "Walk-in", "Call", "Other"]),
  
  status: z.enum([
    "New", 
    "Qualified", 
    "Contacted", 
    "Visited", 
    "Negotiation", 
    "Converted", 
    "Dropped"
  ]).default("New"),
  
  notes: z
    .string()
    .max(1000, "Notes must not exceed 1000 characters")
    .optional(),
  
  tags: z.array(z.string()).default([]),
  
  attachmentUrl: z
    .string()
    .url("Invalid attachment URL")
    .optional()
    .or(z.literal("")),
}).refine(
  (data) => {
    // BHK required only for residential properties
    if ((data.propertyType === "Apartment" || data.propertyType === "Villa") && !data.bhk) {
      return false;
    }
    return true;
  },
  {
    message: "BHK is required for Apartment and Villa properties",
    path: ["bhk"],
  }
).refine(
  (data) => {
    // Budget max should be >= budget min when both present
    if (data.budgetMin && data.budgetMax && data.budgetMax < data.budgetMin) {
      return false;
    }
    return true;
  },
  {
    message: "Budget maximum must be greater than or equal to minimum",
    path: ["budgetMax"],
  }
);

export type BuyerFormData = z.infer<typeof buyerSchema>;

// Schema for creating buyer (includes ownerId)
export const createBuyerSchema = buyerSchema.safeExtend({
  ownerId: z.string().min(1, "Owner ID is required"),
});

export type CreateBuyerData = z.infer<typeof createBuyerSchema>;
