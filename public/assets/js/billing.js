/**
 * Billing Module - Tính tiền điện nước & Xuất phiếu
 * - Form nhập chỉ số + tính real-time
 * - Lưu hóa đơn
 * - In phiếu / Export PDF
 * - Lịch sử hóa đơn
 */

document.addEventListener('DOMContentLoaded', () => {
    // Realtime listeners
    DataStore.listen('bills', () => {
        loadBillingHistory();
    });
    DataStore.listen('contracts', () => {
        // Re-populate room dropdown when contracts change
        const branchSelect = document.getElementById('billBranch');
        if (branchSelect && branchSelect.value) {
            populateBillingRoomDropdown(branchSelect.value);
        }
    });
    DataStore.listen('rooms', () => {
        // Re-populate room dropdown when rooms change  
        const branchSelect = document.getElementById('billBranch');
        if (branchSelect && branchSelect.value) {
            populateBillingRoomDropdown(branchSelect.value);
        }
    });
    DataStore.listenSettings(() => {
        loadDefaultFees();
        populateBranchSelector();
    });
    Modal.initCloseOnOverlay();
});

/* ============================================
   BRANCH SELECTOR
   ============================================ */

function populateBranchSelector() {
    const select = document.getElementById('billBranch');
    if (!select) return;

    const settings = DataStore.settings.get();
    let branches = settings.branches || [];
    const permitted = getPermittedBranches();
    if (permitted.length > 0) {
        branches = branches.filter(b => permitted.includes(b));
    }

    const currentValue = select.value;
    let options = '<option value="">— Chọn cơ sở —</option>';
    branches.forEach(b => {
        options += `<option value="${b}">${b}</option>`;
    });
    select.innerHTML = options;

    // Auto-select if only one branch
    if (branches.length === 1) {
        select.value = branches[0];
        onBillBranchChange();
    } else if (currentValue) {
        select.value = currentValue;
    }
}

function onBillBranchChange() {
    const branch = document.getElementById('billBranch').value;

    // Populate rooms for the selected branch
    populateBillingRoomDropdown(branch);

    // Show QR code for selected branch
    const qrCard = document.getElementById('qrCodeCard');
    const qrPreview = document.getElementById('billingQrPreview');
    if (!branch) {
        if (qrCard) qrCard.style.display = 'none';
        return;
    }

    const settings = DataStore.settings.get();
    const qrCodes = settings.branch_qr_codes || {};
    const qrData = qrCodes[branch];

    if (qrData) {
        qrCard.style.display = 'block';
        qrPreview.innerHTML = `
            <p style="font-weight: 600; margin-bottom: 8px; color: var(--gray-600);">🏦 ${branch}</p>
            <img src="${qrData}" alt="Mã QR ${branch}" style="max-width: 220px; max-height: 220px; border-radius: 12px; border: 2px solid var(--gray-200); box-shadow: var(--shadow-md);">`;
    } else {
        qrCard.style.display = 'block';
        qrPreview.innerHTML = `
            <p style="color: var(--gray-400); padding: 16px;">Chưa có mã QR cho ${branch}.<br>Vào <strong>Cài đặt</strong> để upload.</p>`;
    }

    // Reset room selection
    document.getElementById('billTenantInfo').textContent = '—';
    document.getElementById('billRoomRent').value = '';
    document.getElementById('billElecOld').value = '';
}

/* ============================================
   TAB SWITCHING
   ============================================ */

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

    document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
}

/* ============================================
   CREATE BILL - FORM
   ============================================ */

function populateBillingRoomDropdown(branch) {
    const select = document.getElementById('billRoom');
    const activeContracts = DataStore.contracts.getActive();

    // Filter by branch and permitted branches
    let filtered = activeContracts;
    if (branch) {
        filtered = filtered.filter(c => {
            const room = DataStore.rooms.getById(c.room_id);
            return room && room.branch === branch;
        });
    }
    const permitted = getPermittedBranches();
    if (permitted.length > 0) {
        filtered = filtered.filter(c => {
            const room = DataStore.rooms.getById(c.room_id);
            return room && permitted.includes(room.branch);
        });
    }

    let options = '<option value="">— Chọn phòng —</option>';
    filtered.forEach(c => {
        options += `<option value="${c.room_id}" data-contract='${JSON.stringify(c)}'>${c.room_number} — ${c.tenant_name}</option>`;
    });
    select.innerHTML = options;
}

