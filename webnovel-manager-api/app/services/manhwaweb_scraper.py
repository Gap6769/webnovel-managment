from typing import List, Optional, Dict, Any
from pydantic import HttpUrl
from bs4 import BeautifulSoup
import re
from ..models.novel import Chapter
from .base_scraper import BaseScraper, ScraperConfig

class ManhwaWebScraper(BaseScraper):
    """Scraper for manhwaweb.com website."""
    
    def __init__(self):
        config = ScraperConfig(
            name="manhwaweb",
            base_url="https://manhwaweb.com",
            content_type="manhwa",
            selectors={
                # Selector para el título usando la estructura exacta
                "title": "h2.text-left.md\\:text-3xl.xs\\:text-2xl.mb-1.text-xl.font-normal",
                # Selector para la lista de capítulos
                "chapter_list": "div.grid.grid-cols-1.md\\:border.border-y div.flex.p-2.gap-2.border-t",
                # Selector para el título del capítulo dentro de cada elemento
                "chapter_title": "div.sm\\:text-lg.xs\\:text-base.text-sm",
                # Selector para el enlace del capítulo
                "chapter_link": "a.text-gray-500",
                # Selector para la imagen de portada
                "cover_image": "img.h-full.object-cover.aspect-lezhin",
                # Selector para el botón "Ver Todo" para cargar más capítulos
                "view_all_button": "button.ver_todo"
            },
            patterns={
                "chapter_number": r"Capitulo\s+(\d+)",
                "unwanted_text": [
                    r"Please support the translation team.*",
                    r"Join our Discord for updates.*",
                    r"Please read this chapter on our website.*"
                ]
            },
            use_playwright=True  # Usamos Playwright para manejar contenido dinámico
        )
        super().__init__(config)
    
    async def get_novel_info(self, url: str) -> Dict[str, Any]:
        """Get manhwa information from manhwaweb.com."""
        async with self:
            if not self._page:
                raise RuntimeError("Playwright page not initialized")
            
            await self._page.goto(url)
            await self._page.wait_for_load_state("networkidle")
            
            # Esperar a que el título esté visible
            await self._page.wait_for_selector(self.config.selectors["title"])
            
            html = await self._page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            # Extraer título
            title_elem = soup.select_one(self.config.selectors["title"])
            title = title_elem.get_text(strip=True) if title_elem else None
            
            # Extraer imagen de portada
            cover_img = soup.select_one(self.config.selectors["cover_image"])
            cover_image_url = cover_img["src"] if cover_img else None
            
            # Para manhwaweb.com, algunos campos no están disponibles
            return {
                'title': title,
                'author': None,  # No disponible en el sitio
                'description': None,  # No disponible en el sitio
                'cover_image_url': cover_image_url,
                'status': None,  # No disponible en el sitio
                'tags': [],  # No disponible en el sitio
                'source_url': url,
                'source_name': 'manhwaweb',
                'type': 'manhwa'
            }
    
    async def get_chapters(self, url: str, max_chapters: int = 50) -> List[Chapter]:
        """Get manhwa chapters from manhwaweb.com."""
        async with self:
            if not self._page:
                raise RuntimeError("Playwright page not initialized")
            
            await self._page.goto(url)
            await self._page.wait_for_load_state("networkidle")
            
            # Esperar a que la lista de capítulos esté visible
            await self._page.wait_for_selector(self.config.selectors["chapter_list"])
            
            # Hacer clic en el botón "Ver Todo" si existe
            try:
                view_all_button = await self._page.wait_for_selector(self.config.selectors["view_all_button"], timeout=5000)
                if view_all_button:
                    await view_all_button.click()
                    await self._page.wait_for_load_state("networkidle")
            except:
                pass  # Si no hay botón "Ver Todo", continuamos
            
            # Scroll para cargar todos los capítulos
            await self._scroll_page_to_bottom(self._page)
            
            html = await self._page.content()
            soup = BeautifulSoup(html, 'html.parser')
            
            chapters = []
            # Buscar todos los elementos de capítulo
            chapter_elements = soup.select(self.config.selectors["chapter_list"])
            
            for element in chapter_elements:
                # Extraer título del capítulo
                title_elem = element.select_one(self.config.selectors["chapter_title"])
                if not title_elem:
                    continue
                    
                chapter_title = title_elem.get_text(strip=True)
                
                # Extraer enlace del capítulo
                link_elem = element.select_one(self.config.selectors["chapter_link"])
                if not link_elem:
                    continue
                    
                chapter_url = self.resolve_url(link_elem["href"])
                
                # Extraer número de capítulo del título
                chapter_number = self._extract_chapter_number(chapter_title)
                if not chapter_number:
                    # Si no podemos extraer el número, usamos el índice
                    chapter_number = len(chapters) + 1
                
                chapters.append(Chapter(
                    title=chapter_title,
                    chapter_number=chapter_number,
                    chapter_title=chapter_title,
                    url=chapter_url,
                    read=False,
                    downloaded=False
                ))
            
            # Ordenar capítulos por número y limitar
            chapters.sort(key=lambda x: x.chapter_number)
            if max_chapters:
                chapters = chapters[:max_chapters]
            
            return chapters
    
    async def get_chapter_content(self, url: str) -> str:
        """Get the content of a specific chapter."""
        async with self:
            if not self._page:
                raise RuntimeError("Playwright page not initialized")
            
            await self._page.goto(url)
            await self._page.wait_for_load_state("networkidle")
            
            # Esperar a que el contenido del capítulo esté visible
            await self._page.wait_for_selector("img")
            
            # Obtener todas las imágenes del capítulo
            images = await self._page.query_selector_all("img")
            content = []
            
            for img in images:
                src = await img.get_attribute("src")
                if src:
                    content.append(f'<img src="{src}">')
            
            return "\n".join(content) 