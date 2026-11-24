import { fetchProducts } from "../api/api.js";
import { Product } from "../types/models.js";
import { addToCart, formatCurrency, renderNavbarState, showToast } from "../app.js";

let currentCategory = "ทั้งหมด";
let currentSearch = "";
let currentSort = "";
let currentMinPrice: number | undefined = undefined;
let currentMaxPrice: number | undefined = undefined;
let currentInStockOnly = false;
let loadedProducts: Product[] = [];
let allProductsCache: Product[] = [];
let currentPage = 1;
const PAGE_SIZE = 30;
let activeSlideIndex = 0;
let slideIntervalTimer: number | undefined = undefined;

const RECENT_SEARCH_KEY = "all_mall_recent_searches";

interface CategoryVisual {
    name: string;
    img: string;
}

const VISUAL_CATEGORIES: CategoryVisual[] = [
    {
        name: "คอมพิวเตอร์ & แล็ปท็อป",
        img: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=300&q=80"
    },
    {
        name: "มือถือ & แท็บเล็ต",
        img: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=300&q=80"
    },
    {
        name: "อุปกรณ์อิเล็กทรอนิกส์",
        img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80"
    },
    {
        name: "เกมและอุปกรณ์เสริม",
        img: "https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=300&q=80"
    },
    {
        name: "กล้องและอุปกรณ์ถ่ายภาพ",
        img: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=80"
    },
    {
        name: "เสื้อผ้าแฟชั่น",
        img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=300&q=80"
    },
    {
        name: "กระเป๋า & รองเท้า",
        img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80"
    },
    {
        name: "นาฬิกา & แว่นตา",
        img: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80"
    },
    {
        name: "เครื่องใช้ในบ้าน",
        img: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=300&q=80"
    },
    {
        name: "กีฬา & กิจกรรมกลางแจ้ง",
        img: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=300&q=80"
    }
];

async function initStorefront(): Promise<void> {
    renderNavbarState();
    initPromotionSlider();
    renderVisualCategoryMatrix();
    bindTopStripModals();
    bindSearchAndKeywords();
    bindQuickServiceMenu();
    bindHeroAndVoucherActions();
    bindSortAndPriceToolbar();

    await loadAndRenderProducts();
    if (allProductsCache.length === 0) {
        allProductsCache = [...loadedProducts];
    }
}

function initPromotionSlider(): void {
    const slides = document.querySelectorAll<HTMLElement>(".promo-slide");
    const dots = document.querySelectorAll<HTMLButtonElement>(".slider-dot");
    const prevBtn = document.getElementById("slider-prev");
    const nextBtn = document.getElementById("slider-next");
    const container = document.getElementById("promo-slider-container");

    if (slides.length === 0) return;

    const showSlide = (index: number) => {
        activeSlideIndex = (index + slides.length) % slides.length;
        slides.forEach((s, idx) => {
            s.classList.toggle("active", idx === activeSlideIndex);
        });
        dots.forEach((d, idx) => {
            d.classList.toggle("active", idx === activeSlideIndex);
        });
    };

    const startAutoSlide = () => {
        if (slideIntervalTimer) window.clearInterval(slideIntervalTimer);
        slideIntervalTimer = window.setInterval(() => {
            showSlide(activeSlideIndex + 1);
        }, 4500);
    };

    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            showSlide(activeSlideIndex - 1);
            startAutoSlide();
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            showSlide(activeSlideIndex + 1);
            startAutoSlide();
        });
    }

    dots.forEach((dot) => {
        dot.addEventListener("click", () => {
            const idx = parseInt(dot.dataset.slideIdx || "0", 10);
            showSlide(idx);
            startAutoSlide();
        });
    });

    if (container) {
        container.addEventListener("mouseenter", () => {
            if (slideIntervalTimer) window.clearInterval(slideIntervalTimer);
        });
        container.addEventListener("mouseleave", startAutoSlide);
    }

    startAutoSlide();
}

function getRecentSearches(): string[] {
    try {
        const raw = localStorage.getItem(RECENT_SEARCH_KEY);
        return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
        return [];
    }
}

