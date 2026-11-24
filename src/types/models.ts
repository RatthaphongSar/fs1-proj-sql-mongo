export interface ReviewItem {
    author: string;
    rating: number;
    comment: string;
    created_at: string;
}

export interface ReviewCreatePayload {
    author: string;
    rating: number;
    comment: string;
}

export interface Product {
    product_id: string;
    name: string;
    price: number;
    stock: number;
    category: string;
    image_url: string;
    description: string;
    rating?: number;
    sold?: number;
    shop_name?: string;
    shop_location?: string;
    shop_response_rate?: string;
    reviews?: ReviewItem[];
}

export interface ProductCreatePayload {
    name: string;
    price: number;
    stock: number;
    category: string;
    image_url: string;
    description: string;
}

export interface CartItem {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    stock: number;
    image_url: string;
    category: string;
}

export interface OrderCreatePayload {
    customer_name: string;
    phone: string;
    shipping_address: string;
    items: {
        product_id: string;
        name: string;
        price: number;
        quantity: number;
        image_url: string;
    }[];
    note?: string;
    payment_method: string;
    payment_reference?: string;
    username: string;
}

export interface OrderResponse extends OrderCreatePayload {
    order_id: string;
    total_price: number;
    status: string;
    created_at: string;
}

export interface UserSession {
    user_id: string;
    username: string;
    email: string;
    display_name: string;
    phone?: string;
    role: "customer" | "admin";
    created_at?: string;
}

export interface SendOtpResponse {
    message: string;
    email: string;
    smtp_sent: boolean;
    otp_preview?: string | null;
}

export interface RegisterWithOtpPayload {
    email: string;
    otp_code: string;
    username: string;
    password: string;
    display_name: string;
    phone: string;
    role: "customer" | "admin";
}
