# Disaster Alert Bot

A comprehensive Telegram bot for disaster management that helps users find nearby disasters, report emergencies, and access emergency services through an intuitive interface.

## Features

### 🔍 **Disaster Discovery**
- Find disasters near a specified address using `/nearby` command
- Share your GPS location to discover disasters in your area
- View detailed disaster information including type, urgency, affected people, and map locations
- Get Google Maps links for precise disaster locations

### 🚨 **Emergency Reporting**
- Step-by-step guided emergency reporting with `/report` command
- Support for multiple emergency types (Fire, Flood, Earthquake, Tsunami, Landslide, Hurricane, Tornado, etc.)
- Urgency level selection (Low, Medium, High, Critical)
- Location sharing with GPS coordinates
- Optional photo uploads for visual evidence
- Detailed situation descriptions

### 👤 **User Management**
- Secure user authentication with `/login` command
- User profile management with `/profile` command
- Personal dashboard access with `/dashboard` command
- Session management with `/logout` command
- Location-based authentication for enhanced security

### 📊 **System Monitoring**
- Real-time disaster status checking with `/status` command
- System-wide emergency overview
- Current disaster statistics and trends

### 🆘 **Emergency Services**
- Request help for specific disasters with `/request` command
- Report cancellation with `/cancel_report` command
- Real-time emergency response coordination

## Commands Reference

### **Basic Commands**
- `/start` - Welcome message and bot introduction
- `/help` - Complete command reference and usage guide

### **Location & Discovery**
- `/nearby` - Find disasters near a specified address

### **Emergency Services**
- `/status` - Check current disaster status in the system
- `/report` - Start guided emergency reporting process

### **User Account**
- `/login <email> <password>` - Sign in to your account with location verification
- `/profile` - View your profile information and account details
- `/dashboard` - Access your personalized dashboard
- `/logout` - Sign out from your account

### **Utility Commands**
- `/skip` - Skip optional steps during emergency reporting (e.g., photo upload)

## Requirements

- Python 3.11 or higher
- Pyrogram (2.0.0 or higher)
- TgCrypto for enhanced security
- Requests (2.28.0 or higher) for API communication
- python-dotenv for environment management

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd telegramBot
   ```

2. **Create and activate virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

Create a `config.py` file in the root directory:

```python
class Config:
    # Telegram Bot Configuration
    # Get these from https://my.telegram.org/apps
    API_ID = "your_api_id"
    API_HASH = "your_api_hash"
    
    # Get this from @BotFather on Telegram
    BOT_TOKEN = "your_bot_token"
    
    # Disaster Management API Configuration
    BASE_URL = "http://localhost:8000"  # Your API base URL
    HEADERS = {
        'Content-Type': 'application/json'
    }
    
    # Session Management
    USER_SESSIONS = {}  # Runtime user session storage
    
    # Bot Settings
    COMMAND_PREFIX = "/"
```

## Getting Started

1. **Obtain Telegram Credentials:**
   - Visit https://my.telegram.org/apps
   - Create a new application to get `API_ID` and `API_HASH`
   - Contact @BotFather on Telegram to create a bot and get `BOT_TOKEN`

2. **Set up the Disaster API:**
   - Ensure your disaster management API is running
   - Update `BASE_URL` in config.py to point to your API

3. **Start the bot:**
   ```bash
   python main.py
   ```

4. **Test the bot:**
   - Search for your bot on Telegram using its username
   - Send `/start` to begin interaction
   - Use `/help` for a complete command reference

## Usage Examples

### **Finding Nearby Disasters**
```
/nearby New York City
```
or share your location using the location button

### **Reporting an Emergency**
```
/report
```
Follow the guided 4-step process:
1. Select emergency type
2. Choose urgency level  
3. Describe the situation
4. Provide location and optional photo

### **User Authentication**
```
/login user@example.com yourpassword
```
Then share your location for verification

## Project Structure

```
telegramBot/
├── main.py              # Main bot application with all handlers
├── config.py            # Configuration settings (create this)
├── disaster_api.py      # API integration for disaster management
├── requirements.txt     # Python dependencies
├── pyproject.toml      # Project metadata
├── README.md           # This documentation
├── __init__.py         # Package initializer
└── temp_downloads/     # Temporary directory for image processing
```

## Key Features Explained

### **Guided Emergency Reporting**
The bot provides a step-by-step emergency reporting system:
1. **Emergency Type Selection** - Choose from predefined categories
2. **Urgency Assessment** - Select appropriate urgency level
3. **Situation Description** - Provide detailed text description
4. **People Count** - Estimate affected population
5. **Location Sharing** - GPS coordinates for precise location
6. **Photo Upload** - Optional visual evidence

### **Smart Session Management**
- Maintains user login sessions across interactions
- Tracks multi-step processes (reporting, authentication)
- Automatic cleanup of temporary data
- Secure token-based authentication

### **Error Handling & Recovery**
- Comprehensive error handling for API failures
- Graceful degradation when services are unavailable
- User-friendly error messages with actionable guidance
- Automatic cleanup of temporary files and sessions

## Security Features

- Location-based authentication for enhanced security
- Secure token management for API access
- Temporary file cleanup after processing
- Session isolation between users
- Input validation and sanitization

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Troubleshooting

### **Common Issues:**

**Bot doesn't respond:**
- Check if the bot token is correct
- Verify API credentials in config.py
- Ensure the disaster management API is running

**Login fails:**
- Verify user credentials with the API
- Check if location sharing is enabled
- Ensure stable internet connection

**Image upload fails:**
- Check file permissions for temp_downloads directory
- Verify sufficient disk space
- Ensure image file is not corrupted

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in this repository
- Check the troubleshooting section above
- Review the command reference in `/help`
