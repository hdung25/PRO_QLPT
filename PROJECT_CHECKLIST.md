# ✅ PROJECT CHECKLIST - Quản lý Nhà trọ
## Bảng tiến độ chi tiết theo giai đoạn

> **Dự án:** Hệ thống Quản lý Nhà trọ  
> **Bắt đầu:** 2026-03-04  
> **Stack:** PHP + Firebase + Vercel  
> **Tham chiếu:** [LOGIC_SYSTEM_ARCHITECTURE.md](./LOGIC_SYSTEM_ARCHITECTURE.md)

### Ký hiệu trạng thái
| Icon | Trạng thái |
|------|-----------|
| ⬜ | Chưa bắt đầu |
| 🔄 | Đang thực hiện |
| ✅ | Hoàn thành |
| ⚠️ | Có vấn đề / Cần xem lại |

---

## 🟦 GIAI ĐOẠN 1: Khởi tạo & Cấu hình (Setup)

> **Mục tiêu:** Thiết lập nền tảng dự án, kết nối Firebase, cấu hình Vercel chạy được PHP.

### 1.1 Tạo dự án Firebase
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 1.1.1 | Tạo Firebase Project trên Console | ⬜ | https://console.firebase.google.com |
| 1.1.2 | Bật Firestore Database (chọn region `asia-southeast1`) | ⬜ | Production mode |
| 1.1.3 | Bật Firebase Authentication (Email/Password provider) | ⬜ | |
| 1.1.4 | Bật Firebase Storage | ⬜ | |
| 1.1.5 | Tạo tài khoản Admin đầu tiên trong Authentication | ⬜ | Email + password |
| 1.1.6 | Tải file Service Account JSON | ⬜ | Project Settings > Service Accounts |
| 1.1.7 | Lấy Firebase Client Config (apiKey, projectId...) | ⬜ | Cho frontend SDK |

### 1.2 Cấu trúc thư mục dự án
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 1.2.1 | Tạo cấu trúc thư mục theo LOGIC_SYSTEM_ARCHITECTURE | ⬜ | api/, public/, includes/ |
| 1.2.2 | Tạo file `composer.json` | ⬜ | kreait/firebase-php, dompdf |
| 1.2.3 | Chạy `composer install` | ⬜ | Cài dependencies |
| 1.2.4 | Tạo file `vercel.json` | ⬜ | Cấu hình routes + PHP runtime |
| 1.2.5 | Tạo file `.gitignore` | ⬜ | Bỏ vendor/, .env, service-account.json |

### 1.3 Kết nối Firebase từ PHP
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 1.3.1 | Tạo `includes/firebase.php` (Factory + Service Account) | ⬜ | |
| 1.3.2 | Tạo `includes/auth_middleware.php` | ⬜ | Verify ID Token |
| 1.3.3 | Tạo `includes/helpers.php` (response JSON, format số...) | ⬜ | |
| 1.3.4 | Test kết nối Firestore: thử đọc/ghi 1 document | ⬜ | Endpoint test: `api/test.php` |

### 1.4 Cấu hình Vercel
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 1.4.1 | Cài Vercel CLI: `npm i -g vercel` | ⬜ | |
| 1.4.2 | Liên kết project: `vercel link` | ⬜ | |
| 1.4.3 | Thêm Environment Variables trên Vercel Dashboard | ⬜ | FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_STORAGE_BUCKET |
| 1.4.4 | Deploy thử lần đầu: `vercel --prod` | ⬜ | Kiểm tra PHP chạy được |
| 1.4.5 | Kiểm tra route `/api/test.php` trả về JSON thành công | ⬜ | |

### 1.5 Frontend cơ bản
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 1.5.1 | Tạo `public/assets/css/style.css` (Design System) | ⬜ | Color palette, typography, layout |
| 1.5.2 | Tạo `public/assets/css/components.css` | ⬜ | Card, Table, Modal, Form, Button |
| 1.5.3 | Tạo `public/assets/js/firebase-config.js` | ⬜ | Firebase Client SDK init |
| 1.5.4 | Tạo `public/assets/js/app.js` (Sidebar, Navigation) | ⬜ | |
| 1.5.5 | Tạo layout chung: Sidebar + Main Content Area | ⬜ | Responsive |

