# WhatsApp Disaster Bot

## Overview
This is a WhatsApp automation bot built with Node.js and the whatsapp-web.js library. The bot is designed to assist with disaster-related communications and coordination.

## Features
- Automated message handling
- Group communication capabilities
- Disaster information dissemination
- Command-based interaction

## Prerequisites
- Node.js (v14 or higher)
- npm or pnpm

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd WhatsAppBot
```

2. Install dependencies
```bash
npm install
# or
pnpm install
```

3. Setup
- The bot requires authentication via WhatsApp Web
- On first run, you'll need to scan a QR code with your WhatsApp mobile app

## Usage

Start the bot:
```bash
node main.js
```

The bot will generate a QR code (first time only) which you need to scan using the WhatsApp mobile app.

## Commands
(List key commands the bot responds to)

## Configuration
Configuration settings can be modified in the main.js file.

## Authentication
The bot uses session data stored in the `.wwebjs_auth` directory to maintain authentication. Do not delete this directory unless you want to re-authenticate.

## License
(Your license information)

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.