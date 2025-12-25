import os
import sys


# Ensure the Django project root (the folder containing manage.py) is on sys.path
PROJECT_ROOT = os.path.dirname(os.path.dirname(__file__))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

from django.core.wsgi import get_wsgi_application  # noqa: E402

app = get_wsgi_application()
