from users.serializers import UserLoginSerializer

from .models import Complaint,ComplaintImage,Upvote
from users.models import Department

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
    assigned_to = serializers.StringRelatedField()  

    class Meta:
        model = Complaint
        fields = ['id','posted_by','content','posted_at','images','images_count','upvotes_count','is_upvoted','assigned_to']
        read_only_fields = ['posted_by', 'posted_at',]

    def get_is_upvoted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.upvotes.filter(id=request.user.id).exists()
        return False

class ComplaintCreateSerializer(serializers.ModelSerializer):
    images = serializers.ListField(
        child=serializers.ImageField(max_length=1000000, allow_empty_file=False, use_url=False),
        write_only=True,
        required=False,
        max_length=4
    )
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        required=False,
        allow_null=True
    )
    class Meta:
        model = Complaint
        fields = ['id', 'content', 'images', 'posted_at', 'posted_by', 'assigned_to']
        read_only_fields = ['posted_by', 'posted_at']

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