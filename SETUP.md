# 🚀 AutoTranslate Pro - Setup Guide (v2.0)

## ✅ Tính Năng Mới

### 1. **Dashboard Admin Bí Mật** 🔐
- URL: `http://localhost:3000/admin.html`
- Chỉ người dùng có **admin key** mới có thể truy cập
- Admin có thể:
  - ➕ **CRUD ASI101 Terms**: Thêm, sửa, xóa thuật ngữ
  - ⏳ **Duyệt Pending Terms**: Duyệt/từ chối từ AI dịch chưa có trong dictionary
  - 📊 **Xem Metrics**: Theo dõi số từ dịch, lỗi API, response time, request limit
  - 💬 **Xem Feedback Log**: Xem báo cáo lỗi dịch từ người dùng
  - 📥 **Export Excel**: Tải xuống dữ liệu dictionary thành CSV

### 2. **Nút "Báo Lỗi Dịch"** 🐛
- Mỗi kết quả dịch trong bảng có nút "🐛 Báo lỗi"
- Người dùng có thể báo cáo lỗi hoặc đề xuất cải tiến
- Dữ liệu được lưu vào database (local, Firebase, hoặc Supabase)

### 3. **Metrics & Monitoring** 📈
- Theo dõi số từ dịch hôm nay
- Tỉ lệ lỗi API 
- Response time trung bình
- Cảnh báo khi vượt request limit

### 4. **CI/CD Pipeline** 🔄
- Tự động test trước khi deploy
- Deploy đến **Vercel** hoặc **Docker Hub**
- Security check (kiểm tra admin key không bị hardcode)

### 5. **Authentication System (JWT)** 🔐
- Hệ thống đăng nhập/đăng ký người dùng
- JWT token dùng quản lý session
- Admin phê duyệt tài khoản mới trước khi sử dụng
- Hỗ trợ reset mật khẩu qua email
- Lưu lịch sử dịch per user

---

## 🔐 Hệ Thống Authentication (JWT)

### Tài Khoản Admin Mặc Định

```
Email: linh.letrong@fpt.com
Mật khẩu: Cần thay đổi ngay sau triển khai
Tên: Lê Trọng Quyền Linh
Role: Admin
```

### Quy Trình Đăng Ký Người Dùng

1. **Người dùng Đăng Ký** (Trang `/register.html`):
   - Nhập Họ/Tên, Email, Mã Nhân Viên (FPT), Mật Khẩu
   - Hệ thống lưu với trạng thái "Chờ Duyệt"
   - Email xác nhận được gửi

2. **Admin Phê Duyệt** (Trang `/approval-users.html`):
   - Xem danh sách tài khoản chờ duyệt
   - Click "Duyệt" hoặc "Từ Chối"
   - Người dùng nhận email xác nhận

3. **Người Dùng Đăng Nhập** (Trang `/login.html`):
   - Email/Mật khẩu
   - Nhận JWT token (hợp lệ 7 ngày)
   - Redirect: Admin → `/admin.html`, Người dùng → `/web.html`

### Các Trang Authentication

| URL | Mục Đích | Ai Được Truy Cập |
|-----|----------|----------|
| `/login.html` | Đăng nhập | Công khai |
| `/register.html` | Đăng ký tài khoản | Công khai |
| `/forgot-password.html` | Reset mật khẩu | Công khai |
| `/approval-users.html` | Duyệt tài khoản | Chỉ Admin |
| `/admin.html` | Dashboard Admin | Chỉ Admin |
| `/web.html` | Trang Dịch | Người dùng đã login |
| `/profile.html` | Hồ sơ cá nhân | Người dùng đã login |
| `/history.html` | Lịch sử dịch | Người dùng đã login |

### Biến Môi Trường JWT

```env
# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production-very-long-and-random-string
JWT_EXPIRES_IN=7d

# Email Configuration (cho thông báo đăng ký)
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ADMIN_EMAIL=admin@fpt.com
```

### Lưu Lịch Sử Dịch

Mỗi lần người dùng dịch từ, hệ thống tự động:
1. Lưu vào localStorage (máy tính họ)
2. Sync với backend (file `users.json`, trường `translationHistory`)
3. Người dùng xem lại của mình ở trang `/history.html`

Dữ liệu lưu:
- Source text
- Ngôn ngữ nguồn
- Các bản dịch (EN, VI, JA, ZH)
- Timestamp

---

## 🔧 Cấu Hình

### Bước 1: Đặt biến môi trường

Copy file `.env.example` thành `.env` và điền thông tin:

```bash
cd "web dich"
cp .env.example .env
```

Sửa `.env`:

