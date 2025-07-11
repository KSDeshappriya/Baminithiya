from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from app.services.cnn_service import analyze_image_with_summary, disaster_model, yolo_model, device
from langgraph.graph import StateGraph
from typing import TypedDict
from io import BytesIO
import base64
import requests
import os
import json
import time
import uuid
import pygeohash as pgh
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
import xml.etree.ElementTree as ET
import math
from appwrite.services.storage import Storage
from app.services.appwrite_service import AppwriteService
from dotenv import load_dotenv

load_dotenv()

appwrite_service = AppwriteService()
storage = Storage(appwrite_service.client)

gemini = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash",
    google_api_key=os.getenv("GOOGLE_API_KEY")
)

class EmergencyState(TypedDict):
    image_bytes: bytes
    emergencyType: str
    urgencyLevel: str
    situation: str
    peopleCount: int
    latitude: float
    longitude: float
    cnn_result: str
    weather: dict
    gdac_disasters: dict
    government_report: str
    citizen_survival_guide: str
    user_id: str
    submitted_time: float
    ai_processing_start_time: float
    ai_processing_end_time: float
    status: str  
    image_url: str
    agents_status: dict
    parallel_tasks_completed: bool
    analysis_ready: bool
    ai_matrix_logs: list

def add_log_to_matrix(state: EmergencyState, message: str, component: str = "system", level: str = "info"):
    if "ai_matrix_logs" not in state:
        state["ai_matrix_logs"] = []
    
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "unix_timestamp": time.time(),
        "component": component,
        "level": level,
        "message": message
    }
    state["ai_matrix_logs"].append(log_entry)
    print(message)

def generate_geohash_date_uuid(latitude, longitude) -> str:
    lat = float(latitude)
    lon = float(longitude)
    geohash = pgh.encode(lat, lon, precision=4)
    timestamp = str(int(time.time()))
    unique_id = f"{geohash}_{timestamp}_{str(uuid.uuid4())[:8]}"
    return unique_id

def parse_gdacs_rss_feed(rss_content, target_lat, target_lon, radius_km=100):
    try:
        root = ET.fromstring(rss_content)
        disasters = []
        
        for item in root.findall('.//item'):
            disaster_info = {}
            
            title = item.find('title')
            if title is not None:
                disaster_info['title'] = title.text
            
            description = item.find('description')
            if description is not None:
                disaster_info['description'] = description.text
            
            link = item.find('link')
            if link is not None:
                disaster_info['link'] = link.text
            
            pub_date = item.find('pubDate')
            if pub_date is not None:
                disaster_info['published_date'] = pub_date.text
            
            for child in item:
                if 'lat' in child.tag.lower():
                    try:
                        disaster_info['latitude'] = float(child.text)
                    except (ValueError, TypeError):
                        pass
                elif 'lon' in child.tag.lower() or 'lng' in child.tag.lower():
                    try:
                        disaster_info['longitude'] = float(child.text)
                    except (ValueError, TypeError):
                        pass
                elif 'severity' in child.tag.lower():
                    disaster_info['severity'] = child.text
                elif 'event' in child.tag.lower():
                    disaster_info['event_type'] = child.text
            
            if 'latitude' in disaster_info and 'longitude' in disaster_info:
                distance = calculate_distance(
                    target_lat, target_lon,
                    disaster_info['latitude'], disaster_info['longitude']
                )
                disaster_info['distance_km'] = round(distance, 2)
                
                if distance <= radius_km:
                    disasters.append(disaster_info)
        
        return disasters
        
    except ET.ParseError as e:
        print(f"Error parsing RSS XML: {str(e)}")
        return []
    except Exception as e:
        print(f"Error processing RSS feed: {str(e)}")
        return []
    
