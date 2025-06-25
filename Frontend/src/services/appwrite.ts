import { Client, Account, Databases } from 'appwrite';

export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
  bucketId?: string;
}

export class AppwriteService {
  private client: Client;
  private account: Account;
  private databases: Databases;

  private endpoint: string;
  private projectId: string;
  private databaseId: string;
  
  public readonly usersCollectionId = "6857b86100325b4541ed";
  public readonly disastersCollectionId = "";
  public readonly aiMatrixCollectionId = "";
  public readonly tasksCollectionId = "";
  public readonly userRequestsCollectionId = "";
  public readonly resourcesCollectionId = "";

  constructor() {
    this.endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
    this.projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
    this.databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;

    // Validate required environment variables
    if (!this.projectId) {
      throw new Error("VITE_APPWRITE_PROJECT_ID environment variable is required");
    }

    if (!this.endpoint) {
      throw new Error("VITE_APPWRITE_ENDPOINT environment variable is required");
    }

    // Initialize Appwrite client
    this.client = new Client();
    
    // Configure client
    this.client
      .setEndpoint(this.endpoint)
      .setProject(this.projectId);

    // Initialize services
    this.account = new Account(this.client);
    this.databases = new Databases(this.client);
  }

  async getDocument(collectionId: string, documentId: string) {
    return this.databases.getDocument(
      this.databaseId,
      collectionId,
      documentId
    );
  }

  async updateDocument(collectionId: string, documentId: string, data: object) {
    return this.databases.updateDocument(
      this.databaseId,
      collectionId,
      documentId,
      data
    );
  }

  async getUser() {
    return this.account.get();
  }
}

export const appwriteService = new AppwriteService();