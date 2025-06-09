# endpoints/summary_endpoints.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_async_session
from services.summary_service import SummaryService
from typing import List

summary_router = APIRouter()

@summary_router.get("paper/{paper_id}", response_model=List[dict])
async def get_paper_summaries(paper_id: int, session: AsyncSession = Depends(get_async_session)):
    return await SummaryService.get_paper_summaries(session, paper_id)
