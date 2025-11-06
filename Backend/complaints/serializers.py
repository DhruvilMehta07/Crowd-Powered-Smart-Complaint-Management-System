from users.serializers import UserLoginSerializer
from users.models import Department,Field_Worker

import re

from .models import Complaint,ComplaintImage,Upvote

from rest_framework import serializers

class ComplaintImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintImage
        fields = ['id', 'image','uploaded_at','order']

class ComplaintSerializer(serializers.ModelSerializer):
    posted_by = UserLoginSerializer(read_only=True)
    images = ComplaintImageSerializer(many=True, read_only=True)
    upvotes_count = serializers.ReadOnlyField()
    is_upvoted = serializers.SerializerMethodField()
    assigned_to_dept = serializers.StringRelatedField()
    location_display = serializers.SerializerMethodField()
    status = serializers.CharField()
    assigned_to_fieldworker = serializers.SerializerMethodField()
    class Meta:
        model = Complaint
        fields = ['id','posted_by','content','posted_at','images',
                  'images_count','upvotes_count','is_upvoted','assigned_to_dept','address','pincode',
                  'latitude','longitude','location_type','location_display','status','assigned_to_fieldworker']
        read_only_fields = ['posted_by', 'posted_at','location_display',]

    def get_is_upvoted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.upvotes.filter(id=request.user.id).exists()
        return False
    
    def get_location_display(self,obj):
        return obj.get_location_display()
    
    def get_assigned_to_fieldworker(self, obj):
        worker = getattr(obj, 'assigned_to_fieldworker', None)
        if worker:
            return worker.username
        return None
    

class ComplaintCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False,
        max_length=4
    )
    assigned_to_dept = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=False,
        allow_null=True
    )

    latitude = serializers.DecimalField(max_digits=11, decimal_places=8, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=11, decimal_places=8, required=False, allow_null=True)
    location_type = serializers.ChoiceField(choices=Complaint.Location_Choice, default='manual')

    class Meta:
        model = Complaint
        fields = ['id', 'content', 'images', 'posted_at', 'posted_by', 'assigned_to_dept','address',
                  'pincode','latitude','longitude','location_type','status','assigned_to_fieldworker']
        read_only_fields = ['posted_by', 'posted_at']

    def validate(self, data):
        #validate that either GPS coordinates or address is provided
        address = data.get('address')
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        location_type = data.get('location_type', 'manual')

        if location_type == 'gps':
            if not latitude or not longitude:
                raise serializers.ValidationError(
                    "GPS coordinates are required when location source is GPS."
                )
        else:  # manual
            if not address:
                raise serializers.ValidationError(
                    "Address is required when location source is manual."
                )

        # validate pincode format if provided
        pincode = data.get('pincode')
        if pincode and not re.match(r'^[1-9][0-9]{5}$', pincode):
            raise serializers.ValidationError(
                {"pincode": "Pincode must be 6 digits starting with 1-9"}
            )

        return data
    
    def validate_images(self, value):
        if len(value) > 4:
            raise serializers.ValidationError("A maximum of 4 images are allowed.")
        return value

    def create(self, validated_data):
        images = validated_data.pop('images', [])
        complaint = Complaint.objects.create(
            **validated_data
        )
        for i,image_data in enumerate(images):
            ComplaintImage.objects.create(complaint=complaint, image=image_data, order=i)
        return complaint

class UpvoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Upvote
        fields = ['id', 'user', 'complaint', 'upvoted_at']
        read_only_fields = ['user', 'upvoted_at']

class ComplaintAssignSerializer(serializers.ModelSerializer):
    assigned_to_fieldworker = serializers.PrimaryKeyRelatedField(
        queryset=Field_Worker.objects.all(),
        required=False,
        allow_null=True
    )
    
    class Meta:
        model = Complaint
        fields = ['id', 'assigned_to_fieldworker', 'status', ]
       

class FieldWorkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Field_Worker
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

class ComplaintImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplaintImage
        fields = ['id', 'image','uploaded_at','order']