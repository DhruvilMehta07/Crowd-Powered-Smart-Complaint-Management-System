"""
Severity Analysis Pipeline - PRIMARY Analysis Module

This module provides the PRIMARY visual and textual analysis using multimodal LLM.
YOLO features are passed as SECONDARY/OPTIONAL hints only.

The LLM directly observes the image and makes its own judgment, with YOLO data
serving merely as supplementary information.
"""

import os
import json
import logging
from typing import Dict, Optional

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.messages import HumanMessage

logger = logging.getLogger(__name__)


class SeverityAnalysisChain:
    
    def __init__(self):
        """Initialize the severity analysis chain."""
        
        # Get Groq configuration from environment
        api_key = os.getenv('GROQ_API_KEY')
        model = os.getenv('GROQ_MODEL', 'meta-llama/llama-4-scout-17b-16e-instruct')
        
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is required")
        
        # Initialize vision-capable LLM
        self.llm = ChatGroq(
            model=model,
            api_key=api_key,
            temperature=0.2,  
            max_tokens=8000
        )
        
        logger.info(f"Initialized SeverityAnalysisChain with model: {model}")
    
    def analyze(
        self,
        category: str,
        description: str,
        address: str,
        image_url: str,
        yolo_features: Optional[Dict] = None
    ) -> Dict:
        
        # Build the prompt with Chain-of-Thought reasoning
        prompt = self._build_severity_prompt(
            category=category,
            description=description,
            address=address,
            yolo_features=yolo_features
        )
        
        try:
            # Create message with image
            message = HumanMessage(
                content=[
                    {"type": "text", "text": prompt},
                    {"type": "image_url", "image_url": {"url": image_url}}
                ]
            )
            
            # Get LLM response
            response = self.llm.invoke([message])
            response_text = response.content
            
            # Parse JSON response
            analysis = self._parse_analysis_response(response_text)
            
            return analysis
        
        except Exception as e:
            logger.error(f"Severity analysis failed: {str(e)}")
            
            # Return fallback analysis
            return {
                'severity_score': 50,  # Default moderate severity
                'issue_type': f"{category} complaint",
                'causes': ["Unable to determine due to analysis error"],
                'safety_risk': "Unknown - requires manual review",
                'infrastructure_damage': "Unknown - requires manual review",
                'reasoning_summary': f"Automated analysis failed: {str(e)}. Manual review recommended.",
                'error': str(e)
            }
    
    def _build_severity_prompt(
        self,
        category: str,
        description: str,
        address: str,
        yolo_features: Optional[Dict]
    ) -> str:
        # Base prompt with role and context
        prompt_parts = [
            "You are a Civic Infrastructure Analysis Expert specializing in Indian municipal systems.",
            "Your task is to analyze this citizen complaint image and assess its severity.",
            "",
            "# COMPLAINT DETAILS:",
            f"Category: {category}",
            f"Location: {address}",
            f"Citizen Description: {description}",
            ""
        ]
        
        # Add YOLO features as SECONDARY hints (if available)
        if yolo_features and yolo_features.get('yolo_active'):
            prompt_parts.extend([
                "# SECONDARY DETECTION HINTS (from automated road damage detector):",
                "NOTE: These are SUPPLEMENTARY hints only. Make your own independent judgment by observing the image.",
                ""
            ])
            
            # Add detection summary
            num_detections = yolo_features.get('num_detections', 0)
            if num_detections > 0:
                prompt_parts.append(f"- Number of detections: {num_detections}")
                prompt_parts.append(f"- Damage proportion: {yolo_features.get('damage_proportion', 0):.2%}")
                prompt_parts.append(f"- Average confidence: {yolo_features.get('avg_confidence_percent', 0):.2f}%")
                
                # Add detected damage classes with descriptions
                damage_classes = yolo_features.get('damage_classes', [])
                if damage_classes:
                    prompt_parts.append("")
                    prompt_parts.append("Detected damage types:")
                    for damage_class in damage_classes:
                        class_desc = damage_class['description']
                        count = damage_class['count']
                        avg_conf = damage_class['avg_confidence'] * 100
                        prompt_parts.append(f"  • {class_desc} ({damage_class['class_code']}): {count} instance(s), {avg_conf:.1f}% confidence")
                
                prompt_parts.append("")
                prompt_parts.append(f"- Overall severity hint: {yolo_features.get('severity_hint', 'unknown')}")
            else:
                prompt_parts.append("- No damage detected by automated system")
            
            prompt_parts.extend([
                "",
                "⚠️ IMPORTANT: These hints may be inaccurate. Rely primarily on your visual observation of the image.",
                ""
            ])
        
        # Chain-of-Thought instructions
        prompt_parts.extend([
            "# YOUR ANALYSIS TASK:",
            "",
            "Using Chain-of-Thought reasoning, analyze the image and provide:",
            "",
            "1. **Visual Observation**: What do you see in the image? Describe the issue in detail.",
            "",
            "2. **Severity Assessment**: Rate the severity on a 0-100 scale considering:",
            "   - Public safety risks",
            "   - Infrastructure damage extent",
            "   - Urgency of resolution needed",
            "   - Impact on daily life",
            "   - Indian context (monsoon, traffic, density, etc.)",
            "",
            "3. **Issue Classification**: What specific type of problem is this?",
            "",
            "4. **Root Causes**: What likely caused this issue?",
            "",
            "5. **Safety Risk**: Assess immediate safety risks to citizens.",
            "",
            "6. **Infrastructure Damage**: Assess the level of infrastructure damage.",
            "",
            "# OUTPUT FORMAT:",
            "Respond ONLY with valid JSON (no markdown, no code blocks):",
            "",
            "{",
            '  "severity_score": <integer 0-100>,',
            '  "issue_type": "<specific issue classification>",',
            '  "causes": ["<cause 1>", "<cause 2>", ...],',
            '  "safety_risk": "<safety risk assessment>",',
            '  "infrastructure_damage": "<damage level assessment>",',
            '  "reasoning_summary": "<concise explanation of your assessment>"',
            "}",
            "",
            "Begin your analysis:"
        ])
        
        return "\n".join(prompt_parts)
    
    def _parse_analysis_response(self, response_text: str) -> Dict:
        # parsing llm json response
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
            analysis = json.loads(cleaned_text)
            
            # Validate required fields
            required_fields = ['severity_score', 'issue_type', 'causes', 'safety_risk', 'infrastructure_damage', 'reasoning_summary']
            for field in required_fields:
                if field not in analysis:
                    logger.warning(f"Missing field in analysis: {field}")
                    analysis[field] = "Unknown - parsing error"
            
            # Ensure severity_score is an integer in 0-100 range
            if 'severity_score' in analysis:
                analysis['severity_score'] = max(0, min(100, int(analysis['severity_score'])))
            
            return analysis
        
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {str(e)}")
            logger.debug(f"Raw response: {response_text}")
            
            # Fallback parsing
            return {
                'severity_score': 50,
                'issue_type': "Unable to parse",
                'causes': ["Parsing error"],
                'safety_risk': "Unknown - parsing error",
                'infrastructure_damage': "Unknown - parsing error",
                'reasoning_summary': "LLM response could not be parsed. Manual review recommended.",
                'raw_response': response_text[:500]  # Include snippet for debugging
            }
