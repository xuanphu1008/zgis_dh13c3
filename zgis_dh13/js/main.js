// ==== CẤU HÌNH GEO ====
const GEOSERVER_WMS = "http://localhost:8080/geoserver/xphu/wms";
const EPSG_CODE = "EPSG:3405";

// bbox mẫu trong ảnh
const DEFAULT_BOUNDS = [564180.4375, 2317463.25, 564516.125, 2318016.75];

// ==== PROJECTION (EPSG:3405) ====
const projection = new ol.proj.Projection({
  code: EPSG_CODE,
  units: "m",
  axisOrientation: "neu",
});

// ==== VIEW ====
let shouldUpdate = true;
let center = [564429.04, 2317738.2];
let zoom = 16.56631263565161;
let rotation = 0;

// Đọc trạng thái từ URL
if (window.location.hash !== "") {
  const hash = window.location.hash.replace("#map=", "");
  const parts = hash.split("/");
  if (parts.length >= 3) {
    zoom = parseInt(parts[0], 10);
    center = [parseFloat(parts[1]), parseFloat(parts[2])];
    if (parts.length >= 4) rotation = parseFloat(parts[3]);
  }
}

const view = new ol.View({
  projection: projection,
  center: center,
  zoom: zoom,
  rotation: rotation,
});

// ==== LAYERS (WMS Image) ====
// Hiện trạng
const lyr_ht = new ol.layer.Image({
  title: "xphu:camhoang_ht",
  source: new ol.source.ImageWMS({
    ratio: 1,
    url: GEOSERVER_WMS,
    params: { LAYERS: "xphu:camhoang_ht", VERSION: "1.1.0", FORMAT: "image/png" },
  }),
  visible: true,
});

// Giao thông
const lyr_gt = new ol.layer.Image({
  title: "xphu:camhoang_gt",
  source: new ol.source.ImageWMS({
    ratio: 1,
    url: GEOSERVER_WMS,
    params: { LAYERS: "xphu:camhoang_gt", VERSION: "1.1.0", FORMAT: "image/png" },
  }),
  visible: true,
});

// CS hạ tầng
const lyr_csht = new ol.layer.Image({
  title: "xphu:camhoang_csht",
  source: new ol.source.ImageWMS({
    ratio: 1,
    url: GEOSERVER_WMS,
    params: { LAYERS: "xphu:camhoang_csht", VERSION: "1.1.0", FORMAT: "image/png" },
  }),
  visible: true,
});

// ==== HIGHLIGHT VECTOR LAYER ====
const highlightStyle = new ol.style.Style({
  fill: new ol.style.Fill({
    color: 'rgba(255, 0, 0, 0.1)' // Màu đỏ nhạt bên trong
  }),
  stroke: new ol.style.Stroke({
    color: '#ff0000', // Viền đỏ
    width: 3
  })
});

const highlightSource = new ol.source.Vector();
const highlightLayer = new ol.layer.Vector({
  source: highlightSource,
  style: highlightStyle,
  zIndex: 999
});

// ==== MAP ====
const map = new ol.Map({
  target: "map",
  layers: [lyr_ht, lyr_gt, lyr_csht, highlightLayer],
  view: view,
});

// Fit theo BBOX mẫu
if (window.location.hash === "") {
  view.fit(ol.extent.boundingExtent([
    [DEFAULT_BOUNDS[0], DEFAULT_BOUNDS[1]],
    [DEFAULT_BOUNDS[2], DEFAULT_BOUNDS[3]],
  ]), { size: map.getSize() });
}

// ==== CHECKBOX hiển thị lớp ====
$("#chk_ht").on("change", function () { lyr_ht.setVisible(this.checked); });
$("#chk_gt").on("change", function () { lyr_gt.setVisible(this.checked); });
$("#chk_csht").on("change", function () { lyr_csht.setVisible(this.checked); });

// ==== POPUP OVERLAY ====
const container = document.getElementById("popup");
const content = document.getElementById("popup-content");
const closer = document.getElementById("popup-closer");

const overlay = new ol.Overlay({
  element: container,
  autoPan: { animation: { duration: 250 } }
});
map.addOverlay(overlay);

closer.onclick = function () {
  overlay.setPosition(undefined);
  closer.blur();
  return false;
};

