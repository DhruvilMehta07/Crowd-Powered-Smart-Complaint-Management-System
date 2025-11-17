
import os
import json
import logging
from typing import Dict, Optional

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

logger = logging.getLogger(__name__)


class TimePredictionChain:
    """
    Chain 3: Time Prediction using LLM with India-specific constraints.
    
    Takes severity analysis, YOLO features, and weather data as input.
    Returns realistic time estimation considering Indian municipal operations.
    """
    
    def __init__(self):
        """Initialize the time prediction chain."""
        
        # Get Groq configuration from environment
        api_key = os.getenv('GROQ_API_KEY')
        model = os.getenv('GROQ_MODEL', 'meta-llama/llama-4-scout-17b-16e-instruct')
        
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        
        # Initialize LLM
        self.llm = ChatGroq(
            model=model,
            api_key=api_key,
            temperature=0.3,  
            max_tokens=2000
        )
        
        logger.info(f"Initialized TimePredictionChain with Groq model: {model}")
    
    def predict(
        self,
        severity_analysis: Dict,
        yolo_features: Optional[Dict],
        weather_data: Dict
    ) -> Dict:
        """
        Predict resolution time for the complaint.
        
        Args:
            severity_analysis (Dict): Output from SeverityAnalysisChain
            yolo_features (Optional[Dict]): YOLO detection features
            weather_data (Dict): Weather context data
        
        Returns:
            Dict: Time prediction with:
                - estimated_hours (int): Estimated hours to resolve
                - estimated_days (float): Estimated days to resolve
                - urgency_tier (str): low/medium/high/critical
                - key_factors (List[str]): Factors affecting timeline
                - weather_impact (str): How weather affects timeline
                - explanation (str): Reasoning for the estimate
        """
        
        # Build the Chain-of-Thought prompt
        prompt = self._build_prediction_prompt(
            severity_analysis=severity_analysis,
            yolo_features=yolo_features,
            weather_data=weather_data
        )
        
        try:
            # Get LLM prediction
            response = self.llm.invoke(prompt)
            response_text = response.content
            
            # Parse JSON response
            prediction = self._parse_prediction_response(response_text)
            
            return prediction
        
        except Exception as e:
            logger.error(f"Time prediction failed: {str(e)}")
            
            # Fallback to severity-based heuristic
            return self._fallback_prediction(severity_analysis)
    
    def _build_prediction_prompt(
        self,
        severity_analysis: Dict,
        yolo_features: Optional[Dict],
        weather_data: Dict
    ) -> str:
        """
        Build the Chain-of-Thought time prediction prompt.
        
        Args:
            severity_analysis (Dict): Severity analysis results
            yolo_features (Optional[Dict]): YOLO features
            weather_data (Dict): Weather data
        
        Returns:
            str: Complete prompt for LLM
        """
        
        prompt_parts = [
            "You are a Municipal Field Operations Planner specializing in Indian civic infrastructure.",
            "Your task is to predict the realistic time required to resolve this citizen complaint.",
            "",
            "# SEVERITY ANALYSIS:",
            f"- Severity Score: {severity_analysis.get('severity_score', 50)}/100",
            f"- Issue Type: {severity_analysis.get('issue_type', 'Unknown')}",
            f"- Safety Risk: {severity_analysis.get('safety_risk', 'Unknown')}",
            f"- Infrastructure Damage: {severity_analysis.get('infrastructure_damage', 'Unknown')}",
            f"- Reasoning: {severity_analysis.get('reasoning_summary', 'N/A')}",
            ""
        ]
        
        # Add YOLO features if available
        if yolo_features and yolo_features.get('yolo_active'):
            prompt_parts.extend([
                "# ROAD DAMAGE DETECTION (SECONDARY) done by YOLO model (this can be inaccurate so dont rely only on this):",
                f"- Number of detections: {yolo_features.get('num_detections', 0)}",
                f"- Damage proportion: {yolo_features.get('damage_proportion', 0):.2%}",
                f"- Average confidence: {yolo_features.get('avg_confidence_percent', 0):.2f}%"
            ])
            
            # Add detected damage classes
            damage_classes = yolo_features.get('damage_classes', [])
            if damage_classes:
                prompt_parts.append("- Detected damage types:")
                for damage_class in damage_classes[:3]:  # Show top 3 most frequent
                    class_desc = damage_class['description']
                    count = damage_class['count']
                    prompt_parts.append(f"  • {class_desc}: {count} instance(s)")
            
            prompt_parts.append(f"- Severity hint: {yolo_features.get('severity_hint', 'unknown')}")
            prompt_parts.append("")
        
        # Add weather context
        if weather_data.get('weather_available'):
            current = weather_data.get('current', {})
            forecast = weather_data.get('forecast', [])
            
            prompt_parts.extend([
                "# WEATHER CONDITIONS:",
                "",
                "**Current Weather:**",
                f"- Condition: {current.get('condition', 'Unknown')}",
                f"- Temperature: {current.get('temp_c', 0)}°C",
                f"- Precipitation: {current.get('precip_mm', 0)} mm",
                f"- Humidity: {current.get('humidity', 0)}%",
                f"- Wind Speed: {current.get('wind_kph', 0)} km/h",
                ""
            ])
            
            # Add 10-day forecast summary
            if forecast:
                prompt_parts.append("**10-Day Forecast:**")
                
                # Check for rain days and extreme conditions
                rainy_days = sum(1 for day in forecast if day.get('rain_mm', 0) > 5)
                heavy_rain_days = sum(1 for day in forecast if day.get('rain_mm', 0) > 20)
                
                prompt_parts.append(f"- Rainy days (>5mm): {rainy_days} out of {len(forecast)} days")
                if heavy_rain_days > 0:
                    prompt_parts.append(f"- Heavy rain days (>20mm): {heavy_rain_days} days")
                
                # Show first 5 days detail
                prompt_parts.append("- Next 5 days detail:")
                for day in forecast[:5]:
                    date = day.get('date', 'Unknown')
                    condition = day.get('condition', 'Unknown')
                    rain = day.get('rain_mm', 0)
                    temp_range = f"{day.get('min_temp_c', 0)}-{day.get('max_temp_c', 0)}°C"
                    prompt_parts.append(f"  • {date}: {condition}, {temp_range}, Rain: {rain}mm")
                
                prompt_parts.append("")
        else:
            prompt_parts.extend([
                "# WEATHER DATA:",
                "- Weather data unavailable",
                ""
            ])
        
        # Chain-of-Thought instructions
        prompt_parts.extend([
            "# INDIAN MUNICIPAL CONTEXT:",
            "",
            "Consider these realistic constraints:",
            "",
            "1. **Working Hours**: Municipal workers typically work 6-7 hours/day (not 24/7)",
            "2. **Resource Availability**: Equipment and materials may not be immediately available",
            "3. **Bureaucracy**: Approvals and coordination can add significant time",
            "4. **Monsoon Impact**: Heavy rain can delay outdoor work by days or weeks",
            "5. **Traffic/Access**: Urban areas have limited access hours, rural areas may be remote",
            "6. **Labor Availability**: Skilled labor may be in short supply",
            "7. **Budget Cycles**: Major repairs may wait for budget allocation",
            "",
            "# URGENCY TIERS:",
            "- **Critical**: Immediate safety hazard (respond within hours)",
            "- **High**: Significant disruption or safety concern (1-3 days)",
            "- **Medium**: Moderate issue affecting quality of life (3-14 days)",
            "- **Low**: Minor issue, can be scheduled (2-8 weeks)",
            "",
            "# YOUR PREDICTION TASK:",
            "",
            "Using Chain-of-Thought reasoning, predict:",
            "",
            "1. **Urgency Assessment**: What is the urgency tier?",
            "",
            "2. **Work Complexity**: How complex is the repair? (simple fix vs. major reconstruction)",
            "",
            "3. **Resource Requirements**: What resources are needed? Are they readily available?",
            "",
            "4. **Weather Impact**: How do current weather conditions affect the timeline?",
            "",
            "5. **Bureaucratic Delays**: Will approvals or coordination add time?",
            "",
            "6. **Realistic Timeline**: Accounting for all constraints, how long will this take?",
            "",
            "# OUTPUT FORMAT:",
            "Respond ONLY with valid JSON (no markdown, no code blocks):",
            "",
            "{",
            '  "estimated_hours": <integer total hours>,',
            '  "estimated_days": <float total days>,',
            '  "urgency_tier": "<critical|high|medium|low>",',
            '  "key_factors": ["<factor 1>", "<factor 2>", ...],',
            '  "weather_impact": "<how weather affects timeline>",',
            '  "explanation": "<concise reasoning for your estimate>"',
            "}",
            "",
            "Be realistic and conservative. Under-promising and over-delivering is better than the reverse.",
            "",
            "Begin your prediction:"
        ])
        
        return "\n".join(prompt_parts)
    
    def _parse_prediction_response(self, response_text: str) -> Dict:
        """
        Parse the LLM JSON response.
        
        Args:
            response_text (str): Raw LLM response
        
        Returns:
            Dict: Parsed prediction data
        """
        
        try:
            # Remove markdown code blocks if present
            cleaned_text = response_text.strip()
            if cleaned_text.startswith("```"):
                # Extract JSON from code block
                lines = cleaned_text.split("\n")
                json_lines = []
                in_json = False
                
                for line in lines:
                    if line.strip().startswith("```"):
                        in_json = not in_json
                        continue
                    if in_json or (not line.strip().startswith("```")):
                        json_lines.append(line)
                
                cleaned_text = "\n".join(json_lines).strip()
            
            # Parse JSON
            prediction = json.loads(cleaned_text)
            
            # Validate and sanitize
            required_fields = ['estimated_hours', 'estimated_days', 'urgency_tier', 'key_factors', 'weather_impact', 'explanation']
            for field in required_fields:
                if field not in prediction:
                    logger.warning(f"Missing field in prediction: {field}")
                    prediction[field] = "Unknown - parsing error"
            
            # Ensure numeric fields are correct type
            if 'estimated_hours' in prediction:
                prediction['estimated_hours'] = max(1, int(prediction['estimated_hours']))
            
            if 'estimated_days' in prediction:
                prediction['estimated_days'] = max(0.1, float(prediction['estimated_days']))
            
            # Validate urgency tier
            valid_tiers = ['critical', 'high', 'medium', 'low']
            if prediction.get('urgency_tier', '').lower() not in valid_tiers:
                prediction['urgency_tier'] = 'medium'
            
            return prediction
        
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {str(e)}")
            logger.debug(f"Raw response: {response_text}")
            
            # Fallback parsing
            return {
                'estimated_hours': 48,
                'estimated_days': 2.0,
                'urgency_tier': 'medium',
                'key_factors': ["Parsing error"],
                'weather_impact': "Unknown",
                'explanation': "LLM response could not be parsed. Using default estimate.",
                'raw_response': response_text[:500]
            }
    
    def _fallback_prediction(self, severity_analysis: Dict) -> Dict:
        """
        Fallback prediction based on severity score.
        
        Args:
            severity_analysis (Dict): Severity analysis results
        
        Returns:
            Dict: Basic time prediction
        """
        
        severity = severity_analysis.get('severity_score', 50)
        
        # Map severity to time estimate
        if severity >= 80:
            # Critical
            return {
                'estimated_hours': 24,
                'estimated_days': 1.0,
                'urgency_tier': 'critical',
                'key_factors': ['High severity', 'Safety risk'],
                'weather_impact': 'Unknown',
                'explanation': 'Fallback estimate based on critical severity score'
            }
        
        elif severity >= 60:
            # High
            return {
                'estimated_hours': 72,
                'estimated_days': 3.0,
                'urgency_tier': 'high',
                'key_factors': ['Moderate-high severity'],
                'weather_impact': 'Unknown',
                'explanation': 'Fallback estimate based on high severity score'
            }
        
        elif severity >= 40:
            # Medium
            return {
                'estimated_hours': 168,
                'estimated_days': 7.0,
                'urgency_tier': 'medium',
                'key_factors': ['Moderate severity'],
                'weather_impact': 'Unknown',
                'explanation': 'Fallback estimate based on medium severity score'
            }
        
        else:
            # Low
            return {
                'estimated_hours': 720,
                'estimated_days': 30.0,
                'urgency_tier': 'low',
                'key_factors': ['Low severity'],
                'weather_impact': 'Unknown',
                'explanation': 'Fallback estimate based on low severity score'
            }
