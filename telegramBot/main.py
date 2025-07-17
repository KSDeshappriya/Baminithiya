from pyrogram import Client, filters
from pyrogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, ReplyKeyboardMarkup, KeyboardButton
import time
import json
import re
import os
from config import Config
from disaster_api import DisasterAPI
import traceback

# Initialize API client
api = DisasterAPI()

# Create the Pyrogram client
app = Client(
    "disaster_alert_bot",
    api_id=Config.API_ID,
    api_hash=Config.API_HASH,
    bot_token=Config.BOT_TOKEN
)

# Helper function to create a Google Maps link
def create_map_link(lat, lng):
    return f"https://www.google.com/maps?q={lat},{lng}"

# Start command
@app.on_message(filters.command("start") & filters.private)
async def start_command(client, message):
    await message.reply(
        "👋 Welcome to the Disaster Alert Bot!\n\n"
        "I can help you find nearby disasters and emergencies, report new incidents, "
        "and request help during emergencies.\n\n"
        "Please use /help to see all available commands."
    )

# Help command
@app.on_message(filters.command("help") & filters.private)
async def help_command(client, message):
    help_text = (
        "**Available Commands:**\n\n"
        "📍 **Location Services:**\n"
        "/nearby - Find disasters near your current location\n"
        "🚨 **Emergency Services:**\n"
        "/status - Check current disaster status in system\n"
        "/report - Report a new emergency\n"
        "👤 **User Account:**\n"
        "/login - Sign in to your account\n"
        "   Please enter your credentials in the format:\n"
        "   /login email password\n"
        "/profile - View your profile information\n"
        "/dashboard - Access your user dashboard\n\n"
        "/logout - Sign out from your account"
    )
    await message.reply(help_text)

# Process login information
@app.on_message(filters.regex(r"^/login\s+(\S+)\s+(.+)$") & filters.private)
async def process_login(client, message):
    # Extract email and password from the command
    match = re.match(r"^/login\s+(\S+)\s+(.+)$", message.text)
    if not match:
        await message.reply(
            "🔐 **Login Required**\n\n"
            "Please enter your credentials in the format:\n"
            "/login email password\n\n"
            "Example: /login johndoe@example.com mypassword"
        )
        return
    
    email = match.group(1)
    password = match.group(2)
    
    # Optional: Debug what was captured (remove in production)
    # await message.reply(f"Debug - Email: {email}, Password length: {len(password)}")
    
    # Request location
    location_button = KeyboardButton(
        "Share Location 📍", 
        request_location=True
    )
    reply_markup = ReplyKeyboardMarkup(
        [[location_button]],
        resize_keyboard=True,
        one_time_keyboard=True
    )
    
    await message.reply(
        f"Please share your current location to complete login:",
        reply_markup=reply_markup
    )
    
    # Store credentials temporarily
    Config.USER_SESSIONS[message.from_user.id] = {
        "email": email,
        "password": password,
        "login_pending": True
    }

