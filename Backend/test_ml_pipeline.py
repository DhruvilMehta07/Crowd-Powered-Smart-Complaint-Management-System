"""
Test script for ML prediction pipeline
Run with: docker compose exec web python test_ml_pipeline.py
"""

import os
import django
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'CPCMS.settings')
django.setup()

from complaints.services.complaint_prediction_service import ComplaintPredictionService

# Test parameters
test_complaint_id = 1
test_category = "road"
test_description = "Large pothole causing traffic issues"
test_address = "Mumbai, Maharashtra, India"
test_image_url = "https://www.shutterstock.com/shutterstock/photos/2401102987/display_1500/stock-photo-tarmac-road-pothole-damage-uk-great-britain-2401102987.jpg"

print("Starting ML Pipeline Test...")
print(f"OPENAI_API_KEY set: {'Yes' if os.getenv('OPENAI_API_KEY') else 'No'}")
print(f"WEATHER_API_KEY set: {'Yes' if os.getenv('WEATHER_API_KEY') else 'No'}")
print(f"YOLO_MODEL_PATH: {os.getenv('YOLO_MODEL_PATH')}")
print()

# Run pipeline
try:
    severity, time_pred, metadata = ComplaintPredictionService.predict_resolution(
        complaint_id=test_complaint_id,
        category=test_category,
        description=test_description,
        address=test_address,
        image_url=test_image_url
    )

    # Print results
    print("\n=== SEVERITY ANALYSIS ===")
    print(f"Score: {severity['severity_score']}/100")
    print(f"Issue Type: {severity['issue_type']}")
    print(f"Safety Risk: {severity['safety_risk']}")
    print(f"Causes: {severity['causes']}")

    print("\n=== TIME PREDICTION ===")
    print(f"Estimated Days: {time_pred['estimated_days']}")
    print(f"Urgency: {time_pred['urgency_tier']}")
    print(f"Key Factors: {time_pred['key_factors']}")

    print("\n=== METADATA ===")
    print(f"Pipeline Steps: {metadata['pipeline_steps']}")
    print(f"YOLO Active: {metadata['yolo_features'].get('yolo_active', False)}")
    print(f"Weather Available: {metadata['weather_data'].get('weather_available', False)}")
    
    print("\n✅ ML Pipeline test completed successfully!")

except Exception as e:
    print(f"\n❌ Error running ML pipeline: {str(e)}")
    import traceback
    traceback.print_exc()
