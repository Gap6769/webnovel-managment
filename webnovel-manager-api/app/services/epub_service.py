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

class EpubService:
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
        
    def _get_raw_pastebin_url(self, url: HttpUrl) -> str:
        """Convierte una URL de Pastebin a su versión raw."""
        url_str = str(url)
        match = re.search(r'pastebin\.com/([^/]+)', url_str)
        if not match:
            raise ValueError(f"Invalid Pastebin URL: {url_str}")
        paste_id = match.group(1)
        return f"https://pastebin.com/raw/{paste_id}"
        
    async def fetch_chapter_content(self, chapter_url: HttpUrl) -> str:
        """Obtiene el contenido de un capítulo desde su URL."""
        raw_url = self._get_raw_pastebin_url(chapter_url)
        async with httpx.AsyncClient() as client:
            response = await client.get(raw_url)
            response.raise_for_status()
            return response.text
            
    def clean_pastebin_content(self, content: str) -> str:
        """Limpia y formatea el contenido de Pastebin."""
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
        start_chapter: Optional[int] = None,
        end_chapter: Optional[int] = None,
        single_chapter: Optional[int] = None
    ) -> Tuple[bytes, str]:
        """Crea un archivo EPUB con los capítulos especificados y lo devuelve en memoria."""
        # Crear el libro
        book = epub.EpubBook()

        # Configurar metadatos
        book.set_identifier(f"{novel_id}_{start_chapter or single_chapter}")
        book.set_title(novel_title)
        book.set_language('es')
        book.add_author(author or "Unknown")

        # Crear la tabla de contenido
        book.toc = []
        book.spine = ['nav']

        # Definir estilo CSS
        style = '''
        @namespace epub "http://www.idpf.org/2007/ops";
        body {
            font-family: Cambria, Liberation Serif, Bitstream Vera Serif, Georgia, Times, Times New Roman, serif;
            line-height: 1.6;
            margin: 2em;
            text-align: justify;
            color: #333;
        }
        .chapter-header {
            text-align: center;
            margin-bottom: 3em;
        }
        h1 {
            text-transform: uppercase;
            font-weight: 200;
            margin-bottom: 0.5em;
            font-size: 1.8em;
        }
        .chapter-number {
            font-style: italic;
            color: #666;
            margin-bottom: 2em;
        }
        .chapter-content {
            text-indent: 2em;
        }
        .chapter-content p {
            margin-bottom: 1em;
            text-align: justify;
        }
        '''
        
        # Agregar archivo CSS
        nav_css = epub.EpubItem(
            uid="style_nav",
            file_name="style/nav.css",
            media_type="text/css",
            content=style
        )
        book.add_item(nav_css)

        # Crear la página de título
        title_page = epub.EpubHtml(
            title='Title Page',
            file_name='title_page.xhtml',
            lang='es'
        )
        title_page.content = f'''
        <div class="title-page">
            <h1>{novel_title}</h1>
            <h2>by {author or "Unknown"}</h2>
        </div>
        '''
        book.add_item(title_page)
        book.spine.append(title_page)

        # Filtrar capítulos según los parámetros
        filtered_chapters = []
        if single_chapter is not None:
            filtered_chapters = [c for c in chapters if c.chapter_number == single_chapter]
        else:
            start = start_chapter if start_chapter is not None else 1
            end = end_chapter if end_chapter is not None else len(chapters)
            filtered_chapters = [c for c in chapters if start <= c.chapter_number <= end]

        # Agregar cada capítulo
        for chapter in filtered_chapters:
            try:
                # Obtener y limpiar el contenido del capítulo
                raw_content = await self.fetch_chapter_content(chapter.url)
                cleaned_content = self.clean_pastebin_content(raw_content)
                
                # Crear el contenido del capítulo
                chapter_content = f'''
                <div class="chapter-header">
                    <h1>{chapter.chapter_title or chapter.title}</h1>
                    <p class="chapter-number">Capítulo {chapter.chapter_number}</p>
                </div>
                <div class="chapter-content">
                    {cleaned_content}
                </div>
                '''

                # Crear el objeto del capítulo
                epub_chapter = epub.EpubHtml(
                    title=chapter.chapter_title or chapter.title,
                    file_name=f'chapter_{chapter.chapter_number}.xhtml',
                    lang='es'
                )
                epub_chapter.content = chapter_content
                epub_chapter.add_item(nav_css)

                # Agregar el capítulo al libro
                book.add_item(epub_chapter)
                book.toc.append(epub_chapter)
                book.spine.append(epub_chapter)
            except Exception as e:
                print(f"Error procesando capítulo {chapter.chapter_number}: {str(e)}")
                continue

        # Agregar la navegación
        book.add_item(epub.EpubNcx())
        book.add_item(epub.EpubNav())

        # Crear el EPUB en memoria
        epub_bytes = io.BytesIO()
        epub.write_epub(epub_bytes, book, {})
        epub_bytes.seek(0)
        
        # Generar el nombre del archivo
        filename = self._get_epub_filename(novel_id, start_chapter, end_chapter, single_chapter)
        
        return epub_bytes.getvalue(), filename

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
                start_chapter=start,
                end_chapter=end
            )
            generated_epubs.append((epub_bytes, filename))
        
        # Generar EPUB completo
        epub_bytes, filename = await self.create_epub(
            novel_id=novel_id,
            novel_title=novel_title,
            author=author,
            chapters=chapters
        )
        generated_epubs.append((epub_bytes, filename))
        
        return generated_epubs

epub_service = EpubService() 