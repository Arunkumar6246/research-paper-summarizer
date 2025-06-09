# endpoints/paper_endpoints.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
import os
from database import get_db
from services.paper_service import PaperService
from services.summary_service import SummaryService
from llm.llm_responder import LLMResponder
from schemas.paper_schema import PaperResponse
from typing import List

paper_router = APIRouter()

def process_paper_sections(db: Session, paper_id: int, file_path: str):
    # Extract sections and subsections
    sections = PaperService.extract_all_sections_and_subsections(file_path)
    
    # Initialize LLM responder
    llm = LLMResponder()
    
    # Process each section and subsection
    for section_id, section_data in sections.items():
        # Generate summary for the full section
        section_title = section_data["title"]
        section_text = section_data["full_section"]
        page = section_data["page"] or 1
        
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
        
        # Process subsections if any
        for sub_id, subsection in section_data["subsections"].items():
            sub_title = f"{sub_id} {subsection['title']}"
            sub_text = subsection["text"]
            sub_page = subsection["page"]
            
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

@paper_router.post("/upload", response_model=PaperResponse)
def upload_paper(file: UploadFile = File(...),  db: Session = Depends(get_db)):
    # Save the uploaded file
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())
    
    # Save paper to database
    paper = PaperService.save_paper(db, file_path, file.filename)
    
    # Process sections and generate summaries in the background
    process_paper_sections(db, paper.id, file_path)
    
    return paper

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
