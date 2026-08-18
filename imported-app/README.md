# Nestia RW Workshop Management System

A comprehensive, production-ready web application for managing custom furniture workshop operations. Built with React, Vite, Tailwind CSS, and Supabase.

## Features

### Role-Based Access Control
- **Assistant**: Manage customers, create projects, assign carpenters and cleaners, coordinate production
- **Carpenter**: View assigned projects, track production progress, upload progress images/videos
- **Cleaner**: View assigned projects, manage finishing work, upload finishing progress
- **Boss**: Full visibility across all projects, statistics, and team performance

### Core Functionality
- **Customer Management**: Create and manage customer profiles
- **Project Creation**: Comprehensive project setup with design uploads
- **Production Workflow**: Controlled status transitions from new to delivered
- **File Management**: Secure design images, progress photos, and videos
- **Project Timeline**: Complete visual history of all project updates
- **Notifications**: In-app notifications and email service architecture
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

## Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS with custom furniture-inspired theme
- **Routing**: React Router v6
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage (private buckets)
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Forms**: React Hook Form

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── DashboardCard.jsx
│   ├── StatusBadge.jsx
│   ├── ProtectedRoute.jsx
│   ├── LoadingSkeleton.jsx
│   ├── EmptyState.jsx
│   └── ErrorState.jsx
├── layouts/            # Layout components
│   └── DashboardLayout.jsx
├── pages/             # Public pages
│   └── Login.jsx
├── auth/              # Authentication-related
├── assistant/         # Assistant features
│   ├── AssistantDashboard.jsx
│   ├── CustomerCreation.jsx
│   ├── ProjectCreation.jsx
│   └── ProjectDetails.jsx
├── carpenter/         # Carpenter features
│   ├── CarpenterDashboard.jsx
│   └── CarpenterProjectPage.jsx
├── cleaner/           # Cleaner features
│   ├── CleanerDashboard.jsx
│   └── CleanerProjectPage.jsx
├── boss/              # Boss features
│   └── BossDashboard.jsx
├── services/          # Business logic services
│   ├── emailService.js
│   └── notificationService.js
├── lib/               # Core libraries
│   ├── supabase.js
│   └── auth.js
├── hooks/             # Custom React hooks
├── utils/             # Utility functions
├── App.jsx            # Main app component
└── main.jsx           # Entry point
```

## Database Schema

### Tables

#### users
- `id` (UUID, Primary Key)
- `full_name` (text)
- `email` (text)
- `role` (text: assistant, carpenter, cleaner, boss)
- `created_at` (timestamp)

#### customers
- `id` (UUID, Primary Key)
- `name` (text)
- `phone` (text)
- `email` (text)
- `address` (text)
- `notes` (text)
- `created_at` (timestamp)

#### projects
- `id` (UUID, Primary Key)
- `customer_id` (UUID, Foreign Key)
- `title` (text)
- `furniture_type` (text)
- `description` (text)
- `textile` (text)
- `dimensions` (text)
- `color` (text)
- `quantity` (integer)
- `budget` (numeric)
- `status` (text: new, confirmed, assigned_to_carpenter, in_production, ready_for_finishing, finishing, ready_for_delivery, delivered, archived)
- `assigned_carpenter` (UUID, Foreign Key)
- `assigned_cleaner` (UUID, Foreign Key)
- `delivery_date` (date)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### project_updates
- `id` (UUID, Primary Key)
- `project_id` (UUID, Foreign Key)
- `uploaded_by` (UUID, Foreign Key)
- `message` (text)
- `media_url` (text)
- `media_type` (text: image, video)
- `created_at` (timestamp)

#### notifications (Optional - for future use)
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `title` (text)
- `message` (text)
- `type` (text: info, success, warning, error)
- `project_id` (UUID, Foreign Key, Optional)
- `read` (boolean)
- `created_at` (timestamp)

### Storage Buckets

- `customer-designs`: Private bucket for customer design/reference images
- `project-images`: Private bucket for progress photos
- `project-videos`: Private bucket for progress videos

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- Supabase account with project configured
- Existing database schema (do not recreate tables)

### Installation

1. **Clone the repository**
   ```bash
   cd nestia-workshop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