# Handle location for login
@app.on_message(filters.location & filters.private)
async def handle_location(client, message):
    user_id = message.from_user.id
    
    # Check if we're waiting for a location for login
    if user_id in Config.USER_SESSIONS and Config.USER_SESSIONS[user_id].get("login_pending"):
        # Get location data
        latitude = message.location.latitude
        longitude = message.location.longitude
        
        # Get stored credentials
        email = Config.USER_SESSIONS[user_id]["email"]
        password = Config.USER_SESSIONS[user_id]["password"]
        
        # Send login request
        loading_msg = await message.reply("Logging in, please wait...")
        login_result = api.login(email, password, latitude, longitude)
        
        if "error" in login_result:
            await loading_msg.edit_text(f"❌ Login failed: {login_result['error']}")
            Config.USER_SESSIONS.pop(user_id, None)
            return
        
        # Store the token
        Config.USER_SESSIONS[user_id] = {
            "token": login_result["access_token"],
            "user_info": login_result["user_info"]
        }
        
        # Set token for this user's API requests
        api.set_auth_token(login_result["access_token"])
        
        await loading_msg.edit_text(
            f"✅ Login successful! Welcome {login_result['user_info'].get('name', 'User')}.\n\n"
            f"Use /dashboard to view your information or /nearby to check disasters in your area."
        )
    # Check if we're waiting for a location for an emergency report
    elif user_id in Config.USER_SESSIONS and Config.USER_SESSIONS[user_id].get("waiting_for_report_location"):
        # Get location data
        latitude = message.location.latitude
        longitude = message.location.longitude
        
        # Get stored report data
        report_data = Config.USER_SESSIONS[user_id]["report_data"]
        report_data["latitude"] = str(latitude)
        report_data["longitude"] = str(longitude)
        
        # Ask for an optional image
        await message.reply(
            "If you have a photo of the emergency, please upload it now.\n"
            "Or type /skip to submit the report without an image."
        )
        
        # Update the session state
        Config.USER_SESSIONS[user_id]["waiting_for_report_image"] = True
        Config.USER_SESSIONS[user_id]["waiting_for_report_location"] = False
    else:
        # Process as a regular location sharing for nearby disasters
        latitude = message.location.latitude
        longitude = message.location.longitude
        
        loading_msg = await message.reply("Searching for nearby disasters...")
        
        # Call the API to get nearby disasters
        nearby_data = api.check_nearby_disasters(latitude, longitude)
        
        if "error" in nearby_data:
            await loading_msg.edit_text(f"❌ Error: {nearby_data['error']}")
            return
        
        if not nearby_data or len(nearby_data) == 0:
            await loading_msg.edit_text("✅ Good news! No disasters reported in your area.")
            return
        
        # Format the response
        response = "🚨 **Nearby Disasters:**\n\n"
        
        for idx, disaster in enumerate(nearby_data, 1):
            # Use the correct keys from the actual API response
            disaster_type = disaster.get("emergency_type", "Unknown")
            urgency = disaster.get("urgency_level", "Unknown")
            people_affected = disaster.get("people_count", "Unknown")
            lat = disaster.get("latitude")
            lng = disaster.get("longitude")
            # situation = disaster.get("situation", "No details available")
            status = disaster.get("status", "active")
            
            response += f"**{idx}. {disaster_type.title()} - {urgency.title()} Urgency**\n"
            response += f"Status: {status.title()}\n"
            response += f"People affected: {people_affected}\n"
            # response += f"Situation: {situation[:50]}{'...' if len(situation) > 50 else ''}\n"
            
            if lat and lng:
                map_link = create_map_link(lat, lng)
                response += f"[View on Map]({map_link})\n"
            
            response += "\n"
        
        await loading_msg.edit_text(response)

# Profile command
@app.on_message(filters.command("profile") & filters.private)
async def profile_command(client, message):
    user_id = message.from_user.id
    
    # Check if user is logged in
    if user_id not in Config.USER_SESSIONS or "token" not in Config.USER_SESSIONS[user_id]:
        await message.reply(
            "❌ You are not logged in. Please use /login to sign in first."
        )
        return
    
    # Get the token
    token = Config.USER_SESSIONS[user_id]["token"]
    
    # Get profile data
    loading_msg = await message.reply("Fetching your profile...")
    profile_data = api.get_user_profile(token)
    
    if "error" in profile_data:
        await loading_msg.edit_text(f"❌ Error: {profile_data['error']}")
        return
    
    # Format the response
    response = "👤 **Your Profile:**\n\n"
    response += f"**Name:** {profile_data.get('name', 'N/A')}\n"
    response += f"**Email:** {profile_data.get('email', 'N/A')}\n"
    response += f"**Phone:** {profile_data.get('phone', 'N/A')}\n"
    response += f"**Role:** {profile_data.get('role', 'N/A')}\n"
    
    if profile_data.get('skills'):
        response += f"**Skills:** {', '.join(profile_data['skills'])}\n"
    
    if profile_data.get('department'):
        response += f"**Department:** {profile_data.get('department')}\n"
    
    if profile_data.get('unit'):
        response += f"**Unit:** {profile_data.get('unit')}\n"
    
    if profile_data.get('position'):
        response += f"**Position:** {profile_data.get('position')}\n"
    
    await loading_msg.edit_text(response)

