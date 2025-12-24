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
                'teacher_id': profile.teacher_id or profile.user.username, # 若無 teacher_id 則暫用 username
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
            grade_val = request.data['grade']
            if grade_val in [None, '']:
                profile.grade = None
            else:
                try:
                    profile.grade = int(grade_val)
                except (ValueError, TypeError):
                    pass
        
        profile.save()
        
        return Response({'message': '修改成功'})
        
    except User.DoesNotExist:
        return Response({'error': '找不到該學生'}, status=404)
    except Exception as e:
        print(f"修改學生資料錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def upload_avatar(request):
    """上傳大頭貼"""
    if not request.user.is_authenticated:
        return Response({'error': '請先登入'}, status=401)
    
    try:
        profile = request.user.profile
        
        if 'avatar' not in request.FILES:
            return Response({'error': '請選擇圖片'}, status=400)
        
        avatar_file = request.FILES['avatar']
        
        # 檢查文件類型
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if avatar_file.content_type not in allowed_types:
            return Response({'error': '只支援 JPG、PNG、GIF、WebP 格式'}, status=400)
        
        # 檢查文件大小 (最大 5MB)
        if avatar_file.size > 5 * 1024 * 1024:
            return Response({'error': '圖片大小不能超過 5MB'}, status=400)
        
        # 刪除舊頭像
        if profile.avatar:
            profile.avatar.delete(save=False)
        
        # 保存新頭像
        profile.avatar = avatar_file
        profile.save()
        
        # 返回新頭像的 URL
        avatar_url = request.build_absolute_uri(profile.avatar.url) if profile.avatar else None
        
        return Response({
            'message': '上傳成功',
            'avatar_url': avatar_url
        })
        
    except Exception as e:
        print(f"上傳大頭貼錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['DELETE'])
def delete_avatar(request):
    """刪除大頭貼"""
    if not request.user.is_authenticated:
        return Response({'error': '請先登入'}, status=401)
    
    try:
        profile = request.user.profile
        
        if profile.avatar:
            profile.avatar.delete(save=True)
        
        return Response({'message': '大頭貼已刪除'})
        
    except Exception as e:
        print(f"刪除大頭貼錯誤: {str(e)}")
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
def get_avatar(request):
    """獲取當前用戶頭像"""
    if not request.user.is_authenticated:
        return Response({'error': '請先登入'}, status=401)
    
    try:
        profile = request.user.profile
        avatar_url = request.build_absolute_uri(profile.avatar.url) if profile.avatar else None
        
        return Response({
            'avatar_url': avatar_url
        })
        
    except Exception as e:
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


@api_view(['GET'])
def get_profile_info(request):
    """獲取當前用戶的基本資料 (通用)"""
    if not request.user.is_authenticated:
        return Response({'error': '請先登入'}, status=401)
    
    try:
        user = request.user
        profile = user.profile
        
        data = {
            'username': user.username,
            'real_name': profile.real_name or user.username,
            'avatar_url': request.build_absolute_uri(profile.avatar.url) if profile.avatar else None,
            'roles': [r.name for r in profile.roles.all()],
        }
        
        # 根據角色附加資料
        if profile.roles.filter(name='student').exists():
            data['student_id'] = profile.student_id
            data['department'] = profile.department
            data['grade'] = profile.grade
        
        if profile.roles.filter(name='teacher').exists():
            data['teacher_id'] = profile.teacher_id or user.username
            data['office'] = profile.office
            data['title'] = profile.title
            
        return Response(data)
        
    except Exception as e:
        print(f"獲取個人資料錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def reset_password(request, user_id):
    """管理員重設用戶密碼"""
    try:
        # 1. 檢查權限 (只有管理員可以操作)
        if not request.user.is_superuser:
            # 檢查是否有 admin 角色
            is_admin = False
            if hasattr(request.user, 'profile'):
                is_admin = request.user.profile.roles.filter(name='admin').exists()
            
            if not is_admin:
                return Response({'error': '權限不足'}, status=403)
        
        # 2. 獲取目標用戶
        target_user = User.objects.get(id=user_id)
        
        # 不允許重設超級管理員密碼
        if target_user.is_superuser:
            return Response({'error': '無法重設超級管理員密碼'}, status=403)
            
        # 3. 設定預設密碼
        # 優先使用學號/教師編號，如果沒有則使用 username
        default_pwd = target_user.username
        if hasattr(target_user, 'profile'):
            if target_user.profile.student_id:
                default_pwd = target_user.profile.student_id
            elif target_user.profile.teacher_id:
                default_pwd = target_user.profile.teacher_id
                
        target_user.set_password(default_pwd)
        target_user.save()
        
        # 4. 強制下次登入修改密碼
        if hasattr(target_user, 'profile'):
            target_user.profile.force_password_change = True
            target_user.profile.save()
            
        print(f"管理員 {request.user.username} 重設了 {target_user.username} 的密碼")
            
        return Response({
            'message': f'密碼已重設為: {default_pwd}，且使用者下次登入時須強制修改密碼。',
            'new_password': default_pwd
        })
        
    except User.DoesNotExist:
        return Response({'error': '找不到該用戶'}, status=404)
    except Exception as e:
        print(f"重設密碼錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=500)