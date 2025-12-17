from django.contrib import admin
from django.contrib.auth.models import User
from .models import (
    Role, Profile, 
    Department, Program,
    Course, CourseOffering, OfferingTeacher, ClassTime,
    Enrollment, FavoriteCourse, CreditSummary
)

# ===== 使用者相關 =====

class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False

class UserAdmin(admin.ModelAdmin):
    inlines = [ProfileInline]
    list_display = ['username', 'get_real_name', 'email', 'is_staff']
    
    def get_real_name(self, obj):
        return obj.profile.real_name if hasattr(obj, 'profile') else '-'
    get_real_name.short_description = '姓名'

# 重新註冊 User
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name']

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'real_name', 'student_id', 'department', 'grade']
    list_filter = ['department', 'grade']
    search_fields = ['real_name', 'student_id', 'user__username']


# ===== 基礎資料 =====

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'created_at']
    search_fields = ['name', 'code']

@admin.register(Program)
class ProgramAdmin(admin.ModelAdmin):
    list_display = ['name']


# ===== 課程相關 =====

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['course_code', 'course_name', 'course_type', 'credits']
    list_filter = ['course_type']
    search_fields = ['course_code', 'course_name']


class OfferingTeacherInline(admin.TabularInline):
    model = OfferingTeacher
    extra = 1

class ClassTimeInline(admin.TabularInline):
    model = ClassTime
    extra = 1

@admin.register(CourseOffering)
class CourseOfferingAdmin(admin.ModelAdmin):
    list_display = [
        'course', 'department', 'academic_year', 'semester', 
        'grade_level', 'current_students', 'max_students', 'status'
    ]
    list_filter = ['academic_year', 'semester', 'department', 'status']
    search_fields = ['course__course_name', 'course__course_code']
    inlines = [OfferingTeacherInline, ClassTimeInline]

@admin.register(OfferingTeacher)
class OfferingTeacherAdmin(admin.ModelAdmin):
    list_display = ['offering', 'teacher', 'role']
    list_filter = ['role']

@admin.register(ClassTime)
class ClassTimeAdmin(admin.ModelAdmin):
    list_display = ['offering', 'weekday', 'start_period', 'end_period', 'classroom']
    list_filter = ['weekday']


# ===== 選課相關 =====

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'offering', 'status', 'grade', 'score', 'enrolled_at']
    list_filter = ['status', 'offering__academic_year', 'offering__semester']
    search_fields = ['student__username', 'student__profile__real_name', 'offering__course__course_name']

@admin.register(FavoriteCourse)
class FavoriteCourseAdmin(admin.ModelAdmin):
    list_display = ['student', 'offering', 'created_at']
    search_fields = ['student__username', 'offering__course__course_name']

@admin.register(CreditSummary)
class CreditSummaryAdmin(admin.ModelAdmin):
    list_display = ['student', 'total_credits', 'passed_credits', 'gpa']
    search_fields = ['student__username', 'student__profile__real_name']