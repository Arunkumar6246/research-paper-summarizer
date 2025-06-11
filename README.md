# Research Paper Summarizer

A full-stack application that automatically summarizes research papers using AI. The application processes PDF documents, extracts text content, and generates concise summaries for each section using Google's Gemini AI model.

![Research Paper Summarizer Demo](research_paper_summarizer.gif)

## Features

- PDF upload and processing
- Automatic section detection and summarization
- Interactive web interface
- Real-time status updates
- Section-by-section summary viewing
- Database persistence for papers and summaries

## Architecture

The application is built using a modern tech stack:

- Backend: FastAPI (Python)
- Frontend: React with Tailwind CSS
- Database: SQLAlchemy with Alembic migrations
- AI: Google Gemini AI for text generation
- PDF Processing: PDFPlumber for text extraction

## Setup Instructions

### Prerequisites

- Python 3.8+
- Node.js 16+
- Google Cloud API key for Gemini AI

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd research-paper-summarizer/backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a .env file with the following variables:
   ```
   GEMINI_API_KEY=your_gemini_api_key
   ```

5. Run database migrations:
   ```bash
   alembic upgrade head
   ```

6. Start the backend server:
   ```bash
   uvicorn main:app --reload 
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd research-paper-summarizer/react-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
3.Create a .env file with the following variables:
   ```bash
   REACT_APP_API_URL=http://localhost:8000/api
   ```

4. Start the development server:
   ```bash
   npm start
   ```

The application will be available at http://localhost:3000

## How It Works

### PDF Processing and Summarization Flow

1. **PDF Upload**: When a PDF is uploaded, it's processed by the backend using PDFPlumber.

2. **Text Extraction**:
   - Headers and footers are automatically removed
   - Text is extracted page by page
   - Images, tables, and graphs are excluded

3. **AI Processing**:
   - Content is sent to Gemini AI in a page-by-page manner
   - The AI model identifies section titles and generates summaries
   - Results are formatted as JSON with section titles, summaries, and page numbers

4. **Storage and Retrieval**:
   - Summaries are stored in the database
   - Frontend retrieves and displays summaries in an organized table format

### Design Decisions and Assumptions

1. **PDF Processing**:
   - Assumes research papers follow a standard format with sections
   - Headers and footers are identified based on page height ratios
   - Tables and figures are excluded to focus on text content

2. **AI Integration**:
   - Uses Gemini 2.0 Flash Lite model for faster processing
   - Implements a chat-based approach for context retention
   - Processes pages sequentially to maintain document flow

3. **Error Handling**:
   - Robust JSON extraction with multiple fallback methods
   - Comprehensive error logging
   - User-friendly error notifications

4. **Frontend Design**:
   - Clean, minimalist interface
   - Real-time upload status feedback
   - Responsive design for various screen sizes

5. **Database Structure**:
   - Papers and summaries stored in separate tables
   - Maintains relationships between papers and their sections
   - Uses SQLite for simplicity and portability


