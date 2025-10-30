from sqlite3 import IntegrityError
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from django.core import mail

from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
from django.utils import timezone
from datetime import timedelta
from .. import views as users_views
from ..models import Department,Government_Authority,Citizen,Field_Worker
from .. import authentication as users_auth
from unittest.mock import patch
import time

from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError

from ..EmailService import EmailService
from ..models import Department, Citizen
from django.db import IntegrityError

User = get_user_model()


class UsersAuthTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_payload = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "strongpass123"
        }
        users_views.otp_storage.clear()
        self.dept=Department.objects.create(name="Test Department")

    def _create_user_model(self, username="testuser", email="test@example.com", password="strongpass123", user_cls=User, **extra):
        return user_cls.objects.create_user(username=username, email=email, password=password, **extra)

    def test_verify_otp_creates_citizen_and_returns_tokens_and_sets_cookie(self):
        email = "citizen@example.com"
        users_views.otp_storage[email] = {
            "otp": "111111",
            "data": {"username": "citizen1", "email": email, "password": "pw123456"},
            "user_type": "citizen"
        }

        url = reverse("users:verify-otp")
        res = self.client.post(url, {"email": email, "otp": "111111"}, format="json")
        assert res.status_code in (status.HTTP_200_OK, status.HTTP_201_CREATED)
        assert "access" in res.data
        refresh_morsel = res.cookies.get("refresh")
        assert refresh_morsel is not None and getattr(refresh_morsel, 'value', None)

    def test_verify_otp_invalid_otp_returns_400(self):
        email = "citizen2@example.com"
        users_views.otp_storage[email] = {
            "otp": "222222",
            "data": {"username": "citizen2", "email": email, "password": "pw123456"},
            "user_type": "citizen"
        }
        url = reverse("users:verify-otp")
        res = self.client.post(url, {"email": email, "otp": "000000"}, format="json")
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert res.data.get("error") == "Invalid OTP."

    def test_login_returns_access_and_sets_refresh_cookie(self):
        self._create_user_model(username="loginuser", email="login@example.com", password="pwlogin")
        url = reverse("users:login")
        res = self.client.post(url, {"username": "loginuser", "password": "pwlogin"}, format="json")
        assert res.status_code == status.HTTP_200_OK
        assert "access" in res.data
        refresh_morsel = res.cookies.get("refresh")
        assert refresh_morsel is not None and getattr(refresh_morsel, 'value', None)

    def test_unverified_authority_cannot_login(self):
        auth = self._create_user_model(username="auth1", email="auth@example.com", password="pw", user_cls=Government_Authority)
        auth.verified = False
        auth.save()
        url = reverse("users:login")
        res = self.client.post(url, {"username": "auth1", "password": "pw"}, format="json")
        assert res.status_code == status.HTTP_401_UNAUTHORIZED
        assert "pending" in res.data.get("error", "").lower()

    def test_logout_blacklists_refresh_and_prevents_future_refresh(self):
        self._create_user_model(username="logoutuser", email="logout@example.com", password="pwlogout")
        login_url = reverse("users:login")
        login_res = self.client.post(login_url, {"username": "logoutuser", "password": "pwlogout"}, format="json")
        assert login_res.status_code == status.HTTP_200_OK
        refresh_cookie = None
        morsel = login_res.cookies.get("refresh")
        if morsel:
            refresh_cookie = getattr(morsel, 'value', None)
        assert refresh_cookie is not None

        
        self.client.cookies["refresh"] = refresh_cookie
        logout_url = reverse("users:logout")
        logout_res = self.client.post(logout_url, {}, format="json")
        assert logout_res.status_code == status.HTTP_200_OK
        
        # attempt to refresh with blacklisted token
        self.client.cookies["refresh"] = refresh_cookie
        self.client.cookies["csrftoken"] = "tok"
        refresh_url = reverse("users:token-refresh")
        refresh_res = self.client.post(refresh_url, {}, HTTP_X_CSRFTOKEN="tok", format="json")
        assert refresh_res.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_400_BAD_REQUEST)
        if refresh_res.status_code == status.HTTP_401_UNAUTHORIZED:
            assert "blacklist" in str(refresh_res.data).lower()

    def test_refresh_returns_new_access_and_rotates_refresh_cookie(self):
        self._create_user_model(username="refuser", email="ref@example.com", password="pwref")
        login_res = self.client.post(reverse("users:login"), {"username": "refuser", "password": "pwref"}, format="json")
        morsel = login_res.cookies.get("refresh")
        refresh_cookie = getattr(morsel, 'value', None) if morsel else None
        assert refresh_cookie
        self.client.cookies["refresh"] = refresh_cookie
        self.client.cookies["csrftoken"] = "csrftokval"
        refresh_res = self.client.post(reverse("users:token-refresh"), {}, HTTP_X_CSRFTOKEN="csrftokval", format="json")
        assert refresh_res.status_code in (status.HTTP_200_OK, status.HTTP_201_CREATED)
        assert "access" in refresh_res.data
        assert refresh_res.cookies.get("refresh") is not None

    def test_logout_without_refresh_returns_400(self):
        res = self.client.post(reverse("users:logout"), {}, format="json")
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert res.data.get("detail") is not None

    def test_verify_authority_and_fieldworker_create_accounts_without_tokens(self):
        email = "auth2@example.com"
        users_views.otp_storage[email] = {
            "otp": "333333",
            "data": {"username": "auth2", "email": email, "password": "pw123","assigned_department_id": self.dept.id},
            "user_type": "authority"
        }
        res = self.client.post(reverse("users:verify-otp"), {"email": email, "otp": "333333"}, format="json")

        assert res.status_code in (status.HTTP_200_OK, status.HTTP_201_CREATED)
        assert "access" not in res.data

        # fieldworker
        email2 = "fw@example.com"
        users_views.otp_storage[email2] = {
            "otp": "444444",
            "data": {"username": "fw1", "email": email2, "password": "pw123","assigned_department_id": self.dept.id},
            "user_type": "fieldworker"
        }
        res2 = self.client.post(reverse("users:verify-otp"), {"email": email2, "otp": "444444"}, format="json")
        assert res2.status_code in (status.HTTP_200_OK, status.HTTP_201_CREATED)
        assert "access" not in res2.data

    def test_refresh_with_invalid_token_returns_error(self):
        self.client.cookies["refresh"] = "thisisnotavalidtoken"
        self.client.cookies["csrftoken"] = "tok"
        res = self.client.post(reverse("users:token-refresh"), {}, HTTP_X_CSRFTOKEN="tok", format="json")
        assert res.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED)

    def tearDown(self):
        users_views.otp_storage.clear()


class UsersViewsAdditionalTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        users_views.otp_storage.clear()
        self.dept = Department.objects.create(name="Dept A")

    @patch("users.views.EmailService.send_otp_email", return_value=True)
    @patch("users.views.EmailService.generate_otp", return_value="999999")
    def test_citizen_signup_sends_otp_and_stores_entry(self, mock_gen, mock_send):
        payload = {"username": "c1", "email": "c1@example.com", "password": "pw123456"}
        url = reverse("users:signup-citizen")
        res = self.client.post(url, payload, format="json")
        assert res.status_code == status.HTTP_200_OK
        assert res.data.get("email") == payload["email"]
        assert payload["email"] in users_views.otp_storage
        entry = users_views.otp_storage[payload["email"]]
        assert entry["otp"] == "999999"
        assert entry["user_type"] == "citizen"
        assert entry["data"]["username"] == "c1"

    @patch("users.views.EmailService.send_otp_email", return_value=False)
    @patch("users.views.EmailService.generate_otp", return_value="111111")
    def test_citizen_signup_email_send_failure_cleans_storage_and_returns_500(self, mock_gen, mock_send):
        payload = {"username": "c2", "email": "c2@example.com", "password": "pw123456"}
        url = reverse("users:signup-citizen")
        res = self.client.post(url, payload, format="json")
        assert res.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert payload["email"] not in users_views.otp_storage

    def test_citizen_signup_existing_email_returns_400(self):
        Citizen.objects.create_user(username="exists", email="ex@example.com", password="pw1234567")
        payload = {"username": "new", "email": "ex@example.com", "password": "pw23456789"}
        url = reverse("users:signup-citizen")
        res = self.client.post(url, payload, format="json")
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert "already exists" in str(res.data).lower()

    @patch("users.views.EmailService.send_otp_email", return_value=True)
    @patch("users.views.EmailService.generate_otp", return_value="222222")
    def test_authority_and_fieldworker_signup_store_user_type(self, mock_gen, mock_send):
        auth_payload = {
            "username": "auth1", "email": "auth1@example.com", "password": "pw123456",
            "assigned_department_id": self.dept.id
        }
        url_auth = reverse("users:signup-authority")
        res = self.client.post(url_auth, auth_payload, format="json")
        assert res.status_code == status.HTTP_200_OK
        assert users_views.otp_storage[auth_payload["email"]]["user_type"] == "authority"

        fw_payload = {
            "username": "fw1", "email": "fw1@example.com", "password": "pw12345678",
            "assigned_department_id": self.dept.id
        }
        url_fw = reverse("users:signup-fieldworker")
        res2 = self.client.post(url_fw, fw_payload, format="json")
        assert res2.status_code == status.HTTP_200_OK
        assert users_views.otp_storage[fw_payload["email"]]["user_type"] == "fieldworker"

   
    def test_verify_otp_missing_email_or_otp_returns_400(self):
        url = reverse("users:verify-otp")
        res = self.client.post(url, {"email": ""}, format="json")
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        res2 = self.client.post(url, {"otp": "123"}, format="json")
        assert res2.status_code == status.HTTP_400_BAD_REQUEST


    def test_department_create_and_list(self):
        url = reverse("users:department-list-create")
        res = self.client.post(url, {"name": "NewDept"}, format="json")
        assert res.status_code in (status.HTTP_201_CREATED, status.HTTP_200_OK), f"Create returned {res.status_code}: {res.data}"

        from ..models import Department
        assert Department.objects.filter(name="newdept").exists(), f"Department not created, create response: {res.data}"

        res2 = self.client.get(url, format="json")
        assert res2.status_code == status.HTTP_200_OK, f"List returned {res2.status_code}: {res2.data}"
        names = [d.get("name") for d in res2.data]
        assert "newdept" in names, f"'NewDept' not in list response: {res2.data}"


    def test_token_refresh_blacklisted_returns_401(self):
        user = Citizen.objects.create_user(username="r1", email="r1@example.com", password="pw123456")
        refresh = RefreshToken.for_user(user)
        refresh_token = str(refresh)
        jti = refresh.payload.get("jti")
        users_auth.redis_cache.set(f"blacklist:{jti}", 1, 60)
        self.client.cookies["refresh"] = refresh_token
        self.client.cookies["csrftoken"] = "csrftkn"
        res = self.client.post(reverse("users:token-refresh"), {}, HTTP_X_CSRFTOKEN="csrftkn", format="json")
        assert res.status_code == status.HTTP_401_UNAUTHORIZED
        assert "blacklist" in str(res.data).lower()

    def test_token_refresh_with_invalid_token_returns_400(self):
        self.client.cookies["refresh"] = "invalid.token.value"
        self.client.cookies["csrftoken"] = "csrftkn"
        res = self.client.post(reverse("users:token-refresh"), {}, HTTP_X_CSRFTOKEN="csrftkn", format="json")
        assert res.status_code in (status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED)

    def test_logout_with_invalid_token_in_body_returns_400(self):
        res = self.client.post(reverse("users:logout"), {"refresh": "not-a-token"}, format="json")
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert "invalid" in str(res.data).lower()

    def test_logout_requires_refresh_cookie_or_body(self):
        res = self.client.post(reverse("users:logout"), {}, format="json")
        assert res.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_invalid_credentials_returns_401(self):
        res = self.client.post(reverse("users:login"), {"username": "noone", "password": "x"}, format="json")
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

    def tearDown(self):
        users_views.otp_storage.clear()
        try:
            users_auth.redis_cache.clear()
        except Exception:
            pass