function saveRecentSearch(keyword: string): void {
    const clean = keyword.trim();
    if (!clean) return;
    const list = getRecentSearches().filter((item) => item.toLowerCase() !== clean.toLowerCase());
    list.unshift(clean);
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(list.slice(0, 6)));
}

function clearRecentSearches(): void {
    localStorage.removeItem(RECENT_SEARCH_KEY);
}

function scrollToProducts(): void {
    const target = document.getElementById("marketplace-toolbar");
    if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function bindTopStripModals(): void {
    const modal = document.getElementById("info-modal");
    const modalTitle = document.getElementById("info-modal-title");
    const modalBody = document.getElementById("info-modal-body");
    const closeBtn = document.getElementById("info-modal-close");

    if (closeBtn && modal) {
        closeBtn.addEventListener("click", () => modal.classList.remove("open"));
        modal.addEventListener("click", (e) => {
            if (e.target === modal) modal.classList.remove("open");
        });
    }

    document.querySelectorAll<HTMLElement>("[data-modal-type]").forEach((btn) => {
        btn.addEventListener("click", () => {
            if (!modal || !modalTitle || !modalBody) return;
            const type = btn.dataset.modalType;
            if (type === "notifications") {
                modalTitle.textContent = "การแจ้งเตือนระบบ";
                modalBody.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:0.75rem; font-size:0.86rem; color:#3f3f46;">
                        <div style="padding:0.75rem; background:#fff7ed; border-left:3px solid #f97316; border-radius:4px;">
                            <strong>แคมเปญลดราคาประจำเดือน</strong><br/>
                            รับส่วนลดพิเศษสำหรับสินค้าหมวดอุปกรณ์อิเล็กทรอนิกส์และคอมพิวเตอร์สูงสุด 25%
                        </div>
                        <div style="padding:0.75rem; background:#f4f4f5; border-radius:4px;">
                            <strong>สถานะระบบจัดส่ง</strong><br/>
                            คลังสินค้าพร้อมจัดส่งด่วนทั่วประเทศภายใน 1-3 วันทำการสำหรับทุกคำสั่งซื้อ
                        </div>
                    </div>
                `;
            } else if (type === "help") {
                modalTitle.textContent = "ศูนย์ช่วยเหลือลูกค้า (Help Center)";
                modalBody.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:0.65rem; font-size:0.86rem; color:#3f3f46;">
                        <p><strong>1. วิธีการสั่งซื้อสินค้า:</strong> เลือกสินค้าลงตะกร้า ระบุข้อมูลจัดส่งที่หน้าตะกร้าสินค้า และกดยืนยันคำสั่งซื้อ</p>
                        <p><strong>2. การรับประกันสินค้า:</strong> สินค้าทุกชิ้นเป็นของแท้ 100% รับประกันเปลี่ยนคืนภายใน 15 วัน</p>
                        <p><strong>3. สำหรับผู้ดูแลระบบ (Admin):</strong> เข้าสู่ระบบผ่านเมนู Seller Centre เพื่อเพิ่ม แก้ไข ปรับราคา/สต็อก หรือลบสินค้า</p>
                    </div>
                `;
            }
            modal.classList.add("open");
        });
    });
}

function bindSearchAndKeywords(): void {
    const searchArea = document.getElementById("header-search-area");
    const searchInput = document.getElementById("search-input") as HTMLInputElement | null;
    const searchBtn = document.getElementById("search-btn");
    const clearBtn = document.getElementById("search-clear-btn") as HTMLButtonElement | null;
    const dropdown = document.getElementById("search-dropdown");

    const toggleClearBtn = () => {
        if (!clearBtn || !searchInput) return;
        clearBtn.style.display = searchInput.value.trim().length > 0 ? "inline-flex" : "none";
    };

    if (searchInput && dropdown) {
        // เมื่อคลิกที่ช่องค้นหา ให้แสดงประวัติการค้นหาล่าสุดหรือผลลัพธ์แนะนำใน Dropdown
        searchInput.addEventListener("focus", () => {
            renderSearchDropdown(searchInput.value.trim());
        });

        // แสดงเฉพาะรายการแนะนำใน Dropdown โดยยังไม่กรองการ์ดด้านล่างจนกว่าจะกดค้นหาหรือ Enter
        searchInput.addEventListener("input", () => {
            toggleClearBtn();
            renderSearchDropdown(searchInput.value.trim());
        });

        searchInput.addEventListener("keydown", (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                e.preventDefault();
                const kw = searchInput.value.trim();
                currentSearch = kw;
                if (kw) saveRecentSearch(kw);
                dropdown.classList.remove("open");
                loadAndRenderProducts();
                scrollToProducts();
            } else if (e.key === "Escape") {
                dropdown.classList.remove("open");
            }
        });
    }

    if (clearBtn && searchInput && dropdown) {
        clearBtn.addEventListener("click", () => {
            searchInput.value = "";
            currentSearch = "";
            toggleClearBtn();
            dropdown.classList.remove("open");
            loadAndRenderProducts();
            searchInput.focus();
        });
    }

    if (searchBtn && searchInput && dropdown) {
        searchBtn.addEventListener("click", () => {
            const kw = searchInput.value.trim();
            currentSearch = kw;
            if (kw) saveRecentSearch(kw);
            dropdown.classList.remove("open");
            loadAndRenderProducts();
            scrollToProducts();
        });
    }

    // ปิด Dropdown เมื่อคลิกข้างนอก
    document.addEventListener("click", (e) => {
        if (searchArea && dropdown && !searchArea.contains(e.target as Node)) {
            dropdown.classList.remove("open");
        }
    });

    document.querySelectorAll<HTMLButtonElement>(".hot-kw-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const kw = btn.dataset.kw || "";
            if (searchInput) searchInput.value = kw;
            toggleClearBtn();
            currentSearch = kw;
            saveRecentSearch(kw);
            currentCategory = "ทั้งหมด";
            if (dropdown) dropdown.classList.remove("open");
            updateVisualCategoryActive();
            loadAndRenderProducts();
            scrollToProducts();
        });
    });
}

