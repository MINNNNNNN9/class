"""
Django URL 配置
整合所有分離的 views 模組
"""
from django.urls import path
from . import views_auth, views_student, views_admin, views_course

urlpatterns = [
    # ===== 認證相關 API =====
    path('register/', views_auth.register, name='register'),
    path('login/', views_auth.login_view, name='login'),
    path('logout/', views_auth.logout_view, name='logout'),
    
    # ===== 學生功能 API =====
    path('user/credit-summary/', views_student.get_credit_summary, name='credit_summary'),
    
    # ===== 管理員功能 API =====
    path('teachers/', views_admin.get_teachers, name='get_teachers'),
    path('courses/create/', views_admin.create_course, name='create_course'),
    path('courses/<int:course_id>/delete/', views_admin.delete_course, name='delete_course'),
    
    # ===== 課程查詢與篩選 API（必須在 courses/ 之前）=====
    path('courses/search/', views_course.search_courses, name='search_courses'),
    path('courses/filter-options/', views_course.get_filter_options, name='filter_options'),
    
    # ===== 課程收藏 API =====
    path('courses/<int:course_id>/favorite/', views_course.toggle_favorite, name='toggle_favorite'),
    path('courses/favorites/', views_course.get_favorite_courses, name='get_favorite_courses'),
    
    # ===== 學生選課 API =====
    path('courses/<int:course_id>/enroll/', views_course.enroll_course, name='enroll_course'),
    path('courses/<int:course_id>/drop/', views_course.drop_course, name='drop_course'),
    path('courses/enrolled/', views_course.get_enrolled_courses, name='get_enrolled_courses'),
    
    # ===== 這個必須放在最後，因為它會匹配所有 courses/ =====
    path('courses/', views_admin.get_all_courses, name='get_all_courses'),
]