**📋 Deliverable GĐ1:** Project chạy được trên Vercel, kết nối Firebase thành công, layout sidebar hiển thị đúng.

---

## 🟦 GIAI ĐOẠN 2: Module Đăng nhập & Dashboard

> **Mục tiêu:** Hoàn thiện luồng Auth và trang tổng quan.

### 2.1 Trang Đăng nhập
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 2.1.1 | Tạo `public/index.html` - UI form đăng nhập | ⬜ | Modern, centered card |
| 2.1.2 | Tạo `public/assets/js/auth.js` - Logic đăng nhập Firebase Client | ⬜ | signInWithEmailAndPassword |
| 2.1.3 | Lưu ID Token vào localStorage sau khi login | ⬜ | |
| 2.1.4 | Tạo `api/auth/verify.php` - Xác thực token + trả user info | ⬜ | |
| 2.1.5 | Redirect đến `dashboard.html` sau login thành công | ⬜ | |
| 2.1.6 | Tạo `api/auth/logout.php` - Xóa session | ⬜ | |
| 2.1.7 | Guard: Chặn truy cập trang khác nếu chưa login | ⬜ | Check token ở mỗi trang |

### 2.2 Trang Dashboard
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 2.2.1 | Tạo `public/dashboard.html` - Layout với stat cards | ⬜ | |
| 2.2.2 | Tạo `api/dashboard/stats.php` - API thống kê | ⬜ | |
| 2.2.3 | Card: Tổng số phòng | ⬜ | Count rooms collection |
| 2.2.4 | Card: Phòng đang cho thuê / Phòng trống | ⬜ | Filter by status |
| 2.2.5 | Card: Hợp đồng sắp hết hạn (30 ngày tới) | ⬜ | |
| 2.2.6 | Card: Doanh thu tháng hiện tại | ⬜ | Sum grand_total tháng hiện tại |
| 2.2.7 | Bảng: Danh sách hóa đơn chưa thanh toán | ⬜ | payment_status = "unpaid" |

**📋 Deliverable GĐ2:** Đăng nhập/đăng xuất hoạt động, Dashboard hiển thị dữ liệu thực từ Firestore.

---

## 🟦 GIAI ĐOẠN 3: Module Quản lý Phòng trọ

> **Mục tiêu:** CRUD phòng trọ đầy đủ.

### 3.1 Backend API - Phòng
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 3.1.1 | `api/rooms/index.php` - GET danh sách phòng | ⬜ | Hỗ trợ filter theo status, floor |
| 3.1.2 | `api/rooms/create.php` - POST tạo phòng mới | ⬜ | Validate trùng room_number |
| 3.1.3 | `api/rooms/update.php` - PUT cập nhật thông tin phòng | ⬜ | |
| 3.1.4 | `api/rooms/delete.php` - DELETE xóa phòng | ⬜ | Chặn xóa nếu đang có hợp đồng active |

### 3.2 Frontend - Trang Phòng
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 3.2.1 | Tạo `public/rooms.html` - Giao diện danh sách phòng | ⬜ | Table + filter bar |
| 3.2.2 | Hiển thị danh sách phòng dạng bảng | ⬜ | Số phòng, tầng, giá, trạng thái |
| 3.2.3 | Badge trạng thái màu: Xanh (trống), Vàng (đang thuê), Đỏ (bảo trì) | ⬜ | |
| 3.2.4 | Modal: Form thêm phòng mới | ⬜ | |
| 3.2.5 | Modal: Form chỉnh sửa phòng | ⬜ | Pre-fill dữ liệu |
| 3.2.6 | Confirm dialog trước khi xóa phòng | ⬜ | |
| 3.2.7 | Tạo `public/assets/js/rooms.js` - Logic gọi API | ⬜ | fetch + Bearer token |

