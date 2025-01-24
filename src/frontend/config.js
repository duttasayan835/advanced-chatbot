const config = {
	apiUrl: process.env.NODE_ENV === 'production' 
		? 'https://advanced-chatbot-aqzc.onrender.com'
		: 'http://localhost:5000',
	frontendUrl: 'https://duttasayan835.github.io/advanced_chatbot'
};

export default config;