# Dashboard command
@app.on_message(filters.command("dashboard") & filters.private)
async def dashboard_command(client, message):
    user_id = message.from_user.id
    
    # Check if user is logged in
    if user_id not in Config.USER_SESSIONS or "token" not in Config.USER_SESSIONS[user_id]:
        await message.reply(
            "❌ You are not logged in. Please use /login to sign in first."
        )
        return
    
    # Set the token for API requests
    api.set_auth_token(Config.USER_SESSIONS[user_id]["token"])
    
    # Get dashboard data
    loading_msg = await message.reply("Fetching your dashboard...")
    dashboard_data = api.get_user_dashboard()
    
    if "error" in dashboard_data:
        await loading_msg.edit_text(f"❌ Error: {dashboard_data['error']}")
        return
    
    # Format the response - this will depend on what the actual API returns
    response = "📊 **Your Dashboard:**\n\n"
    
    # This is a generic formatter, adjust based on actual API response structure
    if isinstance(dashboard_data, dict):
        for key, value in dashboard_data.items():
            if isinstance(value, dict) or isinstance(value, list):
                response += f"**{key.replace('_', ' ').title()}:** {json.dumps(value)[:100]}...\n"
            else:
                response += f"**{key.replace('_', ' ').title()}:** {value}\n"
    else:
        response += str(dashboard_data)
    
    await loading_msg.edit_text(response)

# Status command
@app.on_message(filters.command("status") & filters.private)
async def status_command(client, message):
    loading_msg = await message.reply("Checking disaster status...")
    
    status_data = api.check_disaster_status()
    
    if "error" in status_data:
        await loading_msg.edit_text(f"❌ Error: {status_data['error']}")
        return
    
    # Format the response based on what the API returns
    response = "🌍 **Current Disaster Status:**\n\n"
    
    # This is a generic formatter, adjust based on actual API response structure
    if isinstance(status_data, dict):
        for key, value in status_data.items():
            if isinstance(value, dict) or isinstance(value, list):
                response += f"**{key.replace('_', ' ').title()}:** {json.dumps(value)[:100]}...\n"
            else:
                response += f"**{key.replace('_', ' ').title()}:** {value}\n"
    else:
        response += str(status_data)
    
    await loading_msg.edit_text(response)

# Nearby command with address
@app.on_message(filters.command("nearby") & filters.private)
async def nearby_command(client, message):
    # Check if address is provided
    if len(message.command) == 1:
        location_button = KeyboardButton(
            "Share Location 📍", 
            request_location=True
        )
        reply_markup = ReplyKeyboardMarkup(
            [[location_button]],
            resize_keyboard=True,
            one_time_keyboard=True
        )
        
        await message.reply(
            "Please share your location to find nearby disasters:",
            reply_markup=reply_markup
        )
        return
    
    # Get the address from command
    address = " ".join(message.command[1:])
    
    # Here you would normally geocode the address to get coordinates
    # For this example, we'll just inform the user that geocoding isn't implemented
    await message.reply(
        "📍 To check disasters near you, please share your location directly using the location button."
    )

# Report command - Improved with a guided step-by-step flow
@app.on_message(filters.command("report") & filters.private)
async def report_command(client, message):
    user_id = message.from_user.id
    
    # Check if user is logged in
    if user_id not in Config.USER_SESSIONS or "token" not in Config.USER_SESSIONS[user_id]:
        await message.reply(
            "❌ You are not logged in. Please use /login to sign in first."
        )
        return
    
    # Initialize the report data
    if "report_data" not in Config.USER_SESSIONS[user_id]:
        Config.USER_SESSIONS[user_id]["report_data"] = {
            "userId": Config.USER_SESSIONS[user_id]["user_info"]["uid"]
        }
    # Start the step-by-step reporting flow
    Config.USER_SESSIONS[user_id]["report_step"] = "type"
    
    # Ask for emergency type
    emergency_types = [
        "Fire", "Flood", "Earthquake", "Storm", "Other"
    ]
    
    buttons = []
    row = []
    for i, e_type in enumerate(emergency_types):
        row.append(InlineKeyboardButton(e_type, callback_data=f"e_type_{e_type}"))
        if (i + 1) % 2 == 0 or i == len(emergency_types) - 1:
            buttons.append(row)
            row = []
    
    reply_markup = InlineKeyboardMarkup(buttons)
    
    await message.reply(
        "🚨 **Emergency Reporting - Step 1 of 4**\n\n"
        "Please select the type of emergency:",
        reply_markup=reply_markup
    )

