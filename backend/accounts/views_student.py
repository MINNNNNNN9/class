"""
學生相關的 API views
包含學分統計查詢功能
"""
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import SessionAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Profile, Enrollment


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
        current_year = '114'
        current_semester = '1'
        
        # 計算歷年總學分（不包含本學期）
        historical_enrollments = Enrollment.objects.filter(
            student=user,
            status='passed'
        ).exclude(
            offering__academic_year=current_year,
            offering__semester=current_semester
        ).select_related('offering__course')
        
        print(f"歷年課程數量: {historical_enrollments.count()}")
        for enrollment in historical_enrollments:
            course = enrollment.offering.course
            print(f"  - {course.course_name}: {course.credits}學分, 類型: {course.course_type}")
        
        total_general = sum([e.offering.course.credits for e in historical_enrollments 
                            if e.offering.course.course_type in ['general_required', 'general_elective']])
        total_elective = sum([e.offering.course.credits for e in historical_enrollments 
                             if e.offering.course.course_type == 'elective'])
        total_required = sum([e.offering.course.credits for e in historical_enrollments 
                             if e.offering.course.course_type == 'required'])
        total_all = total_general + total_elective + total_required
        
        print(f"歷年學分: 通識={total_general}, 選修={total_elective}, 必修={total_required}, 總計={total_all}")
        
        # 計算本學期學分
        semester_enrollments = Enrollment.objects.filter(
            student=user,
            offering__academic_year=current_year,
            offering__semester=current_semester,
            status='enrolled'
        ).select_related('offering__course')
        
        print(f"本學期課程數量: {semester_enrollments.count()}")
        for enrollment in semester_enrollments:
            course = enrollment.offering.course
            print(f"  - {course.course_name}: {course.credits}學分, 類型: {course.course_type}")
        
        semester_general = sum([e.offering.course.credits for e in semester_enrollments 
                               if e.offering.course.course_type in ['general_required', 'general_elective']])
        semester_elective = sum([e.offering.course.credits for e in semester_enrollments 
                                if e.offering.course.course_type == 'elective'])
        semester_required = sum([e.offering.course.credits for e in semester_enrollments 
                                if e.offering.course.course_type == 'required'])
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