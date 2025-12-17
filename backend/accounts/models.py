from django.contrib.auth.models import User
from django.db import models

# ===== 使用者相關 =====

class Role(models.Model):
    """角色管理"""
    ROLE_CHOICES = [
        ('student', '學生'),
        ('teacher', '教師'),
        ('admin', '管理員'),
    ]
    name = models.CharField(max_length=20, choices=ROLE_CHOICES, unique=True, verbose_name="角色名稱")

    def __str__(self):
        return self.get_name_display()
    
    class Meta:
        verbose_name = "角色"
        verbose_name_plural = "角色"


class Profile(models.Model):
    """使用者個人資料"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    roles = models.ManyToManyField(Role, verbose_name="角色")
    
    # 基本資料（所有使用者都有）
    real_name = models.CharField(max_length=50, verbose_name="姓名")
    email = models.EmailField(blank=True, null=True, verbose_name="電子郵件")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="電話")
    
    # 學生專用資料
    student_id = models.CharField(max_length=20, blank=True, null=True, unique=True, verbose_name="學號")
    department = models.CharField(max_length=100, blank=True, null=True, verbose_name="科系")
    grade = models.IntegerField(blank=True, null=True, verbose_name="年級")
    
    # 教師專用資料
    office = models.CharField(max_length=100, blank=True, null=True, verbose_name="研究室")
    title = models.CharField(max_length=50, blank=True, null=True, verbose_name="職稱")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")

    def __str__(self):
        return f"{self.real_name} ({self.user.username})"
    
    class Meta:
        verbose_name = "個人資料"
        verbose_name_plural = "個人資料"


# ===== 基礎資料 =====

class Department(models.Model):
    """系所"""
    name = models.CharField(max_length=100, unique=True, verbose_name="系所名稱")
    code = models.CharField(max_length=20, blank=True, null=True, verbose_name="系所代碼")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "系所"
        verbose_name_plural = "系所"
        ordering = ['name']


class Program(models.Model):
    """學制"""
    name = models.CharField(max_length=30, unique=True, verbose_name="學制名稱")
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "學制"
        verbose_name_plural = "學制"


# ===== 課程相關 =====

class Course(models.Model):
    """課程主檔 - 課程基本資料"""
    
    COURSE_TYPE_CHOICES = [
        ('required', '必修'),
        ('elective', '選修'),
        ('general_required', '通識(必修)'),
        ('general_elective', '通識(選修)'),
    ]
    
    course_code = models.CharField(max_length=20, unique=True, verbose_name="課程代碼")
    course_name = models.CharField(max_length=200, verbose_name="課程名稱")
    course_name_en = models.CharField(max_length=300, blank=True, null=True, verbose_name="課程英文名稱")
    course_type = models.CharField(max_length=20, choices=COURSE_TYPE_CHOICES, verbose_name="課程類別")
    credits = models.IntegerField(verbose_name="學分數")
    description = models.TextField(blank=True, verbose_name="課程描述")
    description_en = models.TextField(blank=True, verbose_name="課程英文描述")
    
    # 舊系統相容欄位
    old_code = models.CharField(max_length=20, blank=True, null=True, verbose_name="舊課程代碼")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")

    def __str__(self):
        return f"{self.course_code} - {self.course_name}"
    
    class Meta:
        verbose_name = "課程"
        verbose_name_plural = "課程"
        ordering = ['course_code']


class CourseOffering(models.Model):
    """開課資料 - 某學期某系所開的課"""
    
    SEMESTER_CHOICES = [
        ('1', '上學期'),
        ('2', '下學期'),
    ]
    
    STATUS_CHOICES = [
        ('open', '開放選課'),
        ('full', '已額滿'),
        ('closed', '停開'),
    ]
    
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='offerings', verbose_name="課程")
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='offerings', verbose_name="開課系所")
    
    # 學期資訊
    academic_year = models.CharField(max_length=10, verbose_name="學年度")
    semester = models.CharField(max_length=1, choices=SEMESTER_CHOICES, verbose_name="學期")
    
    # 課程資訊
    grade_level = models.IntegerField(verbose_name="建議修課年級")
    max_students = models.IntegerField(default=50, verbose_name="人數上限")
    current_students = models.IntegerField(default=0, verbose_name="目前人數")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open', verbose_name="開課狀態")
    
    # 備註
    notes = models.TextField(blank=True, verbose_name="課表備註")
    
    # 舊系統相容欄位
    old_schedule_code = models.CharField(max_length=20, blank=True, null=True, verbose_name="舊課表代碼")
    old_schedule_name = models.CharField(max_length=50, blank=True, null=True, verbose_name="舊課表名稱")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")

    def __str__(self):
        return f"{self.course.course_name} ({self.academic_year}-{self.get_semester_display()})"
    
    def is_full(self):
        """檢查是否額滿"""
        return self.current_students >= self.max_students
    
    def get_teachers_display(self):
        """取得教師名稱列表"""
        teachers = self.offering_teachers.select_related('teacher__profile').all()
        teacher_names = []
        for ot in teachers:
            name = ot.teacher.profile.real_name if hasattr(ot.teacher, 'profile') else ot.teacher.username
            if ot.role == 'main':
                teacher_names.append(f"{name}(主)")
            else:
                teacher_names.append(name)
        return '、'.join(teacher_names)
    
    def get_time_display(self):
        """取得上課時間顯示"""
        times = self.class_times.all()
        time_strs = []
        for ct in times:
            weekday_name = ct.get_weekday_display()
            time_strs.append(f"{ct.classroom}｜{weekday_name} 第{ct.start_period}-{ct.end_period}節")
        return '；'.join(time_strs)
    
    class Meta:
        verbose_name = "開課資料"
        verbose_name_plural = "開課資料"
        ordering = ['-academic_year', '-semester', 'course__course_code']
        indexes = [
            models.Index(fields=['academic_year', 'semester']),
            models.Index(fields=['department']),
        ]


class OfferingTeacher(models.Model):
    """開課教師 - 支援協同教學"""
    
    ROLE_CHOICES = [
        ('main', '主開課'),
        ('co', '協同'),
    ]
    
    offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE, related_name='offering_teachers', verbose_name="開課")
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='teaching_offerings', verbose_name="教師")
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='co', verbose_name="教師角色")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")

    def __str__(self):
        teacher_name = self.teacher.profile.real_name if hasattr(self.teacher, 'profile') else self.teacher.username
        return f"{self.offering.course.course_name} - {teacher_name} ({self.get_role_display()})"
    
    class Meta:
        verbose_name = "開課教師"
        verbose_name_plural = "開課教師"
        unique_together = ['offering', 'teacher']


class ClassTime(models.Model):
    """上課時段"""
    
    WEEKDAY_CHOICES = [
        ('1', '星期一'),
        ('2', '星期二'),
        ('3', '星期三'),
        ('4', '星期四'),
        ('5', '星期五'),
        ('6', '星期六'),
        ('7', '星期日'),
    ]
    
    offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE, related_name='class_times', verbose_name="開課")
    
    weekday = models.CharField(max_length=1, choices=WEEKDAY_CHOICES, verbose_name="星期幾")
    start_period = models.IntegerField(verbose_name="開始節次")
    end_period = models.IntegerField(verbose_name="結束節次")
    classroom = models.CharField(max_length=50, verbose_name="上課地點")
    
    # 進階功能
    weeks = models.TextField(blank=True, null=True, verbose_name="上課週次")  # 例如: "1-9,11-18"
    hours_per_week = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True, verbose_name="每週時數")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")

    def __str__(self):
        return f"{self.offering.course.course_name} - {self.get_weekday_display()} 第{self.start_period}-{self.end_period}節"
    
    class Meta:
        verbose_name = "上課時段"
        verbose_name_plural = "上課時段"
        ordering = ['offering', 'weekday', 'start_period']
        indexes = [
            models.Index(fields=['offering']),
            models.Index(fields=['weekday', 'start_period', 'end_period']),
        ]


# ===== 選課相關 =====

class Enrollment(models.Model):
    """選課紀錄"""
    
    STATUS_CHOICES = [
        ('enrolled', '已選課'),
        ('passed', '已通過'),
        ('failed', '未通過'),
        ('dropped', '已退選'),
    ]
    
    GRADE_CHOICES = [
        ('A+', 'A+'), ('A', 'A'), ('A-', 'A-'),
        ('B+', 'B+'), ('B', 'B'), ('B-', 'B-'),
        ('C+', 'C+'), ('C', 'C'), ('C-', 'C-'),
        ('D', 'D'), ('F', 'F'),
    ]
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrollments', verbose_name="學生")
    offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE, related_name='enrollments', verbose_name="開課")
    
    # 選課狀態與成績
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='enrolled', verbose_name="狀態")
    grade = models.CharField(max_length=3, choices=GRADE_CHOICES, blank=True, null=True, verbose_name="等第成績")
    score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, verbose_name="百分制成績")
    
    enrolled_at = models.DateTimeField(auto_now_add=True, verbose_name="選課時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")
    
    class Meta:
        verbose_name = "選課紀錄"
        verbose_name_plural = "選課紀錄"
        unique_together = ['student', 'offering']
        ordering = ['-enrolled_at']
        indexes = [
            models.Index(fields=['student']),
            models.Index(fields=['offering']),
        ]
    
    def __str__(self):
        student_name = self.student.profile.real_name if hasattr(self.student, 'profile') else self.student.username
        return f"{student_name} - {self.offering.course.course_name} ({self.get_status_display()})"
    
    def check_time_conflict(self):
        """檢查時段衝突"""
        # 取得這次選課的所有時段
        new_times = self.offering.class_times.all()
        
        # 取得學生已選課程的所有時段
        existing_enrollments = Enrollment.objects.filter(
            student=self.student,
            status='enrolled'
        ).exclude(id=self.id)
        
        for enrollment in existing_enrollments:
            existing_times = enrollment.offering.class_times.all()
            
            # 檢查每個時段是否衝突
            for new_time in new_times:
                for exist_time in existing_times:
                    if (new_time.weekday == exist_time.weekday and
                        new_time.start_period <= exist_time.end_period and
                        new_time.end_period >= exist_time.start_period):
                        return True, f"與 {enrollment.offering.course.course_name} 時段衝突"
        
        return False, None


class FavoriteCourse(models.Model):
    """收藏課程"""
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorite_courses', verbose_name="學生")
    offering = models.ForeignKey(CourseOffering, on_delete=models.CASCADE, related_name='favorited_by', verbose_name="開課")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="收藏時間")
    
    class Meta:
        verbose_name = "收藏課程"
        verbose_name_plural = "收藏課程"
        unique_together = ['student', 'offering']
        ordering = ['-created_at']
    
    def __str__(self):
        student_name = self.student.profile.real_name if hasattr(self.student, 'profile') else self.student.username
        return f"{student_name} - {self.offering.course.course_name}"


# ===== 學分統計 =====

class CreditSummary(models.Model):
    """學生學分統計"""
    student = models.OneToOneField(User, on_delete=models.CASCADE, related_name='credit_summary', verbose_name="學生")
    
    # 學分統計
    total_credits = models.IntegerField(default=0, verbose_name="總學分")
    required_credits = models.IntegerField(default=0, verbose_name="必修學分")
    elective_credits = models.IntegerField(default=0, verbose_name="選修學分")
    general_credits = models.IntegerField(default=0, verbose_name="通識學分")
    passed_credits = models.IntegerField(default=0, verbose_name="已通過學分")
    failed_credits = models.IntegerField(default=0, verbose_name="未通過學分")
    
    # GPA
    gpa = models.DecimalField(max_digits=4, decimal_places=2, default=0.00, verbose_name="學期平均 GPA")
    
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")
    
    class Meta:
        verbose_name = "學分統計"
        verbose_name_plural = "學分統計"
    
    def __str__(self):
        student_name = self.student.profile.real_name if hasattr(self.student, 'profile') else self.student.username
        return f"{student_name} 的學分統計"