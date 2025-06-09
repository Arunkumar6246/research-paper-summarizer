# endpoints/summary_endpoints.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from services.summary_service import SummaryService
from typing import List

summary_router = APIRouter()

@summary_router.get("/paper/{paper_id}", response_model=List[dict])
def get_paper_summaries(paper_id: int,  db: Session = Depends(get_db)):
    return SummaryService.get_paper_summaries(db, paper_id)
