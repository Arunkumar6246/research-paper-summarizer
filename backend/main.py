import uvicorn
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from endpoints import paper_endpoints, summary_endpoints


app = FastAPI(title="Research Paper Summarizer")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "Research Paper Summarizer API"}

# Add your API endpoints here
app.include_router(paper_endpoints.paper_router, prefix="api/paper")
app.include_router(summary_endpoints.summary_router, prefix="api/summary")



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
