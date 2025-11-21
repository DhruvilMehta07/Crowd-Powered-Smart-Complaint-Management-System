"""
Tests for JWT authentication with Redis blacklist checking
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from django.core.cache import caches
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.tokens import AccessToken
from users.authentication import RedisCheckingJWTAuthentication
import time


@pytest.mark.django_db
class TestRedisCheckingJWTAuthentication:
    """Test custom JWT authentication with Redis blacklist"""
    
    @pytest.fixture
    def auth(self):
        """Create authentication instance"""
        return RedisCheckingJWTAuthentication()
    
    @pytest.fixture
    def mock_redis_cache(self):
        """Mock Redis cache"""
        with patch('users.authentication.redis_cache') as mock_cache:
            yield mock_cache
    
    @pytest.fixture
    def valid_token_payload(self):
        """Create a valid token payload"""
        return {
            'jti': 'test-jti-123',
            'user_id': 1,
            'exp': int(time.time()) + 3600  # Expires in 1 hour
        }
    
    def test_get_validated_token_missing_jti(self, auth, mock_redis_cache):
        """Test token validation with missing jti claim"""
        mock_token = Mock()
        mock_token.payload = {}  # No jti
        
        # Mock the parent class method to return token without jti
        with patch('rest_framework_simplejwt.authentication.JWTAuthentication.get_validated_token', return_value=mock_token):
            with pytest.raises(InvalidToken, match='Token missing jti claim'):
                auth.get_validated_token(b'fake-token')
    
    def test_get_validated_token_blacklisted_in_redis(self, auth, mock_redis_cache):
        """Test token validation when blacklisted in Redis"""
        mock_token = Mock()
        mock_token.payload = {'jti': 'blacklisted-jti', 'exp': int(time.time()) + 3600}
        
        # Redis cache returns True (token is blacklisted)
        mock_redis_cache.get.return_value = True
        
        with pytest.raises(InvalidToken, match='blacklisted in redis'):
            with patch('rest_framework_simplejwt.authentication.JWTAuthentication.get_validated_token', return_value=mock_token):
                auth.get_validated_token(b'fake-token')
        
        mock_redis_cache.get.assert_called_once_with('blacklist:blacklisted-jti')
    
    @patch('users.authentication.BlacklistedToken')
    def test_get_validated_token_blacklisted_in_db(self, mock_blacklist_model, auth, mock_redis_cache):
        """Test token validation when blacklisted in database"""
        mock_token = Mock()
        mock_token.payload = {'jti': 'db-blacklisted-jti', 'exp': int(time.time()) + 3600}
        
        # Redis cache returns None (not in Redis)
        mock_redis_cache.get.return_value = None
        
        # Database returns True (token is blacklisted)
        mock_blacklist_model.objects.filter.return_value.exists.return_value = True
        
        with pytest.raises(InvalidToken, match='blacklisted'):
            with patch('rest_framework_simplejwt.authentication.JWTAuthentication.get_validated_token', return_value=mock_token):
                auth.get_validated_token(b'fake-token')
        
        # Should have checked Redis first
        mock_redis_cache.get.assert_called_once()
        
        # Should have set Redis cache for future hits
        mock_redis_cache.set.assert_called_once()
    
    @patch('users.authentication.BlacklistedToken')
    def test_get_validated_token_valid(self, mock_blacklist_model, auth, mock_redis_cache):
        """Test successful token validation"""
        mock_token = Mock()
        mock_token.payload = {'jti': 'valid-jti', 'user_id': 1, 'exp': int(time.time()) + 3600}
        
        # Not in Redis
        mock_redis_cache.get.return_value = None
        
        # Not in database
        mock_blacklist_model.objects.filter.return_value.exists.return_value = False
        
        with patch('rest_framework_simplejwt.authentication.JWTAuthentication.get_validated_token', return_value=mock_token):
            result = auth.get_validated_token(b'fake-token')
        
        assert result == mock_token
        mock_redis_cache.get.assert_called_once_with('blacklist:valid-jti')
        mock_blacklist_model.objects.filter.assert_called_once()
    
    @patch('users.authentication.BlacklistedToken')
    def test_get_validated_token_db_blacklist_cache_update(self, mock_blacklist_model, auth, mock_redis_cache):
        """Test that Redis cache is updated when token found in DB"""
        mock_token = Mock()
        exp_time = int(time.time()) + 3600
        mock_token.payload = {'jti': 'cache-update-jti', 'exp': exp_time}
        
        # Not in Redis
        mock_redis_cache.get.return_value = None
        
        # In database
        mock_blacklist_model.objects.filter.return_value.exists.return_value = True
        
        with pytest.raises(InvalidToken):
            with patch('rest_framework_simplejwt.authentication.JWTAuthentication.get_validated_token', return_value=mock_token):
                with patch('time.time', return_value=time.time()):
                    auth.get_validated_token(b'fake-token')
        
        # Should have attempted to set cache
        assert mock_redis_cache.set.called
    
    @patch('users.authentication.BlacklistedToken')
    def test_get_validated_token_cache_update_exception(self, mock_blacklist_model, auth, mock_redis_cache):
        """Test handling of Redis cache update exception"""
        mock_token = Mock()
        exp_time = int(time.time()) + 3600
        mock_token.payload = {'jti': 'exception-jti', 'exp': exp_time}
        
        # Not in Redis
        mock_redis_cache.get.return_value = None
        
        # In database
        mock_blacklist_model.objects.filter.return_value.exists.return_value = True
        
        # Cache set raises exception
        mock_redis_cache.set.side_effect = Exception("Redis error")
        
        with pytest.raises(InvalidToken, match='blacklisted'):
            with patch('rest_framework_simplejwt.authentication.JWTAuthentication.get_validated_token', return_value=mock_token):
                with patch('time.time', return_value=time.time()):
                    auth.get_validated_token(b'fake-token')
    
    @patch('users.authentication.BlacklistedToken')
    def test_get_validated_token_expired_ttl(self, mock_blacklist_model, auth, mock_redis_cache):
        """Test handling of expired token (negative TTL)"""
        mock_token = Mock()
        # Token already expired
        exp_time = int(time.time()) - 100
        mock_token.payload = {'jti': 'expired-jti', 'exp': exp_time}
        
        # Not in Redis
        mock_redis_cache.get.return_value = None
        
        # In database
        mock_blacklist_model.objects.filter.return_value.exists.return_value = True
        
        with pytest.raises(InvalidToken):
            with patch('rest_framework_simplejwt.authentication.JWTAuthentication.get_validated_token', return_value=mock_token):
                with patch('time.time', return_value=time.time()):
                    auth.get_validated_token(b'fake-token')
        
        # TTL calculation might fail or be skipped for expired tokens
        # Just verify it doesn't crash
    
    @patch('users.authentication.BlacklistedToken')
    def test_get_validated_token_missing_exp(self, mock_blacklist_model, auth, mock_redis_cache):
        """Test handling of token without exp claim"""
        mock_token = Mock()
        mock_token.payload = {'jti': 'no-exp-jti'}  # No exp
        
        # Not in Redis
        mock_redis_cache.get.return_value = None
        
        # In database
        mock_blacklist_model.objects.filter.return_value.exists.return_value = True
        
        with pytest.raises(InvalidToken):
            with patch('rest_framework_simplejwt.authentication.JWTAuthentication.get_validated_token', return_value=mock_token):
                auth.get_validated_token(b'fake-token')
        
        # Should still raise InvalidToken even if cache update fails
    
    @patch('users.authentication.BlacklistedToken')
    def test_redis_cache_key_format(self, mock_blacklist_model, auth, mock_redis_cache):
        """Test that Redis cache key is correctly formatted"""
        mock_token = Mock()
        mock_token.payload = {'jti': 'format-test-jti', 'exp': int(time.time()) + 3600}
        
        # Not in Redis
        mock_redis_cache.get.return_value = None
        
        # Not in database
        mock_blacklist_model.objects.filter.return_value.exists.return_value = False
        
        with patch('rest_framework_simplejwt.authentication.JWTAuthentication.get_validated_token', return_value=mock_token):
            auth.get_validated_token(b'fake-token')
        
        # Verify cache key format
        mock_redis_cache.get.assert_called_with('blacklist:format-test-jti')
    
    def test_authentication_inherits_from_jwt_authentication(self, auth):
        """Test that custom auth inherits from JWTAuthentication"""
        from rest_framework_simplejwt.authentication import JWTAuthentication
        assert isinstance(auth, JWTAuthentication)