def calculate_distance(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371
    return c * r

def government_analysis_ai_agent(state: EmergencyState) -> EmergencyState:
    add_log_to_matrix(state, "🤖 AI AGENT: Government Analysis - Generating government report using Gemini AI...", "ai_agent_government", "info")
    
    if not state.get("analysis_ready", False):
        add_log_to_matrix(state, "❌ AI AGENT: Government Analysis - Cannot proceed: insufficient data", "ai_agent_government", "error")
        state["government_report"] = "Error: Insufficient data for analysis"
        state["agents_status"]["government_analysis_ai"] = "failed"
        return state
    
    image_bytes = state["image_bytes"]
    img_b64 = base64.b64encode(image_bytes).decode("utf-8")

    government_context = f"""
    EMERGENCY REPORT - GOVERNMENT RESPONSE TEAM

    TYPE: {state['emergencyType']}
    URGENCY: {state['urgencyLevel']}
    SITUATION: {state['situation']}
    AFFECTED: {state['peopleCount']}
    LOCATION: {state['latitude']}, {state['longitude']}
    AI ANALYSIS: {state['cnn_result']}
    WEATHER: {state['weather']}
    HISTORICAL: {state['gdac_disasters']}
    """

    gov_prompt = f"""
    {government_context}

    Analyze for government response. Provide:

    1. THREAT VERIFICATION
    - Genuine/False alarm assessment
    - Data source cross-check
    - Confidence: High/Medium/Low

    2. SEVERITY SCALE (1-10)
    - Rating with justification
    - Historical comparison
    - Impact assessment

    3. FUTURE PROJECTIONS
    - 6-24 hours
    - 1-7 days  
    - 1-4 weeks
    - Best/worst/likely scenarios
    - Critical decision points

    4. RESOURCE REQUIREMENTS
    - Personnel needs
    - Equipment/supplies
    - Specialized teams
    - Cost estimate

    Format as government emergency report with actionable recommendations.
    """

    try:
        response = gemini.invoke([
            HumanMessage(
                content=[
                    {"type": "text", "text": gov_prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{img_b64}"
                        }
                    }
                ]
            )
        ])
        state["government_report"] = response.content
        state["agents_status"]["government_analysis_ai"] = "completed"
        add_log_to_matrix(state, "✅ AI AGENT: Government Analysis - Report generated successfully", "ai_agent_government", "success")
    except Exception as e:
        state["government_report"] = f"Error generating government report: {str(e)}"
        state["agents_status"]["government_analysis_ai"] = "failed"
        add_log_to_matrix(state, f"❌ AI AGENT: Government Analysis - Failed: {str(e)}", "ai_agent_government", "error")
    
    return state

def citizen_survival_ai_agent(state: EmergencyState) -> EmergencyState:
    add_log_to_matrix(state, "🤖 AI AGENT: Citizen Survival - Generating survival guide using Gemini AI...", "ai_agent_citizen", "info")
    
    if not state.get("analysis_ready", False):
        add_log_to_matrix(state, "❌ AI AGENT: Citizen Survival - Cannot proceed: insufficient data", "ai_agent_citizen", "error")
        state["citizen_survival_guide"] = "Error: Insufficient data for guidance"
        state["agents_status"]["citizen_survival_ai"] = "failed"
        return state
    
    image_bytes = state["image_bytes"]
    img_b64 = base64.b64encode(image_bytes).decode("utf-8")

    citizen_context = f"""
    EMERGENCY SITUATION:
    TYPE: {state['emergencyType']}
    LOCATION: {state['latitude']}, {state['longitude']}
    WEATHER: {state['weather'].get('current_weather', {})}
    """

    citizen_prompt = f"""
    {citizen_context}

    Provide CONCISE SURVIVAL INSTRUCTIONS for {state['emergencyType']} disaster. Keep each point brief and specific:

    1. IMMEDIATE ACTIONS (next 30 minutes)
    - List 3-5 critical safety steps
    - Key hazards to avoid
    - Best safe position/location

    2. SITUATION PREDICTION (next 2-6 hours)
    - Expected conditions changes
    - Peak danger timeframe
    - Key warning signs to monitor

    3. SURVIVAL PRIORITIES
    - Essential shelter requirements
    - Water/food priorities
    - Medical concerns specific to {state['emergencyType']}
    - Protection needed from elements

    Use bullet points. Keep each point to 1-2 sentences maximum. Focus on actionable, specific guidance for {state['emergencyType']} in current conditions.
    """

    try:
        response = gemini.invoke([
            HumanMessage(
                content=[
                    {"type": "text", "text": citizen_prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{img_b64}"
                        }
                    }
                ]
            )
        ])
        state["citizen_survival_guide"] = response.content
        state["agents_status"]["citizen_survival_ai"] = "completed"
        add_log_to_matrix(state, "✅ AI AGENT: Citizen Survival - Guide generated successfully", "ai_agent_citizen", "success")
    except Exception as e:
        state["citizen_survival_guide"] = f"Error generating citizen guide: {str(e)}"
        state["agents_status"]["citizen_survival_ai"] = "failed"
        add_log_to_matrix(state, f"❌ AI AGENT: Citizen Survival - Failed: {str(e)}", "ai_agent_citizen", "error")
    
    return state

