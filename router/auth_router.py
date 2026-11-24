from fastapi import APIRouter, Header, HTTPException
from models.user_model import (
    LoginRequest,
    RegisterWithOtpRequest,
    SendOtpRequest,
    SendOtpResponse,
    UserResponse,
    UserRoleUpdateRequest,
    VerifyOtpRequest,
)
from service import auth_service

router = APIRouter(tags=["Authentication & Users"])


def verify_admin(x_user_role: str | None) -> None:
    if x_user_role != "admin":
        raise HTTPException(status_code=403, detail="จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ (Admin)")


@router.post("/api/auth/send-otp", response_model=SendOtpResponse)
def send_otp(req: SendOtpRequest):
    """ส่งรหัส OTP 6 หลักไปยังอีเมล Gmail เพื่อยืนยันการสมัครสมาชิก"""
    return auth_service.send_otp_email(req)


@router.post("/api/auth/verify-otp")
def verify_otp(req: VerifyOtpRequest):
    """ตรวจสอบความถูกต้องของรหัส OTP 6 หลักก่อนกรอกข้อมูลโปรไฟล์"""
    return auth_service.verify_otp_code(req)


@router.post("/api/auth/register", response_model=UserResponse)
def register(user: RegisterWithOtpRequest):
    """ยืนยันรหัส OTP และสร้างบัญชีผู้ใช้ใหม่ลงใน MongoDB Atlas"""
    return auth_service.register_with_otp(user)


@router.post("/api/auth/login", response_model=UserResponse)
def login(credentials: LoginRequest):
    """เข้าสู่ระบบด้วย Gmail หรือ Username"""
    return auth_service.authenticate_user(credentials)


@router.get("/api/users", response_model=list[UserResponse])
def get_users(x_user_role: str | None = Header(default="admin")):
    """Admin ดูรายชื่อสมาชิกทั้งหมดในระบบ"""
    verify_admin(x_user_role)
    return auth_service.list_all_users()


@router.patch("/api/users/{user_id}/role", response_model=UserResponse)
def change_user_role(
    user_id: str,
    payload: UserRoleUpdateRequest,
    x_user_role: str | None = Header(default="admin")
):
    """Admin เปลี่ยนสิทธิ์ผู้ใช้ระหว่าง Customer และ Admin"""
    verify_admin(x_user_role)
    return auth_service.update_user_role(user_id, payload.role)


@router.delete("/api/users/{user_id}")
def remove_user(
    user_id: str,
    x_user_role: str | None = Header(default="admin")
):
    """Admin ลบบัญชีผู้ใช้ออกจากระบบ"""
    verify_admin(x_user_role)
    return auth_service.delete_user_account(user_id)
