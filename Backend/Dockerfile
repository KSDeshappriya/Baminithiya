# Use official Python image with 3.12
FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential && \
    rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY pyproject.toml .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir 'uvicorn[standard]' && \
    pip install --no-cache-dir .

# Copy project files
COPY . .

# Expose port (FastAPI default)
EXPOSE 8000

# Start FastAPI app with fastapi run
CMD ["fastapi", "run", "main.py", "--host", "0.0.0.0", "--port", "8000"]
