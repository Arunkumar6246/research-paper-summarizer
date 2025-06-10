from sqlalchemy.orm import Session
import os
import logging
import json
import re
import pdfplumber
import google.generativeai as genai
from services.summary_service import SummaryService


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # This ensures logs go to the console
    ]
)

# Configure logger
logger = logging.getLogger(__name__)

class LLMResponder:

    @staticmethod
    def extract_text_content_by_page(pdf_path, header_height_ratio=0.1, footer_height_ratio=0.1):
        """
        Extract text content from each page of a PDF, excluding images, tables, graphs,
        headers, and footers.
        """
        content_by_page = {}
        
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                # Get page dimensions
                height = page.height
                width = page.width
                
                # Calculate header and footer boundaries
                header_bottom = height * header_height_ratio
                footer_top = height * (1 - footer_height_ratio)
                
                # Crop page to exclude header and footer
                cropped_page = page.crop((0, header_bottom, width, footer_top))
                
                # Extract text from the cropped page
                text = cropped_page.extract_text()
                
                if text:
                    content_by_page[page_num] = text.strip()
        
        return content_by_page
    
    
    @staticmethod
    def extract_json_from_text(text):
        """
        Extract JSON from text that might contain markdown code blocks or other formatting.
        Returns the parsed JSON object or None if extraction fails.
        """
        # Try different extraction methods
        
        # Method 1: Extract JSON from markdown code blocks
        code_block_pattern = r"```(?:json)?\s*(\[[\s\S]*?\])\s*```"
        matches = re.findall(code_block_pattern, text)
        if matches:
            try:
                return json.loads(matches[0])
            except json.JSONDecodeError:
                pass
        
        # Method 2: Find array brackets directly
        try:
            json_start = text.find('[')
            json_end = text.rfind(']') + 1
            if json_start >= 0 and json_end > json_start:
                return json.loads(text[json_start:json_end])
        except json.JSONDecodeError:
            pass
        
        # Method 3: Try to clean up the text and extract JSON
        try:
            # Remove common formatting characters
            cleaned_text = re.sub(r'```json|```|\n', '', text)
            json_start = cleaned_text.find('[')
            json_end = cleaned_text.rfind(']') + 1
            if json_start >= 0 and json_end > json_start:
                json_str = cleaned_text[json_start:json_end]
                return json.loads(json_str)
        except json.JSONDecodeError:
            pass
        
        # Method 4: Manual extraction of JSON objects
        try:
            pattern = r'\{\s*"Section Title":\s*"[^"]*",\s*"Summary":\s*"[^"]*",\s*"page_no":\s*\d+\s*\}'
            matches = re.findall(pattern, text)
            if matches:
                combined = "[" + ",".join(matches) + "]"
                return json.loads(combined)
        except json.JSONDecodeError:
            pass
        
        return None

    @staticmethod
    def summarize_research_paper(pdf_path):
        """
        Summarize a research paper using Gemini AI.
        Returns a list of section summaries with titles and page numbers.
        """
        # Initialize Gemini model
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable not set")
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash-lite')
        
        # Extract content by page
        page_contents = LLMResponder.extract_text_content_by_page(pdf_path)
        
        # Combine all pages into a single document with page markers
        full_document = ""
        for page_num in sorted(page_contents.keys()):
            full_document += f"\n\n--- PAGE {page_num} ---\n\n"
            full_document += page_contents[page_num]
        
        logger.info(f"Sending complete document for summarization")
        
        # Create a single prompt with all content
        prompt = f"""I want you to act as a research paper summarizer. Your task is to identify section titles and 
        create concise 2-line summaries for each section from the following research paper. Focus on the main points and key findings.

        {full_document}

        Please analyze the entire document and provide a summary of the research paper.
        Identify all section titles, their page numbers, and provide a 2-line summary for each section.
        Format your response as a JSON array with objects containing "Section Title", "Summary", and "page_no" fields.
        IMPORTANT: Provide ONLY the JSON array without any markdown formatting, explanation, or code blocks.
        Example format:
        [
            {{
                "Section Title": "1. Introduction",
                "Summary": "Introduces the research problem, background, and motivation.",
                "page_no": 1
            }},
            ...
        ]"""
        
        # Send the prompt and get the response
        response = model.generate_content(prompt)
        response_text = response.text
        
        # Try to parse JSON from the response using our robust extraction function
        summary = LLMResponder.extract_json_from_text(response_text)
        
        # If all extraction methods fail, return the error with raw response
        if summary is None:
            summary = {"error": "Could not extract JSON from response", "raw_response": response_text}
        
        return summary

    @staticmethod
    def process_paper_sections(db: Session, paper_id: int, file_path: str):
        try:
            """ 
            Process the paper sections and save them to the database.
            This function is called after the paper is uploaded and processed.
            
            """
            logger.info(f"Starting processing for paper ID: {paper_id}")
            
            summaries = LLMResponder.summarize_research_paper(file_path)
            
            # Check if we got valid summaries
            if isinstance(summaries, list):
                
                # Save each section summary
                for section in summaries:
                    try:
                        section_title = section.get("Section Title", "Untitled Section")
                        summary_text = section.get("Summary", "")
                        page = section.get("page_no", 1)
                        
                        
                        
                        # Save the section summary
                        SummaryService.save_summary(
                            session=db,
                            paper_id=paper_id,
                            section_title=section_title,
                            summary_text=summary_text,
                            page=page
                        )
                    except Exception as e:
                        logger.error(f"Error saving section {section_title}: {str(e)}")
            else:
                logger.error(f"Failed to generate summaries: {summaries}")
                
            logger.info(f"Completed processing for paper ID: {paper_id}")
        except Exception as e:
            logger.error(f"Error in process_paper_sections for paper ID {paper_id}: {str(e)}")
