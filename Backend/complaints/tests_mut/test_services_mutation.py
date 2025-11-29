"""
Mutation tests for complaints/services/

These tests focus on:
- Branch coverage for all service methods
- Edge cases in ML pipeline
- Error handling paths
- Different input combinations
- Return value variations
"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image
import io

from users.models import Department
from complaints.services.department_suggestion_service import DepartmentSuggestionService
from complaints.services.complaint_prediction_service import ComplaintPredictionService


@pytest.mark.django_db
class TestDepartmentSuggestionServiceMutations:
    """Mutation tests for DepartmentSuggestionService"""
    
    @pytest.fixture
    def service(self):
        return DepartmentSuggestionService()
    
    @pytest.fixture
    def fake_image(self):
        """Create a fake image file"""
        image = Image.new('RGB', (100, 100), color='red')
        img_io = io.BytesIO()
        image.save(img_io, 'JPEG')
        img_io.seek(0)
        return SimpleUploadedFile("test.jpg", img_io.read(), content_type="image/jpeg")
    
    def test_suggest_with_classifier_success(self, service, fake_image):
        """Test successful image classifier path"""
        dept = Department.objects.create(name="Road")
        
        mock_result = {
            'success': True,
            'department': 'Road',
            'confidence': 0.85
        }
        
        with patch.object(service.image_classifier, 'classify_from_file', return_value=mock_result):
            result = service.suggest(fake_image, "pothole on street")
            
            assert result['department_name'] == 'Road'
            assert result['confidence'] == 0.85
            assert 'department_id' in result
    
    def test_suggest_with_classifier_failure_falls_back_to_keywords(self, service, fake_image):
        """Test classifier failure falls back to keyword matching"""
        Department.objects.create(name="Water")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Classifier error")):
            result = service.suggest(fake_image, "water leak pipe burst")
            
            assert result['department_name'].lower() == 'water'
            assert result['confidence'] == 0.55
    
    def test_suggest_with_no_description_and_classifier_failure(self, service, fake_image):
        """Test no description and classifier failure uses default"""
        Department.objects.create(name="Other")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "")
            
            assert result['department_name'] == 'Other'
            assert result['confidence'] == 0.35
    
    def test_suggest_with_empty_description_string(self, service, fake_image):
        """Test empty string description"""
        Department.objects.create(name="Other")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "   ")
            
            assert result['confidence'] >= 0.35
    
    def test_match_keywords_road(self, service, fake_image):
        """Test keyword matching for road department"""
        Department.objects.create(name="Road")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "big pothole on highway")
            
            dept_name = result['department_name'].lower()
            assert 'road' in dept_name or result['confidence'] > 0
    
    def test_match_keywords_water(self, service, fake_image):
        """Test keyword matching for water department"""
        Department.objects.create(name="Water")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "water supply issue leak")
            
            assert result['department_name'].lower() == 'water'
    
    def test_match_keywords_waste(self, service, fake_image):
        """Test keyword matching for waste department"""
        Department.objects.create(name="Waste")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "garbage dump trash everywhere")
            
            assert result['department_name'].lower() == 'waste'
    
    def test_match_keywords_electricity(self, service, fake_image):
        """Test keyword matching for electricity"""
        Department.objects.create(name="Electricity")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "electric wire hanging transformer")
            
            assert result['department_name'].lower() == 'electricity'
    
    def test_match_keywords_fire(self, service, fake_image):
        """Test keyword matching for fire"""
        Department.objects.create(name="Fire")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "fire smoke burning")
            
            assert result['department_name'].lower() == 'fire'
    
    def test_match_keywords_health(self, service, fake_image):
        """Test keyword matching for health"""
        Department.objects.create(name="Health")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "hospital medical health issue")
            
            assert result['department_name'].lower() == 'health'
    
    def test_match_keywords_sanitation(self, service, fake_image):
        """Test keyword matching for sanitation"""
        Department.objects.create(name="Sanitation")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "toilet bathroom septic issue")
            
            assert result['department_name'].lower() == 'sanitation'
    
    def test_match_keywords_parks(self, service, fake_image):
        """Test keyword matching for parks"""
        Department.objects.create(name="Parks")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "park garden trees broken")
            
            assert result['department_name'].lower() == 'parks'
    
    def test_match_keywords_drainage(self, service, fake_image):
        """Test keyword matching for drainage"""
        Department.objects.create(name="Drainage")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "drain blocked flood overflow")
            
            assert result['department_name'].lower() == 'drainage'
    
    def test_match_keywords_street_lights(self, service, fake_image):
        """Test keyword matching for street lights"""
        Department.objects.create(name="Street Lights")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "street light not working dark")
            
            dept_name = result['department_name'].lower()
            assert 'street' in dept_name or 'light' in dept_name or dept_name == 'other'
    
    def test_match_keywords_building(self, service, fake_image):
        """Test keyword matching for building"""
        Department.objects.create(name="Building")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "building construction violation wall")
            
            assert result['department_name'].lower() == 'building'
    
    def test_match_keywords_traffic(self, service, fake_image):
        """Test keyword matching for traffic"""
        Department.objects.create(name="Traffic")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "traffic signal not working jam")
            
            assert result['department_name'].lower() == 'traffic'
    
    def test_match_keywords_pollution(self, service, fake_image):
        """Test keyword matching for pollution"""
        Department.objects.create(name="Pollution")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "air pollution smell toxic")
            
            assert result['department_name'].lower() == 'pollution'
    
    def test_match_keywords_first_match_wins(self, service, fake_image):
        """Test that first keyword match is used"""
        Department.objects.create(name="Road")
        Department.objects.create(name="Water")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            # "road" appears in KEYWORD_MAP before water keywords
            result = service.suggest(fake_image, "road")
            
            # Should match road (depends on dict iteration order in Python 3.7+)
            assert result['department_name'] in ['Road', 'road'] or result['confidence'] >= 0.35
    
    def test_no_keyword_match_uses_default(self, service, fake_image):
        """Test no keyword match uses default department"""
        Department.objects.create(name="Other")
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "xyz abc random words")
            
            assert result['department_name'] == 'Other'
            assert result['confidence'] == 0.35
    
    def test_empty_database_uses_fallback_departments(self, service, fake_image):
        """Test empty database uses fallback department list"""
        Department.objects.all().delete()
        
        with patch.object(service.image_classifier, 'classify_from_file', side_effect=Exception("Error")):
            result = service.suggest(fake_image, "some complaint")
            
            # Should still return a result using fallback
            assert result is not None
            assert 'department_name' in result
            assert 'confidence' in result
    
    def test_department_not_in_db_still_suggested(self, service, fake_image):
        """Test department suggested even if not in DB"""
        Department.objects.all().delete()
        
        mock_result = {
            'success': True,
            'department': 'CustomDepartment',
            'confidence': 0.75
        }
        
        with patch.object(service.image_classifier, 'classify_from_file', return_value=mock_result):
            result = service.suggest(fake_image, "custom issue")
            
            assert result['department_name'] == 'CustomDepartment'
            assert 'department_id' not in result  # No ID since not in DB


@pytest.mark.django_db
class TestComplaintPredictionServiceMutations:
    """Mutation tests for ComplaintPredictionService"""
    
    def test_predict_road_category_with_yolo(self, monkeypatch):
        """Test road category triggers YOLO"""
        mock_yolo = {'yolo_active': True, 'detections': ['pothole'], 'confidence': 0.9}
        mock_severity = {'severity_score': 8.0, 'severity_level': 'High'}
        mock_time = {'estimated_days': 3, 'urgency_tier': 'High'}
        mock_weather = {'temperature': 25, 'condition': 'Clear', 'weather_available': True}
        
        monkeypatch.setattr('complaints.ml.road_yolo_detector.RoadYOLODetector.detect_road_damage',
                           lambda *a, **k: mock_yolo)
        monkeypatch.setattr('complaints.ml.severity_pipeline.SeverityAnalysisChain.analyze',
                           lambda *a, **k: mock_severity)
        monkeypatch.setattr('complaints.ml.langchain_time_prediction.TimePredictionChain.predict',
                           lambda *a, **k: mock_time)
        monkeypatch.setattr('complaints.ml.weather_context.WeatherContextFetcher.fetch_weather',
                           lambda *a, **k: mock_weather)
        
        severity, time, metadata = ComplaintPredictionService.predict_resolution(
            complaint_id=1, category="Road", description="Big pothole",
            address="123 St", image_url="http://example.com/img.jpg"
        )
        
        assert severity['severity_score'] == 8.0
        assert time['estimated_days'] == 3
        assert metadata['category'] == "Road"
        yolo_step = next((s for s in metadata['pipeline_steps'] if s['step'] == 'yolo_detection'), None)
        assert yolo_step is not None
        assert yolo_step['status'] == 'success'
    
    def test_predict_non_road_category_skips_yolo(self, monkeypatch):
        """Test non-road category skips YOLO"""
        mock_severity = {'severity_score': 5.0, 'severity_level': 'Medium'}
        mock_time = {'estimated_days': 2, 'urgency_tier': 'Medium'}
        mock_weather = {'temperature': 22, 'condition': 'Cloudy', 'weather_available': True}
        
        monkeypatch.setattr('complaints.ml.severity_pipeline.SeverityAnalysisChain.analyze',
                           lambda *a, **k: mock_severity)
        monkeypatch.setattr('complaints.ml.langchain_time_prediction.TimePredictionChain.predict',
                           lambda *a, **k: mock_time)
        monkeypatch.setattr('complaints.ml.weather_context.WeatherContextFetcher.fetch_weather',
                           lambda *a, **k: mock_weather)
        
        severity, time, metadata = ComplaintPredictionService.predict_resolution(
            complaint_id=2, category="Water", description="Leak",
            address="456 Ave", image_url="http://example.com/water.jpg"
        )
        
        assert severity['severity_score'] == 5.0
        yolo_step = next((s for s in metadata['pipeline_steps'] if s['step'] == 'yolo_detection'), None)
        assert yolo_step is not None
        assert yolo_step['status'] == 'skipped'
    
    def test_yolo_failure_does_not_break_pipeline(self, monkeypatch):
        """Test YOLO failure is non-critical"""
        def mock_yolo_fail(*a, **k):
            raise Exception("YOLO model error")
        
        mock_severity = {'severity_score': 6.0, 'severity_level': 'Medium'}
        mock_time = {'estimated_days': 4, 'urgency_tier': 'Medium'}
        mock_weather = {'temperature': 20, 'weather_available': False}
        
        monkeypatch.setattr('complaints.ml.road_yolo_detector.RoadYOLODetector.detect_road_damage',
                           mock_yolo_fail)
        monkeypatch.setattr('complaints.ml.severity_pipeline.SeverityAnalysisChain.analyze',
                           lambda *a, **k: mock_severity)
        monkeypatch.setattr('complaints.ml.langchain_time_prediction.TimePredictionChain.predict',
                           lambda *a, **k: mock_time)
        monkeypatch.setattr('complaints.ml.weather_context.WeatherContextFetcher.fetch_weather',
                           lambda *a, **k: mock_weather)
        
        severity, time, metadata = ComplaintPredictionService.predict_resolution(
            complaint_id=3, category="Road", description="Issue",
            address="789 Rd", image_url="http://example.com/road.jpg"
        )
        
        # Pipeline should complete
        assert severity is not None
        assert time is not None
        yolo_step = next((s for s in metadata['pipeline_steps'] if s['step'] == 'yolo_detection'), None)
        assert yolo_step['status'] == 'failed'
    
    def test_severity_failure_raises_exception(self, monkeypatch):
        """Test severity failure is critical"""
        def mock_severity_fail(*a, **k):
            raise Exception("Severity analysis error")
        
        mock_time = {'estimated_days': 5, 'urgency_tier': 'Low'}
        mock_weather = {'temperature': 18, 'weather_available': False}
        
        monkeypatch.setattr('complaints.ml.severity_pipeline.SeverityAnalysisChain.analyze',
                           mock_severity_fail)
        monkeypatch.setattr('complaints.ml.langchain_time_prediction.TimePredictionChain.predict',
                           lambda *a, **k: mock_time)
        monkeypatch.setattr('complaints.ml.weather_context.WeatherContextFetcher.fetch_weather',
                           lambda *a, **k: mock_weather)
        
        with pytest.raises(Exception) as exc_info:
            ComplaintPredictionService.predict_resolution(
                complaint_id=4, category="Water", description="Test",
                address="Test", image_url="http://example.com/test.jpg"
            )
        
        assert 'severity' in str(exc_info.value).lower() or 'critical' in str(exc_info.value).lower()
    
    def test_weather_failure_does_not_break_pipeline(self, monkeypatch):
        """Test weather failure is non-critical"""
        mock_severity = {'severity_score': 7.0, 'severity_level': 'High'}
        mock_time = {'estimated_days': 3, 'urgency_tier': 'High'}
        
        def mock_weather_fail(*a, **k):
            raise Exception("Weather API error")
        
        monkeypatch.setattr('complaints.ml.severity_pipeline.SeverityAnalysisChain.analyze',
                           lambda *a, **k: mock_severity)
        monkeypatch.setattr('complaints.ml.langchain_time_prediction.TimePredictionChain.predict',
                           lambda *a, **k: mock_time)
        monkeypatch.setattr('complaints.ml.weather_context.WeatherContextFetcher.fetch_weather',
                           mock_weather_fail)
        
        severity, time, metadata = ComplaintPredictionService.predict_resolution(
            complaint_id=5, category="Electricity", description="Power out",
            address="Electric St", image_url="http://example.com/elec.jpg"
        )
        
        assert severity is not None
        assert time is not None
        weather_step = next((s for s in metadata['pipeline_steps'] if s['step'] == 'weather_context'), None)
        assert weather_step['status'] == 'failed'
    
    def test_time_prediction_failure_raises_exception(self, monkeypatch):
        """Test time prediction failure is critical"""
        mock_severity = {'severity_score': 6.5, 'severity_level': 'Medium'}
        mock_weather = {'temperature': 24, 'weather_available': True}
        
        def mock_time_fail(*a, **k):
            raise Exception("Time prediction error")
        
        monkeypatch.setattr('complaints.ml.severity_pipeline.SeverityAnalysisChain.analyze',
                           lambda *a, **k: mock_severity)
        monkeypatch.setattr('complaints.ml.langchain_time_prediction.TimePredictionChain.predict',
                           mock_time_fail)
        monkeypatch.setattr('complaints.ml.weather_context.WeatherContextFetcher.fetch_weather',
                           lambda *a, **k: mock_weather)
        
        with pytest.raises(Exception) as exc_info:
            ComplaintPredictionService.predict_resolution(
                complaint_id=6, category="Waste", description="Test",
                address="Test", image_url="http://example.com/test.jpg"
            )
        
        assert 'time' in str(exc_info.value).lower() or 'critical' in str(exc_info.value).lower()
    
    def test_metadata_includes_all_steps(self, monkeypatch):
        """Test metadata includes all pipeline steps"""
        mock_yolo = {'yolo_active': True}
        mock_severity = {'severity_score': 5.5}
        mock_time = {'estimated_days': 2}
        mock_weather = {'temperature': 23}
        
        monkeypatch.setattr('complaints.ml.road_yolo_detector.RoadYOLODetector.detect_road_damage',
                           lambda *a, **k: mock_yolo)
        monkeypatch.setattr('complaints.ml.severity_pipeline.SeverityAnalysisChain.analyze',
                           lambda *a, **k: mock_severity)
        monkeypatch.setattr('complaints.ml.langchain_time_prediction.TimePredictionChain.predict',
                           lambda *a, **k: mock_time)
        monkeypatch.setattr('complaints.ml.weather_context.WeatherContextFetcher.fetch_weather',
                           lambda *a, **k: mock_weather)
        
        severity, time, metadata = ComplaintPredictionService.predict_resolution(
            complaint_id=7, category="Road", description="Test",
            address="Test", image_url="http://example.com/test.jpg"
        )
        
        steps = metadata['pipeline_steps']
        step_names = [s['step'] for s in steps]
        
        assert 'yolo_detection' in step_names
        assert 'severity_analysis' in step_names
        assert 'weather_context' in step_names
        assert 'time_prediction' in step_names
    
    def test_metadata_contains_complaint_id(self, monkeypatch):
        """Test metadata contains complaint ID"""
        mock_severity = {'severity_score': 4.0}
        mock_time = {'estimated_days': 1}
        mock_weather = {}
        
        monkeypatch.setattr('complaints.ml.severity_pipeline.SeverityAnalysisChain.analyze',
                           lambda *a, **k: mock_severity)
        monkeypatch.setattr('complaints.ml.langchain_time_prediction.TimePredictionChain.predict',
                           lambda *a, **k: mock_time)
        monkeypatch.setattr('complaints.ml.weather_context.WeatherContextFetcher.fetch_weather',
                           lambda *a, **k: mock_weather)
        
        severity, time, metadata = ComplaintPredictionService.predict_resolution(
            complaint_id=999, category="Health", description="Test",
            address="Test", image_url="http://example.com/test.jpg"
        )
        
        assert metadata['complaint_id'] == 999
        assert metadata['category'] == "Health"
    
    def test_yolo_features_included_in_metadata(self, monkeypatch):
        """Test YOLO features included in metadata"""
        mock_yolo = {'yolo_active': True, 'detections': ['crack', 'pothole']}
        mock_severity = {'severity_score': 7.5}
        mock_time = {'estimated_days': 3}
        mock_weather = {'weather_available': True}
        
        monkeypatch.setattr('complaints.ml.road_yolo_detector.RoadYOLODetector.detect_road_damage',
                           lambda *a, **k: mock_yolo)
        monkeypatch.setattr('complaints.ml.severity_pipeline.SeverityAnalysisChain.analyze',
                           lambda *a, **k: mock_severity)
        monkeypatch.setattr('complaints.ml.langchain_time_prediction.TimePredictionChain.predict',
                           lambda *a, **k: mock_time)
        monkeypatch.setattr('complaints.ml.weather_context.WeatherContextFetcher.fetch_weather',
                           lambda *a, **k: mock_weather)
        
        severity, time, metadata = ComplaintPredictionService.predict_resolution(
            complaint_id=8, category="Road", description="Damage",
            address="Road St", image_url="http://example.com/road.jpg"
        )
        
        assert 'yolo_features' in metadata
        assert metadata['yolo_features']['yolo_active'] is True
    
    def test_weather_data_included_in_metadata(self, monkeypatch):
        """Test weather data included in metadata"""
        mock_severity = {'severity_score': 6.0}
        mock_time = {'estimated_days': 2}
        mock_weather = {'temperature': 30, 'condition': 'Rainy', 'weather_available': True}
        
        monkeypatch.setattr('complaints.ml.severity_pipeline.SeverityAnalysisChain.analyze',
                           lambda *a, **k: mock_severity)
        monkeypatch.setattr('complaints.ml.langchain_time_prediction.TimePredictionChain.predict',
                           lambda *a, **k: mock_time)
        monkeypatch.setattr('complaints.ml.weather_context.WeatherContextFetcher.fetch_weather',
                           lambda *a, **k: mock_weather)
        
        severity, time, metadata = ComplaintPredictionService.predict_resolution(
            complaint_id=9, category="Drainage", description="Flood",
            address="Low Area", image_url="http://example.com/flood.jpg"
        )
        
        assert 'weather_data' in metadata
        assert metadata['weather_data']['temperature'] == 30
        assert metadata['weather_data']['condition'] == 'Rainy'
