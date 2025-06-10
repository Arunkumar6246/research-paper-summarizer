# endpoints/summary_endpoints.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from services.summary_service import SummaryService
from typing import List

summary_router = APIRouter()

@summary_router.get("/paper/{paper_id}", response_model=List[dict])
def get_paper_summaries(paper_id: int, db: Session = Depends(get_db)):
    """
    Get all summaries for a specific paper.
    
    This endpoint retrieves all section summaries generated for a paper identified by its ID.
    
    Parameters:
    - paper_id: ID of the paper to get summaries for
    - db: Database session dependency
    
    Returns:
    - List[dict]: List of summaries containing section titles, summary texts, and page numbers
    """
    return SummaryService.get_paper_summaries(db, paper_id)
