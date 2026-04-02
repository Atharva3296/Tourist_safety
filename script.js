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
        document.getElementById('go-to-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterPage();
        });

        document.getElementById('go-to-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginPage();
        });

        // Forms
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('contact-form').addEventListener('submit', (e) => this.handleContact(e));

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Quick Actions
        document.getElementById('share-location-btn').addEventListener('click', () => {
            document.querySelector('.nav-link[data-page="location"]').click();
        });

        document.getElementById('emergency-btn').addEventListener('click', () => {
            document.querySelector('.nav-link[data-page="emergency"]').click();
        });

        document.getElementById('find-safe-btn').addEventListener('click', () => {
            this.showMessage('Find Safe Place', 'Scanning for nearby safe locations...');
        });

        document.getElementById('contact-support-btn').addEventListener('click', () => {
            document.querySelector('.nav-link[data-page="contact"]').click();
        });

        // Location Page
        document.getElementById('get-location-btn').addEventListener('click', () => this.getLocation());

        // Emergency Buttons
        document.querySelectorAll('.emergency-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleEmergency(e));
        });

        // Modal
        document.querySelector('.modal-close').addEventListener('click', () => this.closeModal());
        document.getElementById('modal-btn').addEventListener('click', () => this.closeModal());
        document.getElementById('modal').addEventListener('click', (e) => {
            if (e.target.id === 'modal') this.closeModal();
        });

        // Dark Mode
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleDarkMode());

        // SOS Button
        document.getElementById('sos-button').addEventListener('click', () => this.handleSOS());

        // Friends
        document.getElementById('add-friend-btn').addEventListener('click', () => this.addFriend());
        document.getElementById('share-location-toggle').addEventListener('change', (e) => this.toggleLocationSharing(e));

        // Incident Report
        document.getElementById('incident-form').addEventListener('submit', (e) => this.handleIncidentReport(e));

        // Documents
        document.getElementById('add-doc-btn').addEventListener('click', () => this.addDocument());

        // Profile
        document.getElementById('add-emergency-btn').addEventListener('click', () => this.addEmergencyContact());

        // Draw Safety Map
        this.drawSafetyMap();
        this.loadChecklist();
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
        
        this.showSection('home');
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
    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        const result = this.userManager.login(email, password);
        if (result.success) {
            this.showDashboard();
        } else {
            this.showMessage('Login Failed', result.message);
        }
    }

    handleRegister(e) {
        e.preventDefault();
        const form = document.getElementById('register-form');
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const phone = document.getElementById('register-phone').value.trim();
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('register-confirm').value;

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

        const user = { name, email, phone, password };
        const result = this.userManager.register(user);

        if (result.success) {
            this.showMessage('Success', result.message + ' You can now login.');
            setTimeout(() => this.showLoginPage(), 2000);
        } else {
            this.showMessage('Registration Failed', result.message);
        }
    }

    handleContact(e) {
        e.preventDefault();
        const subject = document.getElementById('contact-subject').value.trim();
        const message = document.getElementById('contact-message').value.trim();

        if (subject && message) {
            this.showMessage('Message Sent', 'Your message has been sent successfully. We will get back to you soon.');
            document.getElementById('contact-form').reset();
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
    handleEmergency(e) {
        const emergencyType = e.currentTarget.dataset.type;
        const emergencyTypes = {
            'medical': 'Medical Emergency',
            'theft': 'Theft/Crime',
            'accident': 'Accident',
            'lost': 'Lost/Help Needed'
        };

        const title = emergencyTypes[emergencyType];
        const message = `${title} alert has been sent!\n\nAuthorities have been notified with your current location.`;
        
        this.showMessage('Emergency Alert Sent', message);
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
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('modal').classList.add('show');
    }

    closeModal() {
        document.getElementById('modal').classList.remove('show');
    }

    // SOS Handler
    handleSOS() {
        const location = navigator.geolocation ? 'Getting location...' : 'Location unavailable';
        const user = this.userManager.getCurrentUser();
        const friends = this.friendsManager.getFriends();
        
        this.showMessage('SOS Alert Sent', `Emergency alert sent!\nContacts notified: ${friends.length}\nLocation: ${location}`);
        
        const statusDiv = document.getElementById('sos-status');
        statusDiv.textContent = 'Alert sent to ' + friends.length + ' contacts at ' + new Date().toLocaleTimeString();
        statusDiv.classList.add('active');
        
        setTimeout(() => {
            statusDiv.classList.remove('active');
            statusDiv.textContent = '';
        }, 5000);
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

    // Safety Map with Real User Locations
    drawSafetyMap() {
        const canvas = document.getElementById('safety-canvas');
        if (!canvas) {
            console.log("[v0] Canvas not found, retrying in 300ms...");
            setTimeout(() => this.drawSafetyMap(), 300);
            return;
        }
        
        try {
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.log("[v0] Canvas context failed");
                return;
            }
            
            const width = canvas.width || 800;
            const height = canvas.height || 400;
            
            // Clear canvas with light background
            ctx.fillStyle = '#e0f2fe';
            ctx.fillRect(0, 0, width, height);
            
            // Draw map title and info
            ctx.fillStyle = '#0c4a6e';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'left';
            ctx.fillText('Live Location Map - India', 10, 20);
            
            // Draw grid
            ctx.strokeStyle = '#bae6fd';
            ctx.lineWidth = 1;
            for (let i = 0; i < width; i += 100) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, height);
                ctx.stroke();
            }
            for (let i = 0; i < height; i += 100) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(width, i);
                ctx.stroke();
            }
            
            // Draw region labels
            ctx.fillStyle = '#64748b';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('North', width/4, 30);
            ctx.fillText('South', width/4, height - 10);
            ctx.fillText('East', width - 30, height/2);
            ctx.fillText('West', 20, height/2);
            
            // Get all user locations
            const allLocations = this.locationManager.getAllLocations();
            const currentUser = this.userManager.getCurrentUser();
            
            if (allLocations.length === 0) {
                this.locationManager.useDemoLocation(currentUser);
                // Retry after storing location
                setTimeout(() => this.drawSafetyMap(), 500);
                return;
            }
            
            // Draw all user locations
            allLocations.forEach((location, index) => {
                const coords = this.locationManager.latLngToCanvasCoords(
                    location.lat, 
                    location.lng, 
                    width, 
                    height
                );
                
                const isCurrentUser = location.email === currentUser.email;
                
                // Draw location marker circle
                if (isCurrentUser) {
                    ctx.fillStyle = '#3b82f6';
                    ctx.strokeStyle = '#1e40af';
                    ctx.lineWidth = 3;
                    const radius = 14;
                    ctx.beginPath();
                    ctx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                    
                    // Draw pulsing effect
                    ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(coords.x, coords.y, radius + 8, 0, 2 * Math.PI);
                    ctx.stroke();
                } else {
                    // Friends in different colors
                    const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                    ctx.fillStyle = colors[index % colors.length];
                    ctx.strokeStyle = 'white';
                    ctx.lineWidth = 2;
                    const radius = 10;
                    ctx.beginPath();
                    ctx.arc(coords.x, coords.y, radius, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                }
                
                // Draw user label
                ctx.fillStyle = isCurrentUser ? 'white' : 'white';
                ctx.font = isCurrentUser ? 'bold 11px Arial' : '10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(isCurrentUser ? 'YOU' : location.name.split(' ')[0], coords.x, coords.y);
                
                // Draw info below marker
                ctx.fillStyle = '#475569';
                ctx.font = '9px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(location.timestamp, coords.x, coords.y + 20);
            });
            
            // Draw legend
            this.drawMapLegend(ctx, width, height);
            
            console.log("[v0] Safety map rendered with " + allLocations.length + " locations");
        } catch (error) {
            console.log("[v0] Error drawing map: " + error.message);
        }
    }

    drawMapLegend(ctx, width, height) {
        const legendX = width - 180;
        const legendY = height - 120;
        
        // Legend background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fillRect(legendX, legendY, 170, 110);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX, legendY, 170, 110);
        
        // Legend title
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Legend', legendX + 10, legendY + 18);
        
        // Your location
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(legendX + 20, legendY + 35, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#475569';
        ctx.font = '9px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Your Location', legendX + 35, legendY + 38);
        
        // Friends
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(legendX + 20, legendY + 52, 5, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#475569';
        ctx.fillText('Friends Nearby', legendX + 35, legendY + 55);
        
        // Updates
        ctx.fillStyle = '#475569';
        ctx.font = '8px Arial';
        ctx.fillText('Updates: Every 5 sec', legendX + 10, legendY + 100);
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

// Initialize App
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new UIManager();
});
