"""
Yjs WebSocket server using pycrdt-websocket.
Handles real-time collaboration for canvas boards.
"""
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from pycrdt.websocket import WebsocketServer

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


@router.websocket("/ws/{room_name}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_name: str,
    token: Optional[str] = Query(default=None),
):
    """Handle WebSocket connections for Yjs collaboration."""
    logger.info(f"WebSocket connection request: room={room_name}, has_token={token is not None}")
    logger.info(f"WebSocket server started: {websocket_server.started}")

    try:
        await websocket.accept()
        logger.info(f"WebSocket accepted: room={room_name}")

        # Create adapter and connect to pycrdt room
        adapter = WebSocketAdapter(websocket, room_name)
        await websocket_server.serve(adapter)

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected: room={room_name}")
    except RuntimeError as e:
        logger.error(f"WebSocket RuntimeError in room {room_name}: {e}")
        await websocket.close(code=1011, reason=str(e))
    except Exception as e:
        logger.error(f"WebSocket error in room {room_name}: {e}", exc_info=True)


logger.info("Yjs WebSocket server initialized")
