from typing import Optional
import os
from deep_translator import GoogleTranslator
from bs4 import BeautifulSoup
import re

class TranslationService:
    def __init__(self):
        self.translator = GoogleTranslator(source='auto', target='es')
        self.target_language = "es"
        
    def _split_text_into_chunks(self, text: str, max_chunk_size: int = 5000) -> list[str]:
        """Split text into chunks while preserving HTML structure."""
        # Use BeautifulSoup to parse HTML
        soup = BeautifulSoup(text, 'html.parser')
        paragraphs = soup.find_all('p')
        
        chunks = []
        current_chunk = []
        current_size = 0
        
        for p in paragraphs:
            p_text = str(p)
            if current_size + len(p_text) > max_chunk_size and current_chunk:
                chunks.append(''.join(current_chunk))
                current_chunk = [p_text]
                current_size = len(p_text)
            else:
                current_chunk.append(p_text)
                current_size += len(p_text)
        
        if current_chunk:
            chunks.append(''.join(current_chunk))
            
        return chunks
        
    async def translate_text(self, text: str) -> Optional[str]:
        """
        Translate HTML text from English to Spanish using Google Translate.
        Preserves HTML structure while translating content.
        """
        try:
            # Split text into chunks while preserving HTML
            chunks = self._split_text_into_chunks(text)
            
            translated_chunks = []
            for chunk in chunks:
                try:
                    # Extract text from HTML for translation
                    soup = BeautifulSoup(chunk, 'html.parser')
                    text_nodes = []
                    
                    # Function to process text nodes
                    def process_text_nodes(element):
                        for node in element.children:
                            if isinstance(node, str) and node.strip():
                                text_nodes.append((node.parent, node, node.strip()))
                            elif node.name and node.name != 'script' and node.name != 'style':
                                process_text_nodes(node)
                    
                    process_text_nodes(soup)
                    
                    # Translate each text node
                    for parent, node, text in text_nodes:
                        if text.strip():
                            try:
                                # Translate using deep-translator
                                translated_text = self.translator.translate(text)
                                if translated_text:
                                    # Replace the original text with the translation
                                    new_text = node.replace(text, translated_text)
                                    node.replace_with(new_text)
                                else:
                                    print(f"Warning: Translation failed for text: {text}")
                                    continue
                            except Exception as e:
                                print(f"Error translating text node: {str(e)}")
                                continue
                    
                    translated_chunks.append(str(soup))
                except Exception as e:
                    print(f"Error translating chunk: {str(e)}")
                    translated_chunks.append(chunk)  # Keep original if translation fails
            
            if not translated_chunks:
                print("Warning: No translated chunks were generated")
                return text
            
            return '\n'.join(translated_chunks)
        except Exception as e:
            print(f"Translation error: {str(e)}")
            return text  # Return original text if translation fails completely

translation_service = TranslationService() 