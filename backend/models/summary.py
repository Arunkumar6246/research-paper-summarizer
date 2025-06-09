# models.py
from sqlalchemy import Column, Integer, String, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Summary(Base):
    __tablename__ = "summaries"
    
    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"))
    original_text = Column(String)  # Fixed typo here
    section_title = Column(String)
    summary_text = Column(Text)
    page = Column(Integer, default=1)  # Page number where the section appears
    created_at = Column(DateTime, default=datetime.now)
    paper = relationship("Paper", back_populates="summaries")
