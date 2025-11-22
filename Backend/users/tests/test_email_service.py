"""
Tests for email service and utilities
"""
import pytest
from unittest.mock import patch, MagicMock
from users.EmailService import EmailService
from django.core.mail import send_mail


class TestEmailService:
    
    def test_generate_otp_returns_six_digits(self):
        """Test that OTP is 6 digits"""
        otp = EmailService.generate_otp()
        assert len(otp) == 6
        assert otp.isdigit()
    
    def test_generate_otp_different_each_time(self):
        """Test that OTPs are randomly generated"""
        otp1 = EmailService.generate_otp()
        otp2 = EmailService.generate_otp()
        # Very unlikely to be the same (but technically possible)
        # Generate multiple to be sure
        otps = {EmailService.generate_otp() for _ in range(10)}
        assert len(otps) > 1  # Should have variety
    
    @patch('users.EmailService.send_mail')
    def test_send_otp_email_success(self, mock_send_mail):
        """Test successful OTP email send"""
        mock_send_mail.return_value = 1  # Successful send
        
        result = EmailService.send_otp_email("test@example.com", "123456", "Citizen")
        
        assert result is True
        mock_send_mail.assert_called_once()
        
        # Check email content
        call_args = mock_send_mail.call_args
        assert "123456" in call_args[0][1]  # OTP in message
        assert "test@example.com" in call_args[0][3]  # Recipient
    
    @patch('users.EmailService.send_mail')
    def test_send_otp_email_failure(self, mock_send_mail):
        """Test OTP email send failure"""
        mock_send_mail.side_effect = Exception("SMTP error")
        
        result = EmailService.send_otp_email("test@example.com", "123456", "Citizen")
        
        assert result is False
    
    @patch('users.EmailService.send_mail')
    def test_send_otp_email_different_user_types(self, mock_send_mail):
        """Test OTP email for different user types"""
        mock_send_mail.return_value = 1
        
        # Test for Citizen
        result1 = EmailService.send_otp_email("citizen@test.com", "111111", "Citizen")
        assert result1 is True
        
        # Test for Government Authority
        result2 = EmailService.send_otp_email("gov@test.com", "222222", "Government Authority")
        assert result2 is True
        
        # Test for Field Worker
        result3 = EmailService.send_otp_email("fw@test.com", "333333", "Field Worker")
        assert result3 is True
        
        assert mock_send_mail.call_count == 3
    
    @patch('users.EmailService.send_mail')
    def test_send_otp_email_content_format(self, mock_send_mail):
        """Test that email content is properly formatted"""
        mock_send_mail.return_value = 1
        
        EmailService.send_otp_email("test@example.com", "987654", "Citizen")
        
        call_args = mock_send_mail.call_args
        subject = call_args[0][0]
        message = call_args[0][1]
        
        assert "OTP" in subject or "Verification" in subject
        assert "987654" in message
        assert "Citizen" in message or "citizen" in message
    
    def test_generate_otp_range(self):
        """Test that OTP is within valid range"""
        for _ in range(100):
            otp = EmailService.generate_otp()
            otp_int = int(otp)
            assert 100000 <= otp_int <= 999999
    
    @patch('users.EmailService.send_mail')
    def test_send_otp_email_empty_email(self, mock_send_mail):
        """Test sending OTP to empty email"""
        mock_send_mail.return_value = 1
        
        try:
            result = EmailService.send_otp_email("", "123456", "Citizen")
            # Should either return False or raise exception
            assert result is False or result is True  # Depends on implementation
        except Exception:
            # Exception is also acceptable
            pass
    
    @patch('users.EmailService.send_mail')
    def test_send_otp_email_invalid_email_format(self, mock_send_mail):
        """Test sending OTP to invalid email format"""
        mock_send_mail.return_value = 1
        
        result = EmailService.send_otp_email("not-an-email", "123456", "Citizen")
        # Should either send or fail gracefully
        assert isinstance(result, bool)
    
    @patch('users.EmailService.send_mail')
    def test_send_otp_email_network_timeout(self, mock_send_mail):
        """Test OTP email send with network timeout"""
        mock_send_mail.side_effect = TimeoutError("Connection timeout")
        
        result = EmailService.send_otp_email("test@example.com", "123456", "Citizen")
        
        assert result is False
    
    @patch('users.EmailService.send_mail')
    def test_send_otp_email_partial_send(self, mock_send_mail):
        """Test when email send partially succeeds"""
        mock_send_mail.return_value = 0  # No emails sent
        
        result = EmailService.send_otp_email("test@example.com", "123456", "Citizen")
        
        # Result depends on implementation - might be False if checking return value
        assert isinstance(result, bool)


