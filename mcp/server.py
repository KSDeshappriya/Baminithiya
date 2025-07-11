from mcp.server.fastmcp import FastMCP
import requests
import time

mcp = FastMCP("Beminithiya")

base_url = "http://localhost:8000"
headers = {
    'Content-Type': 'application/json'
}

@mcp.tool()
def get_nearby_disasters(latitude: float = None, longitude: float = None, address: str = None) -> dict:
    """
    Query nearby disasters using latitude/longitude or an address (geocoded via OpenStreetMap).
    """
    try:
        # If address is provided, geocode it
        if address is not None and (latitude is None or longitude is None):
            print(f"Geocoding address: {address}")
            geocode_url = "https://nominatim.openstreetmap.org/search"
            geocode_params = {
                "q": address,
                "format": "json",
                "limit": 1
            }
            geocode_headers = {
                'User-Agent': 'DisasterHelper/1.0 (your@email.com)'
            }
            
            # Add delay to respect rate limits
            time.sleep(1)
            
            geocode_response = requests.get(geocode_url, params=geocode_params, headers=geocode_headers)
            
            if geocode_response.status_code != 200:
                return {"error": f"Geocoding failed with status {geocode_response.status_code}"}
            
            geocode_data = geocode_response.json()
            if not geocode_data:
                return {"error": f"No results found for address: {address}"}
            
            latitude = float(geocode_data[0]["lat"])
            longitude = float(geocode_data[0]["lon"])
            print(f"Geocoded to: {latitude}, {longitude}")

        if latitude is None or longitude is None:
            return {"error": "You must provide either latitude/longitude or a valid address."}

        # Query disasters
        endpoint = f"{base_url}/public/nearby"
        params = {
            "latitude": latitude,
            "longitude": longitude
        }
        
        print(f"Querying disasters at: {endpoint}")
        print(f"Parameters: {params}")
        
        response = requests.get(endpoint, headers=headers, params=params, timeout=10)
        
        print(f"Response status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code != 200:
            try:
                error_msg = response.json().get('detail', 'Unknown error')
            except Exception:
                error_msg = response.text
            return {"error": f"Failed to get nearby disasters: {error_msg}"}
        
        return response.json()
        
    except requests.exceptions.RequestException as e:
        return {"error": f"Network error: {str(e)}"}
    except Exception as e:
        return {"error": f"Unexpected error: {str(e)}"}
