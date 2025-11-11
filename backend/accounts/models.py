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
    real_name = models.CharField(max_length=50, verbose_name="姓名")  # ← 新增：姓名
    email = models.EmailField(blank=True, null=True, verbose_name="電子郵件")
    phone = models.CharField(max_length=20, blank=True, null=True, verbose_name="電話")
    
    # 學生專用資料
    student_id = models.CharField(max_length=20, blank=True, null=True, unique=True, verbose_name="學號")
    department = models.CharField(max_length=100, blank=True, null=True, verbose_name="科系")
    grade = models.IntegerField(blank=True, null=True, verbose_name="年級")  # 1, 2, 3, 4
    
    # 教師專用資料
    office = models.CharField(max_length=100, blank=True, null=True, verbose_name="研究室")
    title = models.CharField(max_length=50, blank=True, null=True, verbose_name="職稱")  # 教授、副教授、助理教授
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")

    def __str__(self):
        return f"{self.real_name} ({self.user.username})"
    
    class Meta:
        verbose_name = "個人資料"
        verbose_name_plural = "個人資料"


# ===== 課程相關 =====

class Course(models.Model):
    """課程資料表"""
    
    # 課程類別選項
    COURSE_TYPE_CHOICES = [
        ('required', '必修'),
        ('elective', '選修'),
        ('general', '通識'),
    ]
    
    # 學期選項
    SEMESTER_CHOICES = [
        ('1', '上學期'),
        ('2', '下學期'),
    ]
    
    # 星期選項
    WEEKDAY_CHOICES = [
        ('1', '星期一'),
        ('2', '星期二'),
        ('3', '星期三'),
        ('4', '星期四'),
        ('5', '星期五'),
        ('6', '星期六'),
        ('7', '星期日'),
    ]
    
    # 開課狀態
    STATUS_CHOICES = [
        ('open', '開放選課'),
        ('full', '已額滿'),
        ('closed', '停開'),
    ]
    
    # 基本資料
    course_code = models.CharField(max_length=20, unique=True, verbose_name="課程代碼")  # 例如：CS101
    course_name = models.CharField(max_length=100, verbose_name="課程名稱")
    course_type = models.CharField(max_length=10, choices=COURSE_TYPE_CHOICES, verbose_name="課程類別")
    description = models.TextField(blank=True, verbose_name="課程描述")
    
    # 學分與時數
    credits = models.IntegerField(verbose_name="學分數")
    hours = models.IntegerField(verbose_name="課程節數")  # 一週幾節課
    
    # 開課資訊
    academic_year = models.CharField(max_length=10, verbose_name="學年度")  # 113
    semester = models.CharField(max_length=1, choices=SEMESTER_CHOICES, verbose_name="學期")
    department = models.CharField(max_length=100, verbose_name="開課系所")
    grade_level = models.IntegerField(verbose_name="建議修課年級")  # 1, 2, 3, 4
    
    # 授課教師
    teacher = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='teaching_courses', 
        verbose_name="授課教師"
    )
    
    # 上課時間與地點
    classroom = models.CharField(max_length=50, verbose_name="課程教室")  # 例如：A101
    weekday = models.CharField(max_length=1, choices=WEEKDAY_CHOICES, verbose_name="星期幾")
    start_period = models.IntegerField(verbose_name="開始節次")  # 例如：1（第1節）
    end_period = models.IntegerField(verbose_name="結束節次")  # 例如：2（第2節）
    
    # 選課人數管理
    max_students = models.IntegerField(default=50, verbose_name="人數上限")
    current_students = models.IntegerField(default=0, verbose_name="目前人數")
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='open', verbose_name="開課狀態")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")

    def __str__(self):
        return f"{self.course_code} - {self.course_name}"
    
    def get_time_display(self):
        """顯示完整的上課時間"""
        weekday_name = self.get_weekday_display()
        return f"{weekday_name} 第{self.start_period}-{self.end_period}節"
    
    def is_full(self):
        """檢查是否額滿"""
        return self.current_students >= self.max_students
    
    class Meta:
        verbose_name = "課程"
        verbose_name_plural = "課程"
        ordering = ['course_code']


# ===== 選課相關 =====

class StudentCourse(models.Model):
    """學生選課記錄"""
    
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
    
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='enrolled_courses', verbose_name="學生")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrolled_students', verbose_name="課程")
    
    # 學期資訊
    academic_year = models.CharField(max_length=10, verbose_name="學年度")
    semester = models.CharField(max_length=10, verbose_name="學期")
    
    # 選課狀態與成績
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='enrolled', verbose_name="狀態")
    grade = models.CharField(max_length=3, choices=GRADE_CHOICES, blank=True, null=True, verbose_name="等第成績")
    score = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True, verbose_name="百分制成績")
    
    enrolled_date = models.DateTimeField(auto_now_add=True, verbose_name="選課日期")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")
    
    class Meta:
        verbose_name = "學生選課記錄"
        verbose_name_plural = "學生選課記錄"
        unique_together = ['student', 'course', 'academic_year', 'semester']
        ordering = ['-academic_year', '-semester']
    
    def __str__(self):
        return f"{self.student.username} - {self.course.course_name} ({self.get_status_display()})"


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
        return f"{self.student.username} - 總學分: {self.total_credits}"