function onBillRoomChange() {
    const select = document.getElementById('billRoom');
    const option = select.options[select.selectedIndex];

    if (!option || !option.dataset.contract) {
        document.getElementById('billTenantInfo').textContent = '—';
        document.getElementById('billRoomRent').value = '';
        document.getElementById('billElecOld').value = '';
        return;
    }

    const contract = JSON.parse(option.dataset.contract);
    document.getElementById('billTenantInfo').textContent = `${contract.tenant_name} — ${contract.tenant_phone || 'Không SĐT'}`;
    document.getElementById('billRoomRent').value = contract.monthly_rent;

    // Auto-fill old readings from last bill
    const lastBill = DataStore.bills.getLastBill(contract.room_id);
    if (lastBill) {
        document.getElementById('billElecOld').value = lastBill.electricity.new_reading;
        document.getElementById('billWaterOld').value = lastBill.water.new_reading;
    } else {
        document.getElementById('billElecOld').value = 0;
        document.getElementById('billWaterOld').value = 0;
    }

    // Set billing month
    const today = new Date();
    document.getElementById('billMonth').value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    calculateBill();
}

function loadDefaultFees() {
    const settings = DataStore.settings.get();
    const container = document.getElementById('extraFeesContainer');
    container.innerHTML = '';

    settings.default_extra_fees.forEach(fee => {
        addFeeRow(fee.name, fee.amount);
    });
}

function addFeeRow(name, amount) {
    const container = document.getElementById('extraFeesContainer');
    const row = document.createElement('div');
    row.className = 'fee-row';
    row.innerHTML = `
        <input type="text" class="form-control" placeholder="Tên phí" value="${name || ''}" onchange="calculateBill()">
        <input type="number" class="form-control fee-amount" placeholder="Số tiền" value="${amount || ''}" min="0" onchange="calculateBill()" oninput="calculateBill()">
        <button type="button" class="remove-fee" onclick="this.parentElement.remove(); calculateBill();"><i data-lucide="x"></i></button>
    `;
    container.appendChild(row);
    lucide.createIcons();
}

/* ============================================
   CALCULATE BILL (Real-time)
   ============================================ */

function calculateBill() {
    const settings = DataStore.settings.get();

    const elecOld = parseInt(document.getElementById('billElecOld').value) || 0;
    const elecNew = parseInt(document.getElementById('billElecNew').value) || 0;
    const waterOld = parseInt(document.getElementById('billWaterOld').value) || 0;
    const waterNew = parseInt(document.getElementById('billWaterNew').value) || 0;
    const roomRent = parseInt(document.getElementById('billRoomRent').value) || 0;

    const elecUsage = Math.max(0, elecNew - elecOld);
    const waterUsage = Math.max(0, waterNew - waterOld);
    const elecTotal = elecUsage * settings.electricity_price;
    const waterTotal = waterUsage * settings.water_price;

    // Extra fees
    let extraTotal = 0;
    document.querySelectorAll('#extraFeesContainer .fee-row').forEach(row => {
        const amount = parseInt(row.querySelector('.fee-amount').value) || 0;
        extraTotal += amount;
    });

    const grandTotal = roomRent + elecTotal + waterTotal + extraTotal;

    // Update preview
    document.getElementById('previewElecUsage').textContent = `${elecUsage} kWh`;
    document.getElementById('previewElecTotal').textContent = formatMoney(elecTotal);
    document.getElementById('previewWaterUsage').textContent = `${waterUsage} m³`;
    document.getElementById('previewWaterTotal').textContent = formatMoney(waterTotal);
    document.getElementById('previewRoomRent').textContent = formatMoney(roomRent);
    document.getElementById('previewExtraTotal').textContent = formatMoney(extraTotal);
    document.getElementById('previewGrandTotal').textContent = formatMoney(grandTotal);
}

/* ============================================
   SAVE BILL
   ============================================ */

