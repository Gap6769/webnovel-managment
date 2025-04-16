import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin
from typing import List, Dict, Optional, Tuple, Set
from pydantic import HttpUrl
from ..models.novel import Chapter
import re # Import regex module
import time # For timing operations
import asyncio # For timeout handling
from .novelbin_scraper import NovelBinScraper
from .pastebin_tbate_scraper import PastebinTBATEScraper

class ScraperError(Exception):
    """Custom exception for scraping errors."""
    pass

async def fetch_html(url: str, timeout: float = 10.0) -> Optional[str]:
    """Fetches HTML content from a given URL asynchronously with a strict timeout."""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    start_time = time.time()
    print(f"Starting HTTP request to {url}")
    
    # For Pastebin, we might need the raw content
    # Construct the raw URL (usually add '/raw/' before the ID)
    if "pastebin.com" in url and "/raw/" not in url:
        parts = url.split("pastebin.com/")
        if len(parts) == 2 and parts[1]:
            raw_url = f"https://pastebin.com/raw/{parts[1]}"
            print(f"Converting to raw URL: {raw_url}")
            url = raw_url # Use raw URL for fetching
        else:
             print(f"Could not construct raw URL for {url}, proceeding with original URL")

    try:
        # Create a client with timeout and limits
        async with httpx.AsyncClient(
            follow_redirects=True, 
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        ) as client:
            # Add a separate timeout using asyncio just to be safe
            response = await asyncio.wait_for(
                client.get(url, headers=headers),
                timeout=timeout
            )
            response.raise_for_status()
            
            elapsed = time.time() - start_time
            content_preview = response.text[:100] + "..." if len(response.text) > 100 else response.text
            print(f"Received response from {url} in {elapsed:.2f} seconds")
            print(f"Content preview: {content_preview}")
            
            return response.text
    except asyncio.TimeoutError:
        print(f"Asyncio timeout occurred after {time.time() - start_time:.2f} seconds for {url}")
        raise ScraperError(f"Request timed out for {url} after {timeout} seconds")
    except httpx.TimeoutException as e:
        print(f"HTTPX timeout occurred after {time.time() - start_time:.2f} seconds for {url}")
        raise ScraperError(f"Request timed out for {url}: {e}")
    except httpx.HTTPStatusError as e:
        print(f"HTTP error occurred: {e.response.status_code} for URL {url}")
        raise ScraperError(f"HTTP error {e.response.status_code} fetching {url}")
    except httpx.RequestError as e:
        print(f"Request error occurred: {e} for URL {url}")
        raise ScraperError(f"Request error fetching {url}: {e}")
    except Exception as e:
        print(f"An unexpected error occurred: {e} for URL {url}")
        import traceback
        traceback.print_exc()
        raise ScraperError(f"Unexpected error fetching {url}: {e}")

def parse_chapters_example(html_content: str, base_url: str) -> List[Chapter]:
    """Parses the chapter list from HTML content (EXAMPLE IMPLEMENTATION)."""
    soup = BeautifulSoup(html_content, 'lxml')
    chapters = []
    
    # !!! THIS IS A PLACEHOLDER - NEEDS REAL SELECTORS FOR A SPECIFIC SITE !!!
    # Example: Find all <a> tags within a specific list element
    # Adjust the selector based on the target website's structure.
    chapter_list_container = soup.find('div', class_='chapter-list') # Adjust selector
    if not chapter_list_container:
        print("Warning: Chapter list container not found with selector 'div.chapter-list'.")
        return []

    link_elements = chapter_list_container.find_all('a') # Adjust selector
    
    if not link_elements:
        print("Warning: No chapter links found within the container.")
        return []

    for link in link_elements:
        href = link.get('href')
        title = link.get_text(strip=True)
        
        if href and title:
            # Resolve relative URLs
            chapter_url = urljoin(base_url, href)
            try:
                # Validate URL structure
                validated_url = HttpUrl(chapter_url)
                chapters.append(Chapter(title=title, url=validated_url))
            except ValueError as e:
                print(f"Skipping invalid URL {chapter_url}: {e}")
        else:
            print(f"Skipping link with missing href or title: {link}")
            
    print(f"Parsed {len(chapters)} chapters.")
    return chapters

