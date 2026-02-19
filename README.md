# Charity and Faith Mission Management System

A comprehensive web-based management system designed for charitable organizations and faith-based communities with role-based access control.

## Features

### Authentication & Authorization
- **Multi-User Login System**: Secure login with role-based access control
- **Four User Roles**:
  - **Admin**: Full access to all modules with edit/delete permissions
  - **Genesis Service**: Access to members, visitors, tithes & offerings, attendance, events, and media
  - **Branch Co**: Access to members, visitors, tithes & offerings, and attendance
  - **Pastors Info**: Read-only access to all modules
- **Session Management**: Secure user sessions with automatic logout
- **Page-Level Access Control**: Restricted access based on user roles

### Core Functionality
- **Member Directory**: Manage member information, contact details, and engagement tracking
- **Visitor Management**: Track and follow up with visitors
- **Events Management**: Plan and organize organizational events
- **Tithes & Offerings**: Track financial contributions
- **Attendance Tracking**: Record service attendance across different groups
- **Prayer Requests**: Manage prayer requests and intercession
- **Sermon Library**: Archive sermons and teachings
- **Volunteer Management**: Coordinate volunteer activities
- **Administration**: Manage leaders and ministries
- **Analytics & Reports**: View statistics and growth metrics
- **Media Center**: Create graphics, posters, and visual materials
- **Settings**: Configure system preferences and manage data

### Technical Features
- **Role-Based Access Control (RBAC)**: Dynamic navigation and permissions based on user role
- **Multi-Page Architecture**: Each section has its own dedicated page for better organization
- **Firebase Integration**: Cloud-based data persistence with Firestore
- **Local Storage Fallback**: Works offline when Firebase is not configured
- **Responsive Design**: Mobile-friendly interface
- **Modern UI**: Gradient designs and intuitive navigation
- **Data Export/Import**: Backup and restore functionality
- **Theme Support**: Light and dark theme options
- **Read-Only Mode**: Disabled forms for users with view-only permissions

## Login & User Roles

### Getting Started

1. Navigate to the application URL
2. You will be automatically redirected to the login page (`login.html`)
3. Enter your credentials and select your role
4. Click "Login" to access the dashboard

### Demo Credentials

For testing purposes, use these credentials:

| Role | Username | Password | Access Level |
|------|----------|----------|--------------|
| **Admin** | admin | admin123 | Full access with edit/delete permissions |
| **Genesis Service** | genesis | genesis123 | Members, Visitors, Tithes, Attendance, Events, Media |
| **Branch Co** | branch | branch123 | Members, Visitors, Tithes, Attendance |
| **Pastors Info** | pastor | pastor123 | All modules (read-only) |

### Role Permissions

#### Admin
- **Access**: All modules (Members, Visitors, Analytics, Events, Tithes & Offerings, Admin, Attendance, Prayer Requests, Sermon Library, Volunteers, Media Center, Settings)
- **Permissions**: Full edit and delete permissions
- **Use Case**: System administrators and senior leadership

#### Genesis Service
- **Access**: Members, Visitors, Tithes & Offerings, Attendance, Events, Media Center
- **Permissions**: Full edit and delete permissions
- **Use Case**: Service coordinators and event managers

#### Branch Co
- **Access**: Members, Visitors, Tithes & Offerings, Attendance
- **Permissions**: Full edit and delete permissions
- **Use Case**: Branch coordinators with limited administrative access

#### Pastors Info
- **Access**: All modules (same as Admin)
- **Permissions**: Read-only (no edit or delete)
- **Use Case**: Pastoral staff who need to view all information but not modify it

### Security Features

- **Session-Based Authentication**: User sessions are stored securely in localStorage
- **Page-Level Protection**: Unauthorized access attempts redirect to dashboard with alert
- **Automatic Logout**: Users can securely logout from any page
- **Role Verification**: Each page verifies user permissions before loading

## Firebase Setup

To enable Firebase cloud synchronization:

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add Project" and follow the setup wizard
   - Enable Firestore Database in your project

2. **Get Your Firebase Configuration**
   - In your Firebase project, go to Project Settings
   - Under "Your apps", create a Web app if you haven't already
   - Copy the Firebase configuration object

3. **Update firebase-config.js**
   - Open `firebase-config.js` in the root directory
   - Replace the placeholder values with your actual Firebase credentials:
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT.appspot.com",
       messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

4. **Set Up Firestore Security Rules**
   - In Firebase Console, go to Firestore Database > Rules
   - Update security rules as needed for your use case

## Installation & Usage

### Local Development
1. Clone the repository
2. Open `login.html` in a web browser to access the login page
3. Use the demo credentials to login with different roles
4. The application works immediately with local storage
5. Configure Firebase (optional) for cloud sync

### Deployment
- Deploy to any static web hosting service (Firebase Hosting, Netlify, GitHub Pages, etc.)
- No server-side code required
- All data is stored in Firebase or browser localStorage
- Ensure `login.html` is set as the landing page or index page

## Browser Compatibility
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- HTML5 Canvas support for Media Center

## Data Storage

### Without Firebase
- Data is stored in browser localStorage
- Data persists across sessions but is device-specific
- Use backup/restore feature to migrate data

### With Firebase
- Data is synchronized to Firestore cloud database
- Accessible from any device when logged in
- Real-time updates across devices
- Automatic persistence and backup

## Pages Overview

1. **Login** (`login.html`) - User authentication and role selection
2. **Dashboard** (`index.html`) - Main landing page with quick access to all features
3. **Members** (`pages/members.html`) - Member directory and management
4. **Visitors** (`pages/visitors.html`) - Visitor tracking and follow-up
5. **Analytics** (`pages/analytics.html`) - Statistics and growth metrics
6. **Events** (`pages/events.html`) - Event planning and management
7. **Tithes & Offerings** (`pages/tithes.html`) - Financial contributions tracking
8. **Admin** (`pages/admin.html`) - Leaders and ministries management
9. **Attendance** (`pages/attendance.html`) - Service attendance records
10. **Prayer Requests** (`pages/prayers.html`) - Prayer request management
11. **Sermon Library** (`pages/sermons.html`) - Sermon archiving
12. **Volunteers** (`pages/volunteers.html`) - Volunteer coordination
13. **Media Center** (`pages/media.html`) - Graphics creation tools
14. **Settings** (`pages/settings.html`) - System configuration

## Security Notes

- **Demo Credentials**: The current implementation uses hardcoded credentials for demonstration purposes only
- **Production Use**: For production, implement proper authentication with Firebase Authentication or a backend service
- Update Firebase security rules to restrict access appropriately
- Keep your Firebase configuration secure
- Regular backups recommended
- User sessions are stored in browser localStorage (consider more secure alternatives for production)
- Implement HTTPS for secure data transmission in production

## Support

For issues or questions, please refer to the Firebase documentation or create an issue in the repository.

## License

See LICENSE file for details.

## Version

2.0 - Multi-page architecture with Firebase integration
