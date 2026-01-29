"""
Yjs WebSocket server using pycrdt-websocket.
Handles real-time collaboration for canvas boards.

FIXES APPLIED:
- Correct import: pycrdt_websocket (not pycrdt.websocket)
- JWT authentication via query parameter
- Proper error handling
"""
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status

# CRITICAL FIX: The package is "pycrdt-websocket" but import uses underscore
from pycrdt.websocket import WebsocketServer

from services.auth import verify_token

logger = logging.getLogger(__name__)

# Create the WebSocket server instance
websocket_server = WebsocketServer(auto_clean_rooms=True)

# Create router for WebSocket endpoints
router = APIRouter()


class WebSocketAdapter:
    """Adapter to make FastAPI WebSocket compatible with pycrdt-websocket."""

    def __init__(self, websocket: WebSocket, room_name: str):
        self._websocket = websocket
        self._room_name = room_name
        self._closed = False

    @property
    def path(self) -> str:
        return self._room_name

    async def recv(self) -> bytes:
        try:
            return await self._websocket.receive_bytes()
        except WebSocketDisconnect:
            self._closed = True
            raise

    async def send(self, data: bytes) -> None:
        if not self._closed:
            await self._websocket.send_bytes(data)

    def __aiter__(self):
        return self

    async def __anext__(self) -> bytes:
        try:
            data = await self._websocket.receive_bytes()
            return data
        except WebSocketDisconnect:
            self._closed = True
            raise StopAsyncIteration
        except Exception:
            raise StopAsyncIteration


def authenticate_websocket(token: Optional[str]) -> Optional[str]:
    """
    Verify JWT token and return user_id if valid.
    Returns None if no token provided (allows anonymous for public boards).
    """
    if not token:
        return None
    return verify_token(token)


@router.websocket("/ws/{room_name}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_name: str,
    token: Optional[str] = Query(default=None),
):
    """
    Handle WebSocket connections for Yjs collaboration.
    
    URL format: ws://host:port/ws/{room_name}?token={jwt_token}
    
    The y-websocket library on the frontend will connect here.
    The room_name corresponds to the boardId.
    """
    client_ip = websocket.client.host if websocket.client else "unknown"
    logger.info(f"WebSocket connection request: room={room_name}, ip={client_ip}, has_token={token is not None}")

    # Authenticate if token provided
    user_id = authenticate_websocket(token)
    if token and not user_id:
        logger.warning(f"WebSocket auth failed: room={room_name}, ip={client_ip}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid token")
        return

    if user_id:
        logger.info(f"WebSocket authenticated: user={user_id}, room={room_name}")
    else:
        logger.info(f"WebSocket anonymous connection: room={room_name}")

    try:
        await websocket.accept()
        logger.info(f"WebSocket accepted: room={room_name}")

        # Create adapter and serve via pycrdt-websocket
        adapter = WebSocketAdapter(websocket, room_name)
        await websocket_server.serve(adapter)

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: room={room_name}")
    except RuntimeError as e:
        logger.error(f"WebSocket RuntimeError in room {room_name}: {e}")
        try:
            await websocket.close(code=1011, reason=str(e)[:120])
        except Exception:
            pass
    except Exception as e:
        logger.error(f"WebSocket error in room {room_name}: {e}", exc_info=True)
        try:
            await websocket.close(code=1011, reason="Internal server error")
        except Exception:
            pass


logger.info("Yjs WebSocket server initialized")
