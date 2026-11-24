import re
from datetime import datetime
from bson import ObjectId
from fastapi import HTTPException
from config.database import products_collection, save_mock_backup
from models.product_model import ProductCreate, ProductUpdate, ReviewCreate

SHOP_BY_CATEGORY = {
    "คอมพิวเตอร์ & แล็ปท็อป": ("NEXTGEN IT & PC OFFICIAL", "กรุงเทพมหานคร", "99%"),
    "มือถือ & แท็บเล็ต": ("SMART GADGET THAILAND MALL", "นนทบุรี", "98%"),
    "อุปกรณ์อิเล็กทรอนิกส์": ("SONIC AUDIO & TECH STORE", "กรุงเทพมหานคร", "97%"),
    "เกมและอุปกรณ์เสริม": ("PRO ESPORTS GAMING HUB", "ปทุมธานี", "99%"),
    "กล้องและอุปกรณ์ถ่ายภาพ": ("PIXEL STUDIO CAMERA MALL", "กรุงเทพมหานคร", "96%"),
    "เสื้อผ้าแฟชั่น": ("URBAN STREETWEAR STUDIO", "กรุงเทพมหานคร", "98%"),
    "กระเป๋า & รองเท้า": ("STEPUP SNEAKER & BAG OFFICIAL", "สมุทรปราการ", "97%"),
    "นาฬิกา & แว่นตา": ("CHRONO VISION BOUTIQUE", "กรุงเทพมหานคร", "98%"),
    "เครื่องใช้ในบ้าน": ("HOMELIVING MODERN DESIGN", "นนทบุรี", "99%"),
    "กีฬา & กิจกรรมกลางแจ้ง": ("ACTIVE FIT & OUTDOOR GEAR", "เชียงใหม่", "97%"),
}


def get_default_reviews(name: str, category: str) -> list[dict]:
    return [
        {
            "author": "คุณกิตติพงศ์ ว. (ผู้ซื้อที่ยืนยันแล้ว)",
            "rating": 5,
            "comment": f"ได้รับสินค้า {name} เรียบร้อยแล้ว แพ็คมาแน่นหนามาก คุณภาพวัสดุดีเกินราคา จัดส่งไวมากครับ",
            "created_at": "2026-11-14 14:20"
        },
        {
            "author": "คุณปิยะนุช ส. (ผู้ซื้อที่ยืนยันแล้ว)",
            "rating": 5,
            "comment": f"สินค้าตรงปก ใช้งานได้ดีเยี่ยม ร้านค้าในหมวด {category} ให้คำแนะนำดีมาก แนะนำเลยค่ะ",
            "created_at": "2026-11-16 09:45"
        }
    ]


def serialize_product(doc: dict) -> dict:
    category = doc.get("category", "")
    default_shop, default_loc, default_resp = SHOP_BY_CATEGORY.get(
        category, ("ALL MALL Official Store", "กรุงเทพมหานคร", "98%")
    )
    name = doc.get("name", "")
    reviews = doc.get("reviews")
    if not reviews:
        reviews = get_default_reviews(name, category)

    return {
        "product_id": str(doc["_id"]),
        "name": name,
        "price": float(doc.get("price", 0)),
        "stock": int(doc.get("stock", 0)),
        "category": category,
        "image_url": doc.get("image_url", ""),
        "description": doc.get("description", ""),
        "rating": float(doc.get("rating", 4.8)),
        "sold": int(doc.get("sold", 0)),
        "shop_name": doc.get("shop_name") or default_shop,
        "shop_location": doc.get("shop_location") or default_loc,
        "shop_response_rate": doc.get("shop_response_rate") or default_resp,
        "reviews": reviews,
    }


