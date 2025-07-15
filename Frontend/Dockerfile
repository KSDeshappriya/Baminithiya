# Stage 1: Build the application
FROM node:18 as build

WORKDIR /app

# Install Bun globally using npm
RUN npm install -g bun

COPY package.json ./
RUN bun install

COPY . .
# RUN npm run build

# Set environment variables
ENV VITE_APPWRITE_ENDPOINT=https://syd.cloud.appwrite.io/v1 \
    VITE_APPWRITE_PROJECT_ID=6856e1c80029a653493a \
    VITE_APPWRITE_DATABASE_ID=6856fa6e003bbda336b5 \
    VITE_APPWRITE_USERS_COLLECTION_ID=6857b86100325b4541ed \
    VITE_APPWRITE_DISASTERS_COLLECTION_ID=685bc4d3003ae3667be0 \
    VITE_APPWRITE_AI_MATRIX_COLLECTION_ID=685bc73e001f909101af \
    VITE_APPWRITE_TASKS_COLLECTION_ID=685be992000baf44c5ae \
    VITE_APPWRITE_USER_REQUESTS_COLLECTION_ID=685beba900265429ab63 \
    VITE_APPWRITE_RESOURCES_COLLECTION_ID=685bec9d000c92fd5090 \
    VITE_APPWRITE_MESSAGES_COLLECTION_ID=686182b9000109665e7e \
    VITE_BACKEND_URL=http://localhost:8000

EXPOSE 5173

# Run dev server with --host flag to expose it
CMD [ "bun", "run", "dev", "--host" ]
