from django.db import models
from datetime import datetime
from django.utils import timezone
from django.core.exceptions import ValidationError

from users.models import ParentUser, Department

def validate_image_size(image):
    file_size = image.file.size
    if(file_size > 5*1024*1024):
        raise ValidationError("Maximum file size is 5MB")
    
class Complaint(models.Model):
    content = models.TextField()
    posted_by = models.ForeignKey(ParentUser,null=True, blank=True,on_delete=models.SET_NULL)
    posted_at = models.DateTimeField(default=timezone.now)
    upvotes = models.ManyToManyField(ParentUser,through='Upvote',related_name='upvoted_complaints'
            ,blank=True)
    assigned_to = models.ForeignKey(Department, null=True, blank=True, on_delete=models.SET_NULL)
    images_count = models.PositiveIntegerField(default=0)
    upvotes_count = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['-posted_at']

    def __str__(self):
        return f"Complaint by {self.posted_by.username if self.posted_by else 'Anonymous'} at {self.posted_at.strftime('%Y-%m-%d %H:%M:%S')}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.upvotes_count = self.upvotes.count()
        super().save(update_fields=['upvotes_count'])

    def get_image_count(self):
        return self.images.count()

class ComplaintImage(models.Model):
    complaint = models.ForeignKey(
        Complaint,
        on_delete=models.CASCADE,
        related_name='images'
    )
    image = models.ImageField(
        upload_to='complaint_images/',
        validators=[validate_image_size]
    )
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
        unique_together = ('user', 'complaint')
        ordering = ['-upvoted_at']

    def __str__(self):
        return f"{self.user.username} upvoted Complaint ID {self.complaint.id} at {self.upvoted_at.strftime('%Y-%m-%d %H:%M:%S')}"  
