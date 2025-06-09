# llm/llmresponder.py
import os
import google.generativeai as genai

class LLMResponder:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        # Use the correct model name for the current API version
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def generate_summary(self, text: str) -> str:
        prompt = f"""Summarize this research paper section in 2 sentences. 
        Focus on the main points and key findings:

        {text}

        Summary:"""
        
        # Remove await as generate_content is not an async method
        response = self.model.generate_content(prompt)
        return response.text
