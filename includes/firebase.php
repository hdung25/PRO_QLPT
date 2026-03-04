<?php
/**
 * Firebase Connection Factory
 * 
 * ⚠️ TEMPLATE - Sẽ kết nối Firebase thật ở giai đoạn sau.
 * 
 * Sử dụng: $firebase = require __DIR__ . '/firebase.php';
 * 
 * Yêu cầu Environment Variable:
 *   - FIREBASE_SERVICE_ACCOUNT_JSON: Nội dung JSON service account
 *   - FIREBASE_STORAGE_BUCKET: Tên bucket storage
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Kreait\Firebase\Factory;

/**
 * Khởi tạo Firebase Factory với Service Account
 */
function getFirebaseFactory(): Factory {
    $serviceAccountJson = getenv('FIREBASE_SERVICE_ACCOUNT_JSON');
    
    if (!$serviceAccountJson) {
        throw new \RuntimeException(
            'FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set. '
            . 'Please configure it in Vercel Dashboard or .env file.'
        );
    }

    $serviceAccount = json_decode($serviceAccountJson, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new \RuntimeException('Invalid Firebase Service Account JSON format.');
    }

    $storageBucket = getenv('FIREBASE_STORAGE_BUCKET') ?: '';

    $factory = (new Factory)
        ->withServiceAccount($serviceAccount);

    if ($storageBucket) {
        $factory = $factory->withDefaultStorageBucket($storageBucket);
    }

    return $factory;
}

// Trả về Factory instance khi require file này
return getFirebaseFactory();