// ==== HÀM HIGHLIGHT VÙNG VÀ ZOOM ====
function highlightFeature(geojson, zoomToFeature = true) {
  console.log('highlightFeature được gọi với:', geojson);
  
  // Xóa highlight cũ
  highlightSource.clear();
  
  if (!geojson || !geojson.features || geojson.features.length === 0) {
    console.log('Không có features để highlight');
    return;
  }
  
  console.log('Số features:', geojson.features.length);
  console.log('Feature đầu tiên:', geojson.features[0]);
  
  try {
    const format = new ol.format.GeoJSON();
    const features = format.readFeatures(geojson, {
      dataProjection: EPSG_CODE,
      featureProjection: EPSG_CODE
    });
    
    console.log('Đã parse được', features.length, 'features');
    console.log('Feature geometry:', features[0].getGeometry());
    
    // Thêm features vào layer highlight
    highlightSource.addFeatures(features);
    console.log('Đã thêm features vào highlightSource');
    
    // Zoom vào vùng được chọn
    if (zoomToFeature && features.length > 0) {
      const extent = highlightSource.getExtent();
      console.log('Extent:', extent);
      
      // Sử dụng view.fit với size của map để đảm bảo zoom chính xác
      view.fit(extent, {
        size: map.getSize(), // Quan trọng: truyền size của map
        padding: [100, 100, 100, 100], // Padding lớn hơn để dễ nhìn
        duration: 1000,
        maxZoom: 18, // Giảm maxZoom để không zoom quá gần
        constrainResolution: false // Cho phép zoom mượt mà hơn
      });
      
      console.log('Đã zoom vào extent');
    }
  } catch(e) {
    console.error('Lỗi khi highlight feature:', e);
  }
}

// ==== HÀM TẠO URL GetFeatureInfo THỦ CÔNG ====
function createGetFeatureInfoUrl(coordinate) {
  const resolution = view.getResolution();
  const projection = view.getProjection();
  const extent = view.calculateExtent(map.getSize());
  const size = map.getSize();
  
  // Tính toán pixel position
  const dx = (coordinate[0] - extent[0]) / resolution;
  const dy = (extent[3] - coordinate[1]) / resolution;
  
  // Tạo URL params
  const params = {
    'SERVICE': 'WMS',
    'VERSION': '1.1.1',
    'REQUEST': 'GetFeatureInfo',
    'FORMAT': 'image/png',
    'TRANSPARENT': true,
    'QUERY_LAYERS': 'xphu:camhoang_ht',
    'LAYERS': 'xphu:camhoang_ht',
    'INFO_FORMAT': 'application/json',
    'FEATURE_COUNT': 50,
    'X': Math.floor(dx),
    'Y': Math.floor(dy),
    'SRS': EPSG_CODE,
    'WIDTH': size[0],
    'HEIGHT': size[1],
    'BBOX': extent.join(',')
  };
  
  // Tạo query string
  const queryString = Object.keys(params)
    .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
    .join('&');
  
  return GEOSERVER_WMS + '?' + queryString;
}

// ==== HÀM LẤY FEATURE ĐẦY ĐỦ TỪ WFS (QUA PROXY) ====
function getFeatureByClick(coordinate) {
  // Tạo buffer nhỏ xung quanh điểm click
  const buffer = view.getResolution() * 5; // 5 pixels
  const minx = coordinate[0] - buffer;
  const miny = coordinate[1] - buffer;
  const maxx = coordinate[0] + buffer;
  const maxy = coordinate[1] + buffer;
  const bbox = `${minx},${miny},${maxx},${maxy}`;
  
  const wfsUrl = 'http://localhost:8080/geoserver/xphu/ows?' + 
    'service=WFS&' +
    'version=1.0.0&' +
    'request=GetFeature&' +
    'typeName=xphu:camhoang_ht&' +
    'outputFormat=application/json&' +
    'srsname=' + EPSG_CODE + '&' +
    'bbox=' + bbox + ',' + EPSG_CODE;
  
  // Gọi qua proxy để tránh CORS
  const proxyUrl = 'php/api/proxy.php?url=' + encodeURIComponent(wfsUrl);
  
  console.log('WFS URL (qua proxy):', proxyUrl);
  
  return $.ajax({
    type: "GET",
    url: proxyUrl,
    dataType: "json"
  });
}

