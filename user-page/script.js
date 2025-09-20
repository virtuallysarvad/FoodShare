// FoodShare Application JavaScript
class FoodShareApp {
    constructor() {
        this.currentUser = null;
        this.donations = [];
        this.distributions = [];
        this.feedback = [];
        this.users = [];
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.renderFoodList();
        this.checkAuthStatus();
    }

    // Local Storage Management
    loadData() {
        // Load users
        const savedUsers = localStorage.getItem('foodshare_users');
        this.users = savedUsers ? JSON.parse(savedUsers) : this.getDefaultUsers();

        // Load donations
        const savedDonations = localStorage.getItem('foodshare_donations');
        this.donations = savedDonations ? JSON.parse(savedDonations) : this.getDefaultDonations();

        // Load distributions
        const savedDistributions = localStorage.getItem('foodshare_distributions');
        this.distributions = savedDistributions ? JSON.parse(savedDistributions) : [];

        // Load feedback
        const savedFeedback = localStorage.getItem('foodshare_feedback');
        this.feedback = savedFeedback ? JSON.parse(savedFeedback) : [];

        // Load current user
        const savedUser = localStorage.getItem('foodshare_current_user');
        this.currentUser = savedUser ? JSON.parse(savedUser) : null;
    }

    saveData() {
        localStorage.setItem('foodshare_users', JSON.stringify(this.users));
        localStorage.setItem('foodshare_donations', JSON.stringify(this.donations));
        localStorage.setItem('foodshare_distributions', JSON.stringify(this.distributions));
        localStorage.setItem('foodshare_feedback', JSON.stringify(this.feedback));
        if (this.currentUser) {
            localStorage.setItem('foodshare_current_user', JSON.stringify(this.currentUser));
        }
    }

    // Default Data
    getDefaultUsers() {
        return [
            {
                id: 1,
                username: 'john_doe',
                hashed_password: 'password123',
                phone: '+1-555-0123',
                address: '123 Main St, City, State 12345',
                usertype: 'donor'
            },
            {
                id: 2,
                username: 'jane_smith',
                hashed_password: 'password123',
                phone: '+1-555-0456',
                address: '456 Oak Ave, City, State 12345',
                usertype: 'recipient'
            }
        ];
    }

    getDefaultDonations() {
        return [
            {
                donation_id: 1,
                donor_id: 1,
                title: 'Fresh Pizza Slices',
                description: 'Leftover pizza from our restaurant. Still warm and delicious! Includes pepperoni and cheese slices.',
                quantity: '8 slices',
                pickup_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
                expiry_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
                status: 'available'
            },
            {
                donation_id: 2,
                donor_id: 1,
                title: 'Sandwich Platters',
                description: 'Assorted sandwiches from corporate event. Turkey, ham, and vegetarian options available.',
                quantity: '12 sandwiches',
                pickup_time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour from now
                expiry_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
                status: 'available'
            },
            {
                donation_id: 3,
                donor_id: 2,
                title: 'Fresh Fruit Basket',
                description: 'Mixed fruit basket with apples, bananas, oranges, and grapes. Perfect for families.',
                quantity: '1 large basket',
                pickup_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
                expiry_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
                status: 'reserved'
            }
        ];
    }

