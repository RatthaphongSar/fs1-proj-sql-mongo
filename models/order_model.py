from pydantic import BaseModel, Field


class OrderItem(BaseModel):
    product_id: str = Field(..., description="รหัสสินค้า (_id ในคอลเลกชัน products)")
    name: str = Field(..., description="ชื่อสินค้า ณ เวลาสั่งซื้อ")
    price: float = Field(..., ge=0, description="ราคาต่อชิ้น ณ เวลาสั่งซื้อ")
    quantity: int = Field(..., ge=1, description="จำนวนที่สั่งซื้อ")
    image_url: str = Field(default="", description="รูปภาพสินค้า")


class OrderCreate(BaseModel):
    customer_name: str = Field(..., min_length=1, description="ชื่อ-นามสกุลผู้รับ")
    phone: str = Field(..., min_length=1, description="เบอร์โทรศัพท์ติดต่อ")
    shipping_address: str = Field(..., min_length=1, description="ที่อยู่จัดส่ง")
    items: list[OrderItem] = Field(..., min_length=1, description="รายการสินค้าที่สั่งซื้อ")
    note: str | None = Field(default="", max_length=200, description="หมายเหตุเพิ่มเติมถึงร้านค้า")
    payment_method: str = Field(default="QR PromptPay", description="ช่องทางการชำระเงิน")
    payment_reference: str = Field(default="", description="หมายเลขอ้างอิงการชำระเงิน")
    username: str = Field(default="guest", description="ชื่อบัญชีผู้ใช้ที่สั่งซื้อ")


class OrderStatusUpdateRequest(BaseModel):
    status: str = Field(..., min_length=1, description="สถานะคำสั่งซื้อใหม่")


class OrderResponse(OrderCreate):
    order_id: str = Field(..., description="รหัสคำสั่งซื้อจาก MongoDB (_id)")
    total_price: float = Field(..., ge=0, description="ยอดรวมทั้งสิ้น (บาท)")
    status: str = Field(default="ชำระเงินสำเร็จ (กำลังเตรียมจัดส่ง)", description="สถานะคำสั่งซื้อ")
    created_at: str = Field(..., description="วันและเวลาที่สั่งซื้อ")
