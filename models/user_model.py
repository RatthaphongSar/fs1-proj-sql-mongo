from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    identifier: str = Field(..., min_length=1, description="อีเมล (Gmail) หรือชื่อผู้ใช้งาน")
    password: str = Field(..., min_length=1, description="รหัสผ่าน")


class SendOtpRequest(BaseModel):
    email: str = Field(..., min_length=5, description="อีเมล Gmail สำหรับรับรหัส OTP 6 หลัก")


class VerifyOtpRequest(BaseModel):
    email: str = Field(..., min_length=5, description="อีเมล Gmail")
    otp_code: str = Field(..., min_length=6, max_length=6, description="รหัส OTP 6 หลัก")


class SendOtpResponse(BaseModel):
    message: str
    email: str
    smtp_sent: bool = Field(default=False, description="สถานะการส่งผ่าน SMTP")
    otp_preview: str | None = Field(default=None, description="รหัส OTP กรณีไม่ได้ตั้งค่า SMTP App Password")


class RegisterWithOtpRequest(BaseModel):
    email: str = Field(..., min_length=5, description="อีเมล Gmail")
    otp_code: str = Field(..., min_length=6, max_length=6, description="รหัส OTP 6 หลัก")
    username: str = Field(..., min_length=3, description="ชื่อผู้ใช้")
    password: str = Field(..., min_length=6, description="รหัสผ่าน")
    display_name: str = Field(..., min_length=1, description="ชื่อ-นามสกุล หรือชื่อที่ใช้แสดง")
    phone: str = Field(default="", description="เบอร์โทรศัพท์")
    role: str = Field(default="customer", description="บทบาทผู้ใช้ (customer หรือ admin)")


class UserRoleUpdateRequest(BaseModel):
    role: str = Field(..., description="บทบาทใหม่: customer หรือ admin")


class UserResponse(BaseModel):
    user_id: str = Field(..., description="รหัสผู้ใช้จาก MongoDB (_id)")
    username: str
    email: str
    display_name: str
    phone: str = ""
    role: str = Field(..., description="บทบาท: customer หรือ admin")
    created_at: str = ""
