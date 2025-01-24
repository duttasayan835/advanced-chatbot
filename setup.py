from setuptools import setup, find_packages

setup(
	name="advanced_chatbot",
	version="1.0.0",
	packages=find_packages(),
	include_package_data=True,
	install_requires=[
		'flask',
		'flask-cors',
		'python-dotenv',
		'google-generativeai',
		'requests',
		'Pillow',
		'gunicorn'
	]
)