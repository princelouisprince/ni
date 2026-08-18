# Setup Guide for Nestia Workshop Management System

## Quick Start

1. **Navigate to the project directory**
   ```bash
   cd nestia-workshop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Then edit `.env` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## Required Supabase Setup

### Database Tables
Ensure your Supabase project has these tables with the exact schema:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('assistant', 'carpenter', 'cleaner', 'boss')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  furniture_type TEXT NOT NULL,
  description TEXT NOT NULL,
  textile TEXT,
  dimensions TEXT,
  color TEXT,
  quantity INTEGER DEFAULT 1,
  budget NUMERIC,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'assigned_to_carpenter', 'in_production', 'ready_for_finishing', 'finishing', 'ready_for_delivery', 'delivered', 'archived')),
  assigned_carpenter UUID REFERENCES users(id) ON DELETE SET NULL,
  assigned_cleaner UUID REFERENCES users(id) ON DELETE SET NULL,
  delivery_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project updates table
CREATE TABLE project_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Storage Buckets
Create these private storage buckets in Supabase:

1. `customer-designs` - For customer design/reference images
2. `project-images` - For progress photos
3. `project-videos` - For progress videos

### RLS Policies
Enable Row Level Security and create appropriate policies. Here are basic examples:

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Customers table policies
CREATE POLICY "Staff can view all customers" ON customers FOR SELECT USING (true);
CREATE POLICY "Staff can create customers" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update customers" ON customers FOR UPDATE USING (true);

-- Projects table policies
CREATE POLICY "Staff can view all projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Staff can create projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Staff can update projects" ON projects FOR UPDATE USING (true);

-- Project updates policies
CREATE POLICY "Staff can view all updates" ON project_updates FOR SELECT USING (true);
CREATE POLICY "Staff can create updates" ON project_updates FOR INSERT WITH CHECK (true);
```

### Storage Policies
```sql
-- Enable RLS on storage
ALTER STORAGE customer-designs ENABLE ROW LEVEL SECURITY;
ALTER STORAGE project-images ENABLE ROW LEVEL SECURITY;
ALTER STORAGE project-videos ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to upload
CREATE POLICY "Authenticated can upload" ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to view
CREATE POLICY "Authenticated can view" ON storage.objects FOR SELECT USING (auth.role() = 'authenticated');
```

## Initial User Setup

Create initial users in the Supabase dashboard:

1. Go to Authentication > Users
2. Add users with these roles:
   - At least one user with role `assistant`
   - At least one user with role `carpenter`
   - At least one user with role `cleaner`
   - At least one user with role `boss`

3. For each user, also create a corresponding record in the `users` table with the same email and assigned role.

## Testing the Application

### Test Authentication
1. Try to login with each role
2. Verify you're redirected to the correct dashboard
3. Test logout functionality
4. Try to access unauthorized routes (should be blocked)

### Test Assistant Workflow
1. Create a new customer
2. Create a new project with design images
3. Assign a carpenter to the project
4. View project details and timeline

### Test Carpenter Workflow
1. Login as carpenter
2. View assigned projects
3. Start production on a project
4. Upload progress images/videos
5. Mark project as ready for finishing

### Test Cleaner Workflow
1. Login as cleaner
2. View assigned projects
3. Start finishing on a project
4. Upload finishing progress
5. Mark project as ready for delivery

### Test Boss Dashboard
1. Login as boss
2. View all projects and statistics
3. Filter projects by status
4. View upcoming deliveries

## Troubleshooting

### "Missing Supabase environment variables"
- Ensure `.env` file exists in the project root
- Verify variables are named exactly: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart the development server after adding variables

### "Authentication failed"
- Verify Supabase URL is correct
- Check that anon key is valid
- Ensure user exists in both Auth and users table
- Check browser console for specific error messages

### "Permission denied" errors
- Verify RLS policies are set up correctly
- Check that user has the correct role in the users table
- Ensure storage buckets have proper policies

### File upload failures
- Verify bucket names match exactly
- Check file size limits (50MB for videos)
- Ensure storage RLS policies allow uploads
- Check browser console for specific errors

## Development Tips

- The app uses hot reload, so changes appear automatically
- Check browser console for errors during development
- Use React DevTools for debugging component state
- Use Supabase dashboard to monitor database and storage activity
- Test responsive design using browser dev tools device emulation

## Production Deployment

When deploying to production:

1. Set environment variables in your hosting platform
2. Build the project: `npm run build`
3. Upload the `dist` folder
4. Configure your domain and SSL
5. Test the production environment thoroughly
6. Set up monitoring and error tracking

## Need Help?

- Check the main README.md for detailed documentation
- Review the Supabase documentation for database/storage issues
- Check browser console and network tab for debugging
- Verify all environment variables are set correctly
