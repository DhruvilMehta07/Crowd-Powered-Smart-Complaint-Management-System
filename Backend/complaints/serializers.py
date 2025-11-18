from users.serializers import UserLoginSerializer,FieldWorkerSerializer
from users.models import Department,Field_Worker


import re

from .models import Complaint,ComplaintImage,Upvote,Fake_Confidence,ResolutionImage,Notification,Resolution

from django.utils import timezone
from rest_framework import serializers

class ComplaintImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ComplaintImage
        fields = ['id', 'image', 'image_url', 'uploaded_at', 'order']
    
    def get_image_url(self, obj):
        # Return the full Cloudinary URL
        if obj.image:
            # This will return the full Cloudinary URL
            return obj.image.url
        return None

class ResolutionImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ResolutionImage
        fields = ['id', 'image', 'image_url', 'uploaded_at', 'order']
        read_only_fields = ['id', 'uploaded_at']

    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None
    

class ComplaintSerializer(serializers.ModelSerializer):
    posted_by = serializers.SerializerMethodField()
    upvotes_count = serializers.SerializerMethodField()
    is_upvoted = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    assigned_to_dept = serializers.StringRelatedField()
    location_display = serializers.SerializerMethodField()
    status = serializers.CharField()
    assigned_to_fieldworker = serializers.SerializerMethodField()
    fake_confidence = serializers.FloatField(read_only=True)
    current_resolution = serializers.SerializerMethodField()
    has_pending_resolution = serializers.SerializerMethodField()
    class Meta:
        model = Complaint
        fields = ['id','posted_by','content','posted_at','thumbnail_url',
                  'images_count','upvotes_count','is_upvoted','assigned_to_dept','address','pincode',
                  'latitude','longitude','location_type','location_display','status',
                  'assigned_to_fieldworker','fake_confidence','current_resolution','has_pending_resolution', 'is_anonymous']
        read_only_fields = ['posted_by', 'posted_at','location_display','fake_confidence']

    def get_upvotes_count(self, obj):
        annotated = getattr(obj, 'computed_upvotes_count', None)
        if annotated is not None:
            return int(annotated)
        return getattr(obj, 'upvotes_count', 0)

    def get_is_upvoted(self, obj):
        annotated_value = getattr(obj, 'is_upvoted', None)
        if annotated_value is not None:
            return bool(annotated_value)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.upvotes.filter(id=request.user.id).exists()
        return False
    
    def get_thumbnail_url(self, obj):
        try:
            first_image = next(iter(obj.images.all()))
        except StopIteration:
            first_image = None
        if first_image and getattr(first_image, 'image', None):
            return first_image.image.url
        return None
    
    def get_location_display(self,obj):
        return obj.get_location_display()
    
    def get_assigned_to_fieldworker(self, obj):
        worker = getattr(obj, 'assigned_to_fieldworker', None)
        if worker:
            return worker.username
        return None

    def get_posted_by(self, obj):
        # Hide poster identity when complaint was submitted anonymously
        if getattr(obj, 'is_anonymous', False):
            return None
        request = self.context.get('request')
        if obj.posted_by:
            return UserLoginSerializer(obj.posted_by, context=self.context).data
        return None
    
    def get_current_resolution(self, obj):
        if obj.current_resolution:
            return {
                'id': obj.current_resolution.id,
                'status': obj.current_resolution.status,
                'submitted_at': obj.current_resolution.submitted_at
            }
        return None
    
    def get_has_pending_resolution(self, obj):
        return obj.resolutions.filter(status='pending_approval').exists()


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
    is_anonymous = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = Complaint
        fields = ['id', 'content', 'images', 'posted_at', 'posted_by', 'assigned_to_dept','address',
                  'pincode','latitude','longitude','location_type','status','assigned_to_fieldworker','is_anonymous',
                  ]
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


class FakeConfidenceSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    weight = serializers.FloatField(read_only=True)

    class Meta:
        model = Fake_Confidence
        fields = ['id', 'complaint', 'user', 'weight', 'created_at']
        read_only_fields = ['id', 'complaint', 'user', 'weight', 'created_at']

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


class ResolutionSerializer(serializers.ModelSerializer):
    field_worker = FieldWorkerSerializer(read_only=True)
    images = ResolutionImageSerializer(many=True, read_only=True)
    days_until_auto_approve = serializers.SerializerMethodField()
    
    class Meta:
        model = Resolution
        fields = [
            'id', 'complaint', 'field_worker', 'description', 'submitted_at',
            'status', 'citizen_feedback', 'citizen_responded_at', 'images',
            'days_until_auto_approve'
        ]
        read_only_fields = ['id', 'submitted_at', 'field_worker', 'status', 'citizen_responded_at']

    def get_days_until_auto_approve(self, obj):
        if obj.status == 'pending_approval' and obj.auto_approve_at:
            from django.utils import timezone
            now = timezone.now()
            if obj.auto_approve_at > now:
                delta = obj.auto_approve_at - now
                return max(0, delta.days)
        return 0

class ResolutionCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False,
        max_length=5
    )
    
    class Meta:
        model = Resolution
        fields = ['id', 'description', 'images']
        read_only_fields = ['id']

    def validate_images(self, value):
        if len(value) > 5:
            raise serializers.ValidationError("A maximum of 5 images are allowed.")
        return value

    def create(self, validated_data):
        images = validated_data.pop('images', [])
        complaint = self.context['complaint']
        field_worker = self.context['field_worker']
        
        # Create resolution
        resolution = Resolution.objects.create(
            complaint=complaint,
            field_worker=field_worker,
            description=validated_data['description'],
            auto_approve_at=timezone.now() + timezone.timedelta(days=3)  # 3 days for auto-approval
        )
        
        # Create resolution images
        for i, image_data in enumerate(images):
            ResolutionImage.objects.create(
                resolution=resolution,
                image=image_data,
                order=i
            )
        
        return resolution

class CitizenResolutionResponseSerializer(serializers.Serializer):
    approved = serializers.BooleanField(required=True)
    feedback = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    def validate(self, data):
        approved = data.get('approved')
        feedback = data.get('feedback', '')
        
        if not approved and not feedback:
            raise serializers.ValidationError({
                "feedback": "Feedback is required when rejecting a resolution."
            })
        
        return data