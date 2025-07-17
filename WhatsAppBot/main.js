// Import necessary modules
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const axios = require('axios'); // For making HTTP requests to your API
const FormData = require('form-data'); // For multipart/form-data uploads

// --- Configuration ---
const API_BASE_URL = 'http://localhost:8000'; // IMPORTANT: Replace with your actual API base URL!

// --- Bot Initialization ---
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'whatsapp-disaster-bot', // Unique ID for your bot's session
    }),
    puppeteer: {
        executablePath: '/usr/bin/google-chrome',  // Verify this path
        headless: true, // Change to false for debugging
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            // '--single-process', // Remove this as it can cause stability issues
            '--disable-gpu',
            '--window-size=1280,720'
        ],
        defaultViewport: null // Add this to improve stability
    },
});

// --- User Session and State Management ---
// Stores user access tokens: { 'whatsapp_id': 'access_token' }
const userTokens = new Map();
// Stores user conversation states for multi-step commands: { 'whatsapp_id': { command: 'login', step: 1, data: {} } }
const userStates = new Map();

// --- API Client Helper ---
async function makeApiRequest(method, endpoint, data = null, whatsappId = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {};

    if (whatsappId && userTokens.has(whatsappId)) {
        headers['Authorization'] = `Bearer ${userTokens.get(whatsappId)}`;
    }

    try {
        const config = { method, url, headers };
        
        if (data instanceof FormData) {
            // FormData handles its own Content-Type header
            config.headers = { ...headers, ...data.getHeaders() };
            config.data = data;
        } else {
            config.headers['Content-Type'] = 'application/json';
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        console.error(`API Request Error to ${endpoint}:`, error.response ? JSON.stringify(error.response.data) : error.message);
        let errorMessage = 'An unknown API error occurred.';
        if (error.response && error.response.data) {
            errorMessage = error.response.data.detail || JSON.stringify(error.response.data);
        } else if (error.message) {
            errorMessage = error.message;
        }
        return { success: false, error: errorMessage };
    }
}

// --- Bot Event Handlers ---

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    // You can use a library like 'qrcode-terminal' to display the QR in the console:
    // require('qrcode-terminal').generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready! WhatsApp Bot is Online!');
    // Optional: Send a startup message to a specific number for confirmation
    // client.sendMessage('YOUR_WHATSAPP_NUMBER@c.us', 'Hello! I am your disaster management bot and I am online. Type !help to see what I can do.');
});

client.on('message', async (msg) => {
    const senderId = msg.from;
    const text = msg.body.toLowerCase().trim();

    // Check if the user is in a multi-step conversation
    const currentState = userStates.get(senderId);

    if (currentState) {
        // Handle multi-step commands based on current state
        await handleMultiStepCommand(msg, senderId, text, currentState);
        return;
    }

    // Handle single-step commands or initiate multi-step commands
    if (text === '!help') {
        msg.reply(`Hello! I'm your friendly Disaster Management Bot. Here's what I can do:\n\n` +
            `*!login*: Log in to your account.\n` +
            `*!profile*: View your user profile.\n` +
            `*!dashboard*: Access your user dashboard.\n` +
            `*!reportemergency*: Report an emergency.\n` +
            `*!nearbydisasters*: Check for disasters near a location (no login needed).\n` +
            `*!logout*: Log out from your account.\n\n` +
            `You can type *!cancel* at any point to stop a current process.`
        );
    } else if (text === '!login') {
        if (userTokens.has(senderId)) {
            msg.reply('You are already logged in!');
            return;
        }
        userStates.set(senderId, { command: 'login', step: 1, data: {} });
        msg.reply('Alright, let\'s log in. What is your *email address*?');
    } else if (text === '!profile') {
        if (!userTokens.has(senderId)) {
            msg.reply('You need to be logged in to view your profile. Type `!login` to proceed.');
            return;
        }
        msg.reply('Fetching your profile...');
        // Prioritize /private/profile if available for more details, otherwise fall back to /auth/profile
        let response = await makeApiRequest('GET', '/private/profile', null, senderId);
        if (!response.success && response.error.includes('Not authenticated')) {
            // Try /auth/profile if /private/profile fails due to authentication (might be a role issue)
            response = await makeApiRequest('GET', '/auth/profile', null, senderId);
        }

        if (response.success) {
            const profile = response.data;
            let profileMessage = `*Your Profile:*\n` +
                `Name: ${profile.name || 'N/A'}\n` +
                `Email: ${profile.email || 'N/A'}\n` +
                `Phone: ${profile.phone || 'N/A'}\n`;
            if (profile.role) profileMessage += `Role: ${profile.role}\n`;
            if (profile.latitude && profile.longitude) profileMessage += `Location: Lat ${profile.latitude}, Long ${profile.longitude}\n`;
            if (profile.skills) profileMessage += `Skills: ${profile.skills.join(', ')}\n`;
            if (profile.department) profileMessage += `Department: ${profile.department}\n`;
            
            msg.reply(profileMessage);
        } else {
            msg.reply(`Failed to fetch profile: ${response.error}`);
            if (response.error.includes('Not authenticated')) {
                userTokens.delete(senderId); // Clear invalid token
                msg.reply('Your session has expired. Please log in again using `!login`.');
            }
        }
    } else if (text === '!dashboard') {
        if (!userTokens.has(senderId)) {
            msg.reply('You need to be logged in to view your dashboard. Type `!login` to proceed.');
            return;
        }
        msg.reply('Accessing your dashboard...');
        const response = await makeApiRequest('GET', '/user/dashboard', null, senderId);
        if (response.success) {
            // As per OpenAPI, /user/dashboard returns an empty schema for success
            msg.reply('Dashboard accessed successfully! (No specific data to display from this endpoint.)');
        } else {
            msg.reply(`Failed to access dashboard: ${response.error}`);
            if (response.error.includes('Not authenticated')) {
                userTokens.delete(senderId);
                msg.reply('Your session has expired. Please log in again using `!login`.');
            }
        }
    } else if (text === '!reportemergency') {
        if (!userTokens.has(senderId)) {
            msg.reply('You need to be logged in to report an emergency. Type `!login` to proceed.');
            return;
        }
        userStates.set(senderId, { command: 'report_emergency', step: 1, data: {} });
        msg.reply('Okay, let\'s report an emergency. What is the *emergency type* (e.g., flood, fire, earthquake)?');
    } else if (text === '!nearbydisasters') {
        userStates.set(senderId, { command: 'nearby_disasters', step: 1, data: {} });
        msg.reply('To check for nearby disasters, please share your *latitude* (e.g., 34.0522).');
    } else if (text === '!logout') {
        if (userTokens.has(senderId)) {
            userTokens.delete(senderId);
            userStates.delete(senderId); // Clear any pending state
            msg.reply('You have been successfully logged out.');
        } else {
            msg.reply('You are not currently logged in.');
        }
    } else {
        // If not a recognized command and not in a multi-step flow
        msg.reply('I don\'t understand that command. Type `!help` to see what I can do.');
    }
});

