// Store original products
let allProducts = [];
let filteredProducts = [];
let deleteProductId = null;

// Load data from db.json
async function loadProducts() {
    try {
        const response = await fetch('db.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        allProducts = await response.json();
        filteredProducts = [...allProducts];
        displayProducts(filteredProducts);
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-container').innerHTML = 
            `<div class="error"><i class="fas fa-exclamation-circle"></i><div>Lỗi: Không thể tải dữ liệu.</div><div>${error.message}</div></div>`;
    }
}

// Handle search with onChange event
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredProducts = [...allProducts];
    } else {
        filteredProducts = allProducts.filter(product => 
            product.title.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    displayProducts(filteredProducts);
}

// Sort by name
function sortByName(order) {
    updateSortButtonState('name', order);
    
    filteredProducts.sort((a, b) => {
        const nameA = a.title.toLowerCase();
        const nameB = b.title.toLowerCase();
        
        if (order === 'asc') {
            return nameA.localeCompare(nameB);
        } else {
            return nameB.localeCompare(nameA);
        }
    });
    
    displayProducts(filteredProducts);
}

// Sort by price
function sortByPrice(order) {
    updateSortButtonState('price', order);
    
    filteredProducts.sort((a, b) => {
        if (order === 'asc') {
            return a.price - b.price;
        } else {
            return b.price - a.price;
        }
    });
    
    displayProducts(filteredProducts);
}

// Update sort button active state
function updateSortButtonState(type, order) {
    const buttons = document.querySelectorAll('.sort-button');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

// Display products in table format
function displayProducts(products) {
    const container = document.getElementById('products-container');
    
    if (!products || products.length === 0) {
        container.innerHTML = '<div class="no-results"><i class="fas fa-inbox"></i><div>Không tìm thấy sản phẩm nào</div></div>';
        return;
    }
    
    let tableHTML = `
        <table class="table table-hover">
            <thead>
                <tr>
                    <th style="width: 5%;">ID</th>
                    <th style="width: 10%;">Hình ảnh</th>
                    <th style="width: 25%;">Tên sản phẩm</th>
                    <th style="width: 15%;">Danh mục</th>
                    <th style="width: 30%;">Mô tả</th>
                    <th style="width: 10%;">Giá</th>
                    <th style="width: 5%;">Hành động</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    products.forEach((product, index) => {
        // Get image URL from db.json
        let imageUrl = null;
        if (product.images && product.images.length > 0) {
            imageUrl = product.images[0];
        }
        
        const categoryName = product.category 
            ? product.category.name 
            : 'Không xác định';
        
        const description = product.description || 'Không có mô tả';
        const shortDescription = description.length > 50 
            ? description.substring(0, 50) + '...' 
            : description;
        
        let imageCell = '';
        if (imageUrl) {
            imageCell = `
                <div style="position: relative; width: 90px; height: 90px; overflow: hidden; border-radius: 10px; background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);">
                    <img 
                        src="${imageUrl}" 
                        alt="${product.title}" 
                        class="product-image" 
                        onclick="showImageModal('${imageUrl}', '${product.title.replace(/'/g, "\\'")}', event)"
                        onerror="handleImageError(this)"
                        style="width: 100%; height: 100%;"
                    >
                </div>
            `;
        } else {
            imageCell = '<div class="product-image-error"><i class="fas fa-image"></i></div>';
        }
        
        tableHTML += `
            <tr>
                <td>${product.id}</td>
                <td>${imageCell}</td>
                <td><span class="product-name">${product.title}</span></td>
                <td><span class="product-category">${categoryName}</span></td>
                <td title="${description}">${shortDescription}</td>
                <td><span class="product-price">$${product.price.toLocaleString()}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-sm btn-view" onclick="viewProduct(${product.id})" title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-sm btn-add" onclick="addToCart(${product.id})" title="Thêm vào giỏ">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                        <button class="btn-sm btn-delete" onclick="confirmDelete(${product.id})" title="Xóa sản phẩm">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
}

// Show image in modal
function showImageModal(imageUrl, productName, event) {
    event.stopPropagation();
    document.getElementById('modalTitle').textContent = productName;
    document.getElementById('modalImage').src = imageUrl;
    document.getElementById('modalImage').onerror = function() {
        this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect fill="%23e9ecef" width="600" height="600"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="%23999" text-anchor="middle" dy=".3em"%3EImage Not Found%3C/text%3E%3C/svg%3E';
    };
    const modal = new bootstrap.Modal(document.getElementById('imageModal'));
    modal.show();
}

// View product details in modal
function viewProduct(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        let imageUrl = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23e9ecef" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="24" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';
        
        if (product.images && product.images.length > 0) {
            imageUrl = product.images[0];
        }
        
        const categoryName = product.category 
            ? product.category.name 
            : 'Không xác định';
        
        document.getElementById('detailName').textContent = product.title;
        document.getElementById('detailId').textContent = product.id;
        document.getElementById('detailCategory').textContent = categoryName;
        document.getElementById('detailPrice').textContent = `$${product.price.toLocaleString()}`;
        document.getElementById('detailDescription').textContent = product.description || 'Không có mô tả';
        document.getElementById('detailImage').src = imageUrl;
        document.getElementById('detailImage').onerror = function() {
            this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="600"%3E%3Crect fill="%23e9ecef" width="600" height="600"/%3E%3Ctext x="50%25" y="50%25" font-size="32" fill="%23999" text-anchor="middle" dy=".3em"%3EImage Not Available%3C/text%3E%3C/svg%3E';
        };
        document.getElementById('detailAddBtn').onclick = () => {
            addToCart(productId);
            bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide();
        };
        
        const modal = new bootstrap.Modal(document.getElementById('detailModal'));
        modal.show();
    }
}

// Confirm delete
function confirmDelete(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
        deleteProductId = productId;
        document.getElementById('deleteMessage').textContent = `Sản phẩm: "${product.title}"`;
        document.getElementById('confirmDeleteBtn').onclick = () => deleteProduct(productId);
        
        const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
        modal.show();
    }
}

// Delete product
function deleteProduct(productId) {
    // Remove from allProducts
    allProducts = allProducts.filter(p => p.id !== productId);
    // Remove from filteredProducts
    filteredProducts = filteredProducts.filter(p => p.id !== productId);
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
    
    // Refresh display
    displayProducts(filteredProducts);
    
    // Show success message
    alert('✓ Sản phẩm đã được xóa thành công!');
}

// Handle image loading error
function handleImageError(imgElement) {
    imgElement.style.display = 'none';
    const parent = imgElement.parentElement;
    const errorDiv = document.createElement('div');
    errorDiv.className = 'product-image-error';
    errorDiv.style.width = '90px';
    errorDiv.style.height = '90px';
    errorDiv.innerHTML = '<i class="fas fa-image"></i>';
    parent.innerHTML = '';
    parent.appendChild(errorDiv);
}

// Load products when page loads
document.addEventListener('DOMContentLoaded', loadProducts);
