# -*- coding: utf-8 -*-
"""
Django URL 配置
整合所有分離的 views 模組
"""
from django.urls import path
from . import views_auth, views_student, views_admin, views_course, views_account, views_debug

urlpatterns = [
    # ===== 認證相關 API =====
    path('register/', views_auth.register, name='register'),
    path('login/', views_auth.login_view, name='login'),
    path('logout/', views_auth.logout_view, name='logout'),
    
    # ===== 學生功能 API =====
    path('user/credit-summary/', views_student.get_credit_summary, name='credit_summary'),
    
    # ===== 管理員功能 API =====
    # path('teachers/', views_admin.get_teachers, name='get_teachers'),  # ← 註解掉，與下面衝突
    path('courses/create/', views_admin.create_course, name='create_course'),
    path('courses/<int:course_id>/delete/', views_admin.delete_course, name='delete_course'),
    
    # ===== 課程查詢與篩選 API（必須在 courses/ 之前）=====
    path('courses/search/', views_course.search_courses, name='search_courses'),
    path('courses/filter-options/', views_course.get_filter_options, name='filter_options'),
    path('courses/<int:course_id>/detail/', views_course.get_course_detail, name='get_course_detail'),
    path('courses/<int:course_id>/update/', views_course.update_course, name='update_course'),
    
    # ===== 課程收藏 API =====
    path('courses/<int:course_id>/favorite/', views_course.toggle_favorite, name='toggle_favorite'),
    path('courses/favorites/', views_course.get_favorite_courses, name='get_favorite_courses'),
    path('courses/my-teaching/', views_course.my_teaching_courses, name='my_teaching_courses'), # 教師授課列表
    
    # ===== 學生選課 API =====
    path('courses/<int:course_id>/enroll/', views_course.enroll_course, name='enroll_course'),
    path('courses/<int:course_id>/drop/', views_course.drop_course, name='drop_course'),
    path('courses/enrolled/', views_course.get_enrolled_courses, name='get_enrolled_courses'),

    # ===== 帳號相關 API =====
    path('students/', views_account.get_all_students, name='get_all_students'),
    path('teachers/', views_account.get_all_teachers, name='get_all_teachers'),  # ← 保留這個
    path('students/<int:user_id>/update/', views_account.update_student, name='update_student'),
    path('teachers/<int:user_id>/update/', views_account.update_teacher, name='update_teacher'),
    path('students/<int:user_id>/delete/', views_account.delete_student, name='delete_student'),
    path('teachers/<int:user_id>/delete/', views_account.delete_teacher, name='delete_teacher'),
    path('accounts/<int:user_id>/reset-password/', views_account.reset_password, name='reset_password'), # 重設密碼
    
    # 大頭貼相關
    path('user/profile/', views_account.get_profile_info, name='get_profile_info'),
    path('user/avatar/', views_account.get_avatar, name='get_avatar'),
    path('user/avatar/upload/', views_account.upload_avatar, name='upload_avatar'),
    path('user/avatar/delete/', views_account.delete_avatar, name='delete_avatar'),
    
    # 密碼修改
    path('change-password/', views_auth.change_password, name='change_password'),

    path('debug-settings/', views_debug.debug_settings, name='debug_settings'),
    
    # ===== 這個必須放在最後，因為它會匹配所有 courses/ =====
    path('courses/', views_admin.get_all_courses, name='get_all_courses'),
]