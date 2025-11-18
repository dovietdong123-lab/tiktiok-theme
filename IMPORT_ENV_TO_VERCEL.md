# Hướng dẫn Import Environment Variables từ file .env vào Vercel

## Bước 1: Tạo file .env từ template

1. Copy file `.env.example` thành `.env`:
   ```bash
   cd D:\tiktiok-theme\k1
   copy .env.example .env
   ```

2. Hoặc tạo file `.env` mới và copy nội dung từ `.env.example`

3. Điền thông tin thực tế vào file `.env`:
   ```env
   DB_HOST=gateway01.ap-southeast-1.prod.aws.tidbcloud.com
   DB_USER=root
   DB_PASSWORD=your-actual-password
   DB_NAME=your-database-name
   DB_PORT=4000
   PASSWORD_SALT=your-random-salt-key
   SESSION_SECRET=your-random-session-secret
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

## Bước 2: Import vào Vercel

### Cách 1: Import qua Vercel Dashboard (Khuyến nghị)

1. **Mở file `.env`** và copy tất cả nội dung

2. **Vào Vercel Dashboard:**
   - Truy cập: https://vercel.com
   - Chọn project của bạn
   - Vào **Settings** > **Environment Variables**

3. **Thêm từng biến:**
   - Với mỗi dòng trong file `.env`, thêm vào Vercel:
     - **Key:** Tên biến (ví dụ: `DB_HOST`)
     - **Value:** Giá trị (ví dụ: `gateway01.ap-southeast-1.prod.aws.tidbcloud.com`)
     - **Environment:** Chọn tất cả (Production, Preview, Development)

4. **Lưu ý:** Bỏ qua các dòng:
   - Dòng comment (bắt đầu bằng `#`)
   - Dòng trống
   - `NODE_ENV` (Vercel tự động set)

### Cách 2: Import qua Vercel CLI

#### Cài đặt Vercel CLI (nếu chưa có):
```bash
npm i -g vercel
```

#### Login vào Vercel:
```bash
vercel login
```

#### Import từ file .env:
```bash
cd D:\tiktiok-theme\k1

# Import tất cả biến từ file .env
# Lưu ý: Cần format lại file .env thành format Vercel CLI

# Hoặc import từng biến một:
vercel env add DB_HOST production < .env
vercel env add DB_USER production < .env
vercel env add DB_PASSWORD production < .env
vercel env add DB_NAME production < .env
vercel env add DB_PORT production < .env
vercel env add PASSWORD_SALT production < .env
vercel env add SESSION_SECRET production < .env
vercel env add NEXT_PUBLIC_APP_URL production < .env
```

**Lưu ý:** Cách này không tự động parse file `.env`, bạn cần nhập giá trị thủ công khi được hỏi.

### Cách 3: Sử dụng script tự động (PowerShell)

Tạo file `import-env.ps1`:

```powershell
# import-env.ps1
$envFile = ".env"
$projectPath = "D:\tiktiok-theme\k1"

cd $projectPath

if (-not (Test-Path $envFile)) {
    Write-Host "File .env không tồn tại!" -ForegroundColor Red
    exit 1
}

$lines = Get-Content $envFile | Where-Object { 
    $_ -notmatch '^\s*#' -and 
    $_ -notmatch '^\s*$' -and 
    $_ -notmatch '^NODE_ENV'
}

Write-Host "Các biến môi trường sẽ được thêm:" -ForegroundColor Green
foreach ($line in $lines) {
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        Write-Host "  $key = $value" -ForegroundColor Yellow
    }
}

Write-Host "`nVui lòng thêm các biến trên vào Vercel Dashboard:" -ForegroundColor Cyan
Write-Host "1. Vào https://vercel.com" -ForegroundColor White
Write-Host "2. Chọn project > Settings > Environment Variables" -ForegroundColor White
Write-Host "3. Thêm từng biến ở trên" -ForegroundColor White
```

Chạy script:
```powershell
cd D:\tiktiok-theme\k1
.\import-env.ps1
```

## Bước 3: Verify và Redeploy

1. **Kiểm tra trong Vercel Dashboard:**
   - Vào **Settings** > **Environment Variables**
   - Xác nhận tất cả biến đã được thêm

2. **Redeploy project:**
   - Vào tab **Deployments**
   - Click **"..."** (3 chấm) ở deployment mới nhất
   - Chọn **"Redeploy"**

3. **Kiểm tra build logs:**
   - Xem build có thành công không
   - Kiểm tra có lỗi database connection không

## Lưu ý quan trọng:

### 🔐 Bảo mật:
- **KHÔNG** commit file `.env` lên Git (đã được thêm vào `.gitignore`)
- Chỉ commit file `.env.example` (template)
- **KHÔNG** chia sẻ giá trị thực tế của các biến

### ✅ Checklist trước khi import:
- [ ] Đã tạo file `.env` từ `.env.example`
- [ ] Đã điền đầy đủ thông tin database
- [ ] Đã tạo `PASSWORD_SALT` và `SESSION_SECRET` ngẫu nhiên
- [ ] Đã kiểm tra `DB_HOST`, `DB_PORT` đúng format
- [ ] Đã test kết nối database local (nếu có)

### 🛠️ Generate random secrets:

**Windows PowerShell:**
```powershell
# Generate PASSWORD_SALT
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Generate SESSION_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Linux/Mac:**
```bash
# Generate PASSWORD_SALT
openssl rand -hex 32

# Generate SESSION_SECRET
openssl rand -hex 32
```

## Troubleshooting:

### Lỗi: "File .env not found"
- Kiểm tra đã tạo file `.env` chưa
- Kiểm tra đang ở đúng thư mục `k1`

### Lỗi: "Environment variable not found" sau khi deploy
- Kiểm tra đã thêm biến vào Vercel chưa
- Kiểm tra đã chọn đúng environment (Production/Preview/Development)
- Redeploy lại project

### Lỗi: "Database connection failed"
- Kiểm tra `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` đúng chưa
- Kiểm tra database có cho phép connection từ Vercel IP không
- Kiểm tra firewall của database

## Tài liệu tham khảo:
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel CLI Environment Variables](https://vercel.com/docs/cli/env)
- File `VERCEL_ENV_SETUP.md` để biết cách thêm thủ công

