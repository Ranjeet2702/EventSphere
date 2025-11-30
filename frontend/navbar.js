// Modern Navbar Component for EventSphere
function createNavbar() {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('name') || 'User';
    const userRole = localStorage.getItem('role') || 'student';
    const userEmail = localStorage.getItem('email') || '';

    if (!token) {
        // Public navbar for non-authenticated users
        return `
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center h-16">
                    <!-- Logo -->
                    <div class="flex items-center">
                        <a href="index.html" class="flex items-center space-x-2">
                            <div class="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                                <i class="bi bi-calendar-event text-white text-lg"></i>
                            </div>
                            <span class="text-xl font-bold gradient-text">EventSphere</span>
                        </a>
                    </div>

                    <!-- Navigation Links -->
                    <div class="hidden md:flex items-center space-x-8">
                        <a href="index.html" class="text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                            Events
                        </a>
                        <a href="about.html" class="text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                            About
                        </a>
                        <a href="team.html" class="text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                            Our Team
                        </a>
                        <a href="contact.html" class="text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                            Contact
                        </a>
                    </div>

                    <!-- Auth Buttons -->
                    <div class="flex items-center space-x-4">
                        <a href="login.html" class="text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                            Sign In
                        </a>
                        <a href="signup.html" class="gradient-bg text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
                            Get Started
                        </a>
                    </div>

                    <!-- Mobile menu button -->
                    <div class="md:hidden">
                        <button type="button" class="text-gray-700 hover:text-primary transition-colors duration-300" onclick="toggleMobileMenu()">
                            <i class="bi bi-list text-2xl"></i>
                        </button>
                    </div>
                </div>

                <!-- Mobile menu -->
                <div class="md:hidden hidden" id="mobileMenu">
                    <div class="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
                        <a href="index.html" class="block px-3 py-2 text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                            Events
                        </a>
                        <a href="about.html" class="block px-3 py-2 text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                            About
                        </a>
                        <a href="team.html" class="block px-3 py-2 text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                            Our Team
                        </a>
                        <a href="contact.html" class="block px-3 py-2 text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                            Contact
                        </a>
                        <div class="border-t border-gray-200 pt-4 mt-4">
                            <a href="login.html" class="block px-3 py-2 text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                                Sign In
                            </a>
                            <a href="signup.html" class="block px-3 py-2 mt-2 gradient-bg text-white rounded-xl font-semibold text-center">
                                Get Started
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Authenticated user navbar
    const dashboardLinks = {
        admin: { url: 'admin-dashborad.html', label: 'Admin Dashboard' },
        club: { url: 'club-dashborad.html', label: 'Club Dashboard' },
        student: { url: 'student-dashboard.html', label: 'Dashboard' }
    };

    const currentDashboard = dashboardLinks[userRole] || dashboardLinks.student;

    return `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <!-- Logo -->
                <div class="flex items-center">
                    <a href="${currentDashboard.url}" class="flex items-center space-x-2">
                        <div class="w-8 h-8 gradient-bg rounded-lg flex items-center justify-center">
                            <i class="bi bi-calendar-event text-white text-lg"></i>
                        </div>
                        <span class="text-xl font-bold gradient-text">EventSphere</span>
                    </a>
                </div>

                <!-- Navigation Links -->
                <div class="hidden md:flex items-center space-x-8">
                    <a href="${currentDashboard.url}" class="text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                        ${currentDashboard.label}
                    </a>
                    <a href="index.html" class="text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                        Events
                    </a>
                    <a href="profile.html" class="text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                        Profile
                    </a>
                    <a href="about.html" class="text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                        About
                    </a>
                    <a href="team.html" class="text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                        Our Team
                    </a>
                    <a href="contact.html" class="text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                        Contact
                    </a>
                    ${userRole === 'admin' ? `
                        <a href="analytics.html" class="text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                            Analytics
                        </a>
                    ` : ''}
                </div>

                <!-- User Menu -->
                <div class="flex items-center space-x-4">
                    <!-- Notification Bell -->
                    <div class="relative">
                        <button class="relative p-2 text-gray-700 hover:text-primary transition-colors duration-300" 
                                type="button" 
                                id="notificationBtn" 
                                onclick="toggleNotificationDropdown()">
                            <i class="bi bi-bell text-xl"></i>
                            <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center hidden" id="notification-badge">
                                0
                            </span>
                        </button>
                        
                        <!-- Notification Dropdown -->
                        <div class="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 hidden" id="notificationDropdown">
                            <div class="p-4 border-b border-gray-200">
                                <div class="flex items-center justify-between">
                                    <h3 class="text-lg font-semibold text-text">Notifications</h3>
                                    <button onclick="markAllNotificationsRead()" class="text-sm text-primary hover:text-primary/80 transition-colors duration-300">
                                        Mark all read
                                    </button>
                                </div>
                            </div>
                            <div class="max-h-96 overflow-y-auto" id="notificationList">
                                <div class="p-4 text-center text-gray-500">
                                    <i class="bi bi-bell text-2xl mb-2"></i>
                                    <p>No notifications yet</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- User Profile Dropdown -->
                    <div class="relative">
                        <button class="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-300" 
                                type="button" 
                                onclick="toggleUserDropdown()">
                            <div class="w-8 h-8 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center">
                                <span class="text-white font-semibold text-sm">${userName.charAt(0).toUpperCase()}</span>
                            </div>
                            <div class="hidden md:block text-left">
                                <p class="text-sm font-semibold text-text">${userName}</p>
                                <p class="text-xs text-gray-500">${userRole.charAt(0).toUpperCase() + userRole.slice(1)}</p>
                            </div>
                            <i class="bi bi-chevron-down text-gray-400"></i>
                        </button>
                        
                        <!-- User Dropdown Menu -->
                        <div class="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 hidden" id="userDropdown">
                            <div class="py-2">
                                <div class="px-4 py-3 border-b border-gray-200">
                                    <p class="text-sm font-semibold text-text">${userName}</p>
                                    <p class="text-xs text-gray-500">${userEmail}</p>
                                </div>
                                <a href="profile.html" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-300">
                                    <i class="bi bi-person mr-3"></i>
                                    Profile
                                </a>
                                <a href="index.html" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-300">
                                    <i class="bi bi-calendar-event mr-3"></i>
                                    Events
                                </a>
                                ${userRole === 'admin' ? `
                                    <a href="analytics.html" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-300">
                                        <i class="bi bi-graph-up mr-3"></i>
                                        Analytics
                                    </a>
                                ` : ''}
                                <div class="border-t border-gray-200 mt-2">
                                    <button onclick="logout()" class="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-300">
                                        <i class="bi bi-box-arrow-right mr-3"></i>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Mobile menu button -->
                    <div class="md:hidden">
                        <button type="button" class="text-gray-700 hover:text-primary transition-colors duration-300" onclick="toggleMobileMenu()">
                            <i class="bi bi-list text-2xl"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Mobile menu -->
            <div class="md:hidden hidden" id="mobileMenu">
                <div class="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
                    <a href="${currentDashboard.url}" class="block px-3 py-2 text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                        ${currentDashboard.label}
                    </a>
                    <a href="index.html" class="block px-3 py-2 text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                        Events
                    </a>
                    <a href="profile.html" class="block px-3 py-2 text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                        Profile
                    </a>
                    <a href="about.html" class="block px-3 py-2 text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                        About
                    </a>
                    <a href="team.html" class="block px-3 py-2 text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                        Our Team
                    </a>
                    <a href="contact.html" class="block px-3 py-2 text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                        Contact
                    </a>
                    ${userRole === 'admin' ? `
                        <a href="analytics.html" class="block px-3 py-2 text-gray-700 hover:text-primary transition-colors duration-300 font-medium">
                            Analytics
                        </a>
                    ` : ''}
                    <div class="border-t border-gray-200 pt-4 mt-4">
                        <div class="px-3 py-2">
                            <p class="text-sm font-semibold text-text">${userName}</p>
                            <p class="text-xs text-gray-500">${userEmail}</p>
                        </div>
                        <button onclick="logout()" class="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 transition-colors duration-300 font-medium">
                            <i class="bi bi-box-arrow-right mr-2"></i>
                            Sign Out
                        </button>
                    </div>
                </div>
                </div>
            </div>
    `;
}

// Dropdown toggle functions
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

function toggleUserDropdown() {
    const userDropdown = document.getElementById('userDropdown');
    const notificationDropdown = document.getElementById('notificationDropdown');
    
    if (userDropdown) {
        userDropdown.classList.toggle('hidden');
    }
    
    // Close notification dropdown if open
    if (notificationDropdown && !notificationDropdown.classList.contains('hidden')) {
        notificationDropdown.classList.add('hidden');
    }
}

function toggleNotificationDropdown() {
    const notificationDropdown = document.getElementById('notificationDropdown');
    const userDropdown = document.getElementById('userDropdown');
    
    if (notificationDropdown) {
        notificationDropdown.classList.toggle('hidden');
        
        // Load notifications when dropdown is opened
        if (!notificationDropdown.classList.contains('hidden') && window.notificationSystem) {
            window.notificationSystem.loadNotifications();
        }
    }
    
    // Close user dropdown if open
    if (userDropdown && !userDropdown.classList.contains('hidden')) {
        userDropdown.classList.add('hidden');
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    const userDropdown = document.getElementById('userDropdown');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const mobileMenu = document.getElementById('mobileMenu');
    
    // Close user dropdown
    if (userDropdown && !userDropdown.contains(event.target) && !event.target.closest('[onclick*="toggleUserDropdown"]')) {
        userDropdown.classList.add('hidden');
    }
    
    // Close notification dropdown
    if (notificationDropdown && !notificationDropdown.contains(event.target) && !event.target.closest('[onclick*="toggleNotificationDropdown"]')) {
        notificationDropdown.classList.add('hidden');
    }
    
    // Close mobile menu
    if (mobileMenu && !mobileMenu.contains(event.target) && !event.target.closest('[onclick*="toggleMobileMenu"]')) {
        mobileMenu.classList.add('hidden');
    }
});

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    window.location.href = 'login.html';
}

// Initialize navbar
document.addEventListener('DOMContentLoaded', function() {
    const navbarContainer = document.getElementById('navbar-container');
    if (navbarContainer) {
        navbarContainer.innerHTML = createNavbar();
    }
});

// Update notification badge
function updateNotificationBadge(count) {
    const badge = document.getElementById('notification-badge');
    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

// Mark all notifications as read
async function markAllNotificationsRead() {
    if (window.notificationSystem) {
        await window.notificationSystem.markAllAsRead();
        updateNotificationBadge(0);
    }
}

// Export functions for global access
window.toggleMobileMenu = toggleMobileMenu;
window.toggleUserDropdown = toggleUserDropdown;
window.toggleNotificationDropdown = toggleNotificationDropdown;
window.logout = logout;
window.updateNotificationBadge = updateNotificationBadge;
window.markAllNotificationsRead = markAllNotificationsRead;