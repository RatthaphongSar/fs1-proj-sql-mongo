import { fetchOrdersApi } from "../api/api.js";
import { formatCurrency, getCart, getCurrentUser, renderNavbarState, saveCart, showToast } from "../app.js";
const PENDING_CHECKOUT_KEY = "all_mall_pending_checkout";
async function initCartPage() {
    renderNavbarState();
    prefillUserShipping();
    renderCartItems();
    await renderOrderHistory();
    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
        checkoutForm.addEventListener("submit", handleProceedToPayment);
    }
}
function prefillUserShipping() {
    const user = getCurrentUser();
    if (!user)
        return;
    const nameInput = document.getElementById("cust-name");
    const phoneInput = document.getElementById("cust-phone");
    if (nameInput && !nameInput.value.trim()) {
        nameInput.value = user.display_name;
    }
    if (phoneInput && user.phone && !phoneInput.value.trim()) {
        phoneInput.value = user.phone;
    }
}
function renderCartItems() {
    const listEl = document.getElementById("cart-items-list");
    const totalEl = document.getElementById("cart-total-price");
    if (!listEl || !totalEl)
        return;
    const cart = getCart();
    if (cart.length === 0) {
        listEl.innerHTML = `
            <div style="text-align:center; padding:2.25rem 0; color:#71717a;">
                <p style="font-size:0.95rem; margin-bottom:0.85rem;">ไม่มีรายการสินค้าในตะกร้า</p>
                <a href="/" class="btn btn-orange">เลือกซื้อสินค้า</a>
            </div>
        `;
        totalEl.textContent = "฿0";
        return;
    }
    let sum = 0;
    listEl.innerHTML = cart
        .map((item) => {
        const sub = item.price * item.quantity;
        sum += sub;
        return `
            <div class="cart-item-row">
                <div class="cart-item-info">
                    <img src="${item.image_url}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'" />
                    <div>
                        <div style="font-weight:600; font-size:0.92rem; color:#09090b;">${item.name}</div>
                        <div style="font-size:0.78rem; color:#71717a;">หมวดหมู่: ${item.category}</div>
                        <div style="font-weight:700; font-size:0.86rem; color:#f97316;">฿${formatCurrency(item.price)} / ชิ้น</div>
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <div class="qty-control">
                        <button type="button" data-dec-id="${item.product_id}">-</button>
                        <input type="text" value="${item.quantity}" readonly />
                        <button type="button" data-inc-id="${item.product_id}">+</button>
                    </div>
                    <div style="min-width:90px; text-align:right; font-weight:700; color:#09090b;">
                        ฿${formatCurrency(sub)}
                    </div>
                    <button type="button" class="btn btn-danger btn-sm" data-remove-id="${item.product_id}">ลบ</button>
                </div>
            </div>
        `;
    })
        .join("");
    totalEl.textContent = `฿${formatCurrency(sum)}`;
    listEl.querySelectorAll("[data-dec-id]").forEach((btn) => {
        btn.addEventListener("click", () => updateItemQty(btn.dataset.decId, -1));
    });
    listEl.querySelectorAll("[data-inc-id]").forEach((btn) => {
        btn.addEventListener("click", () => updateItemQty(btn.dataset.incId, 1));
    });
    listEl.querySelectorAll("[data-remove-id]").forEach((btn) => {
        btn.addEventListener("click", () => removeCartItem(btn.dataset.removeId));
    });
}
function updateItemQty(productId, delta) {
    const cart = getCart();
    const target = cart.find((c) => c.product_id === productId);
    if (!target)
        return;
    const next = target.quantity + delta;
    if (next <= 0) {
        removeCartItem(productId);
        return;
    }
    if (next > target.stock) {
        showToast(`จำนวนสินค้าคงเหลือสูงสุด ${target.stock} ชิ้น`, true);
        return;
    }
    target.quantity = next;
    saveCart(cart);
    renderCartItems();
}
function removeCartItem(productId) {
    const filtered = getCart().filter((c) => c.product_id !== productId);
    saveCart(filtered);
    renderCartItems();
}
function handleProceedToPayment(e) {
    e.preventDefault();
    const cart = getCart();
    if (cart.length === 0) {
        showToast("กรุณาเลือกสินค้าใส่ตะกร้าก่อนดำเนินการชำระเงิน", true);
        return;
    }
    const nameInput = document.getElementById("cust-name");
    const phoneInput = document.getElementById("cust-phone");
    const addressInput = document.getElementById("cust-address");
    const paymentSelect = document.getElementById("cust-payment");
    const noteInput = document.getElementById("cust-note");
    const user = getCurrentUser();
    const pendingInfo = {
        customer_name: nameInput.value.trim(),
        phone: phoneInput.value.trim(),
        shipping_address: addressInput.value.trim(),
        payment_method: paymentSelect ? paymentSelect.value : "QR PromptPay",
        note: noteInput.value.trim(),
        username: user ? user.username : "guest"
    };
    sessionStorage.setItem(PENDING_CHECKOUT_KEY, JSON.stringify(pendingInfo));
    window.location.href = "/pages/payment.html";
}
async function renderOrderHistory() {
    const historyEl = document.getElementById("order-history-list");
    if (!historyEl)
        return;
    const user = getCurrentUser();
    let orders;
    try {
        orders = await fetchOrdersApi(user ? user.username : undefined);
    }
    catch (err) {
        const message = err instanceof Error ? err.message : "ไม่สามารถดึงประวัติคำสั่งซื้อได้";
        historyEl.innerHTML = `<p style="color:#dc2626; font-size:0.88rem;">${message}</p>`;
        showToast(message, true);
        return;
    }
    if (orders.length === 0) {
        historyEl.innerHTML = `<p style="color:#71717a; font-size:0.88rem;">ยังไม่มีประวัติรายการคำสั่งซื้อ</p>`;
        return;
    }
    historyEl.innerHTML = orders
        .map((o) => `
            <div style="border:1px solid #e4e4e7; border-radius:8px; padding:1rem; margin-bottom:0.75rem; background:#fafafa;">
                <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:0.5rem; border-bottom:1px solid #e4e4e7; padding-bottom:0.5rem; margin-bottom:0.6rem;">
                    <div>
                        <strong style="color:#09090b; font-size:0.88rem;">คำสั่งซื้อ #${o.order_id.slice(-8).toUpperCase()}</strong>
                        <span style="font-size:0.78rem; color:#71717a; margin-left:0.5rem;">${o.created_at}</span>
                    </div>
                    <span style="background:#fff7ed; color:#f97316; border:1px solid #fed7aa; font-weight:600; font-size:0.74rem; padding:0.15rem 0.55rem; border-radius:4px;">
                        ${o.status}
                    </span>
                </div>
                <div style="font-size:0.82rem; color:#3f3f46; margin-bottom:0.4rem;">
                    ผู้รับ: <strong>${o.customer_name}</strong> (${o.phone}) • ที่อยู่: ${o.shipping_address} • ชำระผ่าน: <strong>${o.payment_method}</strong>
                </div>
                <div style="font-size:0.82rem; color:#52525b;">
                    รายการสินค้า: ${o.items.map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                </div>
                <div style="text-align:right; font-weight:700; color:#f97316; font-size:0.98rem; margin-top:0.35rem;">
                    ยอดสุทธิ: ฿${formatCurrency(o.total_price)}
                </div>
            </div>
        `)
        .join("");
}
document.addEventListener("DOMContentLoaded", initCartPage);
