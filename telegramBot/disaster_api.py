import requests
from config import Config

def get_nearby_disasters(latitude: float = None, longitude: float = None, address: str = None) -> list:
    """
    Query nearby disasters using latitude/longitude or an address (geocoded via OpenStreetMap).
    
    Returns:
        A list of disaster objects, each containing details about a nearby disaster
    """
    # If address is provided, geocode it
    if address is not None and (latitude is None or longitude is None):
        geocode_url = "https://nominatim.openstreetmap.org/search"
        geocode_params = {
            "q": address,
            "format": "json",
            "limit": 1
        }
        geocode_headers = {
            'User-Agent': 'DisasterHelper/1.0 (your@email.com)'
        }
        geocode_response = requests.get(geocode_url, params=geocode_params, headers=geocode_headers)
        if geocode_response.status_code != 200 or not geocode_response.json():
            raise Exception(f"Failed to geocode address: {address}")
        geocode_data = geocode_response.json()[0]
        latitude = float(geocode_data["lat"])
        longitude = float(geocode_data["lon"])

    if latitude is None or longitude is None:
        raise Exception("You must provide either latitude/longitude or a valid address.")

    endpoint = f"{Config.BASE_URL}/public/nearby"
    params = {
        "latitude": latitude,
        "longitude": longitude
    }
    response = requests.get(endpoint, headers=Config.HEADERS, params=params)
    if response.status_code != 200:
        try:
            error_msg = response.json().get('detail', 'Unknown error')
        except Exception:
            error_msg = response.text
        raise Exception(f"Failed to get nearby disasters: {error_msg}")
    
    # Process the response, which comes as a list of disaster objects
    disasters = response.json()
    
    # Validate that we received a list
    if not isinstance(disasters, list):
        raise Exception(f"Unexpected response format. Expected a list but got {type(disasters)}")
        
    return disasters
