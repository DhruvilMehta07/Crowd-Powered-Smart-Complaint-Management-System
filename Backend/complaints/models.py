from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.db import IntegrityError


class ParentUser(AbstractUser):
    USER_TYPE_CHOICES = [
        ('citizen', 'Citizen'),
        ('authority', 'Government Authority'),
        ('fieldworker', 'Field Worker'),
        ('user', 'User'),
    ]

    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='user')
    assigned_department = models.ForeignKey('Department', blank=True, null=True, on_delete=models.CASCADE, default=None)

    def __str__(self):
        return self.email
    

# Regex: ensures only 10 digits (0–9), no +91, no spaces
phone_validator = RegexValidator(
    regex=r'^[6-9]\d{9}$',  
    message="Phone number must be 10 digits and start with 6, 7, 8, or 9."
)
    
class Citizen(ParentUser):
    # already exists in abstract user
    # first_name=models.CharField(max_length=200)
    # last_name=models.CharField(max_length=200)
    phone_number = models.CharField(
        validators=[phone_validator],
        max_length=10,
        unique=True,
        null=True,
        blank=True
    )
    
    def save(self, *args, **kwargs):
        if not self.user_type or self.user_type == 'user':
            self.user_type = 'citizen'
        _ensure_phone_unique(self)
        super().save(*args, **kwargs)
class Department(models.Model):
    name = models.CharField(max_length=200, unique=True)

    class Meta:
        
        constraints = [
            models.UniqueConstraint(models.functions.Lower('name'), name='unique_department_name_ci')
        ]

    def save(self, *args, **kwargs):
       
        if self.name:
            self.name = self.name.strip().lower()
        try:
            super().save(*args, **kwargs)
        except IntegrityError:
            raise IntegrityError("Department with this name already exists (case-insensitive).")

    def __str__(self):
        return self.name.capitalize() if self.name else ''

class Government_Authority(ParentUser):
    phone_number = models.CharField(
        validators=[phone_validator],
        max_length=10,
        unique=True,
        null=True,
        blank=True
    )
    verified=models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        if not self.user_type or self.user_type == 'user':
            self.user_type = 'authority'
        _ensure_phone_unique(self)
        super().save(*args, **kwargs)

class Field_Worker(ParentUser):
    phone_number = models.CharField(
        validators=[phone_validator],
        max_length=10,
        unique=True,
        null=True,
        blank=True
    )
    # we are going to implement wards in later sprints
    # assigned_area=models.CharField(max_length=200)
    verified=models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        if not self.user_type or self.user_type == 'user':
            self.user_type = 'fieldworker'
        _ensure_phone_unique(self)
        super().save(*args, **kwargs)


def _ensure_phone_unique(instance):
    phone = getattr(instance, 'phone_number', None)
    if not phone:
        return
    models_to_check = [Citizen, Government_Authority, Field_Worker]
    for model in models_to_check:
        qs = model.objects.filter(phone_number=phone)
        if isinstance(instance, model) and instance.pk:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise IntegrityError("Phone number must be unique across all user types.")
 
