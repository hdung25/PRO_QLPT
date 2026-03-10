    # 🏗️ LOGIC SYSTEM ARCHITECTURE
## Hệ thống Quản lý Nhà trọ - Kiến trúc & Luồng dữ liệu

> **Phiên bản:** 1.0  
> **Cập nhật:** 2026-03-04  
> **Stack:** PHP (Vercel Serverless) + Firebase Firestore + Firebase Storage  

---

## 📁 1. Project Structure

```
PRO_QLPT/
│
├── api/                          # Serverless PHP functions (Vercel)
│   ├── auth/
│   │   ├── login.php             # Xử lý đăng nhập
│   │   ├── logout.php            # Xử lý đăng xuất
│   │   └── verify.php            # Xác thực token Firebase
│   │
│   ├── rooms/
│   │   ├── index.php             # GET: Danh sách phòng
│   │   ├── create.php            # POST: Thêm phòng
│   │   ├── update.php            # PUT: Cập nhật phòng
│   │   └── delete.php            # DELETE: Xóa phòng
│   │
│   ├── contracts/
│   │   ├── index.php             # GET: Danh sách hợp đồng
│   │   ├── create.php            # POST: Tạo hợp đồng
│   │   ├── update.php            # PUT: Cập nhật hợp đồng
│   │   └── upload.php            # POST: Upload ảnh CCCD/hợp đồng
│   │
│   ├── billing/
│   │   ├── index.php             # GET: Lịch sử hóa đơn
│   │   ├── create.php            # POST: Tạo hóa đơn điện nước
│   │   ├── calculate.php         # POST: Tính toán tiền điện nước
│   │   └── export-pdf.php        # GET: Xuất phiếu thu PDF
│   │
│   └── dashboard/
│       └── stats.php             # GET: Thống kê tổng quan
│
├── includes/                     # Shared PHP logic
│   ├── firebase.php              # Kết nối Firebase Admin SDK
│   ├── auth_middleware.php       # Middleware xác thực
│   ├── helpers.php               # Hàm tiện ích chung
│   └── pdf_generator.php         # Tạo PDF phiếu thu
│
├── public/                       # Frontend tĩnh
│   ├── index.html                # Trang đăng nhập
│   ├── dashboard.html            # Trang tổng quan
│   ├── rooms.html                # Quản lý phòng
│   ├── contracts.html            # Quản lý hợp đồng
│   ├── billing.html              # Tính tiền điện nước
│   │
│   ├── assets/
│   │   ├── css/
│   │   │   ├── style.css         # CSS chính (Modern Dashboard)
│   │   │   └── components.css    # CSS cho components (Card, Table, Modal)
│   │   ├── js/
│   │   │   ├── app.js            # Logic chung, sidebar, navigation
│   │   │   ├── firebase-config.js # Firebase Client SDK config
│   │   │   ├── auth.js           # Xử lý auth phía client
│   │   │   ├── rooms.js          # Logic trang phòng
│   │   │   ├── contracts.js      # Logic trang hợp đồng
│   │   │   └── billing.js        # Logic trang tính tiền
│   │   └── img/
│   │       └── logo.png
│   │
│   └── templates/
│       └── bill-template.html    # Template phiếu thu để in
│
├── vercel.json                   # Cấu hình Vercel deployment
├── composer.json                 # PHP dependencies
├── LOGIC_SYSTEM_ARCHITECTURE.md  # (File này)
└── PROJECT_CHECKLIST.md          # Bảng tiến độ dự án
```

---

## 🗄️ 2. Database Schema (Firestore NoSQL)

### 2.1 Collection: `users`
```
users/{userId}
│
├── email: string              # "admin@nhatro.com"
├── display_name: string       # "Nguyễn Văn A"
├── role: string               # "admin" | "staff"
├── phone: string              # "0901234567"
├── avatar_url: string         # URL ảnh đại diện (optional)
├── is_active: boolean         # true
├── created_at: timestamp      # 2026-03-04T08:00:00Z
└── updated_at: timestamp      # 2026-03-04T08:00:00Z
```

