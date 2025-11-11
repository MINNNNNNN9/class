from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Profile, Role, Course, StudentCourse, CreditSummary


# ===== 註冊 Role 模型 =====
@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'get_name_display']
    list_filter = ['name']
    search_fields = ['name']
    
    def get_name_display(self, obj):
        return obj.get_name_display()
    get_name_display.short_description = '角色名稱'


# ===== Profile 的內聯顯示 =====
class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name = '使用者資料'
    verbose_name_plural = '使用者資料'
    filter_horizontal = ['roles']
    
    fieldsets = (
        ('基本資料', {
            'fields': ('real_name', 'email', 'phone', 'roles')
        }),
        ('學生資料', {
            'fields': ('student_id', 'department', 'grade'),
            'classes': ('collapse',),
        }),
        ('教師資料', {
            'fields': ('office', 'title'),
            'classes': ('collapse',),
        }),
    )


# ===== 擴展 User Admin =====
class UserAdmin(BaseUserAdmin):
    inlines = [ProfileInline]
    
    list_display = [
        'username', 
        'get_real_name',
        'email', 
        'get_student_id',
        'get_department',
        'is_staff', 
        'get_roles'
    ]
    list_filter = [
        'is_staff', 
        'is_superuser', 
        'is_active', 
        'profile__roles',
        'profile__department',
        'profile__grade',
    ]
    search_fields = [
        'username', 
        'email', 
        'profile__real_name',
        'profile__student_id',
    ]
    
    def get_real_name(self, obj):
        try:
            return obj.profile.real_name or '-'
        except Profile.DoesNotExist:
            return '-'
    get_real_name.short_description = '姓名'
    
    def get_student_id(self, obj):
        try:
            return obj.profile.student_id or '-'
        except Profile.DoesNotExist:
            return '-'
    get_student_id.short_description = '學號'
    
    def get_department(self, obj):
        try:
            return obj.profile.department or '-'
        except Profile.DoesNotExist:
            return '-'
    get_department.short_description = '科系'
    
    def get_roles(self, obj):
        try:
            profile = obj.profile
            roles = profile.roles.all()
            return ', '.join([role.get_name_display() for role in roles])
        except Profile.DoesNotExist:
            return '-'
    get_roles.short_description = '角色'


admin.site.unregister(User)
admin.site.register(User, UserAdmin)


# ===== 單獨註冊 Profile =====
@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = [
        'user', 
        'real_name',
        'student_id',
        'department',
        'grade',
        'get_roles'
    ]
    list_filter = [
        'roles', 
        'department',
        'grade',
    ]
    search_fields = [
        'user__username', 
        'user__email',
        'real_name',
        'student_id',
    ]
    filter_horizontal = ['roles']
    
    fieldsets = (
        ('使用者', {
            'fields': ('user',)
        }),
        ('基本資料', {
            'fields': ('real_name', 'email', 'phone', 'roles')
        }),
        ('學生資料', {
            'fields': ('student_id', 'department', 'grade'),
            'classes': ('collapse',),
        }),
        ('教師資料', {
            'fields': ('office', 'title'),
            'classes': ('collapse',),
        }),
    )
    
    def get_roles(self, obj):
        return ', '.join([role.get_name_display() for role in obj.roles.all()])
    get_roles.short_description = '角色'


