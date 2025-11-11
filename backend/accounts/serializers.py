from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile, Role

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    roles = RoleSerializer(many=True)

    class Meta:
        model = Profile
        fields = ['user', 'roles']
