import httpx
import asyncio
from typing import Optional

class ScraperError(Exception):
    """Custom exception for scraping errors."""
    pass

class BaseScraper:
    """Base class for all scrapers."""
    
    def __init__(self):
        self.name = "base"
        self.timeout = 10.0
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

    async def fetch_html(self, url: str) -> Optional[str]:
        """
        Fetch HTML content from a given URL.
        
        Args:
            url: The URL to fetch
            
        Returns:
            The HTML content as a string, or None if the request fails
        """
        # For Pastebin, we might need the raw content
        if "pastebin.com" in url and "/raw/" not in url:
            parts = url.split("pastebin.com/")
            if len(parts) == 2 and parts[1]:
                raw_url = f"https://pastebin.com/raw/{parts[1]}"
                print(f"Converting to raw URL: {raw_url}")
                url = raw_url

        try:
            async with httpx.AsyncClient(
                follow_redirects=True,
                timeout=self.timeout,
                limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
            ) as client:
                response = await asyncio.wait_for(
                    client.get(url, headers=self.headers),
                    timeout=self.timeout
                )
                response.raise_for_status()
                return response.text
        except asyncio.TimeoutError:
            raise ScraperError(f"Request timed out for {url} after {self.timeout} seconds")
        except httpx.TimeoutException as e:
            raise ScraperError(f"Request timed out for {url}: {e}")
        except httpx.HTTPStatusError as e:
            raise ScraperError(f"HTTP error {e.response.status_code} fetching {url}")
        except httpx.RequestError as e:
            raise ScraperError(f"Request error fetching {url}: {e}")
        except Exception as e:
            raise ScraperError(f"Unexpected error fetching {url}: {e}") 