## Security Features

- **Authentication**: Supabase Auth with session management
- **Authorization**: Role-based access control with protected routes
- **RLS**: Database Row Level Security policies enforced
- **Private Storage**: All file buckets are private with signed URLs
- **No Service Keys**: Only anon keys used in frontend
- **Input Validation**: Form validation on all user inputs
- **Error Handling**: Comprehensive error states and user feedback

## Production Workflow

### Project Status Flow
```
new → confirmed → assigned_to_carpenter → in_production → ready_for_finishing → finishing → ready_for_delivery → delivered → archived
```

### Role Permissions
- **Assistant**: Can create customers/projects, assign staff, update any project status
- **Carpenter**: Can only access assigned projects, update production status
- **Cleaner**: Can only access assigned projects, update finishing status
- **Boss**: Full read access to all projects and data

## Testing Checklist

### Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials shows error
- [ ] Logout functionality works
- [ ] Session persists across page refreshes
- [ ] Expired sessions are handled

### Authorization
- [ ] Assistant can only access assistant routes
- [ ] Carpenter can only access carpenter routes
- [ ] Cleaner can only access cleaner routes
- [ ] Boss can only access boss routes
- [ ] Manual URL navigation to unauthorized routes is blocked

### Database Operations
- [ ] Create customer
- [ ] Create project with design uploads
- [ ] Update project status
- [ ] Assign carpenter to project
- [ ] Assign cleaner to project
- [ ] Create project updates
- [ ] Retrieve project history

### File Storage
- [ ] Upload customer design images
- [ ] Upload progress photos
- [ ] Upload progress videos
- [ ] Preview uploaded media
- [ ] Handle invalid file types
- [ ] Handle oversized files (50MB limit)
- [ ] Verify private storage access

### UI/UX
- [ ] Desktop layout works correctly
- [ ] Tablet layout works correctly
- [ ] Mobile layout works correctly
- [ ] Loading states display properly
- [ ] Empty states display properly
- [ ] Error states display properly
- [ ] Toast notifications work
- [ ] Forms validate correctly
- [ ] Tables are responsive

## Email Configuration (Future)

The application includes an email service architecture ready for integration with providers like Resend:

1. Install email provider SDK:
   ```bash
   npm install resend
   ```

2. Add environment variable:
   ```
   RESEND_API_KEY=your-resend-api-key
   ```

3. Configure the email service in `src/services/emailService.js`:
   ```javascript
   import { Resend } from 'resend';
   
   const resend = new Resend(process.env.RESEND_API_KEY);
   emailService.configure('resend', { resend });
   ```

## Troubleshooting

### Common Issues

**Authentication errors**
- Verify Supabase URL and anon key are correct
- Check that user exists in the `users` table
- Ensure RLS policies allow access

**Storage upload failures**
- Verify bucket names match exactly
- Check bucket RLS policies
- Ensure file sizes are within limits (50MB for videos)

**Route protection issues**
- Clear browser cache and localStorage
- Verify user role in database
- Check ProtectedRoute component logic

## Deployment

### Vercel
1. Connect repository to Vercel
2. Add environment variables
3. Deploy automatically on push

### Netlify
1. Connect repository to Netlify
2. Configure build command: `npm run build`
3. Add environment variables
4. Deploy automatically

### Manual Deployment
1. Build the project: `npm run build`
2. Upload `dist` folder to your hosting service
3. Configure environment variables on hosting platform

## Support

For issues or questions:
- Check the Supabase dashboard for database/storage issues
- Review browser console for JavaScript errors
- Verify network requests in browser dev tools
- Check environment variables are properly set

## License

Proprietary - Nestia RW
