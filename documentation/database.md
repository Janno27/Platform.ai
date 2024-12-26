# Setup AB Test Analyzer - Database Documentation

## Table Structure Overview

### Core Tables
1. **organizations**
   - Main table for companies/agencies
   - Stores basic organization information
   - Key fields: id (uuid), name, type (company/agency)

2. **ab_tests_summary**
   - Main source of truth for all AB tests
   - Stores current state of each test
   - Includes JSON fields for variations, roadmap, and expected results
   - Links to organization and user (owner, creator, modifier)

3. **test_versions**
   - Versioning system for AB tests
   - Keeps track of all changes
   - Allows rolling back to previous versions
   - Links to main test entry

4. **ab_tests_audit**
   - Tracks all modifications
   - Records who made changes and when
   - Stores detailed change information

## Initial Setup Steps

1. Create Base Types:
```sql
CREATE TYPE test_type AS ENUM ('ab_test', 'personalization', 'patch');
CREATE TYPE test_status AS ENUM ('draft', 'ready', 'running', 'completed', 'archived');
```

2. Setup Core Organization:
```sql
INSERT INTO organizations (
    id, 
    name, 
    type
) VALUES (
    '438779d0-bbf2-449f-9d58-cbf2e3e458aa',
    'Test Organization',
    'company'
);
```

3. Setup Test User Profile:
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY,
  name text,
  email text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

INSERT INTO profiles (
    id,
    name,
    email
) VALUES (
    '123e4567-e89b-12d3-a456-426614174000',
    'Test User',
    'test@example.com'
);
```

## Database Schema JSON Structure

### Variations JSON Structure
```json
{
  "variations": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "desktop_image_path": "string",
      "mobile_image_path": "string",
      "is_control": boolean,
      "order_index": number
    }
  ]
}
```

### Roadmap JSON Structure
```json
{
  "roadmap": [
    {
      "id": "string",
      "country_code": "string",
      "start_date": "timestamp",
      "status": "planned|running|completed|cancelled"
    }
  ]
}
```

### Expected Results JSON Structure
```json
{
  "expected_results": [
    {
      "kpi_name": "string",
      "improvement_percentage": number
    }
  ]
}
```

## Development Setup

### Environment Variables
Create a `.env` file with:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

### Test Data Setup
1. Create test organization
2. Create test user profile
3. Ensure foreign key constraints are satisfied

## Key Features Added
- Full versioning system for AB tests
- Audit trail for all modifications
- JSON storage for flexible data structures
- User tracking (owner, creator, modifier)
- Organization-based data segregation

## Next Steps
1. Implement proper authentication system
2. Add user roles and permissions
3. Create organization management interface
4. Implement version comparison features
5. Add data visualization components

## Notes
- Currently using test data for development
- Authentication is mocked for testing
- Organization and user data are hardcoded during development
- Future updates will include proper auth flow