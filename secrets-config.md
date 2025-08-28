# GitHub Secrets Configuration Guide
# ==================================
# 
# Все эти переменные должны быть добавлены в GitHub репозиторий:
# Settings → Secrets and variables → Actions → Repository secrets

# VPS Configuration
VPS_HOST=your-server.example.com
VPS_USER=deploy
VPS_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
# Ваш приватный SSH ключ для подключения к VPS
# Генерируется командой: ssh-keygen -t rsa -b 4096 -C "deploy@webrtc"
# Публичный ключ должен быть добавлен в ~/.ssh/authorized_keys на VPS
-----END OPENSSH PRIVATE KEY-----

# Domain Configuration  
DOMAIN=example.com
EMAIL_LETSENCRYPT=admin@example.com

# Security Keys
JWT_SIGNING_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
# Генерируется командой: openssl rand -hex 32

TURN_REALM=example.com
TURN_AUTH_SECRET=f8e7d6c5b4a39281
# Генерируется командой: openssl rand -hex 16

TURN_CRED_TTL=3600

# User Management
ALLOWED_USER_IDS=user1,user2,user3,admin
# Список разрешенных пользователей через запятую

# Contact List (JSON format)
CONTACT_LIST_JSON=[{"userId":"user1","publicKeys":{"identity":"MCowBQYDK2VuAyEAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx","signedPreKey":"MCowBQYDK2VuAyEAyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy","signature":"zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz"}},{"userId":"user2","publicKeys":{"identity":"MCowBQYDK2VuAyEAaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","signedPreKey":"MCowBQYDK2VuAyEAbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","signature":"cccccccccccccccccccccccccccccccccccccccccccccccccc"}}]

# Service URLs
SIGNALING_PUBLIC_URL=wss://api.example.com/ws
APP_PUBLIC_URL=https://example.com

# Rate Limiting (JSON format)
RATE_LIMITS_JSON={"global":100,"auth":5,"websocket":10}

# ====================================
# Инструкции по настройке:
# ====================================

# 1. Замените example.com на ваш реальный домен
# 2. Замените admin@example.com на ваш email для Let's Encrypt
# 3. Сгенерируйте все ключи используя указанные команды
# 4. Создайте SSH ключ для развертывания на VPS
# 5. Настройте DNS записи:
#    - A record: example.com → IP_адрес_VPS
#    - A record: api.example.com → IP_адрес_VPS
#    - A record: turn.example.com → IP_адрес_VPS (опционально)

# 6. Убедитесь что на VPS:
#    - Установлен Docker и Docker Compose
#    - Открыты порты: 22 (SSH), 80, 443, 3478, 49152-65535
#    - Создан пользователь для развертывания с sudo правами

# ====================================
# Генерация ключей:
# ====================================

# JWT Signing Key:
# openssl rand -hex 32

# TURN Auth Secret:
# openssl rand -hex 16

# SSH Key для развертывания:
# ssh-keygen -t rsa -b 4096 -C "deploy@webrtc" -f ~/.ssh/webrtc_deploy
# cat ~/.ssh/webrtc_deploy  # Это приватный ключ для VPS_SSH_KEY
# cat ~/.ssh/webrtc_deploy.pub  # Этот публичный ключ добавить в ~/.ssh/authorized_keys на VPS

# ====================================
# Тестирование конфигурации:
# ====================================

# После настройки всех secrets, проверьте:
# 1. SSH подключение к VPS
# 2. Доступность портов
# 3. Правильность DNS записей: nslookup example.com
# 4. Автоматическое развертывание через GitHub Actions

# ====================================
# Безопасность:
# ====================================

# - Никогда не коммитьте реальные ключи в репозиторий
# - Используйте сильные пароли и ключи
# - Регулярно ротируйте секреты
# - Ограничьте доступ к репозиторию
# - Используйте отдельного пользователя для развертывания на VPS
