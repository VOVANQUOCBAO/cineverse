# Triển khai CINEVERSE và Google Sign-In

## 1. Database

CINEVERSE cần một MySQL/MariaDB có thể truy cập từ Internet. `127.0.0.1` chỉ dùng được khi chạy local và sẽ không hoạt động trong Vercel Functions.

1. Tạo database MySQL/MariaDB production.
2. Chạy `database/01_schema.sql`, sau đó `database/02_seed.sql` nếu cần dữ liệu demo.
3. Với database cũ, chạy thêm `database/03_google_auth.sql`.
4. Khai báo trên Vercel: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` và `JWT_SECRET`.

## 2. Tạo Google OAuth Client

Trong Google Cloud Console:

1. Mở **Google Auth Platform → Clients**.
2. Tạo client loại **Web application**.
3. Thêm **Authorized JavaScript origins**:
   - `http://localhost:5000`
   - URL production, ví dụ `https://cineverse.example.com`
   - URL Vercel production nếu vẫn sử dụng, ví dụ `https://cineverse.vercel.app`
4. Hoàn thiện Branding, homepage và privacy policy trong Google Auth Platform.
5. Sao chép Web Client ID có dạng `...apps.googleusercontent.com`.

Không cần Client Secret cho luồng Google Identity Services đang dùng. Backend nhận ID token và kiểm tra chữ ký cùng `audience` bằng `google-auth-library`.

## 3. Environment variables

Thêm cùng một `GOOGLE_CLIENT_ID` cho Development, Preview và Production trên Vercel:

```bash
vercel env add GOOGLE_CLIENT_ID development
vercel env add GOOGLE_CLIENT_ID preview
vercel env add GOOGLE_CLIENT_ID production
```

Sau khi thay đổi biến môi trường, redeploy dự án. Với local, điền Client ID vào `server/.env` rồi khởi động lại backend.

## 4. Quy tắc tài khoản

- Lần đầu khách hàng dùng Google: hệ thống tự tạo tài khoản.
- Email khách đã tồn tại: hệ thống liên kết Google vào tài khoản đó.
- Nhân viên, quản lý và quản trị luôn đăng nhập bằng email/mật khẩu; Google không được phép tự cấp quyền nội bộ.
