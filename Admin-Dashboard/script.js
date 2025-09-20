// Admin Dashboard Application
class AdminDashboard {
    constructor() {
        this.currentDonor = null;
        this.users = [];
        this.donations = [];
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.loadDashboard();
    }

    // Data Management
    loadData() {
        // Load data from main application's local storage
        const savedUsers = localStorage.getItem('foodshare_users');
        this.users = savedUsers ? JSON.parse(savedUsers) : this.getDefaultUsers();

        const savedDonations = localStorage.getItem('foodshare_donations');
        this.donations = savedDonations ? JSON.parse(savedDonations) : this.getDefaultDonations();

        // Add approval status to users if not present
        this.users.forEach(user => {
            if (!user.approval_status) {
                user.approval_status = user.usertype === 'donor' ? 'pending' : 'approved';
            }
        });
    }

    saveData() {
        localStorage.setItem('foodshare_users', JSON.stringify(this.users));
        localStorage.setItem('foodshare_donations', JSON.stringify(this.donations));
    }

    getDefaultUsers() {
        return [
            {
                id: 1,
                username: 'john_doe',
                hashed_password: 'password123',
                phone: '+1-555-0123',
                address: '123 Main St, City, State 12345',
                usertype: 'donor',
                approval_status: 'approved'
            },
            {
                id: 2,
                username: 'jane_smith',
                hashed_password: 'password123',
                phone: '+1-555-0456',
                address: '456 Oak Ave, City, State 12345',
                usertype: 'recipient',
                approval_status: 'approved'
            },
            {
                id: 3,
                username: 'restaurant_owner',
                hashed_password: 'password123',
                phone: '+1-555-0789',
                address: '789 Restaurant Row, City, State 12345',
                usertype: 'donor',
                approval_status: 'pending'
            },
            {
                id: 4,
                username: 'cafe_manager',
                hashed_password: 'password123',
                phone: '+1-555-0321',
                address: '321 Coffee Street, City, State 12345',
                usertype: 'donor',
                approval_status: 'pending'
            }
        ];
    }

    getDefaultDonations() {
        return [
            {
                donation_id: 1,
                donor_id: 1,
                title: 'Fresh Pizza Slices',
                description: 'Leftover pizza from our restaurant. Still warm and delicious!',
                quantity: '8 slices',
                pickup_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
                expiry_time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
                status: 'distributed'
            },
            {
                donation_id: 2,
                donor_id: 1,
                title: 'Sandwich Platters',
                description: 'Assorted sandwiches from corporate event.',
                quantity: '12 sandwiches',
                pickup_time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
                expiry_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
                status: 'distributed'
            },
            {
                donation_id: 3,
                donor_id: 2,
                title: 'Fresh Fruit Basket',
                description: 'Mixed fruit basket with apples, bananas, oranges.',
                quantity: '1 large basket',
                pickup_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
                expiry_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                status: 'available'
            }
        ];
    }

