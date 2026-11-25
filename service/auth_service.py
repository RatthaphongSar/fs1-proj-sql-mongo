import hashlib
import os
import random
import smtplib
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from bson import ObjectId
from fastapi import HTTPException
from config.database import users_collection, otp_collection
from models.user_model import LoginRequest, RegisterWithOtpRequest, SendOtpRequest, VerifyOtpRequest


def hash_password(raw_password: str) -> str:
    return hashlib.sha256(raw_password.encode("utf-8")).hexdigest()


def serialize_user(doc: dict) -> dict:
    return {
        "user_id": str(doc["_id"]),
        "username": doc.get("username", ""),
        "email": doc.get("email", ""),
        "display_name": doc.get("display_name", doc.get("username", "")),
        "phone": doc.get("phone", ""),
        "role": doc.get("role", "customer"),
        "created_at": doc.get("created_at", ""),
    }


def send_otp_email(req: SendOtpRequest) -> dict:
    email = req.email.strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=400, detail="รูปแบบอีเมลไม่ถูกต้อง กรุณาระบุอีเมลที่ใช้งานได้จริง")

    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = (datetime.now() + timedelta(minutes=10)).isoformat()

    otp_collection.update_one(
        {"email": email},
        {"$set": {
            "email": email,
            "otp_code": otp_code,
            "expires_at": expires_at,
            "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }},
        upsert=True
    )

    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_email = os.getenv("SMTP_EMAIL", "").strip()
    smtp_password = os.getenv("SMTP_APP_PASSWORD", "").strip()

    smtp_sent = False
    if smtp_email and smtp_password:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = f"รหัสยืนยันตัวตน (OTP): {otp_code} - ALL MALL Official Store"
            msg["From"] = f"ALL MALL Security <{smtp_email}>"
            msg["To"] = email

            html_body = f"""
            <div style="font-family: 'Segoe UI', Tahoma, sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0c; color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #27272a;">
                <div style="background: #f97316; padding: 18px 24px; font-size: 20px; font-weight: 800; color: #ffffff;">
                    ALL MALL OFFICIAL
                </div>
                <div style="padding: 24px; background: #ffffff; color: #09090b;">
                    <h3 style="margin-top: 0;">รหัสยืนยันการสมัครสมาชิก (OTP Verification)</h3>
                    <p style="color: #52525b; font-size: 14px;">กรุณานำรหัส OTP 6 หลักด้านล่างไปกรอกในหน้าสมัครสมาชิก รหัสนี้มีอายุการใช้งาน 10 นาที:</p>
                    <div style="background: #fff7ed; border: 2px dashed #f97316; padding: 16px; text-align: center; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #ea580c; border-radius: 8px; margin: 20px 0;">
                        {otp_code}
                    </div>
                    <p style="color: #71717a; font-size: 12px;">หากคุณไม่ได้เป็นผู้ทำรายการนี้ กรุณาเพิกเฉยต่ออีเมลฉบับนี้</p>
                </div>
            </div>
            """
            msg.attach(MIMEText(html_body, "html", "utf-8"))

            with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                server.starttls()
                server.login(smtp_email, smtp_password)
                server.sendmail(smtp_email, [email], msg.as_string())
            smtp_sent = True
        except Exception as exc:
            print(f"[SMTP Warning] Could not send via Gmail SMTP: {exc}")

    return {
        "message": (
            f"ส่งรหัส OTP 6 หลักไปยังอีเมล {email} เรียบร้อยแล้ว"
            if smtp_sent
            else f"สร้างรหัส OTP สำหรับ {email} เรียบร้อยแล้ว"
        ),
        "email": email,
        "smtp_sent": smtp_sent,
        "otp_preview": None if smtp_sent else otp_code,
    }


def verify_otp_code(req: VerifyOtpRequest) -> dict:
    email = req.email.strip().lower()
    code = req.otp_code.strip()

    otp_doc = otp_collection.find_one({"email": email})
    if not otp_doc:
        raise HTTPException(status_code=400, detail="ไม่พบรายการขอรหัส OTP ของอีเมลนี้ กรุณากดขอรหัสใหม่")

    if otp_doc.get("otp_code") != code:
        raise HTTPException(status_code=400, detail="รหัส OTP 6 หลักไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง")

    try:
        expires_at = datetime.fromisoformat(otp_doc.get("expires_at", ""))
        if datetime.now() > expires_at:
            raise HTTPException(status_code=400, detail="รหัส OTP หมดอายุแล้ว กรุณากดขอรหัสใหม่")
    except ValueError:
        pass

    return {"verified": True, "email": email, "message": "ยืนยันรหัส OTP สำเร็จ"}


def register_with_otp(data: RegisterWithOtpRequest) -> dict:
    email = data.email.strip().lower()
    username = data.username.strip()

    otp_doc = otp_collection.find_one({"email": email})
    if not otp_doc:
        raise HTTPException(status_code=400, detail="ไม่พบรายการขอรหัส OTP สำหรับอีเมลนี้ กรุณากดขอรหัส OTP ก่อน")

    if otp_doc.get("otp_code") != data.otp_code.strip():
        raise HTTPException(status_code=400, detail="รหัส OTP ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง")

    try:
        expires_at = datetime.fromisoformat(otp_doc.get("expires_at", ""))
        if datetime.now() > expires_at:
            raise HTTPException(status_code=400, detail="รหัส OTP หมดอายุแล้ว กรุณากดขอรหัสใหม่")
    except ValueError:
        pass

    # ตรวจสอบว่ามีอีเมลนี้ในระบบแล้วหรือยัง (หากมีแล้ว จะเป็นการอัปเดตข้อมูลบัญชีและตั้งรหัสผ่านใหม่ด้วย OTP)
    existing_by_email = users_collection.find_one({"email": email})
    existing_by_username = users_collection.find_one({"username": username})
    if existing_by_username and (not existing_by_email or existing_by_username["_id"] != existing_by_email["_id"]):
        raise HTTPException(status_code=400, detail="ชื่อผู้ใช้งาน (Username) นี้มีผู้ใช้อื่นใช้งานแล้ว กรุณาเปลี่ยนชื่อใหม่")

    # กำหนดสิทธิ์ตามที่ผู้ใช้เลือกจริง (ไม่ override เป็น admin อัตโนมัติ)
    role = "admin" if (data.role and data.role.strip().lower() == "admin") else "customer"

    user_fields = {
        "username": username,
        "email": email,
        "password_hash": hash_password(data.password),
        "display_name": data.display_name.strip(),
        "phone": data.phone.strip(),
        "role": role,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }

    if existing_by_email:
        users_collection.update_one({"_id": existing_by_email["_id"]}, {"$set": user_fields})
        user_id = existing_by_email["_id"]
    else:
        result = users_collection.insert_one(user_fields)
        user_id = result.inserted_id

    otp_collection.delete_one({"email": email})
    created = users_collection.find_one({"_id": user_id})
    return serialize_user(created)


def authenticate_user(credentials: LoginRequest) -> dict:
    ident = credentials.identifier.strip()
    user_doc = users_collection.find_one({
        "$or": [
            {"email": ident.lower()},
            {"username": ident}
        ]
    })

    if not user_doc:
        raise HTTPException(status_code=401, detail="ไม่พบบัญชีผู้ใช้งานนี้ กรุณาสมัครสมาชิกก่อนเข้าสู่ระบบ")

    hashed_input = hash_password(credentials.password)
    stored_hash = user_doc.get("password_hash")
    stored_plain = user_doc.get("password")

    if stored_hash:
        if stored_hash != hashed_input:
            raise HTTPException(status_code=401, detail="รหัสผ่านไม่ถูกต้อง")
    elif stored_plain != credentials.password:
        raise HTTPException(status_code=401, detail="รหัสผ่านไม่ถูกต้อง")

    return serialize_user(user_doc)


def list_all_users() -> list[dict]:
    cursor = users_collection.find({})
    return [serialize_user(u) for u in cursor]


def update_user_role(user_id: str, new_role: str) -> dict:
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="รหัสผู้ใช้ไม่ถูกต้อง")

    role_val = "admin" if new_role == "admin" else "customer"
    res = users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"role": role_val}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="ไม่พบบัญชีผู้ใช้")

    updated = users_collection.find_one({"_id": ObjectId(user_id)})
    return serialize_user(updated)


def delete_user_account(user_id: str) -> dict:
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="รหัสผู้ใช้ไม่ถูกต้อง")

    res = users_collection.delete_one({"_id": ObjectId(user_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="ไม่พบบัญชีผู้ใช้")

    return {"message": "ลบบัญชีผู้ใช้เรียบร้อยแล้ว", "deleted_id": user_id}
