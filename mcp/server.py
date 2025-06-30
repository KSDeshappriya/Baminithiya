from mcp.server.fastmcp import FastMCP
import requests

mcp = FastMCP("Disa")

base_url = "http://localhost:8000"
headers = {
    'Content-Type': 'application/json'
}


# Tool: Get nearby disasters
@mcp.tool()
def get_nearby_disasters(latitude: float = None, longitude: float = None, address: str = None) -> dict:
    """
    Query nearby disasters using latitude/longitude or an address (geocoded via OpenStreetMap).
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

    endpoint = f"{base_url}/public/nearby"
    params = {
        "latitude": latitude,
        "longitude": longitude
    }
    response = requests.get(endpoint, headers=headers, params=params)
    if response.status_code != 200:
        try:
            error_msg = response.json().get('detail', 'Unknown error')
        except Exception:
            error_msg = response.text
        raise Exception(f"Failed to get nearby disasters: {error_msg}")
    return response.json()
