# services/paperservice.py
from sqlalchemy.orm import Session
from models.paper import Paper
import pdfplumber
import re
from collections import defaultdict


class PaperService:
    @staticmethod
    def save_paper(db: Session, file_path: str, filename: str):
        """Save a paper to the database"""
        db_paper = Paper(filename=filename, file_path=file_path)
        db.add(db_paper)
        db.commit()
        db.refresh(db_paper)
        return db_paper
    
    @staticmethod
    def get_all_papers(db: Session):
        """Get all papers with pagination"""
        return db.query(Paper).order_by(Paper.id.desc()).all()
    
    @staticmethod
    def get_paper(db: Session, paper_id: int):
        """Get a specific paper by ID"""
        return db.query(Paper).filter(Paper.id == paper_id).first()
