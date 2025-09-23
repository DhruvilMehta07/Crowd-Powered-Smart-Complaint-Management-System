from django.test import TestCase
from django.urls import reverse
from django.contrib.auth import get_user_model

from .models import Citizen, Government_Authority, Field_Worker, Department


class BulkUserCreationTests(TestCase):


	def setUp(self):
		# create a department for authority/fieldworker assignments
		self.department = Department.objects.create(name='roads')

	def _create_many(self, model, prefix):
		created = []
		for i in range(20):
			username = f"{prefix}{i}"
			email = f"{prefix}{i}@example.com"
			# for phone number use valid starting digit 9 and ensure uniqueness
			phone = f"9{i:09d}"[-10:]
			obj = model(
				username=username,
				email=email,
				first_name=f"{prefix}_first_{i}",
				last_name=f"{prefix}_last_{i}",
				phone_number=phone,
			)
			# assign department for models that have it
			if hasattr(obj, 'assigned_department'):
				obj.assigned_department = self.department
			obj.set_password('testpass123')
			obj.save()
			created.append(obj)

		return created

	def test_citizens(self):
		# create 20 citizens and verify creation and deletion
		created = self._create_many(Citizen, 'citizen')
		count = Citizen.objects.filter(username__startswith='citizen').count()
		self.assertEqual(count, 20)
		print(f"Successfully test_citizens: Created {count} citizens (sample: {created[0].username} ... {created[-1].username})")

		Citizen.objects.filter(username__startswith='citizen').delete()
		count_after = Citizen.objects.filter(username__startswith='citizen').count()
		self.assertEqual(count_after, 0)
		print(f"Successfully test_citizens: Deleted citizens, remaining count = {count_after}")

	def test_government_authorities(self):
		created = self._create_many(Government_Authority, 'authority')
		count = Government_Authority.objects.filter(username__startswith='authority').count()
		self.assertEqual(count, 20)
		print(f"Successfully test_government_authorities: Created {count} authorities (sample: {created[0].username})")

		Government_Authority.objects.filter(username__startswith='authority').delete()
		count_after = Government_Authority.objects.filter(username__startswith='authority').count()
		self.assertEqual(count_after, 0)
		print(f"Successfully test_government_authorities: Deleted authorities, remaining count = {count_after}")

	def test_field_workers(self):
		created = self._create_many(Field_Worker, 'fieldworker')
		count = Field_Worker.objects.filter(username__startswith='fieldworker').count()
		self.assertEqual(count, 20)
		print(f"Successfully test_field_workers: Created {count} field workers (sample: {created[0].username})")

		Field_Worker.objects.filter(username__startswith='fieldworker').delete()
		count_after = Field_Worker.objects.filter(username__startswith='fieldworker').count()
		self.assertEqual(count_after, 0)
		print(f"Successfully test_field_workers: Deleted field workers, remaining count = {count_after}")

class SignupAPITests(TestCase):
	"""Test the citizen signup API endpoint and a few basic behaviours."""

	def setUp(self):
		self.citizen_url = reverse('users:signup-citizen')
		self.department = Department.objects.create(name='sanitation')

	def test_citizen_signup_api_creates_user(self):
		payload = {
			'username': 'newcitizen',
			'email': 'newcitizen@example.com',
			'password': 'strongpass123',
			'first_name': 'New',
			'last_name': 'Citizen',
			'phone_number': '9123456789',
		}
		response = self.client.post(self.citizen_url, data=payload, content_type='application/json')
		# because serializer in views returns 201 on success
		self.assertEqual(response.status_code, 201)
		print(f"Successfully test_citizen_signup_api_creates_user: Response status = {response.status_code}")
		# user should exist
		exists = Citizen.objects.filter(username='newcitizen').exists()
		self.assertTrue(exists)
		print(f"Successfully test_citizen_signup_api_creates_user: User exists = {exists}")

	def test_bulk_signup_cycle_for_citizens(self):
		# Create 20 citizens through the model and then delete them
		for i in range(20):
			Citizen.objects.create(
				username=f"api_cit_{i}",
				email=f"api_cit_{i}@example.com",
				first_name='A',
				last_name='B',
				phone_number=f"9{str(i).zfill(9)}",
			)
		self.assertEqual(Citizen.objects.filter(username__startswith='api_cit_').count(), 20)
		Citizen.objects.filter(username__startswith='api_cit_').delete()
		self.assertEqual(Citizen.objects.filter(username__startswith='api_cit_').count(), 0)