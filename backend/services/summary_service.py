# services/summaryservice.py
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.summary import Summary

class SummaryService:
    @staticmethod
    async def save_summary(
        session: AsyncSession, 
        paper_id: int, 
        section_title: str, 
        summary_text: str, 
        page: int = 1
    ) -> Summary:
        """Save a summary to the database"""
        summary = Summary(
            paper_id=paper_id,
            section_title=section_title,
            summary_text=summary_text,
            page=page
        )
        session.add(summary)
        await session.commit()
        await session.refresh(summary)
        return summary

    @staticmethod
    async def get_paper_summaries(session: AsyncSession, paper_id: int) -> List[dict]:
        """Get all summaries for a specific paper"""
        stmt = select(Summary.section_title, Summary.summary_text, Summary.page).where(
            Summary.paper_id == paper_id
        ).order_by(Summary.id)
        result = await session.execute(stmt)
        summaries = result.all()
        
        return [
            {
                "section_title": summary[0],
                "summary_text": summary[1],
                "page": summary[2] if summary[2] is not None else 1
            }
            for summary in summaries
        ]
