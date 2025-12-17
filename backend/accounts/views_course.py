"""
課程相關的 API views
包含課程查詢、課程收藏、學生選課等功能
"""
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Course, StudentCourse, FavoriteCourse


@api_view(['GET'])
def search_courses(request):
    """
    查詢課程（帶篩選功能）
    Query Parameters:
    - department: 系所
    - semester: 學期 (1 或 2)
    - course_type: 課程類別 (required, elective, general_required, general_elective)
    - weekday: 星期幾 (1-7)
    - grade_level: 年級 (1-4)
    - academic_year: 學年度
    """
    try:
        # 獲取篩選參數
        department = request.query_params.get('department')
        semester = request.query_params.get('semester')
        course_type = request.query_params.get('course_type')
        weekday = request.query_params.get('weekday')
        grade_level = request.query_params.get('grade_level')
        academic_year = request.query_params.get('academic_year', '113')  # 預設學年度
        
        # 建立查詢
        query = Q(academic_year=academic_year)
        
        if department:
            query &= Q(department=department)
        if semester:
            query &= Q(semester=semester)
        if course_type:
            query &= Q(course_type=course_type)
        if weekday:
            query &= Q(weekday=weekday)
        if grade_level:
            query &= Q(grade_level=grade_level)
        
        # 查詢課程
        courses = Course.objects.filter(query).select_related('teacher').order_by('course_code')
        
        # 如果使用者已登入，檢查收藏狀態
        favorite_course_ids = []
        enrolled_course_ids = []
        if request.user.is_authenticated:
            favorite_course_ids = list(
                FavoriteCourse.objects.filter(student=request.user).values_list('course_id', flat=True)
            )
            enrolled_course_ids = list(
                StudentCourse.objects.filter(
                    student=request.user,
                    academic_year=academic_year,
                    semester=semester or '1',
                    status='enrolled'
                ).values_list('course_id', flat=True)
            )
        
        # 組裝課程資料
        courses_data = []
        for course in courses:
            course_data = {
                'id': course.id,
                'course_code': course.course_code,
                'course_name': course.course_name,
                'course_type': course.get_course_type_display(),
                'course_type_value': course.course_type,
                'description': course.description,
                'credits': course.credits,
                'hours': course.hours,
                'academic_year': course.academic_year,
                'semester': course.get_semester_display(),
                'semester_value': course.semester,
                'department': course.department,
                'grade_level': course.grade_level,
                'teacher_name': course.teacher.profile.real_name if course.teacher and hasattr(course.teacher, 'profile') else '未設定',
                'classroom': course.classroom,
                'weekday': course.get_weekday_display(),
                'weekday_value': course.weekday,
                'time_display': course.get_time_display(),
                'start_period': course.start_period,
                'end_period': course.end_period,
                'max_students': course.max_students,
                'current_students': course.current_students,
                'status': course.get_status_display(),
                'status_value': course.status,
                'is_full': course.is_full(),
                'is_favorited': course.id in favorite_course_ids,
                'is_enrolled': course.id in enrolled_course_ids,
            }
            courses_data.append(course_data)
        
        print(f"查詢到 {len(courses_data)} 門課程")
        return Response({
            'courses': courses_data,
            'count': len(courses_data)
        })
        
    except Exception as e:
        print(f"查詢課程錯誤: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def get_filter_options(request):
    """獲取所有可用的篩選選項"""
    try:
        academic_year = request.query_params.get('academic_year', '113')
        
        courses = Course.objects.filter(academic_year=academic_year)
        
        # 獲取所有唯一的系所
        departments = courses.values_list('department', flat=True).distinct().order_by('department')
        
        filter_options = {
            'departments': list(departments),
            'semesters': [
                {'value': '1', 'label': '上學期'},
                {'value': '2', 'label': '下學期'},
            ],
            'course_types': [
                {'value': 'required', 'label': '必修'},
                {'value': 'elective', 'label': '選修'},
                {'value': 'general_required', 'label': '通識(必修)'},
                {'value': 'general_elective', 'label': '通識(選修)'},
            ],
            'weekdays': [
                {'value': '1', 'label': '星期一'},
                {'value': '2', 'label': '星期二'},
                {'value': '3', 'label': '星期三'},
                {'value': '4', 'label': '星期四'},
                {'value': '5', 'label': '星期五'},
                {'value': '6', 'label': '星期六'},
                {'value': '7', 'label': '星期日'},
            ],
            'grade_levels': [
                {'value': 1, 'label': '一年級'},
                {'value': 2, 'label': '二年級'},
                {'value': 3, 'label': '三年級'},
                {'value': 4, 'label': '四年級'},
            ],
        }
        
        return Response(filter_options)
        
    except Exception as e:
        print(f"獲取篩選選項錯誤: {str(e)}")
        return Response({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def toggle_favorite(request, course_id):
    """切換課程收藏狀態"""
    try:
        course = Course.objects.get(id=course_id)
        
        # 檢查是否已收藏
        favorite = FavoriteCourse.objects.filter(student=request.user, course=course).first()
        
        if favorite:
            # 如果已收藏，則取消收藏
            favorite.delete()
            return Response({
                'message': '已取消收藏',
                'is_favorited': False
            })
        else:
            # 如果未收藏，則添加收藏
            FavoriteCourse.objects.create(student=request.user, course=course)
            return Response({
                'message': '已加入收藏',
                'is_favorited': True
            })
            
    except Course.DoesNotExist:
        return Response({'error': '找不到該課程'}, status=404)
    except Exception as e:
        print(f"切換收藏錯誤: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def get_favorite_courses(request):
    """獲取使用者收藏的課程列表"""
    try:
        favorites = FavoriteCourse.objects.filter(student=request.user).select_related('course', 'course__teacher')
        
        courses_data = []
        for favorite in favorites:
            course = favorite.course
            
            # 檢查是否已選課
            is_enrolled = StudentCourse.objects.filter(
                student=request.user,
                course=course,
                status='enrolled'
            ).exists()
            
            course_data = {
                'id': course.id,
                'course_code': course.course_code,
                'course_name': course.course_name,
                'course_type': course.get_course_type_display(),
                'course_type_value': course.course_type,
                'description': course.description,
                'credits': course.credits,
                'hours': course.hours,
                'academic_year': course.academic_year,
                'semester': course.get_semester_display(),
                'semester_value': course.semester,
                'department': course.department,
                'grade_level': course.grade_level,
                'teacher_name': course.teacher.profile.real_name if course.teacher and hasattr(course.teacher, 'profile') else '未設定',
                'classroom': course.classroom,
                'weekday': course.get_weekday_display(),
                'time_display': course.get_time_display(),
                'start_period': course.start_period,
                'end_period': course.end_period,
                'max_students': course.max_students,
                'current_students': course.current_students,
                'status': course.get_status_display(),
                'status_value': course.status,
                'is_full': course.is_full(),
                'is_favorited': True,
                'is_enrolled': is_enrolled,
                'favorited_at': favorite.created_at.isoformat(),
            }
            courses_data.append(course_data)
        
        return Response({
            'courses': courses_data,
            'count': len(courses_data)
        })
        
    except Exception as e:
        print(f"獲取收藏課程錯誤: {str(e)}")
        return Response({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def enroll_course(request, course_id):
    """學生選課"""
    try:
        course = Course.objects.get(id=course_id)
        user = request.user
        
        # 檢查課程狀態
        if course.status == 'closed':
            return Response({'error': '該課程已停開'}, status=400)
        
        if course.status == 'full' or course.is_full():
            return Response({'error': '該課程已額滿'}, status=400)
        
        # 檢查是否已經選過這門課
        existing_enrollment = StudentCourse.objects.filter(
            student=user,
            course=course,
            academic_year=course.academic_year,
            semester=course.semester
        ).first()
        
        if existing_enrollment:
            if existing_enrollment.status == 'enrolled':
                return Response({'error': '您已經選過這門課了'}, status=400)
            elif existing_enrollment.status == 'passed':
                return Response({'error': '您已經通過這門課了'}, status=400)
        
        # 檢查時間衝突
        time_conflict = StudentCourse.objects.filter(
            student=user,
            academic_year=course.academic_year,
            semester=course.semester,
            status='enrolled',
            course__weekday=course.weekday
        ).select_related('course').filter(
            Q(course__start_period__lte=course.end_period, course__end_period__gte=course.start_period)
        )
        
        if time_conflict.exists():
            conflict_course = time_conflict.first().course
            return Response({
                'error': f'時間衝突：與 {conflict_course.course_name} ({conflict_course.get_time_display()}) 衝堂'
            }, status=400)
        
        # 建立選課記錄
        StudentCourse.objects.create(
            student=user,
            course=course,
            academic_year=course.academic_year,
            semester=course.semester,
            status='enrolled'
        )
        
        # 更新課程人數
        course.current_students += 1
        if course.current_students >= course.max_students:
            course.status = 'full'
        course.save()
        
        print(f"選課成功: {user.username} - {course.course_name}")
        return Response({
            'message': '選課成功',
            'course_name': course.course_name
        })
        
    except Course.DoesNotExist:
        return Response({'error': '找不到該課程'}, status=404)
    except Exception as e:
        print(f"選課錯誤: {str(e)}")
        return Response({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['POST'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def drop_course(request, course_id):
    """學生退選課程"""
    try:
        course = Course.objects.get(id=course_id)
        user = request.user
        
        # 查找選課記錄
        enrollment = StudentCourse.objects.filter(
            student=user,
            course=course,
            status='enrolled'
        ).first()
        
        if not enrollment:
            return Response({'error': '您尚未選修這門課'}, status=400)
        
        # 更新選課記錄狀態
        enrollment.status = 'dropped'
        enrollment.save()
        
        # 更新課程人數
        course.current_students -= 1
        if course.status == 'full' and course.current_students < course.max_students:
            course.status = 'open'
        course.save()
        
        print(f"退選成功: {user.username} - {course.course_name}")
        return Response({
            'message': '退選成功',
            'course_name': course.course_name
        })
        
    except Course.DoesNotExist:
        return Response({'error': '找不到該課程'}, status=404)
    except Exception as e:
        print(f"退選錯誤: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@authentication_classes([SessionAuthentication])
@permission_classes([IsAuthenticated])
def get_enrolled_courses(request):
    """獲取學生已選課程"""
    try:
        academic_year = request.query_params.get('academic_year', '113')
        semester = request.query_params.get('semester', '1')
        
        enrollments = StudentCourse.objects.filter(
            student=request.user,
            academic_year=academic_year,
            semester=semester,
            status='enrolled'
        ).select_related('course', 'course__teacher')
        
        courses_data = []
        for enrollment in enrollments:
            course = enrollment.course
            
            # 檢查是否收藏
            is_favorited = FavoriteCourse.objects.filter(
                student=request.user,
                course=course
            ).exists()
            
            course_data = {
                'id': course.id,
                'course_code': course.course_code,
                'course_name': course.course_name,
                'course_type': course.get_course_type_display(),
                'course_type_value': course.course_type,
                'description': course.description,
                'credits': course.credits,
                'hours': course.hours,
                'academic_year': course.academic_year,
                'semester': course.get_semester_display(),
                'department': course.department,
                'grade_level': course.grade_level,
                'teacher_name': course.teacher.profile.real_name if course.teacher and hasattr(course.teacher, 'profile') else '未設定',
                'classroom': course.classroom,
                'weekday': course.get_weekday_display(),
                'weekday_value': course.weekday,
                'time_display': course.get_time_display(),
                'start_period': course.start_period,
                'end_period': course.end_period,
                'max_students': course.max_students,
                'current_students': course.current_students,
                'status': course.get_status_display(),
                'is_full': course.is_full(),
                'is_favorited': is_favorited,
                'is_enrolled': True,
                'enrolled_date': enrollment.enrolled_date.isoformat(),
            }
            courses_data.append(course_data)
        
        return Response({
            'courses': courses_data,
            'count': len(courses_data),
            'total_credits': sum([c['credits'] for c in courses_data])
        })
        
    except Exception as e:
        print(f"獲取已選課程錯誤: {str(e)}")
        return Response({'error': str(e)}, status=500)