function renderSearchDropdown(keyword: string): void {
    const dropdown = document.getElementById("search-dropdown");
    const searchInput = document.getElementById("search-input") as HTMLInputElement | null;
    if (!dropdown) return;

    // กรณีช่องค้นหายังว่าง: แสดงประวัติการค้นหาล่าสุด + หมวดหมู่แนะนำ
    if (!keyword) {
        const recents = getRecentSearches();
        if (recents.length === 0) {
            dropdown.innerHTML = `
                <div class="search-dropdown-header">
                    <span>คำค้นหาแนะนำ</span>
                </div>
                ${["คีย์บอร์ดไร้สาย", "หูฟังตัดเสียงรบกวน", "พาวเวอร์แบงค์", "เก้าอี้ทำงาน", "รองเท้าผ้าใบ"]
                    .map(
                        (kw) => `
                    <div class="recent-search-row" data-pick-kw="${kw}">
                        <span>${kw}</span>
                        <span style="font-size:0.74rem; color:#a1a1aa;">ค้นหาด่วน</span>
                    </div>
                `
                    )
                    .join("")}
            `;
        } else {
            dropdown.innerHTML = `
                <div class="search-dropdown-header">
                    <span>ประวัติการค้นหาล่าสุด</span>
                    <button type="button" id="btn-clear-recent" style="background:none; border:none; color:#f97316; font-size:0.74rem; font-weight:600; cursor:pointer;">ล้างประวัติ</button>
                </div>
                ${recents
                    .map(
                        (kw) => `
                    <div class="recent-search-row" data-pick-kw="${kw}">
                        <span>${kw}</span>
                        <span style="font-size:0.72rem; color:#a1a1aa;">ค้นหาอีกครั้ง</span>
                    </div>
                `
                    )
                    .join("")}
            `;
        }
        dropdown.classList.add("open");

        const clearRecentBtn = document.getElementById("btn-clear-recent");
        if (clearRecentBtn) {
            clearRecentBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                clearRecentSearches();
                renderSearchDropdown("");
            });
        }

        dropdown.querySelectorAll<HTMLElement>("[data-pick-kw]").forEach((row) => {
            row.addEventListener("click", () => {
                const picked = row.dataset.pickKw || "";
                if (searchInput) searchInput.value = picked;
                const clearBtn = document.getElementById("search-clear-btn");
                if (clearBtn) clearBtn.style.display = "inline-flex";
                currentSearch = picked;
                saveRecentSearch(picked);
                dropdown.classList.remove("open");
                loadAndRenderProducts();
                scrollToProducts();
            });
        });
        return;
    }

    // กรณีพิมพ์คำค้นหา: ค้นหาจาก Cache ทันทีพร้อมแสดงรูป ราคา และปุ่มลัดหากไม่พบ
    const kwLower = keyword.toLowerCase();
    const matches = allProductsCache.filter(
        (p) =>
            p.name.toLowerCase().includes(kwLower) ||
            p.category.toLowerCase().includes(kwLower) ||
            p.description.toLowerCase().includes(kwLower)
    );

    const matchedCategories = VISUAL_CATEGORIES.filter((c) =>
        c.name.toLowerCase().includes(kwLower)
    );

    if (matches.length === 0 && matchedCategories.length === 0) {
        dropdown.innerHTML = `
            <div style="padding:1.25rem; text-align:center;">
                <div style="font-size:0.88rem; font-weight:600; color:#09090b; margin-bottom:0.25rem;">
                    ไม่พบสินค้าที่ตรงกับ "${keyword}"
                </div>
                <div style="font-size:0.78rem; color:#71717a; margin-bottom:0.75rem;">
                    ลองเลือกคำค้นหายอดนิยมด้านล่างแทน:
                </div>
                <div style="display:flex; gap:0.4rem; justify-content:center; flex-wrap:wrap;">
                    ${["คีย์บอร์ด", "หูฟัง", "พาวเวอร์แบงค์", "รองเท้า", "นาฬิกา", "เก้าอี้"]
                        .map(
                            (sug) => `
                        <button type="button" class="btn btn-outline-orange btn-sm" data-suggest-kw="${sug}">${sug}</button>
                    `
                        )
                        .join("")}
                </div>
            </div>
        `;
        dropdown.classList.add("open");

        dropdown.querySelectorAll<HTMLButtonElement>("[data-suggest-kw]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const sug = btn.dataset.suggestKw || "";
                if (searchInput) searchInput.value = sug;
                currentSearch = sug;
                saveRecentSearch(sug);
                dropdown.classList.remove("open");
                loadAndRenderProducts();
                scrollToProducts();
            });
        });
        return;
    }

    const catHtml = matchedCategories
        .map(
            (c) => `
            <div class="recent-search-row" data-pick-cat="${c.name}">
                <span>ค้นหาในหมวดหมู่: <strong>${c.name}</strong></span>
                <span style="font-size:0.74rem; color:#f97316; font-weight:600;">เลือกหมวดหมู่</span>
            </div>
        `
        )
        .join("");

    const prodHtml = matches
        .slice(0, 6)
        .map(
            (item) => `
            <div class="search-suggest-item" data-suggest-id="${item.product_id}">
                <div class="search-suggest-left">
                    <img src="${item.image_url}" alt="${item.name}" />
                    <div style="min-width:0;">
                        <div class="search-suggest-title">${item.name}</div>
                        <div class="search-suggest-cat">หมวดหมู่: ${item.category} • คงเหลือ ${item.stock} ชิ้น</div>
                    </div>
                </div>
                <div class="search-suggest-price">฿${formatCurrency(item.price)}</div>
            </div>
        `
        )
        .join("");

    dropdown.innerHTML = `
        <div class="search-dropdown-header">
            <span>ผลลัพธ์ที่ตรงกับ "${keyword}" (${matches.length} รายการ)</span>
            <span>กด Enter เพื่อดูทั้งหมด</span>
        </div>
        ${catHtml}
        ${prodHtml}
    `;
    dropdown.classList.add("open");

    dropdown.querySelectorAll<HTMLElement>("[data-pick-cat]").forEach((el) => {
        el.addEventListener("click", () => {
            const cat = el.dataset.pickCat || "ทั้งหมด";
            currentCategory = cat;
            currentSearch = "";
            if (searchInput) searchInput.value = "";
            dropdown.classList.remove("open");
            updateVisualCategoryActive();
            loadAndRenderProducts();
            scrollToProducts();
        });
    });

    dropdown.querySelectorAll<HTMLElement>("[data-suggest-id]").forEach((el) => {
        el.addEventListener("click", () => {
            const id = el.dataset.suggestId;
            saveRecentSearch(keyword);
            if (id) {
                window.location.href = `/pages/product-detail.html?id=${encodeURIComponent(id)}`;
            }
        });
    });
}

