# endpoints/paper_endpoints.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
import os
import logging
from database import get_db
from services.paper_service import PaperService
from typing import List
from services.llm_responder_service import LLMResponder
from pydantic import BaseModel
from datetime import datetime




logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # This ensures logs go to the console
    ]
)

# Configure logger
logger = logging.getLogger(__name__)
paper_router = APIRouter()


# Pydantic models
class PaperResponse(BaseModel):
    id: int
    upload_date: datetime
    filename: str
    file_path: str

    class Config:
        from_attributes = True


# ---------------Endpoints--------------

@paper_router.post("/upload", response_model=PaperResponse)
def upload_paper(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload a PDF research paper.
    
    This endpoint accepts a PDF file, saves it to the server, stores its metadata in the database,
    and initiates the process of extracting sections and generating summaries.
    
    Parameters:
    - file: The PDF file to upload
    - db: Database session dependency
    
    Returns:
    - PaperResponse: The saved paper's metadata
    
    Raises:
    - HTTPException(500): If there's an error during upload or processing
    """
    try:
        logger.info(f"Uploading file: {file.filename}")
        
        # Save the uploaded file
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())
        
        
        # Save paper to database
        paper = PaperService.save_paper(db, file_path, file.filename)
        logger.info(f"Paper saved to database with ID: {paper.id}")
        
        # Process sections and generate summaries
        LLMResponder.process_paper_sections(db, paper.id, file_path)
        
        return paper
    except Exception as e:
        logger.error(f"Error uploading file {file.filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")
    
@paper_router.get("/{paper_id}/view")
def view_pdf(paper_id: int, db: Session = Depends(get_db)):
    """
    Serve the PDF file for viewing.
    
    This endpoint retrieves a PDF file from storage and serves it directly to the client
    for viewing in the browser.
    
    Parameters:
    - paper_id: ID of the paper to view
    - db: Database session dependency
    
    Returns:
    - FileResponse: The PDF file for viewing
    
    Raises:
    - HTTPException(404): If the paper is not found
    - HTTPException(500): If there's an error retrieving or serving the file
    """
    try:
        paper = PaperService.get_paper(db, paper_id=paper_id)
        if not paper:
            raise HTTPException(status_code=404, detail="Paper not found")
        
        # Check if file exists
        if not os.path.exists(paper.file_path):
            logger.error(f"PDF file not found at path: {paper.file_path}")
            raise HTTPException(status_code=404, detail="PDF file not found on server")
        
        return FileResponse(paper.file_path)

    except Exception as e:
        logger.error(f"Error serving PDF for paper ID {paper_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error serving PDF file: {str(e)}")


@paper_router.get("/get_all_papers", response_model=List[PaperResponse])
def read_papers(db: Session = Depends(get_db)):
    """
    Get all uploaded papers.
    
    This endpoint retrieves metadata for all papers stored in the database.
    
    Parameters:
    - db: Database session dependency
    
    Returns:
    - List[PaperResponse]: List of all papers' metadata
    
    Raises:
    - HTTPException(500): If there's an error retrieving papers
    """
    try:
        papers = PaperService.get_all_papers(db)
        return papers
        
    except Exception as e:
        logger.error(f"Error retrieving papers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving papers: {str(e)}")

@paper_router.get("/{paper_id}", response_model=PaperResponse)
def read_paper(paper_id: int, db: Session = Depends(get_db)):
    """
    Get a specific paper by ID.
    
    This endpoint retrieves metadata for a single paper identified by its ID.
    
    Parameters:
    - paper_id: ID of the paper to retrieve
    - db: Database session dependency
    
    Returns:
    - PaperResponse: The paper's metadata
    
    Raises:
    - HTTPException(404): If the paper is not found
    - HTTPException(500): If there's an error retrieving the paper
    """
    try:
        db_paper = PaperService.get_paper(db, paper_id=paper_id)

        if db_paper is None:
            raise HTTPException(status_code=404, detail="Paper not found")
        
        return db_paper
    
    except Exception as e:
        logger.error(f"Error retrieving paper with ID {paper_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving paper: {str(e)}")
