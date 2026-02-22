"""
Multi-Provider LLM Configuration
Supports multiple AI providers with different rate limits and pricing.
"""
from typing import Optional, Dict, Any
import os


class LLMProvider:
    """Base class for LLM providers."""
    
    @staticmethod
    def get_provider(provider_name: str):
        """Factory method to get provider instance."""
        providers = {
            'groq': GroqProvider,
            'openai': OpenAIProvider,
            'anthropic': AnthropicProvider,
            'gemini': GeminiProvider,
            'cohere': CohereProvider
        }
        
        provider_class = providers.get(provider_name.lower())
        if not provider_class:
            raise ValueError(f"Unknown provider: {provider_name}")
        
        return provider_class()
    
    def generate(self, prompt: str, **kwargs) -> str:
        """Generate response from prompt."""
        raise NotImplementedError


class GroqProvider(LLMProvider):
    """
    Groq Provider - BEST FOR STUDENTS!
    ✅ FREE unlimited API calls
    ✅ Very fast inference
    ✅ Models: Llama 3, Mixtral, Gemma
    """
    
    def __init__(self):
        self.api_key = os.getenv('GROQ_API_KEY')
        self.model = "llama-3.3-70b-versatile"  # Latest supported model (Feb 2026)
        self.client = None
        
        if self.api_key:
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
            except ImportError:
                raise ImportError("Install groq: pip install groq")
    
    def generate(self, prompt: str, **kwargs) -> str:
        if not self.client:
            raise ValueError("GROQ_API_KEY not set")
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=kwargs.get('temperature', 0.7),
            max_tokens=kwargs.get('max_tokens', 2000)
        )
        
        return response.choices[0].message.content


class OpenAIProvider(LLMProvider):
    """
    OpenAI Provider
    💰 Paid but reliable
    ✅ GPT-4, GPT-3.5-turbo
    """
    
    def __init__(self):
        self.api_key = os.getenv('OPENAI_API_KEY')
        self.model = "gpt-3.5-turbo"  # Cheaper option
        self.client = None
        
        if self.api_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(api_key=self.api_key)
            except ImportError:
                raise ImportError("Install openai: pip install openai")
    
    def generate(self, prompt: str, **kwargs) -> str:
        if not self.client:
            raise ValueError("OPENAI_API_KEY not set")
        
        response = self.client.chat.completions.create(
            model=kwargs.get('model', self.model),
            messages=[{"role": "user", "content": prompt}],
            temperature=kwargs.get('temperature', 0.7),
            max_tokens=kwargs.get('max_tokens', 2000)
        )
        
        return response.choices[0].message.content


class AnthropicProvider(LLMProvider):
    """
    Anthropic Claude Provider
    ✅ Good free tier
    ✅ Claude Sonnet, Haiku
    """
    
    def __init__(self):
        self.api_key = os.getenv('ANTHROPIC_API_KEY')
        self.model = "claude-3-haiku-20240307"  # Cheapest
        self.client = None
        
        if self.api_key:
            try:
                from anthropic import Anthropic
                self.client = Anthropic(api_key=self.api_key)
            except ImportError:
                raise ImportError("Install anthropic: pip install anthropic")
    
    def generate(self, prompt: str, **kwargs) -> str:
        if not self.client:
            raise ValueError("ANTHROPIC_API_KEY not set")
        
        response = self.client.messages.create(
            model=kwargs.get('model', self.model),
            max_tokens=kwargs.get('max_tokens', 2000),
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.content[0].text


class GeminiProvider(LLMProvider):
    """
    Google Gemini Provider
    ⚠️ Limited free tier (60 requests/minute)
    """
    
    def __init__(self):
        self.api_key = os.getenv('GOOGLE_API_KEY')
        self.model = "gemini-1.5-flash"
        self.client = None
        
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.client = genai.GenerativeModel(self.model)
            except ImportError:
                raise ImportError("Install: pip install google-generativeai")
    
    def generate(self, prompt: str, **kwargs) -> str:
        if not self.client:
            raise ValueError("GOOGLE_API_KEY not set")
        
        response = self.client.generate_content(prompt)
        return response.text


class CohereProvider(LLMProvider):
    """
    Cohere Provider
    ✅ Generous free tier
    """
    
    def __init__(self):
        self.api_key = os.getenv('COHERE_API_KEY')
        self.model = "command"
        self.client = None
        
        if self.api_key:
            try:
                import cohere
                self.client = cohere.Client(self.api_key)
            except ImportError:
                raise ImportError("Install: pip install cohere")
    
    def generate(self, prompt: str, **kwargs) -> str:
        if not self.client:
            raise ValueError("COHERE_API_KEY not set")
        
        response = self.client.generate(
            model=self.model,
            prompt=prompt,
            max_tokens=kwargs.get('max_tokens', 2000),
            temperature=kwargs.get('temperature', 0.7)
        )
        
        return response.generations[0].text


# Provider Comparison for Students
PROVIDER_INFO = {
    'groq': {
        'name': 'Groq (Llama 3)',
        'free_tier': '✅ UNLIMITED FREE',
        'best_for': 'Students, High Traffic',
        'models': 'Llama 3.1 70B, Mixtral, Gemma',
        'speed': '⚡ Extremely Fast'
    },
    'cohere': {
        'name': 'Cohere',
        'free_tier': '✅ 100 calls/min free',
        'best_for': 'Production Apps',
        'models': 'Command, Command-R',
        'speed': '⚡ Fast'
    },
    'anthropic': {
        'name': 'Claude (Anthropic)',
        'free_tier': '✅ Good free tier',
        'best_for': 'Quality Analysis',
        'models': 'Claude 3 Haiku, Sonnet',
        'speed': '🔶 Medium'
    },
    'gemini': {
        'name': 'Google Gemini',
        'free_tier': '⚠️ 60/min limit',
        'best_for': 'Light Usage',
        'models': 'Gemini 1.5 Flash, Pro',
        'speed': '🔶 Medium'
    },
    'openai': {
        'name': 'OpenAI GPT',
        'free_tier': '💰 Paid Only',
        'best_for': 'When You Have Budget',
        'models': 'GPT-4, GPT-3.5',
        'speed': '🔶 Medium'
    }
}