### 2.2 Collection: `rooms`
```
rooms/{roomId}
│
├── room_number: string        # "P101"
├── floor: number              # 1
├── room_type: string          # "single" | "double" | "studio"
├── area: number               # 20 (m²)
├── base_price: number         # 3000000 (VNĐ/tháng)
├── status: string             # "available" | "occupied" | "maintenance"
├── amenities: array           # ["wifi", "air_con", "water_heater"]
├── description: string        # "Phòng đơn tầng 1, view sân"
├── current_tenant_id: string  # ref -> contracts/{contractId} (nullable)
├── created_at: timestamp
└── updated_at: timestamp
```

### 2.3 Collection: `contracts`
```
contracts/{contractId}
│
├── room_id: string            # ref -> rooms/{roomId}
├── room_number: string        # "P101" (denormalized để query nhanh)
├── tenant_name: string        # "Trần Văn B"
├── tenant_phone: string       # "0987654321"
├── tenant_id_number: string   # "079123456789" (CCCD)
├── tenant_email: string       # (optional)
├── tenant_address: string     # Địa chỉ thường trú
│
├── id_card_front_url: string  # URL ảnh CCCD mặt trước (Firebase Storage)
├── id_card_back_url: string   # URL ảnh CCCD mặt sau
├── contract_image_url: string # URL ảnh hợp đồng scan
│
├── start_date: timestamp      # Ngày bắt đầu
├── end_date: timestamp        # Ngày kết thúc
├── monthly_rent: number       # 3000000 (VNĐ)
├── deposit: number            # 3000000 (VNĐ - tiền cọc)
├── status: string             # "active" | "expired" | "terminated"
│
├── created_by: string         # ref -> users/{userId}
├── created_at: timestamp
└── updated_at: timestamp
```

### 2.4 Collection: `bill_history`
```
bill_history/{billId}
│
├── contract_id: string        # ref -> contracts/{contractId}
├── room_id: string            # ref -> rooms/{roomId}
├── room_number: string        # "P101"
├── tenant_name: string        # "Trần Văn B"
│
├── billing_month: string      # "2026-03" (YYYY-MM)
│
├── electricity/               # Embedded object
│   ├── old_reading: number    # 1520 (kWh)
│   ├── new_reading: number    # 1680 (kWh)
│   ├── usage: number          # 160 (kWh) = new - old
│   ├── unit_price: number     # 3500 (VNĐ/kWh)
│   └── total: number          # 560000 (VNĐ)
│
├── water/                     # Embedded object
│   ├── old_reading: number    # 45 (m³)
│   ├── new_reading: number    # 52 (m³)
│   ├── usage: number          # 7 (m³) = new - old
│   ├── unit_price: number     # 15000 (VNĐ/m³)
│   └── total: number          # 105000 (VNĐ)
│
├── extra_fees: array          # [{name: "Rác", amount: 20000}, {name: "Wifi", amount: 50000}]
├── extra_fees_total: number   # 70000
│
├── room_rent: number          # 3000000
├── grand_total: number        # 3735000
│
├── payment_status: string     # "unpaid" | "paid" | "partial"
├── payment_date: timestamp    # (nullable)
├── notes: string              # Ghi chú
│
├── created_by: string         # ref -> users/{userId}
├── created_at: timestamp
└── updated_at: timestamp
```

### 2.5 Collection: `settings`
```
settings/general
│
├── electricity_price: number  # 3500 (VNĐ/kWh)
├── water_price: number        # 15000 (VNĐ/m³)
├── default_extra_fees: array  # [{name: "Rác", amount: 20000}]
├── landlord_name: string      # "Nguyễn Văn A"
├── landlord_phone: string     # "0901234567"
├── property_name: string      # "Nhà trọ Thanh Bình"
├── property_address: string   # "123 Đường ABC, Quận 1, TP.HCM"
└── updated_at: timestamp
```

---

## 🔐 3. Authentication Logic

### 3.1 Luồng đăng nhập