# ===== 註冊 Course 模型（重要！你之前缺少這個）=====
@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = [
        'course_code',
        'course_name',
        'get_teacher_name',
        'credits',
        'hours',
        'department',
        'grade_level',
        'classroom',
        'get_time_display',
        'current_students',
        'max_students',
        'status',
    ]
    
    list_filter = [
        'course_type',
        'academic_year',
        'semester',
        'department',
        'grade_level',
        'status',
        'weekday',
    ]
    
    search_fields = [
        'course_code',
        'course_name',
        'teacher__username',
        'teacher__profile__real_name',
    ]
    
    # 分組顯示欄位
    fieldsets = (
        ('基本資訊', {
            'fields': ('course_code', 'course_name', 'course_type', 'description')
        }),
        ('學分與時數', {
            'fields': ('credits', 'hours')
        }),
        ('開課資訊', {
            'fields': ('academic_year', 'semester', 'department', 'grade_level', 'teacher')
        }),
        ('上課時間與地點', {
            'fields': ('weekday', 'start_period', 'end_period', 'classroom')
        }),
        ('選課管理', {
            'fields': ('max_students', 'current_students', 'status')
        }),
    )
    
    # 自訂顯示
    def get_teacher_name(self, obj):
        if obj.teacher:
            try:
                return obj.teacher.profile.real_name
            except:
                return obj.teacher.username
        return '-'
    get_teacher_name.short_description = '授課教師'
    
    # 批次操作
    actions = ['open_course', 'close_course', 'mark_as_full']
    
    def open_course(self, request, queryset):
        queryset.update(status='open')
        self.message_user(request, f'已開放 {queryset.count()} 門課程')
    open_course.short_description = '開放選課'
    
    def close_course(self, request, queryset):
        queryset.update(status='closed')
        self.message_user(request, f'已停開 {queryset.count()} 門課程')
    close_course.short_description = '停開課程'
    
    def mark_as_full(self, request, queryset):
        queryset.update(status='full')
        self.message_user(request, f'已標記 {queryset.count()} 門課程為額滿')
    mark_as_full.short_description = '標記為額滿'


# ===== 註冊 StudentCourse（學生選課記錄）=====
@admin.register(StudentCourse)
class StudentCourseAdmin(admin.ModelAdmin):
    list_display = [
        'get_student_name',
        'get_course_name',
        'academic_year',
        'semester',
        'status',
        'grade',
        'score',
    ]
    
    list_filter = [
        'status',
        'academic_year',
        'semester',
        'course__course_type',
    ]
    
    search_fields = [
        'student__username',
        'student__profile__real_name',
        'course__course_name',
        'course__course_code',
    ]
    
    def get_student_name(self, obj):
        try:
            return f"{obj.student.profile.real_name} ({obj.student.username})"
        except:
            return obj.student.username
    get_student_name.short_description = '學生'
    
    def get_course_name(self, obj):
        return f"{obj.course.course_code} {obj.course.course_name}"
    get_course_name.short_description = '課程'
    
    actions = ['mark_as_passed', 'mark_as_failed']
    
    def mark_as_passed(self, request, queryset):
        queryset.update(status='passed')
        self.message_user(request, f'已將 {queryset.count()} 筆記錄標記為已通過')
    mark_as_passed.short_description = '標記為已通過'
    
    def mark_as_failed(self, request, queryset):
        queryset.update(status='failed')
        self.message_user(request, f'已將 {queryset.count()} 筆記錄標記為未通過')
    mark_as_failed.short_description = '標記為未通過'


# ===== 註冊 CreditSummary（學分統計）=====
@admin.register(CreditSummary)
class CreditSummaryAdmin(admin.ModelAdmin):
    list_display = [
        'get_student_name',
        'total_credits',
        'required_credits',
        'elective_credits',
        'passed_credits',
        'gpa',
        'updated_at',
    ]
    
    search_fields = [
        'student__username',
        'student__profile__real_name',
    ]
    
    readonly_fields = ['updated_at']
    
    def get_student_name(self, obj):
        try:
            return f"{obj.student.profile.real_name} ({obj.student.username})"
        except:
            return obj.student.username
    get_student_name.short_description = '學生'
    
    actions = ['recalculate_credits']
    
    def recalculate_credits(self, request, queryset):
        for summary in queryset:
            student = summary.student
            passed_courses = StudentCourse.objects.filter(student=student, status='passed')
            
            required_credits = sum([sc.course.credits for sc in passed_courses if sc.course.course_type == 'required'])
            elective_credits = sum([sc.course.credits for sc in passed_courses if sc.course.course_type == 'elective'])
            general_credits = sum([sc.course.credits for sc in passed_courses if sc.course.course_type == 'general'])
            
            summary.required_credits = required_credits
            summary.elective_credits = elective_credits
            summary.general_credits = general_credits
            summary.passed_credits = required_credits + elective_credits + general_credits
            summary.total_credits = summary.passed_credits
            summary.save()
            
        self.message_user(request, f'已重新計算 {queryset.count()} 位學生的學分統計')
    recalculate_credits.short_description = '重新計算學分統計'


# ===== 自訂 Admin 站點標題 =====
admin.site.site_header = '選課系統管理後台'
admin.site.site_title = '選課系統'
admin.site.index_title = '歡迎使用選課系統管理後台'