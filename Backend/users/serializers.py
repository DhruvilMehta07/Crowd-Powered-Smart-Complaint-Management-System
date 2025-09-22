from rest_framework import serializers
from .models import Citizen, Government_Authority, Field_Worker,ParentUser,Department


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name']


class CitizenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Citizen
        fields = '__all__'

    # Encrypting Password
    def create(self, validated_data):
        password = validated_data.pop('password')   # remove raw password
        user = Citizen(**validated_data)            # create user without password
        user.set_password(password)                 # hash password properly
        user.save()
        return user
    
    def validate_password(self, value):
        if len(value) < 6:
            raise serializers.ValidationError("Password must be at least 6 characters long.")
        return value

class GovernmentAuthoritySerializer(serializers.ModelSerializer):
    # serialize department as ID + name
    assigned_department = DepartmentSerializer(read_only=True)
    assigned_department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source="assigned_department",
        write_only=True
    )

    class Meta:
        model = Government_Authority
        fields = '__all__'

    def create(self, validated_data):
        password = validated_data.pop('password')   # remove raw password
        user = Government_Authority(**validated_data)   # create user without password
        user.set_password(password)                 # hash password properly
        user.save()
        return user


class FieldWorkerSerializer(serializers.ModelSerializer):
    # serialize department as ID + name
    assigned_department = DepartmentSerializer(read_only=True)
    assigned_department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source="assigned_department",
        write_only=True
    )
    
    class Meta:
        model = Field_Worker
        fields = '__all__'

    def create(self, validated_data):
        password = validated_data.pop('password')   # remove raw password
        user = Field_Worker(**validated_data)       # create user without password
        user.set_password(password)                 # hash password properly
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

