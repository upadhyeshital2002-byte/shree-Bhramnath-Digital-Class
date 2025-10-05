// Authentication System
let currentUser = null;
let users = [];

// Initialize authentication
document.addEventListener('DOMContentLoaded', function() {
    loadUsers();
    setupDemoUsers();
});

// Load users from localStorage
function loadUsers() {
    const savedUsers = localStorage.getItem('school_users');
    if (savedUsers) {
        users = JSON.parse(savedUsers);
    }
}

// Save users to localStorage
function saveUsers() {
    localStorage.setItem('school_users', JSON.stringify(users));
}

// Setup demo users if none exist
function setupDemoUsers() {
    if (users.length === 0) {
        users = [
            {
                id: 'admin_001',
                name: 'Administrator',
                email: 'admin@school.com',
                password: 'admin123',
                role: 'admin',
                phone: '9876543210',
                createdAt: new Date().toISOString(),
                lastLogin: null
            },
            {
                id: 'teacher_001',
                name: 'Dr. Sarah Johnson',
                email: 'teacher@school.com',
                password: 'teacher123',
                role: 'teacher',
                phone: '9876543220',
                createdAt: new Date().toISOString(),
                lastLogin: null
            },
            {
                id: 'parent_001',
                name: 'John Doe',
                email: 'parent@school.com',
                password: 'parent123',
                role: 'parent',
                phone: '9876543230',
                createdAt: new Date().toISOString(),
                lastLogin: null
            }
        ];
        saveUsers();
    }
}

// Show authentication tab
function showAuthTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.auth-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[onclick="showAuthTab('${tab}')"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.auth-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tab}-content`).classList.add('active');

    // Clear alerts
    clearAlerts();
}

// Handle login
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showAlert('Please fill in all fields', 'error');
        return;
    }

    // Show loading state
    setLoadingState('login', true);

    // Simulate API call
    setTimeout(() => {
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Update last login
            user.lastLogin = new Date().toISOString();
            saveUsers();
            
            // Set current user
            currentUser = user;
            localStorage.setItem('current_user', JSON.stringify(user));
            
            showAlert('Login successful! Redirecting...', 'success');
            
            // Redirect to main application
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showAlert('Invalid email or password', 'error');
            setLoadingState('login', false);
        }
    }, 1000);
}

// Handle signup
function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value;
    const role = document.getElementById('signup-role').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    // Validation
    if (!name || !email || !phone || !role || !password || !confirmPassword) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'error');
        return;
    }
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        showAlert('An account with this email already exists', 'error');
        return;
    }

    // Show loading state
    setLoadingState('signup', true);

    // Simulate API call
    setTimeout(() => {
        const newUser = {
            id: generateUserId(),
            name: name,
            email: email,
            password: password,
            role: role,
            phone: phone,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };
        
        users.push(newUser);
        saveUsers();
        
        showAlert('Account created successfully! Please login.', 'success');
        
        // Reset form and switch to login
        document.getElementById('signup-form').reset();
        setLoadingState('signup', false);
        
        setTimeout(() => {
            showAuthTab('login');
            document.getElementById('login-email').value = email;
        }, 1500);
    }, 1000);
}

// Set loading state
function setLoadingState(form, loading) {
    const btn = document.getElementById(`${form}-btn`);
    const btnText = document.getElementById(`${form}-btn-text`);
    
    if (loading) {
        btn.disabled = true;
        btnText.innerHTML = '<span class="loading"></span>Please wait...';
    } else {
        btn.disabled = false;
        btnText.innerHTML = form === 'login' ? 'Sign In' : 'Create Account';
    }
}

// Show alert
function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Clear alerts
function clearAlerts() {
    document.getElementById('alert-container').innerHTML = '';
}

// Show forgot password
function showForgotPassword() {
    const email = prompt('Enter your email address to reset password:');
    if (email) {
        const user = users.find(u => u.email === email);
        if (user) {
            showAlert('Password reset instructions sent to your email', 'success');
        } else {
            showAlert('No account found with this email address', 'error');
        }
    }
}

// Generate user ID
function generateUserId() {
    const role = document.getElementById('signup-role').value;
    const timestamp = Date.now().toString().slice(-6);
    return `${role}_${timestamp}`;
}

// Check if user is logged in (for main app)
function checkAuth() {
    const savedUser = localStorage.getItem('current_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        return true;
    }
    return false;
}

// Logout function
function logout() {
    currentUser = null;
    localStorage.removeItem('current_user');
    window.location.href = 'login.html';
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Check user role
function hasRole(requiredRole) {
    if (!currentUser) return false;
    return currentUser.role === requiredRole || currentUser.role === 'admin';
}

// Show user info in header
function displayUserInfo() {
    if (currentUser) {
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            userInfo.innerHTML = `
                <span class="user-name">${currentUser.name}</span>
                <span class="user-role">(${currentUser.role})</span>
                <i class="fas fa-user-circle"></i>
                <div class="user-dropdown">
                    <button onclick="logout()" class="logout-btn">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            `;
        }
    }
}

// Password strength checker
function checkPasswordStrength(password) {
    const strength = {
        score: 0,
        feedback: []
    };
    
    if (password.length >= 8) strength.score++;
    else strength.feedback.push('At least 8 characters');
    
    if (/[a-z]/.test(password)) strength.score++;
    else strength.feedback.push('Lowercase letter');
    
    if (/[A-Z]/.test(password)) strength.score++;
    else strength.feedback.push('Uppercase letter');
    
    if (/[0-9]/.test(password)) strength.score++;
    else strength.feedback.push('Number');
    
    if (/[^A-Za-z0-9]/.test(password)) strength.score++;
    else strength.feedback.push('Special character');
    
    return strength;
}

// Format phone number
function formatPhoneNumber(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length >= 10) {
        value = value.substring(0, 10);
    }
    input.value = value;
}

// Add phone formatting to signup form
document.addEventListener('DOMContentLoaded', function() {
    const phoneInput = document.getElementById('signup-phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            formatPhoneNumber(this);
        });
    }
});

// Demo login shortcuts
function quickLogin(role) {
    const demos = {
        admin: { email: 'admin@school.com', password: 'admin123' },
        teacher: { email: 'teacher@school.com', password: 'teacher123' },
        parent: { email: 'parent@school.com', password: 'parent123' }
    };
    
    const demo = demos[role];
    if (demo) {
        document.getElementById('login-email').value = demo.email;
        document.getElementById('login-password').value = demo.password;
        document.getElementById('login-form').dispatchEvent(new Event('submit'));
    }
}
