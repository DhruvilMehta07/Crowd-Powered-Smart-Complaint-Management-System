# utils/email_service.py
import random
from django.core.mail import send_mail
from django.conf import settings

class EmailService:
    @staticmethod
    def generate_otp():
        return str(random.randint(100000, 999999))
    
    @staticmethod
    def send_otp_email(email, otp, user_type):
        subject = f'CPCMS Verification OTP - {user_type}'
        message = f'Your OTP for {user_type} registration is: {otp}. It is valid for 10 minutes.'
        
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
            return True
        except Exception as e:
            print(f"Email error: {e}")
            return False
        
    def send_otp_for_password_reset(self, email, otp):
        subject = 'CPCMS Password Reset OTP'
        message = f'Your OTP for password reset is: {otp}. It is valid for 10 minutes.'
        
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email])
            return True
        except Exception as e:
            print(f"Email error: {e}")
            return False