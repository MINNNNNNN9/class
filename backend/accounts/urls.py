from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register),
    path('login/', views.login_view),
    path('logout/', views.logout_view),  # ← 新增登出路由
    path('user/credit-summary/', views.get_credit_summary),
    #管理員功能
    path('api/teachers/', views.get_teachers, name='get_teachers'),
    path('api/courses/create/', views.create_course, name='create_course'),
]