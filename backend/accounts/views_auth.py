"""
認證相關的 API views
包含註冊、登入、登出功能
"""
from django.contrib.auth import authenticate, login as django_login, logout as django_logout
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
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
    office = request.data.get('office')
    title = request.data.get('title')
    
    if not username or not password or not role_name:
        return Response({'error': '缺少必要欄位'}, status=400)

    if User.objects.filter(username=username).exists():
        return Response({'error': '帳號已存在'}, status=400)

    user = User.objects.create_user(username=username, password=password)
    
    profile = Profile.objects.create(
        user=user,
        real_name=real_name or username,
        student_id=student_id,
        department=department,
        grade=grade,
        office=office,
        title=title
    )
    
    role = Role.objects.get(name=role_name)
    profile.roles.add(role)
    profile.save()

    return Response({'message': '註冊成功'})


@csrf_exempt 
@api_view(['POST'])
def login_view(request):
    """使用者登入"""
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)
    if user is None:
        return Response({'error': '帳號或密碼錯誤'}, status=401)

    django_login(request, user)

    try:
        profile = Profile.objects.get(user=user)
        roles = [r.name for r in profile.roles.all()]
        
        response_data = {
            'username': username,
            'real_name': profile.real_name,
        }
        
        if len(roles) == 1:
            response_data['role'] = roles[0]
        else:
            response_data['roles'] = roles
            
        return Response(response_data)
        
    except Profile.DoesNotExist:
        return Response({'error': '找不到使用者資料'}, status=404)


@csrf_exempt 
@api_view(['POST'])
def logout_view(request):
    """使用者登出"""
    try:
        # 登出使用者（清除 server 端 session）
        django_logout(request)
        
        # 建立 response
        response = Response({'message': '登出成功'})
        
        # 主動刪除 cookies
        response.delete_cookie('sessionid', domain=None, path='/')
        response.delete_cookie('csrftoken', domain=None, path='/')
        
        # 設定 cache control，確保瀏覽器不會快取
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        return response
        
    except Exception as e:
        print(f"登出錯誤: {str(e)}")
        return Response({'error': str(e)}, status=500)