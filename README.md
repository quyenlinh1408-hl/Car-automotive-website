# Hướng Dẫn Chia Sẻ Website Car Automotive

## Van Hanh Nhanh (Khuyen dung)

1. Chay local de kiem tra:
```bash
./start_server.ps1
```

2. Deploy chuan domain `quyenlinhfptauto.vn`:
- Xem huong dan chi tiet tai file `DEPLOY.md`.
- Project da co san cau hinh:
	- `netlify.toml` (Netlify)
	- `vercel.json` (Vercel)

3. Sau deploy, gui sitemap cho Google:
- `https://quyenlinhfptauto.vn/sitemap.xml`

## 🚀 Cách 1: Deploy Lên Hosting Miễn Phí (Khuyến Nghị)

### A. GitHub Pages (Miễn Phí, Dễ Dàng)
1. Tạo tài khoản GitHub: https://github.com
2. Tạo repository mới với tên: `car-automotive-website`
3. Upload tất cả files: `car.html`, `car.css`, `feedback.html`
4. Vào Settings > Pages > Source: Deploy from a branch
5. Chọn branch `main` và folder `/ (root)`
6. Website sẽ có địa chỉ: `https://YOUR_USERNAME.github.io/car-automotive-website/car.html`

### B. Netlify (Miễn Phí, Tự Động)
1. Đăng ký: https://netlify.com
2. Drag & drop folder chứa web vào trang chủ
3. Website sẽ có địa chỉ miễn phí ngay lập tức

### C. Vercel (Miễn Phí)
1. Đăng ký: https://vercel.com
2. Upload project và deploy

## 🖥️ Cách 2: Chạy Local Server (Cho Bạn Bè Trong Cùng Mạng)

### Bước 1: Cài Đặt Python
```bash
# Download từ: https://www.python.org/downloads/
# Hoặc dùng Microsoft Store: "Python"
```

### Bước 2: Chạy Server
```bash
cd "d:\CODE visual studio\Web VS code"
python -m http.server 8080 --bind 0.0.0.0
```

### Bước 3: Tìm IP Address
Mở Command Prompt và gõ:
```bash
ipconfig
```
Tìm địa chỉ IPv4 (ví dụ: 192.168.1.100)

### Bước 4: Chia Sẻ Với Bạn Bè
Gửi link: `http://192.168.1.100:8080/car.html`

## 📱 Cách 3: Chia Sẻ Files Trực Tiếp

1. Nén folder thành ZIP
2. Upload lên Google Drive/Dropbox
3. Chia sẻ link download
4. Bạn bè download và mở `car.html` trong browser

## ⚠️ Lưu Ý Quan Trọng

- **Firewall**: Có thể cần tắt firewall tạm thời
- **Port 8080**: Đảm bảo port không bị block
- **Cùng mạng**: Bạn bè phải cùng WiFi với bạn
- **HTTPS**: Hosting miễn phí không có HTTPS, chỉ HTTP

## 🔧 Troubleshooting

### Nếu bạn bè không truy cập được:
1. Kiểm tra IP address có đúng không
2. Tắt Windows Firewall tạm thời
3. Thử port khác: `python -m http.server 3000 --bind 0.0.0.0`
4. Kiểm tra bạn bè có cùng mạng WiFi

### Nếu server không khởi động:
1. Cài đặt Python đầy đủ
2. Chạy CMD as Administrator
3. Kiểm tra port 8080 có bị chiếm không

## 📞 Hỗ Trợ

Nếu vẫn không được, bạn có thể:
- Upload lên GitHub Pages (dễ nhất)
- Dùng hosting miễn phí khác
- Xin link demo từ tôi

---

**Địa chỉ website sau khi deploy:**
- GitHub: `https://username.github.io/car-automotive-website/car.html`
- Netlify: Tự động tạo (ví dụ: `https://car-automotive.netlify.app/car.html`)