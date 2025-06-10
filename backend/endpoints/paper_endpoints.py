# endpoints/paper_endpoints.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
import os
import logging
from database import get_db
from services.paper_service import PaperService
from schemas.paper_schema import PaperResponse
from typing import List
from services.llm_responder_service import LLMResponder


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


@paper_router.post("/upload", response_model=PaperResponse)
def upload_paper(file: UploadFile = File(...), db: Session = Depends(get_db)):
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
    """Serve the PDF file for viewing."""
    paper = PaperService.get_paper(db, paper_id=paper_id)
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    
    # Return the file for viewing
    return FileResponse(paper.file_path)

@paper_router.get("/get_all_papers", response_model=List[PaperResponse])
def read_papers( db: Session = Depends(get_db)):
    papers = PaperService.get_all_papers(db)
    return papers

@paper_router.get("/{paper_id}", response_model=PaperResponse)
def read_paper(paper_id: int, db: Session = Depends(get_db)):
    db_paper = PaperService.get_paper(db, paper_id=paper_id)
    if db_paper is None:
        raise HTTPException(status_code=404, detail="Paper not found")
    return db_paper
