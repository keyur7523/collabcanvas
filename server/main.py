from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from websocket.yjs_server import websocket_server, router as ws_router
from routes.auth import router as auth_router
from routes.boards import router as boards_router
from routes.comments import router as comments_router
from routes.sharing import router as sharing_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown."""
    logger.info("Starting CollabCanvas API...")
    
    # Use WebsocketServer as async context manager
    async with websocket_server:
        logger.info("Yjs WebSocket server started")
        yield
    
    logger.info("CollabCanvas API shut down")


app = FastAPI(title="CollabCanvas API", lifespan=lifespan, redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://collabcanvas.vercel.app",
        "https://collabcanvas-tau.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/api/health")
async def api_health():
    return {"status": "healthy", "version": "0.1.0"}


# Include routers
app.include_router(ws_router)
app.include_router(auth_router)
app.include_router(boards_router)
app.include_router(comments_router)
app.include_router(sharing_router)