from setuptools import setup, find_packages

setup(
    name="jarvis-assistant",
    version="0.1",
    packages=find_packages(),
    install_requires=[
        'google-auth-oauthlib==1.0.0',
        'google-auth-httplib2==0.1.0',
        'google-api-python-client==2.86.0',
        'python-dotenv==1.0.0',
        'requests==2.31.0',
        'schedule==1.2.0',
        'python-dateutil==2.8.2',
        'fastapi==0.95.1',
        'uvicorn==0.21.1',
        'pydantic==1.10.7',
        'twilio==8.5.0'
    ]
) 