```env
# API Keys (giữ nguyên từ trước)
GOOGLE_TRANSLATE_API_KEY=your_key
OPENAI_API_KEY=your_key
GEMINI_API_KEY=your_key

# 🔐 Admin Configuration (ĐỔI NGAY SAU KHI DEPLOY!)
ADMIN_SECRET_KEY=your-secret-admin-key-12345

# Feedback Database (chọn 1 trong 3)
FEEDBACK_DB_TYPE=local  # 'local', 'firebase', 'supabase'
FIREBASE_URL=  # Nếu dùng Firebase
SUPABASE_URL=  # Nếu dùng Supabase
SUPABASE_KEY=  # Nếu dùng Supabase

# Monitoring
REQUEST_LIMIT_PER_HOUR=1000
ERROR_RATE_THRESHOLD=0.1  # 10%
PORT=3000
```

### Bước 2: Cài đặt Dependencies

```bash
npm install
```

### Bước 3: Chạy Server

```bash
npm start
```

Server chạy tại `http://localhost:3000`

### Bước 4: Truy cập Dashboard Admin

1. Mở `http://localhost:3000/admin.html`
2. Nhập **Admin Key** từ file `.env` vào form
3. Click "🔓 Unlock Admin Panel"

---

## 🔗 Tích Hợp Firebase (Optional)

### Cách 1: Sử dụng Firebase Realtime Database

1. Tạo project ở https://console.firebase.google.com
2. Chọn **Realtime Database** > **Create Database**
3. Copy URL từ Firebase Console
4. Cập nhật `.env`:

```env
FEEDBACK_DB_TYPE=firebase
FIREBASE_URL=https://your-project.firebaseio.com
```

5. Thêm Security Rules vào Firebase (cho phép POST yêu cầu):

```json
{
  "rules": {
    "feedback": {
      ".write": true,
      ".read": "root.child('admin').val() === auth.uid"
    }
  }
}
```

### Cách 2: Sử dụng Supabase

1. Tạo project ở https://supabase.com
2. Tạo bảng `feedback` với cấu trúc:
   ```sql
   CREATE TABLE feedback (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     timestamp TIMESTAMP DEFAULT now(),
     sourceText TEXT,
     translatedText TEXT,
     feedbackType TEXT,
     message TEXT,
     userEmail TEXT
   );
   ```
3. Copy URL và API Key
4. Cập nhật `.env`:

```env
FEEDBACK_DB_TYPE=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

---

## � Cấu Hình Email Notifications (Optional)

Khi người dùng gửi đóng góp từ vựng mới, hệ thống có thể gửi email thông báo tới admin.

### Cấu Hình Gmail (Khuyên Dùng)

1. **Bước 1: Kích hoạt 2-Step Verification**
   - Truy cập https://myaccount.google.com/security
   - Chọn **2-Step Verification** và hoàn thành setup

2. **Bước 2: Tạo App Password**
   - Vào https://myaccount.google.com/apppasswords
   - Chọn App: **Mail**
   - Chọn Device: **Windows Computer** (hoặc device của bạn)
   - Google sẽ sinh ra **16-ký tự mật khẩu**
   - Copy mật khẩu và tạm thời lưu nơi an toàn

3. **Bước 3: Cập nhật `.env`**
   ```env
   SMTP_ENABLED=true
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  # App password (khoảng trống là bình thường)
   ADMIN_EMAIL=your-gmail@gmail.com  # Email để nhận thông báo
   ```

4. **Bước 4: Test Email**
   - Gửi một đóng góp từ vựng từ trang web
   - Kiểm tra inbox email admin
   - Nếu không nhận, kiểm tra **Spam** folder

### Cấu Hình Outlook/Hotmail

```env
SMTP_ENABLED=true
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
ADMIN_EMAIL=your-email@outlook.com
```

### Cấu Hình Corporate Email (Ví dụ: Công ty FPT)

```env
SMTP_ENABLED=true
SMTP_HOST=mail.fpt.com.vn  # Hoặc SMTP server của công ty
SMTP_PORT=587
SMTP_USER=your-email@fpt.com.vn
SMTP_PASS=your-password
ADMIN_EMAIL=your-email@fpt.com.vn
```

### Vô Hiệu Hóa Email (Mặc Định)

Nếu không cần email notifications, chỉ cần để `SMTP_ENABLED=false`:

```env
SMTP_ENABLED=false
```

Hệ thống sẽ vẫn:
- ✅ Lưu đóng góp vào `contributions.json`
- ✅ Tự động thêm vào pending terms cho admin duyệt
- ✅ Hiện real-time notification trên Admin Dashboard (via localStorage)
- ❌ Không gửi email

---

## �📤 Deploy lên Vercel

### Cách 1: Sử dụng GitHub Actions (Tự động)

1. Push code lên GitHub
2. Thêm secrets vào GitHub Settings > Secrets:
   ```
   VERCEL_TOKEN
   VERCEL_ORG_ID
   VERCEL_PROJECT_ID
   ADMIN_SECRET_KEY
   GOOGLE_TRANSLATE_API_KEY
   OPENAI_API_KEY
   SMTP_ENABLED
   SMTP_HOST
   SMTP_PORT
   SMTP_USER
   SMTP_PASS
   ADMIN_EMAIL
   ... (tất cả ENV variables)
   ```
3. Push lên branch `main` → tự động test & deploy

### Cách 2: Deploy thủ công

1. Cài Vercel CLI: `npm install -g vercel`
2. Chạy: `vercel`
3. Follow hướng dẫn
4. Vercel sẽ access `.env` từ local

---

## 🐳 Deploy lên Docker Hub

### Cách 1: Sử dụng GitHub Actions (Tự động)

1. Thêm Docker secrets vào GitHub:
   ```
   DOCKER_USERNAME (Docker Hub username)
   DOCKER_PASSWORD (Docker Hub token/password)
   ```
2. Push lên branch `main` → tự động build & push image

### Cách 2: Build & Push thủ công

```bash
docker build -t your-docker-username/autotranslate-pro:latest \
  --build-arg ADMIN_SECRET_KEY=your-key \
  --build-arg GOOGLE_TRANSLATE_API_KEY=your-key \
  .

