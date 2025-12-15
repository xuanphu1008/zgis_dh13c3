// ===== UI INTERACTIONS =====

// Toggle sidebar trên mobile
document.addEventListener('DOMContentLoaded', function() {
  const sidebar = document.getElementById('sidebar');
  const mobileToggle = document.getElementById('mobileToggle');
  const sidebarToggle = document.getElementById('sidebarToggle');
  
  // Mở sidebar
  if (mobileToggle) {
    mobileToggle.addEventListener('click', function() {
      sidebar.classList.toggle('active');
    });
  }
  
  // Đóng sidebar
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function() {
      sidebar.classList.remove('active');
    });
  }
  
  // Đóng sidebar khi click ra ngoài trên mobile
  document.addEventListener('click', function(e) {
    if (window.innerWidth <= 768) {
      if (!sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
        sidebar.classList.remove('active');
      }
    }
  });
  
  // Đóng livesearch khi click ra ngoài
  document.addEventListener('click', function(e) {
    const searchWrapper = document.querySelector('.search-wrapper');
    const livesearch = document.getElementById('livesearch');
    
    if (!searchWrapper.contains(e.target)) {
      livesearch.style.display = 'none';
    }
  });
  
  // Xử lý ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      // Đóng sidebar trên mobile
      sidebar.classList.remove('active');
      
      // Đóng livesearch
      document.getElementById('livesearch').style.display = 'none';
      
      // Đóng popup
      if (window.overlay) {
        window.overlay.setPosition(undefined);
      }
    }
  });
});

// Smooth scroll cho legend
const legendSection = document.querySelector('.legend-section');
if (legendSection) {
  legendSection.style.scrollBehavior = 'smooth';
}

// Animation khi hover layer items
const layerItems = document.querySelectorAll('.layer-item');
layerItems.forEach(item => {
  item.addEventListener('mouseenter', function() {
    this.style.transform = 'translateX(4px)';
  });
  
  item.addEventListener('mouseleave', function() {
    this.style.transform = 'translateX(0)';
  });
});

// Loading indicator cho search
let searchTimeout;
window.showResultWithLoading = function(str) {
  const livesearch = document.getElementById('livesearch');
  
  clearTimeout(searchTimeout);
  
  if (!str || str.trim().length === 0) {
    livesearch.style.display = 'none';
    livesearch.innerHTML = '';
    return;
  }
  
  // Show loading
  livesearch.innerHTML = '<div style="padding: 16px; text-align: center; color: #94a3b8;">Đang tìm kiếm...</div>';
  livesearch.style.display = 'block';
  
  // Delay search để tránh spam requests
  searchTimeout = setTimeout(function() {
    showResult(str);
  }, 300);
};

// Export để dùng ở nơi khác
window.closeSidebar = function() {
  document.getElementById('sidebar').classList.remove('active');
};