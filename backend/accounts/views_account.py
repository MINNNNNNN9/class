"""
帳號管理相關的 API views
包括學生和教師的查看、修改、刪除功能
"""
from django.contrib.auth.models import User
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Profile, Role


@api_view(['GET'])
def get_all_students(request):
    """獲取所有學生帳號"""
    try:
        # 獲取所有學生角色的用戶
        student_role = Role.objects.get(name='student')
        students = Profile.objects.filter(
            roles=student_role
        ).select_related('user').order_by('student_id')
        
        students_data = []
        for profile in students:
            students_data.append({
                'id': profile.user.id,
                'username': profile.user.username,
                'real_name': profile.real_name,
                'student_id': profile.student_id,
                'department': profile.department,
                'grade': profile.grade,
            })
        
        return Response(students_data)
        
    except Exception as e:
        print(f"獲取學生列表錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def get_all_teachers(request):
    """獲取所有教師帳號"""
    try:
        # 獲取所有教師角色的用戶
        teacher_role = Role.objects.get(name='teacher')
        teachers = Profile.objects.filter(
            roles=teacher_role
        ).select_related('user').order_by('real_name')
        
        teachers_data = []
        for profile in teachers:
            teachers_data.append({
                'id': profile.user.id,
                'username': profile.user.username,
                'real_name': profile.real_name,
                'office': profile.office,
                'title': profile.title,
            })
        
        return Response(teachers_data)
        
    except Exception as e:
        print(f"獲取教師列表錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['PUT'])
def update_student(request, user_id):
    """修改學生資料"""
    try:
        user = User.objects.get(id=user_id)
        profile = user.profile
        
        # 更新資料
        if 'real_name' in request.data:
            profile.real_name = request.data['real_name']
        
        if 'student_id' in request.data:
            # 檢查學號是否重複
            new_student_id = request.data['student_id']
            if Profile.objects.filter(student_id=new_student_id).exclude(user=user).exists():
                return Response({'error': '學號已存在'}, status=400)
            profile.student_id = new_student_id
        
        if 'department' in request.data:
            profile.department = request.data['department']
        
        if 'grade' in request.data:
            profile.grade = int(request.data['grade'])
        
        profile.save()
        
        return Response({'message': '修改成功'})
        
    except User.DoesNotExist:
        return Response({'error': '找不到該學生'}, status=404)
    except Exception as e:
        print(f"修改學生資料錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['PUT'])
def update_teacher(request, user_id):
    """修改教師資料"""
    try:
        user = User.objects.get(id=user_id)
        profile = user.profile
        
        # 更新資料
        if 'real_name' in request.data:
            profile.real_name = request.data['real_name']
        
        if 'office' in request.data:
            profile.office = request.data['office']
        
        if 'title' in request.data:
            profile.title = request.data['title']
        
        profile.save()
        
        return Response({'message': '修改成功'})
        
    except User.DoesNotExist:
        return Response({'error': '找不到該教師'}, status=404)
    except Exception as e:
        print(f"修改教師資料錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['DELETE'])
def delete_student(request, user_id):
    """刪除學生帳號"""
    try:
        user = User.objects.get(id=user_id)
        
        # 檢查是否有選課記錄
        from .models import Enrollment
        if Enrollment.objects.filter(student=user, status='enrolled').exists():
            return Response({'error': '該學生尚有選課記錄，無法刪除'}, status=400)
        
        # 刪除用戶（會連帶刪除 Profile）
        username = user.username
        user.delete()
        
        print(f"成功刪除學生帳號: {username}")
        return Response({'message': '刪除成功'})
        
    except User.DoesNotExist:
        return Response({'error': '找不到該學生'}, status=404)
    except Exception as e:
        print(f"刪除學生帳號錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['DELETE'])
def delete_teacher(request, user_id):
    """刪除教師帳號"""
    try:
        user = User.objects.get(id=user_id)
        
        # 檢查是否有開課記錄
        from .models import OfferingTeacher
        if OfferingTeacher.objects.filter(teacher=user).exists():
            return Response({'error': '該教師尚有開課記錄，無法刪除'}, status=400)
        
        # 刪除用戶（會連帶刪除 Profile）
        username = user.username
        user.delete()
        
        print(f"成功刪除教師帳號: {username}")
        return Response({'message': '刪除成功'})
        
    except User.DoesNotExist:
        return Response({'error': '找不到該教師'}, status=404)
    except Exception as e:
        print(f"刪除教師帳號錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)