from appwrite.client import Client
from appwrite.services.account import Account
from appwrite.services.databases import Databases
from appwrite.services.users import Users
from appwrite.services.storage import Storage  
from appwrite.input_file import InputFile      
from appwrite.exception import AppwriteException
from appwrite.id import ID
from appwrite.query import Query
import os
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

class AppwriteService:
    def __init__(self):
        # Initialize Appwrite client
        self.client = Client()
        
        # Get configuration from environment variables
        self.endpoint = os.getenv("APPWRITE_ENDPOINT")
        self.project_id = os.getenv("APPWRITE_PROJECT_ID")
        self.api_key = os.getenv("APPWRITE_API_KEY")
        self.database_id = os.getenv("APPWRITE_DATABASE_ID")
        self.bucket_id = os.getenv("APPWRITE_BUCKET_ID")
        self.users_collection_id = os.getenv("APPWRITE_USERS_COLLECTION_ID")
        self.disasters_collection_id = os.getenv("APPWRITE_DISASTERS_COLLECTION_ID")
        self.ai_matrix_collection_id = os.getenv("APPWRITE_AI_MATRIX_COLLECTION_ID")
        self.tasks_collection_Id = os.getenv("APPWRITE_TASKS_COLLECTION_ID")
        self.user_requests_collection_id = os.getenv("APPWRITE_USER_REQUESTS_COLLECTION_ID")
        self.resources_collection_id = os.getenv("APPWRITE_RESOURCES_COLLECTION_ID")
        
        missing_vars = []
        if not self.project_id:
            missing_vars.append("APPWRITE_PROJECT_ID")
        if not self.api_key:
            missing_vars.append("APPWRITE_API_KEY")
        if not self.users_collection_id:
            missing_vars.append("APPWRITE_USERS_COLLECTION_ID")
        if not self.disasters_collection_id:
            missing_vars.append("APPWRITE_DISASTERS_COLLECTION_ID")
        if not self.ai_matrix_collection_id:
            missing_vars.append("APPWRITE_AI_MATRIX_COLLECTION_ID")
        if not self.tasks_collection_Id:
            missing_vars.append("APPWRITE_TASKS_COLLECTION_ID")
        if not self.user_requests_collection_id:
            missing_vars.append("APPWRITE_USER_REQUESTS_COLLECTION_ID")
        if not self.resources_collection_id:
            missing_vars.append("APPWRITE_RESOURCES_COLLECTION_ID")
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")
        
        # Configure client
        self.client.set_endpoint(self.endpoint)
        self.client.set_project(self.project_id)
        self.client.set_key(self.api_key)
        
        # Initialize services
        self.account = Account(self.client)
        self.databases = Databases(self.client)
        self.users = Users(self.client)
        self.storage = Storage(self.client)  # Add storage service initialization
    
    def create_user_account(self, email: str, password: str, name: str) -> Dict[str, Any]:
        """Create a new user account in Appwrite Auth"""
        try:
            user = self.users.create(
                user_id=ID.unique(),
                email=email,
                password=password,
                name=name
            )
            return user
        except AppwriteException as e:
            raise Exception(f"Failed to create user account: {e.message}")
    
    def create_user_document(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create user profile document in database"""
        try:
            document = self.databases.create_document(
                database_id=self.database_id,
                collection_id=self.users_collection_id,
                document_id=user_id,
                data=user_data
            )
            return document
        except AppwriteException as e:
            raise Exception(f"Failed to create user document: {e.message}")
    
    def get_user_document(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user profile document from database"""
        try:
            document = self.databases.get_document(
                database_id=self.database_id,
                collection_id=self.users_collection_id,
                document_id=user_id
            )
            return document
        except AppwriteException as e:
            if e.code == 404:
                return None
            raise Exception(f"Failed to get user document: {e.message}")
    
    def update_user_document(self, user_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Update user profile document"""
        try:
            document = self.databases.update_document(
                database_id=self.database_id,
                collection_id=self.users_collection_id,
                document_id=user_id,
                data=data
            )
            return document
        except AppwriteException as e:
            raise Exception(f"Failed to update user document: {e.message}")
        
    def delete_user(self, user_id: str) -> None:
        """Delete a user from Appwrite Auth and their document from the database"""
        try:
            # Delete user from Appwrite Auth
            self.users.delete(user_id)
            
            # Delete user document from database
            self.databases.delete_document(
                database_id=self.database_id,
                collection_id=self.users_collection_id,
                document_id=user_id
            )
        except AppwriteException as e:
            raise Exception(f"Failed to delete user: {e.message}")
    
    def list_users_by_email(self, email: str) -> Dict[str, Any]:
        """List users by email"""
        try:
            users = self.users.list(
                queries=[Query.equal("email", email)]
            )
            return users
        except AppwriteException as e:
            raise Exception(f"Failed to list users: {e.message}")
    
    def get_user_by_id(self, user_id: str) -> Dict[str, Any]:
        """Get user by ID from Appwrite Auth"""
        try:
            user = self.users.get(user_id)
            return user
        except AppwriteException as e:
            raise Exception(f"Failed to get user: {e.message}")
    
    def verify_user_credentials(self, email: str, password: str) -> Dict[str, Any]:
        """Verify user credentials by attempting to create a temporary session"""
        try:
            return self.account.create_email_password_session(email, password)
            
        except AppwriteException as e:
            raise Exception(f"Failed to verify credentials: {e.message}")
    
    def get_user_by_email_from_auth(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user from Appwrite Auth by email"""
        try:
            users = self.users.list(
                queries=[Query.equal("email", email)]
            )
            if users['total'] > 0:
                return users['users'][0]
            return None
        except AppwriteException as e:
            raise Exception(f"Failed to get user by email: {e.message}")
    
    def upload_disaster_image_to_storage(self, image_bytes: bytes, disaster_id: str) -> str:
        """Upload disaster image to Appwrite Storage and return the file URL"""
        try:
            file = InputFile.from_bytes(image_bytes, filename=f"{disaster_id}.jpg")
            result = self.storage.create_file(
                bucket_id=self.bucket_id,
                file_id=ID.unique(),
                file=file
            )
            file_id = result['$id']
            file_url = f"{self.endpoint}/storage/buckets/{self.bucket_id}/files/{file_id}/view?project={self.project_id}"
            return file_url
        except AppwriteException as e:
            raise Exception(f"Error uploading image to Appwrite: {e.message}")
        except Exception as e:
            raise Exception(f"Error uploading image: {str(e)}")

    def save_disaster_to_database(self, disaster_data: dict) -> bool:
        """Save disaster data to Appwrite Database"""
        try:
            self.databases.create_document(
                database_id=self.database_id,
                collection_id=self.disasters_collection_id,
                document_id=disaster_data['disaster_id'],
                data=disaster_data
            )
            return True
        except Exception as e:
            raise Exception(f"Error saving to Appwrite Database: {str(e)}")

    def save_ai_matrix_to_appwrite(self, ai_matrix_data: dict) -> bool:
        """Save AI matrix data to Appwrite Database"""
        try:
            self.databases.create_document(
                database_id=self.database_id,
                collection_id=self.ai_matrix_collection_id,
                document_id=f"matrix_{ai_matrix_data['disaster_id']}",
                data=ai_matrix_data
            )
            return True
        except Exception as e:
            raise Exception(f"Error saving AI Matrix to Appwrite Database: {str(e)}")
    
    def get_disaster_document(self, disaster_id: str) -> dict:
        """Get a disaster document from the disasters collection."""
        try:
            document = self.databases.get_document(
                database_id=self.database_id,
                collection_id=self.disasters_collection_id,
                document_id=disaster_id
            )
            return document
        except AppwriteException as e:
            raise Exception(f"Failed to get disaster document: {e.message}")

    def save_task_document(self, task_data: dict) -> dict:
        """Save a task document to the tasks collection."""
        try:
            document = self.databases.create_document(
                database_id=self.database_id,
                collection_id=self.tasks_collection_Id,
                document_id=task_data['task_id'],
                data=task_data
            )
            return document
        except AppwriteException as e:
            raise Exception(f"Failed to save task document: {e.message}")
    
    def list_resources_for_disaster(self, disaster_id: str) -> list:
        """List resources for a given disaster_id from the resources collection."""
        try:
            documents = self.databases.list_documents(
                database_id=self.database_id,
                collection_id=self.resources_collection_id,
                queries=[Query.equal("disaster_id", disaster_id)]
            )
            return documents.get("documents", [])
        except AppwriteException as e:
            raise Exception(f"Failed to list resources: {e.message}")

    def save_user_request_document(self, user_id: str, user_request_data: dict) -> dict:
        """Save a user request document to the user requests collection."""
        try:
            document = self.databases.create_document(
                database_id=self.database_id,
                collection_id=self.user_requests_collection_id,
                document_id=user_id,
                data=user_request_data
            )
            return document
        except AppwriteException as e:
            raise Exception(f"Failed to save user request: {e.message}")

    def update_disaster_status(self, disaster_id: str, status: str) -> dict:
        """Update the status of a disaster document."""
        try:
            document = self.databases.update_document(
                database_id=self.database_id,
                collection_id=self.disasters_collection_id,
                document_id=disaster_id,
                data={"status": status}
            )
            return document
        except AppwriteException as e:
            raise Exception(f"Failed to update disaster status: {e.message}")

    def archive_disaster(self, disaster_id: str) -> dict:
        """Archive a disaster (set status to 'archived')."""
        return self.update_disaster_status(disaster_id, "archived")

    def add_resource_to_disaster(self, disaster_id: str, resource_data: dict) -> dict:
        """Add a resource document to the resources collection for a disaster."""
        from appwrite.id import ID
        try:
            data = {"disaster_id": disaster_id, **resource_data}
            document = self.databases.create_document(
                database_id=self.database_id,
                collection_id=self.resources_collection_id,
                document_id=ID.unique(),
                data=data
            )
            return document
        except AppwriteException as e:
            raise Exception(f"Failed to add resource: {e.message}")
        
    def delete_resource(self, resource_id: str):
        """Delete a resource document."""
        try:
            self.databases.delete_document(
                database_id=self.database_id,
                collection_id=self.resources_collection_id,
                document_id=resource_id
            )
        except AppwriteException as e:
            raise Exception(f"Failed to delete resource: {e.message}")

    def update_resource_availability(self, resource_id: str, new_availability: int):
        """Update the availability of a resource document."""
        try:
            self.databases.update_document(
                database_id=self.database_id,
                collection_id=self.resources_collection_id,
                document_id=resource_id,
                data={"availability": new_availability}
            )
        except AppwriteException as e:
            raise Exception(f"Failed to update availability: {e.message}")

    def get_disaster(self, disaster_id: str) -> dict:
        """Get a disaster document by ID."""
        try:
            document = self.databases.get_document(
                database_id=self.database_id,
                collection_id=self.disasters_collection_id,
                document_id=disaster_id
            )
            return document
        except AppwriteException as e:
            raise Exception(f"Failed to get disaster: {e.message}")

    def query_disasters_by_geohash_and_time(self, geohash_prefix: str, min_timestamp: int, limit: int = 100) -> list:
        try:
            documents = self.databases.list_documents(
                database_id=self.database_id,
                collection_id=self.disasters_collection_id,
                queries=[
                    Query.starts_with('geohash', geohash_prefix),
                    Query.greater_than('submitted_time', min_timestamp),
                    Query.limit(limit)
                ]
            )
            return documents.get('documents', [])
        except AppwriteException as e:
            raise Exception(f"Failed to query disasters: {e.message}")

    def update_task_status(self, task_id: str, status: str, action_done_by: str = None) -> dict:
        """Update the status (and optionally action_done_by) of a task document."""
        try:
            data = {"status": status}
            if action_done_by:
                data["action_done_by"] = action_done_by
            document = self.databases.update_document(
                database_id=self.database_id,
                collection_id=self.tasks_collection_Id,
                document_id=task_id,
                data=data
            )
            return document
        except AppwriteException as e:
            raise Exception(f"Failed to update task status: {e.message}")

    def delete_user_request_document(self, document_id: str):
        """Delete a user request document from the user requests collection."""
        try:
            self.databases.delete_document(
                database_id=self.database_id,
                collection_id=self.user_requests_collection_id,
                document_id=document_id
            )
        except AppwriteException as e:
            raise Exception(f"Failed to delete user request: {e.message}")

    def list_tasks_by_user_and_disaster(self, user_id: str, disaster_id: str) -> list:
        """List tasks for a given user_id and disaster_id from the tasks collection."""
        try:
            documents = self.databases.list_documents(
                database_id=self.database_id,
                collection_id=self.tasks_collection_Id,
                queries=[
                    Query.equal("user_id", user_id),
                    Query.equal("disaster_id", disaster_id)
                ]
            )
            return documents.get("documents", [])
        except AppwriteException as e:
            raise Exception(f"Failed to list tasks: {e.message}")