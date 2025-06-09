# endpoints/paper_endpoints.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os
from database import get_db
from services.paper_service import PaperService
from schemas.paper_schema import PaperResponse
from typing import List

paper_router = APIRouter()

@paper_router.post("/upload", response_model=PaperResponse)
def upload_paper(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Save the uploaded file
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        buffer.write(file.file.read())
    
    # Save paper to database
    return PaperService.save_paper(db, file_path, file.filename)

@paper_router.get("/get_all_papers", response_model=List[PaperResponse])
def read_papers(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    papers = PaperService.get_all_papers(db, skip=skip, limit=limit)
    return papers



