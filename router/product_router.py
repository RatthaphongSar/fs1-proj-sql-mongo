from fastapi import APIRouter, Header, HTTPException
from models.product_model import ProductCreate, ProductUpdate, ProductResponse, ReviewCreate
from service import product_service

router = APIRouter(tags=["Products"])


def verify_admin(x_user_role: str | None) -> None:
    if x_user_role != "admin":
        raise HTTPException(
            status_code=403,
            detail="เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถเพิ่ม แก้ไข หรือลบสินค้าได้"
        )


@router.get("/api/items", response_model=list[ProductResponse])
def search_items(
    search: str | None = None,
    category: str | None = None,
    sort_by: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    in_stock_only: bool = False
):
    return product_service.get_all_products(
        search=search,
        category=category,
        sort_by=sort_by,
        min_price=min_price,
        max_price=max_price,
        in_stock_only=in_stock_only
    )


@router.get("/api/categories", response_model=list[str])
def list_categories():
    return product_service.get_categories()


@router.get("/api/items/{item_id}", response_model=ProductResponse)
def get_item(item_id: str):
    return product_service.get_product_by_id(item_id)


@router.post("/api/items/{item_id}/reviews", response_model=ProductResponse)
def post_review(item_id: str, review: ReviewCreate):
    return product_service.add_product_review(item_id, review)


@router.post("/api/items", response_model=ProductResponse)
def post_item(
    item: ProductCreate,
    x_user_role: str | None = Header(default="admin")
):
    verify_admin(x_user_role)
    return product_service.create_product(item)


@router.put("/api/items/{item_id}", response_model=ProductResponse)
def put_item(
    item_id: str,
    item: ProductCreate,
    x_user_role: str | None = Header(default="admin")
):
    verify_admin(x_user_role)
    return product_service.update_product(item_id, item)


@router.patch("/api/items/{item_id}", response_model=ProductResponse)
def patch_item(
    item_id: str,
    item: ProductUpdate,
    x_user_role: str | None = Header(default="admin")
):
    verify_admin(x_user_role)
    return product_service.patch_product(item_id, item)


@router.delete("/api/items/{item_id}")
def delete_item(
    item_id: str,
    x_user_role: str | None = Header(default="admin")
):
    verify_admin(x_user_role)
    return product_service.delete_product(item_id)