def get_all_products(
    search: str | None = None,
    category: str | None = None,
    sort_by: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    in_stock_only: bool = False
) -> list[dict]:
    query: dict = {}
    and_conditions: list[dict] = []

    if search and search.strip():
        tokens = [t.strip() for t in search.strip().split() if t.strip()]
        for token in tokens:
            safe_token = re.escape(token)
            and_conditions.append({
                "$or": [
                    {"name": {"$regex": safe_token, "$options": "i"}},
                    {"description": {"$regex": safe_token, "$options": "i"}},
                    {"category": {"$regex": safe_token, "$options": "i"}},
                ]
            })

    if category and category.strip() and category.strip() != "ทั้งหมด":
        and_conditions.append({"category": category.strip()})

    if in_stock_only:
        and_conditions.append({"stock": {"$gt": 0}})

    if and_conditions:
        query = {"$and": and_conditions} if len(and_conditions) > 1 else and_conditions[0]

    cursor = products_collection.find(query)
    products = [serialize_product(doc) for doc in cursor]

    if not products and search and search.strip() and len(search.strip().split()) > 1:
        tokens = [re.escape(t.strip()) for t in search.strip().split() if t.strip()]
        or_clauses = []
        for tk in tokens:
            or_clauses.extend([
                {"name": {"$regex": tk, "$options": "i"}},
                {"description": {"$regex": tk, "$options": "i"}},
                {"category": {"$regex": tk, "$options": "i"}},
            ])
        fallback_query: dict = {"$or": or_clauses}
        if category and category.strip() and category.strip() != "ทั้งหมด":
            fallback_query = {"$and": [{"category": category.strip()}, fallback_query]}
        products = [serialize_product(doc) for doc in products_collection.find(fallback_query)]

    if min_price is not None:
        products = [p for p in products if p["price"] >= min_price]
    if max_price is not None:
        products = [p for p in products if p["price"] <= max_price]

    if search and search.strip() and not sort_by:
        kw_lower = search.strip().lower()
        products.sort(
            key=lambda p: (
                0 if kw_lower in p["name"].lower() else (1 if kw_lower in p["category"].lower() else 2),
                -p["sold"]
            )
        )
    elif sort_by == "price_asc":
        products.sort(key=lambda x: x["price"])
    elif sort_by == "price_desc":
        products.sort(key=lambda x: x["price"], reverse=True)
    elif sort_by == "popular":
        products.sort(key=lambda x: x["sold"], reverse=True)
    elif sort_by == "rating":
        products.sort(key=lambda x: x["rating"], reverse=True)
    elif sort_by == "latest":
        products.reverse()

    return products


def get_categories() -> list[str]:
    categories = products_collection.distinct("category")
    return sorted([c for c in categories if c])


def get_product_by_id(product_id: str) -> dict:
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="รูปแบบรหัสสินค้าไม่ถูกต้อง")

    doc = products_collection.find_one({"_id": ObjectId(product_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบสินค้านี้ในระบบ")

    return serialize_product(doc)


def add_product_review(product_id: str, review_data: ReviewCreate) -> dict:
    """เพิ่มความคิดเห็นและคะแนนรีวิวใหม่ลงในเอกสารสินค้าใน MongoDB"""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="รูปแบบรหัสสินค้าไม่ถูกต้อง")

    doc = products_collection.find_one({"_id": ObjectId(product_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบสินค้านี้ในระบบ")

    existing_reviews = doc.get("reviews")
    if not existing_reviews:
        existing_reviews = get_default_reviews(doc.get("name", ""), doc.get("category", ""))

    new_review = {
        "author": review_data.author.strip(),
        "rating": int(review_data.rating),
        "comment": review_data.comment.strip(),
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }
    updated_reviews = [new_review] + existing_reviews
    avg_rating = round(sum(r["rating"] for r in updated_reviews) / len(updated_reviews), 1)

    products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"reviews": updated_reviews, "rating": avg_rating}}
    )
    save_mock_backup()

    updated_doc = products_collection.find_one({"_id": ObjectId(product_id)})
    return serialize_product(updated_doc)


def create_product(data: ProductCreate) -> dict:
    doc = data.model_dump()
    result = products_collection.insert_one(doc)
    save_mock_backup()

    created = products_collection.find_one({"_id": result.inserted_id})
    return serialize_product(created)


def update_product(product_id: str, data: ProductCreate) -> dict:
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="รูปแบบรหัสสินค้าไม่ถูกต้อง")

    update_data = data.model_dump()
    result = products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="ไม่พบสินค้าที่ต้องการแก้ไข")

    save_mock_backup()
    updated = products_collection.find_one({"_id": ObjectId(product_id)})
    return serialize_product(updated)


def patch_product(product_id: str, data: ProductUpdate) -> dict:
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="รูปแบบรหัสสินค้าไม่ถูกต้อง")

    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="ไม่มีข้อมูลที่ต้องการอัปเดต")

    result = products_collection.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_fields}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="ไม่พบสินค้าที่ต้องการอัปเดต")

    save_mock_backup()
    updated = products_collection.find_one({"_id": ObjectId(product_id)})
    return serialize_product(updated)


def delete_product(product_id: str) -> dict:
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="รูปแบบรหัสสินค้าไม่ถูกต้อง")

    doc = products_collection.find_one({"_id": ObjectId(product_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบสินค้าที่ต้องการลบ")

    products_collection.delete_one({"_id": ObjectId(product_id)})
    save_mock_backup()
    return {"message": "ลบสินค้าเรียบร้อยแล้ว", "deleted_id": product_id}