```
┌──────────┐     ┌──────────────┐     ┌───────────────┐     ┌───────────┐
│  Client   │────▶│ Firebase Auth │────▶│  PHP API      │────▶│ Firestore │
│ (Browser) │     │ (Client SDK) │     │ (verify.php)  │     │  (users)  │
└──────────┘     └──────────────┘     └───────────────┘     └───────────┘
     │                   │                     │                    │
     │  1. Email/Pass    │                     │                    │
     │──────────────────▶│                     │                    │
     │                   │                     │                    │
     │  2. ID Token      │                     │                    │
     │◀──────────────────│                     │                    │
     │                   │                     │                    │
     │  3. Gửi Token trong Header              │                    │
     │────────────────────────────────────────▶│                    │
     │                   │                     │                    │
     │                   │    4. Verify token   │                    │
     │                   │    (Firebase Admin)  │                    │
     │                   │◀────────────────────│                    │
     │                   │                     │                    │
     │                   │                     │  5. Get user role  │
     │                   │                     │───────────────────▶│
     │                   │                     │                    │
     │  6. Response (user data + role)         │                    │
     │◀────────────────────────────────────────│                    │
```

### 3.2 Auth Middleware (PHP)

```php
<?php
// includes/auth_middleware.php

function verifyFirebaseToken(): array {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!str_starts_with($authHeader, 'Bearer ')) {
        http_response_code(401);
        echo json_encode(['error' => 'Token không hợp lệ']);
        exit;
    }
    
    $idToken = substr($authHeader, 7);
    
    // Sử dụng Firebase Admin SDK (kreait/firebase-php)
    $firebase = require __DIR__ . '/firebase.php';
    
    try {
        $verifiedToken = $firebase->auth()->verifyIdToken($idToken);
        $uid = $verifiedToken->claims()->get('sub');
        
        // Lấy thông tin user từ Firestore
        $userDoc = $firebase->firestore()
            ->database()
            ->collection('users')
            ->document($uid)
            ->snapshot();
        
        if (!$userDoc->exists()) {
            http_response_code(403);
            echo json_encode(['error' => 'Tài khoản không tồn tại trong hệ thống']);
            exit;
        }
        
        return [
            'uid' => $uid,
            'email' => $userDoc['email'],
            'role' => $userDoc['role'],
            'display_name' => $userDoc['display_name']
        ];
    } catch (\Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Phiên đăng nhập hết hạn']);
        exit;
    }
}
```

### 3.3 Firebase Connection (PHP)

```php
<?php
// includes/firebase.php

require_once __DIR__ . '/../vendor/autoload.php';

use Kreait\Firebase\Factory;

$factory = (new Factory)
    ->withServiceAccount(json_decode(
        getenv('FIREBASE_SERVICE_ACCOUNT_JSON'), 
        true
    ))
    ->withDefaultStorageBucket(getenv('FIREBASE_STORAGE_BUCKET'));

return $factory;
```

---

## 📤 4. Upload Logic

### 4.1 Luồng Upload File

```
┌──────────┐     ┌──────────────┐     ┌──────────────────┐     ┌───────────┐
│  Form     │────▶│  PHP API     │────▶│ Firebase Storage │────▶│ Firestore │
│ (Browser) │     │ (upload.php) │     │   (Bucket)       │     │ (Update)  │
└──────────┘     └──────────────┘     └──────────────────┘     └───────────┘
     │                   │                      │                     │
     │ 1. multipart/     │                      │                     │
     │    form-data       │                      │                     │
     │──────────────────▶│                      │                     │
     │                   │                      │                     │
     │                   │ 2. Validate file     │                     │
     │                   │    (type, size)      │                     │
     │                   │                      │                     │
     │                   │ 3. Upload to bucket  │                     │
     │                   │─────────────────────▶│                     │
     │                   │                      │                     │
     │                   │ 4. Get public URL    │                     │
     │                   │◀─────────────────────│                     │
     │                   │                      │                     │
     │                   │ 5. Save URL to doc   │                     │
     │                   │────────────────────────────────────────────▶│
     │                   │                      │                     │
     │ 6. Response       │                      │                     │
     │◀──────────────────│                      │                     │
```

### 4.2 Code mẫu Upload

