<?php
// Cấu hình kết nối PostgreSQL
define('PG_DB',   'xphu');
define('PG_USER', 'postgres');
define('PG_PASS', '1');
define('PG_HOST', 'localhost');
define('PG_PORT', '5432');

// Tạo chuỗi kết nối
$connection_string = sprintf(
    "host=%s port=%s dbname=%s user=%s password=%s",
    PG_HOST,
    PG_PORT,
    PG_DB,
    PG_USER,
    PG_PASS
);

// Kết nối đến PostgreSQL
$pg_conn = pg_connect($connection_string);

// Kiểm tra kết nối
if (!$pg_conn) {
    http_response_code(500);
    error_log('PostgreSQL Connection Error: ' . pg_last_error());
    die(json_encode([
        'error' => true,
        'message' => 'Không kết nối được PostgreSQL. Vui lòng kiểm tra cấu hình trong db/connection.php'
    ]));
}

// Thiết lập charset UTF-8 để hỗ trợ tiếng Việt
pg_set_client_encoding($pg_conn, 'UTF8');