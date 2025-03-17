import requests
import json
import logging
import os
from typing import Dict, List, Optional, Any
from datetime import datetime

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configurações da API do RD Station
RD_API_URL = "https://api.rd.services"
RD_API_KEY = os.environ.get("RD_STATION_API_KEY", "")


class RDStationClient:
    """Cliente para integração com RD Station."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or RD_API_KEY
        if not self.api_key:
            logger.warning("Chave de API do RD Station não configurada")
        
        self.headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
    
    def create_contact(self, email: str, name: str, company: Optional[str] = None, 
                      phone: Optional[str] = None, tags: Optional[List[str]] = None) -> Dict:
        """Cria ou atualiza um contato no RD Station."""
        if not self.api_key:
            return {"error": "Chave de API não configurada"}
        
        url = f"{RD_API_URL}/platform/contacts"
        
        data = {
            "email": email,
            "name": name,
            "cf_meeting_transcriber": "true"
        }
        
        if company:
            data["company"] = company
        
        if phone:
            data["mobile_phone"] = phone
        
        if tags:
            data["tags"] = tags
        
        try:
            response = requests.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao criar contato no RD Station: {e}")
            return {"error": str(e)}
    
    def create_opportunity(self, contact_id: str, deal_name: str, 
                          deal_value: float, pipeline_id: str) -> Dict:
        """Cria uma oportunidade no RD Station."""
        if not self.api_key:
            return {"error": "Chave de API não configurada"}
        
        url = f"{RD_API_URL}/platform/deals"
        
        data = {
            "deal": {
                "name": deal_name,
                "contact_id": contact_id,
                "deal_stage_id": pipeline_id,
                "amount": deal_value,
                "deal_custom_fields": [
                    {
                        "custom_field_id": "cf_origem",
                        "value": "Meeting Transcriber"
                    }
                ]
            }
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao criar oportunidade no RD Station: {e}")
            return {"error": str(e)}
    
    def add_note_to_contact(self, contact_id: str, note: str) -> Dict:
        """Adiciona uma nota a um contato no RD Station."""
        if not self.api_key:
            return {"error": "Chave de API não configurada"}
        
        url = f"{RD_API_URL}/platform/contacts/{contact_id}/notes"
        
        data = {
            "note": note
        }
        
        try:
            response = requests.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao adicionar nota no RD Station: {e}")
            return {"error": str(e)}
    
    def create_task(self, contact_id: str, title: str, description: str, 
                   due_date: datetime, assignee_id: Optional[str] = None) -> Dict:
        """Cria uma tarefa no RD Station."""
        if not self.api_key:
            return {"error": "Chave de API não configurada"}
        
        url = f"{RD_API_URL}/platform/tasks"
        
        data = {
            "task": {
                "title": title,
                "description": description,
                "due_date": due_date.isoformat(),
                "contact_id": contact_id
            }
        }
        
        if assignee_id:
            data["task"]["assignee_id"] = assignee_id
        
        try:
            response = requests.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao criar tarefa no RD Station: {e}")
            return {"error": str(e)}


def export_meeting_to_rdstation(meeting_data: Dict, transcript_data: Dict, 
                               participants: List[Dict]) -> Dict:
    """Exporta dados de uma reunião para o RD Station."""
    client = RDStationClient()
    
    results = {
        "contacts": [],
        "notes": [],
        "tasks": [],
        "opportunities": []
    }
    
    # Criar ou atualizar contatos para cada participante
    for participant in participants:
        contact_result = client.create_contact(
            email=participant.get("email", ""),
            name=participant.get("name", ""),
            company=participant.get("company", ""),
            tags=["meeting_transcriber", f"meeting_{meeting_data.get('id', '')}"]
        )
        
        results["contacts"].append(contact_result)
        
        if "error" not in contact_result:
            contact_id = contact_result.get("id", "")
            
            # Adicionar nota com resumo da reunião
            if transcript_data.get("summary"):
                summary = transcript_data["summary"]
                
                note_text = f"""
                Resumo da Reunião: {meeting_data.get('title', '')}
                Data: {meeting_data.get('started_at', '')}
                
                Pontos-chave:
                {chr(10).join([f'- {point}' for point in summary.get('key_points', [])])}
                
                Itens de ação:
                {chr(10).join([f'- {item}' for item in summary.get('action_items', [])])}
                
                Decisões:
                {chr(10).join([f'- {decision}' for decision in summary.get('decisions', [])])}
                
                Sentimento geral: {summary.get('sentiment', 'neutro')}
                
                Palavras-chave: {', '.join(summary.get('keywords', []))}
                """
                
                note_result = client.add_note_to_contact(contact_id, note_text)
                results["notes"].append(note_result)
            
            # Criar tarefas para itens de ação
            if transcript_data.get("summary", {}).get("action_items"):
                for i, action_item in enumerate(transcript_data["summary"]["action_items"]):
                    task_result = client.create_task(
                        contact_id=contact_id,
                        title=f"Ação da reunião: {meeting_data.get('title', '')}",
                        description=action_item,
                        due_date=datetime.now()  # Idealmente, extrair data do texto
                    )
                    results["tasks"].append(task_result)
    
    # Criar oportunidade se houver menção a valores
    if any("R$" in segment.get("text", "") for segment in transcript_data.get("segments", [])):
        # Simplificação: criar oportunidade para o primeiro contato
        if results["contacts"] and "error" not in results["contacts"][0]:
            opportunity_result = client.create_opportunity(
                contact_id=results["contacts"][0].get("id", ""),
                deal_name=f"Oportunidade da reunião: {meeting_data.get('title', '')}",
                deal_value=0.0,  # Valor seria extraído do texto
                pipeline_id="default"  # ID do pipeline seria configurável
            )
            results["opportunities"].append(opportunity_result)
    
    return results 