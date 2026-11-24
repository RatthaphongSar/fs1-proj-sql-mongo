from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from config.database import orders_collection, products_collection
from models.order_model import OrderCreate


def serialize_order(doc: dict) -> dict:
    return {
        "order_id": str(doc["_id"]),
        "customer_name": doc.get("customer_name", ""),
        "phone": doc.get("phone", ""),
        "shipping_address": doc.get("shipping_address", ""),
        "items": doc.get("items", []),
        "note": doc.get("note", ""),
        "payment_method": doc.get("payment_method", "QR PromptPay"),
        "payment_reference": doc.get("payment_reference", ""),
        "username": doc.get("username", "guest"),
        "total_price": float(doc.get("total_price", 0)),
        "status": doc.get("status", "ชำระเงินสำเร็จ (กำลังเตรียมจัดส่ง)"),
        "created_at": doc.get("created_at", ""),
    }


def create_order(order_data: OrderCreate) -> dict:
    if not order_data.items:
        raise HTTPException(status_code=400, detail="ไม่มีรายการสินค้าในคำสั่งซื้อ")

    total_price = 0.0
    validated_items = []

    for item in order_data.items:
        if not ObjectId.is_valid(item.product_id):
            raise HTTPException(status_code=400, detail=f"รหัสสินค้าไม่ถูกต้อง: {item.product_id}")

        prod_doc = products_collection.find_one({"_id": ObjectId(item.product_id)})
        if not prod_doc:
            raise HTTPException(status_code=404, detail=f"ไม่พบสินค้า: {item.name}")

        current_stock = int(prod_doc.get("stock", 0))
        if current_stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"สินค้า '{prod_doc['name']}' มีสต็อกไม่เพียงพอ (คงเหลือ {current_stock} ชิ้น)"
            )

        unit_price = float(prod_doc.get("price", item.price))
        total_price += unit_price * item.quantity

        validated_items.append({
            "product_id": str(prod_doc["_id"]),
            "name": prod_doc.get("name", item.name),
            "price": unit_price,
            "quantity": item.quantity,
            "image_url": prod_doc.get("image_url", item.image_url),
        })

    for v_item in validated_items:
        products_collection.update_one(
            {"_id": ObjectId(v_item["product_id"])},
            {"$inc": {"stock": -v_item["quantity"], "sold": v_item["quantity"]}}
        )

    is_cod = "ปลายทาง" in order_data.payment_method or "COD" in order_data.payment_method
    initial_status = "รอชำระเงินปลายทาง (กำลังเตรียมจัดส่ง)" if is_cod else "ชำระเงินแล้ว (กำลังเตรียมจัดส่ง)"

    order_doc = {
        "customer_name": order_data.customer_name,
        "phone": order_data.phone,
        "shipping_address": order_data.shipping_address,
        "items": validated_items,
        "note": order_data.note or "",
        "payment_method": order_data.payment_method,
        "payment_reference": order_data.payment_reference or f"TXN-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "username": order_data.username,
        "total_price": round(total_price, 2),
        "status": initial_status,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }

    result = orders_collection.insert_one(order_doc)
    created_order = orders_collection.find_one({"_id": result.inserted_id})
    return serialize_order(created_order)


def get_orders(username: str | None = None) -> list[dict]:
    query = {}
    if username and username.strip():
        query["username"] = username.strip()

    cursor = orders_collection.find(query)
    orders = [serialize_order(doc) for doc in cursor]
    orders.reverse()
    return orders


def update_order_status(order_id: str, new_status: str) -> dict:
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="รหัสคำสั่งซื้อไม่ถูกต้อง")

    res = orders_collection.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": new_status.strip()}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="ไม่พบคำสั่งซื้อ")

    updated = orders_collection.find_one({"_id": ObjectId(order_id)})
    return serialize_order(updated)


def delete_order(order_id: str) -> dict:
    if not ObjectId.is_valid(order_id):
        raise HTTPException(status_code=400, detail="รหัสคำสั่งซื้อไม่ถูกต้อง")

    res = orders_collection.delete_one({"_id": ObjectId(order_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="ไม่พบคำสั่งซื้อ")

    return {"message": "ลบคำสั่งซื้อเรียบร้อยแล้ว", "deleted_id": order_id}
