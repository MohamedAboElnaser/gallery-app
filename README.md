# Gallery App

A NestJS-based image gallery application with real-time upload progress tracking and provider-agnostic file storage.

## Overview

This project is a full-stack gallery application built with NestJS on the backend and vanilla JavaScript on the frontend. The main focus is on demonstrating a flexible, provider-agnostic upload system with real-time feedback using WebSockets.

## 🎥 Demo Video

[![Demo Video](https://vumbnail.com/1104327298.jpg)](https://vimeo.com/1104327298)

_Shows user registration, login, and real-time upload progress with WebSocket feedback._

## Key Features

### Backend (Main Focus)

#### Provider-Agnostic Upload System

The upload system is designed to work with multiple storage providers without changing the core business logic:

- **Storage Providers**: Currently supports Cloudinary and Local storage
- **Factory Pattern**: Uses [`StorageProviderFactory`](src/upload/factories/storage-provider.factory.ts) to create the appropriate provider based on environment configuration
- **Interface-Based**: All providers implement the [`StorageProvider`](src/upload/interfaces/storage-provider.interface.ts) interface
- **Easy Extension**: Adding new providers (S3, Supabase, etc.) requires only implementing the interface

```typescript
// Switch providers via environment variable
STORAGE_PROVIDER=cloudinary  # or 'local'
```

#### Real-Time Upload Progress with WebSockets

- **Session-Based Tracking**: Each upload session gets a unique ID
- **Simulated Progress**: Progress updates are simulated (0%, 25%, 50%, 75%, 100%) to enhance user experience
- **File-Level Feedback**: Individual file processing status
- **Socket Rooms**: Clients join specific upload session rooms for targeted updates

**Note**: The real-time progress is currently simulated for demonstration purposes. In a production environment, this could be replaced with actual file upload progress tracking from the storage provider.

The [`EventsGateway`](src/events/events.gateway.ts) handles WebSocket connections and emits progress updates to the frontend.

#### Database Design

Uses Prisma with PostgreSQL:

- **Users**: Authentication and user management
- **Images**: File metadata and URLs
- **Upload Sessions**: Track batch upload progress

## Technical Implementation

### Upload Flow

1. Frontend selects files and creates upload session
2. Backend creates session record in database
3. Files are processed individually with simulated progress updates
4. Each file upload emits progress events via WebSocket
5. Completed files are saved to database
6. Session completion triggers final update

### Storage Abstraction

The [`UploadService`](src/upload/upload.service.ts) provides a clean interface:

```typescript
async uploadFile(file: Express.Multer.File, folder: string): Promise<string>
async uploadFiles(files: Express.Multer.File[], folder: string): Promise<string[]>
async deleteFiles(urls: string[]): Promise<boolean[]>
```

### File Validation

Custom validation pipes handle file type, size, and content validation:

- [`ImageValidationPipe`](src/common/pipes/file-validation-configs.ts) for images
- Magic number validation for file integrity
- Configurable size limits and file types

## Configuration

Key environment variables:

```bash
# Storage Provider
STORAGE_PROVIDER=local  # or 'cloudinary'

# Local Storage
LOCAL_UPLOAD_PATH=/path/to/uploads

# Cloudinary (if using)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# File Limits
MAX_FILE_SIZE_MB=5
MAX_FILE_COUNT_PER_REQUEST=10
```

## Installation & Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up PostgreSQL database
4. Copy [`.env.example`](./.env.example) to `.env` and configure your environment variables
5. Run database migrations: `npx prisma migrate dev`
6. Start the application: `npm run start:dev`

## API Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User authentication
- `POST /images` - Upload images with real-time progress
- `GET /images` - Get user images with pagination
- `DELETE /images/bulk-delete` - Delete multiple images

## Frontend (AI-Generated)

The frontend is a simple vanilla JavaScript implementation that was generated using AI. It demonstrates the real-time features:

- Drag & drop file upload
- Real-time progress bars
- Image gallery with search/sort
- Bulk delete functionality

Since my focus is on backend development, I used AI to generate the frontend code to quickly demonstrate the backend APIs functionality. The UI serves its purpose for testing and showcasing the backend features.

## Why This Architecture?

This project demonstrates several important backend concepts:

1. **Separation of Concerns**: Storage logic is separated from business logic
2. **Provider Pattern**: Easy to switch between different storage services
3. **Real-Time Communication**: WebSocket integration for better user experience
4. **Scalable File Handling**: Session-based upload tracking
5. **Type Safety**: Full TypeScript implementation with proper interfaces

The modular design makes it easy to extend with new storage providers or modify the upload behavior without affecting other parts of the system.