**📋 Deliverable GĐ3:** Thêm/sửa/xóa/xem phòng trọ hoạt động đầy đủ.

---

## 🟦 GIAI ĐOẠN 4: Module Quản lý Hợp đồng & Khách thuê

> **Mục tiêu:** CRUD hợp đồng, upload ảnh CCCD/hợp đồng.

### 4.1 Backend API - Hợp đồng
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 4.1.1 | `api/contracts/index.php` - GET danh sách hợp đồng | ⬜ | Filter: status, room_id |
| 4.1.2 | `api/contracts/create.php` - POST tạo hợp đồng | ⬜ | Auto cập nhật room status → "occupied" |
| 4.1.3 | `api/contracts/update.php` - PUT cập nhật hợp đồng | ⬜ | |
| 4.1.4 | `api/contracts/upload.php` - POST upload ảnh CCCD/HĐ | ⬜ | Firebase Storage |

### 4.2 Frontend - Trang Hợp đồng
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 4.2.1 | Tạo `public/contracts.html` - Giao diện danh sách hợp đồng | ⬜ | |
| 4.2.2 | Hiển thị bảng: Phòng, Tên khách, SĐT, Ngày HĐ, Trạng thái | ⬜ | |
| 4.2.3 | Modal: Form tạo hợp đồng mới (chọn phòng từ dropdown phòng trống) | ⬜ | |
| 4.2.4 | Upload ảnh CCCD mặt trước/sau trong form | ⬜ | Preview trước khi upload |
| 4.2.5 | Upload ảnh/scan hợp đồng | ⬜ | Drag & Drop hoặc click |
| 4.2.6 | Xem chi tiết hợp đồng (bao gồm xem ảnh CCCD đã upload) | ⬜ | Lightbox/Modal |
| 4.2.7 | Chức năng kết thúc hợp đồng (terminate) | ⬜ | Cập nhật room status → "available" |
| 4.2.8 | Tạo `public/assets/js/contracts.js` | ⬜ | |

**📋 Deliverable GĐ4:** CRUD hợp đồng + upload ảnh CCCD hoạt động, liên kết phòng tự động.

---

## 🟦 GIAI ĐOẠN 5: Module Tính tiền & Xuất phiếu

> **Mục tiêu:** Nhập chỉ số điện nước, tự động tính tiền, xuất phiếu thu PDF/In.

### 5.1 Backend API - Billing
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 5.1.1 | `api/billing/calculate.php` - POST tính toán tiền | ⬜ | Trả về breakdown chi tiết |
| 5.1.2 | `api/billing/create.php` - POST lưu hóa đơn vào Firestore | ⬜ | Collection: bill_history |
| 5.1.3 | `api/billing/index.php` - GET lịch sử hóa đơn | ⬜ | Filter theo tháng, phòng, trạng thái |
| 5.1.4 | `api/billing/export-pdf.php` - GET xuất PDF phiếu thu | ⬜ | Dompdf render |
| 5.1.5 | Tạo `includes/pdf_generator.php` | ⬜ | |
| 5.1.6 | Auto-fill chỉ số cũ = chỉ số mới của tháng trước | ⬜ | Query bill_history tháng trước |

### 5.2 Frontend - Trang Tính tiền
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 5.2.1 | Tạo `public/billing.html` | ⬜ | |
| 5.2.2 | Form nhập liệu: Chọn phòng → Auto-fill thông tin khách | ⬜ | |
| 5.2.3 | Input: Chỉ số điện cũ/mới, Chỉ số nước cũ/mới | ⬜ | Chỉ số cũ auto-fill |
| 5.2.4 | Phụ phí: Thêm/xóa dòng phí phát sinh | ⬜ | Dynamic rows |
| 5.2.5 | Preview tính toán real-time (chưa cần submit) | ⬜ | JS tính ngay khi nhập |
| 5.2.6 | Nút "Lưu hóa đơn" - Gọi API create | ⬜ | |
| 5.2.7 | Nút "Xuất PDF" - Tải file PDF phiếu thu | ⬜ | |
| 5.2.8 | Nút "In phiếu" - window.print() với template | ⬜ | |
| 5.2.9 | Tab: Lịch sử hóa đơn (bảng, filter theo tháng) | ⬜ | |
| 5.2.10 | Cập nhật trạng thái thanh toán (unpaid → paid) | ⬜ | |
| 5.2.11 | Tạo `public/assets/js/billing.js` | ⬜ | |

