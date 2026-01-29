// State management
let allPosts = [];
let allComments = [];
let editingPostId = null;
let editingCommentId = null;

const API_URL = 'http://localhost:3000';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
});

// Load data from JSON Server API
async function loadData() {
    try {
        const [postsRes, commentsRes] = await Promise.all([
            fetch(`${API_URL}/posts`),
            fetch(`${API_URL}/comments`)
        ]);

        if (!postsRes.ok || !commentsRes.ok) {
            throw new Error('Failed to load data from API');
        }

        allPosts = await postsRes.json();
        allComments = await commentsRes.json();

        // Ensure isDeleted field exists for all posts
        allPosts = allPosts.map(post => ({
            ...post,
            isDeleted: post.isDeleted || false
        }));

        displayPosts();
        displayComments();
        loadPostsInCommentSelect();
    } catch (error) {
        console.error('Error loading data:', error);
        alert('❌ Lỗi: Không thể kết nối tới API.\n\nVui lòng kiểm tra:\n1. json-server có đang chạy không?\n2. URL: http://localhost:3000');
    }
}

// Save data to JSON Server API
async function saveData() {
    // Data auto-saves through API endpoints
    console.log('Data synced with API');
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('postForm').addEventListener('submit', handleCreateOrUpdatePost);
    document.getElementById('commentForm').addEventListener('submit', handleCreateOrUpdateComment);
}

// ============ POSTS CRUD ============