function bindQuickServiceMenu(): void {
    const buttons = document.querySelectorAll<HTMLButtonElement>(".quick-menu-item");
    buttons.forEach((btn) => {
        btn.addEventListener("click", () => {
            buttons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            const action = btn.dataset.quickAction;
            const searchInput = document.getElementById("search-input") as HTMLInputElement | null;
            if (searchInput) searchInput.value = "";
            const clearBtn = document.getElementById("search-clear-btn");
            if (clearBtn) clearBtn.style.display = "none";

            currentSearch = "";
            currentMinPrice = undefined;
            currentMaxPrice = undefined;
            currentInStockOnly = false;

            if (action === "all") {
                currentCategory = "ทั้งหมด";
                currentSort = "";
                showToast("แสดงสินค้าทั้งหมดในระบบ");
            } else if (action === "bestseller") {
                currentCategory = "ทั้งหมด";
                currentSort = "popular";
                showToast("กรองสินค้าขายดีประจำสัปดาห์");
            } else if (action === "flashdeal") {
                currentCategory = "ทั้งหมด";
                currentMaxPrice = 600;
                currentSort = "price_asc";
                showToast("กรองสินค้าราคาพิเศษไม่เกิน 600 บาท");
            } else if (action === "it_mall") {
                currentCategory = "คอมพิวเตอร์ & แล็ปท็อป";
                currentSort = "";
                showToast("แสดงหมวดหมู่ คอมพิวเตอร์ & แล็ปท็อป");
            } else if (action === "fashion") {
                currentCategory = "เสื้อผ้าแฟชั่น";
                currentSort = "";
                showToast("แสดงหมวดหมู่ เสื้อผ้าแฟชั่น");
            } else if (action === "home") {
                currentCategory = "เครื่องใช้ในบ้าน";
                currentSort = "";
                showToast("แสดงหมวดหมู่ เครื่องใช้ในบ้าน");
            } else if (action === "sports") {
                currentCategory = "กีฬา & กิจกรรมกลางแจ้ง";
                currentSort = "";
                showToast("แสดงหมวดหมู่ กีฬา & กิจกรรมกลางแจ้ง");
            } else if (action === "ready") {
                currentCategory = "ทั้งหมด";
                currentInStockOnly = true;
                currentSort = "rating";
                showToast("แสดงเฉพาะสินค้าพร้อมจัดส่งคะแนนรีวิวสูงสุด");
            }

            syncSortButtonsUI();
            updateVisualCategoryActive();
            loadAndRenderProducts();
            scrollToProducts();
        });
    });
}

