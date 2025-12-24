"""
認證相關的 API views
包含註冊、登入、登出功能
"""
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import ensure_csrf_cookie
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Profile, Role


@api_view(['POST'])
def register(request):
    """使用者註冊"""
    username = request.data.get('username')
    password = request.data.get('password')
    role_name = request.data.get('role')
    real_name = request.data.get('real_name')
    
    # 學生專用欄位
    student_id = request.data.get('student_id')
    department = request.data.get('department')
    grade = request.data.get('grade', 3)
    
    # 教師專用欄位
    # 教師專用欄位
    teacher_id = request.data.get('teacher_id')
    office = request.data.get('office')
    title = request.data.get('title')
    
    # 自動設定帳號 (username)
    if role_name == 'student':
        if not student_id:
            return Response({'error': '學生角色必須填寫學號'}, status=400)
        username = student_id
    elif role_name == 'teacher':
        if not teacher_id:
            return Response({'error': '教師角色必須填寫教師編號'}, status=400)
        username = teacher_id
    
    if not username or not password or not role_name:
        return Response({'error': '缺少必要欄位'}, status=400)

    # 處理數值欄位，避免空字串導致錯誤
    if grade == '': grade = None
    
    if User.objects.filter(username=username).exists():
        return Response({'error': '帳號(學號/教師編號)已存在'}, status=400)

    try:
        user = User.objects.create_user(username=username, password=password)
        
        profile = Profile.objects.create(
            user=user,
            real_name=real_name or username,
            student_id=student_id,
            teacher_id=teacher_id,
            department=department,
            grade=grade,
            office=office,
            title=title
        )
        
        # 確保角色存在
        role, _ = Role.objects.get_or_create(name=role_name)
        profile.roles.add(role)
             
        profile.save()

        return Response({'message': '註冊成功'})
    except Exception as e:
        print(f"註冊錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': f"系統錯誤: {str(e)}"}, status=500)


@ensure_csrf_cookie
@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)
    if user is None:
        return Response({'error': '帳號或密碼錯誤'}, status=401)

    django_login(request, user)

    try:
        try:
            profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            # 找不到 Profile，自動建立 (適用於 Superuser 或資料異常的帳號)
            print(f"User {username} has no profile. Auto-creating...")
            profile = Profile.objects.create(
                user=user, 
                real_name=user.username,
                grade=None
            )
            
            # 分配預設角色
            if user.is_superuser:
                role_name = 'admin'
                verbose = '管理員'
            elif user.is_staff:
                role_name = 'teacher' 
                verbose = '教師'
            else:
                role_name = 'student'
                verbose = '學生'
                
                
            role, _ = Role.objects.get_or_create(name=role_name)
            profile.roles.add(role)

        # 確保超級管理員有 admin 角色
        if user.is_superuser:
            admin_role, _ = Role.objects.get_or_create(name='admin')
            if not profile.roles.filter(name='admin').exists():
                profile.roles.add(admin_role)

        roles = [r.name for r in profile.roles.all()]
        
        # ✅ 取得全新的 CSRF token 並回傳
        csrf_token = get_token(request)
        
        # 管理員免除強制修改
        should_force = profile.force_password_change
        if user.is_superuser or 'admin' in roles:
            should_force = False

        response_data = {
            'username': username,
            'real_name': profile.real_name,
            'csrfToken': csrf_token, # 回傳給前端儲存在 localStorage
            'force_password_change': should_force,
        }
        
        # 決定導向頁面
        if 'student' in roles:
            response_data['role'] = 'student'
        elif 'teacher' in roles:
            response_data['role'] = 'teacher'
        elif 'admin' in roles:
            response_data['role'] = 'admin'
        else:
            response_data['roles'] = roles
            
        return Response(response_data)
    except Profile.DoesNotExist:
        return Response({'error': '找不到使用者資料'}, status=404)
    except Exception as e:
        print(f"登入錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': f"系統錯誤: {str(e)}"}, status=500)


@api_view(['POST'])
def logout_view(request):
    """使用者登出"""
    import os
    
    try:
        django_logout(request)
        
        response = Response({
            'message': '登出成功',
            'status': 'success'
        })
        
        # 檢測環境：有 DATABASE_URL 表示是生產環境
        is_production = bool(os.environ.get('DATABASE_URL'))
        
        if is_production:
            # 生產環境：使用 None 讓 Django 自動處理
            response.delete_cookie('sessionid', path='/', samesite='None')
            response.delete_cookie('csrftoken', path='/', samesite='None')
        else:
            # 本地開發：使用 Lax
            response.delete_cookie('sessionid', path='/', samesite='Lax')
            response.delete_cookie('csrftoken', path='/', samesite='Lax')
        
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        return response
        
    except Exception as e:
        print(f"登出錯誤: {str(e)}")
        return Response({
            'error': str(e),
            'status': 'error'
        }, status=500)


@api_view(['POST'])
def change_password(request):
    """修改密碼"""
    if not request.user.is_authenticated:
        return Response({'error': '請先登入'}, status=401)
        
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response({'error': '請輸入舊密碼和新密碼'}, status=400)
        
    # 驗證舊密碼
    if not request.user.check_password(old_password):
        return Response({'error': '舊密碼錯誤'}, status=400)
        
    # 設定新密碼
    request.user.set_password(new_password)
    request.user.save()
    
    # 更新強制修改密碼狀態
    if hasattr(request.user, 'profile'):
        request.user.profile.force_password_change = False
        request.user.profile.save()
    
    # 修改密碼後需要重新登入，或者更新 session auth hash 以保持登入狀態
    from django.contrib.auth import update_session_auth_hash
    update_session_auth_hash(request, request.user)
    
    return Response({'message': '密碼修改成功'})
