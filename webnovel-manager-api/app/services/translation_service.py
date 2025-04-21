from typing import Optional
import deepl
from bs4 import BeautifulSoup
from app.core.config import settings
from app.services.glossaries.shadow_slave_glossary import SHADOW_SLAVE_GLOSSARY

class TranslationService:
    def __init__(self):
        if not settings.DEEPL_API_KEY:
            raise ValueError("DEEPL_API_KEY no configurada. Por favor, añade DEEPL_API_KEY a tus variables de entorno.")
            
        # Definir los idiomas primero
        self.source_language = "EN"
        self.target_language = settings.DEEPL_TARGET_LANGUAGE
            
        try:
            self.translator = deepl.Translator(settings.DEEPL_API_KEY)
            self.usage = self.translator.get_usage()
            print(f"DeepL API Status: {self.usage.character.count} caracteres usados de {self.usage.character.limit}")
            
            # Crear o cargar el glosario de Shadow Slave
            self.glossary_id = self._setup_shadow_slave_glossary()
            
        except Exception as e:
            raise ValueError(f"Error al inicializar DeepL: {str(e)}")
            
        self.max_chunk_size = 5000  # Tamaño máximo de chunk para DeepL
        
    def _setup_shadow_slave_glossary(self) -> str:
        """Configurar el glosario de términos específicos de Shadow Slave"""
        try:
            # Intentar crear el glosario
            glossary = self.translator.create_glossary(
                "Shadow Slave Glossary",
                source_lang=self.source_language,
                target_lang=self.target_language,
                entries=SHADOW_SLAVE_GLOSSARY
            )
            return glossary.glossary_id
            
        except Exception as e:
            print(f"Error creando glosario: {str(e)}")
            # Si falla, intentar listar glosarios existentes
            try:
                glossaries = self.translator.list_glossaries()
                for glossary in glossaries:
                    if glossary.name == "Shadow Slave Glossary":
                        return glossary.glossary_id
            except Exception as e:
                print(f"Error listando glosarios: {str(e)}")
                return None
        
    def _split_text_into_chunks(self, text: str) -> list[str]:
        """
        Split text into chunks while preserving HTML structure and dialogue.
        Optimized for novel content with dialogue and paragraphs.
        """
        soup = BeautifulSoup(text, 'html.parser')
        chunks = []
        current_chunk = []
        current_size = 0
        
        # Preservar estructura de diálogo y párrafos
        for element in soup.find_all(['p', 'div', 'span']):
            element_text = str(element)
            
            # Si el elemento es muy grande, dividirlo
            if len(element_text) > self.max_chunk_size:
                sub_elements = element.find_all(['p', 'div', 'span'])
                for sub in sub_elements:
                    sub_text = str(sub)
                    if current_size + len(sub_text) > self.max_chunk_size and current_chunk:
                        chunks.append(''.join(current_chunk))
                        current_chunk = [sub_text]
                        current_size = len(sub_text)
                    else:
                        current_chunk.append(sub_text)
                        current_size += len(sub_text)
            else:
                if current_size + len(element_text) > self.max_chunk_size and current_chunk:
                    chunks.append(''.join(current_chunk))
                    current_chunk = [element_text]
                    current_size = len(element_text)
                else:
                    current_chunk.append(element_text)
                    current_size += len(element_text)
        
        if current_chunk:
            chunks.append(''.join(current_chunk))
            
        return chunks
        
    async def translate_text(self, text: str) -> Optional[str]:
        """
        Translate HTML text using DeepL API.
        Preserves HTML structure while translating content.
        Optimized for novel content with dialogue and paragraphs.
        """
        try:
            # Verificar límite de caracteres
            if self.usage.character.count >= self.usage.character.limit:
                raise ValueError("Límite de caracteres de DeepL alcanzado")
            
            # Split text into chunks while preserving HTML
            # chunks = self._split_text_into_chunks(text)
            result = self.translator.translate_text(
                        text,
                        target_lang=self.target_language,
                        tag_handling="html",
                        preserve_formatting=True,  # Preservar formato
                        formality="prefer_more",  # Usar lenguaje más formal para novelas
                        glossary=self.glossary_id,
                        source_lang=self.source_language
                    )
            
            return result.text
            
            
            translated_chunks = []
            for chunk in chunks:
                try:
                    # Usar DeepL para traducir manteniendo el HTML
                    result = self.translator.translate_text(
                        chunk,
                        target_lang=self.target_language,
                        tag_handling="html",
                        preserve_formatting=True,  # Preservar formato
                        formality="prefer_more"  # Usar lenguaje más formal para novelas
                    )
                    translated_chunks.append(result.text)
                except Exception as e:
                    print(f"Error translating chunk with DeepL: {str(e)}")
                    translated_chunks.append(chunk)  # Keep original if translation fails
            
            if not translated_chunks:
                print("Warning: No translated chunks were generated")
                return text
            
            return '\n'.join(translated_chunks)
        except Exception as e:
            print(f"DeepL translation error: {str(e)}")
            return text  # Return original text if translation fails completely
            
    def get_usage_stats(self) -> dict:
        """Obtener estadísticas de uso de la API"""
        try:
            usage = self.translator.get_usage()
            return {
                "character_count": usage.character.count,
                "character_limit": usage.character.limit,
                "percentage_used": (usage.character.count / usage.character.limit) * 100
            }
        except Exception as e:
            return {"error": str(e)}

translation_service = TranslationService() 