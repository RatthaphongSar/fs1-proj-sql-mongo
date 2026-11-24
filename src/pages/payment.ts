import { createOrderApi } from "../api/api.js";
import { formatCurrency, getCart, getCurrentUser, renderNavbarState, saveCart, showToast } from "../app.js";

const PENDING_CHECKOUT_KEY = "all_mall_pending_checkout";

let selectedMethod = "QR PromptPay";
let transactionRef = "";
let countdownSeconds = 900;
let countdownTimer: number | undefined = undefined;

interface PendingCheckout {
    customer_name: string;
    phone: string;
    shipping_address: string;
    payment_method: string;
    note: string;
    username: string;
}

function generateDeterministicQrSvg(seedText: string): string {
    const size = 25;
    const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

    const drawFinder = (r0: number, c0: number) => {
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
                const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
                matrix[r0 + r][c0 + c] = isBorder || isInner;
            }
        }
    };

    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);

    for (let i = 8; i < size - 8; i++) {
        matrix[6][i] = i % 2 === 0;
        matrix[i][6] = i % 2 === 0;
    }

    let hash = 2166136261;
    for (let i = 0; i < seedText.length; i++) {
        hash ^= seedText.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const inTopLeft = r < 8 && c < 8;
            const inTopRight = r < 8 && c >= size - 8;
            const inBottomLeft = r >= size - 8 && c < 8;
            if (inTopLeft || inTopRight || inBottomLeft || r === 6 || c === 6) continue;

            hash ^= (r * 31 + c * 17) & 0xff;
            hash = Math.imul(hash, 16777619);
            matrix[r][c] = (Math.abs(hash) % 10) < 5;
        }
    }

    let rects = "";
    const cell = 8;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (matrix[r][c]) {
                rects += `<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}" fill="#09090b" />`;
            }
        }
    }

    const totalPx = size * cell;
    return `
        <svg viewBox="0 0 ${totalPx} ${totalPx}" width="200" height="200" xmlns="http://www.w3.org/2000/svg" style="background:#ffffff; padding:10px; border-radius:8px; border:1px solid #e4e4e7;">
            ${rects}
            <rect x="${totalPx / 2 - 22}" y="${totalPx / 2 - 14}" width="44" height="28" rx="4" fill="#003d6b" />
            <text x="${totalPx / 2}" y="${totalPx / 2 + 4}" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="800" font-family="Poppins, sans-serif">PROMPT</text>
        </svg>
    `;
}

