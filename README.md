# WebNovel Manager

A modern web application for managing and reading web novels and manhwas. This project consists of a Next.js frontend and a FastAPI backend.

## Features

- 📚 Novel management and organization
- 🔄 Automatic chapter updates
- 📖 EPUB generation and download
- 🌐 Multi-source support
- 🔍 Advanced search and filtering
- 📱 Responsive design

## Tech Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn UI
- React Query

### Backend
- FastAPI
- MongoDB
- Python 3.11+
- BeautifulSoup4
- EbookLib

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- MongoDB
- pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/webnovel-manager.git
cd webnovel-manager
```

2. Install frontend dependencies:
```bash
cd webnovel-manager
pnpm install
```

3. Install backend dependencies:
```bash
cd webnovel-manager-api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

4. Set up environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Configure your MongoDB connection string and other settings

5. Start the development servers:
   - Frontend: `pnpm dev` (runs on http://localhost:3000)
   - Backend: `uvicorn app.main:app --reload` (runs on http://localhost:8000)

## Project Structure

```
webnovel-manager/
├── app/                 # Next.js frontend application
├── components/          # Reusable React components
├── lib/                 # Utility functions and configurations
├── services/           # API service layer
├── styles/             # Global styles and Tailwind config
└── types/              # TypeScript type definitions

webnovel-manager-api/
├── app/                # FastAPI application
│   ├── routers/        # API route handlers
│   ├── models/         # Data models
│   ├── services/       # Business logic
│   └── db/             # Database configuration
└── scripts/            # Utility scripts
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 