from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool

from config import settings


# For Neon + serverless (Render), use NullPool to avoid connection pooling issues
# Each request gets a fresh connection - more reliable for serverless
# Neon handles SSL via sslmode=require in the connection string
engine = create_async_engine(
    settings.database_url,
    echo=False,  # Set to True for SQL debugging
    poolclass=NullPool,  # No connection pooling - better for serverless
    connect_args={
        "timeout": 60,  # Connection timeout (default is 10s, too short for cold starts)
        "command_timeout": 60,  # Query timeout
        # Note: SSL is handled by sslmode=require in the DATABASE_URL
        # Neon doesn't need a custom SSL context like Supabase
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