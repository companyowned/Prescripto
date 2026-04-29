import asyncio
from app.db.session import engine, init_db

async def test():
    print("Testing DB connection...")
    try:
        async with engine.begin() as conn:
            print("Successfully connected to engine.begin()")
    except Exception as e:
        print(f"Failed to connect engine.begin(): {e}")
    
    print("Calling init_db()...")
    try:
        await init_db()
        print("init_db() completed successfully.")
    except Exception as e:
        print(f"init_db() failed: {e}")

if __name__ == "__main__":
    asyncio.run(test())
