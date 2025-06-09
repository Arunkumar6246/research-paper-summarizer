# llm/llmresponder.py
import os
import google.generativeai as genai

class LLMResponder:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        # Use the correct model name for the current API version
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    async def generate_summary(self, text: str) -> str:
        prompt = f"""Please provide a concise summary of the following research paper section. 
        Focus on the main points and key findings:

        {text}

        Summary:"""
        
        # Remove await as generate_content is not an async method
        response = self.model.generate_content(prompt)
        return response.text
