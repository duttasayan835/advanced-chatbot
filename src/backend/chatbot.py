import os
import sys
import base64
import logging
import requests
import google.generativeai as genai
from flask import Flask, request, jsonify, make_response, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from PIL import Image
import io
import time
from functools import wraps

# Rate limiting setup
RATE_LIMIT = 30  # requests per minute
rate_limit_dict = {}

def rate_limiter(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        now = time.time()
        ip = request.remote_addr
        
        if ip in rate_limit_dict:
            last_request_time = rate_limit_dict[ip]
            if now - last_request_time < (60.0 / RATE_LIMIT):
                return make_response(jsonify({
                    "response": "Hold up! You're sending messages too fast. Take a breather! 😅"
                }), 429)
        
        rate_limit_dict[ip] = now
        return f(*args, **kwargs)
    return wrapper

# Add frontend directory path
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')

# Configure logging
logging.basicConfig(level=logging.DEBUG, 
                    format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure Gemini API
try:
    genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
    logger.info("Gemini API configured successfully")
except Exception as e:
    logger.error(f"Failed to configure Gemini API: {e}")

class AdvancedChatbot:
    def __init__(self):
        self.conversation_history = []
        self.max_history_length = 10
        self.api_key = os.getenv('GEMINI_API_KEY', 'AIzaSyCBhTHKSgR5K8mRTxyaRyGN6cC9ubr4n64')
        self.api_url = "https://generativelanguage.googleapis.com/v1beta/models"
        
        try:
            # Initialize both API methods
            genai.configure(api_key=self.api_key)
            self.vision_model = genai.GenerativeModel('gemini-pro-vision')
            self.chat_model = genai.GenerativeModel('gemini-1.5-pro-latest')
            self.chat = self.chat_model.start_chat(history=[])
            logger.info("Chatbot models initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize chatbot models: {e}")
            raise

    def process_image(self, image_data, prompt=""):
        try:
            # Convert base64 to PIL Image
            image_bytes = base64.b64decode(image_data)
            image = Image.open(io.BytesIO(image_bytes))
            
            # Prepare vision prompt
            vision_prompt = f"""
            Analyze this image in detail. If there's text, extract and read it.
            If there are visual elements, describe them in detail.
            Consider:
            1. Any text content present
            2. Visual elements and their arrangement
            3. Colors, patterns, and notable features
            4. Context and potential meaning
            
            Additional context if provided: {prompt}
            """
            
            # Get response from vision model
            response = self.vision_model.generate_content([vision_prompt, image])
            return response.text
        except Exception as e:
            logger.error(f"Error processing image: {e}")
            return f"I had trouble processing that image. Error: {str(e)}"

    def direct_api_call(self, prompt):
        try:
            url = f"{self.api_url}/gemini-1.5-flash:generateContent?key={self.api_key}"
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }]
            }
            headers = {'Content-Type': 'application/json'}
            
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            if 'candidates' in data and len(data['candidates']) > 0:
                return data['candidates'][0]['content']['parts'][0]['text']
            return None
        except Exception as e:
            logger.error(f"Direct API call error: {e}")
            return None

    def generate_response(self, user_prompt, file_data=None):
        try:
            if not user_prompt and not file_data:
                return "Hey, what's on your mind? 🤔"

            if file_data:
                # Handle image processing
                if isinstance(file_data, list):
                    file_data = file_data[0]  # Take first file if multiple
                
                if 'data' in file_data and file_data.get('type', '').startswith('image/'):
                    vision_response = self.process_image(file_data['data'], user_prompt)
                    return vision_response

            # Try direct API call first for faster response
            direct_response = self.direct_api_call(user_prompt)
            if direct_response:
                return direct_response

            # Fallback to regular chat model if direct API fails
            context = f"""
            You are a friendly, Gen-Z style AI assistant. Keep responses concise and casual.
            Use emojis naturally but don't overdo it. Be helpful while maintaining a cool vibe.

            User message: {user_prompt}
            """
            
            response = self.chat.send_message(context)
            return response.text

        except Exception as e:
            error_msg = f"Error generating response: {str(e)}"
            logger.error(error_msg)
            if "429" in str(e):
                return "Whoa, slow down! Let me catch my breath. Try again in a sec! 😅"
            elif "quota" in str(e).lower():
                return "Taking a quick break! Be back in a minute. ⏳"
            else:
                return f"Oops! Something's not right. Let's try that again! 🔄 ({str(e)})"

    def web_search(self, query):
        try:
            search_context = f"""
            Act as a web search assistant. Provide comprehensive but concise information about: {query}
            Format your response as a list of 3-4 key points, each starting with an emoji.
            Make sure the information is factual and relevant.
            """
            
            response = self.chat.send_message(search_context)
            results = [line.strip() for line in response.text.split('\n') if line.strip() and line.strip().startswith('')]
            
            if not results:
                results = ["🔍 No specific results found for your query. Try rephrasing it!"]
            
            logger.debug(f"Search results for '{query}': {results}")
            return results
            
        except Exception as e:
            logger.error(f"Web search error: {e}")
            return [f"🚫 Search failed: Please try again in a moment"]

# Flask API Setup
app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='/')
CORS(app, resources={r"/*": {"origins": "*"}})
chatbot = AdvancedChatbot()

# Add root route to serve index.html
@app.route('/')
def serve_frontend():
    return send_from_directory(FRONTEND_DIR, 'index.html')

# Add route to serve static files
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(FRONTEND_DIR, path)

@app.route('/chat', methods=['POST'])
@rate_limiter
def chat_endpoint():
    try:
        data = request.json
        logger.debug(f"Received request data: {data}")
        
        user_prompt = data.get('prompt', '')
        file_data = data.get('file')
        
        bot_response = chatbot.generate_response(user_prompt, file_data)
        return jsonify({"response": bot_response})
    
    except Exception as e:
        logger.error(f"Unexpected error in chat endpoint: {e}")
        return make_response(jsonify({
            "response": "Oops! Something went wrong. Let's try again! 🔄"
        }), 500)


@app.route('/search', methods=['POST'])
def search_endpoint():
    try:
        data = request.json
        query = data.get('query', '')
        
        if not query:
            logger.warning("No search query provided")
            return make_response(jsonify({"error": "No search query provided"}), 400)
        
        search_results = chatbot.web_search(query)
        return jsonify({"results": search_results})
    
    except Exception as e:
        logger.error(f"Unexpected error in search endpoint: {e}")
        return make_response(jsonify({"error": str(e)}), 500)

if __name__ == '__main__':
    try:
        port = int(os.getenv('PORT', 5000))
        debug_mode = os.getenv('FLASK_ENV') != 'production'
        
        logger.info(f"Starting Flask application on port {port}")
        app.run(host='0.0.0.0', port=port, debug=debug_mode)
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)
