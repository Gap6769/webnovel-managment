import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import re

async def migrate_chapters():
    # Conexión a MongoDB
    client = AsyncIOMotorClient("mongodb://localhost:27017")
    db = client.webnovel_manager
    novels_collection = db.novels

    # Obtener todas las novelas
    novels = await novels_collection.find({}).to_list(length=None)
    
    for novel in novels:
        if "chapters" not in novel:
            continue
            
        updated_chapters = []
        for chapter in novel["chapters"]:
            # Extraer el número del capítulo del título
            title = chapter.get("title", "")
            match = re.search(r"Capítulo\s+(\d+)", title)
            
            if match:
                chapter_number = int(match.group(1))
            else:
                # Si no encontramos el número en el título, intentamos extraerlo de la URL
                url = chapter.get("url", "")
                match = re.search(r"/(\d+)$", url)
                chapter_number = int(match.group(1)) if match else 0
            
            # Crear el capítulo actualizado
            updated_chapter = {
                **chapter,
                "chapter_number": chapter_number,
                "chapter_title": title  # Usamos el título existente como chapter_title
            }
            updated_chapters.append(updated_chapter)
        
        # Actualizar la novela con los capítulos migrados
        await novels_collection.update_one(
            {"_id": novel["_id"]},
            {"$set": {"chapters": updated_chapters}}
        )
        print(f"Migrated chapters for novel: {novel.get('title', 'Unknown')}")

    print("Migration completed!")

if __name__ == "__main__":
    asyncio.run(migrate_chapters()) 