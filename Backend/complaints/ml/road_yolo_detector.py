"""
Road YOLO Detector Module

This module provides SECONDARY/OPTIONAL features for road complaint analysis.
Primary analysis is always done by the multimodal LLM.

YOLO features are only used as supplementary hints and clearly marked as SECONDARY.
"""

import os
import tempfile
import logging
from typing import Dict, Optional
import requests
from PIL import Image

logger = logging.getLogger(__name__)

# RDD2022 Dataset class names - road damage types
RDD_CLASS_NAMES = {
    0: 'D00',  # Longitudinal Crack
    1: 'D01',  # Lateral Crack
    2: 'D10',  # Alligator Crack
    3: 'D11',  # Crosswalk Blur
    4: 'D20',  # Pothole
    5: 'D40',  # Manhole Cover
    6: 'D43',  # Utility Hole
    7: 'D44'   # Road Shoulder Defect
}

# Human-readable descriptions for each damage class
RDD_CLASS_DESCRIPTIONS = {
    'D00': 'Longitudinal Crack',
    'D01': 'Lateral Crack',
    'D10': 'Alligator Crack',
    'D11': 'Crosswalk Blur',
    'D20': 'Pothole',
    'D40': 'Manhole Cover',
    'D43': 'Utility Hole',
    'D44': 'Road Shoulder Defect'
}


