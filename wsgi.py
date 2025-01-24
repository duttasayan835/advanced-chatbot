import os
import sys

# Add the project root directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.backend.chatbot import app

# Make the app variable accessible at module level
application = app

if __name__ == "__main__":
	app.run()