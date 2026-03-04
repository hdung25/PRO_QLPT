<?php
/**
 * Helper Functions
 * 
 * Các hàm tiện ích dùng chung cho toàn bộ API.
 */

/**
 * Thiết lập headers chuẩn cho JSON API
 */
function setupApiHeaders(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');

    // Handle preflight
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

/**
 * Gửi JSON response thành công
 */
function sendJsonSuccess(mixed $data, string $message = 'Thành công', int $code = 200): void
{
    http_response_code($code);
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data,
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Gửi JSON response lỗi và exit
 */
function sendJsonError(string $message, int $code = 400): never
{
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error' => $message,
        'code' => $code,
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Lấy body JSON từ request (POST/PUT)
 */
function getJsonBody(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        sendJsonError('Dữ liệu JSON không hợp lệ.', 400);
    }

    return $data ?? [];
}

/**
 * Kiểm tra các trường bắt buộc
 * 
 * @param array $data Dữ liệu cần kiểm tra
 * @param array $required Danh sách tên trường bắt buộc
 */
function validateRequired(array $data, array $required): void
{
    $missing = [];
    foreach ($required as $field) {
        if (!isset($data[$field]) || $data[$field] === '') {
            $missing[] = $field;
        }
    }

    if (!empty($missing)) {
        sendJsonError(
            'Thiếu thông tin bắt buộc: ' . implode(', ', $missing),
            400
        );
    }
}

/**
 * Sanitize string input (chống XSS)
 */
function sanitize(string $input): string
{
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Format số tiền VNĐ
 * Ví dụ: 3500000 -> "3.500.000"
 */
function formatMoney(int|float $amount): string
{
    return number_format($amount, 0, ',', '.');
}

/**
 * Validate số điện thoại Việt Nam
 */
function isValidPhone(string $phone): bool
{
    return (bool) preg_match('/^(0|\+84)[3-9][0-9]{8}$/', $phone);
}

/**
 * Validate email
 */
function isValidEmail(string $email): bool
{
    return (bool) filter_var($email, FILTER_VALIDATE_EMAIL);
}

/**
 * Tạo ID ngẫu nhiên
 */
function generateId(int $length = 20): string
{
    return bin2hex(random_bytes($length / 2));
}

/**
 * Lấy tháng hiện tại dạng YYYY-MM
 */
function getCurrentMonth(): string
{
    return date('Y-m');
}

/**
 * Kiểm tra HTTP method
 */
function requireMethod(string $method): void
{
    if ($_SERVER['REQUEST_METHOD'] !== strtoupper($method)) {
        sendJsonError("Method {$method} is required.", 405);
    }
}
