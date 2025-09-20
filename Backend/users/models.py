from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator


class ParentUser(AbstractUser):

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

class Department(models.Model):
    name = models.CharField(max_length=200, unique=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                name="unique_department_name_ci",
                fields=["name"],
                violation_error_message="Department with this name already exists.",
                condition=None,
                deferrable=None,
                include=None,
                opclasses=["varchar_pattern_ops"],
            )
        ]

    def save(self, *args, **kwargs):
        self.name = self.name.strip().lower()  # Store as lowercase for uniqueness
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name.capitalize()
    
    def __str__(self):
        return self.name

class Government_Authority(ParentUser):
    authority_name=models.CharField(max_length=200)
    phone_number = models.CharField(
        validators=[phone_validator],
        max_length=10,
        unique=True,
        null=True,
        blank=True
    )
    assigned_department=models.ForeignKey(Department,blank=True,null=True,on_delete=models.CASCADE)

class Field_Worker(ParentUser):
    worker_name=models.CharField(max_length=200)
    phone_number = models.CharField(
        validators=[phone_validator],
        max_length=10,
        unique=True,
        null=True,
        blank=True
    )
    assigned_area=models.CharField(max_length=200)
    assigned_department=models.ForeignKey(Department,blank=True,null=True,on_delete=models.CASCADE)
 
