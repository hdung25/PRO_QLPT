/**
 * DataStore - Firebase Firestore Backend
 * 
 * Realtime sync giữa nhiều tài khoản
 * Collections: rooms, contracts, bills, settings
 * 
 * Tất cả hàm CRUD đều async (trả về Promise)
 * Realtime listeners tự cập nhật UI khi data thay đổi
 */

const db = firebase.firestore();

const DataStore = {
    // ─── Internal cache (populated by listeners) ───
    _cache: {
        rooms: [],
        contracts: [],
        bills: [],
        settings: null
    },

    // ─── Listener callbacks (set by page modules) ───
    _listeners: {
        rooms: null,
        contracts: null,
        bills: null,
        settings: null
    },

    // ─── Unsubscribe functions ───
    _unsubscribers: {},

    _generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // ═══════════════════════════════════════════
    //  REALTIME LISTENERS
    // ═══════════════════════════════════════════

    /**
     * Start listening to a collection with realtime updates
     * @param {string} collection - Collection name
     * @param {function} callback - Called with updated array on each change
     */
    listen(collection, callback) {
        // Unsubscribe previous listener
        if (this._unsubscribers[collection]) {
            this._unsubscribers[collection]();
        }

        this._listeners[collection] = callback;

        this._unsubscribers[collection] = db.collection(collection)
            .onSnapshot((snapshot) => {
                const data = [];
                snapshot.forEach(doc => {
                    data.push({ id: doc.id, ...doc.data() });
                });
                this._cache[collection] = data;
                if (this._listeners[collection]) {
                    this._listeners[collection](data);
                }
            }, (error) => {
                console.error(`❌ Firestore listener error [${collection}]:`, error);
            });
    },

    /**
     * Listen to settings document
     */
    listenSettings(callback) {
        if (this._unsubscribers.settings) {
            this._unsubscribers.settings();
        }

        this._listeners.settings = callback;

        this._unsubscribers.settings = db.collection('settings').doc('main')
            .onSnapshot((doc) => {
                if (doc.exists) {
                    this._cache.settings = doc.data();
                } else {
                    // Auto-create default settings
                    const defaults = this.settings._getDefaults();
                    db.collection('settings').doc('main').set(defaults);
                    this._cache.settings = defaults;
                }
                if (this._listeners.settings) {
                    this._listeners.settings(this._cache.settings);
                }
            }, (error) => {
                console.error('❌ Firestore settings listener error:', error);
            });
    },

    /**
     * Stop all listeners
     */
    stopAll() {
        Object.values(this._unsubscribers).forEach(unsub => {
            if (unsub) unsub();
        });
        this._unsubscribers = {};
    },

    // ═══════════════════════════════════════════
    //  ROOMS
    // ═══════════════════════════════════════════

    rooms: {
        getAll() {
            return DataStore._cache.rooms;
        },

        getById(id) {
            return this.getAll().find(r => r.id === id) || null;
        },

        getAvailable() {
            return this.getAll().filter(r => r.status === 'available');
        },

        async create(data) {
            const rooms = this.getAll();
            if (rooms.some(r => r.room_number === data.room_number)) {
                throw new Error(`Phòng ${data.room_number} đã tồn tại.`);
            }

            const id = DataStore._generateId();
            const room = {
                room_number: data.room_number,
                branch: data.branch || '',
                base_price: parseInt(data.base_price) || 0,
                area: parseInt(data.area) || 0,
                status: 'available',
                description: data.description || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            await db.collection('rooms').doc(id).set(room);
            return { id, ...room };
        },

        async update(id, data) {
            const room = this.getById(id);
            if (!room) throw new Error('Phòng không tồn tại.');

            if (data.room_number && this.getAll().some(r => r.room_number === data.room_number && r.id !== id)) {
                throw new Error(`Phòng ${data.room_number} đã tồn tại.`);
            }

            const updates = { ...data, updated_at: new Date().toISOString() };
            // Remove id from updates if present
            delete updates.id;
            await db.collection('rooms').doc(id).update(updates);
            return { id, ...room, ...updates };
        },

        async delete(id) {
            const room = this.getById(id);
            if (!room) throw new Error('Phòng không tồn tại.');
            if (room.status === 'occupied') {
                throw new Error('Không thể xóa phòng đang có người thuê.');
            }

            const contracts = DataStore.contracts.getAll();
            if (contracts.some(c => c.room_id === id && c.status === 'active')) {
                throw new Error('Không thể xóa phòng đang có hợp đồng.');
            }

            await db.collection('rooms').doc(id).delete();
            return true;
        }
    },

    // ═══════════════════════════════════════════
    //  CONTRACTS
    // ═══════════════════════════════════════════

    contracts: {
        getAll() {
            return DataStore._cache.contracts;
        },

        getById(id) {
            return this.getAll().find(c => c.id === id) || null;
        },

        getActive() {
            return this.getAll().filter(c => c.status === 'active');
        },

        getByRoom(roomId) {
            return this.getAll().filter(c => c.room_id === roomId);
        },

        getActiveByRoom(roomId) {
            return this.getAll().find(c => c.room_id === roomId && c.status === 'active') || null;
        },

        async create(data) {
            const room = DataStore.rooms.getById(data.room_id);
            if (!room) throw new Error('Phòng không tồn tại.');

            const id = DataStore._generateId();
            const contract = {
                room_id: data.room_id,
                room_number: room.room_number,
                tenant_name: data.tenant_name,
                tenant_phone: data.tenant_phone || '',
                tenant_id_number: data.tenant_id_number || '',
                tenant_email: data.tenant_email || '',
                tenant_address: data.tenant_address || '',
                id_card_front: data.id_card_front || '',
                id_card_back: data.id_card_back || '',
                contract_image: data.contract_image || '',
                start_date: data.start_date,
                end_date: data.end_date,
                monthly_rent: parseInt(data.monthly_rent) || room.base_price,
                deposit: parseInt(data.deposit) || 0,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Batch: create contract + update room status
            const batch = db.batch();
            batch.set(db.collection('contracts').doc(id), contract);
            batch.update(db.collection('rooms').doc(data.room_id), {
                status: 'occupied',
                updated_at: new Date().toISOString()
            });
            await batch.commit();

            return { id, ...contract };
        },

        async update(id, data) {
            const contract = this.getById(id);
            if (!contract) throw new Error('Hợp đồng không tồn tại.');

            const updates = { ...data, updated_at: new Date().toISOString() };
            delete updates.id;
            await db.collection('contracts').doc(id).update(updates);
            return { id, ...contract, ...updates };
        },

        async terminate(id) {
            const contract = this.getById(id);
            if (!contract) throw new Error('Hợp đồng không tồn tại.');

            const batch = db.batch();
            batch.update(db.collection('contracts').doc(id), {
                status: 'terminated',
                updated_at: new Date().toISOString()
            });

            // Check if room has other active contracts
            const otherActive = this.getAll().find(
                c => c.room_id === contract.room_id && c.status === 'active' && c.id !== id
            );
            if (!otherActive) {
                batch.update(db.collection('rooms').doc(contract.room_id), {
                    status: 'available',
                    updated_at: new Date().toISOString()
                });
            }

            await batch.commit();
            return true;
        },

        async switchTenant(oldContractId, newData) {
            const oldContract = this.getById(oldContractId);
            if (!oldContract) throw new Error('Hợp đồng cũ không tồn tại.');

            // Terminate old
            await this.update(oldContractId, { status: 'terminated' });

            // Create new on same room
            const newContract = await this.create({
                room_id: oldContract.room_id,
                ...newData,
                monthly_rent: newData.monthly_rent || oldContract.monthly_rent,
            });

            return newContract;
        }
    },

    // ═══════════════════════════════════════════
    //  BILLS
    // ═══════════════════════════════════════════

    bills: {
        getAll() {
            return DataStore._cache.bills;
        },

        getById(id) {
            return this.getAll().find(b => b.id === id) || null;
        },

        getByRoom(roomId) {
            return this.getAll().filter(b => b.room_id === roomId);
        },

        getUnpaid() {
            return this.getAll().filter(b => b.payment_status === 'unpaid');
        },

        getLastBill(roomId) {
            const roomBills = this.getByRoom(roomId)
                .sort((a, b) => b.billing_month.localeCompare(a.billing_month));
            return roomBills[0] || null;
        },

        async create(data) {
            const id = DataStore._generateId();
            const bill = {
                contract_id: data.contract_id || '',
                room_id: data.room_id,
                room_number: data.room_number,
                tenant_name: data.tenant_name,
                billing_month: data.billing_month,
                electricity: {
                    old_reading: parseInt(data.elec_old) || 0,
                    new_reading: parseInt(data.elec_new) || 0,
                    usage: (parseInt(data.elec_new) || 0) - (parseInt(data.elec_old) || 0),
                    unit_price: parseInt(data.elec_price) || 0,
                    total: ((parseInt(data.elec_new) || 0) - (parseInt(data.elec_old) || 0)) * (parseInt(data.elec_price) || 0)
                },
                water: {
                    old_reading: parseInt(data.water_old) || 0,
                    new_reading: parseInt(data.water_new) || 0,
                    usage: (parseInt(data.water_new) || 0) - (parseInt(data.water_old) || 0),
                    unit_price: parseInt(data.water_price) || 0,
                    total: ((parseInt(data.water_new) || 0) - (parseInt(data.water_old) || 0)) * (parseInt(data.water_price) || 0)
                },
                extra_fees: data.extra_fees || [],
                extra_fees_total: (data.extra_fees || []).reduce((s, f) => s + (parseInt(f.amount) || 0), 0),
                room_rent: parseInt(data.room_rent) || 0,
                grand_total: 0,
                payment_status: 'unpaid',
                payment_date: null,
                notes: data.notes || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Calculate grand total
            bill.grand_total = bill.room_rent + bill.electricity.total + bill.water.total + bill.extra_fees_total;

            await db.collection('bills').doc(id).set(bill);
            return { id, ...bill };
        },

        async update(id, data) {
            const bill = this.getById(id);
            if (!bill) throw new Error('Hóa đơn không tồn tại.');

            const updates = { ...data, updated_at: new Date().toISOString() };
            delete updates.id;
            await db.collection('bills').doc(id).update(updates);
            return { id, ...bill, ...updates };
        },

        async markPaid(id) {
            return this.update(id, {
                payment_status: 'paid',
                payment_date: new Date().toISOString()
            });
        }
    },

    // ═══════════════════════════════════════════
    //  SETTINGS
    // ═══════════════════════════════════════════

    settings: {
        _getDefaults() {
            return {
                electricity_price: 3500,
                water_price: 15000,
                default_extra_fees: [
                    { name: 'Rác', amount: 20000 },
                    { name: 'Wifi', amount: 50000 }
                ],
                branches: [],
                branch_qr_codes: {},  // { "Cơ sở 1": "data:image/png;base64,...", ... }
                branch_addresses: {},  // { "Cơ sở 1": "123 Đường ABC, Quận 1", ... }
                assistant_accounts: [],  // [{ email, password, display_name, assigned_branches }]
                landlord_name: '',
                landlord_phone: '',
                property_name: 'Nhà trọ',
                property_address: ''
            };
        },

        get() {
            return DataStore._cache.settings || this._getDefaults();
        },

        async save(data) {
            await db.collection('settings').doc('main').set(data, { merge: true });
            return data;
        }
    }
};

// Initialize Firestore
console.log('✅ DataStore: Firestore mode initialized');
