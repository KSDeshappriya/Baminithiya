import { Client, Account, Databases, Query } from 'appwrite';
import { encode } from 'ngeohash';

export interface AppwriteConfig {
  endpoint: string;
  projectId: string;
  databaseId: string;
}

export interface DisasterDocument {
  $id: string;
  disaster_id: string;
  geohash: string;
  submitted_time: number;
  status: string;
  [key: string]: unknown;
}

export interface AIMatrixDocument {
  $id: string;
  disaster_id: string;
  [key: string]: unknown;
}

export interface ResourceDocument {
  $id: string;
  disaster_id: string;
  availability: number;
  [key: string]: unknown;
}

export interface TaskDocument {
  $id: string;
  disaster_id: string;
  task_id: string;
  [key: string]: unknown;
}

export class AppwriteService {
  private client: Client;
  private account: Account;
  private databases: Databases;
  private endpoint: string;
  private projectId: string;
  private databaseId: string;
  
  // Collection IDs from environment variables
  public readonly usersCollectionId: string;
  public readonly disastersCollectionId: string;
  public readonly aiMatrixCollectionId: string;
  public readonly tasksCollectionId: string;
  public readonly userRequestsCollectionId: string;
  public readonly resourcesCollectionId: string;

  constructor() {
    this.endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
    this.projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
    this.databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    
    // Collection IDs from environment variables
    this.usersCollectionId = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
    this.disastersCollectionId = import.meta.env.VITE_APPWRITE_DISASTERS_COLLECTION_ID;
    this.aiMatrixCollectionId = import.meta.env.VITE_APPWRITE_AI_MATRIX_COLLECTION_ID;
    this.tasksCollectionId = import.meta.env.VITE_APPWRITE_TASKS_COLLECTION_ID;
    this.userRequestsCollectionId = import.meta.env.VITE_APPWRITE_USER_REQUESTS_COLLECTION_ID;
    this.resourcesCollectionId = import.meta.env.VITE_APPWRITE_RESOURCES_COLLECTION_ID;

    // Validate required environment variables
    const requiredVars = [
      { name: 'VITE_APPWRITE_PROJECT_ID', value: this.projectId },
      { name: 'VITE_APPWRITE_ENDPOINT', value: this.endpoint },
      { name: 'VITE_APPWRITE_DATABASE_ID', value: this.databaseId },
      { name: 'VITE_APPWRITE_USERS_COLLECTION_ID', value: this.usersCollectionId },
      { name: 'VITE_APPWRITE_DISASTERS_COLLECTION_ID', value: this.disastersCollectionId },
      { name: 'VITE_APPWRITE_AI_MATRIX_COLLECTION_ID', value: this.aiMatrixCollectionId },
      { name: 'VITE_APPWRITE_TASKS_COLLECTION_ID', value: this.tasksCollectionId },
      { name: 'VITE_APPWRITE_USER_REQUESTS_COLLECTION_ID', value: this.userRequestsCollectionId },
      { name: 'VITE_APPWRITE_RESOURCES_COLLECTION_ID', value: this.resourcesCollectionId }
    ];

    const missingVars = requiredVars.filter(v => !v.value).map(v => v.name);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
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

  // Existing methods
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

  /**
   * Get AI Matrix by disaster ID
   */
  async getAIMatrixByDisasterId(disasterId: string): Promise<AIMatrixDocument | null> {
    try {
      const document = await this.databases.getDocument(
        this.databaseId,
        this.aiMatrixCollectionId,
        `matrix_${disasterId}`
      );
      return document as unknown as AIMatrixDocument;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
        return null;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get AI matrix: ${errorMessage}`);
    }
  }

  /**
   * Get all disasters
   */
  async getAllDisasters(): Promise<DisasterDocument[]> {
    try {
      const response = await this.databases.listDocuments(
        this.databaseId,
        this.disastersCollectionId,
      );
      return response.documents as unknown as DisasterDocument[];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get all disasters: ${errorMessage}`);
    }
  }

  /**
   * Get disaster details by ID
   */
  async getDisasterById(disasterId: string): Promise<DisasterDocument | null> {
    try {
      const document = await this.databases.getDocument(
        this.databaseId,
        this.disastersCollectionId,
        disasterId
      );
      return document as unknown as DisasterDocument;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 404) {
        return null;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get disaster: ${errorMessage}`);
    }
  }

  /**
   * Get all resources by disaster ID
   */
  async getResourcesByDisasterId(disasterId: string): Promise<ResourceDocument[]> {
    try {
      const response = await this.databases.listDocuments(
        this.databaseId,
        this.resourcesCollectionId,
        [Query.equal("disaster_id", disasterId)]
      );
      return response.documents as unknown as ResourceDocument[];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get resources: ${errorMessage}`);
    }
  }

  /**
   * Get all tasks by disaster ID
   */
  async getTasksByDisasterId(disasterId: string): Promise<TaskDocument[]> {
    try {
      const response = await this.databases.listDocuments(
        this.databaseId,
        this.tasksCollectionId,
        [Query.equal("disaster_id", disasterId)]
      );
      return response.documents as unknown as TaskDocument[];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get tasks: ${errorMessage}`);
    }
  }

  /**
   * Find nearby disasters within a week
   */
  async getNearbyDisasters(latitude: number, longitude: number): Promise<DisasterDocument[]> {
    const EXCLUDED_KEYS = new Set([
      "gdac_disasters",
      "cnn_analysis", 
      "weather_data",
      "citizen_survival_guide",
      "government_report"
    ]);

    const geohashPrefix = encode(latitude, longitude, 4);
    const oneWeekAgo = Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60);

    console.log(`Querying disasters near geohash: ${geohashPrefix} from ${oneWeekAgo} seconds ago`);

    try {
      const response = await this.databases.listDocuments(
        this.databaseId,
        this.disastersCollectionId,
        [
          Query.startsWith('geohash', geohashPrefix),
          Query.greaterThan('submitted_time', oneWeekAgo),
          Query.limit(100)
        ]
      );

      const results: DisasterDocument[] = [];
      
      for (const document of response.documents) {
        // Clean the document by removing excluded keys
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(document)) {
          if (!EXCLUDED_KEYS.has(key)) {
            cleaned[key] = value;
          }
        }

        const submittedTime = cleaned.submitted_time;
        if (typeof submittedTime === 'number' && submittedTime >= oneWeekAgo) {
          results.push(cleaned as DisasterDocument);
        }
      }

      return results;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error querying disasters: ${errorMessage}`);
      return [];
    }
  }
}

export const appwriteService = new AppwriteService();