function bindHeroAndVoucherActions(): void {
    document.querySelectorAll<HTMLElement>("[data-promo-cat]").forEach((el) => {
        el.addEventListener("click", () => {
            const cat = el.dataset.promoCat || "ทั้งหมด";
            currentCategory = cat;
            updateVisualCategoryActive();
            loadAndRenderProducts();
            scrollToProducts();
        });
    });

    const claimBtn = document.getElementById("btn-claim-voucher");
    if (claimBtn) {
        claimBtn.addEventListener("click", () => {
            localStorage.setItem("all_mall_voucher", "ALLMALL100");
            claimBtn.textContent = "เก็บโค้ดส่วนลดแล้ว (ALLMALL100)";
            (claimBtn as HTMLButtonElement).disabled = true;
            showToast("บันทึกโค้ดส่วนลด ALLMALL100 เรียบร้อยแล้ว");
        });
    }
}

function renderVisualCategoryMatrix(): void {
    const grid = document.getElementById("visual-category-grid");
    if (!grid) return;

    grid.innerHTML = VISUAL_CATEGORIES.map(
        (c) => `
        <button type="button" class="matrix-cell ${c.name === currentCategory ? "active" : ""}" data-matrix-cat="${c.name}">
            <div class="matrix-thumb">
                <img src="${c.img}" alt="${c.name}" loading="lazy" />
            </div>
            <span class="matrix-title">${c.name}</span>
        </button>
    `
    ).join("");

    grid.querySelectorAll<HTMLButtonElement>(".matrix-cell").forEach((cell) => {
        cell.addEventListener("click", () => {
            const selected = cell.dataset.matrixCat || "ทั้งหมด";
            if (currentCategory === selected) {
                currentCategory = "ทั้งหมด";
            } else {
                currentCategory = selected;
            }
            updateVisualCategoryActive();
            loadAndRenderProducts();
            scrollToProducts();
        });
    });

    const showAllCatBtn = document.getElementById("btn-show-all-categories");
    if (showAllCatBtn) {
        showAllCatBtn.addEventListener("click", () => {
            currentCategory = "ทั้งหมด";
            updateVisualCategoryActive();
            loadAndRenderProducts();
        });
    }
}

