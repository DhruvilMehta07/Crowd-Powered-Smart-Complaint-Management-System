import os
os.environ['YOLO_MODEL_PATH'] = 'ml_models/best1.pt'

from complaints.ml.road_yolo_detector import RoadYOLODetector

# Test with a sample road damage image URL
test_image_url = "https://www.shutterstock.com/shutterstock/photos/2401102987/display_1500/stock-photo-tarmac-road-pothole-damage-uk-great-britain-2401102987.jpg"

detector = RoadYOLODetector()
result = detector.detect_road_damage(test_image_url, "road")

print("YOLO Test Result:")
print(f"YOLO Active: {result.get('yolo_active')}")
print(f"Number of detections: {result.get('num_detections', 0)}")
print(f"Average confidence: {result.get('avg_confidence_percent', 0)}%")
print(f"Damage classes: {result.get('damage_classes', [])}")
print(f"\nFull result:\n{result}")