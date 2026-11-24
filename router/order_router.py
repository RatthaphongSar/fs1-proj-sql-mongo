from fastapi import APIRouter, Header, HTTPException
from models.order_model import OrderCreate, OrderResponse, OrderStatusUpdateRequest
from service import order_service

router = APIRouter(tags=["Orders"])


def verify_admin(x_user_role: str | None) -> None:
    if x_user_role != "admin":
        raise HTTPException(status_code=403, detail="จำกัดสิทธิ์เฉพาะผู้ดูแลระบบ (Admin)")


@router.post("/api/orders", response_model=OrderResponse)
def create_new_order(order: OrderCreate):
    return order_service.create_order(order)


@router.get("/api/orders", response_model=list[OrderResponse])
def list_orders(username: str | None = None):
    return order_service.get_orders(username=username)


@router.patch("/api/orders/{order_id}/status", response_model=OrderResponse)
def change_order_status(
    order_id: str,
    payload: OrderStatusUpdateRequest,
    x_user_role: str | None = Header(default="admin")
):
    verify_admin(x_user_role)
    return order_service.update_order_status(order_id, payload.status)


@router.delete("/api/orders/{order_id}")
def remove_order(
    order_id: str,
    x_user_role: str | None = Header(default="admin")
):
    verify_admin(x_user_role)
    return order_service.delete_order(order_id)
