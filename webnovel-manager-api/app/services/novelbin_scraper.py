from bs4 import BeautifulSoup
import httpx
from typing import List, Optional
from pydantic import HttpUrl
from ..models.novel import Chapter
from playwright.async_api import async_playwright
import re

class NovelBinScraper:
    BASE_URL = "https://novelbin.com"
    
    def __init__(self):
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    
    async def get_novel_info(self, url: str) -> dict:
        """Get novel information from NovelBin."""
        async with httpx.AsyncClient() as client:
            url = url + '#tab-chapters-title'
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract novel information
            title = soup.select_one('a.novel-title').text.strip()
            author = soup.select_one('.author span').text.strip()
            description = soup.select_one('.desc-text').text.strip()
            cover_image_url = soup.select_one('.book-img img')['src']
            
            # Get status
            status_elem = soup.select_one('.status')
            status = "Ongoing" if status_elem and "ongoing" in status_elem.text.lower() else "Completed"
            
            # Get tags/genres
            tags = [tag.text.strip() for tag in soup.select('.categories a')]
            
            return {
                'title': title,
                'author': author,
                'description': description,
                'cover_image_url': cover_image_url,
                'status': status,
                'tags': tags,
                'source_url': url,
                'source_name': 'NovelBin'
            }
    
    async def get_chapters(self, url: str, max_chapters: int = 50) -> List[Chapter]:
        """Get novel chapters from NovelBin."""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            # Navigate to the page
            await page.goto(url + '#tab-chapters-title')
            
            # Wait for the chapter list to load
            await page.wait_for_selector('.list-chapter')
            
            # Scroll to load all chapters
            last_height = await page.evaluate('document.body.scrollHeight')
            while True:
                # Scroll down
                await page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
                await page.wait_for_timeout(1000)  # Wait for content to load
                
                # Calculate new scroll height
                new_height = await page.evaluate('document.body.scrollHeight')
                if new_height == last_height:
                    break
                last_height = new_height
            
            # Get the page content after scrolling
            content = await page.content()
            await browser.close()
            
            # Parse the content with BeautifulSoup
            soup = BeautifulSoup(content, 'html.parser')
            
            chapters = []
            # Find all chapter list items
            chapter_items = soup.select('.list-chapter li')
            print(f"Total chapter items found: {len(chapter_items)}")
            
            for item in chapter_items:
                link = item.select_one('a')
                if not link:
                    continue
                    
                chapter_url = link['href']
                chapter_title = link.text.strip()
                
                # Extract chapter number from title
                try:
                    # Try to extract chapter number from title like "Chapter 1 Nightmare Begins"
                    chapter_number = int(chapter_title.split('Chapter')[1].split(":")[0].strip())
                except (IndexError, ValueError):
                    # Fallback if chapter number can't be extracted
                    chapter_number = len(chapters) + 1
                
                chapters.append(Chapter(
                    title=chapter_title,
                    chapter_number=chapter_number,
                    chapter_title=chapter_title,  # Store the full title
                    url=chapter_url,
                    read=False,
                    downloaded=False
                ))
            
            # Sort chapters by number and limit to max_chapters
            chapters.sort(key=lambda x: x.chapter_number)
            print(f"Total chapters found: {len(chapters)}")
            return chapters
    
    async def get_chapter_content(self, url: str) -> str:
        """Get the content of a specific chapter."""
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=self.headers)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Extract chapter content
            content_div = soup.select_one('#chr-content')
            if not content_div:
                raise ValueError("Chapter content not found")
            
            # Clean up the content
            for element in content_div.select('script, style, iframe, noscript'):
                element.decompose()
            
            # Remove the unlock-buttons div specifically
            for element in content_div.select('.unlock-buttons'):
                element.decompose()
            
            # Get the text content
            content = content_div.get_text(separator='\n\n', strip=True)
            
            # Remove unwanted text patterns
            unwanted_patterns = [
                r"Enhance your reading experience by removing ads.*",
                r"This material may be protected by copyright.*",
                r"Excerpt From.*",
                r"Remove Ads From.*"
            ]
            
            for pattern in unwanted_patterns:
                content = re.sub(pattern, '', content, flags=re.IGNORECASE | re.DOTALL)
            
            # Clean up extra whitespace
            content = re.sub(r'\n\s*\n', '\n\n', content)
            content = content.strip()
            
            return content 