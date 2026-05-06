// User Database (using localStorage)
class UserManager {
    constructor() {
        this.storageKey = 'users';
        this.currentUserKey = 'currentUser';
    }

    register(user) {
        let users = this.getAllUsers();
        if (users.find(u => u.email === user.email)) {
            return { success: false, message: 'Email already exists!' };
        }
        users.push(user);
        localStorage.setItem(this.storageKey, JSON.stringify(users));
        return { success: true, message: 'Account created successfully!' };
    }

    login(email, password) {
        const users = this.getAllUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            localStorage.setItem(this.currentUserKey, JSON.stringify(user));
            return { success: true, message: 'Login successful!' };
        }
        return { success: false, message: 'Invalid email or password!' };
    }

    logout() {
        localStorage.removeItem(this.currentUserKey);
    }

    getCurrentUser() {
        const user = localStorage.getItem(this.currentUserKey);
        return user ? JSON.parse(user) : null;
    }

    getAllUsers() {
        const users = localStorage.getItem(this.storageKey);
        return users ? JSON.parse(users) : [];
    }

    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }
}

// Location Manager for Real-Time Tracking
class LocationManager {
    constructor() {
        this.locationsKey = 'user-locations';
        this.currentUserLocation = null;
        this.trackingInterval = null;
    }

    startTracking() {
        console.log("[v0] Starting location tracking");
        // Get location immediately
        this.updateUserLocation();
        // Update every 5 seconds and redraw map
        this.trackingInterval = setInterval(() => {
            this.updateUserLocation();
            if (app && app.currentSection === 'safety-map') {
                app.drawSafetyMap();
            }
        }, 5000);
    }

    stopTracking() {
        if (this.trackingInterval) {
            clearInterval(this.trackingInterval);
            this.trackingInterval = null;
        }
    }

    updateUserLocation() {
        const user = app.userManager.getCurrentUser();
        if (!user) return;

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    this.currentUserLocation = { lat, lng, email: user.email, name: user.name };
                    this.saveLocation(user.email, lat, lng, user.name);
                    console.log("[v0] Location updated: " + lat.toFixed(4) + ", " + lng.toFixed(4));
                },
                (error) => {
                    console.log("[v0] Location error: " + error.message);
                    // Use demo location for testing if geolocation fails
                    this.useDemoLocation(user);
                }
            );
        } else {
            this.useDemoLocation(user);
        }
    }

    useDemoLocation(user) {
        // Use demo locations for testing when geolocation unavailable
        const demoLocations = {
            'user1@example.com': { lat: 28.7041, lng: 77.1025 }, // Delhi
            'user2@example.com': { lat: 19.0760, lng: 72.8777 }, // Mumbai
            'user3@example.com': { lat: 13.0827, lng: 80.2707 }, // Chennai
        };
        
        const location = demoLocations[user.email] || {
            lat: 28.7041 + Math.random() * 0.5,
            lng: 77.1025 + Math.random() * 0.5
        };
        
        this.currentUserLocation = { 
            lat: location.lat, 
            lng: location.lng, 
            email: user.email, 
            name: user.name 
        };
        this.saveLocation(user.email, location.lat, location.lng, user.name);
    }

    saveLocation(email, lat, lng, name) {
        let locations = this.getAllLocations();
        const existingIndex = locations.findIndex(l => l.email === email);
        
        const locationData = {
            email,
            name,
            lat,
            lng,
            timestamp: new Date().toLocaleTimeString(),
            date: new Date().toLocaleDateString()
        };

        if (existingIndex >= 0) {
            locations[existingIndex] = locationData;
        } else {
            locations.push(locationData);
        }

        localStorage.setItem(this.locationsKey, JSON.stringify(locations));
    }

    getAllLocations() {
        const locations = localStorage.getItem(this.locationsKey);
        return locations ? JSON.parse(locations) : [];
    }

    getUserLocation(email) {
        const locations = this.getAllLocations();
        return locations.find(l => l.email === email);
    }

    getCurrentUserLocation() {
        return this.currentUserLocation;
    }

    // Convert real lat/lng to canvas coordinates
    latLngToCanvasCoords(lat, lng, canvasWidth = 800, canvasHeight = 400) {
        // Reference bounds for canvas display (approximate India region)
        const minLat = 8.0;
        const maxLat = 35.0;
        const minLng = 68.0;
        const maxLng = 97.0;

        const x = ((lng - minLng) / (maxLng - minLng)) * canvasWidth;
        const y = ((maxLat - lat) / (maxLat - minLat)) * canvasHeight;

        return { x, y };
    }
}

