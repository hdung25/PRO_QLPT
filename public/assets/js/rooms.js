/**
 * Rooms Module - Quản lý Phòng trọ
 * CRUD phòng: Danh sách, Thêm, Sửa, Xóa
 * Firestore realtime + Cơ sở (branch) thay vì Tầng
 */

document.addEventListener('DOMContentLoaded', () => {
    // Start realtime listener - auto-renders on data change
    DataStore.listen('rooms', (rooms) => {
        renderRooms(filterByPermittedBranches(rooms, 'branch'));
        populateBranchFilter();
    });
    DataStore.listen('contracts', () => {
        // Re-render rooms when contracts change (tenant info)
        renderRooms(filterByPermittedBranches(DataStore.rooms.getAll(), 'branch'));
    });
    DataStore.listenSettings(() => {
        populateBranchFilter();
    });
    Modal.initCloseOnOverlay();
});

/* ============================================
   RENDER
   ============================================ */

function renderRooms(rooms) {
    const tbody = document.getElementById('roomsTableBody');
    const countEl = document.getElementById('roomCount');

    // Sort by room number
    rooms.sort((a, b) => (a.room_number || '').localeCompare(b.room_number || '', 'vi', { numeric: true }));

    if (countEl) countEl.textContent = rooms.length;
    if (!tbody) return;

    if (rooms.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-icon">🏠</div>
                        <h3>Chưa có phòng nào</h3>
                        <p>Nhấn nút "Thêm phòng" để tạo phòng trọ đầu tiên.</p>
                        <button class="btn btn-primary" onclick="openAddRoom()">
                            <i data-lucide="plus"></i> Thêm phòng
                        </button>
                    </div>
                </td>
            </tr>`;
        lucide.createIcons();
        return;
    }

    tbody.innerHTML = rooms.map(room => {
        const statusBadge = getStatusBadge(room.status);
        const contract = DataStore.contracts.getActiveByRoom(room.id);
        const tenantName = contract ? contract.tenant_name : '—';

        return `
        <tr>
            <td><strong>${room.room_number}</strong></td>
            <td>${room.branch || '—'}</td>
            <td>${room.area ? room.area + ' m²' : '—'}</td>
            <td><strong>${formatMoney(room.base_price)}</strong></td>
            <td>${tenantName}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="action-cell">
                    <button class="btn btn-ghost btn-icon sm" onclick="openEditRoom('${room.id}')" title="Sửa">
                        <i data-lucide="pencil"></i>
                    </button>
                    ${room.status !== 'occupied' ? `
                    <button class="btn btn-ghost btn-icon sm" onclick="deleteRoom('${room.id}')" title="Xóa" style="color: var(--danger-500);">
                        <i data-lucide="trash-2"></i>
                    </button>` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');

    lucide.createIcons();
}

function getStatusBadge(status) {
    const map = {
        'available': '<span class="badge badge-success"><span class="badge-dot"></span> Trống</span>',
        'occupied': '<span class="badge badge-danger"><span class="badge-dot"></span> Đang thuê</span>',
        'maintenance': '<span class="badge badge-warning"><span class="badge-dot"></span> Bảo trì</span>'
    };
    return map[status] || '<span class="badge badge-neutral">Không rõ</span>';
}

function populateBranchFilter() {
    const select = document.getElementById('filterBranch');
    if (!select) return;

    const settings = DataStore.settings.get();
    let branches = settings.branches || [];
    const permitted = getPermittedBranches();
    if (permitted.length > 0) {
        branches = branches.filter(b => permitted.includes(b));
    }
    const currentValue = select.value;

    // Keep first option, rebuild rest
    select.innerHTML = '<option value="">Tất cả cơ sở</option>';
    branches.forEach(b => {
        select.innerHTML += `<option value="${b}">${b}</option>`;
    });

    // Restore selection
    if (currentValue) select.value = currentValue;
}

/* ============================================
   ADD ROOM
   ============================================ */

function openAddRoom() {
    document.getElementById('roomModalTitle').textContent = 'Thêm phòng mới';
    document.getElementById('roomForm').reset();
    document.getElementById('roomId').value = '';
    Modal.open('roomModal');
}

async function saveRoom() {
    const id = document.getElementById('roomId').value;
    const data = {
        room_number: document.getElementById('roomNumber').value.trim(),
        branch: document.getElementById('roomBranch').value.trim(),
        base_price: document.getElementById('roomPrice').value,
        area: document.getElementById('roomArea').value,
        description: document.getElementById('roomDescription').value.trim()
    };

    if (!data.room_number) {
        Toast.warning('Vui lòng nhập số phòng.');
        return;
    }
    if (!data.base_price || parseInt(data.base_price) <= 0) {
        Toast.warning('Vui lòng nhập giá thuê hợp lệ.');
        return;
    }

    try {
        if (id) {
            await DataStore.rooms.update(id, data);
            Toast.success('Cập nhật phòng thành công!');
        } else {
            await DataStore.rooms.create(data);
            Toast.success('Thêm phòng mới thành công!');
        }
        Modal.close('roomModal');
        // No need to call loadRooms() - realtime listener auto-updates
    } catch (error) {
        Toast.error(error.message);
    }
}

/* ============================================
   EDIT ROOM
   ============================================ */

function openEditRoom(id) {
    const room = DataStore.rooms.getById(id);
    if (!room) return Toast.error('Không tìm thấy phòng.');

    document.getElementById('roomModalTitle').textContent = 'Sửa phòng ' + room.room_number;
    document.getElementById('roomId').value = room.id;
    document.getElementById('roomNumber').value = room.room_number;
    document.getElementById('roomBranch').value = room.branch || '';
    document.getElementById('roomPrice').value = room.base_price;
    document.getElementById('roomArea').value = room.area || '';
    document.getElementById('roomDescription').value = room.description || '';

    Modal.open('roomModal');
}

/* ============================================
   DELETE ROOM
   ============================================ */

async function deleteRoom(id) {
    const room = DataStore.rooms.getById(id);
    if (!room) return;

    const ok = await confirmAction(
        `Bạn có chắc muốn xóa phòng <strong>${room.room_number}</strong>?`,
        'Xóa phòng'
    );
    if (!ok) return;

    try {
        await DataStore.rooms.delete(id);
        Toast.success(`Đã xóa phòng ${room.room_number}.`);
        // No need to call loadRooms() - realtime listener auto-updates
    } catch (error) {
        Toast.error(error.message);
    }
}

/* ============================================
   FILTER
   ============================================ */

function filterRooms() {
    const statusFilter = document.getElementById('filterStatus').value;
    const branchFilter = document.getElementById('filterBranch').value;
    let rooms = filterByPermittedBranches(DataStore.rooms.getAll(), 'branch');

    if (statusFilter) {
        rooms = rooms.filter(r => r.status === statusFilter);
    }
    if (branchFilter) {
        rooms = rooms.filter(r => r.branch === branchFilter);
    }

    renderRooms(rooms);
}
