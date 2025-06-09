# endpoints/paper_endpoints.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from fastapi.responses import FileResponse
import os
import logging
from database import get_db
from services.paper_service import PaperService
from services.summary_service import SummaryService
from llm.llm_responder import LLMResponder
from schemas.paper_schema import PaperResponse
from typing import List


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

def process_paper_sections(db: Session, paper_id: int, file_path: str):
    try:
        logger.info(f"Starting processing for paper ID: {paper_id}")
        
        # Extract sections and subsections
        logger.info(f"Extracting sections from {file_path}")
        sections = PaperService.extract_all_sections_and_subsections(file_path)
        logger.info(f"Found {len(sections)} sections")
        
        # Initialize LLM responder
        llm = LLMResponder()
        
        # Process each section and subsection
        for section_id, section_data in sections.items():
            try:
                # Generate summary for the full section
                section_title = section_data["title"]
                section_text = section_data["full_section"]
                page = section_data["page"] or 1
                
                logger.info(f"Generating summary for section: {section_title}")
                
                # Generate summary using LLM
                summary_text = llm.generate_summary(section_text)
                
                # Save the section summary
                SummaryService.save_summary(
                    session=db,
                    paper_id=paper_id,
                    section_title=section_title,
                    summary_text=summary_text,
                    page=page
                )
                logger.info(f"Saved summary for section: {section_title}")
                
                # Process subsections if any
                subsections = section_data.get("subsections", {})
                if subsections:
                    logger.info(f"Found {len(subsections)} subsections for section {section_title}")
                    
                    for sub_id, subsection in subsections.items():
                        try:
                            sub_title = f"{sub_id} {subsection['title']}"
                            sub_text = subsection["text"]
                            sub_page = subsection["page"]
                            
                            logger.info(f"Generating summary for subsection: {sub_title}")
                            
                            # Generate summary for subsection
                            sub_summary = llm.generate_summary(sub_text)
                            
                            # Save the subsection summary
                            SummaryService.save_summary(
                                session=db,
                                paper_id=paper_id,
                                section_title=sub_title,
                                summary_text=sub_summary,
                                page=sub_page
                            )
                            logger.info(f"Saved summary for subsection: {sub_title}")
                        except Exception as e:
                            logger.error(f"Error processing subsection {sub_id}: {str(e)}")
            except Exception as e:
                logger.error(f"Error processing section {section_id}: {str(e)}")
        
        logger.info(f"Completed processing for paper ID: {paper_id}")
    except Exception as e:
        logger.error(f"Error in process_paper_sections for paper ID {paper_id}: {str(e)}")

@paper_router.post("/upload", response_model=PaperResponse)
def upload_paper(file: UploadFile = File(...), db: Session = Depends(get_db), background_tasks: BackgroundTasks = BackgroundTasks()):
    try:
        logger.info(f"Uploading file: {file.filename}")
        
        # Save the uploaded file
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, file.filename)
        
        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())
        
        logger.info(f"File saved to {file_path}")
        
        # Save paper to database
        paper = PaperService.save_paper(db, file_path, file.filename)
        logger.info(f"Paper saved to database with ID: {paper.id}")
        
        # Process sections and generate summaries in the background
        background_tasks.add_task(process_paper_sections, db, paper.id, file_path)
        logger.info(f"Background task added for processing paper ID: {paper.id}")
        
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
def read_papers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    papers = PaperService.get_all_papers(db, skip=skip, limit=limit)
    return papers

@paper_router.get("/{paper_id}", response_model=PaperResponse)
def read_paper(paper_id: int, db: Session = Depends(get_db)):
    db_paper = PaperService.get_paper(db, paper_id=paper_id)
    if db_paper is None:
        raise HTTPException(status_code=404, detail="Paper not found")
    return db_paper