async function saveBill() {
    const roomId = document.getElementById('billRoom').value;
    const select = document.getElementById('billRoom');
    const option = select.options[select.selectedIndex];

    if (!roomId || !option.dataset.contract) {
        Toast.warning('Vui lòng chọn phòng.');
        return;
    }

    const contract = JSON.parse(option.dataset.contract);
    const settings = DataStore.settings.get();
    const billingMonth = document.getElementById('billMonth').value;

    if (!billingMonth) {
        Toast.warning('Vui lòng chọn tháng.');
        return;
    }

    const elecNew = parseInt(document.getElementById('billElecNew').value) || 0;
    const elecOld = parseInt(document.getElementById('billElecOld').value) || 0;
    const waterNew = parseInt(document.getElementById('billWaterNew').value) || 0;
    const waterOld = parseInt(document.getElementById('billWaterOld').value) || 0;

    if (elecNew < elecOld) { Toast.warning('Chỉ số điện mới phải ≥ chỉ số cũ.'); return; }
    if (waterNew < waterOld) { Toast.warning('Chỉ số nước mới phải ≥ chỉ số cũ.'); return; }

    // Collect extra fees
    const extraFees = [];
    document.querySelectorAll('#extraFeesContainer .fee-row').forEach(row => {
        const inputs = row.querySelectorAll('input');
        const name = inputs[0].value.trim();
        const amount = parseInt(inputs[1].value) || 0;
        if (name && amount > 0) extraFees.push({ name, amount });
    });

    try {
        const bill = await DataStore.bills.create({
            contract_id: contract.id,
            room_id: roomId,
            room_number: contract.room_number,
            tenant_name: contract.tenant_name,
            billing_month: billingMonth,
            elec_old: elecOld,
            elec_new: elecNew,
            water_old: waterOld,
            water_new: waterNew,
            elec_price: settings.electricity_price,
            water_price: settings.water_price,
            extra_fees: extraFees,
            room_rent: parseInt(document.getElementById('billRoomRent').value) || 0,
            notes: document.getElementById('billNotes').value || ''
        });

        Toast.success(`Lưu hóa đơn thành công! Tổng: ${formatMoney(bill.grand_total)}`);

        // Reset form
        document.getElementById('billRoom').value = '';
        document.getElementById('billTenantInfo').textContent = '—';
        document.getElementById('billElecOld').value = '';
        document.getElementById('billElecNew').value = '';
        document.getElementById('billWaterOld').value = '';
        document.getElementById('billWaterNew').value = '';
        document.getElementById('billRoomRent').value = '';
        document.getElementById('billNotes').value = '';
        calculateBill();

    } catch (error) {
        Toast.error(error.message);
    }
}

/* ============================================
   BILLING HISTORY
   ============================================ */

