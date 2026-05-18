# 🚀 DEPLOY GUIDE — HYB GAS Manager

Hướng dẫn đầy đủ để triển khai GAS Manager lên Google Apps Script cho một **Google Sheets mới** bất kỳ.

---

## 📋 MỤC LỤC

1. [Yêu cầu cài đặt](#1-yêu-cầu-cài-đặt)
2. [Clone code từ GitHub](#2-clone-code-từ-github)
3. [Tạo Google Sheets mới](#3-tạo-google-sheets-mới)
4. [Kết nối Apps Script với Sheets](#4-kết-nối-apps-script-với-sheets)
5. [Cấu hình .clasp.json](#5-cấu-hình-claspjson)
6. [Build frontend](#6-build-frontend)
7. [Push code lên GAS](#7-push-code-lên-gas)
8. [Deploy Web App](#8-deploy-web-app)
9. [Khởi tạo Database (Sheets)](#9-khởi-tạo-database-sheets)
10. [Seed Danh Mục Mặc Định](#10-seed-danh-mục-mặc-định)
11. [Cấu hình tùy chọn](#11-cấu-hình-tùy-chọn)
12. [Cập nhật code lên GitHub](#12-cập-nhật-code-lên-github)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Yêu Cầu Cài Đặt

Cài các công cụ sau trước khi bắt đầu:

```bash
# Node.js >= 18
# https://nodejs.org

# clasp (Google Apps Script CLI)
npm install -g @google/clasp

# Đăng nhập tài khoản Google
clasp login
```

> **Lưu ý:** Sau `clasp login`, trình duyệt sẽ mở để xác thực. Chọn đúng tài khoản Google chứa Sheets của bạn.

---

## 2. Clone Code Từ GitHub

```bash
git clone https://github.com/haiyenpa25/HYBApp.git
cd HYBApp/gas-manager
```

Cài dependencies cho frontend:

```bash
cd frontend
npm install
cd ..
```

---

## 3. Tạo Google Sheets Mới

1. Truy cập **[sheets.google.com](https://sheets.google.com)**
2. Click **"+ Tạo bảng tính mới"** (Blank spreadsheet)
3. Đặt tên: `HYB Manager` (hoặc tên tùy ý)
4. **Lưu lại URL** — bạn sẽ cần **Spreadsheet ID** từ URL:

```
https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
                                         ↑
                              Đây là Spreadsheet ID
```

---

## 4. Kết Nối Apps Script Với Sheets

### Bước 4a: Tạo Apps Script mới gắn với Sheets

1. Trong Google Sheets vừa tạo, vào menu: **Extensions → Apps Script**
2. Một tab mới mở ra — đây là Apps Script Project của bạn
3. **Lấy Script ID** từ URL:

```
https://script.google.com/home/projects/[SCRIPT_ID]/edit
                                          ↑
                               Đây là Script ID
```

### Bước 4b: Bật Google Apps Script API

1. Vào **[script.google.com/home/usersettings](https://script.google.com/home/usersettings)**
2. Bật **"Google Apps Script API"** → ON

---

## 5. Cấu Hình `.clasp.json`

Mở file `gas-manager/backend/.clasp.json` và thay Script ID:

```json
{
  "scriptId": "SCRIPT_ID_CỦA_BẠN_Ở_ĐÂY",
  "rootDir": "."
}
```

> ⚠️ **Không commit file `.clasp.json` lên GitHub công khai** nếu project là private — Script ID là thông tin nhạy cảm.

---

## 6. Build Frontend

```bash
cd gas-manager/frontend

# Build sản phẩm (tạo file index.html inline)
npm run build:gas
```

Lệnh này sẽ:
- Compile TypeScript + React → một file `dist/index.html` duy nhất
- Copy `dist/index.html` → `backend/index.html` (để clasp push lên GAS)

---

## 7. Push Code Lên GAS

```bash
cd gas-manager/backend

clasp push --force
```

Kết quả thành công:
```
Pushed 7 files.
└─ appsscript.json
└─ controllers/AppController.js
└─ controllers/TelegramController.js
└─ index.html
└─ main.js
└─ repositories/SheetRepository.js
└─ services/CalendarService.js
```

---

## 8. Deploy Web App

```bash
# Tạo deployment mới (lần đầu)
clasp deploy --description "v1-initial"
```

Lưu lại **Deployment ID** từ output:
```
Created version 1.
- [DEPLOYMENT_ID] @1.
```

**URL Web App của bạn:**
```
https://script.google.com/macros/s/[DEPLOYMENT_ID]/exec
```

> Hoặc vào Apps Script Editor → **Deploy → Manage deployments** để lấy URL.

### Cấu hình quyền truy cập:

Trong Apps Script Editor:
- **Deploy → New Deployment → Web App**
- Execute as: **Me (email của bạn)**
- Who has access: **Anyone** (để dùng được không cần đăng nhập)
- Click **Deploy** → Copy URL

---

## 9. Khởi Tạo Database (Sheets)

Hàm `initDatabase()` tự động tạo **tất cả các sheet** cần thiết với header đúng chuẩn.

### Chạy từ Apps Script Editor:

1. Vào Apps Script Editor của project
2. Ở thanh trên, chọn function: **`initDatabase`**
3. Click **▶ Run**
4. Lần đầu sẽ hỏi quyền → **Review permissions → Allow**

### Các sheet sẽ được tạo:

| Sheet | Mô tả | Các cột |
|---|---|---|
| `Wallets` | Ví tiền | ID, Name, Type, Balance |
| `Categories` | Danh mục | ID, Name, Type, Icon, Color |
| `Transactions` | Giao dịch | ID, WalletID, CategoryID, Amount, Type, Date, Note, FundID, DebtID |
| `Tasks` | Công việc | ID, Title, Status, Date, EventID, CalendarID, Priority, Subtasks, NoteID |
| `Goals` | Mục tiêu | ID, Title, TargetAmount, CurrentAmount, Icon, Color |
| `Habits` | Thói quen | ID, Title, Icon, Color, Streak, LastCheckedDate, History |
| `Budgets` | Ngân sách | ID, CategoryID, Amount, Month |
| `Funds` | Quỹ (Jars) | ID, Name, DefaultPercentage, Balance, Icon, Color |
| `Debts` | Công nợ | ID, PersonName, Type, PrincipalAmount, InterestRate, PaidAmount, Date, DueDate, Status |
| `Notes` | Ghi chú | ID, Title, Content, LastEdited |
| `UserStats` | Điểm EXP | ID, EXP, Level, Title |
| `Stocks` | Cổ phiếu | Ticker, Quantity, AveragePrice, CurrentPrice, LastUpdated |
| `StockTransactions` | GD Cổ phiếu | ID, Ticker, Type, Quantity, Price, Fee, Tax, Date, WalletID, FundID, Note |

---

## 10. Seed Danh Mục Mặc Định

Sau khi `initDatabase` chạy xong, seed **116 danh mục** thu/chi được thiết kế sẵn:

### Cách 1: Qua giao diện App (Khuyến nghị)

1. Mở URL Web App
2. Vào **Chi tiêu** → Form ghi chép → **"⚙️ Quản lý danh mục"**
3. Click nút **"✨ Tạo đầy đủ danh mục mặc định (116 mục)"**
4. Xác nhận → Chờ ~15 giây → Xong

### Cách 2: Qua Apps Script Editor

1. Chọn function **`seedCategories`**
2. Click **▶ Run**

### Danh mục được tạo:

**Chi tiêu (10 nhóm):**
- 🏠 Nhà & Sinh hoạt (13 mục): Tiền thuê nhà, Tiền điện EVN, Tiền nước, Internet, Gas...
- 🍔 Ăn uống (7 mục): Đi chợ, Ăn ngoài, Cà phê, Đặt online...
- 🚗 Di chuyển (9 mục): Xăng xe, Sửa xe, Grab/Taxi, Phí cầu đường...
- 🏥 Sức khỏe (9 mục): Khám bệnh, Thuốc, Nha khoa, Bảo hiểm...
- 📚 Giáo dục (7 mục): Học phí con, Khóa học online, Sách...
- 🎮 Giải trí & Mua sắm (12 mục): Quần áo, Điện thoại, Du lịch...
- ⛪ **Nhà Thờ & Tín ngưỡng** (8 mục): Tiền dâng, Phần mười, Công tác xã hội...
- 👨‍👩‍👧 **Gia đình & Biếu tặng** (10 mục): Gia đình chồng/vợ, Lì xì, Đám tiệc...
- 💳 Tài chính & Vay nợ (8 mục): Trả nợ ngân hàng, Bảo hiểm nhân thọ...
- 💼 Công việc (7 mục): Thiết bị, Marketing, Công tác...

**Thu nhập (3 nhóm):**
- 💼 Lương & Công việc (8 mục): Lương cứng, Thưởng, Phụ cấp...
- 💹 Thu nhập phụ (7 mục): Freelance, Cho thuê, Lãi ngân hàng...
- 🎁 Thu nhập bất thường (8 mục): Quà tặng, Bán đồ cũ, Hoàn tiền...

---

## 11. Cấu Hình Tùy Chọn

### 11a. Thiết lập Ví Mặc Định

Sau khi init DB, thêm ví đầu tiên qua app:
- Vào **Chi tiêu** → Thanh ví → **"+ Thêm ví"**
- Đặt tên và số dư ban đầu

### 11b. Cài Đặt Báo Cáo Telegram (Tùy chọn)

Nếu muốn nhận báo cáo tự động qua Telegram:

1. Tạo bot qua **[@BotFather](https://t.me/BotFather)** → lấy **Bot Token**
2. Trong Apps Script Editor, vào **Project Settings → Script Properties**:
   ```
   TELEGRAM_BOT_TOKEN = your_bot_token_here
   ```
3. Chạy function **`setupDailyTrigger`** để bật cron job 7h sáng mỗi ngày

### 11c. Kết Nối Google Calendar (Tùy chọn)

Trong Apps Script, thêm scope calendar vào `appsscript.json` (đã có sẵn).
Khi dùng tính năng tạo sự kiện, GAS sẽ tự yêu cầu quyền.

---

## 12. Cập Nhật Code Lên GitHub

Mỗi khi thay đổi code:

```bash
cd d:/Xampp/htdocs/hyb  # hoặc thư mục project của bạn

git add .
git commit -m "feat: mô tả thay đổi"
git push origin main
```

### Sau khi thay đổi code frontend:

```bash
# 1. Build lại
cd gas-manager/frontend
npm run build:gas

# 2. Push lên GAS
cd ../backend
clasp push --force

# 3. Tạo version deploy mới
clasp deploy --deploymentId [DEPLOYMENT_ID_CŨ] --description "v2-update"
```

> **Quan trọng:** Mỗi lần thay đổi backend phải `clasp push` rồi `clasp deploy` để production cập nhật.

---

## 13. Troubleshooting

### ❌ Lỗi: "Script function not found"
→ Chạy `clasp push --force` lại, sau đó `clasp deploy` tạo version mới

### ❌ Lỗi: "Authorization required"
→ Vào Apps Script Editor, chạy bất kỳ function nào, chọn **Allow** khi được hỏi quyền

### ❌ Lỗi: "Exceeded maximum execution time"
→ `seedCategories` mất ~20-30s là bình thường, GAS có limit 6 phút/lần

### ❌ App hiện trắng / loading mãi
→ Kiểm tra `clasp deploy` đã chạy chưa (chỉ `push` thôi chưa đủ)

### ❌ Danh mục không hiện sau seed
→ Reload lại trang web app (Ctrl+Shift+R), cache GAS có thể delay 30-60s

### ❌ `clasp login` không hoạt động
```bash
# Xóa credentials cũ
clasp logout
clasp login --no-localhost
```

---

## 📁 Cấu Trúc Project

```
HYBApp/
└── gas-manager/
    ├── backend/               ← GAS backend
    │   ├── .clasp.json        ← Script ID (cần cập nhật cho mỗi project)
    │   ├── appsscript.json    ← Manifest (timezone, scopes)
    │   ├── main.js            ← doGet, initDatabase, triggers
    │   ├── index.html         ← Built frontend (tự động tạo khi build)
    │   ├── controllers/
    │   │   └── AppController.js  ← Toàn bộ business logic
    │   └── repositories/
    │       └── SheetRepository.js ← Data access layer
    ├── frontend/              ← React + TypeScript source
    │   ├── src/
    │   │   ├── components/    ← UI Components
    │   │   ├── utils/gas.ts   ← GAS API bridge
    │   │   └── ...
    │   ├── package.json
    │   └── vite.config.ts
    └── DEPLOY.md              ← File này
```

---

## ⚡ Quick Start — Tóm Tắt Nhanh

```bash
# 1. Clone
git clone https://github.com/haiyenpa25/HYBApp.git
cd HYBApp/gas-manager/frontend && npm install

# 2. Tạo Google Sheets mới → lấy Script ID từ Extensions > Apps Script

# 3. Cập nhật Script ID
# Sửa backend/.clasp.json: {"scriptId": "YOUR_SCRIPT_ID"}

# 4. Build + Push
npm run build:gas
cd ../backend
clasp push --force
clasp deploy --description "v1"

# 5. Trong Apps Script Editor: Run initDatabase → Run seedCategories

# 6. Mở URL web app → XONG! 🎉
```

---

*Tài liệu này được tạo bởi Antigravity AI cho dự án HYBApp.*
*Cập nhật lần cuối: 2026-05-18*
