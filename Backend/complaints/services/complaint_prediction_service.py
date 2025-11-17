"""
Complaint Prediction Service - Orchestration Layer

Coordinates the full ML inference pipeline:
1. YOLO detection (if road category)
2. Severity analysis (multimodal LLM - PRIMARY)
3. Weather context
4. Time prediction

This service provides a single entry point for complaint resolution prediction.
"""

import logging
from typing import Dict, Tuple, Optional

from complaints.ml.road_yolo_detector import RoadYOLODetector
from complaints.ml.severity_pipeline import SeverityAnalysisChain
from complaints.ml.weather_context import WeatherContextFetcher
from complaints.ml.langchain_time_prediction import TimePredictionChain

logger = logging.getLogger(__name__)


class ComplaintPredictionService:
    @staticmethod
    def predict_resolution(
        complaint_id: int,
        category: str,
        description: str,
        address: str,
        image_url: str
    ) -> Tuple[Dict, Dict, Dict]:
        
        logger.info(f"Starting ML prediction pipeline for complaint {complaint_id}")
        
        metadata = {
            'complaint_id': complaint_id,
            'category': category,
            'pipeline_steps': []
        }
        
        try:
            # Step 1: YOLO Detection (SECONDARY, only for road complaints)
            logger.info("Step 1: YOLO detection (if applicable)")
            yolo_features = None
            
            if category.lower() == "road":
                try:
                    detector = RoadYOLODetector()
                    yolo_features = detector.detect_road_damage(image_url, category)
                    
                    metadata['pipeline_steps'].append({
                        'step': 'yolo_detection',
                        'status': 'success' if yolo_features.get('yolo_active') else 'skipped',
                        'note': 'SECONDARY features'
                    })
                    
                    logger.info(f"YOLO detection completed: {yolo_features.get('yolo_active', False)}")
                
                except Exception as e:
                    logger.warning(f"YOLO detection failed (non-critical): {str(e)}")
                    yolo_features = {'yolo_active': False, 'error': str(e)}
                    metadata['pipeline_steps'].append({
                        'step': 'yolo_detection',
                        'status': 'failed',
                        'error': str(e),
                        'note': 'Non-critical failure'
                    })
            
            else:
                yolo_features = {'yolo_active': False, 'reason': 'not_road_category'}
                metadata['pipeline_steps'].append({
                    'step': 'yolo_detection',
                    'status': 'skipped',
                    'reason': 'not_road_category'
                })
            
            # Step 2: Severity Analysis (PRIMARY, multimodal LLM)
            logger.info("Step 2: Severity analysis (PRIMARY)")
            
            try:
                severity_chain = SeverityAnalysisChain()
                severity_analysis = severity_chain.analyze(
                    category=category,
                    description=description,
                    address=address,
                    image_url=image_url,
                    yolo_features=yolo_features
                )
                
                metadata['pipeline_steps'].append({
                    'step': 'severity_analysis',
                    'status': 'success',
                    'severity_score': severity_analysis.get('severity_score'),
                    'note': 'PRIMARY analysis'
                })
                
                logger.info(f"Severity analysis completed: score={severity_analysis.get('severity_score')}")
            
            except Exception as e:
                logger.error(f"Severity analysis failed (critical): {str(e)}")
                metadata['pipeline_steps'].append({
                    'step': 'severity_analysis',
                    'status': 'failed',
                    'error': str(e)
                })
                raise Exception(f"Critical failure in severity analysis: {str(e)}")
            
            # Step 3: Weather Context
            logger.info("Step 3: Weather context fetch")
            
            try:
                weather_fetcher = WeatherContextFetcher()
                weather_data = weather_fetcher.fetch_weather(address)
                
                metadata['pipeline_steps'].append({
                    'step': 'weather_context',
                    'status': 'success' if weather_data.get('weather_available') else 'unavailable',
                    'condition': weather_data.get('condition', 'unknown')
                })
                
                logger.info(f"Weather context fetched: {weather_data.get('weather_available', False)}")
            
            except Exception as e:
                logger.warning(f"Weather fetch failed (non-critical): {str(e)}")
                weather_data = {'weather_available': False, 'error': str(e)}
                metadata['pipeline_steps'].append({
                    'step': 'weather_context',
                    'status': 'failed',
                    'error': str(e),
                    'note': 'Non-critical failure'
                })
            
            # Step 4: Time Prediction
            logger.info("Step 4: Time prediction")
            
            try:
                time_chain = TimePredictionChain()
                time_prediction = time_chain.predict(
                    severity_analysis=severity_analysis,
                    yolo_features=yolo_features,
                    weather_data=weather_data
                )
                
                metadata['pipeline_steps'].append({
                    'step': 'time_prediction',
                    'status': 'success',
                    'estimated_days': time_prediction.get('estimated_days'),
                    'urgency_tier': time_prediction.get('urgency_tier')
                })
                
                logger.info(f"Time prediction completed: {time_prediction.get('estimated_days')} days, urgency={time_prediction.get('urgency_tier')}")
            
            except Exception as e:
                logger.error(f"Time prediction failed (critical): {str(e)}")
                metadata['pipeline_steps'].append({
                    'step': 'time_prediction',
                    'status': 'failed',
                    'error': str(e)
                })
                raise Exception(f"Critical failure in time prediction: {str(e)}")
            
            # Add YOLO and weather data to metadata
            metadata['yolo_features'] = yolo_features
            metadata['weather_data'] = weather_data
            
            logger.info(f"ML prediction pipeline completed for complaint {complaint_id}")
            
            return severity_analysis, time_prediction, metadata
        
        except Exception as e:
            logger.error(f"ML prediction pipeline failed for complaint {complaint_id}: {str(e)}")
            metadata['pipeline_status'] = 'failed'
            metadata['error'] = str(e)
            raise
