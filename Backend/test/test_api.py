import pytest
from fastapi.testclient import TestClient
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from main import app

client = TestClient(app)

tokens = {}
shared_state = {}

# 1. User, Government, Volunteer, First Responder Signup

def test_user_signup():
    res = client.post("/auth/signup", json={
        "name": "Regular User",
        "email": "user@example.com",
        "password": "securepass123",
        "phone": "+1010101010",
        "role": "user"
    })
    assert res.status_code in [200, 201, 409]

def test_gov_signup():
    res = client.post("/auth/signup", json={
        "name": "Gov Officer",
        "email": "officer@ministry.gov",
        "password": "securepass123",
        "phone": "+1122334455",
        "role": "government",
        "department": "Disaster Management",
        "position": "Coordinator"
    })
    assert res.status_code in [200, 201, 409]

def test_volunteer_signup():
    res = client.post("/auth/signup", json={
        "name": "John Volunteer",
        "email": "john.volunteer@example.com",
        "password": "securepass123",
        "phone": "+1234567890",
        "latitude": 40.7128,
        "longitude": -74.0060,
        "role": "volunteer",
        "skills": ["first aid", "rescue"]
    })
    assert res.status_code in [200, 201, 409]

def test_first_responder_signup():
    res = client.post("/auth/signup", json={
        "name": "Alice Responder",
        "email": "alice@police.org",
        "password": "securepass123",
        "phone": "+1987654321",
        "role": "first_responder",
        "department": "Emergency Services",
        "unit": "Fire Department"
    })
    assert res.status_code in [200, 201, 409]

# 2. Logins (store tokens)

def test_user_login():
    res = client.post("/auth/login", json={
        "email": "user@example.com",
        "password": "securepass123",
        "latitude": 37.7749,
        "longitude": -122.4194
    })
    assert res.status_code == 200
    tokens["user"] = res.json()["access_token"]

def test_gov_login():
    res = client.post("/auth/login", json={
        "email": "officer@ministry.gov",
        "password": "securepass123",
        "latitude": 37.7749,
        "longitude": -122.4194
    })
    assert res.status_code == 200
    tokens["gov"] = res.json()["access_token"]

def test_volunteer_login():
    res = client.post("/auth/login", json={
        "email": "john.volunteer@example.com",
        "password": "securepass123",
        "latitude": 40.7128,
        "longitude": -74.0060
    })
    assert res.status_code == 200
    tokens["volunteer"] = res.json()["access_token"]

def test_first_responder_login():
    res = client.post("/auth/login", json={
        "email": "alice@police.org",
        "password": "securepass123",
        "latitude": 40.7128,
        "longitude": -74.0060
    })
    assert res.status_code == 200
    tokens["first_responder"] = res.json()["access_token"]

# 3. Get user profile (protected)

def test_get_user_profile():
    res = client.get("/auth/profile", headers={
        "Authorization": f"Bearer {tokens['user']}"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "user@example.com"

# 4. Emergency report with image (multipart/form-data)
def test_emergency_report_with_image():
    if not os.path.exists(os.path.join(os.path.dirname(__file__), "fire.jpg")):
        pytest.skip("fire.jpg not found")
    with open(os.path.join(os.path.dirname(__file__), "fire.jpg"), "rb") as img:
        files = {
            "emergencyType": (None, "fire"),
            "urgencyLevel": (None, "high"),
            "situation": (None, "Building fire on 3rd floor"),
            "peopleCount": (None, "5"),
            "latitude": (None, "40.7128"),
            "longitude": (None, "-74.0060"),
            "image": ("fire.jpg", img, "image/jpeg")
        }
        res = client.post("/user/emergency/report", files=files, headers={
            "Authorization": f"Bearer {tokens['user']}"
        })
        assert res.status_code in [200, 201]


# 5. Get nearby disasters and store disaster_id

def test_get_nearby_disasters():
    res = client.get("/public/nearby?latitude=40.7128&longitude=-74.0060")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if len(data) > 0:
        shared_state["disaster_id"] = data[0]["disaster_id"]
    else:
        pytest.skip("No disasters found for nearby query")

# 6. Government accepts disaster

def test_gov_accept_disaster():
    res = client.post("/gov/emergency/accept", json={
        "disaster_id": shared_state["disaster_id"]
    }, headers={
        "Authorization": f"Bearer {tokens['gov']}"
    })
    assert res.status_code in [200, 404]

# 7. Government rejects disaster

def test_gov_reject_disaster():
    res = client.post("/gov/emergency/reject", json={
        "disaster_id": shared_state["disaster_id"]
    }, headers={
        "Authorization": f"Bearer {tokens['gov']}"
    })
    assert res.status_code in [200, 404]

#8. Resource APIs (commented out for now)

def test_add_resource():
    res = client.post("/gov/resource/add", json={
        "disasterId": shared_state["disaster_id"],
        "data": {
            "disaster_id": shared_state["disaster_id"],
            "name": "Temporary Shelter",
            "type": "shelter",
            "description": "A shelter for displaced families",
            "contact": "+94112223344",
            "latitude": "6.9271",
            "longitude": "79.8612",
            "capacity": 100,
            "availability": 80
        }
    }, headers={
        "Authorization": f"Bearer {tokens['gov']}"
    })
    assert res.status_code in [200, 201]
    shared_state["resource_id"] = res.json().get("resource_id", "test-resource-id")

# def test_update_resource_availability():
#     res = client.patch("/gov/resource/update-availability", json={
#         "resource_id": shared_state.get("resource_id", "test-resource-id"),
#         "availability": 50
#     }, headers={
#         "Authorization": f"Bearer {tokens['gov']}"
#     })
#     assert res.status_code in [200, 404]

# def test_delete_resource():
#     res = client.request("DELETE", "/gov/resource/delete", json={
#         "resource_id": shared_state.get("resource_id", "test-resource-id")
#     }, headers={
#         "Authorization": f"Bearer {tokens['gov']}"
#     })
#     assert res.status_code in [200, 404]

# 9. Add user request to disaster (after accept/reject)
def test_user_emergency_request_again():
    res = client.post("/user/emergency/request", json={
        "disasterId": shared_state["disaster_id"],
        "help": "Trapped inside a burning building, need immediate rescue!",
        "urgencyType": "high",
        "latitude": "6.9271",
        "longitude": "79.8612"
    }, headers={
        "Authorization": f"Bearer {tokens['user']}"
    })
    assert res.status_code in [200, 201]

# 10. Public endpoints and profiles for other roles (optional, for completeness)
def test_public_status():
    res = client.get("/public/status")
    assert res.status_code == 200

def test_get_volunteer_profile():
    res = client.get("/auth/profile", headers={
        "Authorization": f"Bearer {tokens['volunteer']}"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "john.volunteer@example.com"

def test_get_gov_profile():
    res = client.get("/auth/profile", headers={
        "Authorization": f"Bearer {tokens['gov']}"
    })
    assert res.status_code == 200
    data = res.json()
    assert data["email"] == "officer@ministry.gov"


