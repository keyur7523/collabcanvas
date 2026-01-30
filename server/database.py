from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
import ssl

from config import settings

# Supabase requires SSL connections
# Create SSL context that doesn't verify certificates (Supabase uses self-signed)
ssl_context = ssl.create_default_context()
ssl_context.check_hostname = False
ssl_context.verify_mode = ssl.CERT_NONE

# Configure engine for Supabase PostgreSQL
# Key settings for Supabase:
# 1. SSL is required
# 2. Use connection pooler URL (port 6543) for serverless, or direct (port 5432)
# 3. Longer timeouts for cold starts
engine = create_async_engine(
    settings.database_url,
    echo=False,  # Set to True for SQL debugging
    pool_pre_ping=True,  # Test connections before using them
    pool_size=5,  # Small pool for serverless
    max_overflow=10,
    pool_timeout=30,  # Wait up to 30s for a connection from pool
    pool_recycle=300,  # Recycle connections every 5 minutes
    connect_args={
        "ssl": ssl_context,
        "timeout": 60,  # Connection timeout
        "command_timeout": 60,  # Query timeout
        "server_settings": {
            "application_name": "collabcanvas",
        },
    },
)

AsyncSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)
Base = declarative_base()


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()