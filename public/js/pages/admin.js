import { createProductApi, deleteOrderApi, deleteProductApi, deleteUserApi, fetchOrdersApi, fetchProducts, fetchUsersApi, patchProductApi, updateOrderStatusApi, updateProductApi, updateUserRoleApi } from "../api/api.js";
import { formatCurrency, getCurrentUser, renderNavbarState, showToast } from "../app.js";
let adminProducts = [];
let editingProductId = null;
let adminCurrentPage = 1;
const ADMIN_PAGE_SIZE = 18;
async function initAdminPage() {
    renderNavbarState();
    const user = getCurrentUser();
    const guardBox = document.getElementById("admin-access-guard");
    const mainContent = document.getElementById("admin-main-content");
    if (!user || user.role !== "admin") {
        if (guardBox)
            guardBox.style.display = "block";
        if (mainContent)
            mainContent.style.display = "none";
        return;
    }
    if (guardBox)
        guardBox.style.display = "none";
    if (mainContent)
        mainContent.style.display = "block";
    bindAdminModuleTabs();
    const form = document.getElementById("admin-product-form");
    const cancelEditBtn = document.getElementById("btn-cancel-edit");
    const adminSearchInput = document.getElementById("admin-search-input");
    const adminCatFilter = document.getElementById("admin-cat-filter");
    if (form) {
        form.addEventListener("submit", handleProductFormSubmit);
    }
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", resetProductForm);
    }
    if (adminSearchInput) {
        adminSearchInput.addEventListener("input", () => {
            adminCurrentPage = 1;
            renderAdminProductList();
        });
    }
    if (adminCatFilter) {
        adminCatFilter.addEventListener("change", () => {
            adminCurrentPage = 1;
            renderAdminProductList();
        });
    }
    await refreshAdminData();
}
function bindAdminModuleTabs() {
    const tabBtns = document.querySelectorAll("[data-admin-tab]");
    const tabInventory = document.getElementById("admin-tab-inventory");
    const tabOrders = document.getElementById("admin-tab-orders");
    const tabUsers = document.getElementById("admin-tab-users");
    tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            tabBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            const target = btn.dataset.adminTab;
            if (tabInventory)
                tabInventory.style.display = target === "inventory" ? "block" : "none";
            if (tabOrders)
                tabOrders.style.display = target === "orders" ? "block" : "none";
            if (tabUsers)
                tabUsers.style.display = target === "users" ? "block" : "none";
        });
    });
}
async function refreshAdminData() {
    try {
        const [products, orders, users] = await Promise.all([
            fetchProducts(),
            fetchOrdersApi(),
            fetchUsersApi()
        ]);
        adminProducts = products;
        const statTotalProds = document.getElementById("stat-total-products");
        const statTotalStock = document.getElementById("stat-total-stock");
        const statTotalOrders = document.getElementById("stat-total-orders");
        const statTotalUsers = document.getElementById("stat-total-users");
        const statTotalRevenue = document.getElementById("stat-total-revenue");
        if (statTotalProds)
            statTotalProds.textContent = `${adminProducts.length} รายการ`;
        if (statTotalStock) {
            const sumStock = adminProducts.reduce((acc, p) => acc + p.stock, 0);
            statTotalStock.textContent = `${formatCurrency(sumStock)} ชิ้น`;
        }
        if (statTotalOrders)
            statTotalOrders.textContent = `${orders.length} รายการ`;
        if (statTotalUsers)
            statTotalUsers.textContent = `${users.length} บัญชี`;
        if (statTotalRevenue) {
            const sumRev = orders.reduce((acc, o) => acc + o.total_price, 0);
            statTotalRevenue.textContent = `฿${formatCurrency(sumRev)}`;
        }
        renderAdminProductList();
        renderAdminOrders(orders);
        renderAdminUsers(users);
    }
    catch (err) {
        showToast(err.message, true);
    }
}
function renderAdminProductList() {
    const listEl = document.getElementById("admin-product-list");
    const pageBar = document.getElementById("admin-pagination-bar");
    const searchInput = document.getElementById("admin-search-input");
    const catFilter = document.getElementById("admin-cat-filter");
    if (!listEl)
        return;
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const selectedCat = catFilter ? catFilter.value : "ทั้งหมด";
    const filtered = adminProducts.filter((p) => {
        const matchCat = selectedCat === "ทั้งหมด" || p.category === selectedCat;
        const matchKw = !keyword ||
            p.name.toLowerCase().includes(keyword) ||
            p.category.toLowerCase().includes(keyword);
        return matchCat && matchKw;
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZE));
    if (adminCurrentPage > totalPages)
        adminCurrentPage = 1;
    const startIdx = (adminCurrentPage - 1) * ADMIN_PAGE_SIZE;
    const pageItems = filtered.slice(startIdx, startIdx + ADMIN_PAGE_SIZE);
    listEl.innerHTML = pageItems
        .map((p) => `
            <div class="admin-prod-card">
                <img src="${p.image_url}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'" />
                <div class="admin-prod-body">
                    <div style="font-size:0.7rem; color:#f97316; font-weight:600; text-transform:uppercase;">${p.category}</div>
                    <div style="font-weight:600; font-size:0.86rem; color:#09090b; line-height:1.35;">${p.name}</div>
                    <div class="quick-edit-row">
                        <div>
                            <label>ราคา (฿)</label>
                            <input type="number" id="quick-price-${p.product_id}" value="${p.price}" min="0" step="1" />
                        </div>
                        <div>
                            <label>คงเหลือ (ชิ้น)</label>
                            <input type="number" id="quick-stock-${p.product_id}" value="${p.stock}" min="0" step="1" />
                        </div>
                    </div>
                    <button type="button" class="btn btn-outline-orange btn-sm" style="margin-top:0.35rem; width:100%;" data-quick-id="${p.product_id}">
                        อัปเดตราคาและสต็อก
                    </button>
                    <div class="admin-card-actions">
                        <button type="button" class="btn btn-dark btn-sm" data-edit-id="${p.product_id}">แก้ไข</button>
                        <button type="button" class="btn btn-danger btn-sm" data-del-id="${p.product_id}">ลบ</button>
                    </div>
                </div>
            </div>
        `)
        .join("");
    if (pageBar) {
        if (totalPages <= 1) {
            pageBar.innerHTML = "";
        }
        else {
            let btns = "";
            for (let p = 1; p <= totalPages; p++) {
                btns += `<button type="button" class="page-btn ${p === adminCurrentPage ? "active" : ""}" data-admin-page="${p}" style="background:${p === adminCurrentPage ? "#f97316" : "#f4f4f5"}; color:${p === adminCurrentPage ? "#ffffff" : "#09090b"}; border-color:#e4e4e7;">${p}</button>`;
            }
            pageBar.innerHTML = btns;
            pageBar.querySelectorAll("[data-admin-page]").forEach((btn) => {
                btn.addEventListener("click", () => {
                    adminCurrentPage = parseInt(btn.dataset.adminPage || "1", 10);
                    renderAdminProductList();
                });
            });
        }
    }
    listEl.querySelectorAll("[data-quick-id]").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.quickId;
            const priceEl = document.getElementById(`quick-price-${id}`);
            const stockEl = document.getElementById(`quick-stock-${id}`);
            const newPrice = parseFloat(priceEl.value);
            const newStock = parseInt(stockEl.value, 10);
            try {
                await patchProductApi(id, { price: newPrice, stock: newStock });
                showToast("บันทึกราคาและจำนวนสต็อกเรียบร้อยแล้ว");
                await refreshAdminData();
            }
            catch (err) {
                showToast(err.message, true);
            }
        });
    });
    listEl.querySelectorAll("[data-edit-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.editId;
            const target = adminProducts.find((item) => item.product_id === id);
            if (target) {
                populateFormForEdit(target);
            }
        });
    });
    listEl.querySelectorAll("[data-del-id]").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.dataset.delId;
            const target = adminProducts.find((item) => item.product_id === id);
            if (!target)
                return;
            if (!confirm(`ยืนยันการลบสินค้า "${target.name}" ออกจากระบบหรือไม่?`)) {
                return;
            }
            try {
                await deleteProductApi(id);
                showToast(`ลบรายการ "${target.name}" เรียบร้อยแล้ว`);
                await refreshAdminData();
            }
            catch (err) {
                showToast(err.message, true);
            }
        });
    });
}
function populateFormForEdit(product) {
    editingProductId = product.product_id;
    document.getElementById("prod-name").value = product.name;
    document.getElementById("prod-price").value = String(product.price);
    document.getElementById("prod-stock").value = String(product.stock);
    document.getElementById("prod-category").value = product.category;
    document.getElementById("prod-image").value = product.image_url;
    document.getElementById("prod-desc").value = product.description;
    const formTitle = document.getElementById("admin-form-title");
    const submitBtn = document.getElementById("btn-submit-product");
    const cancelBtn = document.getElementById("btn-cancel-edit");
    if (formTitle)
        formTitle.textContent = `แก้ไขข้อมูลสินค้า`;
    if (submitBtn)
        submitBtn.textContent = "บันทึกการเปลี่ยนแปลง";
    if (cancelBtn)
        cancelBtn.style.display = "inline-flex";
    window.scrollTo({ top: 0, behavior: "smooth" });
}
function resetProductForm() {
    editingProductId = null;
    const form = document.getElementById("admin-product-form");
    if (form)
        form.reset();
    const formTitle = document.getElementById("admin-form-title");
    const submitBtn = document.getElementById("btn-submit-product");
    const cancelBtn = document.getElementById("btn-cancel-edit");
    if (formTitle)
        formTitle.textContent = "เพิ่มรายการสินค้าใหม่";
    if (submitBtn)
        submitBtn.textContent = "บันทึกสินค้าใหม่";
    if (cancelBtn)
        cancelBtn.style.display = "none";
}
async function handleProductFormSubmit(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById("prod-name").value.trim(),
        price: parseFloat(document.getElementById("prod-price").value),
        stock: parseInt(document.getElementById("prod-stock").value, 10),
        category: document.getElementById("prod-category").value,
        image_url: document.getElementById("prod-image").value.trim(),
        description: document.getElementById("prod-desc").value.trim()
    };
    try {
        if (editingProductId) {
            await updateProductApi(editingProductId, payload);
            showToast("บันทึกการแก้ไขข้อมูลสินค้าเรียบร้อยแล้ว");
        }
        else {
            await createProductApi(payload);
            showToast("เพิ่มรายการสินค้าใหม่เรียบร้อยแล้ว");
        }
        resetProductForm();
        await refreshAdminData();
    }
    catch (err) {
        showToast(err.message, true);
    }
}
function renderAdminOrders(orders) {
    const container = document.getElementById("admin-orders-list");
    if (!container)
        return;
    if (orders.length === 0) {
        container.innerHTML = `<p style="color:#71717a; font-size:0.88rem;">ยังไม่มีรายการคำสั่งซื้อเข้ามาในระบบ</p>`;
        return;
    }
    const statusOptions = [
        "ชำระเงินแล้ว (กำลังเตรียมจัดส่ง)",
        "รอชำระเงินปลายทาง (กำลังเตรียมจัดส่ง)",
        "อยู่ระหว่างการจัดส่งพัสดุ",
        "จัดส่งสำเร็จเรียบร้อยแล้ว",
        "ยกเลิกคำสั่งซื้อ"
    ];
    container.innerHTML = orders
        .map((o) => `
            <div style="border:1px solid #e4e4e7; border-radius:8px; padding:1rem 1.2rem; margin-bottom:0.85rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; background:#fafafa;">
                <div style="flex:1; min-width:260px;">
                    <div style="font-weight:700; font-size:0.92rem; color:#09090b; margin-bottom:0.2rem;">
                        คำสั่งซื้อ #${o.order_id.slice(-8).toUpperCase()} • ผู้รับ: ${o.customer_name} (${o.phone})
                    </div>
                    <div style="font-size:0.82rem; color:#3f3f46; margin-bottom:0.2rem;">
                        รายการ: ${o.items.map((i) => `${i.name} (x${i.quantity})`).join(", ")}
                    </div>
                    <div style="font-size:0.78rem; color:#71717a;">
                        ที่อยู่จัดส่ง: ${o.shipping_address} | ช่องทางชำระเงิน: <strong>${o.payment_method}</strong> | เวลา: ${o.created_at}
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:0.65rem; flex-wrap:wrap;">
                    <div style="font-size:1.1rem; font-weight:800; color:#f97316; margin-right:0.5rem;">
                        ฿${formatCurrency(o.total_price)}
                    </div>
                    <select class="form-control" style="width:240px; font-size:0.82rem;" id="order-status-${o.order_id}">
                        ${statusOptions
        .map((st) => `
                            <option value="${st}" ${o.status === st ? "selected" : ""}>${st}</option>
                        `)
        .join("")}
                    </select>
                    <button type="button" class="btn btn-orange btn-sm" data-save-order="${o.order_id}">อัปเดตสถานะ</button>
                    <button type="button" class="btn btn-danger btn-sm" data-del-order="${o.order_id}">ลบ</button>
                </div>
            </div>
        `)
        .join("");
    container.querySelectorAll("[data-save-order]").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const oid = btn.dataset.saveOrder;
            const sel = document.getElementById(`order-status-${oid}`);
            try {
                await updateOrderStatusApi(oid, sel.value);
                showToast("อัปเดตสถานะคำสั่งซื้อเรียบร้อยแล้ว");
                await refreshAdminData();
            }
            catch (err) {
                showToast(err.message, true);
            }
        });
    });
    container.querySelectorAll("[data-del-order]").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const oid = btn.dataset.delOrder;
            if (!confirm("ยืนยันการลบคำสั่งซื้อนี้ออกจากระบบหรือไม่?"))
                return;
            try {
                await deleteOrderApi(oid);
                showToast("ลบคำสั่งซื้อเรียบร้อยแล้ว");
                await refreshAdminData();
            }
            catch (err) {
                showToast(err.message, true);
            }
        });
    });
}
function renderAdminUsers(users) {
    const tbody = document.getElementById("admin-users-tbody");
    if (!tbody)
        return;
    if (users.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#71717a;">ยังไม่มีสมาชิกในระบบ</td></tr>`;
        return;
    }
    const currentUser = getCurrentUser();
    tbody.innerHTML = users
        .map((u) => `
            <tr>
                <td style="font-weight:600; color:#09090b;">${u.username}</td>
                <td>${u.email || "-"}</td>
                <td>${u.display_name}</td>
                <td>${u.phone || "-"}</td>
                <td>
                    <span style="background:${u.role === "admin" ? "#fff7ed" : "#f4f4f5"}; color:${u.role === "admin" ? "#f97316" : "#3f3f46"}; border:1px solid ${u.role === "admin" ? "#fed7aa" : "#e4e4e7"}; padding:0.15rem 0.55rem; border-radius:4px; font-size:0.75rem; font-weight:700; text-transform:uppercase;">
                        ${u.role}
                    </span>
                </td>
                <td style="color:#71717a; font-size:0.8rem;">${u.created_at || "-"}</td>
                <td>
                    <div style="display:flex; gap:0.4rem;">
                        <button type="button" class="btn btn-outline-orange btn-sm" data-toggle-role="${u.user_id}" data-cur-role="${u.role}">
                            เปลี่ยนเป็น ${u.role === "admin" ? "Customer" : "Admin"}
                        </button>
                        ${currentUser?.user_id !== u.user_id
        ? `<button type="button" class="btn btn-danger btn-sm" data-del-user="${u.user_id}">ลบ</button>`
        : ""}
                    </div>
                </td>
            </tr>
        `)
        .join("");
    tbody.querySelectorAll("[data-toggle-role]").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const uid = btn.dataset.toggleRole;
            const curRole = btn.dataset.curRole;
            const nextRole = curRole === "admin" ? "customer" : "admin";
            try {
                await updateUserRoleApi(uid, nextRole);
                showToast(`อัปเดตสิทธิ์ผู้ใช้เป็น ${nextRole.toUpperCase()} เรียบร้อยแล้ว`);
                await refreshAdminData();
            }
            catch (err) {
                showToast(err.message, true);
            }
        });
    });
    tbody.querySelectorAll("[data-del-user]").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const uid = btn.dataset.delUser;
            if (!confirm("ยืนยันการลบบัญชีผู้ใช้งานนี้ออกจากระบบหรือไม่?"))
                return;
            try {
                await deleteUserApi(uid);
                showToast("ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว");
                await refreshAdminData();
            }
            catch (err) {
                showToast(err.message, true);
            }
        });
    });
}
document.addEventListener("DOMContentLoaded", initAdminPage);