### 5.3 Template phiếu thu
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 5.3.1 | Tạo `public/templates/bill-template.html` | ⬜ | Khổ A5, đẹp, chuyên nghiệp |
| 5.3.2 | Bao gồm: Tên nhà trọ, địa chỉ, thông tin khách | ⬜ | |
| 5.3.3 | Bảng chi tiết: Điện, Nước, Phụ phí, Tổng cộng | ⬜ | |
| 5.3.4 | Chữ ký chủ trọ + Ngày tháng | ⬜ | |

**📋 Deliverable GĐ5:** Nhập chỉ số → Tính tiền → Lưu hóa đơn → Xuất PDF/In phiếu hoàn chỉnh.

---

## 🟦 GIAI ĐOẠN 6: Module Cài đặt hệ thống

> **Mục tiêu:** Quản lý đơn giá, thông tin nhà trọ, tài khoản.

| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 6.1 | Tạo `public/settings.html` | ⬜ | |
| 6.2 | Form: Cập nhật đơn giá điện (VNĐ/kWh) | ⬜ | |
| 6.3 | Form: Cập nhật đơn giá nước (VNĐ/m³) | ⬜ | |
| 6.4 | Form: Cập nhật phí phát sinh mặc định (rác, wifi...) | ⬜ | Dynamic list |
| 6.5 | Form: Thông tin chủ trọ (tên, SĐT, địa chỉ nhà trọ) | ⬜ | Hiển thị trên phiếu thu |
| 6.6 | API: `api/settings/update.php` | ⬜ | |
| 6.7 | API: `api/settings/index.php` | ⬜ | |
| 6.8 | Tạo document `settings/general` mặc định khi chưa có | ⬜ | Auto-seed |

**📋 Deliverable GĐ6:** Admin cấu hình đơn giá, thông tin nhà trọ từ giao diện.

---

## 🟦 GIAI ĐOẠN 7: Tối ưu & Security

> **Mục tiêu:** Bảo mật, validation, xử lý lỗi, UX tốt hơn.

### 7.1 Validation & Error Handling
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 7.1.1 | Validate phía Client: Required fields, format email, SĐT | ⬜ | HTML5 + JS |
| 7.1.2 | Validate phía Server: Kiểm tra lại tất cả input PHP | ⬜ | Không tin client |
| 7.1.3 | Xử lý lỗi thống nhất: JSON error response chuẩn | ⬜ | `{error: string, code: number}` |
| 7.1.4 | Toast/notification UI khi thành công hoặc lỗi | ⬜ | |
| 7.1.5 | Loading state cho các nút submit | ⬜ | Disable + spinner |

### 7.2 Security
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 7.2.1 | Tất cả API endpoint đều qua `auth_middleware` | ⬜ | Trừ login |
| 7.2.2 | Firestore Security Rules | ⬜ | Chặn truy cập trực tiếp từ client |
| 7.2.3 | Storage Rules: Chỉ authenticated user mới upload được | ⬜ | |
| 7.2.4 | Validate file upload: chặn file nguy hiểm | ⬜ | Chỉ cho JPG, PNG, WebP, PDF |
| 7.2.5 | Rate limiting cơ bản (nếu Vercel hỗ trợ) | ⬜ | |
| 7.2.6 | Sanitize input: Chống XSS trong các trường text | ⬜ | htmlspecialchars() |
| 7.2.7 | CORS config đúng cho API | ⬜ | |

