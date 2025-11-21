"""
Comprehensive tests for ML modules to reach 100% coverage
"""
import os
import pytest
import json
import tempfile
import requests
from unittest.mock import Mock, patch, MagicMock, mock_open
from PIL import Image
import io
import base64

from complaints.ml.road_yolo_detector import RoadYOLODetector, RDD_CLASS_NAMES, RDD_CLASS_DESCRIPTIONS
from complaints.ml.severity_pipeline import SeverityAnalysisChain
from complaints.ml.department_classifier import DepartmentImageClassifier, COMMON_DEPARTMENTS
from complaints.ml.weather_context import WeatherContextFetcher


class TestRoadYOLODetector:
    """Test RoadYOLODetector - covering all 112 statements"""
    
    @pytest.fixture
    def detector(self):
        """Reset singleton and return new instance"""
        RoadYOLODetector._instance = None
        RoadYOLODetector._model = None
        return RoadYOLODetector()
    
    @pytest.fixture
    def mock_yolo_model(self):
        """Mock YOLO model with typical responses"""
        mock = Mock()
        mock.predict = Mock()
        return mock
    
    def test_singleton_pattern(self, detector):
        """Test singleton pattern implementation"""
        detector2 = RoadYOLODetector()
        assert detector is detector2
    
    def test_load_model_not_found(self, detector):
        """Test model loading when file doesn't exist"""
        with patch.dict(os.environ, {'YOLO_MODEL_PATH': '/nonexistent/model.pt'}):
            with patch('os.path.exists', return_value=False):
                detector._load_model()
                assert detector._model is None
    
    def test_load_model_not_found_handles_gracefully(self, detector):
        """Test that missing model file is handled gracefully"""
        detector._model = None
        with patch.dict(os.environ, {'YOLO_MODEL_PATH': '/nonexistent/model.pt'}):
            with patch('os.path.exists', return_value=False):
                detector._load_model()
                # Should handle missing file gracefully
                assert detector._model is None
    
    def test_detect_non_road_category(self, detector):
        """Test detection with non-road category"""
        result = detector.detect_road_damage("http://example.com/image.jpg", "water")
        assert result['yolo_active'] is False
        assert result['reason'] == 'not_road_category'
        assert 'road' in result['message'].lower()
    
    def test_detect_model_unavailable(self, detector):
        """Test detection when model is not loaded"""
        detector._model = None
        result = detector.detect_road_damage("http://example.com/image.jpg", "road")
        assert result['yolo_active'] is False
        assert result['reason'] == 'model_unavailable'
    
    def test_detect_with_detections(self, detector):
        """Test detection with multiple damage detections"""
        # Create fake image
        img = Image.new('RGB', (640, 480), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes = img_bytes.getvalue()
        
        # Mock YOLO results
        mock_box1 = Mock()
        mock_box1.xyxy = [Mock()]
        mock_box1.xyxy[0].cpu.return_value.numpy.return_value = [100, 100, 200, 200]
        mock_box1.conf = [Mock()]
        mock_box1.conf[0].cpu.return_value.numpy.return_value = 0.85
        mock_box1.cls = [Mock()]
        mock_box1.cls[0].cpu.return_value.numpy.return_value = 4  # D20 Pothole
        
        mock_box2 = Mock()
        mock_box2.xyxy = [Mock()]
        mock_box2.xyxy[0].cpu.return_value.numpy.return_value = [300, 300, 400, 400]
        mock_box2.conf = [Mock()]
        mock_box2.conf[0].cpu.return_value.numpy.return_value = 0.75
        mock_box2.cls = [Mock()]
        mock_box2.cls[0].cpu.return_value.numpy.return_value = 0  # D00 Longitudinal Crack
        
        mock_result = Mock()
        mock_result.boxes = [mock_box1, mock_box2]
        
        mock_model = Mock()
        mock_model.predict.return_value = [mock_result]
        detector._model = mock_model
        
        with patch('requests.get') as mock_get:
            mock_get.return_value.status_code = 200
            mock_get.return_value.content = img_bytes
            mock_get.return_value.raise_for_status = Mock()
            
            with patch('PIL.Image.open', return_value=img):
                result = detector.detect_road_damage("http://example.com/image.jpg", "road")
        
        assert result['yolo_active'] is True
        assert result['num_detections'] == 2
        assert len(result['detections']) == 2
        assert len(result['damage_classes']) == 2
        assert result['avg_confidence'] > 0
        assert result['damage_proportion'] > 0
        assert result['severity_hint'] in ['low', 'moderate', 'high', 'critical']
    
    def test_detect_no_detections(self, detector):
        """Test detection with no damage found"""
        img = Image.new('RGB', (640, 480), color='blue')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes = img_bytes.getvalue()
        
        mock_result = Mock()
        mock_result.boxes = None
        
        mock_model = Mock()
        mock_model.predict.return_value = [mock_result]
        detector._model = mock_model
        
        with patch('requests.get') as mock_get:
            mock_get.return_value.status_code = 200
            mock_get.return_value.content = img_bytes
            mock_get.return_value.raise_for_status = Mock()
            
            with patch('PIL.Image.open', return_value=img):
                result = detector.detect_road_damage("http://example.com/image.jpg", "road")
        
        assert result['yolo_active'] is True
        assert result['num_detections'] == 0
        assert len(result['detections']) == 0
    
    def test_detect_request_exception(self, detector):
        """Test detection with network error"""
        mock_model = Mock()
        detector._model = mock_model
        
        with patch('requests.get', side_effect=Exception("Network error")):
            result = detector.detect_road_damage("http://example.com/image.jpg", "road")
        
        assert result['yolo_active'] is False
        assert 'error' in result
    
    def test_detect_cleanup_temp_file(self, detector):
        """Test temporary file cleanup"""
        img = Image.new('RGB', (640, 480))
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes = img_bytes.getvalue()
        
        mock_result = Mock()
        mock_result.boxes = []
        mock_model = Mock()
        mock_model.predict.return_value = [mock_result]
        detector._model = mock_model
        
        with patch('requests.get') as mock_get:
            mock_get.return_value.content = img_bytes
            mock_get.return_value.raise_for_status = Mock()
            
            with patch('tempfile.NamedTemporaryFile') as mock_temp:
                mock_file = Mock()
                mock_file.name = '/tmp/test.jpg'
                mock_temp.return_value.__enter__.return_value = mock_file
                
                with patch('PIL.Image.open', return_value=img):
                    with patch('os.path.exists', return_value=True):
                        with patch('os.unlink') as mock_unlink:
                            result = detector.detect_road_damage("http://example.com/image.jpg", "road")
                            mock_unlink.assert_called()
    
    def test_compute_severity_hint_critical(self, detector):
        """Test severity hint computation - critical"""
        hint = detector._compute_severity_hint(15, 0.4, 0.85)
        assert hint == "critical"
    
    def test_compute_severity_hint_high(self, detector):
        """Test severity hint computation - high"""
        hint = detector._compute_severity_hint(7, 0.2, 0.75)
        assert hint == "high"
    
    def test_compute_severity_hint_moderate(self, detector):
        """Test severity hint computation - moderate"""
        hint = detector._compute_severity_hint(3, 0.1, 0.6)
        assert hint == "moderate"
    
    def test_compute_severity_hint_low(self, detector):
        """Test severity hint computation - low"""
        hint = detector._compute_severity_hint(1, 0.02, 0.5)
        assert hint == "low"
    
    def test_rdd_class_names_coverage(self):
        """Test RDD class names dictionary coverage"""
        assert RDD_CLASS_NAMES[0] == 'D00'
        assert RDD_CLASS_NAMES[4] == 'D20'
        assert len(RDD_CLASS_NAMES) == 8
    
    def test_rdd_class_descriptions_coverage(self):
        """Test RDD class descriptions dictionary coverage"""
        assert 'Pothole' in RDD_CLASS_DESCRIPTIONS['D20']
        assert 'Longitudinal' in RDD_CLASS_DESCRIPTIONS['D00']
    
    def test_temp_file_cleanup_exception(self):
        """Test exception during temp file cleanup"""
        detector = RoadYOLODetector()
        img = Image.new('RGB', (640, 480))
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes = img_bytes.getvalue()
        
        mock_result = Mock()
        mock_result.boxes = []
        mock_model = Mock()
        mock_model.predict.return_value = [mock_result]
        detector._model = mock_model
        
        with patch('requests.get') as mock_get:
            mock_get.return_value.content = img_bytes
            mock_get.return_value.raise_for_status = Mock()
            
            with patch('tempfile.NamedTemporaryFile') as mock_temp:
                mock_file = Mock()
                mock_file.name = '/tmp/test.jpg'
                mock_temp.return_value.__enter__.return_value = mock_file
                
                with patch('PIL.Image.open', return_value=img):
                    with patch('os.path.exists', return_value=True):
                        with patch('os.unlink', side_effect=OSError("Permission denied")):
                            # Should not raise exception
                            result = detector.detect_road_damage("http://example.com/image.jpg", "road")
                            assert result is not None


class TestSeverityAnalysisChain:
    """Test SeverityAnalysisChain - covering all 78 statements"""
    
    @pytest.fixture
    def mock_llm(self):
        """Mock ChatGroq LLM"""
        mock = Mock()
        return mock
    
    def test_init_no_api_key(self):
        """Test initialization without API key"""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError, match="GROQ_API_KEY"):
                SeverityAnalysisChain()
    
    def test_init_with_api_key(self):
        """Test successful initialization"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.severity_pipeline.ChatGroq') as mock_groq:
                chain = SeverityAnalysisChain()
                assert chain.llm is not None
                mock_groq.assert_called_once()
    
    def test_init_with_custom_model(self):
        """Test initialization with custom model"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key', 'GROQ_MODEL': 'custom-model'}):
            with patch('complaints.ml.severity_pipeline.ChatGroq') as mock_groq:
                chain = SeverityAnalysisChain()
                call_args = mock_groq.call_args
                assert call_args[1]['model'] == 'custom-model'
    
    def test_analyze_success(self):
        """Test successful analysis"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.severity_pipeline.ChatGroq') as mock_groq:
                mock_llm = Mock()
                mock_response = Mock()
                mock_response.content = json.dumps({
                    'severity_score': 75,
                    'issue_type': 'Severe pothole',
                    'causes': ['Heavy traffic', 'Poor drainage'],
                    'safety_risk': 'High risk of vehicle damage',
                    'infrastructure_damage': 'Road surface deterioration',
                    'reasoning_summary': 'Large pothole visible'
                })
                mock_llm.invoke.return_value = mock_response
                mock_groq.return_value = mock_llm
                
                chain = SeverityAnalysisChain()
                result = chain.analyze(
                    category='road',
                    description='Big pothole',
                    address='Main St',
                    image_url='http://example.com/img.jpg'
                )
                
                assert result['severity_score'] == 75
                assert result['issue_type'] == 'Severe pothole'
                assert len(result['causes']) == 2
    
    def test_analyze_with_yolo_features(self):
        """Test analysis with YOLO features"""
        yolo_features = {
            'yolo_active': True,
            'num_detections': 3,
            'damage_proportion': 0.15,
            'avg_confidence_percent': 85.5,
            'damage_classes': [
                {'class_code': 'D20', 'description': 'Pothole', 'count': 2, 'avg_confidence': 0.85}
            ],
            'severity_hint': 'high'
        }
        
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.severity_pipeline.ChatGroq') as mock_groq:
                mock_llm = Mock()
                mock_response = Mock()
                mock_response.content = json.dumps({
                    'severity_score': 80,
                    'issue_type': 'Multiple potholes',
                    'causes': ['Wear and tear'],
                    'safety_risk': 'High',
                    'infrastructure_damage': 'Severe',
                    'reasoning_summary': 'Multiple damage detected'
                })
                mock_llm.invoke.return_value = mock_response
                mock_groq.return_value = mock_llm
                
                chain = SeverityAnalysisChain()
                result = chain.analyze(
                    category='road',
                    description='Multiple issues',
                    address='Highway 1',
                    image_url='http://example.com/img.jpg',
                    yolo_features=yolo_features
                )
                
                assert result['severity_score'] == 80
    
    def test_analyze_with_yolo_no_detections(self):
        """Test analysis with YOLO but no detections"""
        yolo_features = {
            'yolo_active': True,
            'num_detections': 0
        }
        
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.severity_pipeline.ChatGroq') as mock_groq:
                mock_llm = Mock()
                mock_response = Mock()
                mock_response.content = json.dumps({
                    'severity_score': 40,
                    'issue_type': 'Minor issue',
                    'causes': ['Unknown'],
                    'safety_risk': 'Low',
                    'infrastructure_damage': 'Minor',
                    'reasoning_summary': 'Visual inspection shows minor concern'
                })
                mock_llm.invoke.return_value = mock_response
                mock_groq.return_value = mock_llm
                
                chain = SeverityAnalysisChain()
                result = chain.analyze(
                    category='road',
                    description='Check this',
                    address='Street 1',
                    image_url='http://example.com/img.jpg',
                    yolo_features=yolo_features
                )
                
                assert result['severity_score'] == 40
    
    def test_analyze_exception_handling(self):
        """Test analysis exception handling"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.severity_pipeline.ChatGroq') as mock_groq:
                mock_llm = Mock()
                mock_llm.invoke.side_effect = Exception("API error")
                mock_groq.return_value = mock_llm
                
                chain = SeverityAnalysisChain()
                result = chain.analyze(
                    category='road',
                    description='Test',
                    address='Test St',
                    image_url='http://example.com/img.jpg'
                )
                
                assert result['severity_score'] == 50
                assert 'error' in result
                assert 'analysis failed' in result['reasoning_summary'].lower()
    
    def test_parse_analysis_response_valid_json(self):
        """Test parsing valid JSON response"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.severity_pipeline.ChatGroq'):
                chain = SeverityAnalysisChain()
                
                response = json.dumps({
                    'severity_score': 65,
                    'issue_type': 'Test issue',
                    'causes': ['Cause 1'],
                    'safety_risk': 'Medium',
                    'infrastructure_damage': 'Moderate',
                    'reasoning_summary': 'Test reasoning'
                })
                
                result = chain._parse_analysis_response(response)
                assert result['severity_score'] == 65
    
    def test_parse_analysis_response_with_markdown(self):
        """Test parsing JSON wrapped in markdown"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.severity_pipeline.ChatGroq'):
                chain = SeverityAnalysisChain()
                
                response = '''```json
{
    "severity_score": 70,
    "issue_type": "Wrapped issue",
    "causes": ["Test"],
    "safety_risk": "High",
    "infrastructure_damage": "Severe",
    "reasoning_summary": "Wrapped test"
}
```'''
                
                result = chain._parse_analysis_response(response)
                assert result['severity_score'] == 70
    
    def test_parse_analysis_response_invalid_json(self):
        """Test parsing invalid JSON"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.severity_pipeline.ChatGroq'):
                chain = SeverityAnalysisChain()
                
                response = "Not valid JSON at all"
                result = chain._parse_analysis_response(response)
                
                assert result['severity_score'] == 50
                assert 'raw_response' in result or 'error' in result


class TestDepartmentImageClassifier:
    """Test DepartmentImageClassifier - covering all 162 statements"""
    
    @pytest.fixture
    def classifier(self):
        """Reset singleton and return new instance"""
        DepartmentImageClassifier._instance = None
        instance = DepartmentImageClassifier.__new__(DepartmentImageClassifier)
        return instance
    
    def test_singleton_pattern(self, classifier):
        """Test singleton pattern"""
        DepartmentImageClassifier._instance = None
        cls1 = DepartmentImageClassifier()
        cls2 = DepartmentImageClassifier()
        assert cls1 is cls2
    
    def test_init_no_api_key(self, classifier):
        """Test initialization without API key"""
        with patch.dict(os.environ, {}, clear=True):
            classifier._initialized = False
            classifier._initialize_llm()
            assert classifier.llm is None
    
    def test_init_with_api_key(self, classifier):
        """Test initialization with API key"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq') as mock_groq:
                classifier._initialized = False
                classifier._initialize_llm()
                assert classifier.llm is not None
    
    def test_init_exception(self, classifier):
        """Test initialization with exception"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq', side_effect=Exception("Init error")):
                classifier._initialized = False
                classifier._initialize_llm()
                assert classifier.llm is None
    
    def test_classify_from_file_no_llm(self, classifier):
        """Test classification when LLM not available"""
        classifier.llm = None
        mock_file = Mock()
        
        result = classifier.classify_from_file(mock_file, "test description")
        
        assert result['success'] is False
        assert 'error' in result
        assert result['department'] is None
    
    def test_classify_from_file_success(self, classifier):
        """Test successful classification"""
        # Create a mock file object with actual image bytes
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        img_content = img_bytes.getvalue()
        
        # Mock file that returns bytes on read()
        mock_file = Mock()
        mock_file.read.return_value = img_content
        mock_file.seek = Mock()
        # Make sure it doesn't have chunks (so read() is used)
        del mock_file.chunks
        
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = 'Road'
        mock_llm.invoke.return_value = mock_response
        classifier.llm = mock_llm
        
        with patch.object(classifier, '_image_to_data_url', return_value='data:image/jpeg;base64,test'):
            with patch.object(classifier, '_parse_classification_response', return_value={'department': 'Road', 'confidence': 0.9}):
                with patch('os.path.exists', return_value=True):
                    with patch('os.unlink'):
                        result = classifier.classify_from_file(mock_file, "Pothole on road")
        
        assert result['success'] is True
    
    def test_classify_from_file_with_chunks(self, classifier):
        """Test classification with chunked file"""
        mock_file = Mock()
        mock_file.chunks.return_value = [b'chunk1', b'chunk2']
        
        mock_llm = Mock()
        mock_response = Mock()
        mock_response.content = "Water"
        mock_llm.invoke.return_value = mock_response
        classifier.llm = mock_llm
        
        with patch('tempfile.NamedTemporaryFile') as mock_temp:
            mock_temp_file = Mock()
            mock_temp_file.name = '/tmp/test.jpg'
            mock_temp_file.write = Mock()
            mock_temp.__enter__ = Mock(return_value=mock_temp_file)
            mock_temp.__exit__ = Mock(return_value=False)
            mock_temp.return_value = mock_temp
            
            with patch.object(classifier, '_image_to_data_url', return_value='data:image/jpeg;base64,test'):
                with patch.object(classifier, '_parse_classification_response', return_value={'department': 'Water'}):
                    with patch('os.path.exists', return_value=True):
                        with patch('os.unlink'):
                            result = classifier.classify_from_file(mock_file, "Water leak")
        
        assert result['success'] is True
    
    def test_classify_from_file_exception(self, classifier):
        """Test classification with exception"""
        mock_file = Mock()
        mock_file.read.side_effect = Exception("Read error")
        classifier.llm = Mock()
        
        result = classifier.classify_from_file(mock_file, "test")
        
        assert result['success'] is False
        assert 'error' in result
    
    def test_image_to_data_url(self, classifier):
        """Test image to data URL conversion"""
        img = Image.new('RGB', (100, 100), color='blue')
        
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            img.save(tmp.name)
            tmp_path = tmp.name
        
        try:
            result = classifier._image_to_data_url(tmp_path)
            assert result.startswith('data:image/jpeg;base64,')
        finally:
            os.unlink(tmp_path)
    
    def test_image_to_data_url_large_image(self, classifier):
        """Test conversion of large image (resize scenario)"""
        img = Image.new('RGB', (3000, 2000), color='green')
        
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp:
            img.save(tmp.name)
            tmp_path = tmp.name
        
        try:
            result = classifier._image_to_data_url(tmp_path)
            assert result.startswith('data:image/jpeg;base64,')
        finally:
            os.unlink(tmp_path)
    
    def test_build_classification_prompt(self, classifier):
        """Test classification prompt building"""
        prompt = classifier._build_classification_prompt("Broken pipe", COMMON_DEPARTMENTS)
        
        assert "Broken pipe" in prompt
        assert "Road" in prompt
        assert "Water" in prompt
    
    def test_build_classification_prompt_no_description(self, classifier):
        """Test prompt building without description"""
        prompt = classifier._build_classification_prompt("", COMMON_DEPARTMENTS)
        
        assert "Road" in prompt
        assert len(prompt) > 0
    
    def test_parse_classification_response_exact_match(self, classifier):
        """Test parsing with exact department match"""
        result = classifier._parse_classification_response("Road", COMMON_DEPARTMENTS)
        
        assert result['department'] == 'Road'
        assert result['confidence'] > 0
    
    def test_parse_classification_response_case_insensitive(self, classifier):
        """Test parsing with case-insensitive match"""
        result = classifier._parse_classification_response("WATER", COMMON_DEPARTMENTS)
        
        assert result['department'] == 'Water'
    
    def test_parse_classification_response_partial_match(self, classifier):
        """Test parsing with partial match"""
        result = classifier._parse_classification_response("The issue is related to Street Lights maintenance", COMMON_DEPARTMENTS)
        
        assert result['department'] == 'Street Lights'
    
    def test_parse_classification_response_no_match(self, classifier):
        """Test parsing with no match"""
        result = classifier._parse_classification_response("Something completely unrelated", COMMON_DEPARTMENTS)
        
        assert result['department'] == 'Other'
        assert result['confidence'] < 0.5


class TestWeatherContextFetcher:
    """Test WeatherContextFetcher - covering all 32 statements"""
    
    @pytest.fixture
    def fetcher(self):
        """Create fetcher instance"""
        return WeatherContextFetcher()
    
    def test_init_no_api_key(self):
        """Test initialization without API key"""
        with patch.dict(os.environ, {}, clear=True):
            fetcher = WeatherContextFetcher()
            assert fetcher.api_key is None
    
    def test_init_with_api_key(self):
        """Test initialization with API key"""
        with patch.dict(os.environ, {'WEATHER_API_KEY': 'test-key'}):
            fetcher = WeatherContextFetcher()
            assert fetcher.api_key == 'test-key'
    
    def test_fetch_weather_no_api_key(self, fetcher):
        """Test fetching weather without API key"""
        fetcher.api_key = None
        
        result = fetcher.fetch_weather("Test Address")
        
        assert result['weather_available'] is False
        assert 'not configured' in result['message']
    
    def test_fetch_weather_success(self, fetcher):
        """Test successful weather fetch"""
        fetcher.api_key = 'test-key'
        
        mock_response_data = {
            'current': {
                'condition': {'text': 'Sunny'},
                'temp_c': 25,
                'humidity': 60,
                'wind_kph': 10,
                'precip_mm': 0,
                'cloud': 20
            },
            'forecast': {
                'forecastday': [
                    {
                        'date': '2024-01-01',
                        'day': {
                            'maxtemp_c': 28,
                            'mintemp_c': 18,
                            'condition': {'text': 'Sunny'},
                            'totalprecip_mm': 0,
                            'avghumidity': 55,
                            'maxwind_kph': 15
                        }
                    }
                ]
            },
            'location': {'name': 'Test City'}
        }
        
        with patch('requests.get') as mock_get:
            mock_get.return_value.json.return_value = mock_response_data
            mock_get.return_value.raise_for_status = Mock()
            
            result = fetcher.fetch_weather("Test City")
        
        assert result['weather_available'] is True
        assert result['current']['temp_c'] == 25
        assert result['current']['condition'] == 'Sunny'
        assert len(result['forecast']) == 1
        assert result['location'] == 'Test City'
    
    def test_fetch_weather_request_exception(self, fetcher):
        """Test weather fetch with request exception"""
        fetcher.api_key = 'test-key'
        
        with patch('requests.get', side_effect=Exception("Network error")):
            result = fetcher.fetch_weather("Test City")
        
        assert result['weather_available'] is False
        assert 'error' in result['message'].lower()
    
    def test_fetch_weather_api_error(self, fetcher):
        """Test weather fetch with API error"""
        fetcher.api_key = 'test-key'
        
        with patch('requests.get') as mock_get:
            mock_get.return_value.raise_for_status.side_effect = Exception("API error")
            
            result = fetcher.fetch_weather("Test City")
        
        assert result['weather_available'] is False


class TestSeverityPipelineMissingFields:
    """Test severity pipeline with missing fields in response"""
    
    def test_parse_response_with_missing_field(self):
        """Test parsing response with missing required field"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.severity_pipeline.ChatGroq'):
                chain = SeverityAnalysisChain()
                
                # Response missing 'causes' field
                response = '''```json
{
    "severity_score": 75,
    "issue_type": "Road Damage",
    "safety_risk": "High",
    "infrastructure_damage": "Moderate",
    "reasoning_summary": "Test"
}
```'''
                
                result = chain._parse_analysis_response(response)
                assert 'causes' in result
                assert result['causes'] == "Unknown - parsing error"