def computer_vision_analysis_tool(state: EmergencyState) -> EmergencyState:
    add_log_to_matrix(state, "🔧 DATA TOOL: Computer Vision - Processing image with CNN/YOLO models...", "data_tool_computer_vision", "info")
    
    try:
        image_bytes = state["image_bytes"]
        cnn_result = analyze_image_with_summary(BytesIO(image_bytes), disaster_model, yolo_model, device)
        state["cnn_result"] = cnn_result
        state["agents_status"]["computer_vision_tool"] = "completed"
        add_log_to_matrix(state, f"✅ DATA TOOL: Computer Vision - Analysis completed: {cnn_result[:100]}...", "data_tool_computer_vision", "success")
    except Exception as e:
        state["agents_status"]["computer_vision_tool"] = "failed"
        add_log_to_matrix(state, f"❌ DATA TOOL: Computer Vision - Failed: {str(e)}", "data_tool_computer_vision", "error")
    
    return state

def weather_data_collection_tool(state: EmergencyState) -> EmergencyState:
    add_log_to_matrix(state, "🌤️ DATA TOOL: Weather Collection - Fetching weather data from Open-Meteo API...", "data_tool_weather", "info")
    
    lat = state["latitude"]
    lon = state["longitude"]
    try:
        response = requests.get(
            f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true&hourly=temperature_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=7",
            timeout=10
        )
        state["weather"] = response.json()
        state["agents_status"]["weather_data_tool"] = "completed"
        add_log_to_matrix(state, "✅ DATA TOOL: Weather Collection - Weather data retrieved successfully", "data_tool_weather", "success")
    except Exception as e:
        state["weather"] = {"error": str(e)}
        state["agents_status"]["weather_data_tool"] = "failed"
        add_log_to_matrix(state, f"❌ DATA TOOL: Weather Collection - Failed: {str(e)}", "data_tool_weather", "error")
    return state

def disaster_history_collection_tool(state: EmergencyState) -> EmergencyState:
    add_log_to_matrix(state, "📊 DATA TOOL: Disaster History - Fetching current disaster data from GDACS RSS feed...", "data_tool_disaster_history", "info")
    
    lat = float(state["latitude"])
    lon = float(state["longitude"])
    radius_km = 20
    
    try:
        response = requests.get(
            "https://www.gdacs.org/xml/rss.xml",
            timeout=15,
            headers={'User-Agent': 'Emergency Response System/1.0'}
        )
        response.raise_for_status()
        
        nearby_disasters = parse_gdacs_rss_feed(response.content, lat, lon, radius_km)
        
        gdac_data = {
            "search_location": {
                "latitude": lat,
                "longitude": lon,
                "search_radius_km": radius_km
            },
            "nearby_disasters": nearby_disasters,
            "total_disasters_found": len(nearby_disasters),
            "last_updated": datetime.now().isoformat(),
            "data_source": "GDACS RSS Feed"
        }
        
        state["gdac_disasters"] = gdac_data
        state["agents_status"]["disaster_history_tool"] = "completed"
        
        if nearby_disasters:
            add_log_to_matrix(state, f"✅ DATA TOOL: Disaster History - Found {len(nearby_disasters)} disasters within {radius_km}km", "data_tool_disaster_history", "success")
        else:
            add_log_to_matrix(state, f"✅ DATA TOOL: Disaster History - No active disasters found within {radius_km}km radius", "data_tool_disaster_history", "success")
            
    except Exception as e:
        error_msg = f"Error processing GDACS RSS feed: {str(e)}"
        state["gdac_disasters"] = {"error": error_msg}
        state["agents_status"]["disaster_history_tool"] = "failed"
        add_log_to_matrix(state, f"❌ DATA TOOL: Disaster History - {error_msg}", "data_tool_disaster_history", "error")
    
    return state