docker push your-docker-username/autotranslate-pro:latest
```

### Chạy Docker container

```bash
docker run -p 3000:3000 \
  -e ADMIN_SECRET_KEY=your-key \
  -e GOOGLE_TRANSLATE_API_KEY=your-key \
  your-docker-username/autotranslate-pro
```

---

## 🧪 Test API

### Test Translation Endpoint

```bash
curl -X POST http://localhost:3000/api/translate-fallback \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "sourceLanguageHint": "en"
  }'
```

### Test Admin Metrics

```bash
curl -X POST http://localhost:3000/api/admin/metrics \
  -H "X-Admin-Key: your-admin-key" \
  -H "Content-Type: application/json"
```

### Test Feedback Submission

```bash
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "sourceText": "Hello",
    "translatedText": "Xin chào",
    "feedbackType": "error",
    "message": "Bản dịch không chính xác",
    "userEmail": "user@example.com"
  }'
```

---

## 🔍 Troubleshooting

### "Admin key không hợp lệ"
- Kiểm tra `ADMIN_SECRET_KEY` trong `.env` có match với admin.html hay không

### "API AI: Chưa sẵn sàng"
- Kiểm tra `OPENAI_API_KEY` hoặc `GEMINI_API_KEY` trong `.env`
- Chắc chắn internet connection bình thường

### "Không thể tải dictionary.json"
- Kiểm tra file `dictionary.json` có tồn tại không
- JSON syntax có hợp lệ không: `node -e "JSON.parse(require('fs').readFileSync('dictionary.json'))"`

### "Firebase/Supabase feedback không gửi"
- Kiểm tra `FEEDBACK_DB_TYPE` có đúng không
- Kiểm tra URL và API key
- Mở browser DevTools > Console xem error message

---

## 📊 Monitoring Metrics

Dashboard Admin sẽ hiển thị:

| Metric | Ý Nghĩa | Cảnh báo |
|--------|---------|---------|
| Từ dịch hôm nay | Tổng số từ/cụm từ đã dịch | Không có |
| Tỉ lệ lỗi API | % request bị lỗi | > 10% → ⚠️ |
| Response time | Thời gian phản hồi trung bình | > 1s → chậm |
| Requests giờ cuối | Số request trong 60 phút gần nhất | > 1000 → vượt limit |

---

## 🔐 Security Best Practices

1. **Đổi admin key sau khi deploy**: không để mặc định `admin-dev-key-change-in-production`
2. **Không commit `.env` lên GitHub**: thêm `.env` vào `.gitignore`
3. **Dùng GitHub Secrets**: để store API keys thay vì hardcode
4. **Enable HTTPS trên Vercel/Docker**: Vercel tự động, Docker thêm reverse proxy (nginx)
5. **Rotate API keys định kỳ**: Google/OpenAI key nên đổi mỗi 3 tháng

---

## 📚 Tài Liệu Thêm

- [Vercel Deployment](https://vercel.com/docs/deploy)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Firebase Security Rules](https://firebase.google.com/docs/database/security)
- [Supabase Documentation](https://supabase.com/docs)

---

**Phiên bản**: 2.0 (April 2026)  
**Phát triển bởi**: Lê Trọng Quyền Linh  
**Support**: Hỏi trong GitHub Issues
