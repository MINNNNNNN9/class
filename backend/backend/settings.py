from pathlib import Path
import os
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# ===== 智能檢測環境 =====
# 如果有 DATABASE_URL，表示是生產環境（Render）
IS_PRODUCTION = bool(os.environ.get('DATABASE_URL'))

# SECRET_KEY
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-yh=a&t#9kri&a_#!!_$fu9q2$f)za^g8o$6b=bai-b3aot%+*j')

# DEBUG 設置
if IS_PRODUCTION:
    # 生產環境：強制關閉 DEBUG
    DEBUG = False
else:
    # 本地開發：預設開啟 DEBUG（除非明確設置為 False）
    DEBUG = os.environ.get('DEBUG', 'True') == 'True'

# ALLOWED_HOSTS
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')

RENDER_EXTERNAL_HOSTNAME = os.environ.get('RENDER_EXTERNAL_HOSTNAME')
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'accounts',
]

# ===== 修改 4: 添加 WhiteNoise 中間件 =====
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'backend.urls'

# ===== 修改 5: CORS 支持環境變量 =====
default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

env_origins = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if env_origins:
    CORS_ALLOWED_ORIGINS = env_origins.split(',')
else:
    CORS_ALLOWED_ORIGINS = default_origins

CORS_ALLOW_CREDENTIALS = True

# ✅ 新增：允許的 CORS headers（確保 X-CSRFToken 可以被傳送）
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'X-CSRFToken',
    'x-requested-with',
]

# ✅ 新增：暴露給前端的 headers
CORS_EXPOSE_HEADERS = ['X-CSRFToken']

# ===== Session 設定（根據環境自動調整）=====
if IS_PRODUCTION:
    SESSION_COOKIE_SAMESITE = "None"
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_DOMAIN = None
else:
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_DOMAIN = None

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 86400  # 24小時
SESSION_COOKIE_NAME = 'sessionid'

# ✅ 新增：Session 優化設定
SESSION_SAVE_EVERY_REQUEST = False  # 不要每次請求都保存 session，提升性能
SESSION_EXPIRE_AT_BROWSER_CLOSE = False  # 關閉瀏覽器不清除 session
SESSION_ENGINE = 'django.contrib.sessions.backends.db'  # 使用資料庫儲存 session

# ===== CSRF 設定（根據環境自動調整）=====
default_csrf_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

env_csrf_origins = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
if env_csrf_origins:
    CSRF_TRUSTED_ORIGINS = env_csrf_origins.split(',')
else:
    CSRF_TRUSTED_ORIGINS = default_csrf_origins

if IS_PRODUCTION:
    CSRF_COOKIE_SAMESITE = "None"
    CSRF_COOKIE_SECURE = True
    CSRF_COOKIE_DOMAIN = None
else:
    CSRF_COOKIE_SAMESITE = "Lax"
    CSRF_COOKIE_SECURE = False
    CSRF_COOKIE_DOMAIN = None

CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False
CSRF_COOKIE_NAME = 'csrftoken'

# ✅ 新增：CSRF Token 有效期設定（1年），避免頻繁過期
CSRF_COOKIE_AGE = 31449600  # 365天

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny', 
    ]
}

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'

# ===== 修改 8: 數據庫配置支持 PostgreSQL =====
DATABASE_URL = os.environ.get('DATABASE_URL')

if DATABASE_URL:
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'zh-hant'
TIME_ZONE = 'Asia/Taipei'
USE_I_18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.0/howto/static-files/
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'