// --- Multi-step Command Handler ---
async function handleMultiStepCommand(msg, senderId, text, currentState) {
    // Allow users to cancel any multi-step process
    if (text === '!cancel') {
        userStates.delete(senderId);
        msg.reply('Current operation cancelled. How can I help you further? Type `!help`.');
        return;
    }

    switch (currentState.command) {
        case 'login':
            await handleLoginFlow(msg, senderId, text, currentState);
            break;
        case 'report_emergency':
            await handleEmergencyReportFlow(msg, senderId, text, currentState);
            break;
        case 'nearby_disasters':
            await handleNearbyDisastersFlow(msg, senderId, text, currentState);
            break;
        default:
            msg.reply('An unexpected error occurred in your conversation flow. Please try starting a new command or type `!help`.');
            userStates.delete(senderId); // Clear corrupted state
    }
}

// --- Specific Command Flows ---

async function handleLoginFlow(msg, senderId, text, currentState) {
    const data = currentState.data;

    switch (currentState.step) {
        case 1: // Awaiting email
            data.email = text;
            currentState.step = 2;
            msg.reply('Got it. Now, what is your *password*?');
            break;
        case 2: // Awaiting password
            data.password = text;
            currentState.step = 3;
            msg.reply('Please provide your current *latitude* (e.g., 34.0522).');
            break;
        case 3: // Awaiting latitude
            const lat = parseFloat(text);
            if (isNaN(lat)) {
                msg.reply('Invalid latitude. Please send a valid number for your *latitude*.');
                return;
            }
            data.latitude = lat;
            currentState.step = 4;
            msg.reply('And your current *longitude* (e.g., -118.2437).');
            break;
        case 4: // Awaiting longitude
            const long = parseFloat(text);
            if (isNaN(long)) {
                msg.reply('Invalid longitude. Please send a valid number for your *longitude*.');
                return;
            }
            data.longitude = long;

            // Attempt login
            msg.reply('Attempting to log you in...');
            const response = await makeApiRequest('POST', '/auth/login', {
                email: data.email,
                password: data.password,
                latitude: data.latitude,
                longitude: data.longitude,
            });

            if (response.success) {
                userTokens.set(senderId, response.data.access_token);
                msg.reply(`Login successful! Welcome, ${response.data.user_info.name || 'User'}!`);
            } else {
                msg.reply(`Login failed: ${response.error}`);
            }
            userStates.delete(senderId); // Clear state after login attempt
            break;
    }
}