class TestWeatherContextExceptions:
    """Test weather context request exception handling"""
    
    def test_fetch_weather_request_exception(self):
        """Test weather fetch with request exception"""
        fetcher = WeatherContextFetcher()
        fetcher.api_key = 'test-key'
        
        with patch('requests.get') as mock_get:
            mock_get.side_effect = requests.exceptions.RequestException("Network error")
            
            result = fetcher.fetch_weather("Test City")
        
        assert result['weather_available'] is False
        assert 'Network error' in result['message']


class TestTimePredictionChain:
    """Comprehensive tests for TimePredictionChain to reach 100% coverage"""
    
    def test_init_without_api_key(self):
        """Test initialization without GROQ_API_KEY raises ValueError"""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError, match="GROQ_API_KEY"):
                from complaints.ml.langchain_time_prediction import TimePredictionChain
                TimePredictionChain()
    
    def test_init_with_api_key(self):
        """Test successful initialization with API key"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.langchain_time_prediction.ChatGroq'):
                from complaints.ml.langchain_time_prediction import TimePredictionChain
                chain = TimePredictionChain()
                assert chain.llm is not None
    
    def test_predict_success(self):
        """Test successful prediction with valid response"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.langchain_time_prediction.ChatGroq') as mock_groq:
                from complaints.ml.langchain_time_prediction import TimePredictionChain
                
                # Mock LLM response
                mock_llm = Mock()
                mock_response = Mock()
                mock_response.content = json.dumps({
                    'estimated_hours': 48,
                    'estimated_days': 2.0,
                    'urgency_tier': 'high',
                    'key_factors': ['Safety risk', 'High severity'],
                    'weather_impact': 'Rain may delay work',
                    'explanation': 'Critical pothole requiring immediate attention'
                })
                mock_llm.invoke.return_value = mock_response
                mock_groq.return_value = mock_llm
                
                chain = TimePredictionChain()
                
                severity_analysis = {
                    'severity_score': 75,
                    'issue_type': 'Road Damage',
                    'safety_risk': 'High',
                    'infrastructure_damage': 'Moderate',
                    'reasoning_summary': 'Large pothole'
                }
                
                yolo_features = {
                    'yolo_active': True,
                    'num_detections': 3,
                    'damage_proportion': 0.15,
                    'avg_confidence_percent': 85.0,
                    'severity_hint': 'high',
                    'damage_classes': [
                        {'description': 'Pothole', 'count': 2},
                        {'description': 'Crack', 'count': 1}
                    ]
                }
                
                weather_data = {
                    'weather_available': True,
                    'current': {
                        'condition': 'Rainy',
                        'temp_c': 28,
                        'precip_mm': 10,
                        'humidity': 85,
                        'wind_kph': 15
                    },
                    'forecast': [
                        {
                            'date': '2025-11-21',
                            'condition': 'Rainy',
                            'min_temp_c': 24,
                            'max_temp_c': 30,
                            'rain_mm': 25
                        },
                        {
                            'date': '2025-11-22',
                            'condition': 'Cloudy',
                            'min_temp_c': 23,
                            'max_temp_c': 29,
                            'rain_mm': 5
                        }
                    ]
                }
                
                result = chain.predict(severity_analysis, yolo_features, weather_data)
                
                assert result['estimated_hours'] == 48
                assert result['estimated_days'] == 2.0
                assert result['urgency_tier'] == 'high'
                assert len(result['key_factors']) > 0
    
    def test_predict_with_markdown_response(self):
        """Test parsing LLM response with markdown code blocks"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.langchain_time_prediction.ChatGroq') as mock_groq:
                from complaints.ml.langchain_time_prediction import TimePredictionChain
                
                mock_llm = Mock()
                mock_response = Mock()
                mock_response.content = '''```json
{
    "estimated_hours": 72,
    "estimated_days": 3.0,
    "urgency_tier": "medium",
    "key_factors": ["Weather", "Resources"],
    "weather_impact": "Moderate delay expected",
    "explanation": "Standard repair timeline"
}
```'''
                mock_llm.invoke.return_value = mock_response
                mock_groq.return_value = mock_llm
                
                chain = TimePredictionChain()
                result = chain.predict({'severity_score': 50}, None, {'weather_available': False})
                
                assert result['estimated_hours'] == 72
                assert result['estimated_days'] == 3.0
    
    def test_predict_with_missing_fields(self):
        """Test parsing response with missing required fields"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.langchain_time_prediction.ChatGroq') as mock_groq:
                from complaints.ml.langchain_time_prediction import TimePredictionChain
                
                mock_llm = Mock()
                mock_response = Mock()
                # Missing key_factors and weather_impact
                mock_response.content = json.dumps({
                    'estimated_hours': 100,
                    'estimated_days': 4.2,
                    'urgency_tier': 'low',
                    'explanation': 'Minor issue'
                })
                mock_llm.invoke.return_value = mock_response
                mock_groq.return_value = mock_llm
                
                chain = TimePredictionChain()
                result = chain.predict({'severity_score': 30}, None, {'weather_available': False})
                
                assert 'key_factors' in result
                assert 'weather_impact' in result
                assert result['key_factors'] == "Unknown - parsing error"
    
    def test_predict_with_invalid_json(self):
        """Test fallback when LLM returns invalid JSON"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.langchain_time_prediction.ChatGroq') as mock_groq:
                from complaints.ml.langchain_time_prediction import TimePredictionChain
                
                mock_llm = Mock()
                mock_response = Mock()
                mock_response.content = "This is not valid JSON at all"
                mock_llm.invoke.return_value = mock_response
                mock_groq.return_value = mock_llm
                
                chain = TimePredictionChain()
                result = chain.predict({'severity_score': 50}, None, {'weather_available': False})
                
                # Should return fallback prediction
                assert result['estimated_hours'] == 48
                assert 'Parsing error' in str(result)
    
    def test_predict_exception_fallback(self):
        """Test fallback prediction when LLM invoke fails"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.langchain_time_prediction.ChatGroq') as mock_groq:
                from complaints.ml.langchain_time_prediction import TimePredictionChain
                
                mock_llm = Mock()
                mock_llm.invoke.side_effect = Exception("LLM service error")
                mock_groq.return_value = mock_llm
                
                chain = TimePredictionChain()
                result = chain.predict({'severity_score': 85}, None, {'weather_available': False})
                
                # Should use fallback based on severity
                assert result['urgency_tier'] == 'critical'
                assert result['estimated_hours'] == 24
    
    def test_fallback_prediction_critical(self):
        """Test fallback for critical severity (>=80)"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.langchain_time_prediction.ChatGroq'):
                from complaints.ml.langchain_time_prediction import TimePredictionChain
                chain = TimePredictionChain()
                
                result = chain._fallback_prediction({'severity_score': 90})
                
                assert result['urgency_tier'] == 'critical'
                assert result['estimated_hours'] == 24
                assert result['estimated_days'] == 1.0
    
    def test_fallback_prediction_high(self):
        """Test fallback for high severity (60-79)"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.langchain_time_prediction.ChatGroq'):
                from complaints.ml.langchain_time_prediction import TimePredictionChain
                chain = TimePredictionChain()
                
                result = chain._fallback_prediction({'severity_score': 70})
                
                assert result['urgency_tier'] == 'high'
                assert result['estimated_hours'] == 72
                assert result['estimated_days'] == 3.0
    
    def test_fallback_prediction_medium(self):
        """Test fallback for medium severity (40-59)"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.langchain_time_prediction.ChatGroq'):
                from complaints.ml.langchain_time_prediction import TimePredictionChain
                chain = TimePredictionChain()
                
                result = chain._fallback_prediction({'severity_score': 50})
                
                assert result['urgency_tier'] == 'medium'
                assert result['estimated_hours'] == 168
                assert result['estimated_days'] == 7.0
    
    def test_fallback_prediction_low(self):
        """Test fallback for low severity (<40)"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.langchain_time_prediction.ChatGroq'):
                from complaints.ml.langchain_time_prediction import TimePredictionChain
                chain = TimePredictionChain()
                
                result = chain._fallback_prediction({'severity_score': 25})
                
                assert result['urgency_tier'] == 'low'
                assert result['estimated_hours'] == 720
                assert result['estimated_days'] == 30.0
    
    def test_build_prompt_without_yolo(self):
        """Test prompt building without YOLO features"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.langchain_time_prediction.ChatGroq'):
                from complaints.ml.langchain_time_prediction import TimePredictionChain
                chain = TimePredictionChain()
                
                severity_analysis = {'severity_score': 60, 'issue_type': 'Road'}
                weather_data = {'weather_available': False}
                
                prompt = chain._build_prediction_prompt(severity_analysis, None, weather_data)
                
                assert 'Severity Score: 60' in prompt
                assert 'YOLO' not in prompt or 'SECONDARY' not in prompt
                assert 'Weather data unavailable' in prompt
    
    def test_build_prompt_with_yolo_and_weather(self):
        """Test prompt building with all features"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.langchain_time_prediction.ChatGroq'):
                from complaints.ml.langchain_time_prediction import TimePredictionChain
                chain = TimePredictionChain()
                
                severity_analysis = {
                    'severity_score': 75,
                    'issue_type': 'Pothole',
                    'safety_risk': 'High',
                    'infrastructure_damage': 'Severe',
                    'reasoning_summary': 'Large pothole'
                }
                
                yolo_features = {
                    'yolo_active': True,
                    'num_detections': 5,
                    'damage_proportion': 0.25,
                    'avg_confidence_percent': 90.0,
                    'severity_hint': 'critical',
                    'damage_classes': [
                        {'description': 'Pothole - D20', 'count': 3},
                        {'description': 'Crack - D00', 'count': 2}
                    ]
                }
                
                weather_data = {
                    'weather_available': True,
                    'current': {
                        'condition': 'Heavy Rain',
                        'temp_c': 25,
                        'precip_mm': 50,
                        'humidity': 95,
                        'wind_kph': 30
                    },
                    'forecast': [
                        {'date': '2025-11-21', 'condition': 'Rainy', 'min_temp_c': 22, 'max_temp_c': 28, 'rain_mm': 30},
                        {'date': '2025-11-22', 'condition': 'Rainy', 'min_temp_c': 21, 'max_temp_c': 27, 'rain_mm': 25},
                        {'date': '2025-11-23', 'condition': 'Cloudy', 'min_temp_c': 23, 'max_temp_c': 29, 'rain_mm': 5},
                    ]
                }
                
                prompt = chain._build_prediction_prompt(severity_analysis, yolo_features, weather_data)
                
                assert 'Severity Score: 75' in prompt
                assert 'Number of detections: 5' in prompt
                assert 'Pothole - D20' in prompt
                assert 'Heavy Rain' in prompt
                assert 'Rainy days' in prompt
                assert 'INDIAN MUNICIPAL CONTEXT' in prompt
    
    def test_parse_prediction_with_invalid_urgency_tier(self):
        """Test parsing with invalid urgency tier defaults to medium"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.langchain_time_prediction.ChatGroq'):
                from complaints.ml.langchain_time_prediction import TimePredictionChain
                chain = TimePredictionChain()
                
                response = json.dumps({
                    'estimated_hours': 50,
                    'estimated_days': 2.0,
                    'urgency_tier': 'super_critical',  # Invalid tier
                    'key_factors': ['test'],
                    'weather_impact': 'none',
                    'explanation': 'test'
                })
                
                result = chain._parse_prediction_response(response)
                
                assert result['urgency_tier'] == 'medium'  # Should default to medium
    
    def test_parse_prediction_sanitizes_numeric_fields(self):
        """Test parsing sanitizes numeric fields to valid ranges"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.langchain_time_prediction.ChatGroq'):
                from complaints.ml.langchain_time_prediction import TimePredictionChain
                chain = TimePredictionChain()
                
                response = json.dumps({
                    'estimated_hours': -10,  # Negative
                    'estimated_days': 0.0,  # Zero
                    'urgency_tier': 'high',
                    'key_factors': ['test'],
                    'weather_impact': 'none',
                    'explanation': 'test'
                })
                
                result = chain._parse_prediction_response(response)
                
                assert result['estimated_hours'] >= 1  # Should be at least 1
                assert result['estimated_days'] >= 0.1  # Should be at least 0.1


