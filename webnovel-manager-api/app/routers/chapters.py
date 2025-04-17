from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from ..models.novel import Chapter, ChapterListResponse, ChapterDownloadResponse, PyObjectId
from ..db.database import get_database
from motor.motor_asyncio import AsyncIOMotorDatabase
from ..services.epub_service import epub_service
from ..services.scraper_service import scrape_chapters_for_novel, ScraperError
from fastapi.responses import StreamingResponse
import io
from datetime import datetime

router = APIRouter()
NOVEL_COLLECTION = "novels"

@router.get("/{novel_id}/chapters", response_model=ChapterListResponse, tags=["chapters"])
async def get_chapters(
    novel_id: PyObjectId,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get paginated list of chapters for a novel."""
    # Find the novel
    novel = await db[NOVEL_COLLECTION].find_one({"_id": novel_id})
    if novel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Novel with id {novel_id} not found")

    # Get all chapters and sort them
    chapters = novel.get("chapters", [])
    total_chapters = len(chapters)
    
    # Sort chapters by chapter_number
    chapters.sort(key=lambda x: x["chapter_number"], reverse=(sort_order == "desc"))
    
    # Calculate pagination
    skip = (page - 1) * page_size
    total_pages = (total_chapters + page_size - 1) // page_size
    
    # Get paginated chapters
    paginated_chapters = chapters[skip:skip + page_size]
    
    return ChapterListResponse(
        chapters=paginated_chapters,
        total=total_chapters,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/{novel_id}/chapters/{chapter_number}", tags=["chapters"])
async def download_chapter(
    novel_id: PyObjectId,
    chapter_number: int,
    language: str = Query("en", regex="^(en|es)$"),
    format: str = Query("epub", regex="^(epub|raw)$"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Download a specific chapter."""
    # Find the novel
    novel = await db[NOVEL_COLLECTION].find_one({"_id": novel_id})
    if novel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Novel with id {novel_id} not found")

    # Find the chapter
    chapter_dict = next((c for c in novel.get("chapters", []) if c["chapter_number"] == chapter_number), None)
    if not chapter_dict:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Chapter {chapter_number} not found")

    # Convert dictionary to Chapter object
    chapter = Chapter(
        title=chapter_dict["title"],
        chapter_number=chapter_dict["chapter_number"],
        chapter_title=chapter_dict.get("chapter_title"),
        url=chapter_dict["url"],
        read=chapter_dict.get("read", False),
        downloaded=chapter_dict.get("downloaded", False)
    )

    try:
        if format == "epub":
            # Generate the EPUB
            epub_bytes, filename = await epub_service.create_epub(
                novel_id=str(novel_id),
                novel_title=novel["title"],
                author=novel.get("author", "Unknown"),
                chapters=[chapter],
                source_name=novel["source_name"],
                single_chapter=chapter_number,
                translate=(language == "es")
            )

            # Update chapter status
            await db[NOVEL_COLLECTION].update_one(
                {"_id": novel_id, "chapters.chapter_number": chapter_number},
                {
                    "$set": {
                        "chapters.$.downloaded": True,
                        "chapters.$.read": True
                    }
                }
            )

            return StreamingResponse(
                io.BytesIO(epub_bytes),
                media_type='application/epub+zip',
                headers={
                    'Content-Disposition': f'attachment; filename="{filename}"'
                }
            )
        else:  # format == "raw"
            # Get raw chapter content
            raw_content = await epub_service.fetch_chapter_content(
                chapter_url=chapter.url,
                source_name=novel["source_name"],
                #translate=(language == "es")
            )
            cleaned_content = epub_service.clean_content(raw_content)
            
            return {
                "title": chapter.title,
                "chapter_number": chapter.chapter_number,
                "chapter_title": chapter.chapter_title,
                "content": cleaned_content
            }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chapter: {str(e)}"
        )

@router.post("/{novel_id}/chapters/download", response_model=ChapterDownloadResponse, tags=["chapters"])
async def download_chapters(
    novel_id: PyObjectId,
    chapter_numbers: List[int],
    language: str = Query("en", regex="^(en|es)$"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Download multiple chapters."""
    # Find the novel
    novel = await db[NOVEL_COLLECTION].find_one({"_id": novel_id})
    if novel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Novel with id {novel_id} not found")

    # Filter chapters and convert to Chapter objects
    chapter_dicts = [c for c in novel.get("chapters", []) if c["chapter_number"] in chapter_numbers]
    if not chapter_dicts:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No valid chapters found")

    # Convert dictionaries to Chapter objects
    chapters = [
        Chapter(
            title=chapter_dict["title"],
            chapter_number=chapter_dict["chapter_number"],
            chapter_title=chapter_dict.get("chapter_title"),
            url=chapter_dict["url"],
            read=chapter_dict.get("read", False),
            downloaded=chapter_dict.get("downloaded", False)
        )
        for chapter_dict in chapter_dicts
    ]

    try:
        # Generate the EPUB
        epub_bytes, filename = await epub_service.create_epub(
            novel_id=str(novel_id),
            novel_title=novel["title"],
            author=novel.get("author", "Unknown"),
            chapters=chapters,
            source_name=novel["source_name"],
            translate=(language == "es")
        )

        # Update chapter status
        await db[NOVEL_COLLECTION].update_many(
            {"_id": novel_id, "chapters.chapter_number": {"$in": chapter_numbers}},
            {
                "$set": {
                    "chapters.$.downloaded": True,
                    "chapters.$.read": True
                }
            }
        )

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

@router.post("/{novel_id}/chapters/fetch", response_model=ChapterListResponse, tags=["chapters"])
async def fetch_chapters_from_source(
    novel_id: PyObjectId,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Fetch and update chapters from the source website."""
    # Find the novel
    novel = await db[NOVEL_COLLECTION].find_one({"_id": novel_id})
    if novel is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Novel with id {novel_id} not found")

    try:
        # Fetch chapters from source
        new_chapters = await scrape_chapters_for_novel(
            str(novel["source_url"]),
            novel["source_name"]
        )

        if not new_chapters:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No chapters found on the source website"
            )

        # Get existing chapters to preserve their states
        existing_chapters = novel.get("chapters", [])
        existing_chapters_dict = {c["chapter_number"]: c for c in existing_chapters}

        # Convert to dictionary format and preserve states
        new_chapters_dict = []
        for chapter in new_chapters:
            chapter_dict = {
                "title": chapter.title,
                "chapter_number": chapter.chapter_number,
                "chapter_title": chapter.chapter_title,
                "url": str(chapter.url),
                "read": False,
                "downloaded": False
            }
            
            # If chapter exists, preserve its state
            if chapter.chapter_number in existing_chapters_dict:
                existing_chapter = existing_chapters_dict[chapter.chapter_number]
                chapter_dict["read"] = existing_chapter.get("read", False)
                chapter_dict["downloaded"] = existing_chapter.get("downloaded", False)
            
            new_chapters_dict.append(chapter_dict)

        # Update novel with new chapters
        await db[NOVEL_COLLECTION].update_one(
            {"_id": novel_id},
            {
                "$set": {
                    "chapters": new_chapters_dict,
                    "last_updated_chapters": datetime.utcnow()
                }
            }
        )

        # Return the updated chapters
        return ChapterListResponse(
            chapters=new_chapters_dict,
            total=len(new_chapters_dict),
            page=1,
            page_size=len(new_chapters_dict),
            total_pages=1
        )

    except ScraperError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error scraping chapters: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error: {str(e)}"
        ) 