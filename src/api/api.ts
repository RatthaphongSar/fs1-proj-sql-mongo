import {
    Product,
    ProductCreatePayload,
    ReviewCreatePayload,
    OrderCreatePayload,
    OrderResponse,
    UserSession,
    SendOtpResponse,
    RegisterWithOtpPayload
} from "../types/models.js";
import { getCurrentUser } from "../app.js";

const API_BASE = "";

function getRoleHeader(): Record<string, string> {
    const user = getCurrentUser();
    return {
        "Content-Type": "application/json",
        "X-User-Role": user ? user.role : "customer"
    };
}

export async function fetchProducts(
    search?: string,
    category?: string,
    sortBy?: string,
    minPrice?: number,
    maxPrice?: number,
    inStockOnly?: boolean
): Promise<Product[]> {
    const params = new URLSearchParams();
    if (search && search.trim() !== "") params.set("search", search.trim());
    if (category && category !== "ทั้งหมด") params.set("category", category);
    if (sortBy && sortBy !== "") params.set("sort_by", sortBy);
    if (minPrice !== undefined && !isNaN(minPrice)) params.set("min_price", String(minPrice));
    if (maxPrice !== undefined && !isNaN(maxPrice)) params.set("max_price", String(maxPrice));
    if (inStockOnly) params.set("in_stock_only", "true");

    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/api/items${queryString}`);
    if (!res.ok) {
        throw new Error("ไม่สามารถดึงรายการสินค้าได้");
    }
    return res.json();
}

export async function fetchCategories(): Promise<string[]> {
    const res = await fetch(`${API_BASE}/api/categories`);
    if (!res.ok) return [];
    return res.json();
}

export async function fetchProductById(productId: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(productId)}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "ไม่พบรายการสินค้า" }));
        throw new Error(err.detail || "ไม่พบรายการสินค้า");
    }
    return res.json();
}

export async function addProductReviewApi(
    productId: string,
    payload: ReviewCreatePayload
): Promise<Product> {
    const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(productId)}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "บันทึกรีวิวไม่สำเร็จ" }));
        throw new Error(err.detail || "บันทึกรีวิวไม่สำเร็จ");
    }
    return res.json();
}

export async function createProductApi(payload: ProductCreatePayload): Promise<Product> {
    const res = await fetch(`${API_BASE}/api/items`, {
        method: "POST",
        headers: getRoleHeader(),
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "เพิ่มสินค้าไม่สำเร็จ" }));
        throw new Error(err.detail || "เพิ่มสินค้าไม่สำเร็จ");
    }
    return res.json();
}

export async function updateProductApi(productId: string, payload: ProductCreatePayload): Promise<Product> {
    const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(productId)}`, {
        method: "PUT",
        headers: getRoleHeader(),
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "แก้ไขสินค้าไม่สำเร็จ" }));
        throw new Error(err.detail || "แก้ไขสินค้าไม่สำเร็จ");
    }
    return res.json();
}

export async function patchProductApi(
    productId: string,
    payload: Partial<ProductCreatePayload>
): Promise<Product> {
    const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(productId)}`, {
        method: "PATCH",
        headers: getRoleHeader(),
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "อัปเดตข้อมูลไม่สำเร็จ" }));
        throw new Error(err.detail || "อัปเดตข้อมูลไม่สำเร็จ");
    }
    return res.json();
}

export async function deleteProductApi(productId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/items/${encodeURIComponent(productId)}`, {
        method: "DELETE",
        headers: getRoleHeader()
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "ลบรายการสินค้าไม่สำเร็จ" }));
        throw new Error(err.detail || "ลบรายการสินค้าไม่สำเร็จ");
    }
}

export async function createOrderApi(payload: OrderCreatePayload): Promise<OrderResponse> {
    const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "ทำรายการสั่งซื้อไม่สำเร็จ" }));
        throw new Error(err.detail || "ทำรายการสั่งซื้อไม่สำเร็จ");
    }
    return res.json();
}

export async function fetchOrdersApi(username?: string): Promise<OrderResponse[]> {
    const q = username ? `?username=${encodeURIComponent(username)}` : "";
    const res = await fetch(`${API_BASE}/api/orders${q}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "ไม่สามารถดึงประวัติคำสั่งซื้อได้" }));
        throw new Error(err.detail || "ไม่สามารถดึงประวัติคำสั่งซื้อได้");
    }
    return res.json();
}

export async function updateOrderStatusApi(orderId: string, status: string): Promise<OrderResponse> {
    const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}/status`, {
        method: "PATCH",
        headers: getRoleHeader(),
        body: JSON.stringify({ status })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "อัปเดตสถานะไม่สำเร็จ" }));
        throw new Error(err.detail || "อัปเดตสถานะไม่สำเร็จ");
    }
    return res.json();
}

export async function deleteOrderApi(orderId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/orders/${encodeURIComponent(orderId)}`, {
        method: "DELETE",
        headers: getRoleHeader()
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "ลบคำสั่งซื้อไม่สำเร็จ" }));
        throw new Error(err.detail || "ลบคำสั่งซื้อไม่สำเร็จ");
    }
}

export async function sendOtpApi(email: string): Promise<SendOtpResponse> {
    const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "ส่งรหัส OTP ไม่สำเร็จ" }));
        throw new Error(err.detail || "ส่งรหัส OTP ไม่สำเร็จ");
    }
    return res.json();
}

export async function verifyOtpApi(email: string, otpCode: string): Promise<{ verified: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp_code: otpCode })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "รหัส OTP ไม่ถูกต้อง" }));
        throw new Error(err.detail || "รหัส OTP ไม่ถูกต้อง");
    }
    return res.json();
}

export async function registerWithOtpApi(payload: RegisterWithOtpPayload): Promise<UserSession> {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "สมัครสมาชิกไม่สำเร็จ" }));
        throw new Error(err.detail || "สมัครสมาชิกไม่สำเร็จ");
    }
    return res.json();
}

export async function loginApi(identifier: string, password: string): Promise<UserSession> {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "เข้าสู่ระบบไม่สำเร็จ" }));
        throw new Error(err.detail || "อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง");
    }
    return res.json();
}

export async function fetchUsersApi(): Promise<UserSession[]> {
    const res = await fetch(`${API_BASE}/api/users`, {
        headers: getRoleHeader()
    });
    if (!res.ok) return [];
    return res.json();
}

export async function updateUserRoleApi(userId: string, role: "customer" | "admin"): Promise<UserSession> {
    const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(userId)}/role`, {
        method: "PATCH",
        headers: getRoleHeader(),
        body: JSON.stringify({ role })
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "เปลี่ยนสิทธิ์ไม่สำเร็จ" }));
        throw new Error(err.detail || "เปลี่ยนสิทธิ์ไม่สำเร็จ");
    }
    return res.json();
}

export async function deleteUserApi(userId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: getRoleHeader()
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "ลบผู้ใช้ไม่สำเร็จ" }));
        throw new Error(err.detail || "ลบผู้ใช้ไม่สำเร็จ");
    }
}