def parallel_data_collection_coordinator(state: EmergencyState) -> EmergencyState:
    add_log_to_matrix(state, "🔄 SYSTEM COORDINATOR: Data Collection - Starting parallel data collection...", "system_coordinator_data", "info")
    
    state["agents_status"] = {
        "computer_vision_tool": "pending",
        "weather_data_tool": "pending", 
        "disaster_history_tool": "pending",
        "government_analysis_ai": "pending",
        "citizen_survival_ai": "pending"
    }
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        cv_future = executor.submit(computer_vision_analysis_tool, state.copy())
        weather_future = executor.submit(weather_data_collection_tool, state.copy())
        disaster_future = executor.submit(disaster_history_collection_tool, state.copy())
        
        cv_result = cv_future.result()
        weather_result = weather_future.result()
        disaster_result = disaster_future.result()
        
        state["cnn_result"] = cv_result["cnn_result"]
        state["weather"] = weather_result["weather"]
        state["gdac_disasters"] = disaster_result["gdac_disasters"]
        state["agents_status"]["computer_vision_tool"] = cv_result["agents_status"]["computer_vision_tool"]
        state["agents_status"]["weather_data_tool"] = weather_result["agents_status"]["weather_data_tool"]
        state["agents_status"]["disaster_history_tool"] = disaster_result["agents_status"]["disaster_history_tool"]
        
        if "ai_matrix_logs" in cv_result:
            state["ai_matrix_logs"].extend(cv_result["ai_matrix_logs"])
        if "ai_matrix_logs" in weather_result:
            state["ai_matrix_logs"].extend(weather_result["ai_matrix_logs"])
        if "ai_matrix_logs" in disaster_result:
            state["ai_matrix_logs"].extend(disaster_result["ai_matrix_logs"])
    
    state["parallel_tasks_completed"] = True
    add_log_to_matrix(state, "✅ SYSTEM COORDINATOR: Data Collection - All data collection tasks completed", "system_coordinator_data", "success")
    return state

def data_validation_coordinator(state: EmergencyState) -> EmergencyState:
    add_log_to_matrix(state, "🔍 SYSTEM COORDINATOR: Data Validation - Validating collected data...", "system_coordinator_validation", "info")
    
    validation_results = {
        "computer_vision": bool(state.get("cnn_result")),
        "weather_data": "error" not in state.get("weather", {}),
        "disaster_history": "error" not in state.get("gdac_disasters", {})
    }
    
    state["analysis_ready"] = validation_results["computer_vision"]
    
    add_log_to_matrix(state, f"✅ SYSTEM COORDINATOR: Data Validation - Validation complete. Ready for AI analysis: {state['analysis_ready']}", "system_coordinator_validation", "success")
    return state

def parallel_ai_analysis_coordinator(state: EmergencyState) -> EmergencyState:
    add_log_to_matrix(state, "🔄 SYSTEM COORDINATOR: AI Analysis - Starting parallel AI agent analysis...", "system_coordinator_ai_analysis", "info")
    
    if not state.get("analysis_ready", False):
        add_log_to_matrix(state, "❌ SYSTEM COORDINATOR: AI Analysis - Cannot proceed: data validation failed", "system_coordinator_ai_analysis", "error")
        return state
    
    with ThreadPoolExecutor(max_workers=2) as executor:
        gov_future = executor.submit(government_analysis_ai_agent, state.copy())
        citizen_future = executor.submit(citizen_survival_ai_agent, state.copy())
        
        gov_result = gov_future.result()
        citizen_result = citizen_future.result()
        
        state["government_report"] = gov_result["government_report"]
        state["citizen_survival_guide"] = citizen_result["citizen_survival_guide"]
        state["agents_status"]["government_analysis_ai"] = gov_result["agents_status"]["government_analysis_ai"]
        state["agents_status"]["citizen_survival_ai"] = citizen_result["agents_status"]["citizen_survival_ai"]
        
        if "ai_matrix_logs" in gov_result:
            state["ai_matrix_logs"].extend(gov_result["ai_matrix_logs"])
        if "ai_matrix_logs" in citizen_result:
            state["ai_matrix_logs"].extend(citizen_result["ai_matrix_logs"])
    
    add_log_to_matrix(state, "✅ SYSTEM COORDINATOR: AI Analysis - All AI agent analysis tasks completed", "system_coordinator_ai_analysis", "success")
    return state

def final_system_coordinator(state: EmergencyState) -> EmergencyState:
    add_log_to_matrix(state, "🎯 SYSTEM COORDINATOR: Final Processing - Finalizing emergency response...", "system_coordinator_final", "info")
    
    completed_components = sum(1 for status in state["agents_status"].values() if status == "completed")
    total_components = len(state["agents_status"])
    
    add_log_to_matrix(state, f"📊 Processing Summary: {completed_components}/{total_components} components completed successfully", "system_coordinator_final", "info")
    
    critical_tools = ["computer_vision_tool"]
    critical_success = all(state["agents_status"].get(tool) == "completed" for tool in critical_tools)
    
    if critical_success and completed_components >= len(critical_tools):
        state["status"] = "accepted"
        add_log_to_matrix(state, "✅ SYSTEM COORDINATOR: Final Processing - Emergency response ACCEPTED", "system_coordinator_final", "success")
    else:
        state["status"] = "rejected"
        add_log_to_matrix(state, "❌ SYSTEM COORDINATOR: Final Processing - Emergency response REJECTED due to insufficient data", "system_coordinator_final", "error")
    
    return state