# Handle callback for emergency type selection
@app.on_callback_query(filters.regex(r"^e_type_"))
async def handle_emergency_type(client, callback_query):
    user_id = callback_query.from_user.id
    
    # Check if user is in the reporting flow
    if (user_id not in Config.USER_SESSIONS or 
        "report_step" not in Config.USER_SESSIONS[user_id] or
        Config.USER_SESSIONS[user_id]["report_step"] != "type"):
        await callback_query.answer("Error: Please start the report process again with /report")
        return
    
    # Get the emergency type
    emergency_type = callback_query.data.replace("e_type_", "")
    
    # Store the emergency type
    Config.USER_SESSIONS[user_id]["report_data"]["emergencyType"] = emergency_type
    
    # Move to the next step - urgency level
    Config.USER_SESSIONS[user_id]["report_step"] = "urgency"
    
    # Create buttons for urgency levels
    urgency_levels = [
        "Low", "Medium", "High", "Critical"
    ]
    
    buttons = []
    for level in urgency_levels:
        buttons.append([InlineKeyboardButton(level, callback_data=f"e_urgency_{level}")])
    
    reply_markup = InlineKeyboardMarkup(buttons)
    
    # Answer the callback to clear the loading state
    await callback_query.answer()
    
    # Send the urgency selection message
    await callback_query.message.edit_text(
        f"🚨 **Emergency Reporting - Step 2 of 4**\n\n"
        f"Emergency Type: **{emergency_type}**\n\n"
        f"Please select the urgency level:",
        reply_markup=reply_markup
    )

# Handle callback for urgency level selection
@app.on_callback_query(filters.regex(r"^e_urgency_"))
async def handle_emergency_urgency(client, callback_query):
    user_id = callback_query.from_user.id
    
    # Check if user is in the reporting flow
    if (user_id not in Config.USER_SESSIONS or 
        "report_step" not in Config.USER_SESSIONS[user_id] or
        Config.USER_SESSIONS[user_id]["report_step"] != "urgency"):
        await callback_query.answer("Error: Please start the report process again with /report")
        return
    
    # Get the urgency level
    urgency_level = callback_query.data.replace("e_urgency_", "")
    
    # Store the urgency level
    Config.USER_SESSIONS[user_id]["report_data"]["urgencyLevel"] = urgency_level
    
    # Move to the next step - asking for situation details
    Config.USER_SESSIONS[user_id]["report_step"] = "situation"
    
    # Answer the callback to clear the loading state
    await callback_query.answer()
    
    # Ask for situation details
    await callback_query.message.edit_text(
        f"🚨 **Emergency Reporting - Step 3 of 4**\n\n"
        f"Emergency Type: **{Config.USER_SESSIONS[user_id]['report_data']['emergencyType']}**\n"
        f"Urgency Level: **{urgency_level}**\n\n"
        f"Please describe the situation briefly.\n"
        f"Reply to this message with a description."
    )