function initPaymentPage(): void {
    renderNavbarState();

    const cart = getCart();
    if (cart.length === 0) {
        window.location.href = "/pages/cart.html";
        return;
    }

    const rawPending = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    const user = getCurrentUser();
    const pending: PendingCheckout = rawPending
        ? JSON.parse(rawPending)
        : {
              customer_name: user ? user.display_name : "ลูกค้าทั่วไป",
              phone: user?.phone || "-",
              shipping_address: "กรุงเทพมหานคร",
              payment_method: "QR PromptPay",
              note: "",
              username: user ? user.username : "guest"
          };

    selectedMethod = pending.payment_method || "QR PromptPay";
    transactionRef = `PP${Date.now().toString().slice(-8)}`;

    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Render shipping & items summary
    const shippingEl = document.getElementById("pay-shipping-summary");
    if (shippingEl) {
        shippingEl.innerHTML = `
            <div style="font-weight:700; color:#09090b; margin-bottom:0.2rem;">จัดส่งไปที่: ${pending.customer_name} (${pending.phone})</div>
            <div>${pending.shipping_address}</div>
            ${pending.note ? `<div style="color:#71717a; margin-top:0.2rem;">หมายเหตุ: ${pending.note}</div>` : ""}
        `;
    }

    const itemsEl = document.getElementById("pay-items-summary");
    if (itemsEl) {
        itemsEl.innerHTML = cart
            .map(
                (c) => `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:0.75rem; padding:0.55rem 0; border-bottom:1px solid #f4f4f5; font-size:0.84rem;">
                <div style="display:flex; align-items:center; gap:0.6rem; min-width:0;">
                    <img src="${c.image_url}" alt="${c.name}" style="width:42px; height:42px; border-radius:6px; object-fit:cover; border:1px solid #e4e4e7;" />
                    <div style="min-width:0;">
                        <div style="font-weight:600; color:#09090b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:190px;">${c.name}</div>
                        <div style="color:#71717a; font-size:0.76rem;">จำนวน x${c.quantity}</div>
                    </div>
                </div>
                <div style="font-weight:700; color:#09090b;">฿${formatCurrency(c.price * c.quantity)}</div>
            </div>
        `
            )
            .join("");
    }

    const subEl = document.getElementById("pay-subtotal");
    const grandEl = document.getElementById("pay-grand-total");
    const qrAmountEl = document.getElementById("qr-amount-text");
    const qrRefEl = document.getElementById("qr-ref-code");
    const qrBoxEl = document.getElementById("qr-canvas-box");

    if (subEl) subEl.textContent = `฿${formatCurrency(totalAmount)}`;
    if (grandEl) grandEl.textContent = `฿${formatCurrency(totalAmount)}`;
    if (qrAmountEl) qrAmountEl.textContent = `฿${formatCurrency(totalAmount)}`;
    if (qrRefEl) qrRefEl.textContent = transactionRef;
    if (qrBoxEl) {
        qrBoxEl.innerHTML = generateDeterministicQrSvg(`00020101021229370016A000000677010111011300668000000005802TH5303764540${totalAmount.toFixed(2)}6304${transactionRef}`);
    }

    startCountdown();
    bindMethodTabs();
    switchPaymentChannel(selectedMethod);

    const confirmBtn = document.getElementById("btn-confirm-payment");
    if (confirmBtn) {
        confirmBtn.addEventListener("click", () => submitFinalPayment(pending, totalAmount));
    }
}

function startCountdown(): void {
    const el = document.getElementById("qr-countdown");
    if (!el) return;
    countdownTimer = window.setInterval(() => {
        if (countdownSeconds > 0) {
            countdownSeconds--;
            const m = String(Math.floor(countdownSeconds / 60)).padStart(2, "0");
            const s = String(countdownSeconds % 60).padStart(2, "0");
            el.textContent = `${m}:${s}`;
        }
    }, 1000);
}

function bindMethodTabs(): void {
    document.querySelectorAll<HTMLButtonElement>(".pay-method-tab").forEach((tab) => {
        tab.addEventListener("click", () => {
            const method = tab.dataset.method || "QR PromptPay";
            switchPaymentChannel(method);
        });
    });
}

function switchPaymentChannel(method: string): void {
    selectedMethod = method;
    document.querySelectorAll<HTMLButtonElement>(".pay-method-tab").forEach((tab) => {
        if (tab.dataset.method === method) {
            tab.classList.add("active");
        } else {
            tab.classList.remove("active");
        }
    });

    const vPrompt = document.getElementById("view-promptpay");
    const vCard = document.getElementById("view-card");
    const vBank = document.getElementById("view-banking");
    const vCod = document.getElementById("view-cod");

    if (vPrompt) vPrompt.style.display = method === "QR PromptPay" ? "block" : "none";
    if (vCard) vCard.style.display = method === "บัตรเครดิต / เดบิต" ? "block" : "none";
    if (vBank) vBank.style.display = method.includes("Mobile Banking") || method.includes("โมบายแบงก์กิ้ง") ? "block" : "none";
    if (vCod) vCod.style.display = method.includes("COD") || method.includes("ปลายทาง") ? "block" : "none";
}

