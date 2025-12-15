// Hiển thị kết quả tìm ngay trong index (live search)
function showResult(str) {
  const box = document.getElementById("livesearch");
  if (!str || str.trim().length === 0) {
    box.style.display = "none";
    box.innerHTML = "";
    return;
  }
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (this.readyState === 4) {
      if (this.status === 200) {
        box.innerHTML = this.responseText;
        box.style.display = "block";
      } else {
        box.innerHTML = "<div style='padding:8px;color:#b00020'>Lỗi kết nối đến server.</div>";
        box.style.display = "block";
      }
    }
  };
  
  // SỬA ĐƯỜNG DẪN: Tùy vào cấu trúc thư mục của bạn
  // Nếu index.html nằm ở root, và live_search.php ở php/api/
  xhr.open("GET", "php/api/live_search.php?ten_vung=" + encodeURIComponent(str), true);
  xhr.send();
}

window.showResult = showResult;