function updateVisualCategoryActive(): void {
    const grid = document.getElementById("visual-category-grid");
    if (!grid) return;
    grid.querySelectorAll<HTMLButtonElement>(".matrix-cell").forEach((cell) => {
        if (cell.dataset.matrixCat === currentCategory) {
            cell.classList.add("active");
        } else {
            cell.classList.remove("active");
        }
    });

    const activeCatLabel = document.getElementById("active-category-label");
    if (activeCatLabel) {
        activeCatLabel.textContent = currentCategory;
    }
}

function bindSortAndPriceToolbar(): void {
    document.querySelectorAll<HTMLButtonElement>("[data-sort-val]").forEach((btn) => {
        btn.addEventListener("click", () => {
            currentSort = btn.dataset.sortVal || "";
            syncSortButtonsUI();
            loadAndRenderProducts();
        });
    });

    const sortPriceSelect = document.getElementById("sort-price-select") as HTMLSelectElement | null;
    if (sortPriceSelect) {
        sortPriceSelect.addEventListener("change", () => {
            currentSort = sortPriceSelect.value;
            syncSortButtonsUI();
            loadAndRenderProducts();
        });
    }

    const applyPriceBtn = document.getElementById("btn-apply-price");
    const resetAllBtn = document.getElementById("reset-filter-btn");
    const minInput = document.getElementById("min-price-input") as HTMLInputElement | null;
    const maxInput = document.getElementById("max-price-input") as HTMLInputElement | null;
    const searchInput = document.getElementById("search-input") as HTMLInputElement | null;

    if (applyPriceBtn && minInput && maxInput) {
        applyPriceBtn.addEventListener("click", () => {
            const minVal = parseFloat(minInput.value);
            const maxVal = parseFloat(maxInput.value);
            currentMinPrice = !isNaN(minVal) ? minVal : undefined;
            currentMaxPrice = !isNaN(maxVal) ? maxVal : undefined;
            loadAndRenderProducts();
        });
    }

    if (resetAllBtn) {
        resetAllBtn.addEventListener("click", () => {
            currentCategory = "ทั้งหมด";
            currentSearch = "";
            currentSort = "";
            currentMinPrice = undefined;
            currentMaxPrice = undefined;
            currentInStockOnly = false;

            if (searchInput) searchInput.value = "";
            const clearBtn = document.getElementById("search-clear-btn");
            if (clearBtn) clearBtn.style.display = "none";
            if (minInput) minInput.value = "";
            if (maxInput) maxInput.value = "";
            if (sortPriceSelect) sortPriceSelect.value = "";

            document.querySelectorAll(".quick-menu-item").forEach((b) => b.classList.remove("active"));
            syncSortButtonsUI();
            updateVisualCategoryActive();
            loadAndRenderProducts();
        });
    }
}

