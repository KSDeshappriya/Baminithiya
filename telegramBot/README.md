# Disaster Alert Bot

A Telegram bot that helps users find nearby disasters through text commands or by sharing their location.

## Features

- Search for disasters near a specified address
- Share your location to find disasters near you
- User-friendly commands and responses
- Integration with disaster alert API
- Google Maps links for disaster locations

## Requirements

- Python 3.11 or higher
- Pyrogram (2.0.0 or higher)
- TgCrypto
- Requests (2.28.0 or higher)

## Installation

1. Clone this repository:
   ```bash
   git clone <repo of disaster management system>
   cd telegramBot
   ```

2. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install directly from requirements.txt:
   ```bash
   pip install -r requirements.txt
   ```

## Configuration

Create a `config.py` file in the root directory with the following content:

```python
class Config:
    # Get these from https://my.telegram.org/apps
    API_ID = "your_api_id"
    API_HASH = "your_api_hash"
    
    # Get this from @BotFather on Telegram
    BOT_TOKEN = "your_bot_token"
    
    # Disaster API settings
    BASE_URL = "http://localhost:8000"
    HEADERS = {
        'Content-Type': 'application/json'
    }
    
    # Other bot settings
    COMMAND_PREFIX = "/"
```

## Usage

1. Start the bot:
   ```bash
   python run_bot.py
   ```

2. Open Telegram and search for your bot by username

3. Available commands:
   - `/start` - Introduction to the bot
   - `/help` - Display available commands
   - `/nearby <address>` - Find disasters near a specified address (e.g., `/nearby New York City`)
   - `/location` - Instructions for sharing your location to find nearby disasters

## Project Structure

- `main.py`: Main bot code with command handlers
- `config.py`: Configuration settings (you need to create this)
- `disaster_api.py`: API integration for fetching disaster data
- `requirements.txt`: Required Python packages
- `pyproject.toml`: Project metadata and dependencies

## How It Works

The bot uses the Pyrogram library to interact with the Telegram Bot API. When users submit location data (either via text address or GPS coordinates), the bot queries a disaster alert API to find nearby emergencies. Results are formatted and presented to the user with details like emergency type, urgency level, affected people count, and map links.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)
