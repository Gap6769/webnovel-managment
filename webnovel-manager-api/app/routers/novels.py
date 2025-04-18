from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from typing import List, Optional
from ..models.novel import NovelCreate, NovelPublic, NovelUpdate, PyObjectId, NovelSummary, NovelDetail, ChapterDownloadResponse, Chapter, NovelType
from ..db.database import get_database
from ..services.scraper_service import scrape_chapters_for_novel, scrape_novel_info, ScraperError
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson import ObjectId
from datetime import datetime
from ..services.epub_service import EpubService

router = APIRouter()
NOVEL_COLLECTION = "novels"
epub_service = EpubService()

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

@router.get("/", response_model=List[NovelSummary], tags=["novels"])
async def get_novels(
    db: AsyncIOMotorDatabase = Depends(get_database),
    skip: int = 0,
    limit: int = 100,
    type: Optional[NovelType] = None
):
    """Retrieves a list of all novels in the library with summary information."""
    query = {}
    if type:
        query["type"] = type
    
    novels_cursor = db[NOVEL_COLLECTION].find(query).skip(skip).limit(limit)
    novels = await novels_cursor.to_list(length=limit)
    
    # Convert to NovelSummary with calculated fields
    novel_summaries = []
    for novel in novels:
        chapters = novel.get("chapters", [])
        total_chapters = len(chapters)
        read_chapters = sum(1 for c in chapters if c.get("read", False))
        downloaded_chapters = sum(1 for c in chapters if c.get("downloaded", False))
        last_chapter = max((c["chapter_number"] for c in chapters), default=0)
        
        novel_summaries.append(NovelSummary(
            _id=novel["_id"],
            title=novel["title"],
            author=novel.get("author"),
            cover_image_url=novel.get("cover_image_url"),
            status=novel.get("status"),
            type=novel.get("type", NovelType.NOVEL),
            total_chapters=total_chapters,
            last_chapter_number=last_chapter,
            read_chapters=read_chapters,
            downloaded_chapters=downloaded_chapters,
            last_updated_chapters=novel.get("last_updated_chapters"),
            added_at=novel["added_at"]
        ))
    
    return novel_summaries

