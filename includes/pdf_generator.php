<?php
/**
 * PDF Generator - Tạo phiếu thu tiền phòng trọ
 * 
 * ⚠️ TEMPLATE - Sẽ hoàn thiện ở Giai đoạn 5.
 * 
 * Sử dụng thư viện Dompdf để render HTML → PDF.
 */

// require_once __DIR__ . '/../vendor/autoload.php';
// use Dompdf\Dompdf;

/**
 * Tạo PDF phiếu thu từ dữ liệu hóa đơn
 * 
 * @param array $billData Dữ liệu hóa đơn từ Firestore
 * @return string PDF content (binary)
 */
function generateBillPdf(array $billData): string
{
    // TODO: Implement ở Giai đoạn 5
    // 1. Load bill-template.html
    // 2. Replace placeholders với dữ liệu
    // 3. Render PDF bằng Dompdf
    // 4. Return PDF binary

    throw new \RuntimeException('PDF Generator chưa được implement. Xem Giai đoạn 5.');
}
