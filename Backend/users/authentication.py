from django.core.cache import caches
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken

redis_cache = caches['default']


class RedisCheckingJWTAuthentication(JWTAuthentication):
    """
    Custom authentication checker which first checks redis and then db if redis fails
    """
    def get_validated_token(self, raw_token):
        token = super().get_validated_token(raw_token)
        jti = token.payload.get('jti')
        # if jti not found raise error
        if not jti:
            raise InvalidToken('Token missing jti claim.')

        cache_key = f"blacklist:{jti}"
        # First redis check
        if redis_cache.get(cache_key):
            raise InvalidToken('Token has been blacklisted in redis.')

        # fallback to DB check
        if BlacklistedToken.objects.filter(token__jti=jti).exists():
            # update Redis cache for future hits
            try:
                exp = token.payload.get('exp')
                import time
                ttl = max(0, int(exp - time.time()))
            except Exception:
                ttl = None
            if ttl:
                try:
                    redis_cache.set(cache_key, 1, ttl)
                except Exception:
                    pass
            raise InvalidToken('Token has been blacklisted.')

        return token