@router.get("/{novel_id}", response_model=NovelDetail, tags=["novels"])
async def get_novel_by_id(
    novel_id: PyObjectId,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Retrieves a specific novel by its ID with detailed information."""
    novel = await db[NOVEL_COLLECTION].find_one({"_id": novel_id})
    if novel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Novel with id {novel_id} not found")
    
    # Calculate reading progress
    chapters = novel.get("chapters", [])
    total_chapters = len(chapters)
    read_chapters = sum(1 for c in chapters if c.get("read", False))
    reading_progress = (read_chapters / total_chapters * 100) if total_chapters > 0 else 0
    
    return NovelDetail(
        _id=novel["_id"],
        title=novel["title"],
        author=novel.get("author"),
        cover_image_url=novel.get("cover_image_url"),
        status=novel.get("status"),
        type=novel.get("type", NovelType.NOVEL),
        total_chapters=total_chapters,
        last_chapter_number=max((c["chapter_number"] for c in chapters), default=0),
        read_chapters=read_chapters,
        downloaded_chapters=sum(1 for c in chapters if c.get("downloaded", False)),
        last_updated_chapters=novel.get("last_updated_chapters"),
        added_at=novel["added_at"],
        description=novel.get("description"),
        source_url=novel["source_url"],
        source_name=novel["source_name"],
        tags=novel.get("tags", []),
        reading_progress=reading_progress
    )

@router.patch("/{novel_id}", response_model=NovelDetail, tags=["novels"])
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
    if 'source_language' in update_data and update_data['source_language']:
        update_data['source_language'] = str(update_data['source_language'])

    # Ensure we update the timestamp
    update_data["last_updated_api"] = datetime.utcnow()

    result = await db[NOVEL_COLLECTION].update_one(
        {"_id": novel_id},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Novel with id {novel_id} not found")

    # Return the updated novel with all details
    return await get_novel_by_id(novel_id, db)

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


@router.patch("/{novel_id}/reading-progress", response_model=NovelDetail, tags=["novels"])
async def update_reading_progress(
    novel_id: PyObjectId,
    current_chapter: int = Query(..., description="The current chapter number being read"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update the reading progress of a novel by marking chapters as read and downloaded up to the current chapter."""
    # Find the novel
    novel = await db[NOVEL_COLLECTION].find_one({"_id": novel_id})
    if novel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Novel with id {novel_id} not found")
    
    # Get all chapters
    chapters = novel.get("chapters", [])
    if not chapters:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No chapters available for this novel")
    
    # Update chapter statuses
    for chapter in chapters:
        chapter_number = chapter["chapter_number"]
        if chapter_number < current_chapter:
            # Mark chapters before current as read and downloaded
            await db[NOVEL_COLLECTION].update_one(
                {"_id": novel_id, "chapters.chapter_number": chapter_number},
                {
                    "$set": {
                        "chapters.$.read": True,
                        "chapters.$.downloaded": True
                    }
                }
            )
        elif chapter_number == current_chapter:
            # Mark current chapter as neither read nor downloaded
            await db[NOVEL_COLLECTION].update_one(
                {"_id": novel_id, "chapters.chapter_number": chapter_number},
                {
                    "$set": {
                        "chapters.$.read": False,
                        "chapters.$.downloaded": False
                    }
                }
            )
        else:
            # Mark chapters after current as neither read nor downloaded
            await db[NOVEL_COLLECTION].update_one(
                {"_id": novel_id, "chapters.chapter_number": chapter_number},
                {
                    "$set": {
                        "chapters.$.read": False,
                        "chapters.$.downloaded": False
                    }
                }
            )
    
    # Return the updated novel
    updated_novel = await db[NOVEL_COLLECTION].find_one({"_id": novel_id})
    if updated_novel is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve updated novel")
    
    # Calculate reading progress
    total_chapters = len(updated_novel.get("chapters", []))
    read_chapters = sum(1 for c in updated_novel.get("chapters", []) if c.get("read", False))
    reading_progress = (read_chapters / total_chapters * 100) if total_chapters > 0 else 0
    
    return NovelDetail(
        _id=updated_novel["_id"],
        title=updated_novel["title"],
        author=updated_novel.get("author"),
        cover_image_url=updated_novel.get("cover_image_url"),
        status=updated_novel.get("status"),
        type=updated_novel.get("type", NovelType.NOVEL),
        total_chapters=total_chapters,
        last_chapter_number=max((c["chapter_number"] for c in updated_novel.get("chapters", [])), default=0),
        read_chapters=read_chapters,
        downloaded_chapters=sum(1 for c in updated_novel.get("chapters", []) if c.get("downloaded", False)),
        last_updated_chapters=updated_novel.get("last_updated_chapters"),
        added_at=updated_novel["added_at"],
        description=updated_novel.get("description"),
        source_url=updated_novel["source_url"],
        source_name=updated_novel["source_name"],
        tags=updated_novel.get("tags", []),
        reading_progress=reading_progress
    )

@router.post("/{novel_id}/metadata", response_model=NovelDetail, tags=["novels"])
async def update_metadata(
    novel_id: PyObjectId,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update the metadata of a novel by scraping it from the source website."""
    # Find the novel
    novel = await db[NOVEL_COLLECTION].find_one({"_id": novel_id})
    if novel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Novel with id {novel_id} not found")
    
    try:
        # Scrape novel info from source
        novel_info = await scrape_novel_info(str(novel["source_url"]), novel["source_name"])
        
        # Update novel with new metadata
        update_data = {
            "title": novel_info["title"],
            "author": novel_info["author"],
            "description": novel_info["description"],
            "cover_image_url": novel_info["cover_image_url"],
            "tags": novel_info["tags"],
            "status": novel_info["status"],
            "last_updated_api": datetime.utcnow()
        }
        
        # Ensure URLs are stored as strings
        if update_data["cover_image_url"]:
            update_data["cover_image_url"] = str(update_data["cover_image_url"])
        
        result = await db[NOVEL_COLLECTION].update_one(
            {"_id": novel_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Novel with id {novel_id} not found")
        
        # Return the updated novel with all details
        return await get_novel_by_id(novel_id, db)
        
    except ScraperError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to scrape novel info: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        ) 