class RoadYOLODetector:
    """
    Singleton class for road damage detection using YOLOv8.
    
    IMPORTANT: This detector provides SECONDARY/OPTIONAL features only.
    Primary analysis is always done by the multimodal LLM in severity_pipeline.py.
    
    YOLO is used ONLY for road category complaints and provides supplementary
    detection data that is clearly marked as SECONDARY in the analysis chain.
    """
    
    _instance = None
    _model = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(RoadYOLODetector, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize the YOLO detector (lazy loading)."""
        if self._model is None:
            self._load_model()
    
    def _load_model(self):
        """
        Load the YOLOv8 model from disk.
        
        Falls back gracefully if model is not available.
        """
        model_path = os.getenv('YOLO_MODEL_PATH', '/code/ml_models/best.pt')
        
        try:
            if not os.path.exists(model_path):
                logger.warning(f"YOLO model not found at {model_path}. YOLO features will be unavailable.")
                self._model = None
                return
            
            from ultralytics import YOLO
            self._model = YOLO(model_path)
            logger.info(f"YOLO model loaded successfully from {model_path}")
            
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {str(e)}")
            self._model = None
    
    def detect_road_damage(self, image_url: str, category: str) -> Dict:
        """
        Detect road damage using YOLOv8.
        
        IMPORTANT: This method returns SECONDARY/OPTIONAL features only.
        It should only be called for road category complaints.
        
        Args:
            image_url (str): Cloudinary URL of the complaint image
            category (str): Complaint category (should be "road")
        
        Returns:
            Dict: Detection results with 'yolo_active' flag
                - If category != "road": {'yolo_active': False, 'reason': 'not_road_category'}
                - If model unavailable: {'yolo_active': False, 'reason': 'model_unavailable'}
                - If detection successful: {'yolo_active': True, 'detections': [...], ...}
                - If error: {'yolo_active': False, 'error': '...'}
        """
        
        # YOLO is ONLY for road complaints
        if category.lower() != "road":
            return {
                'yolo_active': False,
                'reason': 'not_road_category',
                'message': 'YOLO detection is only applicable to road complaints'
            }
        
        # Check if model is available
        if self._model is None:
            return {
                'yolo_active': False,
                'reason': 'model_unavailable',
                'message': 'YOLO model is not loaded. This is optional; primary analysis will use LLM.'
            }
        
        temp_image_path = None
        
        try:
            # Download image from Cloudinary
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                temp_file.write(response.content)
                temp_image_path = temp_file.name
            
            # Run YOLO inference
            results = self._model.predict(temp_image_path, conf=0.25)
            
            # Extract detection data
            detections = []
            confidences = []
            damage_classes = {}  # Track which damage classes were detected
            total_damage_area = 0
            
            if results and len(results) > 0:
                # result = results[0]
                
                # Get image dimensions
                img = Image.open(temp_image_path)
                img_width, img_height = img.size
                total_image_area = img_width * img_height
                for result in results:
                # Process each detection
                    if result.boxes is not None and len(result.boxes) > 0:
                        for box in result.boxes:
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            conf = float(box.conf[0].cpu().numpy())
                            cls = int(box.cls[0].cpu().numpy())
                            
                            # Get class name
                            class_code = RDD_CLASS_NAMES.get(cls, f'Unknown_{cls}')
                            class_description = RDD_CLASS_DESCRIPTIONS.get(class_code, 'Unknown damage type')
                            
                            # Calculate damage area
                            box_width = x2 - x1
                            box_height = y2 - y1
                            box_area = box_width * box_height
                            total_damage_area += box_area
                            
                            # Store confidence
                            confidences.append(conf)
                            
                            # Track damage class occurrences
                            if class_code not in damage_classes:
                                damage_classes[class_code] = {
                                    'description': class_description,
                                    'count': 0,
                                    'total_confidence': 0.0
                                }
                            damage_classes[class_code]['count'] += 1
                            damage_classes[class_code]['total_confidence'] += conf
                            
                            detections.append({
                                'class_id': cls,
                                'class_code': class_code,
                                'class_description': class_description,
                                'confidence': conf,
                                'bbox': [float(x1), float(y1), float(x2), float(y2)],
                                'area': float(box_area)
                            })
                
                # Calculate average confidence across all detections
                avg_confidence = sum(confidences) / len(confidences) if confidences else 0
                
                # Compute average confidence per damage class
                damage_classes_summary = []
                for class_code, data in damage_classes.items():
                    avg_class_confidence = data['total_confidence'] / data['count']
                    damage_classes_summary.append({
                        'class_code': class_code,
                        'description': data['description'],
                        'count': data['count'],
                        'avg_confidence': round(avg_class_confidence, 4)
                    })
                
                # Sort by count (most frequent first)
                damage_classes_summary.sort(key=lambda x: x['count'], reverse=True)
                
                # Calculate metrics
                damage_proportion = total_damage_area / total_image_area if total_image_area > 0 else 0
                
                # Compute a severity hint (SECONDARY signal)
                severity_hint = self._compute_severity_hint(len(detections), damage_proportion, avg_confidence)
                
                return {
                    'yolo_active': True,
                    'num_detections': len(detections),
                    'detections': detections,
                    'damage_classes': damage_classes_summary,  # Summary of detected damage types
                    'total_damage_area': float(total_damage_area),
                    'image_area': float(total_image_area),
                    'damage_proportion': float(damage_proportion),
                    'avg_confidence': float(avg_confidence),
                    'avg_confidence_percent': round(avg_confidence * 100, 2),  # As percentage
                    'severity_hint': severity_hint,
                    'note': 'These are SECONDARY features. Primary analysis is done by multimodal LLM.'
                }
            
            else:
                return {
                    'yolo_active': True,
                    'num_detections': 0,
                    'detections': [],
                    'message': 'No road damage detected by YOLO',
                    'note': 'YOLO found nothing, but LLM may still identify issues from visual inspection.'
                }
        
        except Exception as e:
            logger.error(f"YOLO detection error: {str(e)}")
            return {
                'yolo_active': False,
                'error': str(e),
                'message': 'YOLO detection failed. This is optional; primary analysis will use LLM only.'
            }
        
        finally:
            # Clean up temporary file
            if temp_image_path and os.path.exists(temp_image_path):
                try:
                    os.unlink(temp_image_path)
                except Exception as e:
                    logger.warning(f"Failed to delete temp file {temp_image_path}: {str(e)}")
    
    def _compute_severity_hint(self, num_detections: int, damage_proportion: float, avg_confidence: float) -> str:
        """
        Compute a rough severity hint based on YOLO detections.
        
        This is a SECONDARY signal and should be clearly marked as such.
        
        Args:
            num_detections (int): Number of damage detections
            damage_proportion (float): Proportion of image with damage
            avg_confidence (float): Average detection confidence
        
        Returns:
            str: Severity hint (low/moderate/high/critical)
        """
        
        # Weighted score
        score = 0
        
        # Detection count contribution
        if num_detections >= 10:
            score += 3
        elif num_detections >= 5:
            score += 2
        elif num_detections >= 2:
            score += 1
        
        # Damage proportion contribution
        if damage_proportion > 0.3:
            score += 3
        elif damage_proportion > 0.15:
            score += 2
        elif damage_proportion > 0.05:
            score += 1
        
        # Confidence contribution
        if avg_confidence > 0.8:
            score += 1
        
        # Map to severity hint
        if score >= 6:
            return "critical"
        elif score >= 4:
            return "high"
        elif score >= 2:
            return "moderate"
        else:
            return "low"
