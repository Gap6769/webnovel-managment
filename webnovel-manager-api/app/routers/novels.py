from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from typing import List, Optional
from ..models.novel import NovelCreate, NovelPublic, NovelUpdate, PyObjectId, Chapter
from ..db.database import get_database
from ..services.scraper_service import scrape_chapters_for_novel, scrape_novel_info, scrape_chapter_content, ScraperError
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from fastapi.responses import FileResponse, StreamingResponse
import os
import io
from ..services.epub_service import epub_service

router = APIRouter()
NOVEL_COLLECTION = "novels"

@router.post(
    "/", 
    response_model=NovelPublic, 
    status_code=status.HTTP_201_CREATED,
    tags=["novels"]
)
async def create_novel(
    novel_in: NovelCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Adds a new novel to the library."""
    # Check if novel with the same source_url already exists
    existing_novel = await db[NOVEL_COLLECTION].find_one({"source_url": str(novel_in.source_url)})
    if existing_novel:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, 
            detail=f"Novel from source URL {novel_in.source_url} already exists."
        )
    
    # Scrape novel info if not provided
    if not novel_in.title or not novel_in.description:
        try:
            novel_info = await scrape_novel_info(str(novel_in.source_url), novel_in.source_name)
            novel_in.title = novel_info['title']
            novel_in.description = novel_info['description']
            novel_in.cover_image_url = novel_info['cover_image_url']
            novel_in.tags = novel_info['tags']
            novel_in.status = novel_info['status']
        except ScraperError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to scrape novel info: {str(e)}"
            )
    
    # Dump model to dict, excluding unset fields
    novel_dict = novel_in.model_dump(exclude_unset=True)
    
    # Ensure URLs are stored as strings
    if 'source_url' in novel_dict:
        novel_dict['source_url'] = str(novel_dict['source_url'])
    if 'cover_image_url' in novel_dict and novel_dict['cover_image_url']:
        novel_dict['cover_image_url'] = str(novel_dict['cover_image_url'])
        
    # Add timestamps
    novel_dict["added_at"] = datetime.utcnow()
    novel_dict["last_updated_api"] = datetime.utcnow()
    
    insert_result = await db[NOVEL_COLLECTION].insert_one(novel_dict)
    created_novel = await db[NOVEL_COLLECTION].find_one({"_id": insert_result.inserted_id})
    
    if created_novel is None:
         raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create novel after insert.")

    return NovelPublic(**created_novel)

@router.get("/", response_model=List[NovelPublic], tags=["novels"])
async def get_novels(
    db: AsyncIOMotorDatabase = Depends(get_database),
    skip: int = 0,
    limit: int = 100
):
    """Retrieves a list of all novels in the library."""
    novels_cursor = db[NOVEL_COLLECTION].find().skip(skip).limit(limit)
    novels = await novels_cursor.to_list(length=limit)
    return [NovelPublic(**novel) for novel in novels]

@router.get("/{novel_id}", response_model=NovelPublic, tags=["novels"])
async def get_novel_by_id(
    novel_id: PyObjectId,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Retrieves a specific novel by its ID."""
    novel = await db[NOVEL_COLLECTION].find_one({"_id": novel_id})
    if novel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Novel with id {novel_id} not found")
    return NovelPublic(**novel)

@router.post("/{novel_id}/fetch-chapters", response_model=NovelPublic, tags=["Novels", "Chapters"])
async def fetch_novel_chapters(
    novel_id: PyObjectId,
    recursive: bool = Query(True, description="Whether to recursively follow links to next chapters"),
    max_chapters: int = Query(50, ge=1, le=200, description="Maximum number of chapters to fetch when recursive is true"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Fetches the chapter list for a novel from its source and updates the database.
    """
    # 1. Find the novel
    novel = await db[NOVEL_COLLECTION].find_one({"_id": novel_id})
    if novel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Novel with id {novel_id} not found")

    try:
        novel_obj = NovelPublic(**novel)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error validating novel data: {str(e)}"
        )

    # 2. Scrape chapters using the service
    try:
        print(f"Fetching chapters for novel: {novel_obj.title}")
        print(f"Source: {novel_obj.source_name} | URL: {novel_obj.source_url}")
        print(f"Recursive mode: {recursive}, Max chapters: {max_chapters}")
        
        chapters: List[Chapter] = await scrape_chapters_for_novel(
            str(novel_obj.source_url), 
            novel_obj.source_name,
            recursive=recursive,
            max_chapters=max_chapters
        )
        
        if not chapters:
            print(f"Warning: No chapters found for {novel_obj.title} at {novel_obj.source_url}")
            return novel_obj
            
        print(f"Successfully fetched {len(chapters)} chapters.")
    except ScraperError as e:
        error_msg = f"Scraping failed: {str(e)}"
        print(f"Error: {error_msg}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error_msg)
    except Exception as e:
        import traceback
        error_msg = f"An unexpected error occurred during scraping: {str(e)}"
        print(f"Error: {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error_msg)

    # 3. Update the novel in the database
    try:
        # Convert chapters to dicts AND ensure chapter URLs are strings
        chapters_for_db = []
        for chapter in chapters:
            chapter_dict = chapter.model_dump()
            if 'url' in chapter_dict:
                chapter_dict['url'] = str(chapter_dict['url'])
            chapters_for_db.append(chapter_dict)

        update_data = {
            "chapters": chapters_for_db,
            "last_updated_chapters": datetime.utcnow(),
            "last_updated_api": datetime.utcnow()
        }

        print(f"Updating novel with {len(chapters_for_db)} chapters...")
        
        result = await db[NOVEL_COLLECTION].update_one(
            {"_id": novel_id},
            {"$set": update_data}
        )

        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail=f"Novel with id {novel_id} disappeared during update"
            )
            
        print(f"Novel updated successfully with {len(chapters_for_db)} chapters")
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f"Error updating novel in database: {str(e)}"
        print(f"Error: {error_msg}")
        traceback.print_exc()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error_msg)

    # 4. Return the updated novel
    try:
        updated_novel = await db[NOVEL_COLLECTION].find_one({"_id": novel_id})
        if updated_novel is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Failed to retrieve novel after update."
            )
            
        result = NovelPublic(**updated_novel)
        print(f"Successfully returned updated novel with {len(result.chapters)} chapters")
        return result
    except Exception as e:
        error_msg = f"Error retrieving updated novel: {str(e)}"
        print(f"Error: {error_msg}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error_msg)

@router.patch("/{novel_id}", response_model=NovelPublic, tags=["novels"])
async def update_novel(
    novel_id: PyObjectId,
    novel_update: NovelUpdate = Body(...),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Updates an existing novel."""
    update_data = novel_update.model_dump(exclude_unset=True)
    
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No update data provided")

    # Ensure URLs are stored as strings if they are being updated
    if 'source_url' in update_data and update_data['source_url']:
        update_data['source_url'] = str(update_data['source_url'])
    if 'cover_image_url' in update_data and update_data['cover_image_url']:
        update_data['cover_image_url'] = str(update_data['cover_image_url'])

    # Ensure we update the timestamp
    update_data["last_updated_api"] = datetime.utcnow()

    result = await db[NOVEL_COLLECTION].update_one(
        {"_id": novel_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Novel with id {novel_id} not found")

    updated_novel = await db[NOVEL_COLLECTION].find_one({"_id": novel_id})
    if updated_novel is None: # Should not happen if matched_count > 0, but safety check
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve updated novel.")
        
    return NovelPublic(**updated_novel)

@router.delete("/{novel_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["novels"])
async def delete_novel(
    novel_id: PyObjectId,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Deletes a novel from the library."""
    result = await db[NOVEL_COLLECTION].delete_one({"_id": novel_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Novel with id {novel_id} not found")
    return 

@router.get("/{novel_id}/download", tags=["novels"])
async def download_novel(
    novel_id: PyObjectId,
    start_chapter: Optional[int] = Query(None, description="Starting chapter number"),
    end_chapter: Optional[int] = Query(None, description="Ending chapter number"),
    single_chapter: Optional[int] = Query(None, description="Single chapter number to download"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Descarga el archivo EPUB de la novela o de capítulos específicos."""
    # Busca la novela en la base de datos
    novel = await db[NOVEL_COLLECTION].find_one({"_id": novel_id})
    if novel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Novel with id {novel_id} not found")

    # Convertir a modelo NovelPublic para validación
    novel_obj = NovelPublic(**novel)
    
    # Verificar que hay capítulos
    if not novel_obj.chapters:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No chapters found for this novel")
        
    # Obtener los números de capítulo disponibles
    available_chapters = sorted([c.chapter_number for c in novel_obj.chapters])
    min_chapter = available_chapters[0]
    max_chapter = available_chapters[-1]
        
    # Validar los parámetros de capítulos
    if single_chapter is not None:
        if single_chapter < min_chapter or single_chapter > max_chapter:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid chapter number. Must be between {min_chapter} and {max_chapter}"
            )
    else:
        if start_chapter is not None and (start_chapter < min_chapter or start_chapter > max_chapter):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid start chapter. Must be between {min_chapter} and {max_chapter}"
            )
        if end_chapter is not None and (end_chapter < min_chapter or end_chapter > max_chapter):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid end chapter. Must be between {min_chapter} and {max_chapter}"
            )
        if start_chapter is not None and end_chapter is not None and start_chapter > end_chapter:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start chapter must be less than or equal to end chapter"
            )

    try:
        # Generar el EPUB en memoria
        epub_bytes, filename = await epub_service.create_epub(
            novel_id=str(novel_id),
            novel_title=novel_obj.title,
            author=novel_obj.author or "Unknown",
            chapters=novel_obj.chapters,
            start_chapter=start_chapter,
            end_chapter=end_chapter,
            single_chapter=single_chapter
        )
        
        # Devolver el archivo EPUB como respuesta
        return StreamingResponse(
            io.BytesIO(epub_bytes),
            media_type='application/epub+zip',
            headers={
                'Content-Disposition': f'attachment; filename="{filename}"'
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating EPUB: {str(e)}"
        ) 