async function handleEmergencyReportFlow(msg, senderId, text, currentState) {
    const data = currentState.data;

    switch (currentState.step) {
        case 1: // Awaiting emergencyType
            data.emergencyType = text;
            currentState.step = 2;
            msg.reply('What is the *urgency level* for this emergency (e.g., low, medium, high, critical)?');
            break;
        case 2: // Awaiting urgencyLevel
            data.urgencyLevel = text;
            currentState.step = 3;
            msg.reply('Please describe the *situation* in detail.');
            break;
        case 3: // Awaiting situation
            data.situation = text;
            currentState.step = 4;
            msg.reply('How many *people are affected* (e.g., 10, 50+, unknown)?');
            break;
        case 4: // Awaiting peopleCount
            data.peopleCount = text;
            currentState.step = 5;
            msg.reply('Please provide the *latitude* of the emergency location (e.g., 34.0522).');
            break;
        case 5: // Awaiting latitude
            const lat = parseFloat(text);
            if (isNaN(lat)) {
                msg.reply('Invalid latitude. Please send a valid number for the *latitude*.');
                return;
            }
            data.latitude = lat.toString(); // API expects string
            currentState.step = 6;
            msg.reply('Now, the *longitude* of the emergency location (e.g., -118.2437).');
            break;
        case 6: // Awaiting longitude
            const long = parseFloat(text);
            if (isNaN(long)) {
                msg.reply('Invalid longitude. Please send a valid number for the *longitude*.');
                return;
            }
            data.longitude = long.toString(); // API expects string
            currentState.step = 7;
            msg.reply('You can optionally send an *image* of the situation now (as an attachment), or type `skip` to finish.');
            break;
        case 7: // Awaiting image (optional) or 'skip'
            if (msg.hasMedia && msg.type === 'image') {
                msg.reply('Downloading image...');
                const media = await msg.downloadMedia();
                if (media) {
                    const formData = new FormData();
                    formData.append('emergencyType', data.emergencyType);
                    formData.append('urgencyLevel', data.urgencyLevel);
                    formData.append('situation', data.situation);
                    formData.append('peopleCount', data.peopleCount);
                    formData.append('latitude', data.latitude);
                    formData.append('longitude', data.longitude);
                    formData.append('image', Buffer.from(media.data, 'base64'), {
                        filename: media.filename || 'image.jpeg',
                        contentType: media.mimetype
                    });

                    msg.reply('Reporting emergency with image...');
                    const response = await makeApiRequest('POST', '/user/emergency/report', formData, senderId);
                    if (response.success) {
                        msg.reply('Emergency reported successfully with image!');
                    } else {
                        msg.reply(`Failed to report emergency with image: ${response.error}`);
                    }
                } else {
                    msg.reply('Could not download the image. Please try again or type `skip`.');
                    return; // Stay in this step
                }
            } else if (text === 'skip') {
                msg.reply('Reporting emergency without image...');
                const response = await makeApiRequest('POST', '/user/emergency/report', {
                    emergencyType: data.emergencyType,
                    urgencyLevel: data.urgencyLevel,
                    situation: data.situation,
                    peopleCount: data.peopleCount,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    // image field will be null or omitted as per API spec for no image
                }, senderId);
                if (response.success) {
                    msg.reply('Emergency reported successfully!');
                } else {
                    msg.reply(`Failed to report emergency: ${response.error}`);
                }
            } else {
                msg.reply('Please send an *image* or type `skip`.');
                return; // Stay in this step
            }
            userStates.delete(senderId); // Clear state after report attempt
            break;
    }
}

async function handleNearbyDisastersFlow(msg, senderId, text, currentState) {
    const data = currentState.data;

    switch (currentState.step) {
        case 1: // Awaiting latitude
            const lat = parseFloat(text);
            if (isNaN(lat)) {
                msg.reply('Invalid latitude. Please send a valid number for your *latitude*.');
                return;
            }
            data.latitude = lat;
            currentState.step = 2;
            msg.reply('Now, please provide your *longitude*.');
            break;
        case 2: // Awaiting longitude
            const long = parseFloat(text);
            if (isNaN(long)) {
                msg.reply('Invalid longitude. Please send a valid number for your *longitude*.');
                return;
            }
            data.longitude = long;

            // Attempt to check for nearby disasters
            msg.reply('Checking for nearby disasters...');
            const response = await makeApiRequest('GET', `/public/nearby?latitude=${data.latitude}&longitude=${data.longitude}`);

            if (response.success) {
                // As per OpenAPI, /public/nearby returns an empty schema for success.
                // If your API returns data for nearby disasters, you would parse `response.data` here.
                msg.reply('Nearby disaster check completed! (If there are active disasters, the system would notify you.)');
            } else {
                msg.reply(`Failed to check for nearby disasters: ${response.error}`);
            }
            userStates.delete(senderId); // Clear state after check
            break;
    }
}

// --- Start the Bot ---
client.initialize();