```php
<?php
// api/contracts/upload.php

require_once __DIR__ . '/../../includes/firebase.php';
require_once __DIR__ . '/../../includes/auth_middleware.php';

header('Content-Type: application/json');
$user = verifyFirebaseToken();

// Validate
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
$maxSize = 5 * 1024 * 1024; // 5MB

$file = $_FILES['file'] ?? null;
$contractId = $_POST['contract_id'] ?? '';
$fieldName = $_POST['field_name'] ?? ''; // id_card_front_url, id_card_back_url, contract_image_url

if (!$file || !$contractId || !$fieldName) {
    http_response_code(400);
    echo json_encode(['error' => 'Thiếu thông tin bắt buộc']);
    exit;
}

if (!in_array($file['type'], $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Định dạng file không hỗ trợ (JPG, PNG, WebP, PDF)']);
    exit;
}

if ($file['size'] > $maxSize) {
    http_response_code(400);
    echo json_encode(['error' => 'File vượt quá 5MB']);
    exit;
}

$firebase = require __DIR__ . '/../../includes/firebase.php';

// Upload lên Firebase Storage
$bucket = $firebase->storage()->getBucket();
$fileName = "contracts/{$contractId}/" . uniqid() . '_' . basename($file['name']);

$bucket->upload(
    fopen($file['tmp_name'], 'r'),
    ['name' => $fileName, 'predefinedAcl' => 'publicRead']
);

$publicUrl = "https://storage.googleapis.com/" . getenv('FIREBASE_STORAGE_BUCKET') . "/{$fileName}";

// Cập nhật URL vào Firestore
$firebase->firestore()
    ->database()
    ->collection('contracts')
    ->document($contractId)
    ->update([
        ['path' => $fieldName, 'value' => $publicUrl],
        ['path' => 'updated_at', 'value' => new \DateTime()]
    ]);

echo json_encode([
    'success' => true,
    'url' => $publicUrl,
    'message' => 'Upload thành công'
]);
```

---

## 💡 5. Billing Logic (Tính tiền Điện nước)

### 5.1 Công thức tính

```
📊 THUẬT TOÁN TÍNH TIỀN

Tiền điện  = (Chỉ số mới - Chỉ số cũ) × Đơn giá điện
Tiền nước  = (Chỉ số mới - Chỉ số cũ) × Đơn giá nước
Phụ phí    = Σ (các phí phát sinh: rác, wifi, gửi xe...)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TỔNG CỘNG  = Tiền phòng + Tiền điện + Tiền nước + Phụ phí
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 5.2 Code mẫu tính toán

```php
<?php
// api/billing/calculate.php

function calculateBill(array $input): array {
    // Lấy đơn giá từ settings
    $settings = getSettings(); // từ Firestore collection 'settings'
    
    // Tính điện
    $elecUsage = $input['elec_new'] - $input['elec_old'];
    if ($elecUsage < 0) throw new \Exception('Chỉ số điện mới phải lớn hơn cũ');
    $elecTotal = $elecUsage * $settings['electricity_price'];
    
    // Tính nước
    $waterUsage = $input['water_new'] - $input['water_old'];
    if ($waterUsage < 0) throw new \Exception('Chỉ số nước mới phải lớn hơn cũ');
    $waterTotal = $waterUsage * $settings['water_price'];
    
    // Tính phụ phí
    $extraFees = $input['extra_fees'] ?? $settings['default_extra_fees'];
    $extraTotal = array_sum(array_column($extraFees, 'amount'));
    
    // Tổng cộng
    $grandTotal = $input['room_rent'] + $elecTotal + $waterTotal + $extraTotal;
    
    return [
        'electricity' => [
            'old_reading' => $input['elec_old'],
            'new_reading' => $input['elec_new'],
            'usage' => $elecUsage,
            'unit_price' => $settings['electricity_price'],
            'total' => $elecTotal,
        ],
        'water' => [
            'old_reading' => $input['water_old'],
            'new_reading' => $input['water_new'],
            'usage' => $waterUsage,
            'unit_price' => $settings['water_price'],
            'total' => $waterTotal,
        ],
        'extra_fees' => $extraFees,
        'extra_fees_total' => $extraTotal,
        'room_rent' => $input['room_rent'],
        'grand_total' => $grandTotal,
    ];
}
```

### 5.3 Xuất PDF phiếu thu

Sử dụng thư viện **TCPDF** hoặc **Dompdf** để render HTML template thành PDF:

```php
<?php
// includes/pdf_generator.php

use Dompdf\Dompdf;