function loadBillingHistory() {
    let bills = DataStore.bills.getAll();
    // Filter by permitted branches
    const permitted = getPermittedBranches();
    if (permitted.length > 0) {
        bills = bills.filter(b => {
            const room = DataStore.rooms.getById(b.room_id);
            return room && permitted.includes(room.branch);
        });
    }
    const tbody = document.getElementById('billsHistoryBody');
    const countEl = document.getElementById('billCount');

    // Sort newest first
    bills.sort((a, b) => b.billing_month.localeCompare(a.billing_month) || b.created_at.localeCompare(a.created_at));

    if (countEl) countEl.textContent = bills.length;
    if (!tbody) return;

    if (bills.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7">
                <div class="empty-state">
                    <div class="empty-icon">💰</div>
                    <h3>Chưa có hóa đơn nào</h3>
                    <p>Chọn phòng và nhập chỉ số để tạo hóa đơn đầu tiên.</p>
                </div>
            </td></tr>`;
        return;
    }

    tbody.innerHTML = bills.map(b => {
        const statusBadge = b.payment_status === 'paid'
            ? '<span class="badge badge-success"><span class="badge-dot"></span> Đã TT</span>'
            : '<span class="badge badge-danger"><span class="badge-dot"></span> Chưa TT</span>';

        return `
        <tr>
            <td><strong>${b.room_number}</strong></td>
            <td>${b.tenant_name}</td>
            <td>${formatBillingMonth(b.billing_month)}</td>
            <td>${formatMoney(b.electricity.total)}</td>
            <td>${formatMoney(b.water.total)}</td>
            <td><strong>${formatMoney(b.grand_total)}</strong></td>
            <td>${statusBadge}</td>
            <td>
                <div class="action-cell">
                    <button class="btn btn-ghost btn-icon sm" onclick="viewBill('${b.id}')" title="Xem phiếu"><i data-lucide="eye"></i></button>
                    <button class="btn btn-ghost btn-icon sm" onclick="printBill('${b.id}')" title="In phiếu"><i data-lucide="printer"></i></button>
                    <button class="btn btn-ghost btn-icon sm" onclick="exportPdf('${b.id}')" title="Xuất PDF"><i data-lucide="download"></i></button>
                    ${b.payment_status === 'unpaid' ? `<button class="btn btn-ghost btn-icon sm" onclick="markBillPaid('${b.id}')" title="Đánh dấu đã TT" style="color:var(--success-500);"><i data-lucide="check-circle"></i></button>` : ''}
                    <button class="btn btn-ghost btn-icon sm" onclick="deleteBill('${b.id}')" title="Xoá hóa đơn" style="color:var(--danger-500);"><i data-lucide="trash-2"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');

    lucide.createIcons();
}

function formatBillingMonth(ym) {
    if (!ym) return '—';
    const [y, m] = ym.split('-');
    return `Tháng ${parseInt(m)}/${y}`;
}

async function markBillPaid(id) {
    const ok = await confirmAction('Xác nhận đã thanh toán hóa đơn này?', 'Thanh toán');
    if (!ok) return;

    try {
        await DataStore.bills.markPaid(id);
        Toast.success('Đã đánh dấu thanh toán!');
    } catch (error) {
        Toast.error(error.message);
    }
}

async function deleteBill(id) {
    const ok = await confirmAction('Bạn có chắc muốn xoá hóa đơn này?', 'Xoá hóa đơn');
    if (!ok) return;

    try {
        await DataStore.bills.delete(id);
        Toast.success('Đã xoá hóa đơn.');
    } catch (error) {
        Toast.error(error.message);
    }
}

/* ============================================
   VIEW / PRINT BILL
   ============================================ */

function viewBill(id) {
    const bill = DataStore.bills.getById(id);
    if (!bill) return Toast.error('Không tìm thấy hóa đơn.');

    const settings = DataStore.settings.get();
    const html = generateBillHtml(bill, settings);

    document.getElementById('billPreviewContent').innerHTML = html;
    Modal.open('billPreviewModal');
}

function printBill(id) {
    const bill = DataStore.bills.getById(id);
    if (!bill) return Toast.error('Không tìm thấy hóa đơn.');

    const settings = DataStore.settings.get();
    const html = generateBillHtml(bill, settings);

    const printWindow = window.open('', '_blank', 'width=600,height=800');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html><head>
            <title>Phiếu thu - ${bill.room_number} - ${bill.billing_month}</title>
            <style>
                body { font-family: 'Arial', sans-serif; padding: 20px; font-size: 14px; color: #333; }
                .bill-property-name { text-align: center; font-size: 20px; font-weight: 800; color: #1a56db; margin-bottom: 2px; text-transform: uppercase; }
                .bill-address { text-align: center; color: #666; margin-bottom: 8px; font-size: 13px; }
                h2 { text-align: center; margin-bottom: 4px; font-size: 16px; border-top: 2px solid #333; border-bottom: 2px solid #333; padding: 8px 0; }
                .bill-info { display: flex; justify-content: space-between; margin-bottom: 16px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                th, td { padding: 8px 12px; border: 1px solid #ddd; text-align: left; }
                th { background: #f5f5f5; font-weight: 600; }
                .bill-total { text-align: right; font-size: 18px; font-weight: 700; color: #DC2626; padding: 12px 0; border-top: 2px solid #333; }
                .bill-signatures { display: flex; justify-content: space-between; margin-top: 50px; text-align: center; }
                .bill-signatures div { width: 40%; }
                .text-right { text-align: right; }
                hr { border: none; border-top: 1px dashed #ccc; margin: 16px 0; }
            </style>
        </head><body>${html}
        <script>window.onload = function() { window.print(); }<\/script>
        </body></html>
    `);
    printWindow.document.close();
}

function exportPdf(id) {
    const bill = DataStore.bills.getById(id);
    if (!bill) return Toast.error('Không tìm thấy hóa đơn.');

    const settings = DataStore.settings.get();

    // Use jsPDF if available, otherwise fallback to print
    if (typeof jspdf !== 'undefined' && typeof jspdf.jsPDF !== 'undefined') {
        const doc = new jspdf.jsPDF({ unit: 'mm', format: 'a5' });

        // Register Roboto Unicode font for Vietnamese support
        if (typeof ROBOTO_FONT_BASE64 !== 'undefined') {
            doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_FONT_BASE64);
            doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
            doc.setFont('Roboto');
        }

        const leftMargin = 15;
        const pageWidth = 148; // A5 width in mm
        const centerX = pageWidth / 2;
        let y = 15;
        const lineHeight = 7;

        // 1. Property name (highlighted, bold, large)
        doc.setFontSize(16);
        doc.setTextColor(26, 86, 219); // Blue highlight color
        doc.text(settings.property_name || 'Nhà trọ', centerX, y, { align: 'center' });
        y += lineHeight;

        // 2. Address
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(settings.property_address || '', centerX, y, { align: 'center' });
        y += lineHeight * 1.5;

        // 3. Title
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setLineWidth(0.5);
        doc.line(leftMargin, y, 133, y);
        y += lineHeight;
        doc.text('PHIẾU THU TIỀN PHÒNG', centerX, y, { align: 'center' });
        y += lineHeight;
        doc.line(leftMargin, y, 133, y);
        y += lineHeight * 1.5;

        // Room & month info
        doc.setFontSize(11);
        doc.text(`Phòng: ${bill.room_number}`, leftMargin, y);
        doc.text(`Tháng: ${formatBillingMonth(bill.billing_month)}`, 90, y);
        y += lineHeight;
        doc.text(`Người thuê: ${bill.tenant_name}`, leftMargin, y);
        y += lineHeight;
        doc.text(`Ngày lập: ${formatDate(bill.created_at)}`, leftMargin, y);
        y += lineHeight * 1.5;

        // Details
        const items = [
            ['Tiền phòng', formatMoney(bill.room_rent)],
            [`Tiền điện (${bill.electricity.usage} kWh × ${formatMoney(bill.electricity.unit_price)})`, formatMoney(bill.electricity.total)],
            [`Tiền nước (${bill.water.usage} m³ × ${formatMoney(bill.water.unit_price)})`, formatMoney(bill.water.total)],
        ];
        bill.extra_fees.forEach(f => items.push([f.name, formatMoney(f.amount)]));

        items.forEach(([label, value]) => {
            doc.text(label, leftMargin, y);
            doc.text(value, 133, y, { align: 'right' });
            y += lineHeight;
        });

        y += 3;
        doc.setLineWidth(0.5);
        doc.line(leftMargin, y, 133, y);
        y += lineHeight;

        doc.setFontSize(13);
        doc.setTextColor(220, 38, 38); // Red for total
        doc.text(`TỔNG CỘNG: ${formatMoney(bill.grand_total)}`, 133, y, { align: 'right' });

        // Signatures
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        y += lineHeight * 4;
        doc.text('Chủ trọ', leftMargin + 20, y, { align: 'center' });
        doc.text('Người thuê', 133 - 20, y, { align: 'center' });
        y += lineHeight;
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text('(Ký tên)', leftMargin + 20, y, { align: 'center' });
        doc.text('(Ký tên)', 133 - 20, y, { align: 'center' });
        y += lineHeight * 4;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(settings.landlord_name || '', leftMargin + 20, y, { align: 'center' });
        doc.text(bill.tenant_name, 133 - 20, y, { align: 'center' });

        // QR Code
        const pdfRoom = DataStore.rooms.getById(bill.room_id);
        const pdfBranch = pdfRoom ? pdfRoom.branch : '';
        const pdfQrCodes = settings.branch_qr_codes || {};
        const pdfQrData = pdfQrCodes[pdfBranch];
        if (pdfQrData) {
            y += lineHeight * 3;
            if (y + 60 > 210) {
                doc.addPage();
                y = 15;
            }
            doc.setLineWidth(0.3);
            doc.line(leftMargin, y, 133, y);
            y += lineHeight * 1.5;
            doc.setFontSize(11);
            doc.setTextColor(26, 86, 219);
            doc.text('Ma chuyen khoan', centerX, y, { align: 'center' });
            y += lineHeight;
            try {
                const qrWidth = 40;
                const qrX = centerX - (qrWidth / 2);
                doc.addImage(pdfQrData, 'PNG', qrX, y, qrWidth, qrWidth);
            } catch (e) {
                doc.setFontSize(9);
                doc.setTextColor(150, 150, 150);
                doc.text('(Khong the hien thi ma QR)', centerX, y + 5, { align: 'center' });
            }
        }

        doc.save(`phieu-thu-${bill.room_number}-${bill.billing_month}.pdf`);
        Toast.success('Đã xuất PDF!');
    } else {
        // Fallback: print
        Toast.info('Đang mở cửa sổ in...');
        printBill(id);
    }
}

function generateBillHtml(bill, settings) {
    const extraFeesHtml = bill.extra_fees.map(f =>
        `<tr><td>${f.name}</td><td class="text-right">${formatMoney(f.amount)}</td></tr>`
    ).join('');

    // Get branch address from settings
    const room = DataStore.rooms.getById(bill.room_id);
    const branchName = room ? room.branch : '';
    const branchAddresses = settings.branch_addresses || {};
    const branchAddress = branchAddresses[branchName] || '';

    return `
        <div class="bill-property-name">${settings.property_name || 'Nhà trọ'}${branchName ? ` — ${branchName}` : ''}</div>
        <div class="bill-address">${branchAddress}</div>
        <h2>PHIẾU THU TIỀN PHÒNG</h2>
        <div class="bill-info">
            <div><strong>Phòng:</strong> ${bill.room_number}</div>
            <div><strong>Tháng:</strong> ${formatBillingMonth(bill.billing_month)}</div>
        </div>
        <div class="bill-info">
            <div><strong>Người thuê:</strong> ${bill.tenant_name}</div>
            <div><strong>Ngày lập:</strong> ${formatDate(bill.created_at)}</div>
        </div>
        <table>
            <thead>
                <tr><th>Khoản mục</th><th style="width:120px;" class="text-right">Thành tiền</th></tr>
            </thead>
            <tbody>
                <tr><td>Tiền phòng</td><td class="text-right">${formatMoney(bill.room_rent)}</td></tr>
                <tr><td>Tiền điện: ${bill.electricity.old_reading} → ${bill.electricity.new_reading} = <strong>${bill.electricity.usage} kWh</strong> × ${formatMoney(bill.electricity.unit_price)}</td><td class="text-right">${formatMoney(bill.electricity.total)}</td></tr>
                <tr><td>Tiền nước: ${bill.water.old_reading} → ${bill.water.new_reading} = <strong>${bill.water.usage} m³</strong> × ${formatMoney(bill.water.unit_price)}</td><td class="text-right">${formatMoney(bill.water.total)}</td></tr>
                ${extraFeesHtml}
            </tbody>
        </table>
        <div class="bill-total">TỔNG CỘNG: ${formatMoney(bill.grand_total)}</div>
        <div class="bill-signatures">
            <div>
                <strong>Chủ trọ</strong><br>
                <em>(Ký tên)</em><br><br><br>
                ${settings.landlord_name || ''}
            </div>
            <div>
                <strong>Người thuê</strong><br>
                <em>(Ký tên)</em><br><br><br>
                ${bill.tenant_name}
            </div>
        </div>
        ${(() => {
            const qrRoom = DataStore.rooms.getById(bill.room_id);
            const qrBranch = qrRoom ? qrRoom.branch : '';
            const qrCodes = settings.branch_qr_codes || {};
            const qrData = qrCodes[qrBranch];
            if (qrData) {
                return '<hr>' +
                    '<div style="text-align:center;margin-top:16px;">' +
                    '<p style="font-weight:700;color:#1a56db;margin-bottom:8px;">🏦 Mã chuyển khoản</p>' +
                    '<img src="' + qrData + '" alt="Mã QR" style="max-width:200px;max-height:200px;border-radius:12px;border:2px solid #ddd;">' +
                    '</div>';
            }
            return '';
        })()}
    `;
}
