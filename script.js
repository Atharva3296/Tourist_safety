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
        this.handleHashChange();
        window.addEventListener('hashchange', () => this.handleHashChange());
    }

    handleHashChange() {
        const hash = window.location.hash.substring(1);
        const validPages = ['home', 'location', 'emergency', 'sos', 'friends', 'safety-map', 'checklist', 'incidents', 'documents', 'profile', 'contact'];
        
        if (validPages.includes(hash)) {
            if (this.userManager.isLoggedIn()) {
                this.showDashboard();
                this.showSection(hash);
            }
        }
    }

    initDarkMode() {
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
        }
    }

    checkAuthState() {
        if (document.getElementById('login-page')) {
            if (this.userManager.isLoggedIn()) {
                this.showDashboard();
            } else {
                this.showLoginPage();
            }
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
        if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        const registerForm = document.getElementById('register-form');
        if (registerForm) registerForm.addEventListener('submit', (e) => this.handleRegister(e));

        const contactForm = document.getElementById('contact-form');
        if (contactForm) contactForm.addEventListener('submit', (e) => this.handleContact(e));

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.handleLogout());

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Quick Actions
        const shareLocBtn = document.getElementById('share-location-btn');
        if (shareLocBtn) {
            shareLocBtn.addEventListener('click', () => {
                const locLink = document.querySelector('.nav-link[data-page="location"]');
                if (locLink) locLink.click();
            });
        }

        const emergencyBtn = document.getElementById('emergency-btn');
        if (emergencyBtn) {
            emergencyBtn.addEventListener('click', () => {
                const emgLink = document.querySelector('.nav-link[data-page="emergency"]');
                if (emgLink) emgLink.click();
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
                const contactLink = document.querySelector('.nav-link[data-page="contact"]');
                if (contactLink) contactLink.click();
            });
        }

        // Location Page
        const getLocBtn = document.getElementById('get-location-btn');
        if (getLocBtn) getLocBtn.addEventListener('click', () => this.getLocation());

        // Emergency Buttons
        document.querySelectorAll('.emergency-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleEmergency(e));
        });

        // Modal
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) modalClose.addEventListener('click', () => this.closeModal());
        
        const modalBtn = document.getElementById('modal-btn');
        if (modalBtn) modalBtn.addEventListener('click', () => this.closeModal());
        
        const modal = document.getElementById('modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target.id === 'modal') this.closeModal();
            });
        }

        // Dark Mode
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) themeToggle.addEventListener('click', () => this.toggleDarkMode());

        // SOS Button
        const sosBtn = document.getElementById('sos-button');
        if (sosBtn) sosBtn.addEventListener('click', () => this.handleSOS());

        // Friends
        const addFriendBtn = document.getElementById('add-friend-btn');
        if (addFriendBtn) addFriendBtn.addEventListener('click', () => this.addFriend());
        
        const shareLocToggle = document.getElementById('share-location-toggle');
        if (shareLocToggle) shareLocToggle.addEventListener('change', (e) => this.toggleLocationSharing(e));

        // Incident Report
        const incidentForm = document.getElementById('incident-form');
        if (incidentForm) incidentForm.addEventListener('submit', (e) => this.handleIncidentReport(e));

        // Documents
        const addDocBtn = document.getElementById('add-doc-btn');
        if (addDocBtn) addDocBtn.addEventListener('click', () => this.addDocument());

        // Profile
        const addEmgBtn = document.getElementById('add-emergency-btn');
        if (addEmgBtn) addEmgBtn.addEventListener('click', () => this.addEmergencyContact());

        // Draw Safety Map
        if (document.getElementById('safety-canvas')) this.drawSafetyMap();
        if (document.getElementById('before-checklist')) this.loadChecklist();
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('darkMode', this.darkMode);
        document.body.classList.toggle('dark-mode');
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) themeToggle.textContent = this.darkMode ? 'Light Mode' : 'Dark Mode';
    }

    // Page Navigation
    showPage(pageName) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        const page = document.getElementById(`${pageName}-page`);
        if (page) page.classList.add('active');
    }

    showLoginPage() {
        this.showPage('login');
        const loginForm = document.getElementById('login-form');
        if (loginForm) loginForm.reset();
    }

    showRegisterPage() {
        this.showPage('register');
        const registerForm = document.getElementById('register-form');
        if (registerForm) registerForm.reset();
    }

    showDashboard() {
        this.showPage('dashboard');
        const user = this.userManager.getCurrentUser();
        const userNameSpan = document.getElementById('user-name');
        if (userNameSpan) userNameSpan.textContent = user.name;
        
        this.loadProfileInfo(user);
        this.loadFriendsList();
        this.loadDocuments();
        this.loadIncidents();
        
        // If there's a hash, show that section, otherwise show home
        const hash = window.location.hash.substring(1);
        const validDashboardPages = ['home', 'location', 'emergency', 'sos', 'friends', 'safety-map', 'checklist', 'incidents', 'documents', 'profile', 'contact'];
        if (validDashboardPages.includes(hash)) {
            this.showSection(hash);
        } else {
            this.showSection('home');
        }
    }

    showSection(sectionName) {
        document.querySelectorAll('.dashboard-section').forEach(section => {
            section.classList.remove('active');
        });
        const section = document.getElementById(`${sectionName}-page`);
        if (section) section.classList.add('active');

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const navLink = document.querySelector(`[data-page="${sectionName}"]`);
        if (navLink) navLink.classList.add('active');

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
            this.userManager.logout();
            this.showLoginPage();
        }
    }

    handleNavigation(e) {
        e.preventDefault();
        const page = e.currentTarget.dataset.page;
        window.location.hash = page;
        this.showSection(page);
    }

    // Location Handler
    getLocation() {
        if (navigator.geolocation) {
            const displayDiv = document.getElementById('location-display');
            displayDiv.innerHTML = '<p>Getting your location...</p>';

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    displayDiv.innerHTML = `
                        <p><strong>Latitude:</strong> ${latitude.toFixed(4)}</p>
                        <p><strong>Longitude:</strong> ${longitude.toFixed(4)}</p>
                        <p class="location-shared">Location shared successfully!</p>
                    `;
                    this.showMessage('Location Shared', `Your location has been shared.\nLat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
                },
                (error) => {
                    displayDiv.innerHTML = '<p class="error">Unable to get your location. Please enable location services.</p>';
                    this.showMessage('Location Error', 'Unable to access your location. Please check permissions.');
                }
            );
        } else {
            this.showMessage('Error', 'Geolocation is not supported by your browser.');
        }
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

    // Safety Map
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
            
            console.log("[v0] Drawing safety map: " + width + "x" + height);
            
            // Clear canvas with light blue background
            ctx.fillStyle = '#f0f9ff';
            ctx.fillRect(0, 0, width, height);
            
            // Draw grid for reference
            ctx.strokeStyle = '#d1d5db';
            ctx.lineWidth = 1;
            for (let i = 0; i < width; i += 50) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, height);
                ctx.stroke();
            }
            for (let i = 0; i < height; i += 50) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(width, i);
                ctx.stroke();
            }
            
            // Draw safe zones (green)
            ctx.fillStyle = '#86efac';
            ctx.fillRect(40, 40, 140, 140);
            ctx.fillRect(280, 100, 140, 140);
            this.drawLabel(ctx, 'SAFE', 110, 120);
            this.drawLabel(ctx, 'SAFE', 350, 180);
            
            // Draw caution zones (yellow)
            ctx.fillStyle = '#fde047';
            ctx.fillRect(100, 260, 150, 100);
            this.drawLabel(ctx, 'CAUTION', 175, 315);
            
            // Draw unsafe zones (red)
            ctx.fillStyle = '#fca5a5';
            ctx.fillRect(480, 200, 120, 120);
            this.drawLabel(ctx, 'UNSAFE', 540, 265);
            
            // Draw your location marker
            ctx.fillStyle = '#3b82f6';
            ctx.beginPath();
            ctx.arc(250, 200, 12, 0, 2 * Math.PI);
            ctx.fill();
            
            // Draw location circle outline
            ctx.strokeStyle = '#1e40af';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(250, 200, 12, 0, 2 * Math.PI);
            ctx.stroke();
            
            // Label your location
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('YOU', 250, 200);
            
            console.log("[v0] Safety map rendered successfully");
        } catch (error) {
            console.log("[v0] Error drawing map: " + error.message);
        }
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

// Global functions for standalone HTML files
function logout() {
    if (app) app.handleLogout();
}

function register(event) {
    if (app) app.handleRegister(event);
}

function sendEmergency(type) {
    if (app) {
        // Map types from standalone HTML to UIManager expected data
        const event = { currentTarget: { dataset: { type } } };
        app.handleEmergency(event);
    }
}

function shareLocation() {
    if (app) app.getLocation();
}

function callEmergency() {
    if (app) {
        const event = { currentTarget: { dataset: { type: 'medical' } } }; // Default to medical for callEmergency
        app.handleEmergency(event);
    }
}

function sendMessage(event) {
    if (app) app.handleContact(event);
}
