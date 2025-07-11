from pyrogram import Client, filters
from pyrogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton
import json
from config import Config
from disaster_api import get_nearby_disasters
import datetime  # Added for timestamp formatting

# Initialize the Pyrogram Client
app = Client(
    "disaster_bot",
    api_id=Config.API_ID,
    api_hash=Config.API_HASH,
    bot_token=Config.BOT_TOKEN
)

# Helper function to format timestamp
def format_timestamp(unix_timestamp):
    if not unix_timestamp:
        return "Unknown"
    try:
        timestamp = float(unix_timestamp)
        dt = datetime.datetime.fromtimestamp(timestamp)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except (ValueError, TypeError):
        return str(unix_timestamp)

# Command handler for /start
@app.on_message(filters.command("start"))
async def start_command(client, message: Message):
    await message.reply_text(
        "👋 Welcome to Disaster Alert Bot!\n\n"
        "I can help you find nearby disasters. Use these commands:\n\n"
        "/nearby <address> - Find disasters near an address\n"
        "/location - Share your location to find nearby disasters\n"
        "/help - Show this help message"
    )

# Command handler for /help
@app.on_message(filters.command("help"))
async def help_command(client, message: Message):
    await message.reply_text(
        "🆘 Disaster Alert Bot Help 🆘\n\n"
        "Commands:\n"
        "/nearby <address> - Find disasters near an address\n"
        "Example: /nearby New York City\n\n"
        "/location - Share your location to find nearby disasters\n\n"
        "/help - Show this help message"
    )

# Command handler for /nearby
@app.on_message(filters.command("nearby"))
async def nearby_command(client, message: Message):
    # Extract the address from the command
    command_parts = message.text.split(" ", 1)
    if len(command_parts) < 2:
        await message.reply_text("Please provide an address. Example: /nearby New York City")
        return
    
    address = command_parts[1].strip()
    status_msg = await message.reply_text(f"Searching for disasters near {address}...")
    
    try:
        # Call the API function
        disasters = get_nearby_disasters(address=address)
        
        # Format and send the response
        if disasters and len(disasters) > 0:
            response_text = f"📍 Found {len(disasters)} disaster(s) near {address}:\n\n"
            
            for idx, disaster in enumerate(disasters, 1):
                emergency_type = disaster.get('emergency_type', 'Unknown')
                # situation = disaster.get('situation', 'No description')
                urgency = disaster.get('urgency_level', 'Unknown')
                people = disaster.get('people_count', 'Unknown')
                
                response_text += f"{idx}. {emergency_type.upper()}"
                response_text += f"   Urgency: {urgency.title()}\n"
                response_text += f"   Affected people: {people}\n"
                if 'submitted_time' in disaster:
                    formatted_time = format_timestamp(disaster['submitted_time'])
                    response_text += f"   Reported: {formatted_time}\n"
                response_text += f"   Status: {disaster.get('status', 'Unknown').upper()}\n"
                
                # Add Google Maps URL if latitude and longitude are available
                if 'latitude' in disaster and 'longitude' in disaster:
                    lat = disaster['latitude']
                    lon = disaster['longitude']
                    maps_url = f"https://www.google.com/maps?q={lat},{lon}"
                    response_text += f"   📌 Location: {maps_url}\n\n"
                else:
                    response_text += "\n"
            
            await status_msg.edit_text(response_text)
        else:
            await status_msg.edit_text(f"No disasters found near {address}.")
    
    except Exception as e:
        await status_msg.edit_text(f"Error: {str(e)}")

# Command handler for /location
@app.on_message(filters.command("location"))
async def location_command(client, message: Message):
    # Using a text-only message with clear instructions
    await message.reply_text(
        "📍 **Share Your Location**\n\n"
        "To find disasters near you, please share your location using Telegram's location sharing feature:\n\n"
        "1. Click on the attachment (📎) icon next to the message field\n"
        "2. Select 'Location'\n"
        "3. Allow Telegram to access your location if prompted\n"
        "4. Tap 'Send My Current Location'\n\n"
        "Once I receive your location, I'll search for nearby disasters and alert you."
    )

# Handler for location messages
@app.on_message(filters.location)
async def location_handler(client, message: Message):
    lat = message.location.latitude
    lon = message.location.longitude
    
    status_msg = await message.reply_text("Searching for disasters near your location...")
    
    try:
        disasters = get_nearby_disasters(latitude=lat, longitude=lon)
        
        if disasters and len(disasters) > 0:
            response_text = f"📍 Found {len(disasters)} disaster(s) near your location:\n\n"
            
            for idx, disaster in enumerate(disasters, 1):
                emergency_type = disaster.get('emergency_type', 'Unknown')
                situation = disaster.get('situation', 'No description')
                urgency = disaster.get('urgency_level', 'Unknown')
                people = disaster.get('people_count', 'Unknown')
                
                response_text += f"{idx}. {emergency_type.upper()} - {situation}\n"
                response_text += f"   Urgency: {urgency.title()}\n"
                response_text += f"   Affected people: {people}\n"
                if 'submitted_time' in disaster:
                    formatted_time = format_timestamp(disaster['submitted_time'])
                    response_text += f"   Reported: {formatted_time}\n"
                response_text += f"   Status: {disaster.get('status', 'Unknown').upper()}\n\n"
            
            await status_msg.edit_text(response_text)
        else:
            await status_msg.edit_text("No disasters found near your location.")
    
    except Exception as e:
        await status_msg.edit_text(f"Error: {str(e)}")

# Run the bot
if __name__ == "__main__":
    print("Starting Disaster Alert Bot...")
    app.run()