function syncSortButtonsUI(): void {
    document.querySelectorAll<HTMLButtonElement>("[data-sort-val]").forEach((btn) => {
        if (btn.dataset.sortVal === currentSort) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
    const sortPriceSelect = document.getElementById("sort-price-select") as HTMLSelectElement | null;
    if (sortPriceSelect && currentSort !== "price_asc" && currentSort !== "price_desc") {
        sortPriceSelect.value = "";
    }
}

async function loadAndRenderProducts(): Promise<void> {
    const gridEl = document.getElementById("product-grid");
    const countEl = document.getElementById("product-count");
    if (!gridEl) return;

    try {
        loadedProducts = await fetchProducts(
            currentSearch,
            currentCategory,
            currentSort,
            currentMinPrice,
            currentMaxPrice,
            currentInStockOnly
        );

        if (!currentSearch && currentCategory === "ทั้งหมด" && !currentMinPrice && !currentMaxPrice) {
            allProductsCache = [...loadedProducts];
        }

        if (countEl) {
            countEl.textContent = String(loadedProducts.length);
        }

        const pageBar = document.getElementById("pagination-bar");

        if (loadedProducts.length === 0) {
            if (pageBar) pageBar.innerHTML = "";
            gridEl.innerHTML = `
                <div style="grid-column: 1 / -1; background: #ffffff; color: #09090b; border-top: 4px solid #f97316; padding: 2.5rem 2rem; border-radius: 10px; text-align: center; box-shadow: 0 4px 16px rgba(0,0,0,0.35);">
                    <h3 style="color: #09090b; font-size: 1.15rem; margin-bottom: 0.35rem;">
                        ไม่พบรายการสินค้าที่ตรงกับ "${currentSearch || currentCategory}"
                    </h3>
                    <p style="color: #71717a; font-size: 0.88rem; margin-bottom: 1.25rem;">
                        ตรวจสอบตัวสะกดอีกครั้ง หรือเลือกดูจากคำค้นหายอดนิยมและสินค้าแนะนำด้านล่าง
                    </p>
                    <div style="display:flex; gap:0.5rem; justify-content:center; flex-wrap:wrap;">
                        <button type="button" id="btn-empty-reset" class="btn btn-orange">แสดงสินค้าทั้งหมด (${allProductsCache.length || 332} รายการ)</button>
                        <button type="button" class="btn btn-outline-orange" data-empty-kw="คีย์บอร์ด">คีย์บอร์ด</button>
                        <button type="button" class="btn btn-outline-orange" data-empty-kw="หูฟัง">หูฟังไร้สาย</button>
                        <button type="button" class="btn btn-outline-orange" data-empty-kw="เก้าอี้">เก้าอี้ทำงาน</button>
                        <button type="button" class="btn btn-outline-orange" data-empty-kw="กระเป๋า">กระเป๋า</button>
                    </div>
                </div>
            `;

            const emptyReset = document.getElementById("btn-empty-reset");
            if (emptyReset) {
                emptyReset.addEventListener("click", () => {
                    const resetBtn = document.getElementById("reset-filter-btn");
                    if (resetBtn) resetBtn.click();
                });
            }

            gridEl.querySelectorAll<HTMLButtonElement>("[data-empty-kw]").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const kw = btn.dataset.emptyKw || "";
                    const searchInput = document.getElementById("search-input") as HTMLInputElement | null;
                    if (searchInput) searchInput.value = kw;
                    const clearBtn = document.getElementById("search-clear-btn");
                    if (clearBtn) clearBtn.style.display = "inline-flex";
                    currentSearch = kw;
                    currentCategory = "ทั้งหมด";
                    currentPage = 1;
                    updateVisualCategoryActive();
                    loadAndRenderProducts();
                });
            });
            return;
        }

        const totalPages = Math.max(1, Math.ceil(loadedProducts.length / PAGE_SIZE));
        if (currentPage > totalPages) currentPage = 1;
        const startIdx = (currentPage - 1) * PAGE_SIZE;
        const pageItems = loadedProducts.slice(startIdx, startIdx + PAGE_SIZE);

        gridEl.innerHTML = pageItems
            .map((item) => {
                const outOfStock = item.stock <= 0;
                const rating = item.rating ?? 4.8;
                const sold = item.sold ?? 0;

                return `
                <article class="product-card">
                    <div class="card-img-wrap" data-detail-id="${item.product_id}">
                        <img src="${item.image_url}" alt="${item.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'" />
                        <span class="card-category-tag">${item.category}</span>
                        <span class="card-mall-badge">MALL</span>
                    </div>
                    <div class="card-body">
                        <h3 class="card-title" data-detail-id="${item.product_id}" title="${item.name}">
                            ${item.name}
                        </h3>
                        <div class="card-meta-row">
                            <span class="card-rating">คะแนน ${rating.toFixed(1)}/5.0</span>
                            <span>ขายแล้ว ${formatCurrency(sold)} ชิ้น</span>
                        </div>
                        <div class="card-price-row">
                            <div class="card-price"><small>฿</small>${formatCurrency(item.price)}</div>
                            <span class="card-stock ${outOfStock ? "out" : ""}">
                                ${outOfStock ? "สินค้าหมด" : `คงเหลือ ${item.stock} ชิ้น`}
                            </span>
                        </div>
                        <div class="card-actions">
                            <a href="/pages/product-detail.html?id=${encodeURIComponent(item.product_id)}" class="btn-card-detail">
                                รายละเอียด
                            </a>
                            <button
                                type="button"
                                class="btn-card-cart"
                                data-cart-id="${item.product_id}"
                                ${outOfStock ? "disabled" : ""}
                            >
                                ${outOfStock ? "สินค้าหมด" : "เพิ่มลงตะกร้า"}
                            </button>
                        </div>
                    </div>
                </article>
            `;
            })
            .join("");

        if (pageBar) {
            if (totalPages <= 1) {
                pageBar.innerHTML = "";
            } else {
                let btnsHtml = `
                    <button type="button" class="page-btn" data-page="${Math.max(1, currentPage - 1)}" ${currentPage === 1 ? "disabled" : ""}>‹ ก่อนหน้า</button>
                `;
                for (let p = 1; p <= totalPages; p++) {
                    btnsHtml += `<button type="button" class="page-btn ${p === currentPage ? "active" : ""}" data-page="${p}">${p}</button>`;
                }
                btnsHtml += `
                    <button type="button" class="page-btn" data-page="${Math.min(totalPages, currentPage + 1)}" ${currentPage === totalPages ? "disabled" : ""}>ถัดไป ›</button>
                `;
                pageBar.innerHTML = btnsHtml;

                pageBar.querySelectorAll<HTMLButtonElement>("[data-page]").forEach((b) => {
                    b.addEventListener("click", () => {
                        const targetPage = parseInt(b.dataset.page || "1", 10);
                        if (targetPage !== currentPage) {
                            currentPage = targetPage;
                            loadAndRenderProducts();
                            scrollToProducts();
                        }
                    });
                });
            }
        }

        gridEl.querySelectorAll<HTMLElement>("[data-detail-id]").forEach((el) => {
            el.addEventListener("click", () => {
                const id = el.dataset.detailId;
                if (id) {
                    window.location.href = `/pages/product-detail.html?id=${encodeURIComponent(id)}`;
                }
            });
        });

        gridEl.querySelectorAll<HTMLButtonElement>("[data-cart-id]").forEach((btn) => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.cartId;
                const prod = loadedProducts.find((p) => p.product_id === id);
                if (prod) {
                    addToCart(prod, 1);
                }
            });
        });
    } catch (err) {
        showToast((err as Error).message, true);
    }
}

document.addEventListener("DOMContentLoaded", initStorefront);
