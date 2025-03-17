import os
from dotenv import load_dotenv

class Config:
    def __init__(self):
        load_dotenv()
        
        # Twilio configs
        self.twilio_account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.twilio_auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.twilio_whatsapp_number = os.getenv('TWILIO_WHATSAPP_NUMBER')
        
        # Google Calendar configs
        self.google_calendar_credentials = os.getenv('GOOGLE_CALENDAR_CREDENTIALS', 'credentials.json')
        self.timezone = os.getenv('TIMEZONE', 'America/Sao_Paulo')
        self.reminder_minutes = int(os.getenv('REMINDER_MINUTES', '30'))
        
        self._validate_config()
    
    def _validate_config(self):
        required_vars = [
            'TWILIO_ACCOUNT_SID',
            'TWILIO_AUTH_TOKEN',
            'TWILIO_WHATSAPP_NUMBER'
        ]
        
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}") 