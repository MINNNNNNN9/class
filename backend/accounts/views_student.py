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
    """獲取學生的學分統計 (強化穩健性)"""
    try:
        user = request.user
        
        # 嘗試獲取 Profile
        # 嘗試獲取 Profile，如果不存在則自動修復
        if hasattr(user, 'profile'):
            profile = user.profile
        else:
            try:
                profile = Profile.objects.get(user=user)
            except Profile.DoesNotExist:
                # 自動修復：建立預設 Profile
                print(f"Warning: User {user.username} has no profile. Auto-creating in get_credit_summary...")
                profile = Profile.objects.create(
                    user=user, 
                    real_name=user.username,
                    student_id=user.username if not user.is_staff else None,
                    grade=1 # 預設一年級
                )
                
                # 確保角色存在
                roles = []
                if user.is_staff:
                    role_name = 'teacher'
                elif user.is_superuser:
                    role_name = 'admin'
                else:
                    role_name = 'student'
                    
                role, _ = Role.objects.get_or_create(name=role_name)
                profile.roles.add(role)
                profile.save()

        # 準備預設數據結構
        data = {
            'user_info': {
                'real_name': getattr(profile, 'real_name', user.username) or user.username,
                'student_id': getattr(profile, 'student_id', '未設定') or '未設定',
                'department': getattr(profile, 'department', '未設定') or '未設定',
                'grade': f"{profile.grade}年級" if getattr(profile, 'grade', None) else '未設定',
            },
            'total_credits': {'general': 0, 'elective': 0, 'required': 0, 'all': 0},
            'semester_credits': {'general': 0, 'elective': 0, 'required': 0, 'all': 0},
        }

        # 如果沒有 Enrollment 屬性 (例如 Teacher 誤入)，直接回傳預設值
        if not hasattr(user, 'enrollments'):
             return Response(data)

        # 當前學期設定
        current_year = '114'
        current_semester = '1'
        
        # 1. 計算歷年總學分
        try:
            # 使用 getattr 安全存取，避免關聯不存在錯誤
            historical_enrollments = Enrollment.objects.filter(
                student=user,
                status='passed'
            ).exclude(
                offering__academic_year=current_year,
                offering__semester=current_semester
            ).select_related('offering__course')

            for enrollment in historical_enrollments:
                # 再次確認關聯存在
                if not enrollment.offering or not enrollment.offering.course:
                    continue
                    
                course = enrollment.offering.course
                credits = getattr(course, 'credits', 0) or 0
                ctype = getattr(course, 'course_type', '')

                if ctype in ['general_required', 'general_elective']:
                    data['total_credits']['general'] += credits
                elif ctype == 'elective':
                    data['total_credits']['elective'] += credits
                elif ctype == 'required':
                    data['total_credits']['required'] += credits
            
            data['total_credits']['all'] = (
                data['total_credits']['general'] + 
                data['total_credits']['elective'] + 
                data['total_credits']['required']
            )
        except Exception as e:
            print(f"計算歷年學分時發生錯誤 (已忽略): {e}")

        # 2. 計算本學期學分
        try:
            semester_enrollments = Enrollment.objects.filter(
                student=user,
                offering__academic_year=current_year,
                offering__semester=current_semester,
                status='enrolled'
            ).select_related('offering__course')
            
            for enrollment in semester_enrollments:
                if not enrollment.offering or not enrollment.offering.course:
                    continue
                    
                course = enrollment.offering.course
                credits = getattr(course, 'credits', 0) or 0
                ctype = getattr(course, 'course_type', '')

                if ctype in ['general_required', 'general_elective']:
                    data['semester_credits']['general'] += credits
                elif ctype == 'elective':
                    data['semester_credits']['elective'] += credits
                elif ctype == 'required':
                    data['semester_credits']['required'] += credits

            data['semester_credits']['all'] = (
                data['semester_credits']['general'] + 
                data['semester_credits']['elective'] + 
                data['semester_credits']['required']
            )
        except Exception as e:
            print(f"計算本學期學分時發生錯誤 (已忽略): {e}")

        return Response(data)
        
    except Exception as e:
        print(f"嚴重系統錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': f"系統錯誤: {str(e)}"}, status=500)