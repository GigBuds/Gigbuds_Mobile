import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * AsyncStorage Service
 * Replaces redux-persist functionality with direct AsyncStorage operations
 * Provides type-safe storage operations with JSON serialization
 */
class AsyncStorageService {
  /**
   * Store data in AsyncStorage with JSON serialization
   */
  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      console.log(`✅ AsyncStorage: Saved ${key}`);
    } catch (error) {
      console.error(`❌ AsyncStorage: Failed to save ${key}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve data from AsyncStorage with JSON deserialization
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue === null) {
        console.log(`📭 AsyncStorage: No data found for ${key}`);
        return null;
      }
      const parsedValue = JSON.parse(jsonValue) as T;
      console.log(`✅ AsyncStorage: Retrieved ${key}`);
      return parsedValue;
    } catch (error) {
      console.error(`❌ AsyncStorage: Failed to retrieve ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove data from AsyncStorage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`🗑️ AsyncStorage: Removed ${key}`);
    } catch (error) {
      console.error(`❌ AsyncStorage: Failed to remove ${key}:`, error);
      throw error;
    }
  }

  /**
   * Clear all AsyncStorage data
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log("🧹 AsyncStorage: Cleared all data");
    } catch (error) {
      console.error("❌ AsyncStorage: Failed to clear all data:", error);
      throw error;
    }
  }

  /**
   * Get all keys in AsyncStorage
   */
  async getAllKeys(): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      console.log(`📋 AsyncStorage: Found ${keys.length} keys`);
      return [...keys]; // Convert readonly array to mutable
    } catch (error) {
      console.error("❌ AsyncStorage: Failed to get all keys:", error);
      return [];
    }
  }

  /**
   * Update existing data in AsyncStorage (merge operation)
   */
  async updateItem<T extends Record<string, any>>(
    key: string,
    updates: Partial<T>
  ): Promise<T | null> {
    try {
      const existingData = await this.getItem<T>(key);
      if (!existingData) {
        console.warn(`⚠️ AsyncStorage: No existing data to update for ${key}`);
        return null;
      }

      const updatedData = { ...existingData, ...updates };
      await this.setItem(key, updatedData);
      console.log(`🔄 AsyncStorage: Updated ${key}`);
      return updatedData;
    } catch (error) {
      console.error(`❌ AsyncStorage: Failed to update ${key}:`, error);
      throw error;
    }
  }

  // ==================== GIGBUDS SPECIFIC STORAGE KEYS ====================

  static readonly KEYS = {
    USER: "gigbuds_user",
    MESSAGING_METADATA: "gigbuds_messaging_metadata",
    SETTINGS: "gigbuds_settings",
  } as const;

  // ==================== USER STATE OPERATIONS ====================

  async getUserState(): Promise<any | null> {
    return this.getItem(AsyncStorageService.KEYS.USER);
  }

  async setUserState(userState: any): Promise<void> {
    return this.setItem(AsyncStorageService.KEYS.USER, userState);
  }

  async clearUserState(): Promise<void> {
    return this.removeItem(AsyncStorageService.KEYS.USER);
  }

  // ==================== MESSAGING METADATA OPERATIONS ====================

  async getMessagingMetadata(): Promise<any | null> {
    return this.getItem(AsyncStorageService.KEYS.MESSAGING_METADATA);
  }

  async setMessagingMetadata(metadata: any): Promise<void> {
    return this.setItem(AsyncStorageService.KEYS.MESSAGING_METADATA, metadata);
  }

  async updateMessagingMetadata(updates: any): Promise<any | null> {
    return this.updateItem(
      AsyncStorageService.KEYS.MESSAGING_METADATA,
      updates
    );
  }

  async clearMessagingMetadata(): Promise<void> {
    return this.removeItem(AsyncStorageService.KEYS.MESSAGING_METADATA);
  }
}

// Export singleton instance
export const asyncStorageService = new AsyncStorageService();
export default asyncStorageService;