function generateBillPdf(array $billData): string {
    $html = file_get_contents(__DIR__ . '/../public/templates/bill-template.html');
    
    // Replace placeholders
    $replacements = [
        '{{property_name}}'  => $billData['property_name'],
        '{{room_number}}'    => $billData['room_number'],
        '{{tenant_name}}'    => $billData['tenant_name'],
        '{{billing_month}}'  => $billData['billing_month'],
        '{{elec_old}}'       => number_format($billData['electricity']['old_reading']),
        '{{elec_new}}'       => number_format($billData['electricity']['new_reading']),
        '{{elec_usage}}'     => number_format($billData['electricity']['usage']),
        '{{elec_total}}'     => number_format($billData['electricity']['total']),
        '{{water_old}}'      => number_format($billData['water']['old_reading']),
        '{{water_new}}'      => number_format($billData['water']['new_reading']),
        '{{water_usage}}'    => number_format($billData['water']['usage']),
        '{{water_total}}'    => number_format($billData['water']['total']),
        '{{room_rent}}'      => number_format($billData['room_rent']),
        '{{grand_total}}'    => number_format($billData['grand_total']),
    ];
    
    $html = str_replace(array_keys($replacements), array_values($replacements), $html);
    
    $dompdf = new Dompdf();
    $dompdf->loadHtml($html);
    $dompdf->setPaper('A5', 'portrait');
    $dompdf->render();
    
    return $dompdf->output();
}
```

---

## 🚀 6. Deployment Config (Vercel)

### 6.1 vercel.json

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.php",
      "use": "vercel-php@0.7.1"
    },
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ],
  "env": {
    "FIREBASE_SERVICE_ACCOUNT_JSON": "@firebase-service-account",
    "FIREBASE_STORAGE_BUCKET": "@firebase-storage-bucket"
  }
}
```

### 6.2 composer.json

```json
{
  "name": "nhatro/quan-ly-phong-tro",
  "description": "Hệ thống quản lý nhà trọ",
  "require": {
    "php": "^8.1",
    "kreait/firebase-php": "^7.0",
    "dompdf/dompdf": "^2.0"
  }
}
```

### 6.3 Biến môi trường trên Vercel

| Biến | Mô tả | Ví dụ |
|------|--------|-------|
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Nội dung file JSON service account | `{"type":"service_account",...}` |
| `FIREBASE_STORAGE_BUCKET` | Tên bucket Storage | `nhatro-app.appspot.com` |

> **Lưu ý:** Dùng `vercel secrets` để lưu trữ an toàn service account JSON.

---

## 📐 7. UI Design Guidelines

### 7.1 Color Palette

| Vai trò | Mã màu | Sử dụng |
|---------|---------|---------|
| Primary | `#2563EB` | Sidebar, buttons chính |
| Primary Dark | `#1E40AF` | Sidebar hover, active |
| Background | `#F1F5F9` | Nền trang |
| Card | `#FFFFFF` | Card containers |
| Text Primary | `#1E293B` | Tiêu đề |
| Text Secondary | `#64748B` | Mô tả phụ |
| Success | `#10B981` | Trạng thái "Đã thanh toán", phòng trống |
| Warning | `#F59E0B` | Trạng thái chờ xử lý |
| Danger | `#EF4444` | Xóa, hết hạn |

### 7.2 Layout Structure

```
┌─────────────────────────────────────────────────┐
│  SIDEBAR (Primary Blue)  │  MAIN CONTENT        │
│  ┌───────────────────┐   │  ┌─────────────────┐ │
│  │ 🏠 Logo           │   │  │ Header / Search │ │
│  ├───────────────────┤   │  ├─────────────────┤ │
│  │ 📊 Dashboard      │   │  │                 │ │
│  │ 🚪 Phòng trọ      │   │  │  Stat Cards     │ │
│  │ 📋 Hợp đồng       │   │  │  ┌──┐ ┌──┐ ┌──┐│ │
│  │ 💰 Tính tiền       │   │  │  └──┘ └──┘ └──┘│ │
│  │ ⚙️ Cài đặt         │   │  │                 │ │
│  ├───────────────────┤   │  │  Data Table /    │ │
│  │ 🚪 Đăng xuất      │   │  │  Content Area   │ │
│  └───────────────────┘   │  │                 │ │
│                          │  └─────────────────┘ │
└─────────────────────────────────────────────────┘
```
