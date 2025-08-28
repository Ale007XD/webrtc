# WebRTC E2EE Исправленная Конфигурация

Это исправленная версия конфигурации WebRTC E2EE приложения с устраненными проблемами развертывания.

## 🔧 Исправленные проблемы

### 1. Docker образы
- ❌ **Было**: `your-dockerhub-account/webrtc-proxy:latest` (несуществующий образ)
- ✅ **Стало**: Локальная сборка из `./proxy/Dockerfile`

### 2. GitHub Actions
- ❌ **Было**: Неполный `deploy.yml` файл
- ✅ **Стало**: Полный workflow с проверками и обработкой ошибок

### 3. Конфигурация сервисов
- ✅ Добавлена полная конфигурация Nginx с SSL
- ✅ Добавлена конфигурация TURN сервера
- ✅ Добавлены entrypoint скрипты для автоматической настройки

## 📁 Структура проекта

```
webrtc-e2ee/
├── .github/
│   └── workflows/
│       └── deploy.yml                 # ✅ Исправленный GitHub Actions workflow
├── docker-compose.yml                # ✅ Исправленный с локальной сборкой образов
├── proxy/
│   ├── Dockerfile                     # ✅ Новый Dockerfile для Nginx
│   ├── nginx.conf                     # ✅ Полная конфигурация Nginx
│   └── entrypoint.sh                  # ✅ Скрипт для автоматической настройки SSL
├── turn/
│   ├── Dockerfile                     # ✅ Новый Dockerfile для CoTURN
│   ├── turnserver.conf                # ✅ Конфигурация TURN сервера
│   └── entrypoint.sh                  # ✅ Скрипт автоматической настройки
├── scripts/
│   ├── deploy.sh                      # ✅ Полный скрипт развертывания
│   └── healthcheck.sh                 # ✅ Скрипт проверки здоровья системы
├── .env.example                       # ✅ Пример переменных окружения
└── secrets-config.md                  # ✅ Руководство по настройке GitHub Secrets
```

## 🚀 Инструкция по установке

### 1. Подготовка VPS

```bash
# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите необходимые пакеты
sudo apt install -y curl wget git netcat-openbsd

# Установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установите Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Создайте пользователя для развертывания
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy
sudo usermod -aG sudo deploy
```

### 2. Настройка DNS
Создайте следующие DNS записи:
- `A` запись: `yourdomain.com` → IP вашего VPS
- `A` запись: `api.yourdomain.com` → IP вашего VPS

### 3. Генерация ключей

```bash
# JWT подписи
openssl rand -hex 32

# TURN секрет
openssl rand -hex 16

# SSH ключ для развертывания
ssh-keygen -t rsa -b 4096 -C "deploy@webrtc" -f ~/.ssh/webrtc_deploy
```

### 4. Настройка GitHub Secrets

В вашем GitHub репозитории перейдите в `Settings → Secrets and variables → Actions` и добавьте следующие Repository secrets:

```
VPS_HOST=yourdomain.com
VPS_USER=deploy
VPS_SSH_KEY=<содержимое приватного SSH ключа>
DOMAIN=yourdomain.com
EMAIL_LETSENCRYPT=admin@yourdomain.com
JWT_SIGNING_KEY=<результат openssl rand -hex 32>
TURN_REALM=yourdomain.com
TURN_AUTH_SECRET=<результат openssl rand -hex 16>
TURN_CRED_TTL=3600
ALLOWED_USER_IDS=user1,user2,admin
CONTACT_LIST_JSON=[{"userId":"user1","publicKeys":{"identity":"...","signedPreKey":"...","signature":"..."}}]
SIGNALING_PUBLIC_URL=wss://api.yourdomain.com/ws
APP_PUBLIC_URL=https://yourdomain.com
RATE_LIMITS_JSON={"global":100,"auth":5,"websocket":10}
```

### 5. Замена файлов в репозитории

Замените следующие файлы в вашем репозитории:

1. **docker-compose.yml** → используйте файл [61]
2. **.github/workflows/deploy.yml** → используйте файл [62] 
3. **proxy/Dockerfile** → создайте из файла [63]
4. **proxy/nginx.conf** → создайте из файла [64]
5. **proxy/entrypoint.sh** → создайте из файла [65]
6. **turn/Dockerfile** → создайте из файла [66]
7. **turn/turnserver.conf** → создайте из файла [67]
8. **turn/entrypoint.sh** → создайте из файла [68]
9. **scripts/deploy.sh** → создайте из файла [69]
10. **scripts/healthcheck.sh** → создайте из файла [70]

### 6. Настройка SSH доступа

```bash
# На VPS добавьте публичный ключ
sudo mkdir -p /home/deploy/.ssh
sudo sh -c 'cat >> /home/deploy/.ssh/authorized_keys' << EOF
<ваш публичный SSH ключ>
EOF
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys
```

### 7. Развертывание

После настройки всех файлов и секретов:

1. Сделайте commit изменений
2. Push в main ветку
3. GitHub Actions автоматически запустит развертывание

### 8. Проверка

После успешного развертывания:

```bash
# SSH в ваш VPS
ssh deploy@yourdomain.com

# Перейдите в директорию проекта
cd /opt/webrtc-e2ee

# Запустите проверку здоровья
./scripts/healthcheck.sh

# Проверьте статус сервисов
docker-compose ps

# Посмотрите логи
docker-compose logs -f
```

## 🔒 Безопасность

- Все секреты хранятся в GitHub Secrets
- SSL сертификаты генерируются автоматически через Let's Encrypt
- TURN сервер защищен аутентификацией
- Nginx настроен с безопасными заголовками и rate limiting

## 🐛 Устранение неполадок

### Проблемы со сборкой образов
```bash
# Пересоберите образы без кеша
docker-compose build --no-cache

# Проверьте логи сборки
docker-compose build proxy turn
```

### Проблемы с SSL
```bash
# Проверьте статус сертификата
docker-compose exec proxy ls -la /etc/letsencrypt/live/

# Форсированное обновление сертификата
docker-compose exec proxy certbot renew --force-renewal
```

### Проблемы с TURN сервером
```bash
# Проверьте конфигурацию
docker-compose exec turn cat /etc/coturn/turnserver.conf

# Тест подключения к TURN
turnutils_uclient -v yourdomain.com -p 3478
```

## 📞 Поддержка

Если у вас возникли проблемы:

1. Проверьте логи: `docker-compose logs`
2. Запустите healthcheck: `./scripts/healthcheck.sh`
3. Убедитесь что все порты открыты
4. Проверьте DNS записи
5. Проверьте GitHub Secrets

---

**Важно**: Эта конфигурация исправляет основные проблемы с развертыванием. После применения всех изменений ваше WebRTC E2EE приложение должно успешно развернуться и работать.
