import { addProductReviewApi, fetchProductById, fetchProducts } from "../api/api.js";
import { addToCart, formatCurrency, getCurrentUser, renderNavbarState, showToast } from "../app.js";
let currentProduct = null;
let similarProducts = [];
async function initProductDetail() {
    renderNavbarState();
    const container = document.getElementById("product-detail-container");
    if (!container)
        return;
    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");
    if (!productId) {
        container.innerHTML = `
            <div class="detail-card">
                <div>
                    <h2>ไม่พบรหัสสินค้าที่ระบุ</h2>
                    <a href="/" class="btn btn-orange" style="margin-top:1rem;">กลับไปหน้าร้านค้า</a>
                </div>
            </div>
        `;
        return;
    }
    await loadAndRenderDetail(productId);
}
async function loadAndRenderDetail(productId) {
    const container = document.getElementById("product-detail-container");
    if (!container)
        return;
    try {
        currentProduct = await fetchProductById(productId);
        const allInCat = await fetchProducts(undefined, currentProduct.category);
        similarProducts = allInCat.filter((p) => p.product_id !== currentProduct.product_id);
        // หากในหมวดเดียวกันมีน้อยกว่า 4 ชิ้น ให้ดึงสินค้าขายดีหมวดอื่นมาเสริมให้เต็มแถว
        if (similarProducts.length < 4) {
            const popularAll = await fetchProducts(undefined, undefined, "popular");
            for (const item of popularAll) {
                if (item.product_id !== currentProduct.product_id &&
                    !similarProducts.some((s) => s.product_id === item.product_id)) {
                    similarProducts.push(item);
                }
                if (similarProducts.length >= 5)
                    break;
            }
        }
        renderFullDetailView();
    }
    catch (err) {
        showToast(err.message, true);
        container.innerHTML = `
            <div class="detail-card">
                <div>
                    <h2 style="color:#dc2626;">ไม่พบข้อมูลสินค้า</h2>
                    <p style="margin:0.5rem 0 1rem;">${err.message}</p>
                    <a href="/" class="btn btn-orange">กลับไปหน้าร้านค้า</a>
                </div>
            </div>
        `;
    }
}
function renderFullDetailView() {
    const container = document.getElementById("product-detail-container");
    if (!container || !currentProduct)
        return;
    const product = currentProduct;
    const outOfStock = product.stock <= 0;
    const shopName = product.shop_name || "ALL MALL Official Store";
    const shopInitials = shopName.slice(0, 2).toUpperCase();
    const shopLocation = product.shop_location || "กรุงเทพมหานคร";
    const shopResp = product.shop_response_rate || "98%";
    const reviews = product.reviews || [];
    const user = getCurrentUser();
    const defaultReviewerName = user ? user.display_name : "คุณธนกร ป. (ผู้ซื้อที่ยืนยันแล้ว)";
    container.innerHTML = `
        <!-- 1. Main Product Purchase Card -->
        <div class="detail-card">
            <div class="detail-img-box">
                <img src="${product.image_url}" alt="${product.name}" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'" />
            </div>
            <div>
                <span class="detail-category-badge">${product.category}</span>
                <h1 class="detail-title">${product.name}</h1>
                <div style="display:flex; gap:1.25rem; color:#71717a; font-size:0.84rem; margin-bottom:0.5rem; flex-wrap:wrap;">
                    <span style="color:#d97706; font-weight:700;">คะแนนรีวิว ${(product.rating ?? 4.8).toFixed(1)} / 5.0 (${reviews.length} รีวิว)</span>
                    <span>|</span>
                    <span>ยอดจำหน่าย ${formatCurrency(product.sold ?? 0)} ชิ้น</span>
                    <span>|</span>
                    <span>SKU: ${product.product_id.slice(-8).toUpperCase()}</span>
                </div>

                <div class="detail-price-box">
                    <div class="detail-price">฿${formatCurrency(product.price)}</div>
                    <div style="font-size:0.8rem; color:#71717a; margin-top:0.2rem;">
                        ราคารวมภาษีมูลค่าเพิ่มแล้ว • จัดส่งด่วนทั่วประเทศจาก ${shopLocation}
                    </div>
                </div>

                <h4 style="color:#09090b; font-size:0.9rem; margin-top:1rem; text-transform:uppercase; letter-spacing:0.03em;">รายละเอียดและคุณสมบัติเด่น</h4>
                <p class="detail-desc">${product.description}</p>

                <div style="display:flex; align-items:center; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap;">
                    <span style="font-weight:600; font-size:0.88rem; color:#27272a;">จำนวนที่ต้องการ:</span>
                    <div class="qty-control">
                        <button type="button" id="qty-minus">-</button>
                        <input type="number" id="qty-input" value="1" min="1" max="${Math.max(1, product.stock)}" />
                        <button type="button" id="qty-plus">+</button>
                    </div>
                    <span style="font-size:0.84rem; color:${outOfStock ? "#dc2626" : "#16a34a"}; font-weight:600;">
                        ${outOfStock ? "สินค้าหมดชั่วคราว" : `มีสินค้าพร้อมส่ง ${product.stock} ชิ้น`}
                    </span>
                </div>

                <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
                    <button type="button" id="btn-add-cart" class="btn btn-outline-orange" ${outOfStock ? "disabled" : ""}>
                        เพิ่มลงตะกร้าสินค้า
                    </button>
                    <button type="button" id="btn-buy-now" class="btn btn-orange" ${outOfStock ? "disabled" : ""}>
                        สั่งซื้อสินค้าทันที
                    </button>
                    <a href="/" class="btn btn-dark">กลับสู่หน้ารวมสินค้า</a>
                </div>
            </div>
        </div>

        <!-- 2. Seller Store Profile Section (Shopee Mall Style) -->
        <section class="seller-profile-card">
            <div class="seller-left">
                <div class="seller-avatar">
                    <span>${shopInitials}</span>
                    <span class="seller-mall-tag">MALL</span>
                </div>
                <div>
                    <div style="font-size:1.02rem; font-weight:700; color:#09090b;">${shopName}</div>
                    <div style="font-size:0.78rem; color:#16a34a; font-weight:600; margin-bottom:0.45rem;">
                        ร้านค้าทางการ (Official Verified Store)
                    </div>
                    <div style="display:flex; gap:0.5rem;">
                        <a href="/" class="btn btn-outline-orange btn-sm">ดูหน้าร้านค้า</a>
                    </div>
                </div>
            </div>

            <div class="seller-metrics">
                <div class="seller-metric-item">
                    <span>คะแนนร้านค้า</span>
                    <strong>4.9 / 5.0</strong>
                </div>
                <div class="seller-metric-item">
                    <span>อัตราการตอบแชท</span>
                    <strong>${shopResp} (ภายในไม่กี่นาที)</strong>
                </div>
                <div class="seller-metric-item">
                    <span>จัดส่งจาก</span>
                    <strong>${shopLocation}</strong>
                </div>
                <div class="seller-metric-item">
                    <span>การรับประกัน</span>
                    <strong>ของแท้ 100% (คืนได้ใน 15 วัน)</strong>
                </div>
            </div>
        </section>

        <!-- 3. Detailed Specifications Section -->
        <section class="spec-section-card">
            <div class="spec-bar-title">ข้อมูลจำเพาะของสินค้า (Product Specifications)</div>
            <div class="spec-table">
                <div class="spec-label">หมวดหมู่</div>
                <div class="spec-val">${product.category}</div>
                <div class="spec-label">ผู้จัดจำหน่าย</div>
                <div class="spec-val">${shopName}</div>
                <div class="spec-label">รหัสอ้างอิงสินค้า (SKU)</div>
                <div class="spec-val">${product.product_id.toUpperCase()}</div>
                <div class="spec-label">จำนวนสินค้าคงคลัง</div>
                <div class="spec-val">${product.stock} ชิ้น</div>
                <div class="spec-label">ส่งจาก</div>
                <div class="spec-val">${shopLocation}</div>
            </div>

            <div class="spec-bar-title">รายละเอียดสินค้าเพิ่มเติม (Product Description)</div>
            <p style="font-size:0.9rem; color:#3f3f46; line-height:1.75; padding:0 0.25rem;">
                ${product.description} สินค้าทุกชิ้นผ่านการตรวจสอบมาตรฐานคุณภาพก่อนจัดส่งจากคลังสินค้า ${shopName} รองรับการชำระเงินปลายทาง (COD), สแกนจ่าย QR PromptPay และบัตรเครดิต พร้อมบริการจัดส่งด่วนทั่วประเทศ
            </p>
        </section>

        <!-- 4. Customer Reviews & Comments Section -->
        <section class="reviews-section-card">
            <div class="spec-bar-title">คะแนนและรีวิวของสินค้า (${reviews.length} ความคิดเห็น)</div>

            <div class="review-summary-box">
                <div>
                    <div class="review-score-big">${(product.rating ?? 4.8).toFixed(1)} <span style="font-size:1rem; font-weight:600; color:#52525b;">เต็ม 5 คะแนน</span></div>
                    <div style="font-size:0.82rem; color:#71717a;">จากผู้ซื้อจริงที่ได้รับการยืนยันคำสั่งซื้อแล้ว</div>
                </div>
                <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
                    <span class="review-rating-pill">5 ดาว (${reviews.filter((r) => r.rating === 5).length})</span>
                    <span class="review-rating-pill">4 ดาว (${reviews.filter((r) => r.rating === 4).length})</span>
                    <span class="review-rating-pill">คุณภาพสินค้าดีเยี่ยม</span>
                    <span class="review-rating-pill">จัดส่งรวดเร็ว</span>
                </div>
            </div>

            <div id="reviews-list">
                ${reviews
        .map((rev) => `
                    <div class="review-item-card">
                        <div class="review-author-row">
                            <span class="review-author-name">${rev.author}</span>
                            <span class="review-rating-pill">คะแนน ${rev.rating} / 5</span>
                        </div>
                        <div style="font-size:0.75rem; color:#71717a; margin-bottom:0.4rem;">
                            วันที่รีวิว: ${rev.created_at} | หมวดหมู่: ${product.category}
                        </div>
                        <p style="font-size:0.88rem; color:#27272a; line-height:1.55;">${rev.comment}</p>
                    </div>
                `)
        .join("")}
            </div>

            <!-- Add Review Form -->
            <div class="review-form-box">
                <h4 style="font-size:0.95rem; font-weight:700; color:#09090b; margin-bottom:0.75rem;">
                    เขียนรีวิวและแสดงความคิดเห็นต่อสินค้านี้
                </h4>
                <form id="review-form">
                    <div style="display:grid; grid-template-columns:2fr 1fr; gap:0.75rem;">
                        <div class="form-group">
                            <label for="rev-author">ชื่อผู้รีวิว</label>
                            <input type="text" id="rev-author" class="form-control" value="${defaultReviewerName}" required />
                        </div>
                        <div class="form-group">
                            <label for="rev-rating">ระดับคะแนน</label>
                            <select id="rev-rating" class="form-control">
                                <option value="5">5 คะแนน (ดีเยี่ยม)</option>
                                <option value="4">4 คะแนน (ดีมาก)</option>
                                <option value="3">3 คะแนน (ปานกลาง)</option>
                                <option value="2">2 คะแนน (พอใช้)</option>
                                <option value="1">1 คะแนน (ควรปรับปรุง)</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="rev-comment">ความคิดเห็นของคุณ</label>
                        <textarea id="rev-comment" class="form-control" rows="2" placeholder="แบ่งปันประสบการณ์การใช้งานสินค้าชิ้นนี้..." required></textarea>
                    </div>
                    <button type="submit" class="btn btn-orange btn-sm">ส่งความคิดเห็น</button>
                </form>
            </div>
        </section>

        <!-- 5. Similar / Related Products Section -->
        <section style="margin-bottom:3.5rem;">
            <div class="similar-section-header">
                <h3 style="font-size:1.1rem; font-weight:700; color:#ffffff;">
                    สินค้าที่คล้ายกันในหมวด "${product.category}" และสินค้าแนะนำ
                </h3>
                <a href="/" style="font-size:0.84rem; color:#f97316; font-weight:600;">ดูทั้งหมด →</a>
            </div>
            <div id="similar-products-grid" class="product-grid">
                ${similarProducts
        .slice(0, 5)
        .map((sim) => {
        const simOut = sim.stock <= 0;
        return `
                        <article class="product-card">
                            <div class="card-img-wrap" data-sim-detail="${sim.product_id}">
                                <img src="${sim.image_url}" alt="${sim.name}" loading="lazy" />
                                <span class="card-category-tag">${sim.category}</span>
                                <span class="card-mall-badge">MALL</span>
                            </div>
                            <div class="card-body">
                                <h3 class="card-title" data-sim-detail="${sim.product_id}">${sim.name}</h3>
                                <div class="card-meta-row">
                                    <span class="card-rating">คะแนน ${(sim.rating ?? 4.8).toFixed(1)}/5.0</span>
                                    <span>ขายแล้ว ${formatCurrency(sim.sold ?? 0)} ชิ้น</span>
                                </div>
                                <div class="card-price-row">
                                    <div class="card-price"><small>฿</small>${formatCurrency(sim.price)}</div>
                                    <span class="card-stock ${simOut ? "out" : ""}">
                                        ${simOut ? "สินค้าหมด" : `คงเหลือ ${sim.stock} ชิ้น`}
                                    </span>
                                </div>
                                <div class="card-actions">
                                    <a href="/pages/product-detail.html?id=${encodeURIComponent(sim.product_id)}" class="btn-card-detail">
                                        รายละเอียด
                                    </a>
                                    <button type="button" class="btn-card-cart" data-sim-cart="${sim.product_id}" ${simOut ? "disabled" : ""}>
                                        เพิ่มลงตะกร้า
                                    </button>
                                </div>
                            </div>
                        </article>
                    `;
    })
        .join("")}
            </div>
        </section>
    `;
    bindDetailInteractions();
}
function bindDetailInteractions() {
    if (!currentProduct)
        return;
    const product = currentProduct;
    const qtyInput = document.getElementById("qty-input");
    const minusBtn = document.getElementById("qty-minus");
    const plusBtn = document.getElementById("qty-plus");
    const addCartBtn = document.getElementById("btn-add-cart");
    const buyNowBtn = document.getElementById("btn-buy-now");
    const reviewForm = document.getElementById("review-form");
    if (minusBtn && qtyInput) {
        minusBtn.addEventListener("click", () => {
            const current = parseInt(qtyInput.value, 10) || 1;
            qtyInput.value = String(Math.max(1, current - 1));
        });
    }
    if (plusBtn && qtyInput) {
        plusBtn.addEventListener("click", () => {
            const current = parseInt(qtyInput.value, 10) || 1;
            qtyInput.value = String(Math.min(product.stock, current + 1));
        });
    }
    if (addCartBtn && qtyInput) {
        addCartBtn.addEventListener("click", () => {
            const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
            addToCart(product, qty);
        });
    }
    if (buyNowBtn && qtyInput) {
        buyNowBtn.addEventListener("click", () => {
            const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
            addToCart(product, qty);
            window.location.href = "/pages/cart.html";
        });
    }
    if (reviewForm) {
        reviewForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const authorEl = document.getElementById("rev-author");
            const ratingEl = document.getElementById("rev-rating");
            const commentEl = document.getElementById("rev-comment");
            try {
                currentProduct = await addProductReviewApi(product.product_id, {
                    author: authorEl.value.trim(),
                    rating: parseInt(ratingEl.value, 10) || 5,
                    comment: commentEl.value.trim()
                });
                showToast("บันทึกความคิดเห็นและคะแนนรีวิวเรียบร้อยแล้ว");
                renderFullDetailView();
            }
            catch (err) {
                showToast(err.message, true);
            }
        });
    }
    document.querySelectorAll("[data-sim-detail]").forEach((el) => {
        el.addEventListener("click", () => {
            const id = el.dataset.simDetail;
            if (id) {
                window.location.href = `/pages/product-detail.html?id=${encodeURIComponent(id)}`;
            }
        });
    });
    document.querySelectorAll("[data-sim-cart]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.simCart;
            const target = similarProducts.find((p) => p.product_id === id);
            if (target) {
                addToCart(target, 1);
            }
        });
    });
}
document.addEventListener("DOMContentLoaded", initProductDetail);
