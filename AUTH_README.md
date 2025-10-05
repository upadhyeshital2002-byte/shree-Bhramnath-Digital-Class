# Authentication System - Bhramnath Digital Class

## Overview
The authentication system provides secure login and signup functionality for the school management system with role-based access control.

## Files Structure
- `login.html` - Login and signup page
- `auth.js` - Authentication logic and user management
- `index.html` - Main application (protected)
- `script.js` - Main application logic with permission checks

## Features

### 🔐 **Authentication Features**
- **Secure Login**: Email and password authentication
- **User Registration**: New user signup with role selection
- **Session Management**: Persistent login sessions
- **Password Validation**: Minimum 6 characters with strength checking
- **Demo Credentials**: Pre-configured demo accounts for testing

### 👥 **User Roles**
1. **Administrator (Admin)**
   - Full access to all modules
   - Can manage all school operations
   - Access to fee management and teacher management

2. **Teacher**
   - Access to student management, classes, attendance
   - Can create and manage exams
   - Access to communication and library modules
   - Cannot access fee management or teacher management

3. **Parent**
   - Limited access to parent portal only
   - Can view student information and reports
   - Cannot access administrative functions

### 🛡️ **Security Features**
- **Role-based Access Control**: Different permissions for different roles
- **Session Validation**: Automatic logout if session expires
- **Password Protection**: Secure password storage and validation
- **Input Validation**: Comprehensive form validation
- **Protected Routes**: Automatic redirection for unauthorized access

## Demo Credentials

### Administrator
- **Email**: admin@school.com
- **Password**: admin123
- **Access**: Full system access

### Teacher
- **Email**: teacher@school.com
- **Password**: teacher123
- **Access**: Teaching modules only

### Parent
- **Email**: parent@school.com
- **Password**: parent123
- **Access**: Parent portal only

## How to Use

### 1. **Login Process**
1. Open `login.html` in your browser
2. Enter email and password
3. Click "Sign In" or use demo credentials
4. System redirects to main application

### 2. **Signup Process**
1. Click "Sign Up" tab on login page
2. Fill in all required information:
   - Full Name
   - Email Address
   - Phone Number
   - Role (Admin/Teacher/Parent)
   - Password (minimum 6 characters)
   - Confirm Password
3. Click "Create Account"
4. Login with new credentials

### 3. **Navigation**
- **Admin Users**: See all modules in navigation
- **Teachers**: See teaching-related modules only
- **Parents**: See only parent portal

### 4. **User Management**
- Click on user avatar in header to access profile
- View user information and last login
- Logout option available in dropdown

## Technical Implementation

### **Authentication Flow**
1. User enters credentials
2. System validates against stored users
3. Creates session and stores user data
4. Redirects to main application
5. Main app checks authentication on load

### **Permission System**
- **Module-level**: Hide entire modules based on role
- **Button-level**: Hide specific action buttons
- **Function-level**: Check permissions before executing functions

### **Data Storage**
- **Local Storage**: User sessions and application data
- **User Management**: Stored users with roles and permissions
- **Session Persistence**: Login state maintained across browser sessions

## Customization

### **Adding New Roles**
1. Update role options in `login.html`
2. Add role permissions in `script.js` `checkUserPermissions()`
3. Define button permissions in `hideUnauthorizedButtons()`

### **Modifying Permissions**
Edit the `modules` object in `checkUserPermissions()`:
```javascript
const modules = {
    'students': ['admin', 'teacher'],
    'fees': ['admin'], // Only admins can access fees
    // Add new modules here
};
```

### **Adding Demo Users**
Update the `setupDemoUsers()` function in `auth.js`:
```javascript
users = [
    {
        id: 'new_user_001',
        name: 'New User',
        email: 'newuser@school.com',
        password: 'password123',
        role: 'teacher',
        // ... other fields
    }
];
```

## Security Considerations

### **Current Implementation**
- Client-side authentication (for demo purposes)
- Local storage for data persistence
- Basic password validation

### **Production Recommendations**
- Implement server-side authentication
- Use secure password hashing (bcrypt)
- Add JWT tokens for session management
- Implement HTTPS for secure communication
- Add rate limiting for login attempts
- Implement password reset functionality

## Troubleshooting

### **Common Issues**
1. **Login not working**: Check email/password combination
2. **Access denied**: Verify user role has required permissions
3. **Session expired**: Re-login required
4. **Form validation errors**: Check all required fields are filled

### **Browser Compatibility**
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## File Structure
```
├── login.html          # Authentication page
├── auth.js            # Authentication logic
├── index.html         # Main application
├── script.js          # Application logic
├── styles.css         # Styling
└── AUTH_README.md     # This documentation
```

## Support
For technical support or questions about the authentication system, refer to the main README.md file or contact the development team.
