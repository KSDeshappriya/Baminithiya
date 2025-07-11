import requests
import json
from config import Config

class DisasterAPI:
    def __init__(self, base_url=None):
        self.base_url = base_url or Config.BASE_URL
        self.headers = Config.HEADERS.copy()
    
    def set_auth_token(self, token):
        """Set the authorization token for authenticated requests"""
        self.headers['Authorization'] = f"Bearer {token}"
    
    def clear_auth_token(self):
        """Clear the authorization token"""
        if 'Authorization' in self.headers:
            del self.headers['Authorization']
    
    def login(self, email, password, latitude, longitude):
        """Log in a user and get an authentication token"""
        url = f"{self.base_url}/auth/login"
        payload = {
            "email": email,
            "password": password,
            "latitude": latitude,
            "longitude": longitude
        }
        
        try:
            response = requests.post(url, json=payload, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e)}
    
    def get_user_profile(self, token):
        """Get the user profile with an authentication token"""
        url = f"{self.base_url}/private/profile"
        headers = self.headers.copy()
        headers['Authorization'] = f"Bearer {token}"
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e)}
    
    def check_disaster_status(self):
        """Get the current disaster status (public endpoint)"""
        url = f"{self.base_url}/public/status"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e)}
    
    def check_nearby_disasters(self, latitude, longitude):
        """Check for disasters near a location (public endpoint)"""
        url = f"{self.base_url}/public/nearby"
        params = {
            "latitude": latitude,
            "longitude": longitude
        }
        
        try:
            response = requests.get(url, params=params, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e)}
    
    def get_user_dashboard(self):
        """Get the user dashboard (authenticated endpoint)"""
        url = f"{self.base_url}/user/dashboard"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e)}
    
    def report_emergency(self, emergency_data, image=None):
        url = f"{self.base_url}/user/emergency/report"
        request_headers = self.headers.copy() # Make a copy

        print(f"DEBUG: Report Emergency - Image received by method: {image is not None}")
        print(f"DEBUG: Initial request_headers: {request_headers}")

        try:
            if image:
                if 'Content-Type' in request_headers:
                    print("DEBUG: Removing Content-Type from headers for multipart request.")
                    del request_headers['Content-Type']

                print(f"DEBUG: Final headers for multipart: {request_headers}")
                files = {'image': image}
                response = requests.post(url, data=emergency_data, files=files, headers=request_headers)
            else:
                print(f"DEBUG: Headers for non-multipart: {request_headers}")
                response = requests.post(url, data=emergency_data, headers=request_headers)

            response.raise_for_status()
            print(f"DEBUG: API Response Status: {response.status_code}")
            print(f"DEBUG: API Response Body: {response.text}")
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"DEBUG: Request Exception: {e}")
            return {"error": str(e)}
    
    def request_emergency_help(self, emergency_request_data):
        """Request help for an emergency"""
        url = f"{self.base_url}/user/emergency/request"
        
        try:
            response = requests.post(url, json=emergency_request_data, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e)}
    
    def get_user_request(self, disaster_id, user_id):
        """Get a user's emergency request"""
        url = f"{self.base_url}/user/emergency/request"
        params = {
            "disasterId": disaster_id,
            "userId": user_id
        }
        
        try:
            response = requests.get(url, params=params, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e)}
    
    def delete_user_request(self, disaster_id, user_id):
        """Delete a user's emergency request"""
        url = f"{self.base_url}/user/emergency/request"
        params = {
            "disasterId": disaster_id,
            "userId": user_id
        }
        
        try:
            response = requests.delete(url, params=params, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            return {"error": str(e)}
