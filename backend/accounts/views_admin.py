"""
管理員相關的 API views
包含教師列表、課程建立、課程刪除等功能
"""
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Profile, Role, Course


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


@api_view(['GET'])
def get_all_courses(request):
    """獲取所有課程列表"""
    try:
        courses = Course.objects.all().select_related('teacher').order_by('-created_at')
        
        courses_data = []
        for course in courses:
            courses_data.append({
                'id': course.id,
                'course_code': course.course_code,
                'course_name': course.course_name,
                'course_type': course.course_type,
                'description': course.description,
                'credits': course.credits,
                'hours': course.hours,
                'academic_year': course.academic_year,
                'semester': course.semester,
                'department': course.department,
                'grade_level': course.grade_level,
                'teacher_id': course.teacher.id if course.teacher else None,
                'teacher_name': course.teacher.profile.real_name if course.teacher and hasattr(course.teacher, 'profile') else '未設定',
                'classroom': course.classroom,
                'weekday': course.weekday,
                'start_period': course.start_period,
                'end_period': course.end_period,
                'max_students': course.max_students,
                'current_students': course.current_students,
                'status': course.status,
            })
        
        print(f"找到 {len(courses_data)} 門課程")
        return Response(courses_data)
        
    except Exception as e:
        print(f"錯誤: {str(e)}")
        return Response({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['DELETE'])
def delete_course(request, course_id):
    """刪除課程"""
    try:
        course = Course.objects.get(id=course_id)
        course_name = course.course_name
        course.delete()
        
        print(f"課程刪除成功: {course_name}")
        return Response({'message': '課程刪除成功'})
        
    except Course.DoesNotExist:
        return Response({'error': '找不到該課程'}, status=404)
    except Exception as e:
        print(f"刪除課程錯誤: {str(e)}")
        return Response({'error': str(e)}, status=500)