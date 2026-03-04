<?php
/**
 * Authentication Middleware
 * 
 * Xác thực Firebase ID Token từ request header.
 * Sử dụng: $user = verifyFirebaseToken();
 * 
 * Header format: Authorization: Bearer <ID_TOKEN>
 */

require_once __DIR__ . '/helpers.php';

/**
 * Xác thực Firebase ID Token và trả về thông tin user
 * 
 * @return array ['uid', 'email', 'role', 'display_name']
 */
function verifyFirebaseToken(): array
{
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';

    if (!str_starts_with($authHeader, 'Bearer ')) {
        sendJsonError('Token không hợp lệ hoặc không được cung cấp.', 401);
    }

    $idToken = substr($authHeader, 7);

    if (empty($idToken)) {
        sendJsonError('Token rỗng.', 401);
    }

    try {
        /** @var \Kreait\Firebase\Factory $firebase */
        $firebase = require __DIR__ . '/firebase.php';

        // Verify ID Token
        $verifiedToken = $firebase->createAuth()->verifyIdToken($idToken);
        $uid = $verifiedToken->claims()->get('sub');

        // Lấy thông tin user từ Firestore
        $firestore = $firebase->createFirestore()->database();
        $userDoc = $firestore->collection('users')->document($uid)->snapshot();

        if (!$userDoc->exists()) {
            sendJsonError('Tài khoản không tồn tại trong hệ thống.', 403);
        }

        $userData = $userDoc->data();

        // Kiểm tra tài khoản có active không
        if (!($userData['is_active'] ?? false)) {
            sendJsonError('Tài khoản đã bị vô hiệu hóa.', 403);
        }

        return [
            'uid' => $uid,
            'email' => $userData['email'] ?? '',
            'role' => $userData['role'] ?? 'staff',
            'display_name' => $userData['display_name'] ?? '',
        ];
    } catch (\Kreait\Firebase\Exception\Auth\FailedToVerifyToken $e) {
        sendJsonError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 401);
    } catch (\Exception $e) {
        sendJsonError('Lỗi xác thực: ' . $e->getMessage(), 500);
    }

    // Fallback (sẽ không bao giờ đến đây do sendJsonError exit)
    exit;
}

/**
 * Kiểm tra user có quyền Admin không
 */
function requireAdmin(array $user): void
{
    if ($user['role'] !== 'admin') {
        sendJsonError('Bạn không có quyền thực hiện thao tác này.', 403);
    }
}
