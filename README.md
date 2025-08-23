# WebRTC E2EE Video Calling System

Защищенная система видеозвонков с сквозным шифрованием (E2EE) через WebRTC Encoded Transforms. Предназначена для работы в условиях блокировок и DPI в России с использованием TURN 443/TLS.

## 🔐 Ключевые особенности

- **Сквозное шифрование**: AES-GCM через WebRTC Encoded Transforms
- **Обход блокировок**: TURN сервер на порту 443/TLS для работы за CGNAT/DPI
- **Ограниченный доступ**: До 20 заранее авторизованных пользователей
- **Безопасность**: JWT аутентификация, ротация ключей, SAS проверка
- **Мобильная оптимизация**: Android-первый дизайн с адаптивным качеством
- **Автоматический деплой**: GitHub Actions → Docker Compose на VPS

## 🏗️ Архитектура

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Signaling API   │    │   TURN Server   │
│  (React + PWA)  │◄──►│ (Node.js + WS)   │    │    (CoTURN)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼─────────────┐
                    │    Reverse Proxy        │
                    │      (Nginx)            │
                    │  • HTTPS термеация      │
                    │  • WSS проксирование    │
                    │  • TCP stream для TURN  │
                    └─────────────────────────┘
```

## 🛠️ Быстрый старт

### Требования
- **VPS**: Ubuntu 20.04+ с Docker и Docker Compose
- **Домен**: С возможностью настройки DNS записей
- **Порты**: 80, 443, 3478 (UDP/TCP), 49152-65535 (UDP)
- **Ресурсы**: Минимум 2GB RAM, 2 CPU cores

### GitHub Secrets (обязательные)

```bash
VPS_HOST=your-server.example.com
VPS_USER=docker-deploy
VPS_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----...
DOMAIN=example.com
EMAIL_LETSENCRYPT=admin@example.com
JWT_SIGNING_KEY=$(openssl rand -hex 32)
TURN_REALM=example.com
TURN_AUTH_SECRET=$(openssl rand -hex 16)
TURN_CRED_TTL=3600
ALLOWED_USER_IDS=user1,user2,user3,admin
CONTACT_LIST_JSON=[{"userId":"user1","publicKeys":{"identity":"...","signedPreKey":"...","signature":"..."}}]
SIGNALING_PUBLIC_URL=wss://api.example.com/ws
APP_PUBLIC_URL=https://example.com
RATE_LIMITS_JSON={"global":100,"auth":5,"websocket":10}
```

### Деплой

1. Настройте DNS записи (A records для domain, api.domain, turn.domain)
2. Добавьте GitHub Secrets в настройках репозитория
3. Коммитьте код → автоматический деплой через GitHub Actions

### Локальная разработка

```bash
git clone <repository>
cd webrtc-e2ee

# Создать .env.local (не коммитить!)
cp .env.example .env.local
# Отредактировать .env.local

docker-compose up --build
```

## 🔒 Безопасность

- **E2EE**: AES-256-GCM с уникальными ключами на кадр
- **Ключевой обмен**: X3DH-подобный протокол через WebCrypto
- **Аутентификация**: JWT токены с TTL 30 минут
- **Сетевая безопасность**: TLS 1.3, HSTS, CSP, Rate Limiting

## 📱 Использование

1. Откройте https://your-domain.com в Chrome/Chromium (Android)
2. Войдите с User ID и кодом доступа
3. Выберите контакт → начать звонок
4. Проверьте SAS код для подтверждения E2EE

## 🐛 Troubleshooting

```bash
# Проверка сервисов
./scripts/healthcheck.sh

# Логи
docker logs webrtc-signaling
docker logs webrtc-turn
docker logs webrtc-proxy

# Тест TURN
turnutils_uclient -v your-domain.com -p 3478
```

## 📄 License

MIT License - см. LICENSE файл