// Create or Update Post
async function handleCreateOrUpdatePost(e) {
    e.preventDefault();
    
    const title = document.getElementById('postTitle').value.trim();
    const views = parseInt(document.getElementById('postViews').value) || 0;

    if (!title) {
        alert('Vui lòng nhập tiêu đề');
        return;
    }

    try {
        if (editingPostId !== null) {
            // Update existing post via API
            const response = await fetch(`${API_URL}/posts/${editingPostId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingPostId,
                    title,
                    views
                })
            });

            if (!response.ok) throw new Error('Failed to update post');
            
            const updatedPost = await response.json();
            const index = allPosts.findIndex(p => p.id == editingPostId);
            if (index !== -1) {
                allPosts[index] = updatedPost;
            }
        } else {
            // Create new post via API (json-server auto-generates ID)
            const response = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    views
                })
            });

            if (!response.ok) throw new Error('Failed to create post');
            
            const newPost = await response.json();
            allPosts.push(newPost);
        }

        resetForm();
        displayPosts();
        loadPostsInCommentSelect();
        alert('✓ Lưu thành công!');
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Lỗi: ' + error.message);
    }
}

// Delete Post via API
async function deletePost(postId) {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete post');
        
        allPosts = allPosts.filter(p => p.id != postId);
        displayPosts();
        loadPostsInCommentSelect();
        alert('✓ Xóa bài viết thành công!');
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Lỗi: ' + error.message);
    }
}

// Restore Post (for soft delete - edit post to restore)
function restorePost(postId) {
    const post = allPosts.find(p => p.id == postId);
    if (post && !post.isDeleted) {
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postViews').value = post.views;
        document.getElementById('form-title').textContent = `Sửa bài viết: ${post.title}`;
        editingPostId = postId;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Edit Post
function editPost(postId) {
    const post = allPosts.find(p => p.id === postId);
    if (post && !post.isDeleted) {
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postViews').value = post.views;
        document.getElementById('form-title').textContent = `Sửa bài viết: ${post.title}`;
        editingPostId = postId;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Display Posts in table
function displayPosts() {
    const container = document.getElementById('posts-container');
    
    if (allPosts.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <p>Chưa có bài viết nào</p>
            </div>
        `;
        return;
    }

    let html = `
        <table class="table table-hover">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Tiêu đề</th>
                    <th>Lượt xem</th>
                    <th>Hành động</th>
                </tr>
            </thead>
            <tbody>
    `;

    allPosts.forEach(post => {
        html += `
            <tr>
                <td><strong>${post.id}</strong></td>
                <td>${post.title}</td>
                <td>${post.views}</td>
                <td>
                    <div style="display: flex; gap: 5px;">
                        <button class="btn-sm-custom btn-edit" onclick="editPost('${post.id}')" title="Sửa">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn-sm-custom btn-delete" onclick="deletePost('${post.id}')" title="Xóa">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

// ============ COMMENTS CRUD ============

// Create or Update Comment via API
async function handleCreateOrUpdateComment(e) {
    e.preventDefault();
    
    const postId = document.getElementById('commentPostId').value.trim();
    const text = document.getElementById('commentText').value.trim();

    if (!postId) {
        alert('Vui lòng chọn bài viết');
        return;
    }

    if (!text) {
        alert('Vui lòng nhập nội dung bình luận');
        return;
    }

    const post = allPosts.find(p => p.id == postId);
    if (!post) {
        alert('Bài viết không tồn tại');
        return;
    }

    try {
        if (editingCommentId !== null) {
            // Update existing comment via API
            const response = await fetch(`${API_URL}/comments/${editingCommentId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingCommentId,
                    text,
                    postId
                })
            });

            if (!response.ok) throw new Error('Failed to update comment');
            
            const updatedComment = await response.json();
            const index = allComments.findIndex(c => c.id == editingCommentId);
            if (index !== -1) {
                allComments[index] = updatedComment;
            }
        } else {
            // Create new comment via API
            const response = await fetch(`${API_URL}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text,
                    postId
                })
            });

            if (!response.ok) throw new Error('Failed to create comment');
            
            const newComment = await response.json();
            allComments.push(newComment);
        }

        resetCommentForm();
        displayComments();
        alert('✓ Lưu bình luận thành công!');
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Lỗi: ' + error.message);
    }
}

// Delete Comment via API
async function deleteComment(commentId) {
    try {
        const response = await fetch(`${API_URL}/comments/${commentId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete comment');
        
        allComments = allComments.filter(c => c.id != commentId);
        displayComments();
        alert('✓ Xóa bình luận thành công!');
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Lỗi: ' + error.message);
    }
}

// Edit Comment
function editComment(commentId) {
    const comment = allComments.find(c => c.id == commentId);
    if (comment) {
        document.getElementById('commentPostId').value = comment.postId;
        document.getElementById('commentText').value = comment.text;
        document.getElementById('comment-form-title').textContent = 'Sửa bình luận';
        editingCommentId = commentId;
        switchTab('comments');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Display Comments
function displayComments() {
    const container = document.getElementById('comments-container');
    
    if (allComments.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <p>Chưa có bình luận nào</p>
            </div>
        `;
        return;
    }

    let html = '';

    allComments.forEach(comment => {
        const post = allPosts.find(p => p.id === comment.postId);
        const postTitle = post ? post.title : 'Bài viết không tồn tại';

        html += `
            <div class="comment-item">
                <div class="comment-header">
                    <div>
                        <span class="comment-id">Comment #${comment.id}</span>
                        <div class="comment-postId">Bài viết: <strong>${postTitle}</strong> (ID: ${comment.postId})</div>
                    </div>
                    <div class="comment-actions">
                        <button class="btn-sm-custom btn-edit" onclick="editComment('${comment.id}')" title="Sửa">
                            <i class="fas fa-edit"></i> Sửa
                        </button>
                        <button class="btn-sm-custom btn-delete" onclick="deleteComment('${comment.id}')" title="Xóa">
                            <i class="fas fa-trash"></i> Xóa
                        </button>
                    </div>
                </div>
                <div class="comment-text">${comment.text}</div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// Load posts in comment select dropdown
function loadPostsInCommentSelect() {
    const select = document.getElementById('commentPostId');
    const currentValue = select.value;

    select.innerHTML = '<option value="">-- Chọn bài viết --</option>';

    allPosts.forEach(post => {
        const option = document.createElement('option');
        option.value = post.id;
        option.textContent = `${post.title} (ID: ${post.id})`;
        select.appendChild(option);
    });

    if (currentValue) select.value = currentValue;
}

// ============ UI HELPERS ============

// Switch tabs
function switchTab(tab) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    // Show selected tab
    if (tab === 'posts') {
        document.getElementById('posts-tab').classList.add('active');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
    } else if (tab === 'comments') {
        document.getElementById('comments-tab').classList.add('active');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');
    }
}

// Reset Post Form
function resetForm() {
    document.getElementById('postForm').reset();
    document.getElementById('form-title').textContent = 'Tạo bài viết mới';
    editingPostId = null;
}

// Reset Comment Form
function resetCommentForm() {
    document.getElementById('commentForm').reset();
    document.getElementById('comment-form-title').textContent = 'Tạo bình luận mới';
    editingCommentId = null;
}
