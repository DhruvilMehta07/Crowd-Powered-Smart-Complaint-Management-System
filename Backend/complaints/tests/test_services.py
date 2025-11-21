"""
Comprehensive tests for complaint services including ML pipelines and department suggestion
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io

from complaints.services.department_suggestion_service import DepartmentSuggestionService
from complaints.services.complaint_prediction_service import ComplaintPredictionService
from users.models import Department


@pytest.mark.django_db
class TestDepartmentSuggestionService:
    
    @pytest.fixture
    def service(self):
        return DepartmentSuggestionService()
    
    @pytest.fixture
    def fake_image(self):
        """Create a fake image file for testing"""
        image = Image.new('RGB', (100, 100), color='red')
        img_io = io.BytesIO()
        image.save(img_io, 'JPEG')
        img_io.seek(0)
        return SimpleUploadedFile("test.jpg", img_io.read(), content_type="image/jpeg")
    
    def test_suggest_with_road_image_and_description(self, service, fake_image):
        """Test department suggestion with road-related description"""
        Department.objects.create(name="Road")
        Department.objects.create(name="Water")
        
        result = service.suggest(fake_image, "pothole on main street")
        
        assert result is not None
        assert 'department_name' in result
        assert 'confidence' in result
        assert isinstance(result['confidence'], (int, float))
    
    def test_suggest_with_water_keywords(self, service, fake_image):
        """Test keyword matching for water department"""
        Department.objects.create(name="Water")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Classifier failed")):
            result = service.suggest(fake_image, "water pipe leak flooding")
            
            assert result['department_name'].lower() == 'water'
            assert result['confidence'] > 0
    
    def test_suggest_with_garbage_keywords(self, service, fake_image):
        """Test keyword matching for waste department"""
        Department.objects.create(name="Waste")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Failed")):
            result = service.suggest(fake_image, "garbage dump trash sanitation")
            
            assert result['department_name'].lower() == 'waste'
    
    def test_suggest_fallback_to_default(self, service, fake_image):
        """Test fallback to default department when no match"""
        Department.objects.create(name="other")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Failed")):
            result = service.suggest(fake_image, "random complaint text")
            
            assert result['department_name'] == 'other'
            assert result['confidence'] == 0.35
    
    def test_suggest_with_image_classifier_success(self, service, fake_image):
        """Test when image classifier returns valid result"""
        dept = Department.objects.create(name="electricity")
        
        mock_result = {
            'success': True,
            'department': 'electricity',
            'confidence': 0.85
        }
        
        with patch.object(service.image_classifier, 'classify_from_file', return_value=mock_result):
            result = service.suggest(fake_image, "transformer issue")
            
            assert result['department_name'] == 'electricity'
            assert result['confidence'] == 0.85
            assert 'department_id' in result
    
    def test_suggest_empty_description(self, service, fake_image):
        """Test suggestion with empty description"""
        Department.objects.create(name="Other")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Failed")):
            result = service.suggest(fake_image, "")
            
            assert result is not None
            assert result['confidence'] >= 0.35
    
    def test_keyword_match_street_lights(self, service, fake_image):
        """Test keyword matching for street lights"""
        Department.objects.create(name="Street Lights")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Failed")):
            result = service.suggest(fake_image, "street light not working dark")
            
            dept_name = result['department_name'].lower()
            assert 'street' in dept_name or 'light' in dept_name or 'road' in dept_name

    
    def test_keyword_match_parks(self, service, fake_image):
        """Test keyword matching for parks"""
        Department.objects.create(name="Parks")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Failed")):
            result = service.suggest(fake_image, "park garden trees playground")
            
            assert result['department_name'].lower() == 'parks'
    
    def test_no_departments_in_database(self, service, fake_image):
        """Test behavior when no departments exist in database"""
        # Clear all departments
        Department.objects.all().delete()
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Failed")):
            result = service.suggest(fake_image, "some complaint")
            
            # Should still return a result using fallback departments
            assert result is not None
            assert 'department_name' in result


@pytest.mark.django_db
class TestComplaintPredictionService:
    
    def test_predict_resolution_road_category(self, monkeypatch):
        """Test prediction for road category complaint"""
        mock_yolo_result = {
            'yolo_active': True,
            'detections': ['pothole'],
            'confidence': 0.9
        }
        
        mock_severity = {
            'severity_score': 7.5,
            'severity_level': 'High',
            'reasoning': 'Large pothole causing danger'
        }
        
        mock_time = {
            'estimated_days': 3,
            'confidence': 0.85
        }
        
        def mock_yolo_detect(*args, **kwargs):
            return mock_yolo_result
        
        def mock_severity_analyze(*args, **kwargs):
            return mock_severity
        
        def mock_time_predict(*args, **kwargs):
            return mock_time
        
        def mock_weather_fetch(*args, **kwargs):
            return {'temperature': 25, 'condition': 'Clear'}
        
        monkeypatch.setattr('complaints.ml.road_yolo_detector.RoadYOLODetector.detect_road_damage', mock_yolo_detect)
        monkeypatch.setattr('complaints.ml.severity_pipeline.SeverityAnalysisChain.analyze', mock_severity_analyze)
        monkeypatch.setattr('complaints.ml.langchain_time_prediction.TimePredictionChain.predict', mock_time_predict)
        monkeypatch.setattr('complaints.ml.weather_context.WeatherContextFetcher.fetch_weather', mock_weather_fetch)
        
        severity, time, metadata = ComplaintPredictionService.predict_resolution(
            complaint_id=1,
            category="Road",
            description="Big pothole",
            address="123 Main St",
            image_url="http://example.com/image.jpg"
        )
        
        assert severity is not None
        assert time is not None
        assert metadata['category'] == "Road"
        assert 'pipeline_steps' in metadata
    
    def test_predict_resolution_non_road_category(self, monkeypatch):
        """Test prediction for non-road category (YOLO should be skipped)"""
        mock_severity = {
            'severity_score': 5.0,
            'severity_level': 'Medium',
            'reasoning': 'Water leak'
        }
        
        mock_time = {
            'estimated_days': 2,
            'confidence': 0.80
        }
        
        def mock_severity_analyze(*args, **kwargs):
            return mock_severity
        
        def mock_time_predict(*args, **kwargs):
            return mock_time
        
        def mock_weather_fetch(*args, **kwargs):
            return {'temperature': 22, 'condition': 'Cloudy'}
        
        monkeypatch.setattr('complaints.ml.severity_pipeline.SeverityAnalysisChain.analyze', mock_severity_analyze)
        monkeypatch.setattr('complaints.ml.langchain_time_prediction.TimePredictionChain.predict', mock_time_predict)
        monkeypatch.setattr('complaints.ml.weather_context.WeatherContextFetcher.fetch_weather', mock_weather_fetch)
        
        severity, time, metadata = ComplaintPredictionService.predict_resolution(
            complaint_id=2,
            category="Water",
            description="Pipe leak",
            address="456 Oak Ave",
            image_url="http://example.com/water.jpg"
        )
        
        assert severity is not None
        assert 'severity_score' in severity
        assert time is not None
        # Check that YOLO was skipped
        yolo_step = next((s for s in metadata['pipeline_steps'] if s['step'] == 'yolo_detection'), None)
        if yolo_step:
            assert yolo_step['status'] in ['skipped', 'failed']
    
    def test_predict_resolution_yolo_failure_non_critical(self, monkeypatch):
        """Test that YOLO failure doesn't break the pipeline"""
        def mock_yolo_fail(*args, **kwargs):
            raise Exception("YOLO model not found")
        
        mock_severity = {'severity_score': 6.0, 'severity_level': 'Medium'}
        mock_time = {'estimated_days': 4, 'confidence': 0.75}
        
        monkeypatch.setattr('complaints.ml.road_yolo_detector.RoadYOLODetector.detect_road_damage', mock_yolo_fail)
        monkeypatch.setattr('complaints.ml.severity_pipeline.SeverityAnalysisChain.analyze', lambda *a, **k: mock_severity)
        monkeypatch.setattr('complaints.ml.langchain_time_prediction.TimePredictionChain.predict', lambda *a, **k: mock_time)
        monkeypatch.setattr('complaints.ml.weather_context.WeatherContextFetcher.fetch_weather', lambda *a, **k: {})
        
        severity, time, metadata = ComplaintPredictionService.predict_resolution(
            complaint_id=3,
            category="Road",
            description="Broken road",
            address="789 Pine St",
            image_url="http://example.com/road.jpg"
        )
        
        # Pipeline should still complete despite YOLO failure
        assert severity is not None
        assert time is not None
        
        # Check YOLO step marked as failed
        yolo_step = next((s for s in metadata['pipeline_steps'] if s['step'] == 'yolo_detection'), None)
        if yolo_step:
            assert yolo_step['status'] == 'failed'
    
    def test_predict_resolution_severity_failure(self, monkeypatch):
        """Test behavior when severity analysis fails"""
        def mock_severity_fail(*args, **kwargs):
            raise Exception("LLM API error")
        
        mock_time = {'estimated_days': 5, 'confidence': 0.70}
        
        monkeypatch.setattr('complaints.ml.severity_pipeline.SeverityAnalysisChain.analyze', mock_severity_fail)
        monkeypatch.setattr('complaints.ml.langchain_time_prediction.TimePredictionChain.predict', lambda *a, **k: mock_time)
        monkeypatch.setattr('complaints.ml.weather_context.WeatherContextFetcher.fetch_weather', lambda *a, **k: {})
        
        # Should raise exception or return error dict
        try:
            severity, time, metadata = ComplaintPredictionService.predict_resolution(
                complaint_id=4,
                category="Road",
                description="Test",
                address="Test Address",
                image_url="http://example.com/test.jpg"
            )
            # If it returns, check for error indication
            assert 'error' in str(severity).lower() or 'failed' in str(severity).lower()
        except Exception as e:
            # Expected behavior - severity failure is critical
            assert 'LLM' in str(e) or 'error' in str(e).lower()
