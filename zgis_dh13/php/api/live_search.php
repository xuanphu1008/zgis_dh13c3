<?php
// Trả về danh sách <a>…</a> để gắn thẳng vào #livesearch
// Tìm theo cột txtmemo và trả về tâm (centroid) + geometry để zoom và highlight

header('Content-Type: text/html; charset=utf-8');

// Kết nối PG
require_once(__DIR__.'/../db/connection.php');

// Nhận chuỗi tìm
$kw = isset($_GET['ten_vung']) ? trim($_GET['ten_vung']) : '';
if ($kw === '') {
  echo '';
  exit;
}

// Chuẩn hóa về lower
$kw_lc = mb_strtolower($kw, 'UTF-8');

// BẢNG/TÊN LỚP DỮ LIỆU DÙNG ĐỂ TÌM
// Sử dụng layer camhoang_ht thay vì camhoangdc
$table = 'public.camhoang_ht';

// Truy vấn: lấy centroid (x,y), các thuộc tính và geometry dạng GeoJSON
$sql = "
  SELECT
    ST_X(ST_Centroid(geom)) AS x,
    ST_Y(ST_Centroid(geom)) AS y,
    \"ChuSD\" as chusd,
    \"HTSDD\" as htsdd,
    \"Ghichu_HT\" as ghichu,
    \"Shape_Area\" as shape_area,
    \"Shape_Leng\" as shape_leng,
    ST_AsGeoJSON(geom) AS geojson
  FROM {$table}
  WHERE LOWER(\"ChuSD\") LIKE '%' || $1 || '%'
     OR LOWER(\"HTSDD\") LIKE '%' || $1 || '%'
     OR LOWER(\"Ghichu_HT\") LIKE '%' || $1 || '%'
  LIMIT 100
";
$res = pg_query_params($pg_conn, $sql, array($kw_lc));

if (!$res) {
  http_response_code(500);
  echo "<div style='padding:8px;color:#b00020'>Lỗi truy vấn cơ sở dữ liệu: " . pg_last_error($pg_conn) . "</div>";
  exit;
}

$rows = pg_fetch_all($res);
if (!$rows) {
  echo "<div style='padding:8px'>Không tìm thấy kết quả cho <b>".htmlspecialchars($kw)."</b>.</div>";
  exit;
}

// In ra danh sách thẻ <a>, click sẽ gọi di_den_diem(x,y,geojson)
foreach ($rows as $r) {
  $name = htmlspecialchars($r['ghichu'] ?? '');
  $x = $r['x'];
  $y = $r['y'];
  $area = htmlspecialchars($r['shape_area'] ?? '');
  
  // Tạo GeoJSON Feature hoàn chỉnh
  $geojson = [
    'type' => 'FeatureCollection',
    'features' => [[
      'type' => 'Feature',
      'geometry' => json_decode($r['geojson']),
      'properties' => [
        'ghichu' => $r['ghichu'],
        'shape_area' => $r['shape_area']
      ]
    ]]
  ];
  
  // Encode thành JSON và escape cho JavaScript
  $geojson_json = json_encode($geojson, JSON_HEX_APOS | JSON_HEX_QUOT);
  
  echo "<a href='javascript:void(0)' onclick='di_den_diem({$x},{$y},&#39;{$geojson_json}&#39;)'>";
  echo "{$name} — diện tích: {$area}";
  echo "</a>";
}