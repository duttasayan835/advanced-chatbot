# Advanced Chatbot with Gemini AI

A cyberpunk-themed chatbot application with image processing capabilities and web search functionality.

## Features
- Text and image-based conversations
- Web search functionality
- Dark/Light theme toggle
- Cyberpunk UI design
- Image analysis and text extraction
- Fast responses using Gemini API

## Deployment Instructions

### Prerequisites
- Python 3.x
- Gemini API key

### Local Development
1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   - Create a `.env` file
   - Add your Gemini API key: `GEMINI_API_KEY=your_api_key`

4. Run the application:
   ```bash
   python src/backend/chatbot.py
   ```

### Heroku Deployment
1. Create a Heroku account
2. Install Heroku CLI
3. Login to Heroku:
   ```bash
   heroku login
   ```
4. Create a new Heroku app:
   ```bash
   heroku create your-app-name
   ```
5. Set environment variables:
   ```bash
   heroku config:set GEMINI_API_KEY=your_api_key
   heroku config:set FLASK_ENV=production
   ```
6. Deploy:
   ```bash
   git push heroku main
   ```

The application will be available at `https://your-app-name.herokuapp.com`

```