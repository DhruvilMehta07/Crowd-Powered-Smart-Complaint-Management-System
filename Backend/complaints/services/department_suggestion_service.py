import logging
from typing import Dict, Optional

from complaints.ml.road_yolo_detector import RoadYOLODetector
from complaints.ml.department_classifier import DepartmentImageClassifier
from users.models import Department

logger = logging.getLogger(__name__)


class DepartmentSuggestionService:

    KEYWORD_MAP = {
        "Road": ["road", "pothole", "street", "highway", "asphalt", "lane", "pavement", "crack", "damage"],
        "Water": ["water", "pipe", "leak", "sewage", "drain", "flood", "supply", "tap", "burst"],
        "Waste": ["garbage", "trash", "dump", "sanitation", "waste", "litter", "rubbish", "bin"],
        "Electricity": ["electric", "wire", "transformer", "pole", "power", "electricity", "voltage", "current"],
        "Fire": ["fire", "smoke", "burn", "flammable", "blaze", "burning"],
        "Health": ["health", "hospital", "medical", "disease", "illness", "hygiene", "clinic"],
        "Sanitation": ["toilet", "bathroom", "sewage", "septic", "sanitary", "latrine"],
        "Parks": ["park", "garden", "playground", "green", "tree", "plant", "bench"],
        "Drainage": ["drain", "drainage", "flood", "water logging", "overflow", "clog", "blocked"],
        "Street Lights": ["light", "lighting", "lamp", "pole", "street light", "dark", "illumination"],
        "Building": ["building", "construction", "structure", "wall", "ceiling", "floor", "violation"],
        "Traffic": ["traffic", "signal", "sign", "congestion", "jam", "vehicle", "crossing"],
        "Pollution": ["pollution", "air quality", "noise", "smell", "odor", "toxic", "contamination"],
    }

    DEFAULT_DEPARTMENT = "Other"

    def __init__(self) -> None:
        self.detector = RoadYOLODetector()
        self.image_classifier = DepartmentImageClassifier()

    def suggest(self, image_file, description: str = "") -> Dict:
        """Return a structured suggestion payload for the frontend widget."""
        description = (description or "").strip()
        confidence = 0.35
        suggested_name: Optional[str] = None

        # Get list of available departments from database
        available_depts = list(Department.objects.values_list('name', flat=True))
        if not available_depts:
            # Fallback to common departments if none in DB
            available_depts = list(self.KEYWORD_MAP.keys()) + [self.DEFAULT_DEPARTMENT]

        # PRIMARY: Use multimodal image classifier for all images
        try:
            classification_result = self.image_classifier.classify_from_file(
                image_file=image_file,
                description=description,
                available_departments=available_depts
            )
            
            if classification_result.get('success') and classification_result.get('department'):
                suggested_name = classification_result['department']
                confidence = float(classification_result.get('confidence', 0.6))
                
                
                
                logger.info(f"Image classifier suggested: {suggested_name} with {confidence:.2f} confidence")
        
        except Exception as exc:
            logger.warning("Image classification failed: %s", exc)
        
        if not suggested_name and description:
            keyword_match = self._match_keywords(description)
            if keyword_match:
                suggested_name = keyword_match
                confidence = 0.55

        # Final fallback
        if not suggested_name:
            suggested_name = self.DEFAULT_DEPARTMENT
            confidence = 0.35

        # Look up department in database
        department = Department.objects.filter(name__iexact=suggested_name).first()

        # Build response payload
        payload = {
            "department_name": department.name if department else suggested_name,
            "confidence": round(confidence, 2),
        }

        if department:
            payload["department_id"] = department.id

        return payload

    def _match_keywords(self, description: str) -> Optional[str]:
        lowered = description.lower()
        for dept_name, keywords in self.KEYWORD_MAP.items():
            if any(keyword in lowered for keyword in keywords):
                return dept_name
        return None