class UsersViewsBranchesTests(APITestCase):
    def setUp(self):
        self.client = APIClient()
        users_views.otp_storage.clear()
        self.dept = Department.objects.create(name="initialdept")

    def test_emailservice_send_mail_exception_returns_false(self):
        with patch("users.EmailService.send_mail", side_effect=Exception("smtp down")):
            ok = EmailService.send_otp_email("a@b.com", "123456", "Citizen")
            assert ok is False

    def test_department_save_trims_lowercases_and_str_and_uniqueness_raises(self):
        d = Department(name=" NewDept ")
        d.save()
        d.refresh_from_db()
        assert d.name == "newdept"
        assert str(d) == "Newdept"

        d2 = Department(name="NEWDEPT")
        with self.assertRaises(IntegrityError):
            d2.save()

    def test_citizen_signup_serializer_invalid_returns_400(self):
        url = reverse("users:signup-citizen")
        res = self.client.post(url, {"username": "uonly"}, format="json")
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert res.data

    def test_verify_otp_invalid_user_type_returns_invalid_user_type(self):
        email = "x@x.com"
        users_views.otp_storage[email] = {"otp": "999999", "data": {"username": "u", "email": email, "password": "pw123456"}, "user_type": "unknown"}
        res = self.client.post(reverse("users:verify-otp"), {"email": email, "otp": "999999"}, format="json")
        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert res.data.get("error") == "Invalid user type."

    def test_tokenrefresh_backend_decode_tokenerror_returns_400(self):
        with patch("users.views.TokenBackend.decode", side_effect=TokenError("bad")):
            self.client.cookies["refresh"] = "some.invalid.token"
            res = self.client.post(reverse("users:token-refresh"), {}, format="json")
            assert res.status_code == status.HTTP_400_BAD_REQUEST
            assert "Invalid refresh token" in str(res.data)

    def test_tokenrefresh_backend_decode_generic_exception_returns_400(self):
        with patch("users.views.TokenBackend.decode", side_effect=Exception("boom")):
            self.client.cookies["refresh"] = "some.token"
            res = self.client.post(reverse("users:token-refresh"), {}, format="json")
            assert res.status_code == status.HTTP_400_BAD_REQUEST
            assert "Token check failed" in str(res.data)

    def test_logout_generic_exception_returns_500(self):
        with patch("users.views.RefreshToken", side_effect=Exception("boom")):
            self.client.cookies["refresh"] = "some.token"
            res = self.client.post(reverse("users:logout"), {}, format="json")
            assert res.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            assert "Logout failed" in str(res.data)

