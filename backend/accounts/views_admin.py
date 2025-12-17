"""
管理員相關的 API views
包含教師列表、課程建立、課程刪除等功能
"""
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Profile, Role, Course, CourseOffering, OfferingTeacher, ClassTime, Department


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
    """建立新課程（包含開課資料）"""
    try:
        # 獲取表單資料
        course_code = request.data.get('course_code')
        course_name = request.data.get('course_name')
        course_type = request.data.get('course_type')
        description = request.data.get('description', '')
        credits = request.data.get('credits')
        academic_year = request.data.get('academic_year')
        semester = request.data.get('semester')
        department_name = request.data.get('department')
        grade_level = request.data.get('grade_level')
        teacher_id = request.data.get('teacher_id')
        classroom = request.data.get('classroom')
        weekday = request.data.get('weekday')
        start_period = request.data.get('start_period')
        end_period = request.data.get('end_period')
        max_students = request.data.get('max_students', 50)
        
        # 驗證必填欄位
        if not all([course_code, course_name, course_type, credits,
                   academic_year, semester, department_name, grade_level, teacher_id,
                   classroom, weekday, start_period, end_period]):
            return Response({'error': '缺少必要欄位'}, status=400)
        
        # 檢查教師是否存在
        try:
            teacher = User.objects.get(id=teacher_id)
        except User.DoesNotExist:
            return Response({'error': '找不到該教師'}, status=404)
        
        # 取得或建立系所
        department, _ = Department.objects.get_or_create(name=department_name)
        
        # 檢查課程是否已存在，不存在就建立
        course, created = Course.objects.get_or_create(
            course_code=course_code,
            defaults={
                'course_name': course_name,
                'course_type': course_type,
                'description': description,
                'credits': credits,
            }
        )
        
        if not created:
            # 課程已存在，更新資料
            course.course_name = course_name
            course.course_type = course_type
            course.description = description
            course.credits = credits
            course.save()
        
        # 建立開課資料
        offering = CourseOffering.objects.create(
            course=course,
            department=department,
            academic_year=academic_year,
            semester=semester,
            grade_level=grade_level,
            max_students=max_students,
            current_students=0,
            status='open'
        )
        
        # 建立開課教師
        OfferingTeacher.objects.create(
            offering=offering,
            teacher=teacher,
            role='main'
        )
        
        # 建立上課時段
        ClassTime.objects.create(
            offering=offering,
            weekday=weekday,
            start_period=start_period,
            end_period=end_period,
            classroom=classroom
        )
        
        print(f"課程建立成功: {course.course_code} - {course.course_name}")
        return Response({
            'message': '課程建立成功',
            'course_id': course.id,
            'offering_id': offering.id,
            'course_code': course.course_code,
            'course_name': course.course_name
        })
        
    except Exception as e:
        print(f"建立課程錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def get_all_courses(request):
    """獲取所有開課資料"""
    try:
        offerings = CourseOffering.objects.all().select_related(
            'course', 'department'
        ).prefetch_related(
            'offering_teachers__teacher__profile',
            'class_times'
        ).order_by('-created_at')
        
        courses_data = []
        for offering in offerings:
            # 取得第一個上課時段
            first_time = offering.class_times.first()
            
            # 取得主要教師
            main_teacher = offering.offering_teachers.filter(role='main').first()
            
            courses_data.append({
                'id': offering.id,
                'course_code': offering.course.course_code,
                'course_name': offering.course.course_name,
                'course_type': offering.course.course_type,
                'description': offering.course.description,
                'credits': offering.course.credits,
                'academic_year': offering.academic_year,
                'semester': offering.semester,
                'department': offering.department.name,
                'grade_level': offering.grade_level,
                'teacher_id': main_teacher.teacher.id if main_teacher else None,
                'teacher_name': main_teacher.teacher.profile.real_name if main_teacher and hasattr(main_teacher.teacher, 'profile') else '未設定',
                'classroom': first_time.classroom if first_time else '',
                'weekday': first_time.weekday if first_time else '',
                'start_period': first_time.start_period if first_time else 0,
                'end_period': first_time.end_period if first_time else 0,
                'max_students': offering.max_students,
                'current_students': offering.current_students,
                'status': offering.status,
            })
        
        print(f"找到 {len(courses_data)} 門開課")
        return Response(courses_data)
        
    except Exception as e:
        print(f"錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['DELETE'])
def delete_course(request, course_id):
    """刪除開課資料"""
    try:
        offering = CourseOffering.objects.get(id=course_id)
        course_name = offering.course.course_name
        offering.delete()
        
        print(f"開課刪除成功: {course_name}")
        return Response({'message': '課程刪除成功'})
        
    except CourseOffering.DoesNotExist:
        return Response({'error': '找不到該開課資料'}, status=404)
    except Exception as e:
        print(f"刪除課程錯誤: {str(e)}")
        return Response({'error': str(e)}, status=500)