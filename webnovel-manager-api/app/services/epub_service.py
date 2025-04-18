from ebooklib import epub
from typing import List, Optional, Tuple
from ..models.novel import Chapter
import os
import tempfile
import asyncio
from bs4 import BeautifulSoup
import httpx
import re
from pydantic import HttpUrl
import shutil
import zipfile
import io
from .translation_service import translation_service
from .scraper_service import scrape_chapter_content, ScraperError

class EpubService:
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
        self.output_dir = "epubs"
        if not os.path.exists(self.output_dir):
            os.makedirs(self.output_dir)
        
    def _get_raw_pastebin_url(self, url: HttpUrl) -> str:
        """Convierte una URL de Pastebin a su versión raw."""
        url_str = str(url)
        match = re.search(r'pastebin\.com/([^/]+)', url_str)
        if not match:
            raise ValueError(f"Invalid Pastebin URL: {url_str}")
        paste_id = match.group(1)
        return f"https://pastebin.com/raw/{paste_id}"
        
    async def fetch_chapter_content(self, chapter_url: HttpUrl, source_name: str) -> str:
        """Obtiene el contenido de un capítulo desde su URL usando el servicio de scraping general."""
        try:
            content = await scrape_chapter_content(str(chapter_url), source_name)
            return content
        except ScraperError as e:
            print(f"Error scraping chapter content: {str(e)}")
            raise
            
    def clean_content(self, content: str) -> str:
        """Limpia y formatea el contenido del capítulo."""
        lines = content.split('\n')
        cleaned_lines = []
        current_paragraph = []
        
        for line in lines:
            line = line.strip()
            
            if not line or line.replace('-', '').strip() == '':
                if current_paragraph:
                    cleaned_lines.append('<p>' + ' '.join(current_paragraph) + '</p>')
                    current_paragraph = []
                continue
                
            if 'PDF:' in line or 'http' in line:
                continue
                
            current_paragraph.append(line)
            
        if current_paragraph:
            cleaned_lines.append('<p>' + ' '.join(current_paragraph) + '</p>')
            
        return '\n'.join(cleaned_lines)
    
    def clean_content_raw(self, content: str) -> str:
        """Limpia y formatea el contenido del capítulo."""
        lines = content.split('\n')
        cleaned_lines = []
        current_paragraph = []
        
        for line in lines:
            line = line.strip()
            
            if not line or line.replace('-', '').strip() == '':
                if current_paragraph:
                    cleaned_lines.append('<p>' + ' '.join(current_paragraph) + '</p>')
                    current_paragraph = []
                continue
                
            if 'PDF:' in line or 'http' in line:
                continue
                
            current_paragraph.append(line)
            
        if current_paragraph:
            cleaned_lines.append('<p>' + ' '.join(current_paragraph) + '</p>')
            
        return '\n'.join(cleaned_lines)

    def _get_epub_filename(self, novel_id: str, start_chapter: Optional[int] = None, 
                      end_chapter: Optional[int] = None, single_chapter: Optional[int] = None) -> str:
        """Genera el nombre del archivo EPUB basado en los parámetros."""
        if single_chapter:
            return f"chapter_{single_chapter}.epub"
        else:
            start = start_chapter if start_chapter is not None else 1
            end = end_chapter if end_chapter is not None else "end"
            return f"chapters_{start}-{end}.epub"

    async def create_epub(
        self,
        novel_id: str,
        novel_title: str,
        author: str,
        chapters: List[Chapter],
        source_name: str,
        start_chapter: Optional[int] = None,
        end_chapter: Optional[int] = None,
        single_chapter: Optional[int] = None,
        translate: bool = False
    ) -> tuple[bytes, str]:
        """
        Create an EPUB file with the specified chapters.
        If translate is True, the content will be translated to Spanish.
        """
        book = epub.EpubBook()

        # Set metadata
        book.set_identifier(novel_id)
        book.set_title(novel_title)
        book.set_language('es' if translate else 'en')
        book.add_author(author)

        # Create chapters
        epub_chapters = []
        toc = []
        spine = ['nav']

        # Filter chapters based on parameters
        if single_chapter is not None:
            chapters = [c for c in chapters if c.chapter_number == single_chapter]
        elif start_chapter is not None or end_chapter is not None:
            chapters = [
                c for c in chapters
                if (start_chapter is None or c.chapter_number >= start_chapter) and
                   (end_chapter is None or c.chapter_number <= end_chapter)
            ]

        for chapter in chapters:
            try:
                # Fetch and clean chapter content
                raw_content = await self.fetch_chapter_content(chapter.url, source_name)
                cleaned_content = self.clean_content(raw_content)
                
                # Create chapter content
                content = f"<h1>Chapter {chapter.chapter_number}</h1>"
                if chapter.chapter_title:
                    content += f"<h2>{chapter.chapter_title}</h2>"
                
                # Add chapter content with optional translation
                if translate:
                    translated_content = await translation_service.translate_text(cleaned_content)
                    content += f"<div>{translated_content if translated_content else cleaned_content}</div>"
                else:
                    content += f"<div>{cleaned_content}</div>"

                # Create epub chapter
                epub_chapter = epub.EpubHtml(
                    title=f"Chapter {chapter.chapter_number}",
                    file_name=f'chapter_{chapter.chapter_number}.xhtml',
                    content=content
                )
                book.add_item(epub_chapter)
                epub_chapters.append(epub_chapter)
                toc.append(epub_chapter)
                spine.append(epub_chapter)
            except Exception as e:
                print(f"Error processing chapter {chapter.chapter_number}: {str(e)}")
                continue

        if not epub_chapters:
            raise Exception("No chapters were successfully processed")

        # Add table of contents
        book.toc = toc
        book.add_item(epub.EpubNcx())
        book.add_item(epub.EpubNav())
        book.spine = spine

        # Generate filename
        filename = f"{novel_title.replace(' ', '_')}"
        if single_chapter:
            filename += f"_chapter_{single_chapter}"
        elif start_chapter or end_chapter:
            filename += f"_chapters_{start_chapter or 'start'}_{end_chapter or 'end'}"
        if translate:
            filename += "_es"
        filename += ".epub"

        # Write the EPUB file
        epub.write_epub(filename, book)
        
        # Read the file and return bytes
        with open(filename, 'rb') as f:
            epub_bytes = f.read()
        
        # Clean up
        os.remove(filename)
        
        return epub_bytes, filename

    async def generate_all_epubs(self, novel_id: str, novel_title: str, author: str, chapters: List[Chapter]) -> List[Tuple[bytes, str]]:
        """Genera EPUBs para todos los capítulos y rangos posibles en memoria."""
        generated_epubs = []
        
        # Generar EPUB para cada capítulo individual
        for chapter in chapters:
            epub_bytes, filename = await self.create_epub(
                novel_id=novel_id,
                novel_title=novel_title,
                author=author,
                chapters=chapters,
                source_name=chapter.source_name,
                single_chapter=chapter.chapter_number
            )
            generated_epubs.append((epub_bytes, filename))
        
        # Generar EPUB para rangos de capítulos (cada 10 capítulos)
        chapter_numbers = sorted([c.chapter_number for c in chapters])
        for i in range(0, len(chapter_numbers), 10):
            start = chapter_numbers[i]
            end = chapter_numbers[min(i + 9, len(chapter_numbers) - 1)]
            
            epub_bytes, filename = await self.create_epub(
                novel_id=novel_id,
                novel_title=novel_title,
                author=author,
                chapters=chapters,
                source_name=chapter_numbers[i],
                start_chapter=start,
                end_chapter=end
            )
            generated_epubs.append((epub_bytes, filename))
        
        # Generar EPUB completo
        epub_bytes, filename = await self.create_epub(
            novel_id=novel_id,
            novel_title=novel_title,
            author=author,
            chapters=chapters,
            source_name=chapter_numbers[-1],
        )
        generated_epubs.append((epub_bytes, filename))
        
        return generated_epubs

epub_service = EpubService() 