    // Event Listeners
    setupEventListeners() {
        // Sidebar navigation
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.switchSection(section);
            });
        });

        // Search and filter functionality
        document.getElementById('donation-search').addEventListener('input', () => this.loadDonations());
        document.getElementById('donation-filter').addEventListener('change', () => this.loadDonations());
        
        document.getElementById('donor-search').addEventListener('input', () => this.loadDonors());
        document.getElementById('donor-filter').addEventListener('change', () => this.loadDonors());
    }

    // Navigation
    switchSection(sectionName) {
        // Update sidebar
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update content
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(sectionName).classList.add('active');

        // Load section data
        switch(sectionName) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'donations':
                this.loadDonations();
                break;
            case 'donors':
                this.loadDonors();
                break;
        }
    }

    // Dashboard
    loadDashboard() {
        this.updateStatistics();
        this.loadRecentDonations();
        this.loadPendingApprovals();
    }

    updateStatistics() {
        const totalDonations = this.donations.length;
        const receivedDonations = this.donations.filter(d => d.status === 'distributed').length;
        const totalDonors = this.users.filter(u => u.usertype === 'donor').length;
        const approvedDonors = this.users.filter(u => u.usertype === 'donor' && u.approval_status === 'approved').length;

        document.getElementById('total-donations').textContent = totalDonations;
        document.getElementById('received-donations').textContent = receivedDonations;
        document.getElementById('total-donors').textContent = totalDonors;
        document.getElementById('approved-donors').textContent = approvedDonors;
    }

    loadRecentDonations() {
        const recentDonations = this.donations
            .sort((a, b) => new Date(b.pickup_time) - new Date(a.pickup_time))
            .slice(0, 5);

        const container = document.getElementById('recent-donations');
        container.innerHTML = '';

        if (recentDonations.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No donations yet</p></div>';
            return;
        }

        recentDonations.forEach(donation => {
            const donor = this.users.find(u => u.id === donation.donor_id);
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-icon donation">
                    <i class="fas fa-utensils"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${donation.title}</div>
                    <div class="activity-time">${this.formatDateTime(donation.pickup_time)} - ${donor ? donor.username : 'Unknown'}</div>
                </div>
            `;
            container.appendChild(item);
        });
    }

    loadPendingApprovals() {
        const pendingDonors = this.users.filter(u => u.usertype === 'donor' && u.approval_status === 'pending');

        const container = document.getElementById('pending-approvals');
        container.innerHTML = '';

        if (pendingDonors.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No pending approvals</p></div>';
            return;
        }

        pendingDonors.slice(0, 5).forEach(donor => {
            const item = document.createElement('div');
            item.className = 'activity-item';
            item.innerHTML = `
                <div class="activity-icon approval">
                    <i class="fas fa-user-clock"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${donor.username}</div>
                    <div class="activity-time">Pending approval</div>
                </div>
            `;
            container.appendChild(item);
        });
    }

    // Donations Management
    loadDonations() {
        const searchTerm = document.getElementById('donation-search').value.toLowerCase();
        const statusFilter = document.getElementById('donation-filter').value;

        let filteredDonations = this.donations.filter(donation => {
            const matchesSearch = donation.title.toLowerCase().includes(searchTerm) ||
                                donation.description.toLowerCase().includes(searchTerm);
            const matchesStatus = !statusFilter || donation.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        const container = document.getElementById('donations-list');
        container.innerHTML = '';

        if (filteredDonations.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-utensils"></i><h3>No donations found</h3><p>No donations match your search criteria.</p></div>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'data-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Donor</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Pickup Time</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredDonations.map(donation => {
                    const donor = this.users.find(u => u.id === donation.donor_id);
                    return `
                        <tr>
                            <td>#${donation.donation_id}</td>
                            <td>${donation.title}</td>
                            <td>${donor ? donor.username : 'Unknown'}</td>
                            <td>${donation.quantity}</td>
                            <td><span class="status-badge ${donation.status}">${donation.status}</span></td>
                            <td>${this.formatDateTime(donation.pickup_time)}</td>
                            <td>
                                <button class="btn-action btn-view" onclick="adminApp.viewDonation(${donation.donation_id})">
                                    <i class="fas fa-eye"></i> View
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        `;
        container.appendChild(table);
    }

    // Donor Management
    loadDonors() {
        const searchTerm = document.getElementById('donor-search').value.toLowerCase();
        const statusFilter = document.getElementById('donor-filter').value;

        let filteredDonors = this.users.filter(user => {
            if (user.usertype !== 'donor') return false;
            const matchesSearch = user.username.toLowerCase().includes(searchTerm) ||
                                user.address.toLowerCase().includes(searchTerm);
            const matchesStatus = !statusFilter || user.approval_status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        const container = document.getElementById('donors-list');
        container.innerHTML = '';

        if (filteredDonors.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><h3>No donors found</h3><p>No donors match your search criteria.</p></div>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'data-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Status</th>
                    <th>Donations</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${filteredDonors.map(donor => {
                    const donationCount = this.donations.filter(d => d.donor_id === donor.id).length;
                    return `
                        <tr>
                            <td>#${donor.id}</td>
                            <td>${donor.username}</td>
                            <td>${donor.phone}</td>
                            <td>${donor.address}</td>
                            <td><span class="status-badge ${donor.approval_status}">${donor.approval_status}</span></td>
                            <td>${donationCount}</td>
                            <td>
                                ${donor.approval_status === 'pending' ? `
                                    <button class="btn-action btn-approve" onclick="adminApp.showApprovalModal(${donor.id})">
                                        <i class="fas fa-check"></i> Review
                                    </button>
                                ` : `
                                    <button class="btn-action btn-view" onclick="adminApp.viewDonor(${donor.id})">
                                        <i class="fas fa-eye"></i> View
                                    </button>
                                `}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        `;
        container.appendChild(table);
    }

    // Donor Approval System
    showApprovalModal(donorId) {
        const donor = this.users.find(u => u.id === donorId);
        if (!donor) return;

        this.currentDonor = donor;
        
        const modal = document.getElementById('approval-modal');
        const detailsContainer = document.getElementById('donor-details');
        
        detailsContainer.innerHTML = `
            <div class="detail-row">
                <span class="detail-label">Username:</span>
                <span class="detail-value">${donor.username}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Phone:</span>
                <span class="detail-value">${donor.phone}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Address:</span>
                <span class="detail-value">${donor.address}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">User Type:</span>
                <span class="detail-value">${donor.usertype}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Current Status:</span>
                <span class="detail-value"><span class="status-badge ${donor.approval_status}">${donor.approval_status}</span></span>
            </div>
        `;
        
        modal.style.display = 'block';
    }

    hideApprovalModal() {
        document.getElementById('approval-modal').style.display = 'none';
        this.currentDonor = null;
    }

    approveDonor() {
        if (!this.currentDonor) return;

        this.currentDonor.approval_status = 'approved';
        this.saveData();
        this.hideApprovalModal();
        this.loadDonors();
        this.loadDashboard();
        this.showMessage('Donor approved successfully!', 'success');
    }

    rejectDonor() {
        if (!this.currentDonor) return;

        this.currentDonor.approval_status = 'rejected';
        this.saveData();
        this.hideApprovalModal();
        this.loadDonors();
        this.loadDashboard();
        this.showMessage('Donor rejected', 'info');
    }

    // View Functions (Placeholder implementations)
    viewDonation(donationId) {
        const donation = this.donations.find(d => d.donation_id === donationId);
        if (donation) {
            this.showMessage(`Viewing donation: ${donation.title}`, 'info');
        }
    }

    viewDonor(donorId) {
        const donor = this.users.find(u => u.id === donorId);
        if (donor) {
            this.showMessage(`Viewing donor: ${donor.username}`, 'info');
        }
    }

    // Utility Functions
    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += `<span class="star ${i <= rating ? 'active' : ''}">★</span>`;
        }
        return stars;
    }

    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('message-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        
        messageContainer.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '../index.html';
        }
    }

    // Helper function to reset donors to pending status for testing
    resetDonorsToPending() {
        this.users.forEach(user => {
            if (user.usertype === 'donor' && user.id > 2) {
                user.approval_status = 'pending';
            }
        });
        this.saveData();
        this.loadDonors();
        this.showMessage('Donors reset to pending status for testing', 'info');
    }
}

// Initialize the admin dashboard
const adminApp = new AdminDashboard();

// Make it globally accessible
window.adminApp = adminApp;