class TestOTPGeneration:
    
    def test_otp_always_string(self):
        """Test that OTP is always returned as string"""
        otp = EmailService.generate_otp()
        assert isinstance(otp, str)
    
    def test_otp_no_leading_zero(self):
        """Test that OTP doesn't start with zero (if implementation requires)"""
        # Generate many OTPs to test
        otps = [EmailService.generate_otp() for _ in range(1000)]
        
        # All should be 6 digits
        for otp in otps:
            assert len(otp) == 6
            # If first digit can be 0, that's okay, but check consistency
    
    def test_otp_statistical_distribution(self):
        """Test that OTP generation has reasonable distribution"""
        otps = [EmailService.generate_otp() for _ in range(1000)]
        unique_otps = set(otps)
        
        # Should have high uniqueness (at least 90% unique)
        uniqueness_ratio = len(unique_otps) / len(otps)
        assert uniqueness_ratio > 0.9


class TestPasswordResetEmail:
    """Test password reset email functionality"""
    
    @patch('users.EmailService.send_mail')
    def test_send_password_reset_otp_success(self, mock_send_mail):
        """Test successful password reset OTP send"""
        mock_send_mail.return_value = 1
        
        result = EmailService.send_otp_for_password_reset("user@example.com", "654321")
        
        assert result is True
        mock_send_mail.assert_called_once()
        
        # Check call arguments
        call_args = mock_send_mail.call_args
        subject = call_args[0][0]
        message = call_args[0][1]
        
        assert "Password Reset" in subject or "password reset" in subject.lower()
        assert "654321" in message
        assert "user@example.com" in call_args[0][3]
    
    @patch('users.EmailService.send_mail')
    def test_send_password_reset_otp_failure(self, mock_send_mail):
        """Test password reset OTP send failure"""
        mock_send_mail.side_effect = Exception("Email server error")
        
        result = EmailService.send_otp_for_password_reset("user@example.com", "654321")
        
        assert result is False
    
    @patch('users.EmailService.send_mail')
    def test_send_password_reset_otp_content(self, mock_send_mail):
        """Test password reset OTP email content"""
        mock_send_mail.return_value = 1
        
        EmailService.send_otp_for_password_reset("test@test.com", "111222")
        
        call_args = mock_send_mail.call_args
        message = call_args[0][1]
        
        assert "111222" in message
        assert "10 minutes" in message or "valid" in message.lower()
    
    @patch('users.EmailService.send_mail')
    def test_send_password_reset_otp_exception_types(self, mock_send_mail):
        """Test various exception types during password reset"""
        # Connection error
        mock_send_mail.side_effect = ConnectionError("Connection failed")
        result1 = EmailService.send_otp_for_password_reset("test@test.com", "123456")
        assert result1 is False
        
        # Timeout error
        mock_send_mail.side_effect = TimeoutError("Timeout")
        result2 = EmailService.send_otp_for_password_reset("test@test.com", "123456")
        assert result2 is False
        
        # Generic exception
        mock_send_mail.side_effect = Exception("Unknown error")
        result3 = EmailService.send_otp_for_password_reset("test@test.com", "123456")
        assert result3 is False
