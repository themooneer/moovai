# AI Video Editor 🎬

A desktop video editing application powered by AI, allowing users to edit videos using natural language commands. Think of it as a simplified Adobe Premiere controlled by an AI assistant that translates your requests into FFmpeg operations.

## ✨ Features

- **🎥 AI-Powered Editing**: Edit videos using natural language commands
- **⏱️ Real-time Timeline**: See changes immediately in the visual timeline
- **🔄 Cross-platform**: Works on Windows, macOS, and Linux
- **🏠 Local Processing**: All video processing happens on your machine
- **💬 Natural Language Interface**: Chat with AI to perform video edits
- **🎬 Professional Tools**: Trim, cut, resize, add overlays, adjust audio

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **pnpm** 8.0.0 or higher
- **FFmpeg** (automatically installed via ffmpeg-static)
- **Ollama** with Llama 3.1 8B model

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-video-editor
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Ollama (AI model)**
   ```bash
   # Install Ollama from https://ollama.ai
   # Pull the Llama 3.1 8B model
   ollama pull llama3.1:8b
   ```

4. **Start development**
   ```bash
   pnpm dev
   ```

This will start both the backend server and Electron frontend simultaneously.

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter electron build
pnpm --filter backend build
pnpm --filter shared build
```

## 🏗️ Architecture

The application follows a monorepo architecture with clear separation of concerns:

```
ai-video-editor/
├── apps/
│   ├── electron/          # Electron main process + React frontend
│   └── backend/           # Node.js API server with FFmpeg + AI
├── packages/
│   └── shared/            # Shared TypeScript types and utilities
└── docs/                  # Comprehensive project documentation
```

### Component Overview

- **Frontend**: Electron app with React UI, Zustand state management
- **Backend**: Express.js API server with FFmpeg integration
- **AI Service**: Ollama-powered natural language processing
- **Video Engine**: FFmpeg-based video processing with progress tracking

## 🎯 How It Works

1. **Import Video**: Drag & drop or select video files
2. **AI Chat**: Describe what you want to do in natural language
3. **AI Processing**: The AI translates your request into FFmpeg operations
4. **Video Processing**: FFmpeg executes the operations asynchronously
5. **Timeline Update**: See changes immediately in the visual timeline
6. **Export**: Save your edited video with all applied changes

### Example Workflow

```
User: "Trim the first 10 seconds of the video"
   ↓
AI: Generates FFmpeg trim operation
   ↓
Backend: Executes FFmpeg command
   ↓
Frontend: Updates timeline in real-time
   ↓
Result: Video trimmed, timeline updated
```

## 🛠️ Tech Stack

### Frontend
- **Electron** - Cross-platform desktop framework
- **React 18** - UI library with hooks
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **WebSocket** - Real-time communication

### Video Processing
- **FFmpeg** - Industry-standard video processing
- **fluent-ffmpeg** - Node.js FFmpeg wrapper
- **ffmpeg-static** - Static FFmpeg binaries

### AI/ML
- **Ollama** - Local LLM inference engine
- **Llama 3.1 8B** - Open-source language model

### Build Tools
- **Vite** - Fast frontend build tool
- **pnpm** - Efficient package manager
- **electron-builder** - Electron packaging

## 📚 Documentation

Comprehensive documentation is available in the `/docs` folder:

- **[Architecture.md](./docs/Architecture.md)** - System design and data flow
- **[TechStack.md](./docs/TechStack.md)** - Technology choices and rationale
- **[AI_Agent.md](./docs/AI_Agent.md)** - AI assistant implementation details
- **[Frontend.md](./docs/Frontend.md)** - React component structure and state management
- **[Backend.md](./docs/Backend.md)** - API endpoints and service architecture
- **[Conventions.md](./docs/Conventions.md)** - Coding standards and best practices

## 🔧 Development

### Scripts

```bash
# Development
pnpm dev                    # Start both backend and frontend
pnpm electron:dev          # Start only Electron frontend
pnpm backend:dev           # Start only backend server

# Building
pnpm build                 # Build all packages
pnpm clean                 # Clean all build artifacts
pnpm install:all          # Install all dependencies

# Shared package
pnpm shared:build         # Build shared package
```

### Project Structure

```
src/
├── components/            # React components
│   ├── Layout.tsx        # Main application layout
│   ├── ProjectList.tsx   # Project management interface
│   ├── VideoEditor.tsx   # Main video editing interface
│   ├── Timeline.tsx      # Video timeline component
│   └── AIChat.tsx        # AI chat interface
├── stores/               # Zustand state stores
│   ├── projectStore.ts   # Project state management
│   └── aiChatStore.ts    # AI chat state management
├── services/             # API and utility services
│   └── api.ts           # HTTP client configuration
└── utils/                # Utility functions
```

### State Management

The application uses Zustand for state management with two main stores:

- **Project Store**: Manages video projects, clips, and timeline
- **AI Chat Store**: Handles AI conversation state and message history

## 🌐 API Reference

### Backend Endpoints

- **Video Processing**: `/api/video/*` - Upload, process, and manage videos
- **AI Assistant**: `/api/ai/*` - Natural language processing and commands
- **Project Management**: `/api/project/*` - CRUD operations for video projects

### WebSocket Events

- **Real-time Updates**: Progress tracking, timeline updates, chat messages
- **Project Collaboration**: Multiple users can work on the same project

## 🧪 Testing

```bash
# Run tests
pnpm test                 # Run all tests
pnpm test:unit           # Run unit tests
pnpm test:integration    # Run integration tests
pnpm test:e2e            # Run end-to-end tests
```

## 🚀 Deployment

### Development

```bash
pnpm dev                  # Start development environment
```

### Production

```bash
pnpm build               # Build production artifacts
pnpm start               # Start production server
```

### Distribution

```bash
pnpm electron:build      # Build Electron distributable
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the coding conventions in [Conventions.md](./docs/Conventions.md)
- Write tests for new features
- Update documentation as needed
- Use conventional commit messages

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **FFmpeg** - Powerful video processing capabilities
- **Ollama** - Local LLM inference
- **Electron** - Cross-platform desktop framework
- **React** - Declarative UI library

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions

## 🔮 Roadmap

- [ ] **Advanced AI Commands**: Complex video editing sequences
- [ ] **Real-time Collaboration**: Multiple users editing simultaneously
- [ ] **Plugin System**: Extensible video processing capabilities
- [ ] **Cloud Processing**: Optional cloud-based video processing
- [ ] **Mobile App**: Companion mobile application
- [ ] **AI Model Fine-tuning**: Custom models for specific use cases

---

**Made with ❤️ by the AI Video Editor Team**

Transform your video editing workflow with the power of AI! 🎬✨
