import { CartItem, Product, UserSession } from "./types/models.js";

const USER_STORAGE_KEY = "all_online_shop_user";
const CART_STORAGE_KEY = "all_online_shop_cart";

export function getCurrentUser(): UserSession | null {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as UserSession;
    } catch {
        return null;
    }
}

export function setCurrentUser(user: UserSession | null): void {
    if (!user) {
        localStorage.removeItem(USER_STORAGE_KEY);
    } else {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    }
    renderNavbarState();
}

export function getCart(): CartItem[] {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    try {
        return JSON.parse(raw) as CartItem[];
    } catch {
        return [];
    }
}

export function saveCart(items: CartItem[]): void {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    renderNavbarState();
}

export function addToCart(product: Product, qty: number = 1): void {
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
        } else {
            existing.quantity = nextQty;
            showToast(`เพิ่ม "${product.name}" ลงตะกร้าแล้ว (${existing.quantity} ชิ้น)`);
        }
    } else {
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

export function getCartTotalCount(): number {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function formatCurrency(amount: number): string {
    return amount.toLocaleString("th-TH", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

export function showToast(message: string, isError: boolean = false): void {
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

export function renderNavbarState(): void {
    const badgeEl = document.getElementById("nav-cart-badge");
    if (badgeEl) {
        badgeEl.textContent = String(getCartTotalCount());
    }

    const authArea = document.getElementById("nav-auth-area");
    if (!authArea) return;

    const user = getCurrentUser();
    if (!user) {
        authArea.innerHTML = `
            <a href="/pages/login.html" class="nav-btn primary">เข้าสู่ระบบ</a>
        `;
    } else {
        const adminLink =
            user.role === "admin"
                ? `<a href="/pages/admin.html" class="nav-btn primary">จัดการระบบ</a>`
                : "";
        authArea.innerHTML = `
            <div class="user-pill">
                <span>${user.display_name}</span>
                <span class="role-badge">${user.role}</span>
            </div>
            ${adminLink}
            <button id="btn-logout" class="nav-btn" type="button">ออกจากระบบ</button>
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
