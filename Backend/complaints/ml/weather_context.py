
import os
import logging
from typing import Dict

import requests

logger = logging.getLogger(__name__)


class WeatherContextFetcher:
    """
    Chain 2: Fetch weather context for the complaint location.
    
    Uses weatherapi.com to get current conditions and 10-day forecast.
    """
    
    def __init__(self):
        
        self.api_key = os.getenv('WEATHER_API_KEY')
        
        if not self.api_key:
            logger.warning("WEATHER_API_KEY not set. Weather context will be unavailable.")
        
        self.forecast_url = "http://api.weatherapi.com/v1/forecast.json"
    
    def fetch_weather(self, address: str) -> Dict:
        # Fetch current weather and 10-day forecast for the given address.
        
        
        if not self.api_key:
            return {
                'weather_available': False,
                'message': 'Weather API key not configured'
            }
        
        # Fetch from API 
        try:
            params = {
                'key': self.api_key,
                'q': address,
                'days': 10,  
                'aqi': 'no' 
            }
            
            response = requests.get(self.forecast_url, params=params, timeout=10)
            response.raise_for_status()
            
            data = response.json()
            
            # Extract current weather
            current_weather = {
                'condition': data['current']['condition']['text'],
                'temp_c': data['current']['temp_c'],
                'humidity': data['current']['humidity'],
                'wind_kph': data['current']['wind_kph'],
                'precip_mm': data['current']['precip_mm'],
                'cloud': data['current']['cloud']
            }
            
            # Extract 10-day forecast
            forecast_data = []
            for day in data['forecast']['forecastday']:
                forecast_data.append({
                    'date': day['date'],
                    'max_temp_c': day['day']['maxtemp_c'],
                    'min_temp_c': day['day']['mintemp_c'],
                    'condition': day['day']['condition']['text'],
                    'rain_mm': day['day']['totalprecip_mm'],
                    'humidity': day['day']['avghumidity'],
                    'max_wind_kph': day['day']['maxwind_kph']
                })
            
            weather_data = {
                'weather_available': True,
                'current': current_weather,
                'forecast': forecast_data,
                'location': data['location']['name']
            }
            
            logger.info(f"Fetched weather for {address}: {current_weather['condition']}, {current_weather['temp_c']}°C + 10-day forecast")
            
            return weather_data
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Weather API request failed: {str(e)}")
            return {
                'weather_available': False,
                'message': f'Weather API request failed: {str(e)}'
            }
        
        except Exception as e:
            logger.error(f"Weather fetch error: {str(e)}")
            return {
                'weather_available': False,
                'message': f'Weather fetch error: {str(e)}'
            }
