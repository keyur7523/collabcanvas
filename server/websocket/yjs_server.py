"""
Yjs WebSocket server using pycrdt-websocket.
"""
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from starlette.websockets import WebSocketState

from pycrdt.websocket import WebsocketServer

from services.auth import verify_token

logger = logging.getLogger(__name__)

websocket_server = WebsocketServer(auto_clean_rooms=True)
router = APIRouter()


class WebsocketAdapter:
    """Adapts FastAPI WebSocket to pycrdt-websocket interface."""
    
    def __init__(self, websocket: WebSocket, path: str):
        self._websocket = websocket
        self._path = path
    
    @property
    def path(self) -> str:
        return self._path
    
    async def recv(self) -> bytes:
        """Receive a message."""
        return await self._websocket.receive_bytes()
    
    async def send(self, message: bytes) -> None:
        """Send a message."""
        if self._websocket.client_state == WebSocketState.CONNECTED:
            await self._websocket.send_bytes(message)
    
    async def __aiter__(self):
        """Iterate over incoming messages."""
        try:
            while self._websocket.client_state == WebSocketState.CONNECTED:
                yield await self.recv()
        except WebSocketDisconnect:
            pass
        except Exception:
            pass


@router.websocket("/ws/{room_name}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_name: str,
    token: Optional[str] = Query(default=None),
):
    logger.info(f"WebSocket connection: room={room_name}")
    
    # Optional auth
    if token:
        user_id = verify_token(token)
        if user_id:
            logger.info(f"Authenticated: {user_id}")

    await websocket.accept()
    
    adapter = WebsocketAdapter(websocket, room_name)
    
    try:
        await websocket_server.serve(adapter)
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: room={room_name}")
    except Exception as e:
        logger.error(f"WebSocket error: {e}", exc_info=True)
    
    logger.info(f"WebSocket closed: room={room_name}")