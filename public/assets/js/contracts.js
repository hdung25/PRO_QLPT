/**
 * Contracts Module - Quản lý Hợp đồng
 * - Danh sách HĐ, Tạo mới, Xem chi tiết
 * - Upload ảnh CCCD / hợp đồng (base64)
 * - Đổi người thuê (switch tenant)
 * - Kết thúc hợp đồng
 */

// Temp storage for uploaded files
let uploadedFiles = { id_card_front: '', id_card_back: '', contract_image: '' };

document.addEventListener('DOMContentLoaded', () => {
    // Realtime listeners
    DataStore.listen('contracts', (contracts) => {
        renderContracts(contracts);
    });
    DataStore.listen('rooms', () => {
        // Re-render when rooms change
    });
    DataStore.listenSettings(() => { });
    Modal.initCloseOnOverlay();
});

function renderContracts(contracts) {
    loadContracts();
}

/* ============================================
   LOAD & RENDER
   ============================================ */

function loadContracts() {
    let contracts = DataStore.contracts.getAll();
    // Filter by permitted branches (match contract's room to room's branch)
    const permitted = getPermittedBranches();
    if (permitted.length > 0) {
        contracts = contracts.filter(c => {
            const room = DataStore.rooms.getById(c.room_id);
            return room && permitted.includes(room.branch);
        });
    }
    const tbody = document.getElementById('contractsTableBody');
    const countEl = document.getElementById('contractCount');

    // Sort: active first, then by date
    contracts.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return new Date(b.created_at) - new Date(a.created_at);
    });

    const activeCount = contracts.filter(c => c.status === 'active').length;
    if (countEl) countEl.textContent = activeCount;

    if (!tbody) return;

    if (contracts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <div class="empty-icon">📋</div>
                        <h3>Chưa có hợp đồng nào</h3>
                        <p>Nhấn nút "Tạo hợp đồng" để thêm hợp đồng mới.</p>
                        <button class="btn btn-primary" onclick="openAddContract()">
                            <i data-lucide="plus"></i> Tạo hợp đồng
                        </button>
                    </div>
                </td>
            </tr>`;
        lucide.createIcons();
        return;
    }

    tbody.innerHTML = contracts.map(c => {
        const statusBadge = getContractBadge(c);
        const startDate = formatDate(c.start_date);
        const endDate = formatDate(c.end_date);

        return `
        <tr>
            <td><strong>${c.room_number}</strong></td>
            <td><strong>${c.tenant_name}</strong></td>
            <td>${c.tenant_phone || '—'}</td>
            <td>${startDate} → ${endDate}</td>
            <td>${formatMoney(c.monthly_rent)}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="action-cell">
                    <button class="btn btn-ghost btn-icon sm" onclick="viewContract('${c.id}')" title="Xem chi tiết">
                        <i data-lucide="eye"></i>
                    </button>
                    ${c.status === 'active' ? `
                    <button class="btn btn-ghost btn-icon sm" onclick="openSwitchTenant('${c.id}')" title="Đổi người thuê">
                        <i data-lucide="repeat"></i>
                    </button>
                    <button class="btn btn-ghost btn-icon sm" onclick="terminateContract('${c.id}')" title="Kết thúc HĐ" style="color:var(--danger-500);">
                        <i data-lucide="x-circle"></i>
                    </button>` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');

    lucide.createIcons();
}

function getContractBadge(contract) {
    if (contract.status === 'terminated') {
        return '<span class="badge badge-neutral"><span class="badge-dot"></span> Đã kết thúc</span>';
    }
    // Check expiring soon (30 days)
    const now = new Date();
    const end = new Date(contract.end_date);
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return '<span class="badge badge-danger"><span class="badge-dot"></span> Quá hạn</span>';
    if (daysLeft <= 30) return `<span class="badge badge-warning"><span class="badge-dot"></span> Còn ${daysLeft} ngày</span>`;
    return '<span class="badge badge-success"><span class="badge-dot"></span> Đang hiệu lực</span>';
}

/* ============================================
   CREATE CONTRACT
   ============================================ */

function openAddContract() {
    document.getElementById('contractModalTitle').textContent = 'Tạo hợp đồng mới';
    document.getElementById('contractForm').reset();
    document.getElementById('contractId').value = '';
    uploadedFiles = { id_card_front: '', id_card_back: '', contract_image: '' };
    clearPreviews();
    populateRoomDropdown();

    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    document.getElementById('contractStart').value = today;
    document.getElementById('contractEnd').value = nextYear.toISOString().split('T')[0];

    Modal.open('contractModal');
}

function populateRoomDropdown(selectedRoomId) {
    const select = document.getElementById('contractRoom');
    const availableRooms = DataStore.rooms.getAvailable();

    // If editing, include the selected room too
    let options = '<option value="">— Chọn phòng trống —</option>';
    availableRooms.forEach(r => {
        const selected = r.id === selectedRoomId ? 'selected' : '';
        options += `<option value="${r.id}" data-price="${r.base_price}" ${selected}>${r.room_number} — ${r.branch || ''} — ${formatMoney(r.base_price)}</option>`;
    });

    select.innerHTML = options;
}

function onRoomChange() {
    const select = document.getElementById('contractRoom');
    const option = select.options[select.selectedIndex];
    if (option && option.dataset.price) {
        document.getElementById('contractRent').value = option.dataset.price;
    }
}

async function saveContract() {
    const id = document.getElementById('contractId').value;
    const data = {
        room_id: document.getElementById('contractRoom').value,
        tenant_name: document.getElementById('contractTenantName').value.trim(),
        tenant_phone: document.getElementById('contractTenantPhone').value.trim(),
        tenant_id_number: document.getElementById('contractTenantId').value.trim(),
        start_date: document.getElementById('contractStart').value,
        end_date: document.getElementById('contractEnd').value,
        monthly_rent: document.getElementById('contractRent').value,
        deposit: document.getElementById('contractDeposit').value,
        id_card_front: uploadedFiles.id_card_front,
        id_card_back: uploadedFiles.id_card_back,
        contract_image: uploadedFiles.contract_image
    };

    if (!data.room_id) { Toast.warning('Vui lòng chọn phòng.'); return; }
    if (!data.tenant_name) { Toast.warning('Vui lòng nhập tên người thuê.'); return; }
    if (!data.start_date || !data.end_date) { Toast.warning('Vui lòng nhập ngày hợp đồng.'); return; }

    try {
        if (id) {
            await DataStore.contracts.update(id, data);
            Toast.success('Cập nhật hợp đồng thành công!');
        } else {
            await DataStore.contracts.create(data);
            Toast.success('Tạo hợp đồng thành công!');
        }
        Modal.close('contractModal');
    } catch (error) {
        Toast.error(error.message);
    }
}

/* ============================================
   UPLOAD FILES (Base64)
   ============================================ */

function handleFileUpload(inputId, field) {
    const input = document.getElementById(inputId);
    const file = input.files[0];
    if (!file) return;

    // Validate
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
        Toast.warning('Chỉ hỗ trợ file ảnh (JPG, PNG, WebP).');
        input.value = '';
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        Toast.warning('File quá lớn (tối đa 5MB).');
        input.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedFiles[field] = e.target.result;
        showPreview(field, e.target.result, file.name);
    };
    reader.readAsDataURL(file);
}

