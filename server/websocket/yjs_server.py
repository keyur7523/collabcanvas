"""
Yjs WebSocket server using pycrdt-websocket.
Handles real-time collaboration for canvas boards.
"""
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pycrdt.websocket import WebsocketServer

logger = logging.getLogger(__name__)
logging.getLogger("pycrdt.websocket").setLevel(logging.DEBUG)

# Create the WebSocket server instance
websocket_server = WebsocketServer(auto_clean_rooms=True)

# Create router for WebSocket endpoints
router = APIRouter()


class WebSocketAdapter:
    """Adapter to make FastAPI WebSocket compatible with pycrdt-websocket."""

    def __init__(self, websocket: WebSocket, room_name: str):
        self._websocket = websocket
        self._room_name = room_name

    @property
    def path(self) -> str:
        # pycrdt-websocket uses path as the room name
        return self._room_name

    async def recv(self) -> bytes:
        return await self._websocket.receive_bytes()

    async def send(self, data: bytes) -> None:
        await self._websocket.send_bytes(data)

    def __aiter__(self):
        return self

    async def __anext__(self) -> bytes:
        try:
            return await self.recv()
        except Exception:
            raise StopAsyncIteration


@router.websocket("/ws/{room_name}")
async def websocket_endpoint(websocket: WebSocket, room_name: str):
    """Handle WebSocket connections for Yjs collaboration."""
    logger.info(f"WebSocket connection request for room: {room_name}")

    try:
        await websocket.accept()
        logger.info(f"WebSocket accepted for room: {room_name}")

        # Create adapter and connect to pycrdt room
        adapter = WebSocketAdapter(websocket, room_name)
        await websocket_server.serve(adapter)

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected from room: {room_name}")
    except Exception as e:
        logger.error(f"WebSocket error in room {room_name}: {e}")
        raise


logger.info("Yjs WebSocket server initialized")
