/**
 * Search History Service
 * Manages search history with local storage persistence
 */

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  type: 'search' | 'mapping';
  resultCount?: number;
}

class SearchHistoryService {
  private readonly STORAGE_KEY = 'namaste-search-history';
  private readonly MAX_HISTORY_ITEMS = 20;
  
  /**
   * Get all search history items
   */
  getHistory(type?: 'search' | 'mapping'): SearchHistoryItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const history: SearchHistoryItem[] = stored ? JSON.parse(stored) : [];
      
      if (type) {
        return history.filter(item => item.type === type);
      }
      
      return history.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to load search history:', error);
      return [];
    }
  }
  
  /**
   * Add a new search to history
   */
  addSearch(query: string, type: 'search' | 'mapping', resultCount?: number): void {
    try {
      if (!query.trim()) return;
      
      const history = this.getHistory();
      
      // Check if this exact query already exists recently
      const existingIndex = history.findIndex(
        item => item.query.toLowerCase() === query.toLowerCase() && item.type === type
      );
      
      if (existingIndex !== -1) {
        // Update existing item timestamp and move to top
        history[existingIndex].timestamp = Date.now();
        if (resultCount !== undefined) {
          history[existingIndex].resultCount = resultCount;
        }
      } else {
        // Add new item
        const newItem: SearchHistoryItem = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          query: query.trim(),
          timestamp: Date.now(),
          type,
          resultCount
        };
        
        history.unshift(newItem);
      }
      
      // Keep only the most recent items
      const trimmedHistory = history
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.MAX_HISTORY_ITEMS);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }
  
  /**
   * Remove a specific search from history
   */
  removeSearch(id: string): void {
    try {
      const history = this.getHistory();
      const updatedHistory = history.filter(item => item.id !== id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to remove search from history:', error);
    }
  }
  
  /**
   * Clear all search history
   */
  clearHistory(type?: 'search' | 'mapping'): void {
    try {
      if (type) {
        const history = this.getHistory();
        const filteredHistory = history.filter(item => item.type !== type);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredHistory));
      } else {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }
  
  /**
   * Get recent search suggestions based on partial query
   */
  getSuggestions(partialQuery: string, type: 'search' | 'mapping', limit: number = 5): SearchHistoryItem[] {
    try {
      if (!partialQuery.trim()) {
        return this.getHistory(type).slice(0, limit);
      }
      
      const history = this.getHistory(type);
      const lowerQuery = partialQuery.toLowerCase();
      
      return history
        .filter(item => item.query.toLowerCase().includes(lowerQuery))
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get search suggestions:', error);
      return [];
    }
  }
  
  /**
   * Get search statistics
   */
  getStats() {
    try {
      const history = this.getHistory();
      const searchHistory = history.filter(item => item.type === 'search');
      const mappingHistory = history.filter(item => item.type === 'mapping');
      
      return {
        total: history.length,
        searchCount: searchHistory.length,
        mappingCount: mappingHistory.length,
        mostRecentSearch: history[0]?.timestamp || 0,
        uniqueQueries: new Set(history.map(item => item.query.toLowerCase())).size
      };
    } catch (error) {
      console.error('Failed to get search stats:', error);
      return {
        total: 0,
        searchCount: 0,
        mappingCount: 0,
        mostRecentSearch: 0,
        uniqueQueries: 0
      };
    }
  }
}

export const searchHistoryService = new SearchHistoryService();