async function submitFinalPayment(pending: PendingCheckout, totalAmount: number): Promise<void> {
    const cart = getCart();
    let finalChannelLabel = selectedMethod;

    if (selectedMethod === "บัตรเครดิต / เดบิต") {
        const cardNum = (document.getElementById("card-number") as HTMLInputElement).value.trim();
        const holder = (document.getElementById("card-holder") as HTMLInputElement).value.trim();
        if (cardNum.length < 12 || !holder) {
            showToast("กรุณากรอกหมายเลขบัตรและชื่อผู้ถือบัตรให้ครบถ้วน", true);
            return;
        }
        finalChannelLabel = `บัตรเครดิต/เดบิต (*${cardNum.slice(-4)})`;
    } else if (selectedMethod.includes("โมบายแบงก์กิ้ง")) {
        const checkedBank = document.querySelector<HTMLInputElement>('input[name="bank_choice"]:checked');
        finalChannelLabel = checkedBank ? checkedBank.value : "โมบายแบงก์กิ้ง";
    }

    const confirmBtn = document.getElementById("btn-confirm-payment") as HTMLButtonElement | null;
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "กำลังตรวจสอบธุรกรรม...";
    }

    try {
        const orderRes = await createOrderApi({
            customer_name: pending.customer_name,
            phone: pending.phone,
            shipping_address: pending.shipping_address,
            payment_method: finalChannelLabel,
            payment_reference: transactionRef,
            note: pending.note,
            username: pending.username,
            items: cart.map((c) => ({
                product_id: c.product_id,
                name: c.name,
                price: c.price,
                quantity: c.quantity,
                image_url: c.image_url
            }))
        });

        if (countdownTimer) window.clearInterval(countdownTimer);
        saveCart([]);
        sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
        showToast("ชำระเงินและยืนยันคำสั่งซื้อสำเร็จ");

        const mainView = document.getElementById("payment-main-view");
        const receiptView = document.getElementById("payment-receipt-view");
        if (mainView) mainView.style.display = "none";
        if (receiptView) {
            receiptView.style.display = "block";
            receiptView.innerHTML = `
                <div class="payment-card-panel" style="text-align:center; padding:2.25rem;">
                    <div style="width:56px; height:56px; border-radius:50%; background:#dcfce7; color:#15803d; font-size:1.6rem; font-weight:800; display:inline-flex; align-items:center; justify-content:center; margin-bottom:0.85rem;">
                        ✓
                    </div>
                    <h2 style="color:#09090b; font-size:1.4rem; margin-bottom:0.25rem;">ชำระเงินเรียบร้อยแล้ว</h2>
                    <p style="font-size:0.86rem; color:#71717a; margin-bottom:1.35rem;">
                        ระบบได้รับข้อมูลการชำระเงินและจัดส่งคำสั่งซื้อของคุณไปยังคลังสินค้าเรียบร้อยแล้ว
                    </p>

                    <div style="background:#fafafa; border:1px solid #e4e4e7; border-radius:8px; padding:1.15rem; text-align:left; font-size:0.86rem; margin-bottom:1.5rem; display:flex; flex-direction:column; gap:0.5rem;">
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:#71717a;">หมายเลขคำสั่งซื้อ:</span>
                            <strong style="color:#09090b;">#${orderRes.order_id.toUpperCase()}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:#71717a;">หมายเลขอ้างอิงการชำระเงิน:</span>
                            <strong style="color:#09090b;">${transactionRef}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:#71717a;">ช่องทางชำระเงิน:</span>
                            <strong style="color:#09090b;">${orderRes.payment_method}</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:#71717a;">ผู้รับสินค้า:</span>
                            <strong style="color:#09090b;">${orderRes.customer_name} (${orderRes.phone})</strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; border-top:1px solid #e4e4e7; padding-top:0.5rem; margin-top:0.2rem;">
                            <span style="font-weight:700; color:#09090b;">ยอดชำระสุทธิ:</span>
                            <strong style="font-size:1.15rem; color:#f97316;">฿${formatCurrency(totalAmount)}</strong>
                        </div>
                    </div>

                    <div style="display:flex; gap:0.75rem; justify-content:center;">
                        <a href="/pages/cart.html" class="btn btn-orange">ดูสถานะคำสั่งซื้อ</a>
                        <a href="/" class="btn btn-dark">กลับสู่หน้าแรก</a>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = "ยืนยันการชำระเงิน";
        }
        showToast((err as Error).message, true);
    }
}

document.addEventListener("DOMContentLoaded", initPaymentPage);