def create_multiagent_emergency_graph():
    print("🏗️ Creating Multiagent Emergency Response System...")
    
    graph = StateGraph(EmergencyState)
    
    graph.add_node("parallel_data_collection", parallel_data_collection_coordinator)
    graph.add_node("data_validation", data_validation_coordinator)
    graph.add_node("parallel_ai_analysis", parallel_ai_analysis_coordinator)
    graph.add_node("final_coordinator", final_system_coordinator)

    graph.set_entry_point("parallel_data_collection")
    graph.add_edge("parallel_data_collection", "data_validation")
    graph.add_edge("data_validation", "parallel_ai_analysis")
    graph.add_edge("parallel_ai_analysis", "final_coordinator")
    graph.set_finish_point("final_coordinator")

    print("✅ Multiagent Emergency Response System created successfully!")
    return graph.compile()

multiagent_graph = create_multiagent_emergency_graph()

async def handle_emergency_report(
    emergencyType,
    urgencyLevel,
    situation,
    peopleCount,
    latitude,
    longitude,
    image,
    user
):
    print("🚨 MULTIAGENT EMERGENCY RESPONSE SYSTEM ACTIVATED 🚨")
    
    if image is None:
        return {"error": "No image uploaded"}

    submitted_time = time.time()
    ai_processing_start_time = time.time()
    
    disaster_id = generate_geohash_date_uuid(latitude, longitude)
    print(f"📋 Generated Disaster ID: {disaster_id}")
    
    # Fix: Handle different types of image objects
    try:
        if hasattr(image, 'read'):
            # If it's a file-like object (FastAPI UploadFile, etc.)
            image_bytes = await image.read()
        elif hasattr(image, 'file'):
            # If it's a form file object
            image_bytes = image.file.read()
        elif isinstance(image, bytes):
            # If it's already bytes
            image_bytes = image
        else:
            # Try to read as file
            with open(image, 'rb') as f:
                image_bytes = f.read()
    except Exception as e:
        print(f"Error reading image: {str(e)}")
        return {"error": f"Failed to read image: {str(e)}"}
    
    print("📤 Uploading image to Appwrite Storage...")
    image_url = upload_disaster_image_to_storage(image_bytes, disaster_id)

    # Rest of the function remains the same...
    initial_state: EmergencyState = {
        "image_bytes": image_bytes,
        "emergencyType": emergencyType,
        "urgencyLevel": urgencyLevel,
        "situation": situation,
        "peopleCount": peopleCount,
        "latitude": latitude,
        "longitude": longitude,
        "cnn_result": "",
        "weather": {},
        "gdac_disasters": {},
        "government_report": "",
        "citizen_survival_guide": "",
        "user_id": getattr(user, 'uid', 'anonymous'),
        "submitted_time": submitted_time,
        "ai_processing_start_time": ai_processing_start_time,
        "ai_processing_end_time": 0,
        "status": "pending",
        "image_url": image_url,
        "agents_status": {},
        "parallel_tasks_completed": False,
        "analysis_ready": False,
        "ai_matrix_logs": []  
    }

    add_log_to_matrix(initial_state, "🚨 MULTIAGENT EMERGENCY RESPONSE SYSTEM ACTIVATED 🚨", "system", "info")
    add_log_to_matrix(initial_state, f"📋 Generated Disaster ID: {disaster_id}", "system", "info")
    
    final_state = multiagent_graph.invoke(initial_state)
    
    ai_processing_end_time = time.time()
    final_state["ai_processing_end_time"] = ai_processing_end_time
    
    processing_time = ai_processing_end_time - ai_processing_start_time
    
    add_log_to_matrix(final_state, f"⏱️ Total Processing Time: {processing_time:.2f} seconds", "system", "info")
    
    add_log_to_matrix(final_state, "💾 Saving to Appwrite Database...", "system", "info")
    save_success = save_disaster_to_database(final_state, disaster_id, processing_time)
    
    if not save_success:
        add_log_to_matrix(final_state, "❌ Failed to save disaster report to database", "system", "error")
        return {"error": "Failed to save disaster report to database"}

    add_log_to_matrix(final_state, "💾 Saving AI Matrix logs to database...", "system", "info")
    ai_matrix_success = save_ai_matrix_to_appwrite(final_state, disaster_id)
    
    if ai_matrix_success:
        add_log_to_matrix(final_state, "✅ AI Matrix logs saved successfully", "system", "success")
    else:
        add_log_to_matrix(final_state, "❌ Failed to save AI Matrix logs", "system", "error")

    add_log_to_matrix(final_state, "🎉 MULTIAGENT EMERGENCY RESPONSE COMPLETED SUCCESSFULLY!", "system", "success")
    
    return {
        "disaster_id": disaster_id,
        "government_report": final_state["government_report"],
        "citizen_survival_guide": final_state["citizen_survival_guide"],
        "processing_time": processing_time,
        "image_url": image_url,
        "status": final_state["status"],
        "agents_status": final_state["agents_status"],  
        "ai_matrix_saved": ai_matrix_success  
    }
