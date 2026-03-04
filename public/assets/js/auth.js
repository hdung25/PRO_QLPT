/**
 * Auth Module - Quản lý Nhà trọ
 * 
 * Hỗ trợ 2 chế độ:
 *   - DEMO_MODE = true  → Login bằng tài khoản demo (không cần Firebase)
 *   - DEMO_MODE = false → Login qua Firebase Auth (cần config thật)
 * 
 * Demo Account: admin@nhatro.com / admin123
 */

const Auth = {
    /** 
     * Chế độ Demo - đặt false khi có Firebase thật 
     */
    DEMO_MODE: true,

    /**
     * Tài khoản demo (chỉ dùng khi DEMO_MODE = true)
     */
    DEMO_ACCOUNTS: [
        {
            email: 'admin@nhatro.com',
            password: 'admin123',
            uid: 'demo_admin_001',
            display_name: 'Admin',
            role: 'admin'
        }
    ],

    /**
     * Đăng nhập
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<{token: string, user: object}>}
     */
    async login(email, password) {
        if (this.DEMO_MODE) {
            return this.demoLogin(email, password);
        }
        return this.firebaseLogin(email, password);
    },

    /**
     * Đăng nhập Demo (tài khoản cứng)
     */
    async demoLogin(email, password) {
        // Giả lập network delay
        await new Promise(r => setTimeout(r, 1200));

        const account = this.DEMO_ACCOUNTS.find(
            a => a.email === email.trim().toLowerCase() && a.password === password
        );

        if (!account) {
            throw new Error('Email hoặc mật khẩu không đúng.');
        }

        const token = 'demo_token_' + Date.now();
        const user = {
            uid: account.uid,
            email: account.email,
            display_name: account.display_name,
            role: account.role
        };

        return { token, user };
    },

    /**
     * Đăng nhập qua Firebase Auth
     * TODO: Kích hoạt khi có Firebase config thật
     */
    async firebaseLogin(email, password) {
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK chưa được tải. Vui lòng kiểm tra cấu hình.');
        }

        const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
        const token = await cred.user.getIdToken();

        // Lấy user info từ backend
        const res = await fetch('/api/auth/verify.php', {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        const data = await res.json();

        if (!data.success) {
            throw new Error(data.error || 'Xác thực thất bại.');
        }

        return { token, user: data.data };
    },

    // ─── Session Management ───

    getToken() {
        return localStorage.getItem('auth_token');
    },

    getUser() {
        const user = localStorage.getItem('auth_user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return !!this.getToken();
    },

    saveSession(token, user) {
        localStorage.setItem('auth_token', token);
        localStorage.setItem('auth_user', JSON.stringify(user));
    },

    clearSession() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    },

    // ─── Logout ───

    async logout() {
        try {
            if (!this.DEMO_MODE && typeof firebase !== 'undefined') {
                await firebase.auth().signOut();
            }
        } catch (e) {
            console.warn('Firebase signOut error:', e);
        }
        this.clearSession();
        window.location.href = 'index.html';
    },

    // ─── Guards ───

    /**
     * Guard: Redirect về login nếu chưa đăng nhập
     * Gọi ở đầu mỗi trang protected (dashboard, rooms, etc.)
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    /**
     * Guard: Redirect về dashboard nếu ĐÃ đăng nhập
     * Gọi ở trang login để user đã login không cần login lại
     */
    redirectIfAuthenticated() {
        if (this.isAuthenticated()) {
            window.location.href = 'dashboard.html';
            return true;
        }
        return false;
    }
};