// Feature Managers
class FriendsManager {
    constructor() {
        this.storageKey = 'friends';
    }

    addFriend(email) {
        let friends = this.getFriends();
        if (!friends.find(f => f.email === email)) {
            friends.push({ email, status: 'online', addedDate: new Date().toLocaleDateString() });
            localStorage.setItem(this.storageKey, JSON.stringify(friends));
            return true;
        }
        return false;
    }

    removeFriend(email) {
        let friends = this.getFriends();
        friends = friends.filter(f => f.email !== email);
        localStorage.setItem(this.storageKey, JSON.stringify(friends));
    }

    getFriends() {
        const friends = localStorage.getItem(this.storageKey);
        return friends ? JSON.parse(friends) : [];
    }
}

class DocumentsManager {
    constructor() {
        this.storageKey = 'documents';
    }

    addDocument(doc) {
        let docs = this.getDocuments();
        docs.push({ ...doc, id: Date.now(), date: new Date().toLocaleDateString() });
        localStorage.setItem(this.storageKey, JSON.stringify(docs));
    }

    getDocuments() {
        const docs = localStorage.getItem(this.storageKey);
        return docs ? JSON.parse(docs) : [];
    }

    deleteDocument(id) {
        let docs = this.getDocuments();
        docs = docs.filter(d => d.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(docs));
    }
}

class IncidentsManager {
    constructor() {
        this.storageKey = 'incidents';
    }

    reportIncident(incident) {
        let incidents = this.getIncidents();
        incidents.push({ ...incident, id: Date.now(), date: new Date().toLocaleDateString() });
        localStorage.setItem(this.storageKey, JSON.stringify(incidents));
    }

    getIncidents() {
        const incidents = localStorage.getItem(this.storageKey);
        return incidents ? JSON.parse(incidents) : [];
    }
}

// UI Manager
class UIManager {
    constructor() {
        this.userManager = new UserManager();
        this.locationManager = new LocationManager();
        this.friendsManager = new FriendsManager();
        this.documentsManager = new DocumentsManager();
        this.incidentsManager = new IncidentsManager();
        this.currentSection = 'home';
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initDarkMode();
        this.checkAuthState();
        this.requestNotificationPermission();
    }

    requestNotificationPermission() {
        if ("Notification" in window) {
            Notification.requestPermission();
        }
    }

