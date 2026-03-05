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
     * Chế độ Demo - đặt true để test offline không cần Firebase
     * Production: false (dùng Firebase Auth thật)
     */
    DEMO_MODE: true,

    /**
     * Tài khoản demo (chỉ dùng khi DEMO_MODE = true)
     */
    DEMO_ACCOUNTS: [
        {
            email: 'admin@nhatro.com',
            password: 'Admin@123456',
            uid: 'demo_admin_001',
            display_name: 'Admin',
            role: 'admin'
        },
        {
            email: 'troly@nhatro.com',
            password: 'Troly@123456',
            uid: 'demo_troly_001',
            display_name: 'Trợ lí Admin',
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
     */
    async firebaseLogin(email, password) {
        if (typeof firebase === 'undefined') {
            throw new Error('Firebase SDK chưa được tải. Vui lòng kiểm tra kết nối mạng.');
        }

        try {
            const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
            const token = await cred.user.getIdToken();

            const user = {
                uid: cred.user.uid,
                email: cred.user.email,
                display_name: cred.user.displayName || cred.user.email.split('@')[0],
                role: 'admin' // TODO: Lấy role từ Firestore khi có API backend
            };

            return { token, user };
        } catch (firebaseError) {
            // Map Firebase error codes sang tiếng Việt
            const errorMap = {
                'auth/user-not-found': 'Email không tồn tại trong hệ thống.',
                'auth/wrong-password': 'Mật khẩu không đúng.',
                'auth/invalid-email': 'Email không hợp lệ.',
                'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa.',
                'auth/too-many-requests': 'Quá nhiều lần thử. Vui lòng thử lại sau.',
                'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
                'auth/network-request-failed': 'Lỗi kết nối mạng. Vui lòng kiểm tra internet.'
            };
            throw new Error(errorMap[firebaseError.code] || firebaseError.message);
        }
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