# testing custom authentication.py file
    def test_redis_and_db_blacklist_authentication(self):
        user = Citizen.objects.create_user(username="atuser", email="at@example.com", password="pw")
        refresh = RefreshToken.for_user(user)
        access = refresh.access_token
        access_raw = str(access)
        jti = access.payload.get("jti")

        auth = users_auth.RedisCheckingJWTAuthentication()

        users_auth.redis_cache.set(f"blacklist:{jti}", 1, 60)
        with self.assertRaises(Exception) as cm:
            auth.get_validated_token(access_raw)
        self.assertIn("blacklist", str(cm.exception).lower())
        users_auth.redis_cache.delete(f"blacklist:{jti}")

        expires = timezone.now() + timedelta(hours=1)
        out = OutstandingToken.objects.create(user=user, jti=jti, token=str(refresh), expires_at=expires)
        BlacklistedToken.objects.create(token=out)

        users_auth.redis_cache.delete(f"blacklist:{jti}")

        with self.assertRaises(Exception):
            auth.get_validated_token(access_raw)

        val = users_auth.redis_cache.get(f"blacklist:{jti}")
        assert val in (1, b"1", "1")

    # otp send failure
    def test_otp_send_failure_authority_and_fieldworker(self):
        with patch("users.views.EmailService.send_otp_email", return_value=False):
            auth_payload = {"username": "authf", "email": "authf@example.com", "password": "pw", "assigned_department_id": self.dept.id}
            res = self.client.post(reverse('users:signup-authority'), auth_payload, format='json')
            assert res.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            assert auth_payload['email'] not in users_views.otp_storage

            fw_payload = {"username": "fwf", "email": "fwf@example.com", "password": "pw", "assigned_department_id": self.dept.id}
            res2 = self.client.post(reverse('users:signup-fieldworker'), fw_payload, format='json')
            assert res2.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
            assert fw_payload['email'] not in users_views.otp_storage

    # for serializers error
    def test_verify_registration_integrity_errors_combined(self):
        Government_Authority.objects.create_user(username='dup_auth', email='dup_auth@example.com', password='pw123456', assigned_department=self.dept)
        users_views.otp_storage['dup_auth@example.com'] = {
            'otp': '234234',
            'data': {'username': 'dup_auth', 'email': 'dup_auth@example.com', 'password': 'pw123456', 'assigned_department_id': self.dept.id},
            'user_type': 'authority'
        }
        res2 = self.client.post(reverse('users:verify-otp'), {'email': 'dup_auth@example.com', 'otp': '234234'}, format='json')
        assert res2.status_code == status.HTTP_400_BAD_REQUEST

        Field_Worker.objects.create_user(username='dup_fw', email='dup_fw@example.com', password='pw123456', assigned_department=self.dept)
        users_views.otp_storage['dup_fw@example.com'] = {
            'otp': '345345',
            'data': {'username': 'dup_fw', 'email': 'dup_fw@example.com', 'password': 'pw123456', 'assigned_department_id': self.dept.id},
            'user_type': 'fieldworker'
        }
        res3 = self.client.post(reverse('users:verify-otp'), {'email': 'dup_fw@example.com', 'otp': '345345'}, format='json')
        assert res3.status_code == status.HTTP_400_BAD_REQUEST

    # for integrity error
    def test_integrityerror_exception_lines_covered_by_mocking_serializer_save(self):
        users_views.otp_storage['m_cit@example.com'] = {
            'otp': '777777',
            'data': {'username': 'm_cit', 'email': 'm_cit@example.com', 'password': 'pw'},
            'user_type': 'citizen'
        }
        with patch.object(users_views.CitizenSerializer, 'save', side_effect=IntegrityError('dup_cit')):
            res = self.client.post(reverse('users:verify-otp'), {'email': 'm_cit@example.com', 'otp': '777777'}, format='json')
            assert res.status_code == status.HTTP_400_BAD_REQUEST
            assert res.data

        users_views.otp_storage['m_auth@example.com'] = {
            'otp': '888888',
            'data': {'username': 'm_auth', 'email': 'm_auth@example.com', 'password': 'pw', 'assigned_department_id': self.dept.id},
            'user_type': 'authority'
        }
        with patch.object(users_views.GovernmentAuthoritySerializer, 'save', side_effect=IntegrityError('dup_auth')):
            res2 = self.client.post(reverse('users:verify-otp'), {'email': 'm_auth@example.com', 'otp': '888888'}, format='json')
            assert res2.status_code == status.HTTP_400_BAD_REQUEST
            assert res2.data

        users_views.otp_storage['m_fw@example.com'] = {
            'otp': '999999',
            'data': {'username': 'm_fw', 'email': 'm_fw@example.com', 'password': 'pw', 'assigned_department_id': self.dept.id},
            'user_type': 'fieldworker'
        }
        with patch.object(users_views.FieldWorkerSerializer, 'save', side_effect=IntegrityError('dup_fw')):
            res3 = self.client.post(reverse('users:verify-otp'), {'email': 'm_fw@example.com', 'otp': '999999'}, format='json')
            assert res3.status_code == status.HTTP_400_BAD_REQUEST
            assert res3.data

    def tearDown(self):
        users_views.otp_storage.clear()
        try:
            users_auth.redis_cache.clear()
        except Exception:
            pass