class TestDepartmentImageClassifier:
    """Comprehensive tests for DepartmentImageClassifier to reach 100% coverage"""
    
    def test_init_without_groq_api_key(self):
        """Test initialization without GROQ_API_KEY - lines 54-56"""
        with patch.dict(os.environ, {}, clear=True):
            from complaints.ml.department_classifier import DepartmentImageClassifier
            
            # Force new instance
            DepartmentImageClassifier._instance = None
            
            classifier = DepartmentImageClassifier()
            assert classifier.llm is None
    
    def test_init_with_llm_exception(self):
        """Test LLM initialization exception handling - lines 66-68"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq', side_effect=Exception("LLM init failed")):
                from complaints.ml.department_classifier import DepartmentImageClassifier
                
                DepartmentImageClassifier._instance = None
                
                classifier = DepartmentImageClassifier()
                assert classifier.llm is None
    
    def test_classify_with_no_llm(self):
        """Test classification when LLM is not available - line 78"""
        with patch.dict(os.environ, {}, clear=True):
            from complaints.ml.department_classifier import DepartmentImageClassifier
            
            DepartmentImageClassifier._instance = None
            
            classifier = DepartmentImageClassifier()
            
            img = Image.new('RGB', (50, 50))
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='JPEG')
            img_bytes.seek(0)
            
            result = classifier.classify_from_file(img_bytes, "test")
            
            assert result['success'] is False
            assert result['error'] == 'LLM classifier not available'
            assert result['department'] is None
    
    def test_image_to_data_url_grayscale_mode(self):
        """Test grayscale (L) image conversion - line 163"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq'):
                from complaints.ml.department_classifier import DepartmentImageClassifier
                
                classifier = DepartmentImageClassifier()
                
                # Create grayscale image
                with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
                    temp_path = f.name
                    gray_img = Image.new('L', (100, 100), color=128)
                    gray_img.save(temp_path, 'JPEG')
                
                try:
                    data_url = classifier._image_to_data_url(temp_path)
                    assert data_url.startswith('data:image/jpeg;base64,')
                finally:
                    os.unlink(temp_path)
    
    def test_image_to_data_url_large_image_resize(self):
        """Test resizing large images - line 168"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq'):
                from complaints.ml.department_classifier import DepartmentImageClassifier
                
                classifier = DepartmentImageClassifier()
                
                # Create large image (>1024px)
                with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as f:
                    temp_path = f.name
                    large_img = Image.new('RGB', (2048, 2048), color='red')
                    large_img.save(temp_path, 'JPEG')
                
                try:
                    data_url = classifier._image_to_data_url(temp_path)
                    assert data_url.startswith('data:image/jpeg;base64,')
                finally:
                    os.unlink(temp_path)
    
    def test_classify_seek_exception(self):
        """Test handling of file seek() exceptions - lines 95-96"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            from complaints.ml.department_classifier import DepartmentImageClassifier
            
            # Force new instance
            DepartmentImageClassifier._instance = None
            
            with patch('complaints.ml.department_classifier.ChatGroq') as mock_groq:
                # Mock LLM response
                mock_llm = Mock()
                mock_response = Mock()
                mock_response.content = json.dumps({'department': 'Road', 'confidence': 0.8})
                mock_llm.invoke.return_value = mock_response
                mock_groq.return_value = mock_llm
                
                classifier = DepartmentImageClassifier()
                
                # Create a valid image in BytesIO that has seek() raising OSError
                img = Image.new('RGB', (100, 100), color='red')
                img_bytes = io.BytesIO()
                img.save(img_bytes, format='JPEG')
                img_bytes.seek(0)
                
                # Wrap in another BytesIO and patch seek
                class MockFile(io.BytesIO):
                    def __init__(self, data):
                        super().__init__(data)
                    
                    def seek(self, pos):
                        raise OSError("Cannot seek")
                
                mock_file = MockFile(img_bytes.getvalue())
                
                result = classifier.classify_from_file(mock_file, "road damage")
                
                assert result['success'] is True
                assert result['department'] == 'Road'
    
    def test_classify_with_chunks_method(self):
        """Test handling file with chunks() method - lines 99-100"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            from complaints.ml.department_classifier import DepartmentImageClassifier
            
            # Force a new instance
            DepartmentImageClassifier._instance = None
            
            with patch('complaints.ml.department_classifier.ChatGroq') as mock_groq:
                mock_llm = Mock()
                mock_response = Mock()
                mock_response.content = json.dumps({'department': 'Water', 'confidence': 0.9})
                mock_llm.invoke.return_value = mock_response
                mock_groq.return_value = mock_llm
                
                classifier = DepartmentImageClassifier()
                
                # Create a valid image in bytes
                img = Image.new('RGB', (50, 50), color='blue')
                img_bytes = io.BytesIO()
                img.save(img_bytes, format='JPEG')
                img_data = img_bytes.getvalue()
                
                # Create Django-like file object with chunks() method
                class DjangoFile:
                    def __init__(self, data):
                        self.data = data
                    
                    def chunks(self):
                        chunk_size = len(self.data) // 2
                        return [self.data[:chunk_size], self.data[chunk_size:]]
                
                django_file = DjangoFile(img_data)
                
                result = classifier.classify_from_file(django_file, "water leak")
                
                assert result['success'] is True
                assert result['department'] == 'Water'
    
    def test_cleanup_temp_file_exception(self):
        """Test handling exceptions during temp file cleanup - lines 143-144"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq') as mock_groq:
                from complaints.ml.department_classifier import DepartmentImageClassifier
                
                mock_llm = Mock()
                mock_response = Mock()
                mock_response.content = json.dumps({'department': 'Waste', 'confidence': 0.7})
                mock_llm.invoke.return_value = mock_response
                mock_groq.return_value = mock_llm
                
                classifier = DepartmentImageClassifier()
                
                # Create a valid image
                img = Image.new('RGB', (50, 50), color='green')
                img_bytes = io.BytesIO()
                img.save(img_bytes, format='JPEG')
                img_bytes.seek(0)
                
                with patch('os.unlink', side_effect=PermissionError("Cannot delete file")):
                    result = classifier.classify_from_file(img_bytes, "garbage")
                    
                    assert result['success'] is True
    
    def test_image_to_data_url_rgba_mode(self):
        """Test RGBA image conversion - lines 156-161"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq'):
                from complaints.ml.department_classifier import DepartmentImageClassifier
                
                classifier = DepartmentImageClassifier()
                
                # Create temporary RGBA image
                with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as f:
                    temp_path = f.name
                    rgba_img = Image.new('RGBA', (100, 100), (255, 0, 0, 128))
                    rgba_img.save(temp_path, 'PNG')
                
                try:
                    data_url = classifier._image_to_data_url(temp_path)
                    assert data_url.startswith('data:image/jpeg;base64,')
                finally:
                    os.unlink(temp_path)
    
    def test_image_to_data_url_palette_mode(self):
        """Test palette (P) mode image conversion - lines 156-161, 163"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq'):
                from complaints.ml.department_classifier import DepartmentImageClassifier
                
                classifier = DepartmentImageClassifier()
                
                # Create temporary P mode image with proper palette
                with tempfile.NamedTemporaryFile(suffix='.gif', delete=False) as f:
                    temp_path = f.name
                    p_img = Image.new('P', (100, 100))
                    # Create a proper palette with 256 colors (values 0-255 only)
                    palette = []
                    for i in range(256):
                        palette.extend([i % 256, (i * 2) % 256, (i * 3) % 256])  # R, G, B
                    p_img.putpalette(palette)
                    p_img.save(temp_path, 'GIF')
                
                try:
                    data_url = classifier._image_to_data_url(temp_path)
                    assert data_url.startswith('data:image/jpeg;base64,')
                finally:
                    os.unlink(temp_path)
    
    def test_parse_response_normalize_dept_none(self):
        """Test _normalize_dept with None input - line 246"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq'):
                from complaints.ml.department_classifier import DepartmentImageClassifier, COMMON_DEPARTMENTS
                
                classifier = DepartmentImageClassifier()
                
                # Test with None response
                result = classifier._parse_classification_response(None, COMMON_DEPARTMENTS)
                assert result['department'] == 'Other'
    
    def test_parse_response_partial_match(self):
        """Test _normalize_dept with partial department name match - lines 251-254"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq'):
                from complaints.ml.department_classifier import DepartmentImageClassifier, COMMON_DEPARTMENTS
                
                classifier = DepartmentImageClassifier()
                
                # Test with partial match (e.g., "roads" should match "Road")
                response = json.dumps({'department': 'roads', 'confidence': 0.75})
                result = classifier._parse_classification_response(response, COMMON_DEPARTMENTS)
                
                assert result['department'] in COMMON_DEPARTMENTS
    
    def test_parse_response_regex_fallback(self):
        """Test regex fallback JSON extraction - lines 264, 275-277, 282-286"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq'):
                from complaints.ml.department_classifier import DepartmentImageClassifier, COMMON_DEPARTMENTS
                
                classifier = DepartmentImageClassifier()
                
                # Test response where first/last brace method fails but regex works
                response = "Here's the result: { invalid json before } {\"department\": \"Water\", \"confidence\": 0.85}"
                result = classifier._parse_classification_response(response, COMMON_DEPARTMENTS)
                
                assert result['department'] == 'Water'
    
    def test_parse_response_text_extraction_with_confidence(self):
        """Test text extraction fallback with confidence - lines 299-304"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq'):
                from complaints.ml.department_classifier import DepartmentImageClassifier, COMMON_DEPARTMENTS
                
                classifier = DepartmentImageClassifier()
                
                # Completely unparseable JSON but contains department name and confidence
                response = "The issue is related to Electricity problems with confidence 0.72"
                result = classifier._parse_classification_response(response, COMMON_DEPARTMENTS)
                
                assert result['department'] == 'Electricity'
                # Confidence should be extracted from text
                assert 0.0 <= result['confidence'] <= 1.0
    
    def test_parse_response_confidence_out_of_range(self):
        """Test confidence value sanitization when out of range - lines 299-304"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq'):
                from complaints.ml.department_classifier import DepartmentImageClassifier, COMMON_DEPARTMENTS
                
                classifier = DepartmentImageClassifier()
                
                # Text with confidence > 1.0 (should be ignored)
                response = "Road issue with confidence 5.5"
                result = classifier._parse_classification_response(response, COMMON_DEPARTMENTS)
                
                assert result['confidence'] <= 1.0
    
    def test_parse_response_invalid_confidence_type(self):
        """Test handling of invalid confidence type in JSON - lines 315-318"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq'):
                from complaints.ml.department_classifier import DepartmentImageClassifier, COMMON_DEPARTMENTS
                
                classifier = DepartmentImageClassifier()
                
                # Valid JSON but confidence is string instead of number
                response = json.dumps({'department': 'Fire', 'confidence': 'high'})
                result = classifier._parse_classification_response(response, COMMON_DEPARTMENTS)
                
                assert result['department'] in COMMON_DEPARTMENTS
                assert result['confidence'] == 0.45  # Default fallback
    
    def test_parse_response_unmatched_department(self):
        """Test handling when LLM suggests invalid department - lines 325-327"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq'):
                from complaints.ml.department_classifier import DepartmentImageClassifier, COMMON_DEPARTMENTS
                
                classifier = DepartmentImageClassifier()
                
                # Department not in the available list
                response = json.dumps({'department': 'Nuclear Safety', 'confidence': 0.9})
                result = classifier._parse_classification_response(response, COMMON_DEPARTMENTS)
                
                assert result['department'] == 'Other'
                # Confidence should be reduced
                assert result['confidence'] < 0.9
    
    def test_parse_response_empty_candidate_normalization(self):
        """Test _normalize_dept with empty/None candidate - line 246"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq'):
                from complaints.ml.department_classifier import DepartmentImageClassifier, COMMON_DEPARTMENTS
                
                classifier = DepartmentImageClassifier()
                
                # Response with empty department string
                response = json.dumps({'department': '', 'confidence': 0.5})
                result = classifier._parse_classification_response(response, COMMON_DEPARTMENTS)
                
                assert result['department'] == 'Other'
    
    def test_parse_response_markdown_fence_with_json(self):
        """Test response with markdown code fence - line 264"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq'):
                from complaints.ml.department_classifier import DepartmentImageClassifier, COMMON_DEPARTMENTS
                
                classifier = DepartmentImageClassifier()
                
                # Response wrapped in markdown
                response = """```json
{
  "department": "Drainage",
  "confidence": 0.82
}
```"""
                result = classifier._parse_classification_response(response, COMMON_DEPARTMENTS)
                
                assert result['department'] == 'Drainage'
                assert result['confidence'] == 0.82
    
    def test_parse_response_json_with_extra_text(self):
        """Test JSON extraction when embedded in text - lines 277, 282-284"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq'):
                from complaints.ml.department_classifier import DepartmentImageClassifier, COMMON_DEPARTMENTS
                
                classifier = DepartmentImageClassifier()
                
                # JSON embedded in explanatory text
                response = """Based on my analysis, here is the classification:
{
  "department": "Traffic",
  "confidence": 0.77
}
This is due to the traffic signal being visible."""
                
                result = classifier._parse_classification_response(response, COMMON_DEPARTMENTS)
                
                assert result['department'] == 'Traffic'
                assert result['confidence'] == 0.77
    
    def test_parse_response_text_fallback_no_department(self):
        """Test text extraction when no department found - lines 303-304"""
        with patch.dict(os.environ, {'GROQ_API_KEY': 'test-key'}):
            with patch('complaints.ml.department_classifier.ChatGroq'):
                from complaints.ml.department_classifier import DepartmentImageClassifier, COMMON_DEPARTMENTS
                
                classifier = DepartmentImageClassifier()
                
                # Completely unparseable with no recognizable department
                response = "The image shows something but I cannot classify it properly"
                result = classifier._parse_classification_response(response, COMMON_DEPARTMENTS)
                
                assert result['department'] == 'Other'
                assert 0.0 <= result['confidence'] <= 1.0


class TestCommonDepartments:
    """Test COMMON_DEPARTMENTS constant"""
    
    def test_common_departments_list(self):
        """Test COMMON_DEPARTMENTS contains expected departments"""
        assert "Road" in COMMON_DEPARTMENTS
        assert "Water" in COMMON_DEPARTMENTS
        assert "Waste" in COMMON_DEPARTMENTS
        assert "Electricity" in COMMON_DEPARTMENTS
        assert "Other" in COMMON_DEPARTMENTS
        assert len(COMMON_DEPARTMENTS) >= 10

