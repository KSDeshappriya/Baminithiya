from appwrite.client import Client
from appwrite.services.account import Account
from appwrite.services.databases import Databases
from appwrite.services.users import Users
from appwrite.exception import AppwriteException
from appwrite.id import ID
from appwrite.query import Query
import os
from typing import Dict, Any, Optional

class AppwriteService:
    def __init__(self):
        # Initialize Appwrite client
        self.client = Client()
        
        # Get configuration from environment variables
        self.endpoint = os.getenv("APPWRITE_ENDPOINT")
        self.project_id = os.getenv("APPWRITE_PROJECT_ID")
        self.api_key = os.getenv("APPWRITE_API_KEY")
        self.database_id = os.getenv("APPWRITE_DATABASE_ID")
        self.users_collection_id = "6857b86100325b4541ed"
        if not self.project_id:
            raise ValueError("APPWRITE_PROJECT_ID environment variable is required")
        if not self.api_key:
            raise ValueError("APPWRITE_API_KEY environment variable is required")
        
        # Configure client
        self.client.set_endpoint(self.endpoint)
        self.client.set_project(self.project_id)
        self.client.set_key(self.api_key)
        
        # Initialize services
        self.account = Account(self.client)
        self.databases = Databases(self.client)
        self.users = Users(self.client)
    
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