import os
import sys

# Add the project root directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from src.backend.chatbot import app

# Expose app for gunicorn
application = app

if __name__ == "__main__":
	app.run()
