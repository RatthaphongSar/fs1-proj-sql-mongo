from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from config.database import USING_MONGOMOCK, DATABASE_NAME, DB_CONNECTION_ERROR, MONGODB_URI, init_db
from router.product_router import router as product_router
from router.order_router import router as order_router
from router.auth_router import router as auth_router

BASE_DIR = Path(__file__).resolve().parent


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(
    title="ALL Online Shop - E-Commerce API (MongoDB)",
    description="โครงงานประจำรายวิชา 1322208 ระบบฐานข้อมูลและข้อมูลขนาดใหญ่ (FastAPI + PyMongo)",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# เชื่อมต่อ API Routers ทั้งหมด
app.include_router(product_router)
app.include_router(order_router)
app.include_router(auth_router)

# เสิร์ฟไฟล์ Static (CSS, JS ที่คอมไพล์จาก TypeScript, รูปภาพ) และหน้า HTML
app.mount("/public", StaticFiles(directory=str(BASE_DIR / "public")), name="public")
app.mount("/pages", StaticFiles(directory=str(BASE_DIR / "pages")), name="pages")


@app.get("/api/db-status")
def get_db_status():
    """ตรวจสอบสถานะการเชื่อมต่อ MongoDB Atlas แบบ Real-time"""
    masked_uri = None
    if MONGODB_URI:
        # mask password in mongodb+srv://user:pass@cluster
        import re
        masked_uri = re.sub(r":([^@]+)@", ":****@", MONGODB_URI)
    return {
        "status": "connected" if not USING_MONGOMOCK else "in-memory-mock",
        "using_mongomock": USING_MONGOMOCK,
        "has_mongodb_uri": bool(MONGODB_URI),
        "configured_uri": masked_uri,
        "database_name": DATABASE_NAME,
        "connection_error": DB_CONNECTION_ERROR,
    }


@app.get("/")
def serve_index():
    return FileResponse(str(BASE_DIR / "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
