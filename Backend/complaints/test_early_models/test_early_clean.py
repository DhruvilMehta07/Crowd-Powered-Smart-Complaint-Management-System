import pytest
from django.core.exceptions import ValidationError
from complaints.models import Complaint, ComplaintImage
from users.models import ParentUser
from cloudinary.models import CloudinaryField
from django.utils import timezone

@pytest.mark.django_db
class TestComplaintImageClean:
    @pytest.fixture
    def parent_user(self, db):
        # Create a minimal ParentUser instance
        return ParentUser.objects.create(username="testuser", email="test@example.com")

    @pytest.fixture
    def complaint(self, parent_user):
        # Create a minimal Complaint instance
        return Complaint.objects.create(content="Test complaint", posted_by=parent_user)

    @pytest.fixture
    def image_field(self):
        # Mock CloudinaryField for testing
        return CloudinaryField('image', folder='complaints/')

    @pytest.mark.happy_path
    def test_clean_allows_less_than_4_images(self, complaint, image_field):
        """
        Test that clean() allows adding images when there are less than 4 images attached to a complaint.
        """
        for i in range(3):
            ComplaintImage.objects.create(complaint=complaint, image="dummy_url", order=i)
        new_image = ComplaintImage(complaint=complaint, image="dummy_url", order=3)
        # Should not raise
        new_image.clean()

    @pytest.mark.happy_path
    def test_clean_allows_existing_image_update_when_4_images(self, complaint, image_field):
        """
        Test that clean() allows updating an existing image (pk is set) even if there are already 4 images.
        """
        images = [
            ComplaintImage.objects.create(complaint=complaint, image="dummy_url", order=i)
            for i in range(4)
        ]
        # Simulate updating the first image (pk is set)
        images[0].clean()  # Should not raise

    @pytest.mark.edge_case
    def test_clean_raises_validationerror_on_adding_5th_image(self, complaint, image_field):
        """
        Test that clean() raises ValidationError when trying to add a 5th image to a complaint.
        """
        for i in range(4):
            ComplaintImage.objects.create(complaint=complaint, image="dummy_url", order=i)
        new_image = ComplaintImage(complaint=complaint, image="dummy_url", order=4)
        # pk is None (not saved yet), should raise
        with pytest.raises(ValidationError) as excinfo:
            new_image.clean()
        assert "maximum of 4 images" in str(excinfo.value)

    @pytest.mark.edge_case
    def test_clean_allows_exactly_4_images(self, complaint, image_field):
        """
        Test that clean() allows adding the 4th image (not more than 4).
        """
        for i in range(3):
            ComplaintImage.objects.create(complaint=complaint, image="dummy_url", order=i)
        fourth_image = ComplaintImage(complaint=complaint, image="dummy_url", order=3)
        # Should not raise
        fourth_image.clean()

    @pytest.mark.edge_case
    def test_clean_with_no_images(self, complaint, image_field):
        """
        Test that clean() allows adding the first image to a complaint with no images.
        """
        first_image = ComplaintImage(complaint=complaint, image="dummy_url", order=0)
        # Should not raise
        first_image.clean()

    @pytest.mark.edge_case
    def test_clean_with_pk_set_and_more_than_4_images(self, complaint, image_field):
        """
        Test that clean() does not raise ValidationError when updating an existing image (pk is set),
        even if there are already more than 4 images (should not happen in normal usage, but test edge).
        """
        images = [
            ComplaintImage.objects.create(complaint=complaint, image="dummy_url", order=i)
            for i in range(5)
        ]
        # Simulate updating the fifth image (pk is set)
        images[4].clean()  # Should not raise

    @pytest.mark.edge_case
    def test_clean_with_nonstandard_ordering(self, complaint, image_field):
        """
        Test that clean() works regardless of the 'order' field values.
        """
        for i in [10, 20, 30]:
            ComplaintImage.objects.create(complaint=complaint, image="dummy_url", order=i)
        new_image = ComplaintImage(complaint=complaint, image="dummy_url", order=99)
        new_image.clean()  # Should not raise

    @pytest.mark.edge_case
    def test_clean_with_null_image_field(self, complaint):
        """
        Test that clean() works even if image field is None (should not affect image count logic).
        """
        for i in range(3):
            ComplaintImage.objects.create(complaint=complaint, image="dummy_url", order=i)
        new_image = ComplaintImage(complaint=complaint, image=None, order=3)
        new_image.clean()  # Should not raise

    @pytest.mark.edge_case
    def test_clean_with_null_complaint_raises(self, image_field):
        """
        Test that clean() raises AttributeError if complaint is None.
        """
        new_image = ComplaintImage(complaint=None, image="dummy_url", order=0)
        with pytest.raises(AttributeError):
            new_image.clean()