### 7.3 UX Enhancement
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 7.3.1 | Responsive design: Sidebar collapse trên mobile | ⬜ | Hamburger menu |
| 7.3.2 | Skeleton loading cho bảng dữ liệu | ⬜ | |
| 7.3.3 | Empty state khi chưa có data | ⬜ | Illustration + message |
| 7.3.4 | Phân trang (pagination) cho danh sách lớn | ⬜ | |
| 7.3.5 | Tìm kiếm nhanh theo tên khách / số phòng | ⬜ | |

**📋 Deliverable GĐ7:** Hệ thống an toàn, validate đầy đủ, UX mượt mà.

---

## 🟦 GIAI ĐOẠN 8: Go-live (Production)

> **Mục tiêu:** Kiểm tra toàn bộ, deploy production, bàn giao.

### 8.1 Testing
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 8.1.1 | Test luồng Login → Dashboard | ⬜ | |
| 8.1.2 | Test CRUD Phòng trọ đầy đủ | ⬜ | Thêm, sửa, xóa, xem |
| 8.1.3 | Test CRUD Hợp đồng + Upload ảnh | ⬜ | |
| 8.1.4 | Test Tính tiền + Xuất PDF | ⬜ | Kiểm tra số liệu chính xác |
| 8.1.5 | Test trên mobile (Chrome DevTools) | ⬜ | Responsive |
| 8.1.6 | Test edge cases: chỉ số âm, file quá lớn, token hết hạn | ⬜ | |

### 8.2 Production Deployment
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 8.2.1 | Kiểm tra tất cả Environment Variables trên Vercel | ⬜ | |
| 8.2.2 | Deploy production: `vercel --prod` | ⬜ | |
| 8.2.3 | Kiểm tra domain + SSL | ⬜ | Vercel auto SSL |
| 8.2.4 | Tạo tài khoản admin thật trên Firebase Auth | ⬜ | |
| 8.2.5 | Thêm document user admin vào Firestore | ⬜ | role: "admin" |
| 8.2.6 | Seed data `settings/general` với đơn giá thực tế | ⬜ | |
| 8.2.7 | Test toàn bộ trên URL production | ⬜ | |

### 8.3 Bàn giao
| # | Task | Trạng thái | Ghi chú |
|---|------|-----------|---------|
| 8.3.1 | Cập nhật README.md hướng dẫn cài đặt | ⬜ | |
| 8.3.2 | Ghi chú tài khoản admin, URL production | ⬜ | Lưu an toàn |
| 8.3.3 | Backup Firestore rules & Storage rules | ⬜ | |

**📋 Deliverable GĐ8:** Hệ thống live trên Vercel, hoạt động ổn định, sẵn sàng sử dụng thực tế.

---

## 📊 TỔNG KẾT TIẾN ĐỘ

| Giai đoạn | Mô tả | Số task | Hoàn thành | % |
|-----------|--------|---------|-----------|---|
| GĐ1 | Khởi tạo & Cấu hình | 18 | 0 | 0% |
| GĐ2 | Đăng nhập & Dashboard | 14 | 0 | 0% |
| GĐ3 | Quản lý Phòng trọ | 11 | 0 | 0% |
| GĐ4 | Hợp đồng & Khách thuê | 12 | 0 | 0% |
| GĐ5 | Tính tiền & Xuất phiếu | 17 | 0 | 0% |
| GĐ6 | Cài đặt hệ thống | 8 | 0 | 0% |
| GĐ7 | Tối ưu & Security | 15 | 0 | 0% |
| GĐ8 | Go-live | 13 | 0 | 0% |
| **TỔNG** | | **108** | **0** | **0%** |

---

> **Lưu ý:** Cập nhật trạng thái task sau mỗi buổi làm việc. Chuyển ⬜ → 🔄 khi bắt đầu, 🔄 → ✅ khi hoàn thành.
