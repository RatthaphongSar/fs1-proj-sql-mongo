import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

DEFAULT_ATLAS_URI = "mongodb+srv://rattapong101s_db_user:123456YEET@cluster0.hxja7yj.mongodb.net/?retryWrites=true&w=majority"
MONGODB_URI = os.getenv("MONGODB_URI") or DEFAULT_ATLAS_URI
DATABASE_NAME = os.getenv("DATABASE_NAME") or "all_online_shop"

client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
db = client[DATABASE_NAME]

products_collection = db["products"]
orders_collection = db["orders"]
users_collection = db["users"]
otp_collection = db["otp_codes"]

# สินค้าหลัก 32 รายการแรก
BASE_PRODUCTS = [
    # 1. คอมพิวเตอร์ & แล็ปท็อป
    {
        "name": "คีย์บอร์ดแมคคานิคอลไร้สาย RGB Hot-Swap (Blue Switch)",
        "price": 2490.0,
        "stock": 18,
        "category": "คอมพิวเตอร์ & แล็ปท็อป",
        "image_url": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80",
        "description": "คีย์บอร์ด Mechanical ไร้สาย 3 โหมด (Bluetooth / 2.4GHz / USB-C) ไฟ RGB ปรับแต่งได้ 18 โหมด รองรับการเปลี่ยนสวิตช์แบบ Hot-Swap",
        "rating": 4.9,
        "sold": 518
    },
    {
        "name": "เมาส์ไร้สาย Ergonomic Ultra-Light 58g เซ็นเซอร์ 26,000 DPI",
        "price": 1290.0,
        "stock": 40,
        "category": "คอมพิวเตอร์ & แล็ปท็อป",
        "image_url": "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=600&q=80",
        "description": "เมาส์ไร้สายน้ำหนักเบาพิเศษเพียง 58 กรัม ตอบสนองไวไร้ดีเลย์ ชาร์จเร็วผ่านพอร์ต Type-C ใช้งานได้ทั้งทำงานและเล่นเกม",
        "rating": 4.8,
        "sold": 612
    },
    {
        "name": "แท่นวางโน้ตบุ๊กอะลูมิเนียมอัลลอยด์ ปรับความสูงได้ 6 ระดับ",
        "price": 390.0,
        "stock": 60,
        "category": "คอมพิวเตอร์ & แล็ปท็อป",
        "image_url": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80",
        "description": "ขาตั้งแล็ปท็อปวัสดุอะลูมิเนียมแข็งแรงทนทาน ช่วยระบายความร้อนและปรับระดับสายตาตามหลักสรีรศาสตร์ พับเก็บพกพาได้",
        "rating": 4.8,
        "sold": 830
    },
    {
        "name": "จอมอนิเตอร์ IPS 27 นิ้ว 165Hz ไร้ขอบถนอมสายตา",
        "price": 5490.0,
        "stock": 14,
        "category": "คอมพิวเตอร์ & แล็ปท็อป",
        "image_url": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
        "description": "หน้าจอมอนิเตอร์ IPS ความละเอียดคมชัด อัตรารีเฟรช 165Hz สีสันสมจริง sRGB 99% พร้อมโหมดลดแสงสีฟ้าถนอมสายตา",
        "rating": 4.9,
        "sold": 275
    },

    # 2. มือถือ & แท็บเล็ต
    {
        "name": "พาวเวอร์แบงค์ Fast Charge 20,000 mAh PD 45W มีสายในตัว",
        "price": 890.0,
        "stock": 50,
        "category": "มือถือ & แท็บเล็ต",
        "image_url": "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80",
        "description": "แบตเตอรี่สำรองความจุ 20,000 mAh รองรับชาร์จไว PD 45W ชาร์จได้ทั้งสมาร์ทโฟนและแท็บเล็ต มีหน้าจอดิจิตอลบอกเปอร์เซ็นต์แบต",
        "rating": 4.9,
        "sold": 1250
    },
    {
        "name": "หัวชาร์จเร็ว GaN 65W 3 พอร์ต (2 USB-C + 1 USB-A)",
        "price": 590.0,
        "stock": 45,
        "category": "มือถือ & แท็บเล็ต",
        "image_url": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80",
        "description": "อะแดปเตอร์ชาร์จไวเทคโนโลยี GaN ขนาดเล็กกะทัดรัด จ่ายไฟสูงสุด 65W ชาร์จอุปกรณ์พร้อมกันได้ถึง 3 เครื่อง",
        "rating": 4.9,
        "sold": 980
    },
    {
        "name": "แท่นชาร์จไร้สาย 3-in-1 Magnetic Wireless Dock",
        "price": 750.0,
        "stock": 26,
        "category": "มือถือ & แท็บเล็ต",
        "image_url": "https://images.unsplash.com/photo-1615526675159-e248c3021d3f?auto=format&fit=crop&w=600&q=80",
        "description": "แท่นชาร์จไร้สายแม่เหล็ก ชาร์จสมาร์ทโฟน สมาร์ทวอทช์ และหูฟังไร้สายได้พร้อมกันในแท่นเดียว ดีไซน์มินิมอล",
        "rating": 4.7,
        "sold": 310
    },
    {
        "name": "เคสกันกระแทกเกรดพรีเมียม ขอบดำด้านรองรับชาร์จแม่เหล็ก",
        "price": 290.0,
        "stock": 80,
        "category": "มือถือ & แท็บเล็ต",
        "image_url": "https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=600&q=80",
        "description": "เคสโทรศัพท์เสริมมุมกันกระแทก ป้องกันการตกหล่นระดับความสูง 3 เมตร ด้านหลังใสป้องกันรอยขีดข่วน",
        "rating": 4.8,
        "sold": 1540
    },

    # 3. อุปกรณ์อิเล็กทรอนิกส์
    {
        "name": "หูฟังครอบหูไร้สาย Studio Wireless ANC ตัดเสียงรบกวน",
        "price": 1890.0,
        "stock": 25,
        "category": "อุปกรณ์อิเล็กทรอนิกส์",
        "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
        "description": "หูฟังไร้สายระบบตัดเสียงรบกวน Active Noise Cancelling แบตเตอรี่ใช้งานต่อเนื่อง 30 ชั่วโมง ฟองน้ำนุ่มใส่สบายตลอดวัน",
        "rating": 4.9,
        "sold": 342
    },
    {
        "name": "ลำโพงบลูทูธพกพา Deep Bass กันน้ำมาตรฐาน IPX7",
        "price": 990.0,
        "stock": 35,
        "category": "อุปกรณ์อิเล็กทรอนิกส์",
        "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80",
        "description": "ลำโพงบลูทูธพลังเสียงเบสหนักแน่น กันน้ำ IPX7 เชื่อมต่อบลูทูธ 5.3 เสถียร รองรับการเชื่อมต่อลำโพงคู่ Stereo",
        "rating": 4.7,
        "sold": 289
    },
    {
        "name": "หูฟัง True Wireless In-Ear บลูทูธ 5.3 พร้อมเคสชาร์จ",
        "price": 1190.0,
        "stock": 32,
        "category": "อุปกรณ์อิเล็กทรอนิกส์",
        "image_url": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
        "description": "หูฟังบลูทูธไร้สายขนาดกะทัดรัด เสียงร้องคมชัด เบสแน่น ไมโครโฟนคู่คุยสายชัดเจนทุกระดับเสียง",
        "rating": 4.7,
        "sold": 620
    },

    # 4. เกมและอุปกรณ์เสริม
    {
        "name": "จอยคอนโทรลเลอร์ไร้สาย Dual Vibration สำหรับ PC / Console",
        "price": 1350.0,
        "stock": 30,
        "category": "เกมและอุปกรณ์เสริม",
        "image_url": "https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=600&q=80",
        "description": "จอยเกมไร้สายจับถนัดมือ ระบบสั่นสมจริง Hall Effect Joystick ลดปัญหาจอยดริฟท์ แบตเตอรี่ในตัวใช้งานได้ 20 ชั่วโมง",
        "rating": 4.9,
        "sold": 410
    },
    {
        "name": "แผ่นรองเมาส์เกมมิ่งขนาดใหญ่ XXL ผิว Speed กันน้ำ",
        "price": 320.0,
        "stock": 75,
        "category": "เกมและอุปกรณ์เสริม",
        "image_url": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80",
        "description": "แผ่นรองเมาส์และคีย์บอร์ดขนาด 90x40 ซม. เย็บขอบกันลุ่ย พื้นยางธรรมชาติกันลื่น ผิวผ้าเคลือบสารกันละอองน้ำ",
        "rating": 4.8,
        "sold": 910
    },
    {
        "name": "ไมโครโฟนตั้งโต๊ะ Condenser USB สำหรับสตรีมและพอดแคสต์",
        "price": 1490.0,
        "stock": 19,
        "category": "เกมและอุปกรณ์เสริม",
        "image_url": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80",
        "description": "ไมโครโฟนรับเสียงทิศทางเดียว Cardioid ลดเสียงรบกวนรอบข้าง เชื่อมต่อผ่านสาย USB พร้อมขาตั้งและปุ่ม Mute สัมผัส",
        "rating": 4.8,
        "sold": 265
    },

    # 5. กล้องและอุปกรณ์ถ่ายภาพ
    {
        "name": "เว็บแคมความละเอียด Full HD 1080p 60FPS ออโต้โฟกัส",
        "price": 1150.0,
        "stock": 22,
        "category": "กล้องและอุปกรณ์ถ่ายภาพ",
        "image_url": "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?auto=format&fit=crop&w=600&q=80",
        "description": "กล้องเว็บแคมความละเอียดคมชัด 1080p 60FPS โฟกัสอัตโนมัติรวดเร็ว มีฝาปิดเลนส์เพื่อความเป็นส่วนตัว",
        "rating": 4.6,
        "sold": 145
    },
    {
        "name": "ขาตั้งกล้อง Tripod อะลูมิเนียม ยืดได้ 160 ซม. พร้อมรีโมท",
        "price": 450.0,
        "stock": 38,
        "category": "กล้องและอุปกรณ์ถ่ายภาพ",
        "image_url": "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
        "description": "ขาตั้งกล้องและสมาร์ทโฟนวัสดุอะลูมิเนียมน้ำหนักเบา หัวบอลหมุนได้ 360 องศา พับเก็บสะดวกพร้อมกระเป๋าพกพา",
        "rating": 4.7,
        "sold": 430
    },
    {
        "name": "ไฟสตูดิโอ LED Panel ปรับอุณหภูมิสีได้ 3200K-5600K",
        "price": 890.0,
        "stock": 24,
        "category": "กล้องและอุปกรณ์ถ่ายภาพ",
        "image_url": "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80",
        "description": "ไฟต่อเนื่องสำหรับถ่ายภาพและวิดีโอ ปรับความสว่างและโทนแสงส้ม-ขาวได้ละเอียด ให้ค่าสีตรง CRI 95+",
        "rating": 4.8,
        "sold": 195
    },

    # 6. เสื้อผ้าแฟชั่น
    {
        "name": "เสื้อฮู้ดดี้แขนยาว Oversize ผ้าคอตตอนพรีเมียม สีดำ",
        "price": 690.0,
        "stock": 30,
        "category": "เสื้อผ้าแฟชั่น",
        "image_url": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80",
        "description": "เสื้อฮู้ดทรง Oversize สไตล์สตรีท เนื้อผ้าคอตตอนเกรดพรีเมียมสัมผัสนุ่ม ไม่หดไม่ย้วย ระบายอากาศได้ดี",
        "rating": 4.8,
        "sold": 420
    },
    {
        "name": "แจ็คเก็ตกันลมทรงสปอร์ต ผ้าร่มกันละอองน้ำ",
        "price": 850.0,
        "stock": 25,
        "category": "เสื้อผ้าแฟชั่น",
        "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
        "description": "เสื้อแจ็คเก็ตซิปหน้าดีไซน์โมเดิร์น น้ำหนักเบา กันลมและละอองน้ำได้ดี มีกระเป๋าซิปซ่อนด้านใน",
        "rating": 4.7,
        "sold": 310
    },
    {
        "name": "เสื้อยืดคอกลม Heavyweight Cotton 100% ทรงสวยไม่ย้วย",
        "price": 290.0,
        "stock": 90,
        "category": "เสื้อผ้าแฟชั่น",
        "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80",
        "description": "เสื้อยืดผ้าคอตตอนทอพิเศษหนาอยู่ทรง คอฟิตกระชับไม่ย้วยหลังซัก สวมใส่สบายได้ทุกโอกาส",
        "rating": 4.9,
        "sold": 1120
    },

    # 7. กระเป๋า & รองเท้า
    {
        "name": "รองเท้าผ้าใบสนีกเกอร์ Street Edition สีดำ-ส้ม",
        "price": 1490.0,
        "stock": 20,
        "category": "กระเป๋า & รองเท้า",
        "image_url": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
        "description": "รองเท้าสนีกเกอร์ดีไซน์สปอร์ต พื้นโฟมซับแรงกระแทกนุ่มสบาย ระบายอากาศดีเยี่ยม ยึดเกาะพื้นได้ดี",
        "rating": 4.9,
        "sold": 560
    },
    {
        "name": "กระเป๋าเป้ใส่โน้ตบุ๊กกันน้ำ Anti-Theft ขนาด 15.6 นิ้ว",
        "price": 790.0,
        "stock": 35,
        "category": "กระเป๋า & รองเท้า",
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80",
        "description": "กระเป๋าเป้สะพายหลังผ้า Oxford กันน้ำ ซิปซ่อนปลอดภัย มีช่องบุกันกระแทกสำหรับแล็ปท็อปและแท็บเล็ต",
        "rating": 4.8,
        "sold": 890
    },
    {
        "name": "กระเป๋าสะพายข้าง Crossbody ผ้าไนลอนกันน้ำ",
        "price": 390.0,
        "stock": 55,
        "category": "กระเป๋า & รองเท้า",
        "image_url": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80",
        "description": "กระเป๋าสะพายข้างขนาดกะทัดรัด ช่องเก็บของแยกเป็นสัดส่วน 5 ช่อง ผ้าไนลอนทนทาน สายปรับความยาวได้",
        "rating": 4.7,
        "sold": 670
    },

    # 8. นาฬิกา & แว่นตา
    {
        "name": "สมาร์ทวอทช์ Sport Fitness Tracker หน้าจอ AMOLED",
        "price": 1590.0,
        "stock": 28,
        "category": "นาฬิกา & แว่นตา",
        "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
        "description": "นาฬิกาอัจฉริยะหน้าจอ AMOLED วัดอัตราการเต้นหัวใจ การนอนหลับ และโหมดออกกำลังกายกว่า 100 รูปแบบ กันน้ำ 5ATM",
        "rating": 4.8,
        "sold": 740
    },
    {
        "name": "นาฬิกาข้อมือผู้ชาย Chronograph สายสแตนเลสรมดำ",
        "price": 1850.0,
        "stock": 15,
        "category": "นาฬิกา & แว่นตา",
        "image_url": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80",
        "description": "นาฬิกาข้อมือระบบ Quartz หน้าปัดโครโนกราฟ กระจกกันรอยขีดข่วน ตัวเรือนและสายสแตนเลสสตีลรมดำ กันน้ำลึก 30 เมตร",
        "rating": 4.9,
        "sold": 215
    },
    {
        "name": "แว่นตากันแดดเลนส์ Polarized ป้องกันรังสี UV400",
        "price": 490.0,
        "stock": 45,
        "category": "นาฬิกา & แว่นตา",
        "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
        "description": "แว่นกันแดดเลนส์ Polarized ช่วยตัดแสงสะท้อน ถนอมสายตาขณะขับรถหรือทำกิจกรรมกลางแจ้ง น้ำหนักเบาพร้อมกล่องแว่น",
        "rating": 4.7,
        "sold": 370
    },

    # 9. เครื่องใช้ในบ้าน
    {
        "name": "เก้าอี้ทำงาน Ergonomic รองรับสรีระหลัง ปรับเอน 135 องศา",
        "price": 3290.0,
        "stock": 12,
        "category": "เครื่องใช้ในบ้าน",
        "image_url": "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=600&q=80",
        "description": "เก้าอี้สำนักงานเพื่อสุขภาพ พนักพิงตาข่ายระบายอากาศ มี Lumbar Support รองรับเอวและที่รองศีรษะปรับระดับได้",
        "rating": 4.9,
        "sold": 325
    },
    {
        "name": "เครื่องฟอกอากาศกรองฝุ่น PM2.5 ด้วยแผ่นกรอง HEPA H13",
        "price": 2190.0,
        "stock": 20,
        "category": "เครื่องใช้ในบ้าน",
        "image_url": "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80",
        "description": "เครื่องฟอกอากาศสำหรับห้องขนาด 25-35 ตร.ม. แผ่นกรอง True HEPA H13 ดักจับฝุ่นละอองขนาดเล็ก เสียงเงียบเพียง 24dB",
        "rating": 4.9,
        "sold": 490
    },
    {
        "name": "โคมไฟตั้งโต๊ะทำงาน LED ถนอมสายตา ปรับแสงได้ 3 โทน",
        "price": 490.0,
        "stock": 40,
        "category": "เครื่องใช้ในบ้าน",
        "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80",
        "description": "โคมไฟอ่านหนังสือระบบสัมผัส ปรับอุณหภูมิแสงได้ 3 โทนสี และหรี่แสงได้ตามต้องการ ไม่กะพริบถนอมสายตา",
        "rating": 4.8,
        "sold": 780
    },

    # 10. กีฬา & กิจกรรมกลางแจ้ง
    {
        "name": "ชุดดัมเบลปรับน้ำหนักได้ ข้างละ 10 กก. (รวม 20 กก.)",
        "price": 1290.0,
        "stock": 18,
        "category": "กีฬา & กิจกรรมกลางแจ้ง",
        "image_url": "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80",
        "description": "ชุดดัมเบลออกกำลังกาย ปรับเพิ่ม-ลดแผ่นน้ำหนักได้ตามต้องการ พร้อมก้านต่อแปลงเป็นบาร์เบล ด้ามจับกันลื่น",
        "rating": 4.9,
        "sold": 410
    },
    {
        "name": "เสื่อโยคะ TPE หนา 8 มม. กันลื่นสองด้าน พร้อมสายรัด",
        "price": 450.0,
        "stock": 35,
        "category": "กีฬา & กิจกรรมกลางแจ้ง",
        "image_url": "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=600&q=80",
        "description": "เสื่อโยคะวัสดุ TPE เกรดพรีเมียม หนา 8 มม. ช่วยซับแรงกระแทกข้อต่อ ยึดเกาะพื้นแน่นไม่ลื่นแม้มีเหงื่อ",
        "rating": 4.8,
        "sold": 690
    },
    {
        "name": "กระเป๋าเดินทางล้อลาก โครงอะลูมิเนียม ขนาด 20 นิ้ว",
        "price": 1690.0,
        "stock": 15,
        "category": "กีฬา & กิจกรรมกลางแจ้ง",
        "image_url": "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=600&q=80",
        "description": "กระเป๋าเดินทางวัสดุ PC+ABS แข็งแรงยืดหยุ่นสูง ล้อคู่หมุนลื่น 360 องศาไร้เสียงรบกวน ระบบล็อกมาตรฐาน TSA",
        "rating": 4.9,
        "sold": 280
    }
]

