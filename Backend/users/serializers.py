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
        extra_kwargs = {'password': {'write_only': True}}
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
    
class CitizenProfileSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField()
    class Meta:
        model = Citizen
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'date_joined']
        read_only_fields = ['id', 'username', 'email', 'date_joined','first_name','last_name']
        extra_kwargs = {'password': {'write_only': True}}
    def get_phone_number(self, obj):
        return getattr(obj, 'phone_number', None)

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
        extra_kwargs = {'password': {'write_only': True}}

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
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password')   # remove raw password
        user = Field_Worker(**validated_data)       # create user without password
        user.set_password(password)                 # hash password properly
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

