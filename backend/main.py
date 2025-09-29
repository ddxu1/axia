from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from datetime import datetime

# Import API routes
from api.auth import router as auth_router
from api.emails import router as emails_router
from api.direct_auth import router as direct_auth_router

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Email Client API",
    description="Backend API for the email client application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth_router)
app.include_router(emails_router)
app.include_router(direct_auth_router)

@app.get("/")
def read_root():
    return {"message": "Email Client API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database_url": os.getenv("DATABASE_URL", "not configured"),
        "debug": os.getenv("DEBUG", "false")
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)