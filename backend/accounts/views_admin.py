# -*- coding: utf-8 -*-
"""
管理員相關的 API views
包含教師列表、課程建立、課程刪除等功能
支援多位教師（主開課和協同）
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


def get_or_create_teacher(teacher_name):
    """根據姓名取得或創建教師帳號"""
    # 檢查是否已存在同名教師
    existing_profile = Profile.objects.filter(real_name=teacher_name).first()
    if existing_profile:
        print(f"使用已存在的教師: {teacher_name}")
        return existing_profile.user
    
    # 創建新教師帳號
    import random
    import string
    username = f"teacher_{teacher_name}_{random.randint(1000, 9999)}"
    password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
    
    # 創建 User
    teacher = User.objects.create_user(
        username=username,
        password=password,
        first_name=teacher_name
    )
    
    # 創建 Profile
    teacher_role = Role.objects.get_or_create(name='teacher', defaults={'name': 'teacher'})[0]
    profile = Profile.objects.create(
        user=teacher,
        real_name=teacher_name,
        title='教師'
    )
    profile.roles.add(teacher_role)
    
    print(f"自動創建新教師: {teacher_name} (username: {username}, password: {password})")
    return teacher


@csrf_exempt
@api_view(['POST'])
def create_course(request):
    """建立新課程（支援多位教師：主開課和協同，可自動創建新教師）"""
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
        
        # 教師資料（支援多位教師）
        main_teacher_id = request.data.get('teacher_id')  # 主開課教師 ID
        main_teacher_name = request.data.get('teacher_name')  # 主開課教師姓名（如果要新建）
        co_teacher_ids = request.data.get('co_teachers', [])  # 協同教師 ID 列表
        co_teacher_names = request.data.get('co_teacher_names', [])  # 協同教師姓名列表（如果要新建）
        
        classroom = request.data.get('classroom')
        weekday = request.data.get('weekday')
        start_period = request.data.get('start_period')
        end_period = request.data.get('end_period')
        max_students = request.data.get('max_students', 50)
        
        print(f"創建課程: {course_name}")
        print(f"主開課教師 ID: {main_teacher_id}")
        print(f"主開課教師姓名: {main_teacher_name}")
        print(f"協同教師 IDs: {co_teacher_ids}")
        
        # 驗證必填欄位
        if not all([course_code, course_name, course_type, credits,
                   academic_year, semester, department_name, grade_level,
                   classroom, weekday, start_period, end_period]):
            return Response({'error': '缺少必要欄位'}, status=400)
        
        # 必須有教師 ID 或教師姓名
        if not main_teacher_id and not main_teacher_name:
            return Response({'error': '請選擇教師或輸入新教師姓名'}, status=400)
        
        # 處理主開課教師
        main_teacher = None
        if main_teacher_id:
            # 使用現有教師
            try:
                main_teacher = User.objects.get(id=main_teacher_id)
                print(f"找到主開課教師: {main_teacher.profile.real_name if hasattr(main_teacher, 'profile') else main_teacher.username}")
            except User.DoesNotExist:
                return Response({'error': '找不到主開課教師'}, status=404)
        elif main_teacher_name:
            # 創建或使用現有教師
            main_teacher = get_or_create_teacher(main_teacher_name)
        
        # 處理協同教師
        co_teachers = []
        
        # 處理協同教師 ID（現有教師）
        if co_teacher_ids:
            for teacher_id in co_teacher_ids:
                try:
                    teacher = User.objects.get(id=int(teacher_id))
                    co_teachers.append(teacher)
                    print(f"找到協同教師: {teacher.profile.real_name if hasattr(teacher, 'profile') else teacher.username}")
                except User.DoesNotExist:
                    return Response({'error': f'找不到協同教師 ID: {teacher_id}'}, status=404)
        
        # 處理協同教師姓名（需要創建的教師）
        if co_teacher_names:
            for teacher_name in co_teacher_names:
                teacher = get_or_create_teacher(teacher_name)
                co_teachers.append(teacher)
                print(f"協同教師: {teacher_name}")
        
        # 取得或建立系所
        department, _ = Department.objects.get_or_create(name=department_name)
        
        # 取得或創建課程（課程本身可以重複使用）
        course, created = Course.objects.get_or_create(
            course_code=course_code,
            defaults={
                'course_name': course_name,
                'course_type': course_type,
                'description': description,
                'credits': credits
            }
        )
        
        if not created:
            # 課程已存在，更新資料（保持最新）
            course.course_name = course_name
            course.course_type = course_type
            course.description = description
            course.credits = credits
            course.save()
            print(f"使用現有課程並更新: {course.course_name}")
        else:
            print(f"建立新課程: {course.course_name}")
        
        # 檢查是否有完全相同的開課（同一課程、同學期、同系所、同時間）
        # 注意：不同時間的課可以存在！
        existing_offering = CourseOffering.objects.filter(
            course=course,
            academic_year=academic_year,
            semester=semester,
            department=department
        ).prefetch_related('class_times').first()
        
        # 如果找到同學期同系所的開課，檢查時間是否衝突
        if existing_offering:
            # 檢查時間是否完全相同
            existing_time = existing_offering.class_times.filter(
                weekday=weekday,
                start_period=int(start_period),
                end_period=int(end_period),
                classroom=classroom
            ).first()
            
            if existing_time:
                # 時間完全相同，這是重複的開課
                return Response({
                    'error': f'課程「{course_name}」在 {academic_year} 學年度第 {semester} 學期，星期{weekday} 第{start_period}-{end_period}節已存在'
                }, status=400)
            # 時間不同，允許創建新的開課
            print(f"同一課程但不同時間，允許創建新開課")
        
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
        print(f"建立開課記錄 ID: {offering.id}")
        
        # 建立主開課教師關係
        OfferingTeacher.objects.create(
            offering=offering,
            teacher=main_teacher,
            role='main'
        )
        print(f"設定主開課教師: {main_teacher.profile.real_name if hasattr(main_teacher, 'profile') else main_teacher.username}")
        
        # 建立協同教師關係
        for co_teacher in co_teachers:
            OfferingTeacher.objects.create(
                offering=offering,
                teacher=co_teacher,
                role='co'
            )
            teacher_name = co_teacher.profile.real_name if hasattr(co_teacher, 'profile') else co_teacher.username
            print(f"設定協同教師: {teacher_name}")
        
        # 建立上課時段
        ClassTime.objects.create(
            offering=offering,
            weekday=weekday,
            start_period=start_period,
            end_period=end_period,
            classroom=classroom
        )
        print(f"設定上課時間: 星期{weekday} 第{start_period}-{end_period}節 @ {classroom}")
        
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
    """獲取所有開課資料（包含所有教師資訊），支持篩選"""
    try:
        # 獲取查詢參數
        academic_year = request.GET.get('academic_year', '')
        semester = request.GET.get('semester', '')
        department = request.GET.get('department', '')
        grade_level = request.GET.get('grade_level', '')
        keyword = request.GET.get('keyword', '').strip()
        
        print(f"管理員查詢課程 - 學年:{academic_year}, 學期:{semester}, 系所:{department}, 年級:{grade_level}, 關鍵字:{keyword}")
        
        # 基本查詢
        offerings = CourseOffering.objects.all().select_related(
            'course', 'department'
        ).prefetch_related(
            'offering_teachers__teacher__profile',
            'class_times'
        )
        
        # 應用篩選條件
        if academic_year:
            offerings = offerings.filter(academic_year=academic_year)
        
        if semester:
            offerings = offerings.filter(semester=semester)
        
        if department:
            offerings = offerings.filter(department__name=department)
        
        if grade_level:
            offerings = offerings.filter(grade_level=int(grade_level))
        
        # 關鍵字搜尋（課程代碼、課程名稱、教師姓名）
        if keyword:
            from django.db.models import Q
            offerings = offerings.filter(
                Q(course__course_name__icontains=keyword) |
                Q(course__course_code__icontains=keyword) |
                Q(offering_teachers__teacher__profile__real_name__icontains=keyword)
            ).distinct()
        
        # 排序
        offerings = offerings.order_by('-created_at')
        
        print(f"找到 {offerings.count()} 門開課")
        
        courses_data = []
        for offering in offerings:
            # 取得第一個上課時段
            first_time = offering.class_times.first()
            
            # 取得主要教師
            main_teacher = offering.offering_teachers.filter(role='main').first()
            
            # 取得所有協同教師
            co_teachers = offering.offering_teachers.filter(role='co').select_related('teacher__profile')
            co_teacher_ids = [t.teacher.id for t in co_teachers]
            co_teacher_names = [
                t.teacher.profile.real_name if hasattr(t.teacher, 'profile') else t.teacher.username
                for t in co_teachers
            ]
            
            # 組合教師顯示文字
            teacher_display = ''
            if main_teacher:
                main_name = main_teacher.teacher.profile.real_name if hasattr(main_teacher.teacher, 'profile') else main_teacher.teacher.username
                if co_teacher_names:
                    teacher_display = f"{main_name}（主）、{' 、 '.join(co_teacher_names)}"
                else:
                    teacher_display = main_name
            else:
                teacher_display = '未設定'
            
            courses_data.append({
                'id': offering.id,
                'course_code': offering.course.course_code,
                'course_name': offering.course.course_name,
                'course_type': offering.course.course_type,
                'description': offering.course.description,
                'credits': offering.course.credits,
                'hours': offering.course.credits,  # 假設時數等於學分
                'academic_year': offering.academic_year,
                'semester': offering.semester,
                'department': offering.department.name,
                'grade_level': offering.grade_level,
                'teacher_id': main_teacher.teacher.id if main_teacher else None,
                'teacher_name': main_teacher.teacher.profile.real_name if main_teacher and hasattr(main_teacher.teacher, 'profile') else '未設定',
                'teacher_display': teacher_display,  # 完整的教師顯示文字
                'co_teachers': co_teacher_ids,  # 協同教師 ID 列表
                'co_teacher_names': co_teacher_names,  # 協同教師名稱列表
                'classroom': first_time.classroom if first_time else '',
                'weekday': first_time.weekday if first_time else '',
                'start_period': first_time.start_period if first_time else 0,
                'end_period': first_time.end_period if first_time else 0,
                'max_students': offering.max_students,
                'current_students': offering.current_students,
                'status': offering.status,
            })
        
        print(f"返回 {len(courses_data)} 門開課資料")
        return Response(courses_data)
        
    except Exception as e:
        print(f"錯誤: {str(e)}")
        import traceback
        traceback.print_exc()({
                'department': offering.department.name,
                'grade_level': offering.grade_level,
                'teacher_id': main_teacher.teacher.id if main_teacher else None,
                'teacher_name': main_teacher.teacher.profile.real_name if main_teacher and hasattr(main_teacher.teacher, 'profile') else '未設定',
                'teacher_display': teacher_display,  # 完整的教師顯示文字
                'co_teachers': co_teacher_ids,  # 協同教師 ID 列表
                'co_teacher_names': co_teacher_names,  # 協同教師名稱列表
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