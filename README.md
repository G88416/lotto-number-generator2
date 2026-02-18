# Charity and Faith Mission Management System

A comprehensive web-based management system designed for charitable organizations and faith-based communities.

## Features

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
- **Multi-Page Architecture**: Each section has its own dedicated page for better organization
- **Firebase Integration**: Cloud-based data persistence with Firestore
- **Local Storage Fallback**: Works offline when Firebase is not configured
- **Responsive Design**: Mobile-friendly interface
- **Modern UI**: Gradient designs and intuitive navigation
- **Data Export/Import**: Backup and restore functionality
- **Theme Support**: Light and dark theme options

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
2. Open `index.html` in a web browser
3. The application works immediately with local storage
4. Configure Firebase (optional) for cloud sync

### Deployment
- Deploy to any static web hosting service (Firebase Hosting, Netlify, GitHub Pages, etc.)
- No server-side code required
- All data is stored in Firebase or browser localStorage

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

1. **Dashboard** (`index.html`) - Main landing page with quick access to all features
2. **Members** (`pages/members.html`) - Member directory and management
3. **Visitors** (`pages/visitors.html`) - Visitor tracking and follow-up
4. **Analytics** (`pages/analytics.html`) - Statistics and growth metrics
5. **Events** (`pages/events.html`) - Event planning and management
6. **Tithes & Offerings** (`pages/tithes.html`) - Financial contributions tracking
7. **Admin** (`pages/admin.html`) - Leaders and ministries management
8. **Attendance** (`pages/attendance.html`) - Service attendance records
9. **Prayer Requests** (`pages/prayers.html`) - Prayer request management
10. **Sermon Library** (`pages/sermons.html`) - Sermon archiving
11. **Volunteers** (`pages/volunteers.html`) - Volunteer coordination
12. **Media Center** (`pages/media.html`) - Graphics creation tools
13. **Settings** (`pages/settings.html`) - System configuration

## Security Notes

- Update Firebase security rules to restrict access appropriately
- Consider implementing Firebase Authentication for user management
- Keep your Firebase configuration secure
- Regular backups recommended

## Support

For issues or questions, please refer to the Firebase documentation or create an issue in the repository.

## License

See LICENSE file for details.

## Version

2.0 - Multi-page architecture with Firebase integration
