from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool
import ssl

from config import settings


def get_connect_args():
    """Get connection arguments for asyncpg with Supabase."""
    # Create SSL context for Supabase
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    return {
        "ssl": ssl_context,
        "timeout": 60,  # Connection timeout (default is 10s, too short for cold starts)
        "command_timeout": 60,  # Query timeout
    }


# For Supabase + serverless (Render), use NullPool to avoid connection pooling issues
# Each request gets a fresh connection - more reliable for cold starts
engine = create_async_engine(
    settings.database_url,
    echo=False,  # Set to True for SQL debugging
    poolclass=NullPool,  # No connection pooling - better for serverless
    connect_args=get_connect_args(),
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