# Handle text response for situation description
@app.on_message(filters.text & filters.private & filters.reply)
async def handle_situation_description(client, message):
    user_id = message.from_user.id
    
    # Check if user is in the reporting flow waiting for situation description
    if (user_id in Config.USER_SESSIONS and 
        "report_step" in Config.USER_SESSIONS[user_id] and
        Config.USER_SESSIONS[user_id]["report_step"] == "situation"):
        
        # Get the situation description
        situation = message.text
        
        # Store the situation
        Config.USER_SESSIONS[user_id]["report_data"]["situation"] = situation
        
        # Move to the next step - asking for people count
        Config.USER_SESSIONS[user_id]["report_step"] = "people_count"
        
        # Create buttons for common people count ranges
        people_ranges = [
            "1-5", "6-10", "11-20", "21-50", "51-100", "100+"
        ]
        
        buttons = []
        row = []
        for i, count in enumerate(people_ranges):
            row.append(InlineKeyboardButton(count, callback_data=f"e_people_{count}"))
            if (i + 1) % 3 == 0 or i == len(people_ranges) - 1:
                buttons.append(row)
                row = []
        
        buttons.append([InlineKeyboardButton("Not sure", callback_data="e_people_unknown")])
        
        reply_markup = InlineKeyboardMarkup(buttons)
        
        # Ask for people count
        await message.reply(
            f"🚨 **Emergency Reporting - Step 4 of 4**\n\n"
            f"Emergency Type: **{Config.USER_SESSIONS[user_id]['report_data']['emergencyType']}**\n"
            f"Urgency Level: **{Config.USER_SESSIONS[user_id]['report_data']['urgencyLevel']}**\n"
            f"Situation: **{situation[:30]}{'...' if len(situation) > 30 else ''}**\n\n"
            f"Approximately how many people are affected?",
            reply_markup=reply_markup
        )

# Handle callback for people count selection
@app.on_callback_query(filters.regex(r"^e_people_"))
async def handle_people_count(client, callback_query):
    user_id = callback_query.from_user.id
    
    # Check if user is in the reporting flow
    if (user_id not in Config.USER_SESSIONS or 
        "report_step" not in Config.USER_SESSIONS[user_id] or
        Config.USER_SESSIONS[user_id]["report_step"] != "people_count"):
        await callback_query.answer("Error: Please start the report process again with /report")
        return
    
    # Get the people count
    people_count = callback_query.data.replace("e_people_", "")
    
    # Store the people count
    Config.USER_SESSIONS[user_id]["report_data"]["peopleCount"] = people_count
    
    # Move to the next step - asking for location
    Config.USER_SESSIONS[user_id]["report_step"] = "location"
    Config.USER_SESSIONS[user_id]["waiting_for_report_location"] = True
    
    # Answer the callback to clear the loading state
    await callback_query.answer()
    
    # Ask for location
    location_button = KeyboardButton(
        "Share Emergency Location 📍", 
        request_location=True
    )
    reply_markup = ReplyKeyboardMarkup(
        [[location_button]],
        resize_keyboard=True,
        one_time_keyboard=True
    )
    
    # Show summary and ask for location
    report_data = Config.USER_SESSIONS[user_id]["report_data"]
    
    await callback_query.message.reply(
        f"📋 **Emergency Report Summary:**\n\n"
        f"Type: **{report_data['emergencyType']}**\n"
        f"Urgency: **{report_data['urgencyLevel']}**\n"
        f"People affected: **{report_data['peopleCount']}**\n"
        f"Situation: **{report_data['situation'][:50]}{'...' if len(report_data['situation']) > 50 else ''}**\n\n"
        f"Please share the location of the emergency:",
        reply_markup=reply_markup
    )

# Handle location for emergency report
@app.on_message(filters.location & filters.private)
async def handle_report_location(client, message):
    user_id = message.from_user.id
    
    # Check if we're waiting for a location for an emergency report
    if (user_id in Config.USER_SESSIONS and 
        Config.USER_SESSIONS[user_id].get("waiting_for_report_location") and
        "report_data" in Config.USER_SESSIONS[user_id]):
        
        # Get location data
        latitude = message.location.latitude
        longitude = message.location.longitude
        
        # Get stored report data
        report_data = Config.USER_SESSIONS[user_id]["report_data"]
        report_data["latitude"] = str(latitude)
        report_data["longitude"] = str(longitude)
        
        # Ask for an optional image
        await message.reply(
            "Which you have a photo of the emergency, please upload it now."
            # "Or type /skip to submit the report without an image."
        )
        
        # Update the session state
        Config.USER_SESSIONS[user_id]["waiting_for_report_image"] = True
        Config.USER_SESSIONS[user_id]["waiting_for_report_location"] = False
        
    # If not waiting for report location, handle as a regular location request
    elif user_id not in Config.USER_SESSIONS or not Config.USER_SESSIONS[user_id].get("waiting_for_report_location"):
        await handle_location(client, message)


