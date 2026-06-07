# Hướng Dẫn Triển Khai Hệ Thống Lên VPS Ubuntu

Tài liệu này hướng dẫn chi tiết cách triển khai ứng dụng quản lý sân bóng mini Next.js 15 và SQLite lên một máy chủ VPS chạy hệ điều hành Ubuntu (phiên bản khuyến nghị: 20.04 LTS hoặc 22.04 LTS) sử dụng Docker & Docker Compose và cấu hình Nginx Reverse Proxy kèm chứng chỉ SSL Let's Encrypt miễn phí.

---

## Bước 1: Cập Nhật Hệ Thống & Cài Đặt Docker

Đầu tiên, hãy kết nối vào VPS của bạn qua SSH và chạy các lệnh sau để cập nhật hệ thống và cài đặt Docker cùng các gói cần thiết:

```bash
# Cập nhật danh sách gói
sudo apt update && sudo apt upgrade -y

# Cài đặt các thư viện bổ sung
sudo apt install -y curl git apt-transport-https ca-certificates gnupg lsb-release

# Thêm khóa GPG của Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Thêm kho lưu trữ của Docker vào APT
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Cài đặt Docker Engine và Docker Compose v2
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Khởi động dịch vụ Docker và thiết lập khởi động cùng hệ thống
sudo systemctl start docker
sudo systemctl enable docker

# Kiểm tra phiên bản Docker
docker --version
docker compose version
```

---

## Bước 2: Chuẩn Bị Mã Nguồn Trên VPS

1. Tạo một thư mục làm việc trên VPS và chuyển mã nguồn dự án vào thư mục đó:
   ```bash
   mkdir -p /var/www/football-pitch-manager
   cd /var/www/football-pitch-manager
   ```
   *Lưu ý: Bạn có thể sử dụng Git để clone trực tiếp mã nguồn từ GitHub/GitLab hoặc dùng SFTP để upload toàn bộ file lên thư mục này.*

2. Cấu hình biến môi trường cho ứng dụng trong tệp `docker-compose.prod.yml`:
   *Để chỉnh sửa cấu hình trực tiếp, bạn có thể chỉnh sửa `docker-compose.prod.yml` bằng lệnh:*
   ```bash
   nano docker-compose.prod.yml
   ```
   *Cập nhật các giá trị thích hợp như `NEXT_PUBLIC_APP_URL` (thành domain HTTPS thật của bạn để bật được Camera quét QR code), thông tin gửi email SMTP (`SMTP_USER`, `SMTP_PASS`) và thay thế khóa bảo mật JWT `JWT_SECRET`.*

---

## Bước 3: Khởi Chạy Dự Án Với Docker Compose

Chạy lệnh Docker Compose để tự động build mã nguồn Next.js thông qua Dockerfile và khởi chạy dịch vụ dưới chế độ nền (detached mode):

```bash
# Khởi chạy dịch vụ và build ứng dụng
sudo docker compose -f docker-compose.prod.yml up --build -d

# Xem danh sách các container đang chạy để kiểm tra trạng thái
sudo docker ps
```

---

## Bước 4: Nạp Dữ Liệu Mẫu (Tùy Chọn)

Khi container khởi chạy lần đầu tiên, hệ thống sẽ tự động khởi tạo tệp cơ sở dữ liệu SQLite tại thư mục volume persistent (`/app/data/dev.db`) và đồng bộ toàn bộ bảng (Prisma schema) tự động nhờ lệnh khởi chạy tích hợp sẵn trong container.

Nếu bạn muốn nạp dữ liệu mẫu (sân bóng demo, tài khoản admin/staff/customer và một số lịch đặt sân giả lập) để chạy thử nghiệm trên VPS, hãy thực hiện lệnh sau:

```bash
# 1. Tìm ID của container Next.js
WEB_CONTAINER_ID=$(sudo docker ps -qf "name=football-pitch-web")

# 2. Chạy lệnh seed dữ liệu mẫu
sudo docker exec -it $WEB_CONTAINER_ID npx prisma db seed
```

*Lưu ý: Chỉ nên chạy lệnh seed một lần khi khởi tạo hệ thống để tránh làm trùng lặp dữ liệu.*

---

## Bước 5: Cấu Hình Nginx Làm Reverse Proxy

Chúng ta cần cài đặt Nginx để làm cầu nối định tuyến các yêu cầu từ cổng 80/443 của tên miền của bạn về cổng 3000 đang chạy của Docker Next.js.

1. Cài đặt Nginx trên Ubuntu:
   ```bash
   sudo apt install -y nginx
   sudo systemctl start nginx
   sudo systemctl enable nginx
   ```

2. Tạo file cấu hình cấu hình ảo cho tên miền của bạn (ví dụ: `sanbongmini.com`):
   ```bash
   sudo nano /etc/nginx/sites-available/sanbongmini.com
   ```

3. Thêm nội dung cấu hình sau vào file (thay thế `sanbongmini.com` bằng tên miền thật của bạn):
   ```nginx
   server {
       listen 80;
       server_name sanbongmini.com www.sanbongmini.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

4. Kích hoạt cấu hình và khởi động lại Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sanbongmini.com /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## Bước 6: Cấu Hình SSL Let's Encrypt Miễn Phí (HTTPS)

Để mã hóa kết nối giữa người dùng và máy chủ, đồng thời cho phép camera của Web App hoạt động (trình duyệt chỉ cho phép bật Camera quét QR code trên kết nối HTTPS bảo mật), bạn phải cài đặt chứng chỉ SSL.

Sử dụng Certbot để tự động cài đặt chứng chỉ SSL Let's Encrypt:

```bash
# Cài đặt Certbot và plugin Nginx
sudo apt install -y certbot python3-certbot-nginx

# Yêu cầu chứng chỉ SSL và tự động cấu hình Nginx
sudo certbot --nginx -d sanbongmini.com -d www.sanbongmini.com

# Chọn tự động Redirect toàn bộ HTTP sang HTTPS khi được hỏi.
```

Kiểm tra chứng chỉ Let's Encrypt tự động gia hạn định kỳ:
```bash
sudo certbot renew --dry-run
```

Chúc mừng! Hệ thống quản lý đặt sân bóng mini của bạn hiện đã được triển khai trực tuyến thành công, bảo mật bằng HTTPS và hoạt động ổn định trên môi trường production VPS Ubuntu.
