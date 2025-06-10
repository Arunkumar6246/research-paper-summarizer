# services/paperservice.py
from sqlalchemy.orm import Session
from models.paper import Paper
from typing import List, Optional


class PaperService:
    @staticmethod
    def save_paper(db: Session, file_path: str, filename: str):
        """
        Save a paper to the database

        """
        try:
            # Create and save the paper
            db_paper = Paper(filename=filename, file_path=file_path)
            db.add(db_paper)
            db.commit()
            db.refresh(db_paper)
            return db_paper

        except Exception as e:
            # Roll back transaction and re-raise with context
            db.rollback()
            raise Exception(f"Error saving paper {filename}: {str(e)}")
    
    @staticmethod
    def get_all_papers(db: Session) -> List[Paper]:
        """
        Get all papers ordered by ID descending
        
        """
        try:
            return db.query(Paper).order_by(Paper.id.desc()).all()
        except Exception as e:
            raise Exception(f"Error retrieving papers: {str(e)}")
    
    @staticmethod
    def get_paper(db: Session, paper_id: int) -> Optional[Paper]:
        """
        Get a specific paper by ID

        """
        try:        
            return db.query(Paper).filter(Paper.id == paper_id).first()
        except Exception as e:
            raise Exception(f"Error retrieving paper with ID {paper_id}: {str(e)}")