// ==== LẤY THUỘC TÍNH BẰNG WFS (click) ====
map.on("singleclick", function (evt) {
  console.log('Click tại:', evt.coordinate);
  
  getFeatureByClick(evt.coordinate)
    .done(function(data) {
      console.log('WFS Response:', data);
      
      if (!data || !data.features || !data.features.length) {
        $("#info").hide();
        overlay.setPosition(undefined);
        highlightSource.clear();
        console.log('Không có feature nào được tìm thấy');
        return;
      }

      // HIGHLIGHT VÀ ZOOM VÀO VÙNG ĐƯỢC CHỌN
      console.log('Đang highlight feature với geometry:', data.features[0].geometry);
      highlightFeature(data, true);

      // Tạo bảng thuộc tính
      let html = `<table class="attr"><thead><tr><th>Thuộc tính</th><th>Giá trị</th></tr></thead><tbody>`;
      
      const props = data.features[0].properties || {};
      
      // Hiển thị các thuộc tính quan trọng
      if (props["ChuSD"]) {
        html += `<tr><td>Chủ sử dụng</td><td>${props["ChuSD"]}</td></tr>`;
      }
      if (props["HTSDD"]) {
        html += `<tr><td>Hiện trạng sử dụng đất</td><td>${props["HTSDD"]}</td></tr>`;
      }
      if (props["Ghichu_HT"]) {
        html += `<tr><td>Ghi chú</td><td>${props["Ghichu_HT"]}</td></tr>`;
      }
      if (props["Shape_Area"]) {
        html += `<tr><td>Diện tích</td><td>${parseFloat(props["Shape_Area"]).toFixed(2)} m²</td></tr>`;
      }
      if (props["Shape_Leng"]) {
        html += `<tr><td>Chu vi</td><td>${parseFloat(props["Shape_Leng"]).toFixed(2)} m</td></tr>`;
      }
      
      html += `</tbody></table>`;

      content.innerHTML = html;
      overlay.setPosition(evt.coordinate);
      $("#info").html(html).show();
    })
    .fail(function(xhr, status, error) {
      console.error('WFS error:', status, error);
      console.error('Response:', xhr.responseText);
      $("#info").hide();
      overlay.setPosition(undefined);
      highlightSource.clear();
    });
});

// ==== PERMALINK ====
const updatePermalink = function () {
  if (!shouldUpdate) { shouldUpdate = true; return; }
  const center = view.getCenter();
  const hash = `map=${view.getZoom()}/${Math.round(center[0] * 100) / 100}/${Math.round(center[1] * 100) / 100}/${view.getRotation()}`;
  window.history.replaceState(null, "map", `#${hash}`);
};
map.on("moveend", updatePermalink);

window.addEventListener("popstate", function (event) {
  if (event.state === null) return;
  view.setCenter(event.state.center);
  view.setZoom(event.state.zoom);
  view.setRotation(event.state.rotation);
  shouldUpdate = false;
});

// ==== HÀM DI CHUYỂN ĐẾN ĐIỂM + HIGHLIGHT (TỪ SEARCH) ====
window.di_den_diem = function (x, y, geojsonStr) {
  console.log('di_den_diem called:', x, y, geojsonStr);
  
  const pt = [parseFloat(x), parseFloat(y)];
  
  if (geojsonStr) {
    try {
      const geoObj = JSON.parse(geojsonStr);
      console.log('Parsed GeoJSON:', geoObj);
      // Highlight và zoom vào
      highlightFeature(geoObj, true);
    } catch (e) {
      console.error('Lỗi parse GeoJSON:', e);
      view.animate({ center: pt, zoom: 20, duration: 2000 });
    }
  } else {
    view.animate({ center: pt, zoom: 20, duration: 2000 });
  }
  
  $("#livesearch").hide().empty();
};

// ==== LEGEND ====
function legendUrl(layerName) {
  const u = new URL(GEOSERVER_WMS);
  u.searchParams.set("REQUEST", "GetLegendGraphic");
  u.searchParams.set("VERSION", "1.0.0");
  u.searchParams.set("FORMAT", "image/png");
  u.searchParams.set("TRANSPARENT", "true");
  u.searchParams.set("LAYER", layerName);
  return u.toString();
}

function updateLegend() {
  const el = document.getElementById("legend");
  let html = "";

  if (lyr_ht.getVisible()) {
    html += `<div class="lg-title">Hiện trạng (camhoang_ht)</div>
             <img src="${legendUrl('xphu:camhoang_ht')}" alt="legend ht">`;
  }
  if (lyr_gt.getVisible()) {
    html += `<div class="lg-title">Giao thông (camhoang_gt)</div>
             <img src="${legendUrl('xphu:camhoang_gt')}" alt="legend gt">`;
  }
  if (lyr_csht.getVisible()) {
    html += `<div class="lg-title">CS hạ tầng (camhoang_csht)</div>
             <img src="${legendUrl('xphu:camhoang_csht')}" alt="legend csht">`;
  }
  el.innerHTML = html || "<em>Không có lớp nào được bật</em>";
}

updateLegend();

document.getElementById("chk_ht").addEventListener("change", updateLegend);
document.getElementById("chk_gt").addEventListener("change", updateLegend);
document.getElementById("chk_csht").addEventListener("change", updateLegend);

[lyr_ht, lyr_gt, lyr_csht].forEach(l => l.on('change:visible', updateLegend));