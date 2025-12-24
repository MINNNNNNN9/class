"""
認證相關的 API views
包含註冊、登入、登出功能
"""
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
    
    student_id = request.data.get('student_id')
    department = request.data.get('department')
    grade = request.data.get('grade', 3)
    
    teacher_id = request.data.get('teacher_id')
    office = request.data.get('office')
    title = request.data.get('title')
    
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
        print(f"⚠️ 檢測到舊 session (用戶: {request.user.username})，清除中...")
        django_logout(request)

    user = authenticate(username=username, password=password)
    if user is None:
        print(f"❌ 認證失敗: 帳號或密碼錯誤")
        return Response({'error': '帳號或密碼錯誤'}, status=401)

    django_login(request, user)
    print(f"✅ 用戶 {username} 登入成功")

    try:
        try:
            profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            print(f"⚠️ User {username} has no profile. Auto-creating...")
            profile = Profile.objects.create(
                user=user, 
                real_name=user.username,
                grade=None
            )
            
            if user.is_superuser:
                role_name = 'admin'
            elif user.is_staff:
                role_name = 'teacher' 
            else:
                role_name = 'student'
                
            role, _ = Role.objects.get_or_create(name=role_name)
            profile.roles.add(role)

        if user.is_superuser:
            admin_role, _ = Role.objects.get_or_create(name='admin')
            if not profile.roles.filter(name='admin').exists():
                profile.roles.add(admin_role)

        roles = [r.name for r in profile.roles.all()]
        
        # 生成 CSRF token
        csrf_token = get_token(request)
        print(f"🔑 生成 CSRF token: {csrf_token[:30]}...")
        
        should_force = profile.force_password_change
        if user.is_superuser or 'admin' in roles:
            should_force = False

        response_data = {
            'username': username,
            'real_name': profile.real_name,
            'csrfToken': csrf_token,
            'force_password_change': should_force,
        }
        
        if 'student' in roles:
            response_data['role'] = 'student'
        elif 'teacher' in roles:
            response_data['role'] = 'teacher'
        elif 'admin' in roles:
            response_data['role'] = 'admin'
        else:
            response_data['roles'] = roles
        
        print(f"📤 返回數據: username={username}, csrfToken={csrf_token[:30]}..., role={response_data.get('role', 'N/A')}")
        print(f"{'='*60}\n")
        
        return Response(response_data)
        
    except Exception as e:
        print(f"❌ 登入錯誤: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'error': f"系統錯誤: {str(e)}"}, status=500)


@csrf_exempt
@api_view(['POST'])
def logout_view(request):
    """使用者登出"""
    try:
        username = request.user.username if request.user.is_authenticated else '未知用戶'
        print(f"👋 用戶登出: {username}")
        django_logout(request)
        
        response = Response({
            'message': '登出成功',
            'status': 'success'
        })
        
        response.delete_cookie(
            'sessionid',
            path='/',
            domain='.onrender.com',
            samesite='None'
        )
        
        response.delete_cookie(
            'csrftoken',
            path='/',
            domain='.onrender.com',
            samesite='None'
        )
        
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        return response
        
    except Exception as e:
        print(f"❌ 登出錯誤: {str(e)}")
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
        
    if not request.user.check_password(old_password):
        return Response({'error': '舊密碼錯誤'}, status=400)
        
    request.user.set_password(new_password)
    request.user.save()
    
    if hasattr(request.user, 'profile'):
        request.user.profile.force_password_change = False
        request.user.profile.save()
    
    from django.contrib.auth import update_session_auth_hash
    update_session_auth_hash(request, request.user)
    
    print(f"✅ 用戶 {request.user.username} 密碼修改成功")
    
    return Response({'message': '密碼修改成功'})