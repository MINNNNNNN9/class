from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
# 
# ⬇️ ⬇️ ⬇️ 導入這三個 ⬇️ ⬇️ ⬇️
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
# ⬆️ ⬆️ ⬆️ 導入結束 ⬆️ ⬆️ ⬆️
# 
from rest_framework.response import Response
from .models import Profile, Role, StudentCourse, CreditSummary, Course

# 
# 
# 

@csrf_exempt 
@api_view(['POST'])
def register(request):
    username = request.data.get('username')
    password = request.data.get('password')
    role_name = request.data.get('role')
    real_name = request.data.get('real_name')
    
    # 學生專用欄位
    student_id = request.data.get('student_id')
    department = request.data.get('department')
    grade = request.data.get('grade', 3)
    
    # 教師專用欄位
    office = request.data.get('office')
    title = request.data.get('title')
    
    if not username or not password or not role_name:
        return Response({'error': '缺少必要欄位'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': '帳號已存在'}, status=400)

    user = User.objects.create_user(username=username, password=password)
    
    profile = Profile.objects.create(
        user=user,
        real_name=real_name or username,
        student_id=student_id,
        department=department,
        grade=grade,
        office=office,
        title=title
    )
    
    role = Role.objects.get(name=role_name)
    profile.roles.add(role)
    profile.save()

    return Response({'message': '註冊成功'})


@csrf_exempt 
@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)
    if user is None:
        return Response({'error': '帳號或密碼錯誤'}, status=401)

    django_login(request, user)

    try:
        profile = Profile.objects.get(user=user)
        roles = [r.name for r in profile.roles.all()]
        
        response_data = {
            'username': username,
            'real_name': profile.real_name,
        }
        
        if len(roles) == 1:
            response_data['role'] = roles[0]
        else:
            response_data['roles'] = roles
            
        return Response(response_data)
        
    except Profile.DoesNotExist:
        return Response({'error': '找不到使用者資料'}, status=404)


@csrf_exempt 
@api_view(['POST'])
def logout_view(request):
    """登出功能"""
    try:
        # 登出使用者（清除 server 端 session）
        django_logout(request)
        
        # 建立 response
        response = Response({'message': '登出成功'})
        
        # 主動刪除 cookies
        response.delete_cookie('sessionid', domain=None, path='/')
        response.delete_cookie('csrftoken', domain=None, path='/')
        
        # 設定 cache control，確保瀏覽器不會快取
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        return response
        
    except Exception as e:
        print(f"登出錯誤: {str(e)}")
        return Response({'error': str(e)}, status=500)

# 
# 
@api_view(['GET'])
@authentication_classes([SessionAuthentication]) 
@permission_classes([IsAuthenticated])           
def get_credit_summary(request):
    """獲取學生的學分統計"""
    # 調試信息
    print(f"=== 學分統計 API 被調用 ===")
    print(f"User authenticated: {request.user.is_authenticated}")
    print(f"User: {request.user}")
    
    if not request.user.is_authenticated:
        return Response({'error': '未登入'}, status=401)
    
    user = request.user
    
    try:
        profile = Profile.objects.get(user=user)
        print(f"Profile found: {profile.real_name}")
        
        # 當前學期設定（改為 114 學年度上學期）
        current_year = '113'
        current_semester = '1'
        
        # 計算歷年總學分（不包含本學期）
        historical_courses = StudentCourse.objects.filter(
            student=user,
            status='passed'
        ).exclude(
            academic_year=current_year,
            semester=current_semester
        ).select_related('course')
        
        print(f"歷年課程數量: {historical_courses.count()}")
        for sc in historical_courses:
            print(f"  - {sc.course.course_name}: {sc.course.credits}學分, 類型: {sc.course.course_type}")
        
        total_general = sum([sc.course.credits for sc in historical_courses if sc.course.course_type == 'general'])
        total_elective = sum([sc.course.credits for sc in historical_courses if sc.course.course_type == 'elective'])
        total_required = sum([sc.course.credits for sc in historical_courses if sc.course.course_type == 'required'])
        total_all = total_general + total_elective + total_required
        
        print(f"歷年學分: 通識={total_general}, 選修={total_elective}, 必修={total_required}, 總計={total_all}")
        
        # 計算本學期學分
        semester_courses = StudentCourse.objects.filter(
            student=user,
            academic_year=current_year,
            semester=current_semester,
            status='enrolled'
        ).select_related('course')
        
        print(f"本學期課程數量: {semester_courses.count()}")
        for sc in semester_courses:
            print(f"  - {sc.course.course_name}: {sc.course.credits}學分, 類型: {sc.course.course_type}")
        
        semester_general = sum([sc.course.credits for sc in semester_courses if sc.course.course_type == 'general'])
        semester_elective = sum([sc.course.credits for sc in semester_courses if sc.course.course_type == 'elective'])
        semester_required = sum([sc.course.credits for sc in semester_courses if sc.course.course_type == 'required'])
        semester_all = semester_general + semester_elective + semester_required
        
        print(f"本學期學分: 通識={semester_general}, 選修={semester_elective}, 必修={semester_required}, 總計={semester_all}")
        
        data = {
            'user_info': {
                'real_name': profile.real_name or user.username,
                'student_id': profile.student_id or '未設定',
                'department': profile.department or '未設定',
                'grade': f'{profile.grade}年級' if profile.grade else '未設定',
            },
            'total_credits': {
                'general': total_general,
                'elective': total_elective,
                'required': total_required,
                'all': total_all,
            },
            'semester_credits': {
                'general': semester_general,
                'elective': semester_elective,
                'required': semester_required,
                'all': semester_all,
            },
        }
        
        print(f"回傳資料: {data}")
        return Response(data)
        
    except Profile.DoesNotExist:
        print("錯誤: 找不到 Profile")
        return Response({'error': '找不到使用者資料'}, status=404)
    except Exception as e:
        print(f"錯誤: {str(e)}")
        return Response({'error': str(e)}, status=500)


# ===== 管理員功能 API =====

@api_view(['GET'])
def get_teachers(request):
    """獲取所有教師列表"""
    try:
        # 找到教師角色
        teacher_role = Role.objects.get(name='teacher')
        
        # 找到所有擁有教師角色的 Profile
        teacher_profiles = Profile.objects.filter(roles=teacher_role).select_related('user')
        
        teachers = []
        for profile in teacher_profiles:
            teachers.append({
                'id': profile.user.id,
                'username': profile.user.username,
                'real_name': profile.real_name,
                'title': profile.title or '未設定',
                'office': profile.office or '未設定'
            })
        
        print(f"找到 {len(teachers)} 位教師")
        return Response(teachers)
        
    except Role.DoesNotExist:
        return Response({'error': '找不到教師角色'}, status=404)
    except Exception as e:
        print(f"錯誤: {str(e)}")
        return Response({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['POST'])
def create_course(request):
    """建立新課程"""
    try:
        # 獲取表單資料
        course_code = request.data.get('course_code')
        course_name = request.data.get('course_name')
        course_type = request.data.get('course_type')
        description = request.data.get('description', '')
        credits = request.data.get('credits')
        hours = request.data.get('hours')
        academic_year = request.data.get('academic_year')
        semester = request.data.get('semester')
        department = request.data.get('department')
        grade_level = request.data.get('grade_level')
        teacher_id = request.data.get('teacher_id')
        classroom = request.data.get('classroom')
        weekday = request.data.get('weekday')
        start_period = request.data.get('start_period')
        end_period = request.data.get('end_period')
        max_students = request.data.get('max_students', 50)
        
        # 驗證必填欄位
        if not all([course_code, course_name, course_type, credits, hours, 
                   academic_year, semester, department, grade_level, teacher_id,
                   classroom, weekday, start_period, end_period]):
            return Response({'error': '缺少必要欄位'}, status=400)
        
        # 檢查課程代碼是否已存在
        if Course.objects.filter(course_code=course_code).exists():
            return Response({'error': '課程代碼已存在'}, status=400)
        
        # 檢查教師是否存在
        try:
            teacher = User.objects.get(id=teacher_id)
        except User.DoesNotExist:
            return Response({'error': '找不到該教師'}, status=404)
        
        # 建立課程
        course = Course.objects.create(
            course_code=course_code,
            course_name=course_name,
            course_type=course_type,
            description=description,
            credits=credits,
            hours=hours,
            academic_year=academic_year,
            semester=semester,
            department=department,
            grade_level=grade_level,
            teacher=teacher,
            classroom=classroom,
            weekday=weekday,
            start_period=start_period,
            end_period=end_period,
            max_students=max_students,
            current_students=0,
            status='open'
        )
        
        print(f"課程建立成功: {course.course_code} - {course.course_name}")
        return Response({
            'message': '課程建立成功',
            'course_id': course.id,
            'course_code': course.course_code,
            'course_name': course.course_name
        })
        
    except Exception as e:
        print(f"建立課程錯誤: {str(e)}")
        return Response({'error': str(e)}, status=500)