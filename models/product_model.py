from pydantic import BaseModel, Field


class ReviewItem(BaseModel):
    author: str = Field(..., min_length=1, description="ชื่อผู้รีวิว")
    rating: int = Field(..., ge=1, le=5, description="คะแนนดาว 1-5")
    comment: str = Field(..., min_length=1, description="ความคิดเห็นต่อสินค้า")
    created_at: str = Field(default="", description="วันที่รีวิว")


class ReviewCreate(BaseModel):
    author: str = Field(..., min_length=1)
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=1)


class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, description="ชื่อสินค้า")
    price: float = Field(..., ge=0, description="ราคาสินค้า (บาท)")
    stock: int = Field(..., ge=0, description="จำนวนสต็อกคงเหลือ")
    category: str = Field(..., min_length=1, description="หมวดหมู่สินค้า")
    image_url: str = Field(..., min_length=1, description="ลิงก์รูปภาพสินค้า")
    description: str = Field(..., min_length=1, description="รายละเอียดสินค้า")
    rating: float = Field(default=4.8, ge=0, le=5, description="คะแนนรีวิวสินค้า")
    sold: int = Field(default=0, ge=0, description="จำนวนที่ขายไปแล้ว")
    shop_name: str = Field(default="ALL MALL Official Store", description="ชื่อร้านค้าที่จัดจำหน่าย")
    shop_location: str = Field(default="กรุงเทพมหานคร", description="จังหวัดของร้านค้า")
    shop_response_rate: str = Field(default="98%", description="อัตราการตอบกลับแชท")


class ProductUpdate(BaseModel):
    name: str | None = None
    price: float | None = Field(default=None, ge=0)
    stock: int | None = Field(default=None, ge=0)
    category: str | None = None
    image_url: str | None = None
    description: str | None = None


class ProductResponse(ProductCreate):
    product_id: str = Field(..., description="รหัสสินค้าจาก MongoDB (_id)")
    reviews: list[ReviewItem] = Field(default_factory=list, description="รายการรีวิวจากผู้ซื้อ")
