# CRM Lead Management System

A modern buyer lead management system built with Next.js, designed for real estate professionals to capture, manage, and track potential buyers with comprehensive validation, search capabilities, and CSV import/export functionality.

## Live Demo

[View Live Application](https://estatesync.vercel.app) *(Update with your actual deployment URL)*

## Features

### Must-Have Features ✅
- **Lead Management**: Create, view, edit, and list buyer leads
- **Advanced Search & Filtering**: Search by name/phone/email with filters for city, property type, status, and timeline  
- **CSV Import/Export**: Bulk import up to 200 leads with validation, export filtered results
- **Authentication & Authorization**: Clerk-based auth with ownership enforcement
- **Real-time Validation**: Client and server-side validation using Zod
- **Audit Trail**: Complete history tracking of all lead changes
- **Responsive Design**: Mobile-first UI with accessibility features
- **Rate Limiting**: API protection against abuse
- **Error Handling**: Comprehensive error boundaries and user feedback

### Nice-to-Have Features Implemented ✅
- **Tag Management**: Smart tag chips with typeahead suggestions
- **File Upload**: Cloudinary integration for document attachments
- **Concurrency Control**: Optimistic updates with conflict detection
- **Admin System**: Role-based permissions for enhanced management

## 🏗️ Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk
- **Validation**: Zod
- **UI**: Tailwind CSS + Shadcn/ui components
- **File Storage**: Cloudinary
- **Testing**: Jest + React Testing Library
- **Deployment**: Vercel-ready

## 📊 Data Model

### Buyers Table
```typescript
{
  id: UUID (primary key)
  fullName: string (2-80 chars)
  email?: string (optional, validated)
  phone: string (10-15 digits, required)
  city: enum (Chandigarh|Mohali|Zirakpur|Panchkula|Other)
  propertyType: enum (Apartment|Villa|Plot|Office|Retail)
  bhk?: enum (1|2|3|4|Studio) // Required only for Apartment/Villa
  purpose: enum (Buy|Rent)
  budgetMin?: number (INR)
  budgetMax?: number (INR, must be ≥ budgetMin)
  timeline: enum (0-3m|3-6m|>6m|Exploring)
  source: enum (Website|Referral|Walk-in|Call|Other)
  status: enum (New|Qualified|Contacted|Visited|Negotiation|Converted|Dropped)
  notes?: string (≤1000 chars)
  tags: string[]
  attachmentUrl?: string
  ownerId: string (user ID)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### Buyer History Table
```typescript
{
  id: UUID
  buyerId: UUID (foreign key)
  changedBy: string (user ID)
  changedByName: string
  changedAt: timestamp
  field: string
  oldValue: string
  newValue: string
  diff: JSON (complete change object)
}
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Clerk account
- Cloudinary account (for file uploads)

### Environment Variables
Create a `.env.local` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/crm_db"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"

# Admin Configuration (optional)
ADMIN_USER_IDS="user_123,user_456" # Comma-separated list of admin user IDs
```

### Installation & Setup

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo-url>
   cd crm
   npm install
   ```

2. **Database setup**
   ```bash
   # Generate migrations
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Or push schema directly (development)
   npm run db:push
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Run tests**
   ```bash
   npm test
   ```

Visit `http://localhost:3000` to access the application.

## 📝 CSV Import Format

When importing leads via CSV, use this exact header format:

```csv
fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,notes,tags,status
```

### Example CSV Row:
```csv
John Doe,john@example.com,9876543210,Chandigarh,Apartment,2,Buy,5000000,7000000,0-3m,Website,"Looking for 2BHK in Sector 22","urgent,verified",New
```

### CSV Validation Rules:
- **fullName**: Required, 2-80 characters
- **email**: Optional, must be valid email format
- **phone**: Required, 10-15 digits only
- **city**: Must be one of: Chandigarh, Mohali, Zirakpur, Panchkula, Other
- **propertyType**: Must be one of: Apartment, Villa, Plot, Office, Retail
- **bhk**: Required for Apartment/Villa, one of: 1, 2, 3, 4, Studio
- **purpose**: Must be: Buy or Rent
- **budgetMin/budgetMax**: Optional integers, max ≥ min if both provided
- **timeline**: Must be one of: 0-3m, 3-6m, >6m, Exploring
- **source**: Must be one of: Website, Referral, Walk-in, Call, Other
- **tags**: Comma-separated list of tags
- **status**: Must be one of: New, Qualified, Contacted, Visited, Negotiation, Converted, Dropped

## Architecture & Design Decisions

### Validation Strategy
- **Client-side**: React Hook Form + Zod for immediate feedback
- **Server-side**: Zod validation on all API routes for security
- **Database**: Schema constraints as final validation layer

### Authentication & Authorization  
- **Authentication**: Clerk handles user management and sessions
- **Authorization**: Owner-based access control (users see only their leads)
- **Admin System**: Environment-based admin configuration with elevated permissions

### Performance Optimizations
- **SSR**: Server-side rendering with real pagination (10 items/page)
- **Debounced Search**: 300ms delay to reduce API calls
- **Rate Limiting**: In-memory limiter (production should use Redis)
- **Optimistic Updates**: Immediate UI feedback with rollback on conflicts

### Error Handling
- **Error Boundaries**: React error boundaries catch rendering errors
- **API Errors**: Consistent error responses with proper HTTP status codes  
- **User Feedback**: Toast notifications for all user actions
- **Concurrency**: Timestamp-based conflict detection for edit operations

## Testing

The project includes comprehensive unit tests for critical functionality:

```bash
# Run all tests
npm test

# Run tests in watch mode  
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage:
- ✅ Buyer validation logic (budget constraints, BHK requirements)
- ✅ CSV row validation and error handling
- ✅ Rate limiting functionality
- ✅ Error boundary behavior

## 📦 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on git push

### Database Considerations
- Use managed PostgreSQL (Supabase, Neon, or Railway)
- Run migrations after deployment: `npm run db:migrate`
- Consider connection pooling for production traffic

## 🔄 API Rate Limits

- **Create Lead**: 10 requests per minute per user/IP
- **Update Lead**: 20 requests per minute per user/IP  
- **General API**: Standard rate limiting applied

## ♿ Accessibility Features

- **Keyboard Navigation**: Full keyboard support for all interactive elements
- **ARIA Labels**: Proper labeling for screen readers
- **Focus Management**: Visible focus indicators and logical tab order
- **Form Validation**: Screen reader announcements for validation errors
- **Color Contrast**: WCAG AA compliant color combinations

## 🎯 Future Enhancements

### Potential Improvements:
- **Full-text Search**: PostgreSQL full-text search on name, email, notes
- **Advanced Filters**: Date range filtering, budget range sliders
- **Bulk Operations**: Bulk status updates, bulk assignment
- **Integration**: CRM integrations (Salesforce, HubSpot)
- **Analytics**: Lead conversion dashboards and reporting
- **Mobile App**: React Native companion app
- **Real-time Updates**: WebSocket-based live updates

## 📄 License

This project is licensed under the MIT License.