# Handle photo uploads for emergency reports
@app.on_message(filters.photo & filters.private)
async def handle_report_photo(client, message):
    user_id = message.from_user.id
    
    # Check if we're waiting for a photo for an emergency report
    if (user_id in Config.USER_SESSIONS and 
        Config.USER_SESSIONS[user_id].get("waiting_for_report_image") and
        "report_data" in Config.USER_SESSIONS[user_id]):
        
        loading_msg = await message.reply("Processing your image...")

        # --- START: Re-introduce temp_downloads directory logic ---
        # Define a temporary directory within your bot's working directory
        temp_dir = "temp_downloads"
        try:
            os.makedirs(temp_dir, exist_ok=True) # Create the directory if it doesn't exist
            print(f"DEBUG: Ensured temporary directory exists: {os.path.abspath(temp_dir)}")
        except OSError as e:
            # Catch specific OS errors if directory creation fails (e.g., permission denied)
            traceback.print_exc()
            await loading_msg.edit_text(f"❌ Error: Could not create temporary directory '{temp_dir}': {e}. Check bot permissions.")
            return # Exit if we can't even create the directory

        # Generate a unique temporary image filename
        image_filename = f"emergency_image_{user_id}_{int(time.time())}.jpg"
        # Join the temporary directory path and the filename
        image_path = os.path.join(temp_dir, image_filename)
        # --- END: Re-introduce temp_downloads directory logic ---

        print(f"DEBUG: Attempting to download image to: {image_path}")
        
        try:
            # Download the image from Telegram
            await client.download_media(message.photo, file_name=image_path)
            
            # Verify if the file was actually downloaded
            if not os.path.exists(image_path):
                print(f"ERROR: File was not created at {image_path} after download_media!")
                # Re-raise the error so the outer except block can handle it and show traceback
                raise FileNotFoundError(f"Failed to download image to {image_path}. File not found after download.")
            print(f"DEBUG: Image successfully downloaded to: {image_path}")
            
            # Authentication check
            if user_id not in Config.USER_SESSIONS or "token" not in Config.USER_SESSIONS[user_id]:
                await loading_msg.edit_text("❌ Authentication token missing. Please log in again.")
                # Clean up the downloaded file if authentication fails
                if os.path.exists(image_path):
                    os.remove(image_path)
                # Clean up session state
                Config.USER_SESSIONS[user_id].pop("waiting_for_report_location", None)
                Config.USER_SESSIONS[user_id].pop("waiting_for_report_image", None)
                Config.USER_SESSIONS[user_id].pop("report_data", None)
                Config.USER_SESSIONS[user_id].pop("report_step", None)
                return # Exit early if not authenticated

            # Set the token for API requests
            api.set_auth_token(Config.USER_SESSIONS[user_id]["token"])
            
            # Get report data
            report_data = Config.USER_SESSIONS[user_id]["report_data"]
            
            # Open the downloaded image file in binary read mode
            with open(image_path, 'rb') as image_file:
                print(f"DEBUG: Opened image file: {image_path} for API submission.")
                # Send the report with the image
                report_result = api.report_emergency(report_data, image=image_file)
                
            # Clean up the local image file after sending
            if os.path.exists(image_path):
                os.remove(image_path)
                print(f"DEBUG: Removed temporary image file: {image_path}")
            
            # Clean up session data
            Config.USER_SESSIONS[user_id].pop("waiting_for_report_location", None)
            Config.USER_SESSIONS[user_id].pop("waiting_for_report_image", None)
            Config.USER_SESSIONS[user_id].pop("report_data", None)
            Config.USER_SESSIONS[user_id].pop("report_step", None)
            
            if "error" in report_result:
                await loading_msg.edit_text(f"❌ Report submission failed: {report_result['error']}")
                print(f"ERROR: API returned an error: {report_result['error']}")
                return
            
            await loading_msg.edit_text(
                "✅ Your emergency report with image has been submitted successfully!\n\n"
                "Thank you for helping keep your community safe."
            )
            print("DEBUG: Emergency report submitted successfully.")

        except Exception as e:
            traceback.print_exc() 
            await loading_msg.edit_text(f"❌ Error processing image: {str(e)}. Please check the bot's console for details.")
            print(f"ERROR: Exception caught in handle_report_photo: {e}")
            # Clean up the image file on error, only if it exists
            if os.path.exists(image_path):
                os.remove(image_path)
                print(f"DEBUG: Removed temporary image file {image_path} during error cleanup.")
    else:
        await message.reply(
            "⚠️ I received your photo, but you're not currently reporting an emergency.\n"
            "To report an emergency, use the /report command first."
        )

