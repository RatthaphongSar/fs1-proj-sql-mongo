const USER_STORAGE_KEY = "all_online_shop_user";
const CART_STORAGE_KEY = "all_online_shop_cart";
export function getCurrentUser() {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw)
        return null;
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export function setCurrentUser(user) {
    if (!user) {
        localStorage.removeItem(USER_STORAGE_KEY);
    }
    else {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    renderNavbarState();
}
export function getCart() {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw)
        return [];
    try {
        return JSON.parse(raw);
    }
    catch {
        return [];
    }
}
export function saveCart(items) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    renderNavbarState();
}
export function addToCart(product, qty = 1) {
    if (product.stock <= 0) {
        showToast("สินค้านี้หมดสต็อกชั่วคราว", true);
        return;
    }
    const cart = getCart();
    const existing = cart.find((c) => c.product_id === product.product_id);
    if (existing) {
        const nextQty = existing.quantity + qty;
        if (nextQty > product.stock) {
            showToast(`เพิ่มได้สูงสุดตามจำนวนสินค้าคงเหลือ (${product.stock} ชิ้น)`, true);
            existing.quantity = product.stock;
        }
        else {
            existing.quantity = nextQty;
            showToast(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว (${existing.quantity} ชิ้น)`);
        }
    }
    else {
        cart.push({
            product_id: product.product_id,
            name: product.name,
            price: product.price,
            quantity: Math.min(qty, product.stock),
            stock: product.stock,
            image_url: product.image_url,
            category: product.category
        });
        showToast(`เพิ่ม "${product.name}" ลงตะกร้าสินค้าเรียบร้อยแล้ว`);
    }
    saveCart(cart);
}
export function getCartTotalCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
}
export function formatCurrency(amount) {
    return amount.toLocaleString("th-TH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}
export function showToast(message, isError = false) {
    let container = document.getElementById("toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "toast-container";
        container.className = "toast-container";
        document.body.appendChild(container);
    }
    const toast = document.createElement("div");
    toast.className = `toast ${isError ? "error" : ""}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3200);
}
export function renderNavbarState() {
    const badgeEl = document.getElementById("nav-cart-badge");
    const count = getCartTotalCount();
    if (badgeEl) {
        badgeEl.textContent = String(count);
    }
    const user = getCurrentUser();
    const authArea = document.getElementById("nav-auth-area");
    if (authArea) {
        if (!user) {
            authArea.innerHTML = `
                <a href="/pages/login.html" class="nav-btn primary">เข้าสู่ระบบ</a>
            `;
        }
        else {
            const adminLink = user.role === "admin"
                ? `<a href="/pages/admin.html" class="nav-btn primary">จัดการระบบ</a>`
                : "";
            authArea.innerHTML = `
                <div class="user-pill">
                    <span class="user-pill-name">${user.display_name}</span>
                    <span class="role-badge">${user.role}</span>
                </div>
                ${adminLink}
                <button id="btn-logout" class="nav-btn" type="button">ออก</button>
            `;
            const logoutBtn = document.getElementById("btn-logout");
            if (logoutBtn) {
                logoutBtn.addEventListener("click", () => {
                    setCurrentUser(null);
                    showToast("ออกจากระบบเรียบร้อยแล้ว");
                    if (window.location.pathname.includes("admin.html")) {
                        window.location.href = "/pages/login.html";
                    }
                });
            }
        }
    }
    renderMobileBottomTabBar(user, count);
}
function renderMobileBottomTabBar(user, cartCount) {
    let bottomBar = document.getElementById("mobile-bottom-nav");
    if (!bottomBar) {
        bottomBar = document.createElement("nav");
        bottomBar.id = "mobile-bottom-nav";
        bottomBar.className = "mobile-bottom-nav";
        document.body.appendChild(bottomBar);
    }
    const path = window.location.pathname;
    const isHome = path === "/" || path.endsWith("index.html");
    const isCart = path.includes("cart.html") || path.includes("payment.html");
    const isAdmin = path.includes("admin.html");
    const isLogin = path.includes("login.html");
    const accountHref = user ? (user.role === "admin" ? "/pages/admin.html" : "/pages/cart.html") : "/pages/login.html";
    const accountLabel = user ? (user.role === "admin" ? "แอดมิน" : "บัญชีฉัน") : "เข้าสู่ระบบ";
    bottomBar.innerHTML = `
        <a href="/" class="mob-tab-item ${isHome ? "active" : ""}">
            <svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span>หน้าแรก</span>
        </a>
        <a href="/#visual-category-grid" class="mob-tab-item">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            <span>หมวดหมู่</span>
        </a>
        <a href="/pages/cart.html" class="mob-tab-item ${isCart ? "active" : ""}">
            <div class="mob-tab-icon-wrap">
                <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                ${cartCount > 0 ? `<span class="mob-cart-pip">${cartCount}</span>` : ""}
            </div>
            <span>ตะกร้า</span>
        </a>
        <a href="${accountHref}" class="mob-tab-item ${isAdmin || isLogin ? "active" : ""}">
            <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>${accountLabel}</span>
        </a>
    `;
}
