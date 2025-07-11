FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Install system dependencies required for OpenCV and YOLO
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements file first for better caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create a .env file during build if it doesn't exist
# Note: In production, you should use environment variables or secrets management
RUN touch .env

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["fastapi", "run", "main.py"]