function showPreview(field, dataUrl, fileName) {
    const container = document.getElementById(`preview_${field}`);
    if (!container) return;
    container.innerHTML = `
        <div class="upload-preview">
            <img src="${dataUrl}" alt="${fileName}">
            <span class="file-name">${fileName}</span>
            <button type="button" class="remove-file" onclick="removeFile('${field}')"><i data-lucide="x"></i></button>
        </div>`;
    lucide.createIcons();
}

function removeFile(field) {
    uploadedFiles[field] = '';
    const container = document.getElementById(`preview_${field}`);
    if (container) container.innerHTML = '';
    // Clear file input
    const inputMap = { id_card_front: 'uploadFront', id_card_back: 'uploadBack', contract_image: 'uploadContract' };
    const input = document.getElementById(inputMap[field]);
    if (input) input.value = '';
}

function clearPreviews() {
    ['id_card_front', 'id_card_back', 'contract_image'].forEach(field => {
        const container = document.getElementById(`preview_${field}`);
        if (container) container.innerHTML = '';
    });
}

/* ============================================
   VIEW CONTRACT DETAIL
   ============================================ */

function viewContract(id) {
    const c = DataStore.contracts.getById(id);
    if (!c) return Toast.error('Không tìm thấy hợp đồng.');

    const content = document.getElementById('detailContent');
    content.innerHTML = `
        <div class="detail-row"><span class="detail-label">Phòng</span><span class="detail-value"><strong>${c.room_number}</strong></span></div>
        <div class="detail-row"><span class="detail-label">Người thuê</span><span class="detail-value"><strong>${c.tenant_name}</strong></span></div>
        <div class="detail-row"><span class="detail-label">SĐT</span><span class="detail-value">${c.tenant_phone || '—'}</span></div>
        <div class="detail-row"><span class="detail-label">CCCD</span><span class="detail-value">${c.tenant_id_number || '—'}</span></div>
        <div class="detail-row"><span class="detail-label">Thời hạn</span><span class="detail-value">${formatDate(c.start_date)} → ${formatDate(c.end_date)}</span></div>
        <div class="detail-row"><span class="detail-label">Giá thuê</span><span class="detail-value">${formatMoney(c.monthly_rent)}/tháng</span></div>
        <div class="detail-row"><span class="detail-label">Tiền cọc</span><span class="detail-value">${c.deposit ? formatMoney(c.deposit) : '—'}</span></div>
        <div class="detail-row"><span class="detail-label">Trạng thái</span><span class="detail-value">${c.status === 'active' ? '🟢 Đang hiệu lực' : '⚫ Đã kết thúc'}</span></div>
        ${c.id_card_front ? `<div class="detail-row"><span class="detail-label">CCCD mặt trước</span><span class="detail-value"><img src="${c.id_card_front}" class="lightbox-img" alt="CCCD trước" onclick="openLightbox(this.src)"></span></div>` : ''}
        ${c.id_card_back ? `<div class="detail-row"><span class="detail-label">CCCD mặt sau</span><span class="detail-value"><img src="${c.id_card_back}" class="lightbox-img" alt="CCCD sau" onclick="openLightbox(this.src)"></span></div>` : ''}
        ${c.contract_image ? `<div class="detail-row"><span class="detail-label">Scan hợp đồng</span><span class="detail-value"><img src="${c.contract_image}" class="lightbox-img" alt="Hợp đồng" onclick="openLightbox(this.src)"></span></div>` : ''}
    `;

    Modal.open('detailModal');
}

