# ล้างแผลทัน — เกมจำลองสถานการณ์โรคพิษสุนัขบ้า

Next.js 14 (App Router, TypeScript) ทำหน้าที่เป็นทั้งหน้าเว็บและ API ภายใน (BFF) · MySQL 8 · เกม Unity WebGL ฝังในหน้า `/play`

## เริ่มใช้งาน

```bash
cp .env.example .env          # แก้รหัสผ่านและ JWT_SECRET
docker compose up -d db       # สร้าง MySQL และรัน db/01_schema.sql + db/02_seed.sql อัตโนมัติ
npm install
npm run dev                   # http://localhost:3000
```

ถ้าใช้ MySQL ของตัวเอง ให้รันไฟล์ใน `db/` ตามลำดับ (`01_schema.sql` แล้ว `02_seed.sql`) และแก้ค่า `DB_*` ใน `.env`

### สร้างผู้ดูแล (admin)
สมัครสมาชิกตามปกติ แล้วรัน
```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```
จากนั้นออกจากระบบและเข้าสู่ระบบใหม่ จะเห็นเมนู "แดชบอร์ด"

## โครงสร้าง

```
db/                 สคริปต์ MySQL (schema + ข้อมูลตั้งต้น)
src/lib/            db, auth (JWT cookie), http helper, zod schemas, levels, stats, leaderboard
src/app/api/        auth/*, levels, progress, leaderboard, quiz, admin/stats
src/app/            หน้า: /  /login  /register  /play  /leaderboard  /dashboard
src/components/     Nav, AuthForm, GameShell (ตัวโหลด Unity + bridge), Stars
src/middleware.ts   บังคับล็อกอินสำหรับ /play และ /dashboard
unity/              โค้ดฝั่ง Unity: GameBridge.cs และ RabiesBridge.jslib
```

## API

| Method | Path | สิทธิ์ | หน้าที่ |
|---|---|---|---|
| POST | `/api/auth/register` | – | สมัครสมาชิก (ต้องติ๊กยินยอม PDPA) |
| POST | `/api/auth/login` · `/logout` | – | เข้า/ออกจากระบบ (cookie httpOnly) |
| GET | `/api/auth/me` | – | ข้อมูลผู้ใช้ปัจจุบัน |
| GET | `/api/levels` | – | รายการด่าน (+ความคืบหน้าถ้าล็อกอิน) |
| GET/POST | `/api/progress` | ผู้เล่น | ดู/บันทึกผลด่าน เซิร์ฟเวอร์คำนวณดาวและตรวจคะแนน/เวลา |
| GET | `/api/leaderboard?limit=50` | – | ตารางอันดับ |
| GET/POST | `/api/quiz` | ผู้เล่น | ดึงข้อสอบ (ไม่มีเฉลย) / ส่งคำตอบ ตรวจที่เซิร์ฟเวอร์ และบันทึก pre/post |
| GET | `/api/admin/stats` | admin | สถิติรวมสำหรับแดชบอร์ด |

## เชื่อม Unity WebGL

1. คัดลอก `unity/GameBridge.cs` ไป `Assets/Scripts/` และ `unity/RabiesBridge.jslib` ไป `Assets/Plugins/WebGL/`
2. สร้าง GameObject ชื่อ **GameBridge** ใน Scene แรก แล้วผูกสคริปต์ `GameBridge`
3. จบแต่ละด่านเรียก `GameBridge.Submit(levelId, score, seconds, decisions)`
4. Build เป็น WebGL โดยเปิด **Player Settings → Publishing → Decompression Fallback** (เพื่อไม่ต้องตั้งค่า header `Content-Encoding` เอง)
5. คัดลอกโฟลเดอร์ `Build/` ที่ได้ไปไว้ที่ `public/unity/Build/` และตั้ง `UNITY_BUILD_NAME` ใน `.env` เป็นชื่อไฟล์ (เช่น `rabies` สำหรับ `rabies.loader.js`)

โฟลว์ข้อมูล: Unity → `window.RabiesBridge.submitResult(json)` → `POST /api/progress` → MySQL → ผลสรุปส่งกลับ Unity ผ่าน `SendMessage('GameBridge','OnResultSaved', json)`

## ระบบดาว

เซิร์ฟเวอร์คำนวณเอง จากอัตราส่วนคะแนน/คะแนนเต็ม: ≥90% = 3 ดาว, ≥70% = 2 ดาว, ≥50% = 1 ดาว (ผ่านด่าน), ต่ำกว่านั้นไม่ผ่าน ปรับได้ที่ `starsFor()` ใน `src/lib/levels.ts`

## ก่อนขึ้นระบบจริง

- เนื้อหาด่านและข้อสอบใน `db/02_seed.sql` เป็นร่างเริ่มต้น **ต้องให้บุคลากรทางการแพทย์/สาธารณสุขตรวจสอบก่อนเผยแพร่**
- เปลี่ยนรหัสผ่านฐานข้อมูลและ `JWT_SECRET` และเปิด HTTPS (cookie จะเป็น `secure` อัตโนมัติใน production)
- ตัวจำกัดจำนวนครั้ง (`rateLimit` ใน `src/lib/http.ts`) เก็บใน memory ของเครื่องเดียว ถ้ารันหลาย instance ให้ย้ายไปใช้ Redis
- เพิ่มหน้านโยบายความเป็นส่วนตัวและช่องทางขอลบข้อมูลตาม PDPA (ตารางผูก `ON DELETE CASCADE` กับ `users` จึงลบข้อมูลทั้งหมดของผู้ใช้ได้ด้วยคำสั่งเดียว)
- คะแนนมาจากฝั่ง client จึงปลอมได้ในทางทฤษฎี ระบบนี้ตรวจเพดานคะแนนและเวลาขั้นต่ำเท่านั้น หากต้องการจริงจังกว่านี้ ให้ให้ Unity ส่ง log การตัดสินใจทั้งหมดแล้วให้เซิร์ฟเวอร์คำนวณคะแนนเอง
