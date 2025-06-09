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
    def get_all_papers(db: Session, skip: int = 0, limit: int = 100):
        """Get all papers with pagination"""
        return db.query(Paper).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_paper(db: Session, paper_id: int):
        """Get a specific paper by ID"""
        return db.query(Paper).filter(Paper.id == paper_id).first()

    @staticmethod
    def extract_all_sections_and_subsections(file_path):
        """Extract sections and subsections from a PDF file"""
        sections = defaultdict(lambda: {
            "title": "",
            "page": None,
            "full_section": "",
            "subsections": {}
        })

        current_section = None
        current_subsection = None

        with pdfplumber.open(file_path) as pdf:
            for page_index, page in enumerate(pdf.pages):
                text = page.extract_text()
                if not text:
                    continue

                lines = text.split('\n')

                for line in lines:
                    line = line.strip()
                    if not line:
                        continue

                    # Subsection pattern: 1.1 Title, 2.3 Title
                    subsection_match = re.match(r'^(\d+\.\d+)\s+([A-Z][^\n]*)', line)
                    # Section pattern: 1 Title, 2 Title
                    section_match = re.match(r'^(\d+)\s+([A-Z][^\n]*)', line)

                    if subsection_match:
                        sub_id = subsection_match.group(1)
                        sub_title = subsection_match.group(2)
                        section_id = sub_id.split('.')[0]

                        # Save subsection
                        sections[section_id]["subsections"][sub_id] = {
                            "title": sub_title,
                            "page": page_index + 1,
                            "text": line + "\n"
                        }

                        # Ensure section exists and set page number if needed
                        if not sections[section_id]["page"]:
                            sections[section_id]["page"] = page_index + 1

                        current_section = section_id
                        current_subsection = sub_id
                        sections[section_id]["full_section"] += line + "\n"

                    elif section_match and '.' not in section_match.group(1):
                        section_id = section_match.group(1)
                        section_title = section_match.group(2)

                        # Start new section
                        current_section = section_id
                        current_subsection = None

                        sections[section_id]["title"] = section_title
                        sections[section_id]["page"] = page_index + 1
                        sections[section_id]["full_section"] += line + "\n"

                    elif current_subsection:
                        sections[current_section]["subsections"][current_subsection]["text"] += line + "\n"
                        sections[current_section]["full_section"] += line + "\n"

                    elif current_section:
                        sections[current_section]["full_section"] += line + "\n"

        return dict(sections)
