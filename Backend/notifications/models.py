from django.db import models
from users.models import ParentUser

# Create your models here.

class Notification(models.Model):
    user = models.ForeignKey(ParentUser, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True, null=True)  #this is for frontend routing

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notification for {self.user.username} at {self.created_at.strftime('%Y-%m-%d %H:%M:%S')}"
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

