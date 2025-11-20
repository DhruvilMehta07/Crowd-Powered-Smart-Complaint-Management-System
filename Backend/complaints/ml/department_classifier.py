import os
import json
import logging
import tempfile
from typing import Dict, Optional, List
from pathlib import Path

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from PIL import Image

logger = logging.getLogger(__name__)


# Common municipal departments found in Indian cities
COMMON_DEPARTMENTS = [
    "Road",
    "Water",
    "Waste",
    "Electricity",
    "Fire",
    "Health",
    "Sanitation",
    "Parks",
    "Drainage",
    "Street Lights",
    "Building",
    "Traffic",
    "Pollution",
    "Other"
]


class DepartmentImageClassifier:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DepartmentImageClassifier, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize the classifier with Groq LLM."""
        if not hasattr(self, '_initialized'):
            self._initialize_llm()
            self._initialized = True
    
    def _initialize_llm(self):
        """Initialize the vision-capable LLM."""
        api_key = os.getenv('GROQ_API_KEY')
        model = os.getenv('GROQ_MODEL', 'meta-llama/llama-4-scout-17b-16e-instruct')
        
        if not api_key:
            logger.warning("GROQ_API_KEY not set. Department image classification will be unavailable.")
            self.llm = None
            return
        
        try:
            self.llm = ChatGroq(
                model=model,
                api_key=api_key,
                temperature=0.1,  # Low temperature for consistent classification
                max_tokens=1000
            )
            logger.info(f"Department classifier initialized with model: {model}")
        except Exception as e:
            logger.error(f"Failed to initialize LLM: {str(e)}")
            self.llm = None
    
    def classify_from_file(
        self,
        image_file,
        description: str = "",
        available_departments: Optional[List[str]] = None
    ) -> Dict:
        
        if self.llm is None:
            return {
                'success': False,
                'error': 'LLM classifier not available',
                'department': None,
            }
        
        # Use provided departments or fall back to common ones
        departments = available_departments or COMMON_DEPARTMENTS
        
        temp_image_path = None
        
        try:
            # Save uploaded file to temporary location
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                if hasattr(image_file, 'seek'):
                    try:
                        image_file.seek(0)
                    except (OSError, AttributeError):
                        pass
                
                if hasattr(image_file, 'chunks'):
                    for chunk in image_file.chunks():
                        temp_file.write(chunk)
                else:
                    temp_file.write(image_file.read())
                
                temp_image_path = temp_file.name
            
            # Convert image to base64 data URL for Groq
            image_url = self._image_to_data_url(temp_image_path)
            
            # Build classification prompt
            prompt = self._build_classification_prompt(description, departments)
            
            # Call LLM with image
            message = HumanMessage(
                content=[
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]
            )
            
            response = self.llm.invoke([message])
            response_text = response.content
            
            # Parse the response
            result = self._parse_classification_response(response_text, departments)
            result['success'] = True
            
            return result
            
        except Exception as e:
            logger.error(f"Department classification error: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'department': None,
                'confidence': 0.35,
            }
        
        finally:
            # Clean up temp file
            if temp_image_path and os.path.exists(temp_image_path):
                try:
                    os.unlink(temp_image_path)
                except Exception as e:
                    logger.warning(f"Failed to delete temp file {temp_image_path}: {str(e)}")
    
    def _image_to_data_url(self, image_path: str) -> str:
        """Convert image to base64 data URL."""
        import base64
        
        # Open and potentially resize large images
        img = Image.open(image_path)
        
        # Convert RGBA to RGB if necessary (for JPEG compatibility)
        if img.mode in ('RGBA', 'LA', 'P'):
            # Create a white background
            background = Image.new('RGB', img.size, (255, 255, 255))
            # Paste image on background (handles transparency)
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize if too large (to reduce tokens)
        max_size = 1024
        if max(img.size) > max_size:
            img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        # Save to bytes
        import io
        buffer = io.BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        img.close()
        
        # Encode to base64
        img_bytes = buffer.getvalue()
        img_base64 = base64.b64encode(img_bytes).decode('utf-8')
        
        return f"data:image/jpeg;base64,{img_base64}"
    
    def _build_classification_prompt(self, description: str, departments: List[str]) -> str:
        """Build the classification prompt for the LLM."""
        
        # Format departments list
        dept_list = "\n".join([f"  - {dept}" for dept in departments])
        
        prompt_parts = [
            "You are a Municipal Complaint Classification Expert for Indian cities.",
            "Your task is to analyze this citizen complaint image and classify it into the most appropriate municipal department.",
            "",
            "# AVAILABLE DEPARTMENTS:",
            dept_list,
            "",
        ]
        
        if description:
            prompt_parts.extend([
                "# CITIZEN DESCRIPTION:",
                description,
                "",
            ])
        
        prompt_parts.extend([
            "# YOUR TASK:",
            "1. Carefully observe the image and identify the primary issue shown",
            "2. Consider the citizen description if provided",
            "3. Select the MOST APPROPRIATE department from the available list",
            "4. Assess your confidence level (0.0 to 1.0)",
            "",
            "# CLASSIFICATION GUIDELINES:",
            "- Road: Potholes, cracks, road damage, broken asphalt, highway issues",
            "- Water: Water leaks, pipe bursts, water supply issues, water quality",
            "- Waste: Garbage accumulation, trash, litter, waste disposal issues",
            "- Electricity: Power lines, electrical issues, transformers, power outages",
            "- Fire: Fire hazards, smoke, burning waste, fire safety concerns",
            "- Health: Medical facilities, health hazards, disease concerns",
            "- Sanitation: Sewage, drainage clogs, unhygienic conditions",
            "- Parks: Park maintenance, playground issues, public gardens",
            "- Drainage: Blocked drains, flooding, stormwater issues",
            "- Street Lights: Non-functional lights, broken poles, lighting issues",
            "- Building: Building violations, construction issues, structural damage",
            "- Traffic: Traffic signals, road signs, traffic congestion",
            "- Pollution: Air pollution, noise pollution, environmental issues",
            "- Other: Issues that don't clearly fit other categories",
            "",
            "# OUTPUT FORMAT:",
            "Respond with ONLY valid JSON (no markdown, no code blocks):",
            "",
            "{",
            '  "department": "<exact department name from the list>",',
            '  "confidence": <number between 0.0 and 1.0>,',
            "}",
            "",
            "Begin your analysis:"
        ])
        
        return "\n".join(prompt_parts)
    
    def _parse_classification_response(self, response_text: str, departments: List[str]) -> Dict:
        """Parse the LLM's JSON response."""
        import re

        def _normalize_dept(candidate: str) -> Optional[str]:
            if not candidate:
                return None
            cand = candidate.strip()
            for dept in departments:
                if dept.lower() == cand.lower():
                    return dept
            for dept in departments:
                if cand.lower() in dept.lower() or dept.lower() in cand.lower():
                    return dept
            return None

        cleaned_text = (response_text or "").strip()

        # 1) Quick try: direct JSON parse
        try:
            data = json.loads(cleaned_text)
        except Exception:
            # 2) Remove common fences and try again
            if cleaned_text.startswith("```") and cleaned_text.endswith("```"):
                inner = "\n".join(cleaned_text.splitlines()[1:-1])
            else:
                inner = cleaned_text

            # 3) Try to extract the first JSON object by finding outermost braces
            json_obj = None
            try:
                # find first { and last } and take substring
                first = inner.find('{')
                last = inner.rfind('}')
                if first != -1 and last != -1 and last > first:
                    candidate = inner[first:last+1]
                    data = json.loads(candidate)
                    json_obj = data
                else:
                    # 4) regex fallback: grab a {...} block (non-greedy)
                    m = re.search(r"(\{.*\})", inner, re.DOTALL)
                    if m:
                        candidate = m.group(1)
                        data = json.loads(candidate)
                        json_obj = data
            except Exception:
                json_obj = None

            if json_obj is None:
                # final fallback: try to extract department/confidence via regex words
                logger.error("Failed to parse JSON from LLM response. Raw response (truncated): %s", cleaned_text[:1000])

                # attempt to extract department name by scanning for known department tokens
                department = self._extract_department_from_text(cleaned_text, departments)

                # try to extract a floating number for confidence
                conf = None
                mconf = re.search(r"([0]?\.?\d(?:\.\d+)?)", cleaned_text)
                if mconf:
                    try:
                        conf_val = float(mconf.group(1))
                        if 0.0 <= conf_val <= 1.0:
                            conf = conf_val
                    except Exception:
                        conf = None

                return {
                    'department': department or "Other",
                    'confidence': round(min(max(conf or 0.45, 0.0), 1.0), 2),
                }

        # If we reach here, `data` is a parsed JSON dict
        try:
            department = (data.get('department') or '').strip()
            confidence = float(data.get('confidence', 0.5))
        except Exception:
            logger.error("Parsed JSON does not contain expected keys. JSON (truncated): %s", str(data)[:500])
            department = self._extract_department_from_text(cleaned_text, departments)
            return {
                'department': department or "Other",
                'confidence': 0.45,
            }

        matched_dept = _normalize_dept(department)
        if not matched_dept:
            logger.warning(f"LLM suggested department '%s' not in available list. Using 'Other'.", department)
            matched_dept = "Other"
            confidence = max(0.35, confidence * 0.5)

        return {
            'department': matched_dept,
            'confidence': round(min(max(confidence, 0.0), 1.0), 2),
        }
    
    def _extract_department_from_text(self, text: str, departments: List[str]) -> str:
        """Try to extract department name from free-form text response."""
        text_lower = text.lower()
        for dept in departments:
            if dept.lower() in text_lower:
                return dept
        
        return "Other"