def upload_disaster_image_to_storage(image_bytes: bytes, disaster_id: str) -> str:
    try:
        return appwrite_service.upload_disaster_image_to_storage(
            image_bytes=image_bytes,
            disaster_id=disaster_id
        )
    except Exception as e:
        print(f"Error uploading image: {str(e)}")
        return ""

def save_disaster_to_database(state: EmergencyState, disaster_id: str, processing_time: float):
    try:
        disaster_data = {
            'disaster_id': disaster_id,
            'emergency_type': state['emergencyType'],
            'urgency_level': state['urgencyLevel'],
            'situation': state['situation'],
            'people_count': state['peopleCount'],
            'latitude': float(state['latitude']),
            'longitude': float(state['longitude']),
            'government_report': state['government_report'],
            'citizen_survival_guide': state['citizen_survival_guide'],
            'user_id': state['user_id'],
            'submitted_time': state['submitted_time'],
            'ai_processing_time': float(processing_time),
            'status': "pending",
            'image_url': state['image_url'],
            'geohash': pgh.encode(float(state['latitude']), float(state['longitude']), precision=4)
        }
        appwrite_service.save_disaster_to_database(disaster_data)
        print(f"Disaster {disaster_id} saved to Appwrite Database")
        return True
    except Exception as e:
        print(f"Error saving to Appwrite Database: {str(e)}")
        return False
    

def save_ai_matrix_to_appwrite(state: EmergencyState, disaster_id: str):
    try:
        total_components = len(state["agents_status"])
        completed_components = sum(1 for status in state["agents_status"].values() if status == "completed")
        failed_components = sum(1 for status in state["agents_status"].values() if status == "failed")
        success_rate = (completed_components / total_components * 100) if total_components > 0 else 0.0

        components_summary_dict = {
            "total": total_components,
            "completed": completed_components,
            "failed": failed_components,
            "success_rate": round(success_rate, 2)
        }
        components_summary_json = json.dumps(components_summary_dict)

        components_status_json = json.dumps(state.get("agents_status", {}))

        emergency_context_str = (
            f"Type: {state['emergencyType']}, "
            f"Urgency: {state['urgencyLevel']}, "
            f"People: {state['peopleCount']}, "
            f"Lat: {state['latitude']}, "
            f"Lon: {state['longitude']}"
        )

        logs_json = json.dumps(state.get("ai_matrix_logs", []))
        if len(logs_json) > 49950:
            truncated_logs = state.get('ai_matrix_logs', [])[:10]
            logs_json = json.dumps(truncated_logs + [{"message": "Logs truncated due to size limit"}])

        ai_matrix_data = {
            'disaster_id': disaster_id,
            'processing_start_time': state['ai_processing_start_time'],
            'processing_end_time': state['ai_processing_end_time'],
            'total_processing_time': state['ai_processing_end_time'] - state['ai_processing_start_time'],
            'components_summary': components_summary_json,
            'components_status': components_status_json,
            'final_status': state['status'],
            'logs': logs_json,
            'emergency_context': emergency_context_str
        }

        appwrite_service.save_ai_matrix_to_appwrite(ai_matrix_data)
        print(f"AI Matrix for disaster {disaster_id} saved to Appwrite Database")
        return True
    except Exception as e:
        print(f"Error saving AI Matrix to Appwrite Database: {str(e)}")
        return False