# Handle /skip command for emergency reports without images - improved version
# @app.on_message(filters.command("skip") & filters.private)
# async def skip_image_upload(client, message):
#     user_id = message.from_user.id
    
#     # Check if we're waiting for an image for an emergency report
#     if (user_id in Config.USER_SESSIONS and 
#         Config.USER_SESSIONS[user_id].get("waiting_for_report_image") and
#         "report_data" in Config.USER_SESSIONS[user_id]):
        
#         # Set the token for API requests
#         api.set_auth_token(Config.USER_SESSIONS[user_id]["token"])
        
#         # Get report data
#         report_data = Config.USER_SESSIONS[user_id]["report_data"]
        
#         # Send the report without an image
#         loading_msg = await message.reply("Submitting your emergency report...")
#         report_result = api.report_emergency(report_data)
        
#         # Clean up session data
#         Config.USER_SESSIONS[user_id].pop("waiting_for_report_location", None)
#         Config.USER_SESSIONS[user_id].pop("waiting_for_report_image", None)
#         Config.USER_SESSIONS[user_id].pop("report_data", None)
#         Config.USER_SESSIONS[user_id].pop("report_step", None)
        
#         if "error" in report_result:
#             await loading_msg.edit_text(f"❌ Report submission failed: {report_result['error']}")
#             return
        
#         await loading_msg.edit_text(
#             "✅ Your emergency report has been submitted successfully!\n\n"
#             "Thank you for helping keep your community safe."
#         )

# Cancel report command (new)
@app.on_message(filters.command("cancel_report") & filters.private)
async def cancel_report(client, message):
    user_id = message.from_user.id
    
    # Check if user is in the reporting flow
    if (user_id in Config.USER_SESSIONS and 
        ("report_step" in Config.USER_SESSIONS[user_id] or 
         "waiting_for_report_location" in Config.USER_SESSIONS[user_id] or
         "waiting_for_report_image" in Config.USER_SESSIONS[user_id])):
        
        # Clean up session data
        Config.USER_SESSIONS[user_id].pop("waiting_for_report_location", None)
        Config.USER_SESSIONS[user_id].pop("waiting_for_report_image", None)
        Config.USER_SESSIONS[user_id].pop("report_data", None)
        Config.USER_SESSIONS[user_id].pop("report_step", None)
        
        await message.reply(
            "✅ Emergency report cancelled.\n\n"
            "You can start a new report at any time with /report"
        )
    else:
        await message.reply(
            "There is no active report to cancel."
        )

# Logout command
@app.on_message(filters.command("logout") & filters.private)
async def logout_command(client, message):
    user_id = message.from_user.id
    
    # Check if user is logged in
    if user_id not in Config.USER_SESSIONS or "token" not in Config.USER_SESSIONS[user_id]:
        await message.reply(
            "❌ You are not currently logged in."
        )
        return
    
    # Clear the session data
    Config.USER_SESSIONS.pop(user_id, None)
    
    # Clear API token
    api.clear_auth_token()
    
    await message.reply(
        "✅ You have been successfully logged out."
    )

# Run the bot
def run_bot():
    app.run()
