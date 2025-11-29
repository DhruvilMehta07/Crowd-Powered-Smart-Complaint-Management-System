from django.db import models
from datetime import datetime,timedelta
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db.models import Sum

import re
import requests
import json

from CPCMS import settings
from users.models import ParentUser, Department,Field_Worker,Citizen
from notifications.models import Notification
from cloudinary.models import CloudinaryField
    

def validate_image_size(image):
    file_size = image.file.size
    if(file_size > 5*1024*1024):
        raise ValidationError("Maximum file size is 5MB")
    
class Complaint(models.Model):
    content = models.TextField()
    posted_by = models.ForeignKey(ParentUser,null=True, blank=True,on_delete=models.SET_NULL)
    posted_at = models.DateTimeField(default=timezone.now)
    Location_Choice = [
        ('gps','GPS'),
        ('manual',"Manual")
    ]
    address = models.TextField(blank=True,null=True)

    pincode = models.CharField(max_length=6, blank=True,null=True,validators=[
        RegexValidator(
            regex = '^[1-9][0-9]{5}$',
            message="Pincode must be 6 digits starting with 1-9"

        )
    ])

    latitude = models.DecimalField(max_digits=11,decimal_places=8,null=True,blank=True)
    longitude = models.DecimalField(max_digits=11,decimal_places=8,null=True,blank=True)

    location_type = models.CharField(max_length=20,choices=Location_Choice,default='manual',null=True,blank=True)

    upvotes = models.ManyToManyField(ParentUser,through='Upvote',related_name='upvoted_complaints'
        ,blank=True)
    fake_confidence = models.FloatField(default=0.0)
    assigned_to_dept = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL,related_name='department_complaints')
    images_count = models.PositiveIntegerField(default=0)
    upvotes_count = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, default='Pending')
    assigned_to_fieldworker = models.ForeignKey(Field_Worker, null=True, blank=True, on_delete=models.SET_NULL, related_name='assigned_complaints')
    is_anonymous = models.BooleanField(default=False, help_text="If true, hide poster identity in API responses")
    current_resolution = models.ForeignKey(
        'Resolution',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_for_complaint'
    )
    resolution_approved_at = models.DateTimeField(blank=True, null=True)
    resolution_deadline = models.DateTimeField(blank=True, null=True, help_text="Deadline for resolution submission")
    class Meta:
        indexes = [
            models.Index(fields=['posted_by'], name='idx_complaint_posted_by'),
            models.Index(fields=['upvotes_count'], name='idx_complaint_upvotes_count'),
        ]
        ordering = ['-posted_at']

    def __str__(self):
        return f"Complaint by {self.posted_by.username if self.posted_by else 'Anonymous'} at {self.posted_at.strftime('%Y-%m-%d %H:%M:%S')}"

    def save(self, *args, **kwargs):
        if self.location_type=='gps' and self.latitude and self.longitude and not self.address:
            address_data = self.reverse_geocode_mapmyindia()
            if address_data:
                self.address = address_data.get('address','')
                self.pincode = address_data.get('pincode','')

        elif self.address and not self.pincode:
            self.pincode = self.extract_pincode_from_address()

        if not self.address and (not self.latitude or not self.longitude):
            raise ValidationError("Either address or GPS coordinates must be provided.")           
        
        current_time = timezone.now()
        message=''
        if self.resolution_deadline:
            if self.resolution_deadline > current_time:
                # Deadline is in future, use as is
                pass
            else:
                # Deadline is past, extend it
                self.resolution_deadline = self.resolution_deadline + timedelta(days=2)
                message = "Sorry for delay. We are working on your complaint and it will be solved soon"
        
        # Call parent save method
        super().save(*args, **kwargs)
        
        # Update upvotes_count if needed
        if 'update_fields' not in kwargs or 'upvotes_count' not in kwargs.get('update_fields', []):
            self.upvotes_count = self.upvotes.count()
            super().save(update_fields=['upvotes_count'])
        
        # return message  # Django save() should not return a value

    def reverse_geocode_mapmyindia(self):
        """Convert latitude/longitude to address using CORRECT MapmyIndia Reverse Geocoding API"""
        try:
            api_key = getattr(settings, 'MAPMYINDIA_API_KEY', '')
            if not api_key:
                print("MapmyIndia API key not configured")
                return None

            # CORRECT API endpoint
            url = "https://search.mappls.com/search/address/rev-geocode"
            
            params = {
                'lat': float(self.latitude),
                'lng': float(self.longitude),
                'access_token': api_key,
                'region': 'IND'
            }
            
            response = requests.get(url, params=params, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('responseCode') == 200 and data.get('results'):
                    result = data['results'][0]
                    
                    address = result.get('formatted_address', '')
                    pincode = result.get('pincode', '')
                    
                    # Build address if formatted_address is empty
                    if not address:
                        address_parts = []
                        if result.get('city'):
                            address_parts.append(result.get('city'))
                        elif result.get('village'):
                            address_parts.append(result.get('village'))
                        if result.get('district'):
                            address_parts.append(result.get('district'))
                        if result.get('state'):
                            address_parts.append(result.get('state'))
                        address = ", ".join(address_parts)
                    
                    return {
                        'address': address,
                        'pincode': pincode,
                        'city': result.get('city', ''),
                        'state': result.get('state', ''),
                        'district': result.get('district', '')
                    }
                else:
                    print(f"MapmyIndia API returned no results: {data}")
            else:
                print(f"MapmyIndia API error: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"MapmyIndia reverse geocoding failed: {e}")
        
        return None

    def extract_pincode_from_address(self):
        if not self.address:
            return None
        
        pincode_pattern = r'\b[1-9][0-9]{5}\b' #pincode format
        match = re.search(pincode_pattern, self.address) #find pincode format in address generated(manual/gps both)
        
        if match:
            return match.group()
        return None
    
    def get_location_display(self):
        if self.location_type == 'gps' and self.latitude and self.longitude:
            return f"GPS: {self.latitude}, {self.longitude}"
        
        elif self.address:
            return f"Address: {self.address}"
        
        return "LOCATION NOT AVAILABLE"


    def get_image_count(self):
        return self.images.count()
    
    def update_fake_confidence(self):
        total = self.fake_confidences.aggregate(total=Sum('weight'))['total'] or 0.0
        Complaint.objects.filter(pk=self.pk).update(fake_confidence=total)
        self.fake_confidence = total
        return total
    

class ComplaintImage(models.Model):
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = CloudinaryField('image',folder='complaints/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def clean(self):
        if self.complaint.images.count() >= 4 and not self.pk:
            raise ValidationError("A complaint can have a maximum of 4 images.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
        self.complaint.images_count = self.complaint.images.count()
        self.complaint.save(update_fields=['images_count'])

    def __str__(self):
        return f"Image for Complaint ID {self.complaint.id} uploaded at {self.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')}"
    

class Upvote(models.Model):
    user = models.ForeignKey(ParentUser, on_delete=models.CASCADE)
    complaint = models.ForeignKey(Complaint, on_delete=models.CASCADE)
    upvoted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['complaint', 'user'], name='idx_upvote_complaint_user'),
            models.Index(fields=['complaint'], name='idx_upvote_complaint'),
        ]
        unique_together = ('user', 'complaint')
        ordering = ['-upvoted_at']

    def __str__(self):
        return f"{self.user.username} upvoted Complaint ID {self.complaint.id} at {self.upvoted_at.strftime('%Y-%m-%d %H:%M:%S')}"  


class Fake_Confidence(models.Model):
    CITIZEN_WEIGHT = 1
    FIELD_WORKER_WEIGHT = 100.0

    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name='fake_confidences'
    )
    user = models.ForeignKey(
        ParentUser,
        on_delete=models.CASCADE,
        related_name='fake_confidence_votes'
    )
    weight = models.FloatField(default=0.0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('complaint', 'user')
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if self.pk is None:
            self.weight = self.resolve_weight_for_user(self.user)
        super().save(*args, **kwargs)
        self.complaint.update_fake_confidence()

    def delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)
        self.complaint.update_fake_confidence()

    @staticmethod
    def resolve_weight_for_user(user):
        if Field_Worker.objects.filter(pk=user.pk).exists():
            return Fake_Confidence.FIELD_WORKER_WEIGHT
        return Fake_Confidence.CITIZEN_WEIGHT

    def __str__(self):
        return f"{self.user.username} flagged Complaint ID {self.complaint.id} ({self.weight})"


class Resolution(models.Model):
    complaint = models.ForeignKey(
        Complaint,on_delete=models.CASCADE,related_name='resolutions'
    )
    field_worker = models.ForeignKey(
        Field_Worker,on_delete=models.CASCADE,related_name='resolution_submitted_by'
    )
    description = models.TextField(help_text="Description of the resolution work done")
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='pending_approval')
    citizen_feedback = models.TextField(blank=True, null=True)
    citizen_responded_at = models.DateTimeField(blank=True, null=True)
    auto_approve_at = models.DateTimeField(blank=True, null=True, help_text="Auto-approve after this time if no citizen response")
    
    class Meta:
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Resolution for Complaint ID {self.complaint.id} by {self.field_worker.username} at {self.submitted_at.strftime('%Y-%m-%d %H:%M:%S')}"
    
class ResolutionImage(models.Model):
    resolution = models.ForeignKey(
        Resolution,
        on_delete=models.CASCADE,
        related_name='images', null=True, blank=True
    )
    image = CloudinaryField('image', folder='resolutions/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"Resolution Image for Resolution ID {self.resolution.id} uploaded at {self.uploaded_at.strftime('%Y-%m-%d %H:%M:%S')}"
    
    def clean(self):
        if self.resolution.images.count() >= 5 and not self.pk:
            raise ValidationError("A resolution can have a maximum of 5 images.")

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
        
        # Update complaint status to pending approval when resolution image is added
        complaint = self.resolution.complaint
        if complaint.status != 'Pending Approval':
            complaint.status = 'Pending Approval'
            complaint.current_resolution = self.resolution
            complaint.save(update_fields=['status', 'current_resolution'])
        
        # Notify citizen
        complaint_owner = Citizen.objects.filter(pk=complaint.posted_by.pk).first()
        if complaint_owner:
            Notification.objects.create(
                user=complaint_owner,
                message=f"A resolution has been submitted for your complaint #{complaint.id}. Please review and approve.",
                link=f"/complaints/{complaint.id}/resolution/"
            )