function openLightbox(src) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.style.cursor = 'pointer';
    overlay.style.zIndex = '999';
    overlay.innerHTML = `<img src="${src}" style="max-width:90vw; max-height:90vh; border-radius:12px; box-shadow: var(--shadow-xl);">`;
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
}

/* ============================================
   SWITCH TENANT (Đổi người thuê)
   ============================================ */

function openSwitchTenant(contractId) {
    const contract = DataStore.contracts.getById(contractId);
    if (!contract) return Toast.error('Không tìm thấy hợp đồng.');

    document.getElementById('switchContractId').value = contractId;
    document.getElementById('switchRoomInfo').textContent = `${contract.room_number} — ${formatMoney(contract.monthly_rent)}/tháng`;
    document.getElementById('switchForm').reset();
    document.getElementById('switchRent').value = contract.monthly_rent;

    // Default dates
    const today = new Date().toISOString().split('T')[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    document.getElementById('switchStart').value = today;
    document.getElementById('switchEnd').value = nextYear.toISOString().split('T')[0];

    // Clear upload previews
    uploadedFiles = { id_card_front: '', id_card_back: '', contract_image: '' };

    Modal.open('switchModal');
}

async function saveSwitchTenant() {
    const oldContractId = document.getElementById('switchContractId').value;
    const data = {
        tenant_name: document.getElementById('switchTenantName').value.trim(),
        tenant_phone: document.getElementById('switchTenantPhone').value.trim(),
        tenant_id_number: document.getElementById('switchTenantId').value.trim(),
        start_date: document.getElementById('switchStart').value,
        end_date: document.getElementById('switchEnd').value,
        monthly_rent: document.getElementById('switchRent').value,
        deposit: document.getElementById('switchDeposit').value,
        id_card_front: uploadedFiles.id_card_front,
        id_card_back: uploadedFiles.id_card_back,
        contract_image: uploadedFiles.contract_image
    };

    if (!data.tenant_name) { Toast.warning('Vui lòng nhập tên người thuê mới.'); return; }
    if (!data.start_date || !data.end_date) { Toast.warning('Vui lòng nhập ngày hợp đồng.'); return; }

    try {
        await DataStore.contracts.switchTenant(oldContractId, data);
        Toast.success('Đổi người thuê thành công!');
        Modal.close('switchModal');
    } catch (error) {
        Toast.error(error.message);
    }
}

/* ============================================
   TERMINATE CONTRACT
   ============================================ */

async function terminateContract(id) {
    const contract = DataStore.contracts.getById(id);
    if (!contract) return;

    const ok = await confirmAction(
        `Kết thúc hợp đồng của <strong>${contract.tenant_name}</strong> (phòng ${contract.room_number})?<br>Phòng sẽ chuyển về trạng thái trống.`,
        'Kết thúc hợp đồng'
    );
    if (!ok) return;

    try {
        await DataStore.contracts.terminate(id);
        Toast.success(`Đã kết thúc hợp đồng phòng ${contract.room_number}.`);
    } catch (error) {
        Toast.error(error.message);
    }
}

/* ============================================
   FILTER
   ============================================ */

function filterContracts() {
    const status = document.getElementById('filterContractStatus').value;
    let contracts = DataStore.contracts.getAll();
    // Filter by permitted branches
    const permitted = getPermittedBranches();
    if (permitted.length > 0) {
        contracts = contracts.filter(c => {
            const room = DataStore.rooms.getById(c.room_id);
            return room && permitted.includes(room.branch);
        });
    }

    if (status === 'active') contracts = contracts.filter(c => c.status === 'active');
    else if (status === 'terminated') contracts = contracts.filter(c => c.status === 'terminated');

    renderFilteredContracts(contracts);
}

function renderFilteredContracts(contracts) {
    const tbody = document.getElementById('contractsTableBody');
    if (!tbody) return;

    if (contracts.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7">
                <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <h3>Không tìm thấy hợp đồng</h3>
                </div>
            </td></tr>`;
        return;
    }

    contracts.sort((a, b) => {
        if (a.status === 'active' && b.status !== 'active') return -1;
        if (a.status !== 'active' && b.status === 'active') return 1;
        return 0;
    });

    tbody.innerHTML = contracts.map(c => {
        const statusBadge = getContractBadge(c);
        return `
        <tr>
            <td><strong>${c.room_number}</strong></td>
            <td><strong>${c.tenant_name}</strong></td>
            <td>${c.tenant_phone || '—'}</td>
            <td>${formatDate(c.start_date)} → ${formatDate(c.end_date)}</td>
            <td>${formatMoney(c.monthly_rent)}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="action-cell">
                    <button class="btn btn-ghost btn-icon sm" onclick="viewContract('${c.id}')" title="Xem"><i data-lucide="eye"></i></button>
                    ${c.status === 'active' ? `
                    <button class="btn btn-ghost btn-icon sm" onclick="openSwitchTenant('${c.id}')" title="Đổi người thuê"><i data-lucide="repeat"></i></button>
                    <button class="btn btn-ghost btn-icon sm" onclick="terminateContract('${c.id}')" title="Kết thúc" style="color:var(--danger-500);"><i data-lucide="x-circle"></i></button>` : ''}
                </div>
            </td>
        </tr>`;
    }).join('');

    lucide.createIcons();
}
