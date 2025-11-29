from django.core.exceptions import ObjectDoesNotExist
from rest_framework import serializers
from .models import Citizen, Government_Authority, Field_Worker,ParentUser,Department


def _get_typed_user_instance(user):
    related_map = {
        'citizen': 'citizen',
        'authority': 'government_authority',
        'fieldworker': 'field_worker'
    }
    user_type = getattr(user, 'user_type', None)
    related_attr = related_map.get(user_type)
    if related_attr:
        try:
            related = getattr(user, related_attr)
            if related:
                return related
        except (AttributeError, ObjectDoesNotExist):
            pass
    return user


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
        # ensure parent user_type is set
        validated_data['user_type'] = 'citizen'
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


class GeneralProfileSerializer(serializers.ModelSerializer):
    """General profile serializer that reads `user_type` from ParentUser
    and safely returns department/verified/phone if present on concrete subclasses.
    """

    user_type = serializers.SerializerMethodField()
    assigned_department = serializers.SerializerMethodField()
    verified = serializers.SerializerMethodField()
    phone_number = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = ParentUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'date_joined',
                  'user_type', 'assigned_department', 'verified']
        read_only_fields = ['id', 'username', 'email', 'date_joined']

    def get_user_type(self, obj=None):
        """Allow direct calls without explicitly passing obj in tests."""
        obj = obj or getattr(self, 'instance', None)
        return getattr(obj, 'user_type', 'user') if obj else 'user'

    def get_assigned_department(self, obj):
        dep = getattr(obj, 'assigned_department', None)
        if dep:
            return DepartmentSerializer(dep).data
        return None

    def get_verified(self, obj):
        return getattr(obj, 'verified', None)

    def update(self, instance, validated_data):
        phone_number = validated_data.pop('phone_number', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if phone_number is not None:
            typed_instance = instance if hasattr(instance, 'phone_number') else _get_typed_user_instance(instance)
            if hasattr(typed_instance, 'phone_number'):
                typed_instance.phone_number = phone_number
                typed_instance.save(update_fields=['phone_number'])
        return instance

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
        validated_data['user_type'] = 'authority'
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
        validated_data['user_type'] = 'fieldworker'
        user = Field_Worker(**validated_data)       # create user without password
        user.set_password(password)                 # hash password properly
        user.save()
        return user


class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

