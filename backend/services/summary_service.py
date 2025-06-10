# services/summaryservice.py
from typing import List
from sqlalchemy import select
from models.summary import Summary
from sqlalchemy.orm import Session

class SummaryService:
    @staticmethod
    def save_summary(session: Session, paper_id: int, section_title: str,
                    summary_text: str, page: int = 1) -> Summary:
        """
        Save a summary to the database
       
        """
        try:
            # Create and save the summary
            summary = Summary(
                paper_id=paper_id,
                section_title=section_title,
                summary_text=summary_text,
                page=page
            )
            session.add(summary)
            session.commit()
            session.refresh(summary)
            return summary
            
        except Exception as e:
            # Roll back transaction and re-raise with context
            session.rollback()
            raise Exception(f"Error saving summary for paper ID {paper_id}: {str(e)}")


    @staticmethod
    def get_paper_summaries(db: Session, paper_id: int) -> List[dict]:
        """
        Get all summaries for a specific paper
        """
        try:
            
            stmt = select(Summary.section_title, Summary.summary_text, Summary.page).where(
                Summary.paper_id == paper_id
            ).order_by(Summary.id)
            result = db.execute(stmt)
            summaries = result.all()
            
            return [
                {
                    "section_title": summary[0],
                    "summary_text": summary[1],
                    "page": summary[2] if summary[2] is not None else 1
                }
                for summary in summaries
            ]
        except Exception as e:
            raise Exception(f"Error retrieving summaries for paper ID {paper_id}: {str(e)}")

