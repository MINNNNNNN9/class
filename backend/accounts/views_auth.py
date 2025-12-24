"""
認證相關的 API views
包含註冊、登入、登出功能
"""
import os
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Profile, Role


@csrf_exempt
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
    if grade == '': 
        grade = None
    
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


@csrf_exempt
@api_view(['POST'])
def login_view(request):
    """使用者登入"""
    username = request.data.get('username')
    password = request.data.get('password')

    print(f"\n{'='*60}")
    print(f"🔐 登入請求 - 用戶名: {username}")
    
    # 清除舊 session
    if request.user.is_authenticated:
        django_logout(request)

    # 驗證帳號密碼
    user = authenticate(username=username, password=password)
    if user is None:
        return Response({'error': '帳號或密碼錯誤'}, status=401)

    # 建立新的 session
    django_login(request, user)

    try:
        profile, created = Profile.objects.get_or_create(user=user)
        
        # 確保超級管理員有 admin 角色
        if user.is_superuser:
            admin_role, _ = Role.objects.get_or_create(name='admin')
            if not profile.roles.filter(name='admin').exists():
                profile.roles.add(admin_role)

        # 獲取所有角色清單
        roles = [r.name for r in profile.roles.all()]
        
        # 生成 CSRF token
        csrf_token = get_token(request)
        
        # 管理員免除強制修改
        should_force = profile.force_password_change
        if user.is_superuser or 'admin' in roles:
            should_force = False

        response_data = {
            'username': username,
            'real_name': profile.real_name,
            'csrfToken': csrf_token,
            'force_password_change': should_force,
            'roles': roles, # ✅ 永遠回傳完整角色陣列
        }
        
        # ✅ 只有在身份唯一時，才提供單一導向用的 role 欄位
        if len(roles) == 1:
            response_data['role'] = roles[0]
        
        return Response(response_data)
        
    except Exception as e:
        print(f"❌ 登入錯誤: {str(e)}")
        return Response({'error': f"系統錯誤: {str(e)}"}, status=500)


@csrf_exempt
@api_view(['POST'])
def logout_view(request):
    """使用者登出"""
    try:
        django_logout(request)
        response = Response({'message': '登出成功', 'status': 'success'})
        response.delete_cookie('sessionid')
        response.delete_cookie('csrftoken')
        return response
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def change_password(request):
    """修改密碼"""
    if not request.user.is_authenticated:
        return Response({'error': '請先登入'}, status=401)
        
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    
    if not old_password or not new_password:
        return Response({'error': '請輸入舊密碼和新密碼'}, status=400)
        
    if not request.user.check_password(old_password):
        return Response({'error': '舊密碼錯誤'}, status=400)
        
    request.user.set_password(new_password)
    request.user.save()
    
    if hasattr(request.user, 'profile'):
        request.user.profile.force_password_change = False
        request.user.profile.save()
    
    from django.contrib.auth import update_session_auth_hash
    update_session_auth_hash(request, request.user)
    return Response({'message': '密碼修改成功'})