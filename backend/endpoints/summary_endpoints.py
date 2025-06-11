# endpoints/summary_endpoints.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from services.summary_service import SummaryService
from typing import List

summary_router = APIRouter()

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging
from database import get_db
from services.summary_service import SummaryService
from typing import List

# Configure logger
logger = logging.getLogger(__name__)

summary_router = APIRouter()

@summary_router.get("/paper/{paper_id}", response_model=List[dict])
def get_paper_summaries(paper_id: int, db: Session = Depends(get_db)):
    """
    Get all summaries for a specific paper.
    This endpoint retrieves all section summaries generated for a paper identified by its ID.
    """
    try:
        summaries = SummaryService.get_paper_summaries(db, paper_id)

        if not summaries:
            logger.warning(f"No summaries found for paper ID {paper_id}")
            raise HTTPException(status_code=404, detail=f"No summaries found for paper ID {paper_id}")
        
        return summaries
    except ValueError as ve:
        logger.warning(f"Invalid request: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error retrieving summaries for paper ID {paper_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving summaries: {str(e)}")
