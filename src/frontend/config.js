const config = {
	apiUrl: process.env.NODE_ENV === 'production' 
		? 'https://advanced-chatbot-duttasayan835.vercel.app'
		: 'http://localhost:5000',
	frontendUrl: 'https://duttasayan835.github.io/advanced_chatbot'
};

export default config;