CATEGORY_TEMPLATES = {
    "คอมพิวเตอร์ & แล็ปท็อป": [
        ("คีย์บอร์ดไร้สาย Mechanical 75% Gasket Mount", 1890, "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80"),
        ("เมาส์เกมมิ่งไร้สาย Optical Sensor Pro", 990, "https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=600&q=80"),
        ("จอมอนิเตอร์ UltraWide QHD 144Hz IPS", 6990, "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80"),
        ("ฮับแปลงพอร์ต USB-C 8-in-1 รองรับ HDMI 4K", 790, "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=600&q=80"),
        ("SSD พกพาความเร็วสูง NVMe USB 3.2 Gen2 1TB", 2590, "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=600&q=80"),
        ("เราเตอร์ Wi-Fi 6 Dual-Band Gigabit ความเร็วสูง", 1590, "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80"),
    ],
    "มือถือ & แท็บเล็ต": [
        ("แบตเตอรี่สำรอง MagSafe Wireless 10,000 mAh", 790, "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=600&q=80"),
        ("สายชาร์จเร็วถักไนลอน USB-C to Type-C 100W", 250, "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=600&q=80"),
        ("ปากกาสไตลัสสำหรับแท็บเล็ต รองรับแรงกดและวางมือ", 690, "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80"),
        ("ขาตั้งแท็บเล็ตและสมาร์ทโฟน ปรับหมุนได้ 360 องศา", 350, "https://images.unsplash.com/photo-1615526675159-e248c3021d3f?auto=format&fit=crop&w=600&q=80"),
        ("ฟิล์มกระจกนิรภัยเต็มจอ ถนอมสายตาลดรอยนิ้วมือ", 190, "https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=600&q=80"),
        ("เคสแท็บเล็ตพับตั้งได้ พร้อมช่องเก็บปากกาสไตลัส", 420, "https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?auto=format&fit=crop&w=600&q=80"),
    ],
    "อุปกรณ์อิเล็กทรอนิกส์": [
        ("หูฟังไร้สาย Hybrid Active Noise Cancelling", 1650, "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"),
        ("ซาวด์บาร์บลูทูธ होमเธียเตอร์ พลังเสียง Stereo 2.1", 1990, "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80"),
        ("ลำโพงตั้งโต๊ะดีไซน์เรโทร เชื่อมต่อไร้สาย Bluetooth 5.3", 1250, "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=600&q=80"),
        ("เครื่องเล่นแผ่นเสียงไวนิลระบบบลูทูธในตัว", 2890, "https://images.unsplash.com/photo-1461784121038-f088ca1e7714?auto=format&fit=crop&w=600&q=80"),
        ("หูฟังมอนิเตอร์สตูดิโอ Hi-Res Audio สายถอดได้", 1390, "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=600&q=80"),
        ("เครื่องฉายโปรเจคเตอร์มินิ Full HD เชื่อมต่อ Wi-Fi", 2990, "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80"),
    ],
    "เกมและอุปกรณ์เสริม": [
        ("จอยเกมไร้สาย Pro Hall-Effect Trigger สำหรับ PC/Console", 1450, "https://images.unsplash.com/photo-1592840496694-26d035b52b48?auto=format&fit=crop&w=600&q=80"),
        ("ชุดหูฟังเกมมิ่ง 7.1 Surround พร้อมไมค์ตัดเสียง", 1190, "https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=600&q=80"),
        ("แขนจับไมโครโฟนสตูดิโอปรับองศาอิสระ โครงเหล็กแข็งแรง", 490, "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80"),
        ("แท่นวางหูฟังเกมมิ่งพร้อมพอร์ต USB Hub และไฟ RGB", 550, "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80"),
        ("การ์ดแคปเจอร์วิดีโอ 4K60Hz HDMI สำหรับสตรีมเมอร์", 1790, "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80"),
        ("คีย์แคป PBT Dye-Sub โปรไฟล์ Cherry ชุด 135 ปุ่ม", 650, "https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=600&q=80"),
    ],
    "กล้องและอุปกรณ์ถ่ายภาพ": [
        ("กล้องแอคชั่นแคม 4K 60FPS กันสั่น EIS พร้อมเคสกันน้ำ", 2390, "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80"),
        ("ไม้กันสั่นสมาร์ทโฟน 3 แกน Gimbal Stabilizer อัจฉริยะ", 2150, "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80"),
        ("ไมโครโฟนไร้สายติดปกเสื้อ 2 ตัวรับ 1 ตัวส่ง ตัดเสียงลม", 890, "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?auto=format&fit=crop&w=600&q=80"),
        ("กระเป๋ากล้องสะพายไหล่กันน้ำ บุนวมแบ่งช่องปรับได้", 790, "https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&w=600&q=80"),
        ("ชุดไฟวงแหวน Ring Light 18 นิ้ว พร้อมขาตั้งสูง 2 เมตร", 690, "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80"),
        ("กล่องถ่ายภาพสินค้าสตูดิโอพับได้ พร้อมไฟ LED ในตัว", 520, "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80"),
    ],
    "เสื้อผ้าแฟชั่น": [
        ("เสื้อสเวตเตอร์คอกลม ผ้าคอตตอนเทอร์รี่ ทรง Oversize", 590, "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80"),
        ("กางเกงคาร์โก้ขายาวทรงกระบอก ผ้าชิโน่ยืดหยุ่นใส่สบาย", 650, "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80"),
        ("เสื้อเชิ้ตแขนสั้นผ้าลินินผสมคอตตอน ทรงมินิมอล", 450, "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80"),
        ("เสื้อโปโลคอปกผ้าปิเก้ระบายอากาศ ไม่อับชื้น", 390, "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=600&q=80"),
        ("แจ็คเก็ตยีนส์ฟอกสีคลาสสิก ทรงเรกูลาร์ฟิต", 950, "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?auto=format&fit=crop&w=600&q=80"),
        ("กางเกงวอร์มจ็อกเกอร์ผ้านุ่ม มีซิปกระเป๋าข้าง", 490, "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=600&q=80"),
    ],
    "กระเป๋า & รองเท้า": [
        ("รองเท้าวิ่งซับแรงกระแทก น้ำหนักเบา ระบายอากาศ", 1390, "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"),
        ("กระเป๋าเป้เดินทางจุของได้ 35 ลิตร ผ้ากันน้ำทนทาน", 890, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80"),
        ("รองเท้าผ้าใบลำลองพื้นยางกันลื่น ดีไซน์มินิมอล", 990, "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=600&q=80"),
        ("กระเป๋าธนบัตรหนังแท้ทรงสั้น พร้อมชั้นป้องกัน RFID", 490, "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=600&q=80"),
        ("กระเป๋าโท้ทผ้าแคนวาสหนาพิเศษ มีซิปปิดและช่องใส่โน้ตบุ๊ก", 350, "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=600&q=80"),
        ("กระเป๋าจัดระเบียบอุปกรณ์ไอทีและสายชาร์จกันกระแทก", 260, "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80"),
    ],
    "นาฬิกา & แว่นตา": [
        ("นาฬิกาสมาร์ทวอทช์ GPS ในตัว โทรเข้า-ออกผ่านบลูทูธ", 1790, "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"),
        ("แว่นกรองแสงสีฟ้าคอมพิวเตอร์ กรอบไทเทเนียมน้ำหนักเบา", 450, "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80"),
        ("นาฬิกาข้อมือระบบออโตเมติก หน้าปัดเปลือยกลไก", 2490, "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80"),
        ("แว่นกันแดดทรงสปอร์ต เลนส์โพลาไรซ์ตัดแสงสะท้อน", 550, "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=600&q=80"),
        ("นาฬิกาดิจิตอลสายเรซินกันกระแทก กันน้ำลึก 100 เมตร", 890, "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80"),
        ("กล่องเก็บนาฬิกาข้อมือ 6 เรือน บุกำมะหยี่ฝาใส", 490, "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80"),
    ],
    "เครื่องใช้ในบ้าน": [
        ("หุ่นยนต์ดูดฝุ่นอัจฉริยะ ระบบนำทางเลเซอร์พร้อมถูพื้น", 4590, "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80"),
        ("โต๊ะทำงานปรับระดับไฟฟ้า สำหรับนั่งและยืนทำงาน", 5900, "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=600&q=80"),
        ("โคมไฟติดขอบจอมอนิเตอร์ ScreenBar ถนอมสายตาไร้แสงสะท้อน", 890, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80"),
        ("พัดลมตั้งพื้นไร้สายมินิมอล ปรับแรงลม 12 ระดับ", 1490, "https://images.unsplash.com/photo-1618941716939-553df3c6c278?auto=format&fit=crop&w=600&q=80"),
        ("เครื่องดูดฝุ่นไร้สายพลังไซโคลน น้ำหนักเบาพิเศษ", 1890, "https://images.unsplash.com/photo-1558317374-067fb5f30001?auto=format&fit=crop&w=600&q=80"),
        ("ชั้นวางของเหล็กเคลือบกันสนิม 4 ชั้น ดีไซน์โมเดิร์น", 790, "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80"),
    ],
    "กีฬา & กิจกรรมกลางแจ้ง": [
        ("จักรยานออกกำลังกายในร่ม ระบบแม่เหล็กเงียบพิเศษ", 3990, "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=600&q=80"),
        ("เต็นท์แคมป์ปิ้งกางอัตโนมัติ กันน้ำฝนและรังสียูวี", 1490, "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80"),
        ("เก้าอี้สนามพับเก็บได้ โครงอะลูมิเนียมลายไม้", 690, "https://images.unsplash.com/photo-1533630654593-b222d5d44449?auto=format&fit=crop&w=600&q=80"),
        ("ลูกกลิ้งบริหารหน้าท้อง Ab Wheel ระบบคืนตัวอัตโนมัติ", 390, "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?auto=format&fit=crop&w=600&q=80"),
        ("กระเป๋าเดินทางล้อลาก PC 100% ซิปสองชั้นกันกรีด 24 นิ้ว", 2190, "https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?auto=format&fit=crop&w=600&q=80"),
        ("ไฟฉายเดินป่าแรงสูง LED ชาร์จ USB-C กันน้ำ IP68", 350, "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80"),
    ],
}

SERIES_EDITIONS = [
    ("Series X1 Pro", 0, 25, 4.9, 410),
    ("Edition 2026", 100, 32, 4.8, 285),
    ("Carbon Black", 50, 40, 4.9, 530),
    ("Titanium Grade", 200, 18, 4.7, 190),
    ("Ultra Slim", -50, 55, 4.8, 620),
]


def build_332_products() -> list[dict]:
    """สร้างรายการสินค้าทั้งหมด 332 รายการ (32 รายการหลัก + 300 รายการเพิ่มเติมใน 10 หมวดหมู่)"""
    all_items = [dict(p) for p in BASE_PRODUCTS]

    for category, templates in CATEGORY_TEMPLATES.items():
        for base_name, base_price, img_url in templates:
            for edition_name, price_delta, stock_val, rating_val, sold_val in SERIES_EDITIONS:
                full_name = f"{base_name} รุ่น {edition_name}"
                final_price = float(max(99, base_price + price_delta))
                all_items.append({
                    "name": full_name,
                    "price": final_price,
                    "stock": stock_val,
                    "category": category,
                    "image_url": img_url,
                    "description": (
                        f"{full_name} สินค้าคุณภาพมาตรฐานจากหมวดหมู่ {category} "
                        f"ออกแบบมาเพื่อความทนทานและประสิทธิภาพการใช้งานสูงสุด พร้อมการรับประกันศูนย์ไทยและบริการจัดส่งด่วนทั่วประเทศ"
                    ),
                    "rating": rating_val,
                    "sold": sold_val,
                })

    return all_items


def save_mock_backup() -> None:
    """ฟังก์ชันคงไว้เพื่อความเข้ากันได้ของ Service (แต่ระบบเชื่อมต่อ MongoDB จริงโดยตรงแล้ว)"""
    pass


def init_db() -> None:
    """ลบผู้ใช้ Mock เดิมออก และเติมสินค้าให้ครบ 332 รายการใน MongoDB Atlas"""
    try:
        client.admin.command("ping")
        print(f"[MongoDB] Connected to {DATABASE_NAME} on MongoDB Atlas")

        # ลบบัญชี Mock เดิมที่มีรหัสผ่าน 'password' ออกทั้งหมด เพื่อให้ใช้ระบบสมัครสมาชิกจริงผ่าน Gmail OTP
        users_collection.delete_many({"username": {"$in": ["admin", "customer"]}, "password": "password"})

        current_count = products_collection.count_documents({})
        if current_count < 330:
            products_collection.delete_many({})
            full_catalog = build_332_products()
            products_collection.insert_many(full_catalog)
            print(f"[MongoDB] Seeded {len(full_catalog)} products across 10 categories into MongoDB Atlas.")
        else:
            print(f"[MongoDB] Catalog ready with {current_count} products in MongoDB Atlas.")
    except Exception as exc:
        print(f"[MongoDB Startup Warning] {exc}")
