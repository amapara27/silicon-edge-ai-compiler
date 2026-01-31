from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
from pathlib import Path

# add backend root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from api.modules.model_upload import router as model_router

app = FastAPI(
    title="Silicon API",
    description="Edge AI Pre-Compiler",
    version="0.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# register module routers
app.include_router(model_router)


@app.get("/")
async def root():
    return {"message": "Silicon API", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
