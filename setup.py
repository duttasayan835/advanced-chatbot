from setuptools import setup, find_packages

setup(
	name="advanced_chatbot",
	version="1.0.0",
	packages=find_packages(),
	include_package_data=True,
	package_data={
		'src': ['frontend/*', 'backend/*'],
	},
	python_requires='>=3.11',
	install_requires=[
		'flask>=2.3.2',
		'flask-cors>=4.0.0',
		'python-dotenv>=1.0.0',
		'google-generativeai>=0.3.1',
		'requests>=2.31.0',
		'Pillow>=11.1.0',
		'gunicorn>=21.2.0'
	]
)