    // Event Listeners
    setupEventListeners() {
        // Navigation
        document.getElementById('hamburger').addEventListener('click', this.toggleMobileMenu);
        
        // Modal controls - using onclick instead of addEventListener to avoid conflicts
        document.getElementById('login-btn').onclick = () => this.showModal('login-modal');
        document.getElementById('register-btn').onclick = () => this.showModal('register-modal');
        document.getElementById('close-login').addEventListener('click', () => this.hideModal('login-modal'));
        document.getElementById('close-register').addEventListener('click', () => this.hideModal('register-modal'));
        
        // Modal switching
        document.getElementById('switch-to-register').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('login-modal');
            this.showModal('register-modal');
        });
        document.getElementById('switch-to-login').addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('register-modal');
            this.showModal('login-modal');
        });

        // Hero buttons
        document.getElementById('hero-donate').addEventListener('click', () => {
            document.getElementById('donate').scrollIntoView({ behavior: 'smooth' });
        });
        document.getElementById('hero-browse').addEventListener('click', () => {
            document.getElementById('browse').scrollIntoView({ behavior: 'smooth' });
        });

        // Forms
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('donate-form').addEventListener('submit', (e) => this.handleDonation(e));

        // Clear login error when user starts typing
        document.getElementById('login-username').addEventListener('input', () => this.hideLoginError());
        document.getElementById('login-password').addEventListener('input', () => this.hideLoginError());

        // Search and filters
        document.getElementById('search-food').addEventListener('input', () => this.renderFoodList());
        document.getElementById('filter-status').addEventListener('change', () => this.renderFoodList());

        // Dashboard tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target.id);
            }
        });

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(anchor.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
    }

    // Authentication
    handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        // Clear any previous error messages
        this.hideLoginError();

        // Check for admin credentials first
        if (this.isAdminCredentials(username, password)) {
            this.redirectToAdminDashboard();
            return;
        }

        const user = this.users.find(u => u.username === username && u.hashed_password === password);
        
        if (user) {
            this.currentUser = user;
            this.saveData();
            this.hideModal('login-modal');
            this.updateUIForLoggedInUser();
            this.showMessage('Login successful!', 'success');
        } else {
            this.showLoginError('Invalid Credentials');
        }
    }

    // Check if credentials match admin credentials
    isAdminCredentials(username, password) {
        // Define admin credentials - you can modify these as needed
        const adminCredentials = [
            { username: 'foodshare_admin', password: 'foodshare123' },
        ];

        return adminCredentials.some(cred => 
            cred.username === username && cred.password === password
        );
    }

    // Redirect to admin dashboard
    redirectToAdminDashboard() {
        this.hideModal('login-modal');
        this.showMessage('Redirecting to admin dashboard...', 'info');
        
        // Small delay to show the message before redirecting
        setTimeout(() => {
            // Navigate to admin dashboard
            window.location.href = '../Admin-Dashboard/index.html';
        }, 1000);
    }

    // Show login error message in the modal
    showLoginError(message) {
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    // Hide login error message
    hideLoginError() {
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.textContent = '';
        }
    }

    handleRegister(e) {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const phone = document.getElementById('reg-phone').value;
        const address = document.getElementById('reg-address').value;
        const usertype = document.getElementById('reg-usertype').value;

        // Check if username already exists
        if (this.users.find(u => u.username === username)) {
            this.showMessage('Username already exists', 'error');
            return;
        }

        const newUser = {
            id: Math.max(...this.users.map(u => u.id)) + 1,
            username,
            hashed_password: password,
            phone,
            address,
            usertype
        };

        this.users.push(newUser);
        this.currentUser = newUser;
        this.saveData();
        this.hideModal('register-modal');
        this.updateUIForLoggedInUser();
        this.showMessage('Registration successful!', 'success');
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('foodshare_current_user');
        this.updateUIForLoggedOutUser();
        this.showMessage('Logged out successfully', 'info');
    }

    checkAuthStatus() {
        if (this.currentUser) {
            this.updateUIForLoggedInUser();
        } else {
            this.updateUIForLoggedOutUser();
        }
    }

    updateUIForLoggedInUser() {
        // Update navigation
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        
        loginBtn.textContent = `Welcome, ${this.currentUser.username}`;
        loginBtn.onclick = () => this.showDashboard();
        
        registerBtn.textContent = 'Logout';
        registerBtn.onclick = () => this.logout();
        registerBtn.className = 'btn-login';

        // Show dashboard section
        document.getElementById('dashboard').style.display = 'block';
        this.loadDashboard();
    }

    updateUIForLoggedOutUser() {
        const loginBtn = document.getElementById('login-btn');
        const registerBtn = document.getElementById('register-btn');
        
        loginBtn.textContent = 'Login';
        loginBtn.onclick = () => this.showModal('login-modal');
        
        registerBtn.textContent = 'Register';
        registerBtn.onclick = () => this.showModal('register-modal');
        registerBtn.className = 'btn-register';

        // Hide dashboard section
        document.getElementById('dashboard').style.display = 'none';
        
        // Clear any open modals
        this.hideModal('login-modal');
        this.hideModal('register-modal');
    }

    // Food Donation
    handleDonation(e) {
        e.preventDefault();
        
        if (!this.currentUser) {
            this.showMessage('Please login to donate food', 'error');
            return;
        }

        const donation = {
            donation_id: Math.max(...this.donations.map(d => d.donation_id), 0) + 1,
            donor_id: this.currentUser.id,
            title: document.getElementById('donation-title').value,
            description: document.getElementById('donation-description').value,
            quantity: document.getElementById('donation-quantity').value,
            pickup_time: document.getElementById('pickup-time').value,
            expiry_time: document.getElementById('expiry-time').value,
            status: 'available'
        };

        this.donations.push(donation);
        this.saveData();
        this.renderFoodList();
        this.loadDashboard();
        
        // Clear form
        document.getElementById('donate-form').reset();
        this.showMessage('Food donation listed successfully!', 'success');
    }

    // Food Browsing and Requests
    renderFoodList() {
        const searchTerm = document.getElementById('search-food').value.toLowerCase();
        const statusFilter = document.getElementById('filter-status').value;
        
        let filteredDonations = this.donations.filter(donation => {
            const matchesSearch = donation.title.toLowerCase().includes(searchTerm) ||
                                donation.description.toLowerCase().includes(searchTerm);
            const matchesStatus = !statusFilter || donation.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        const foodList = document.getElementById('food-list');
        foodList.innerHTML = '';

        if (filteredDonations.length === 0) {
            foodList.innerHTML = '<p class="text-center">No food items found matching your criteria.</p>';
            return;
        }

        filteredDonations.forEach(donation => {
            const foodCard = this.createFoodCard(donation);
            foodList.appendChild(foodCard);
        });
    }

    createFoodCard(donation) {
        const card = document.createElement('div');
        card.className = 'food-card';
        
        const donor = this.users.find(u => u.id === donation.donor_id);
        const isExpired = new Date(donation.expiry_time) < new Date();
        const canRequest = this.currentUser && 
                          this.currentUser.usertype === 'recipient' && 
                          donation.status === 'available' && 
                          !isExpired &&
                          donation.donor_id !== this.currentUser.id;

        card.innerHTML = `
            <div class="status ${donation.status}">${donation.status}</div>
            <h3>${donation.title}</h3>
            <div class="quantity">${donation.quantity}</div>
            <div class="description">${donation.description}</div>
            <div class="time-info">
                <div>Pickup by: ${this.formatDateTime(donation.pickup_time)}</div>
                <div>Expires: ${this.formatDateTime(donation.expiry_time)}</div>
            </div>
            <div class="donor-info">
                <small>Donated by: ${donor ? donor.username : 'Unknown'}</small>
            </div>
            ${canRequest ? 
                `<button class="btn-request" onclick="app.requestFood(${donation.donation_id})">Request Food</button>` :
                `<button class="btn-request" disabled>${isExpired ? 'Expired' : donation.status === 'reserved' ? 'Reserved' : 'Login to Request'}</button>`
            }
        `;

        return card;
    }

    requestFood(donationId) {
        if (!this.currentUser || this.currentUser.usertype !== 'recipient') {
            this.showMessage('Only recipients can request food', 'error');
            return;
        }

        const donation = this.donations.find(d => d.donation_id === donationId);
        if (!donation || donation.status !== 'available') {
            this.showMessage('This food item is no longer available', 'error');
            return;
        }

        // Create distribution record
        const distribution = {
            distribution_id: Math.max(...this.distributions.map(d => d.distribution_id), 0) + 1,
            donation_id: donationId,
            receipient_id: this.currentUser.id,
            delivery_status: 'pending',
            delivered_at: null,
            pickup_confirmed: false
        };

        this.distributions.push(distribution);
        
        // Update donation status
        donation.status = 'reserved';
        
        this.saveData();
        this.renderFoodList();
        this.loadDashboard();
        this.showMessage('Food request submitted successfully!', 'success');
    }

    // Dashboard Management
    showDashboard() {
        document.getElementById('dashboard').scrollIntoView({ behavior: 'smooth' });
        this.loadDashboard();
    }

    loadDashboard() {
        if (!this.currentUser) return;

        this.loadMyDonations();
        this.loadMyRequests();
        this.loadFeedback();
    }

    loadMyDonations() {
        const myDonations = this.donations.filter(d => d.donor_id === this.currentUser.id);
        const donationsList = document.getElementById('donations-list');
        
        donationsList.innerHTML = '';
        
        if (myDonations.length === 0) {
            donationsList.innerHTML = '<p>You haven\'t donated any food yet.</p>';
            return;
        }

        myDonations.forEach(donation => {
            const distribution = this.distributions.find(dist => dist.donation_id === donation.donation_id);
            const recipient = distribution ? this.users.find(u => u.id === distribution.receipient_id) : null;
            
            const card = document.createElement('div');
            card.className = 'donation-card';
            card.innerHTML = `
                <h3>${donation.title}</h3>
                <div class="quantity">${donation.quantity}</div>
                <div class="status ${donation.status}">${donation.status}</div>
                <div class="time-info">
                    <div>Pickup by: ${this.formatDateTime(donation.pickup_time)}</div>
                    <div>Expires: ${this.formatDateTime(donation.expiry_time)}</div>
                </div>
                ${distribution ? `
                    <div class="distribution-info">
                        <p><strong>Requested by:</strong> ${recipient ? recipient.username : 'Unknown'}</p>
                        <p><strong>Status:</strong> ${distribution.delivery_status}</p>
                        ${distribution.delivery_status === 'pending' ? 
                            `<button class="btn-primary" onclick="app.confirmPickup(${distribution.distribution_id})">Confirm Pickup</button>` :
                            ''
                        }
                    </div>
                ` : ''}
            `;
            donationsList.appendChild(card);
        });
    }

    loadMyRequests() {
        const myDistributions = this.distributions.filter(d => d.receipient_id === this.currentUser.id);
        const requestsList = document.getElementById('requests-list');
        
        requestsList.innerHTML = '';
        
        if (myDistributions.length === 0) {
            requestsList.innerHTML = '<p>You haven\'t requested any food yet.</p>';
            return;
        }

        myDistributions.forEach(distribution => {
            const donation = this.donations.find(d => d.donation_id === distribution.donation_id);
            const donor = donation ? this.users.find(u => u.id === donation.donor_id) : null;
            
            const card = document.createElement('div');
            card.className = 'request-card';
            card.innerHTML = `
                <h3>${donation ? donation.title : 'Unknown Food'}</h3>
                <div class="quantity">${donation ? donation.quantity : 'N/A'}</div>
                <div class="status ${distribution.delivery_status}">${distribution.delivery_status}</div>
                <div class="donor-info">
                    <p><strong>Donated by:</strong> ${donor ? donor.username : 'Unknown'}</p>
                </div>
                <div class="time-info">
                    ${distribution.delivered_at ? 
                        `<div>Delivered: ${this.formatDateTime(distribution.delivered_at)}</div>` :
                        `<div>Requested: ${this.formatDateTime(distribution.created_at || new Date().toISOString())}</div>`
                    }
                </div>
                ${distribution.delivery_status === 'delivered' && !this.hasFeedback(distribution.distribution_id) ? 
                    `<button class="btn-primary" onclick="app.showFeedbackForm(${distribution.distribution_id})">Leave Feedback</button>` :
                    ''
                }
            `;
            requestsList.appendChild(card);
        });
    }

    loadFeedback() {
        const myFeedback = this.feedback.filter(f => f.user_id === this.currentUser.id);
        const feedbackList = document.getElementById('feedback-list');
        
        feedbackList.innerHTML = '';
        
        if (myFeedback.length === 0) {
            feedbackList.innerHTML = '<p>You haven\'t left any feedback yet.</p>';
            return;
        }

        myFeedback.forEach(feedback => {
            const distribution = this.distributions.find(d => d.distribution_id === feedback.distribution_id);
            const donation = distribution ? this.donations.find(d => d.donation_id === distribution.donation_id) : null;
            
            const card = document.createElement('div');
            card.className = 'feedback-card';
            card.innerHTML = `
                <h3>${donation ? donation.title : 'Unknown Food'}</h3>
                <div class="rating">
                    ${this.renderStars(feedback.rating)}
                </div>
                <div class="comments">${feedback.comments}</div>
                <div class="time-info">
                    <div>Posted: ${this.formatDateTime(feedback.created_at)}</div>
                </div>
            `;
            feedbackList.appendChild(card);
        });
    }

    // Distribution Management
    confirmPickup(distributionId) {
        const distribution = this.distributions.find(d => d.distribution_id === distributionId);
        if (distribution) {
            distribution.delivery_status = 'delivered';
            distribution.delivered_at = new Date().toISOString();
            distribution.pickup_confirmed = true;
            
            // Update donation status
            const donation = this.donations.find(d => d.donation_id === distribution.donation_id);
            if (donation) {
                donation.status = 'distributed';
            }
            
            this.saveData();
            this.loadDashboard();
            this.renderFoodList();
            this.showMessage('Pickup confirmed successfully!', 'success');
        }
    }

    // Feedback System
    hasFeedback(distributionId) {
        return this.feedback.some(f => f.distribution_id === distributionId);
    }

    showFeedbackForm(distributionId) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
                <h2>Leave Feedback</h2>
                <form id="feedback-form">
                    <div class="form-group">
                        <label>Rating</label>
                        <div class="rating" id="rating-input">
                            <span class="star" data-rating="1">★</span>
                            <span class="star" data-rating="2">★</span>
                            <span class="star" data-rating="3">★</span>
                            <span class="star" data-rating="4">★</span>
                            <span class="star" data-rating="5">★</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="feedback-comments">Comments</label>
                        <textarea id="feedback-comments" placeholder="Share your experience..." required></textarea>
                    </div>
                    <button type="submit" class="btn-primary">Submit Feedback</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Rating stars functionality
        modal.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', () => {
                const rating = parseInt(star.dataset.rating);
                modal.querySelectorAll('.star').forEach((s, index) => {
                    s.classList.toggle('active', index < rating);
                });
            });
        });
        
        // Form submission
        modal.querySelector('#feedback-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const rating = modal.querySelectorAll('.star.active').length;
            const comments = document.getElementById('feedback-comments').value;
            
            const newFeedback = {
                feedback_id: Math.max(...this.feedback.map(f => f.feedback_id), 0) + 1,
                distribution_id: distributionId,
                user_id: this.currentUser.id,
                rating: rating,
                comments: comments,
                created_at: new Date().toISOString()
            };
            
            this.feedback.push(newFeedback);
            this.saveData();
            this.loadDashboard();
            modal.remove();
            this.showMessage('Feedback submitted successfully!', 'success');
        });
    }

    renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="star ${i <= rating ? 'active' : ''}">★</span>`;
        }
        return stars;
    }

    // Tab Management
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');
    }

    // Utility Functions
    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
        // Clear login error when opening login modal
        if (modalId === 'login-modal') {
            this.hideLoginError();
        }
    }

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    toggleMobileMenu() {
        const navMenu = document.getElementById('nav-menu');
        navMenu.classList.toggle('active');
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        // Insert at the top of the page
        document.body.insertBefore(messageDiv, document.body.firstChild);
        
        // Remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Initialize the application
const app = new FoodShareApp();

// Additional utility functions for global access
window.app = app;