def parse_chapters_pastebin_tbate(raw_text_content: str, chapter_url: str) -> Tuple[List[Chapter], Optional[str]]:
    """
    Parses the chapter list from Pastebin raw text for TBATE.
    
    Returns:
        tuple: (list of chapters found on this page, URL to next chapter or None)
    """
    start_time = time.time()
    print(f"Starting to parse content from {chapter_url}, content length: {len(raw_text_content)} chars")
    
    # Set a reasonable limit for content size to avoid processing extremely large texts
    if len(raw_text_content) > 500_000:  # 500KB limit
        print(f"Content too large ({len(raw_text_content)} chars), truncating to first 500K chars")
        raw_text_content = raw_text_content[:500_000]
    
    chapters = []
    current_chapter_title = None
    current_chapter_number = None
    next_chapter_url = None

    # Dividir el contenido en líneas
    lines = raw_text_content.split('\n')
    
    # Buscar el número y título del capítulo
    for i, line in enumerate(lines):
        line = line.strip()
        if not line:
            continue
            
        # Buscar el número del capítulo (debe estar solo en una línea)
        if line.isdigit():
            current_chapter_number = int(line)
            # El título suele estar en la siguiente línea
            if i + 1 < len(lines):
                current_chapter_title = lines[i + 1].strip()
            break

    if not current_chapter_number:
        # Fallback si no encontramos el número
        print(f"Could not parse chapter number from content start.")
        current_chapter_number = int(re.search(r'\d+', chapter_url.split('/')[-1]).group())
        current_chapter_title = f"Capítulo {current_chapter_number}"

    # --- Create the Chapter object for the *current* page --- 
    try:
        # Validate URL structure of the current page
        validated_url = HttpUrl(chapter_url) 
        # Add the chapter
        chapters.append(Chapter(
            title=f"Capítulo {current_chapter_number}",
            chapter_number=current_chapter_number,
            chapter_title=current_chapter_title,
            url=validated_url
        ))
        print(f"Added chapter: {current_chapter_number} - {current_chapter_title}")
    except ValueError as e:
        print(f"Skipping current chapter due to invalid URL {chapter_url}: {e}")

    # --- Find the next chapter link at the end --- 
    # Pattern: Finds "Capítulo 505: https://pastebin.com/aGPf0xqr" at the end of the text
    next_link_pattern = r"Capítulo\s+\d+:\s+(https?://pastebin\.com/\w+)\s*$"
    print(f"Searching for next chapter link with pattern: {next_link_pattern}")
    
    next_link_match = re.search(next_link_pattern, raw_text_content, re.IGNORECASE)
    if next_link_match:
        next_chapter_url = next_link_match.group(1)
        print(f"Found next chapter URL: {next_chapter_url}")
    else:
        # Check for the date format (end of chapters for now)
        date_pattern = r"Capítulo\s+\d+:\s+\d{2}/\d{2}/\d{4}\s*$"
        date_match = re.search(date_pattern, raw_text_content)
        if date_match:
            print("Found date marker, likely end of available chapters.")
        else:
            print("Could not find next chapter URL or date marker at the end.")

    elapsed = time.time() - start_time
    print(f"Parsing completed in {elapsed:.2f} seconds, found {len(chapters)} chapters")
    
    # Return both the chapters found on this page and the URL to the next chapter (if any)
    return chapters, next_chapter_url

# Scraper registry
SOURCE_SCRAPERS = {
    "example_source": parse_chapters_example,
    "pastebin_tbate": PastebinTBATEScraper(),
    "novelbin": NovelBinScraper(),  # Create instance of NovelBinScraper
}

async def scrape_chapters_for_novel(
    source_url: str, 
    source_name: str,
    recursive: bool = False,
    max_chapters: int = 50,
    visited_urls: Optional[Set[str]] = None
) -> List[Chapter]:
    """
    Fetches and parses chapters for a given novel source URL and name.
    
    Args:
        source_url: The URL of the novel or chapter to scrape.
        source_name: Name of the source, used to select the appropriate parser.
        recursive: If True, follow links to next chapters and scrape them too.
        max_chapters: Maximum number of chapters to scrape when in recursive mode.
        visited_urls: Set of URLs already visited (to prevent cycles).
        
    Returns:
        List of Chapter objects.
    """
    start_time = time.time()
    print(f"Starting scrape operation for {source_name} from {source_url}")
    
    # Keep track of visited URLs to prevent cycles
    if visited_urls is None:
        visited_urls = set()
    
    # Don't revisit URLs
    if source_url in visited_urls:
        print(f"URL already visited: {source_url}, skipping")
        return []
    
    # Add this URL to visited set
    visited_urls.add(source_url)
    
    # Normalize source_name to lowercase for lookup
    source_name_lower = source_name.lower()
    
    scraper = SOURCE_SCRAPERS.get(source_name_lower)
    if not scraper:
        print(f"Error: No scraper available for source: {source_name_lower}")
        print(f"Available scrapers: {list(SOURCE_SCRAPERS.keys())}")
        raise ScraperError(f"No scraper available for source: {source_name}")

    try:
        # Get chapters using the appropriate scraper
        chapters = await scraper.get_chapters(source_url, max_chapters)
        return chapters
    except Exception as e:
        print(f"Error during scrape operation: {e}")
        raise ScraperError(f"Failed to scrape chapters: {str(e)}")

# For backward compatibility during transition
parse_chapters_pastebin_tbate.__annotations__["return"] = Tuple[List[Chapter], Optional[str]] 

def get_scraper_for_source(source_name: str):
    """Get the appropriate scraper for the given source."""
    source_name_lower = source_name.lower()
    scraper = SOURCE_SCRAPERS.get(source_name_lower)
    if not scraper:
        raise ScraperError(f"No scraper available for source: {source_name}")
    return scraper

async def scrape_novel_info(
    source_url: str,
    source_name: str
) -> dict:
    """Scrape novel information from its source."""
    try:
        scraper = get_scraper_for_source(source_name)
        # TODO: Implement novel info scraping
        return {
            "title": "Unknown",
            "author": "Unknown",
            "description": "No description available",
            "status": "Unknown"
        }
    except Exception as e:
        raise ScraperError(f"Failed to scrape novel info: {str(e)}")

async def scrape_chapter_content(
    chapter_url: str,
    source_name: str
) -> str:
    """Scrape the content of a specific chapter."""
    try:
        scraper = get_scraper_for_source(source_name)
        content = await scraper.get_chapter_content(chapter_url)
        return content
    except Exception as e:
        raise ScraperError(f"Failed to scrape chapter content: {str(e)}") 