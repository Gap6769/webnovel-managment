from motor.motor_asyncio import AsyncIOMotorClient
from ..core.config import settings

class Database:
    client: AsyncIOMotorClient | None = None
    db = None

db_manager = Database()

def connect_to_mongo():
    print(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    db_manager.client = AsyncIOMotorClient(settings.MONGODB_URL)
    db_manager.db = db_manager.client[settings.MONGODB_DB_NAME]
    print(f"Connected to MongoDB database: {settings.MONGODB_DB_NAME}")

def close_mongo_connection():
    print("Closing MongoDB connection...")
    if db_manager.client:
        db_manager.client.close()
    print("MongoDB connection closed.")

def get_database():
    if db_manager.db is None:
        # This case should ideally not happen if connect_to_mongo is called at startup
        print("Database not initialized. Ensure connect_to_mongo is called.")
        # Optionally, you could try to connect here, but it's better to manage lifecycle explicitly
        # connect_to_mongo()
        raise RuntimeError("Database connection not available.")
    return db_manager.db 