    initDarkMode() {
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
        }
    }

    checkAuthState() {
        if (this.userManager.isLoggedIn()) {
            this.showDashboard();
        } else {
            this.showLoginPage();
        }
    }

    setupEventListeners() {
        // Auth Navigation
        const goToRegister = document.getElementById('go-to-register');
        if (goToRegister) {
            goToRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterPage();
            });
        }

        const goToLogin = document.getElementById('go-to-login');
        if (goToLogin) {
            goToLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginPage();
            });
        }

        // Forms
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleContact(e));
        }

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Quick Actions
        const shareLocationBtn = document.getElementById('share-location-btn');
        if (shareLocationBtn) {
            shareLocationBtn.addEventListener('click', () => {
                const navLink = document.querySelector('.nav-link[data-page="location"]');
                if (navLink) navLink.click();
            });
        }

        const emergencyBtn = document.getElementById('emergency-btn');
        if (emergencyBtn) {
            emergencyBtn.addEventListener('click', () => {
                const navLink = document.querySelector('.nav-link[data-page="emergency"]');
                if (navLink) navLink.click();
            });
        }

        const findSafeBtn = document.getElementById('find-safe-btn');
        if (findSafeBtn) {
            findSafeBtn.addEventListener('click', () => {
                this.showMessage('Find Safe Place', 'Scanning for nearby safe locations...');
            });
        }

        const contactSupportBtn = document.getElementById('contact-support-btn');
        if (contactSupportBtn) {
            contactSupportBtn.addEventListener('click', () => {
                const navLink = document.querySelector('.nav-link[data-page="contact"]');
                if (navLink) navLink.click();
            });
        }

        // Location Page
        const getLocationBtn = document.getElementById('get-location-btn');
        if (getLocationBtn) {
            getLocationBtn.addEventListener('click', () => this.getLocation());
        }

        // Emergency Buttons
        document.querySelectorAll('.emergency-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleEmergency(e));
        });

        // Modal
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => this.closeModal());
        }

        const modalBtn = document.getElementById('modal-btn');
        if (modalBtn) {
            modalBtn.addEventListener('click', () => this.closeModal());
        }

        const modal = document.getElementById('modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'modal') this.closeModal();
            });
        }

        // Dark Mode
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleDarkMode());
        }

        // SOS Button
        const sosButton = document.getElementById('sos-button');
        if (sosButton) {
            sosButton.addEventListener('click', () => this.handleSOS());
        }

        // Friends
        const addFriendBtn = document.getElementById('add-friend-btn');
        if (addFriendBtn) {
            addFriendBtn.addEventListener('click', () => this.addFriend());
        }

        const shareLocationToggle = document.getElementById('share-location-toggle');
        if (shareLocationToggle) {
            shareLocationToggle.addEventListener('change', (e) => this.toggleLocationSharing(e));
        }

        // Incident Report
        const incidentForm = document.getElementById('incident-form');
        if (incidentForm) {
            incidentForm.addEventListener('submit', (e) => this.handleIncidentReport(e));
        }

        // Documents
        const addDocBtn = document.getElementById('add-doc-btn');
        if (addDocBtn) {
            addDocBtn.addEventListener('click', () => this.addDocument());
        }

        // Profile
        const addEmergencyBtn = document.getElementById('add-emergency-btn');
        if (addEmergencyBtn) {
            addEmergencyBtn.addEventListener('click', () => this.addEmergencyContact());
        }

        // Draw Safety Map
        const safetyCanvas = document.getElementById('safety-canvas');
        if (safetyCanvas) {
            this.drawSafetyMap();
        }

        const beforeChecklist = document.getElementById('before-checklist');
        if (beforeChecklist) {
            this.loadChecklist();
        }
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('darkMode', this.darkMode);
        document.body.classList.toggle('dark-mode');
        document.getElementById('theme-toggle').textContent = this.darkMode ? 'Light Mode' : 'Dark Mode';
    }

    // Page Navigation
    showPage(pageName) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        document.getElementById(`${pageName}-page`).classList.add('active');
    }

    showLoginPage() {
        this.showPage('login');
        document.getElementById('login-form').reset();
    }

    showRegisterPage() {
        this.showPage('register');
        document.getElementById('register-form').reset();
    }

    showDashboard() {
        this.showPage('dashboard');
        const user = this.userManager.getCurrentUser();
        document.getElementById('user-name').textContent = user.name;
        this.loadProfileInfo(user);
        this.loadFriendsList();
        this.loadDocuments();
        this.loadIncidents();
        
        // Force initial location setup with demo location
        this.locationManager.useDemoLocation(user);
        this.locationManager.startTracking();
        
        // Check if there's a hash in the URL to show a specific section
        const hash = window.location.hash.substring(1);
        const validSections = ['home', 'location', 'emergency', 'sos', 'friends', 'safety-map', 'checklist', 'incidents', 'documents', 'profile', 'contact'];
        
        if (hash && validSections.includes(hash)) {
            this.showSection(hash);
        } else {
            this.showSection('home');
        }
    }

    showSection(sectionName) {
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${sectionName}-page`).classList.add('active');

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[data-page="${sectionName}"]`).classList.add('active');

        this.currentSection = sectionName;

        // Reload content for specific sections
        if (sectionName === 'location') {
            setTimeout(() => this.initLocationPage(), 100);
        } else if (sectionName === 'safety-map') {
            setTimeout(() => this.drawSafetyMap(), 100);
        }
    }

    initLocationPage() {
        // Initialize location page - make sure button is ready
        const btn = document.getElementById('get-location-btn');
        if (btn) {
            btn.onclick = null;
            btn.addEventListener('click', () => this.getLocation());
        }
        
        // Load friends tracking
        this.loadFriendsTracking();
    }

    loadFriendsTracking() {
        const allLocations = this.locationManager.getAllLocations();
        const currentUser = this.userManager.getCurrentUser();
        const friendsList = this.friendsManager.getFriends();
        
        const trackingDiv = document.getElementById('friends-tracking');
        
        if (friendsList.length === 0) {
            trackingDiv.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Add friends to see their live locations</p>';
            return;
        }
        
        let html = '';
        let friendCount = 0;
        
        friendsList.forEach(friend => {
            const friendLocation = allLocations.find(l => l.email === friend.email);
            
            if (friendLocation) {
                friendCount++;
                const currentLoc = this.locationManager.getCurrentUserLocation();
                const distance = currentLoc ? 
                    this.calculateDistance(
                        currentLoc.lat, 
                        currentLoc.lng, 
                        friendLocation.lat, 
                        friendLocation.lng
                    ) : 0;
                
                html += `
                    <div style="padding: 12px; margin: 8px 0; background: var(--bg-color); border-radius: 8px; border-left: 4px solid var(--primary-color);">
                        <p style="margin: 0 0 5px 0; font-weight: 600; color: var(--text-primary);">${friendLocation.name}</p>
                        <p style="margin: 0 0 3px 0; font-size: 12px; color: var(--text-secondary);">
                            📍 Lat: ${friendLocation.lat.toFixed(4)}, Lng: ${friendLocation.lng.toFixed(4)}
                        </p>
                        <p style="margin: 0 0 3px 0; font-size: 12px; color: var(--text-secondary);">
                            📏 Distance: ${distance.toFixed(1)} km
                        </p>
                        <p style="margin: 0; font-size: 11px; color: var(--text-secondary);">
                            ⏰ Last update: ${friendLocation.timestamp}
                        </p>
                    </div>
                `;
            }
        });
        
        if (friendCount === 0) {
            html = '<p style="text-align: center; color: var(--text-secondary);">Friends are offline</p>';
        }
        
        trackingDiv.innerHTML = html;
    }

    // Form Handlers
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Signing in...';

        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 1500));

        const result = this.userManager.login(email, password);
        
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;

        if (result.success) {
            this.showDashboard();
        } else {
            this.showMessage('Login Failed', result.message);
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const phone = document.getElementById('register-phone').value.trim();
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        // Optional fields from register.html
        const age = document.getElementById('age')?.value;
        const location = document.getElementById('location')?.value;
        const gender = document.getElementById('gender')?.value;
        const emergency = document.getElementById('emergency')?.value;

        // Validation
        if (!this.validateEmail(email)) {
            this.showMessage('Validation Error', 'Please enter a valid email address.');
            return;
        }

        if (password.length < 6) {
            this.showMessage('Validation Error', 'Password must be at least 6 characters.');
            return;
        }

        if (password !== confirm) {
            this.showMessage('Validation Error', 'Passwords do not match.');
            return;
        }

        if (!this.validatePhone(phone)) {
            this.showMessage('Validation Error', 'Please enter a valid phone number.');
            return;
        }

        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';

        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 2000));

        const user = { name, email, phone, password, age, location, gender, emergency };
        const result = this.userManager.register(user);

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;

        if (result.success) {
            this.showMessage('Success', result.message + ' You can now login.');
            setTimeout(() => {
                if (document.getElementById('login-page')) {
                    this.showLoginPage();
                } else {
                    window.location.href = 'index.html';
                }
            }, 2000);
        } else {
            this.showMessage('Registration Failed', result.message);
        }
    }

    async handleContact(e) {
        e.preventDefault();
        const subject = document.getElementById('contact-subject').value.trim();
        const message = document.getElementById('contact-message').value.trim();
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;

        if (subject && message) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            // Simulate network latency
            await new Promise(resolve => setTimeout(resolve, 1500));

            this.showMessage('Message Sent', 'Your message has been sent successfully. We will get back to you soon.');
            document.getElementById('contact-form').reset();

            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            this.locationManager.stopTracking();
            this.userManager.logout();
            this.showLoginPage();
        }
    }

    handleNavigation(e) {
        e.preventDefault();
        const page = e.target.dataset.page;
        this.showSection(page);
    }

    // Location Handler
    getLocation() {
        const displayDiv = document.getElementById('location-display');
        displayDiv.innerHTML = '<p>Getting your live location...</p>';

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude, accuracy } = position.coords;
                    const currentLocation = this.locationManager.getCurrentUserLocation();
                    
                    displayDiv.innerHTML = `
                        <div style="text-align: left; padding: 20px; background: var(--bg-color); border-radius: 8px;">
                            <p><strong>📍 Latitude:</strong> ${latitude.toFixed(6)}</p>
                            <p><strong>📍 Longitude:</strong> ${longitude.toFixed(6)}</p>
                            <p><strong>🎯 Accuracy:</strong> ${accuracy.toFixed(0)} meters</p>
                            <p><strong>⏰ Updated:</strong> ${new Date().toLocaleTimeString()}</p>
                            <p class="location-shared">✓ Location is being shared with your friends</p>
                        </div>
                    `;
                    
                    // Show list of nearby friends
                    const allLocations = this.locationManager.getAllLocations();
                    const friends = allLocations.filter(l => l.email !== app.userManager.getCurrentUser().email);
                    
                    if (friends.length > 0) {
                        let friendsHtml = '<h4 style="margin-top: 20px; color: var(--primary-color);">Friends Nearby:</h4>';
                        friends.forEach(friend => {
                            const distance = this.calculateDistance(latitude, longitude, friend.lat, friend.lng);
                            friendsHtml += `
                                <div style="padding: 10px; margin: 5px 0; background: var(--bg-color); border-radius: 6px;">
                                    <p><strong>${friend.name}</strong> - ${distance.toFixed(1)} km away</p>
                                    <small style="color: var(--text-secondary);">Last seen: ${friend.timestamp}</small>
                                </div>
                            `;
                        });
                        displayDiv.innerHTML += friendsHtml;
                    }
                    
                    this.showMessage('Location Shared', `Your location is now visible to friends!\nLat: ${latitude.toFixed(4)}\nLng: ${longitude.toFixed(4)}`);
                },
                (error) => {
                    // Fallback to demo location
                    const demoLocation = this.locationManager.currentUserLocation;
                    if (demoLocation) {
                        displayDiv.innerHTML = `
                            <div style="text-align: left; padding: 20px; background: var(--bg-color); border-radius: 8px;">
                                <p><strong>📍 Latitude:</strong> ${demoLocation.lat.toFixed(6)}</p>
                                <p><strong>📍 Longitude:</strong> ${demoLocation.lng.toFixed(6)}</p>
                                <p style="color: var(--text-secondary); font-size: 12px;">(Demo location - Enable location access for real coordinates)</p>
                                <p class="location-shared">✓ Demo location is being shared</p>
                            </div>
                        `;
                    } else {
                        displayDiv.innerHTML = '<p class="error">Unable to get your location. Please enable location services.</p>';
                    }
                }
            );
        } else {
            // Use stored location from LocationManager
            const currentLocation = this.locationManager.currentUserLocation;
            if (currentLocation) {
                displayDiv.innerHTML = `
                    <div style="text-align: left; padding: 20px; background: var(--bg-color); border-radius: 8px;">
                        <p><strong>📍 Latitude:</strong> ${currentLocation.lat.toFixed(6)}</p>
                        <p><strong>📍 Longitude:</strong> ${currentLocation.lng.toFixed(6)}</p>
                        <p style="color: var(--text-secondary); font-size: 12px;">Geolocation not available - Using cached location</p>
                        <p class="location-shared">✓ Location is being shared</p>
                    </div>
                `;
            } else {
                this.showMessage('Error', 'Geolocation is not supported by your browser.');
            }
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        // Haversine formula to calculate distance between two points
        const R = 6371; // Earth's radius in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // Emergency Handler
    async handleEmergency(e) {
        const emergencyType = e.currentTarget.dataset.type;
        const btn = e.currentTarget;
        const originalHtml = btn.innerHTML;

        // Show loading state on the button
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.innerHTML = '<span>⏳</span><span>Sending Alert...</span>';

        const emergencyTypes = {
            'medical': 'Medical Emergency',
            'theft': 'Theft/Crime',
            'accident': 'Accident',
            'lost': 'Lost/Help Needed'
        };

        const title = emergencyTypes[emergencyType];
        
        // Simulate network latency for the emergency alert
        await new Promise(resolve => setTimeout(resolve, 2000));

        const message = `${title} alert has been sent!\n\nAuthorities have been notified with your current location.`;
        
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.innerHTML = originalHtml;

        this.showMessage('Emergency Alert Sent', message);

        // Also trigger the SOS logic for real-life notification simulation
        const user = this.userManager.getCurrentUser();
        let locationStr = 'Location unavailable';
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                locationStr = `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`;
                this.simulateEmergencyAlert(user, `EMERGENCY: ${title} at ${locationStr}`, 0);
            });
        }
    }

    // Utilities
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePhone(phone) {
        const phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(phone.replace(/\D/g, ''));
    }

    showMessage(title, message) {
        const modalTitle = document.getElementById('modal-title');
        const modalMessage = document.getElementById('modal-message');
        const modal = document.getElementById('modal');

        if (modalTitle && modalMessage && modal) {
            modalTitle.textContent = title;
            modalMessage.textContent = message;
            modal.classList.add('show');
        } else {
            alert(`${title}: ${message}`);
        }
    }

    closeModal() {
        document.getElementById('modal').classList.remove('show');
    }

    // SOS Handler
    async handleSOS() {
        const user = this.userManager.getCurrentUser();
        const friends = this.friendsManager.getFriends();
        
        const statusDiv = document.getElementById('sos-status');
        statusDiv.textContent = 'Activating SOS... Getting location and recording audio...';
        statusDiv.classList.add('active');
        statusDiv.style.background = 'var(--danger-color)';

        // 1. Get Location
        let locationStr = 'Location unavailable';
        if (navigator.geolocation) {
            try {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                locationStr = `Lat: ${pos.coords.latitude.toFixed(4)}, Lng: ${pos.coords.longitude.toFixed(4)}`;
            } catch (err) {
                console.log("Location error", err);
            }
        }

        // 2. Start Audio Recording
        let audioBlob = null;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            const audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                console.log("Audio recording stopped", audioBlob);
                // In a real app, you'd upload this blob to a server
            };

            mediaRecorder.start();
            statusDiv.textContent = 'SOS ACTIVE: Recording audio and sending alerts...';
            
            // Stop recording after 10 seconds
            setTimeout(() => {
                mediaRecorder.stop();
                stream.getTracks().forEach(track => track.stop());
            }, 10000);
        } catch (err) {
            console.log("Audio recording error", err);
            statusDiv.textContent = 'SOS ACTIVE: Alerts sent (Audio failed: ' + err.message + ')';
        }

        // 3. Send "Alerts" (Simulated API call)
        this.simulateEmergencyAlert(user, locationStr, friends.length);

        this.showMessage('SOS ALERT ACTIVATED', `Emergency alert sent!\nContacts notified: ${friends.length}\nLocation: ${locationStr}\nAudio recording started (10s).`);
        
        setTimeout(() => {
            statusDiv.classList.remove('active');
            statusDiv.textContent = '';
        }, 15000);
    }

    async simulateEmergencyAlert(user, location, contactCount) {
        console.log(`[REAL-LIFE] Sending emergency alert for ${user.email}`);
        console.log(`[REAL-LIFE] Location: ${location}`);
        console.log(`[REAL-LIFE] Notifying ${contactCount} emergency contacts`);
        
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show browser notification if permitted
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("SOS ALERT SENT", {
                body: `Emergency alert for ${user.name} at ${location}`,
                icon: 'https://cdn-icons-png.flaticon.com/512/595/595067.png'
            });
        }
    }

    // Friends Management
    addFriend() {
        const email = document.getElementById('friend-email').value.trim();
        if (!this.validateEmail(email)) {
            this.showMessage('Error', 'Please enter a valid email address.');
            return;
        }
        
        if (this.friendsManager.addFriend(email)) {
            document.getElementById('friend-email').value = '';
            this.loadFriendsList();
            this.showMessage('Success', 'Friend added successfully!');
        } else {
            this.showMessage('Error', 'Friend already exists!');
        }
    }

    loadFriendsList() {
        const friends = this.friendsManager.getFriends();
        const display = document.getElementById('friends-display');
        
        if (friends.length === 0) {
            display.innerHTML = '<p>No friends added yet</p>';
            return;
        }
        
        display.innerHTML = friends.map(friend => `
            <div class="friend-item">
                <div class="friend-info">
                    <p>${friend.email}</p>
                    <small style="color: var(--text-secondary);">Added: ${friend.addedDate}</small>
                </div>
                <span class="friend-status ${friend.status}">${friend.status}</span>
                <button class="remove-friend" onclick="app.removeFriend('${friend.email}')">Remove</button>
            </div>
        `).join('');
    }

    removeFriend(email) {
        this.friendsManager.removeFriend(email);
        this.loadFriendsList();
    }

    toggleLocationSharing(e) {
        const isSharing = e.target.checked;
        document.getElementById('sharing-status-text').textContent = 
            isSharing ? 'Location sharing is ON - Friends can see your location' : 'Location sharing is OFF';
    }

    // Incident Reporting
    handleIncidentReport(e) {
        e.preventDefault();
        
        const type = document.getElementById('incident-type').value;
        const location = document.getElementById('incident-location').value;
        const description = document.getElementById('incident-description').value;
        
        if (!type || !location || !description) {
            this.showMessage('Error', 'Please fill all fields.');
            return;
        }
        
        this.incidentsManager.reportIncident({ type, location, description });
        document.getElementById('incident-form').reset();
        this.loadIncidents();
        this.showMessage('Success', 'Incident reported successfully!');
    }

    loadIncidents() {
        const incidents = this.incidentsManager.getIncidents();
        const list = document.getElementById('incidents-list');
        
        if (incidents.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No incidents reported yet</p>';
            return;
        }
        
        list.innerHTML = incidents.map(incident => `
            <div class="incident-item">
                <h4>${incident.type.toUpperCase()}</h4>
                <p><strong>Location:</strong> ${incident.location}</p>
                <p><strong>Date:</strong> ${incident.date}</p>
                <p><strong>Description:</strong> ${incident.description}</p>
            </div>
        `).join('');
    }

    // Document Vault
    addDocument() {
        const type = document.getElementById('doc-type').value;
        const content = document.getElementById('doc-content').value;
        
        if (!type || !content) {
            this.showMessage('Error', 'Please select document type and enter details.');
            return;
        }
        
        this.documentsManager.addDocument({ type, content });
        document.getElementById('doc-type').value = '';
        document.getElementById('doc-content').value = '';
        this.loadDocuments();
        this.showMessage('Success', 'Document saved successfully!');
    }

    loadDocuments() {
        const docs = this.documentsManager.getDocuments();
        const display = document.getElementById('docs-display');
        
        if (docs.length === 0) {
            display.innerHTML = '<p>No documents saved yet</p>';
            return;
        }
        
        display.innerHTML = docs.map(doc => `
            <div class="doc-item">
                <div class="doc-info">
                    <div class="doc-type">${doc.type.toUpperCase()}</div>
                    <div class="doc-date">Saved: ${doc.date}</div>
                </div>
                <button class="delete-doc" onclick="app.deleteDocument(${doc.id})">Delete</button>
            </div>
        `).join('');
    }

    deleteDocument(id) {
        this.documentsManager.deleteDocument(id);
        this.loadDocuments();
    }

    // Profile Management
    loadProfileInfo(user) {
        document.getElementById('profile-name').textContent = user.name;
        document.getElementById('profile-email').textContent = user.email;
        document.getElementById('profile-phone').textContent = user.phone;
    }

    addEmergencyContact() {
        const email = document.getElementById('emergency-contact').value.trim();
        if (!this.validateEmail(email)) {
            this.showMessage('Error', 'Please enter a valid email address.');
            return;
        }
        
        let contacts = JSON.parse(localStorage.getItem('emergency-contacts') || '[]');
        if (!contacts.find(c => c === email)) {
            contacts.push(email);
            localStorage.setItem('emergency-contacts', JSON.stringify(contacts));
            document.getElementById('emergency-contact').value = '';
            this.loadEmergencyContacts();
        }
    }

    loadEmergencyContacts() {
        const contacts = JSON.parse(localStorage.getItem('emergency-contacts') || '[]');
        const list = document.getElementById('emergency-contacts-list');
        
        list.innerHTML = contacts.map((contact, idx) => `
            <div class="contact-item">
                <span>${contact}</span>
                <button class="remove-contact" onclick="app.removeEmergencyContact(${idx})">Remove</button>
            </div>
        `).join('');
    }

    removeEmergencyContact(idx) {
        let contacts = JSON.parse(localStorage.getItem('emergency-contacts') || '[]');
        contacts.splice(idx, 1);
        localStorage.setItem('emergency-contacts', JSON.stringify(contacts));
        this.loadEmergencyContacts();
    }

    // Safety Map with Leaflet
    drawSafetyMap() {
        const container = document.getElementById('safety-map-container');
        if (!container) {
            setTimeout(() => this.drawSafetyMap(), 300);
            return;
        }

        const currentUserLoc = this.locationManager.getCurrentUserLocation();
        const lat = currentUserLoc ? currentUserLoc.lat : 20.5937;
        const lng = currentUserLoc ? currentUserLoc.lng : 78.9629;

        // Initialize map if not already done
        if (!this.map) {
            this.map = L.map('safety-map-container').setView([lat, lng], 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);
            this.markers = {};
        } else {
            this.map.setView([lat, lng]);
        }

        // Clear existing markers
        for (let id in this.markers) {
            this.map.removeLayer(this.markers[id]);
        }
        this.markers = {};

        // Add markers for all user locations
        const allLocations = this.locationManager.getAllLocations();
        const currentUser = this.userManager.getCurrentUser();

        allLocations.forEach(loc => {
            const isCurrentUser = loc.email === currentUser.email;
            const markerColor = isCurrentUser ? 'blue' : 'green';
            
            // Custom icon for current user
            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: ${markerColor}; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                iconSize: [15, 15],
                iconAnchor: [7, 7]
            });

            const marker = L.marker([loc.lat, loc.lng], { icon: icon })
                .addTo(this.map)
                .bindPopup(`<b>${isCurrentUser ? 'You' : loc.name}</b><br>Last seen: ${loc.timestamp}`);
            
            this.markers[loc.email] = marker;
        });

        // Add some simulated "Safety Rating" zones
        const safetyZones = [
            { lat: 28.6139, lng: 77.2090, status: 'safe', name: 'Delhi Safe Zone' },
            { lat: 19.0760, lng: 72.8777, status: 'caution', name: 'Mumbai Caution Area' },
            { lat: 13.0827, lng: 80.2707, status: 'unsafe', name: 'Chennai Unsafe Area' }
        ];

        safetyZones.forEach(zone => {
            const color = zone.status === 'safe' ? '#16a34a' : (zone.status === 'caution' ? '#f97316' : '#dc2626');
            L.circle([zone.lat, zone.lng], {
                color: color,
                fillColor: color,
                fillOpacity: 0.2,
                radius: 50000 // 50km
            }).addTo(this.map).bindPopup(`<b>${zone.name}</b><br>Status: ${zone.status.toUpperCase()}`);
        });

        console.log("[v0] Leaflet map rendered with " + allLocations.length + " locations");
    }

    drawMapLegend(ctx, width, height) {
        // Legend is now handled by Leaflet or CSS
    }

    drawLabel(ctx, text, x, y) {
        try {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.font = 'bold 13px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, x, y);
        } catch (error) {
            console.log("[v0] Label drawing error: " + error.message);
        }
    }

    // Checklist
    loadChecklist() {
        const beforeItems = [
            'Inform someone about your travel plans',
            'Share itinerary with family',
            'Make copies of important documents',
            'Notify your bank about travel',
            'Update emergency contacts',
            'Check visa requirements'
        ];
        
        const duringItems = [
            'Stay in well-lit areas at night',
            'Keep valuables secure',
            'Avoid displaying expensive items',
            'Stay aware of surroundings',
            'Keep copies of documents separate',
            'Have local emergency numbers'
        ];
        
        const docsItems = [
            'Carry passport',
            'Keep travel insurance documents',
            'Have hotel reservations printed',
            'Keep credit card company numbers',
            'Carry vaccination certificates',
            'Keep emergency contacts written'
        ];
        
        this.createChecklistItems('before-checklist', beforeItems);
        this.createChecklistItems('during-checklist', duringItems);
        this.createChecklistItems('docs-checklist', docsItems);
    }

    createChecklistItems(containerId, items) {
        const container = document.getElementById(containerId);
        container.innerHTML = items.map((item, idx) => `
            <label class="checklist-item">
                <input type="checkbox" onchange="this.parentElement.classList.toggle('completed')">
                <span>${item}</span>
            </label>
        `).join('');
    }
}

// Standalone Page Handlers
async function handleStandaloneContact(event) {
    event.preventDefault();
    const subject = document.getElementById('contact-subject').value.trim();
    const message = document.getElementById('contact-message').value.trim();
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;

    if (subject && message) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 1500));

        alert('Message Sent: Your message has been sent successfully. We will get back to you soon.');
        document.getElementById('contact-form').reset();

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function shareLocation() {
    if (app) {
        app.getLocation();
    } else {
        alert("Location tracking system is initializing...");
    }
}

function callEmergency() {
    if (app) {
        app.handleSOS();
    } else {
        alert("Emergency system is initializing...");
    }
}

function logout() {
    if (app) {
        app.handleLogout();
    } else {
        window.location.href = 'index.html';
    }
}

// Initialize App
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new UIManager();
});
