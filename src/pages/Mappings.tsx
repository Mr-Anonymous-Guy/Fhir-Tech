import { useState, useEffect, useRef } from 'react';
import { enhancedFhirService } from '@/services/fhirServiceV2';
import { NAMASTEMapping } from '@/types/fhir';
import { searchHistoryService, SearchHistoryItem } from '@/services/searchHistoryService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Download, Search, Filter, Database, History, Clock, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FiltersType {
  category?: string;
  chapter?: string;
  search?: string;
}

const Mappings = () => {
  const { toast } = useToast();
  const [mappings, setMappings] = useState<NAMASTEMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FiltersType>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const pageSize = 20;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Initialize search history (starts empty for new users)
  useEffect(() => {
    const history = searchHistoryService.getHistory('mapping');
    setSearchHistory(history);
  }, []);

  useEffect(() => {
    loadMappings();
    loadMetadata();
  }, [page, filters]);

  // Handle clicks outside search history
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutsideHistory = historyRef.current &&
        !historyRef.current.contains(event.target as Node);
      const clickedOutsideInput = searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node);
      
      if (clickedOutsideInput && clickedOutsideHistory) {
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic search with debouncing
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        setFilters(prev => ({ ...prev, search: searchQuery }));
        setPage(1);
      }, 300);
      return () => clearTimeout(timer);
    } else if (searchQuery === '' && filters.search) {
      setFilters(prev => ({ ...prev, search: undefined }));
      setPage(1);
    }
  }, [searchQuery]);

  const loadMappings = async () => {
    setLoading(true);
    try {
      let response;
      if (filters.search) {
        // Use search API when there's a search query
        const searchResponse = await enhancedFhirService.lookup(filters.search, page, pageSize);
        response = {
          mappings: searchResponse.results.map(result => result.namaste),
          total: searchResponse.total
        };
      } else {
        // Use getAllMappings for filtering without search
        const filterParams = {
          category: filters.category,
          chapter: filters.chapter
        };
        response = await enhancedFhirService.getAllMappings(filterParams, page, pageSize);
      }
      setMappings(response.mappings);
      setTotal(response.total);
    } catch (error) {
      toast({
        title: 'Error Loading Mappings',
        description: 'Failed to load terminology mappings.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMetadata = async () => {
    try {
      const metadata = await enhancedFhirService.getMetadata();
      setCategories(metadata.categories);
      setChapters(metadata.chapters);
    } catch (error) {
      console.error('Failed to load metadata:', error);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Save search to history
      searchHistoryService.addSearch(searchQuery.trim(), 'mapping');
      
      // Refresh search history state
      const updatedHistory = searchHistoryService.getHistory('mapping');
      setSearchHistory(updatedHistory);
    }
    
    setFilters(prev => ({ ...prev, search: searchQuery }));
    setPage(1);
    setShowHistory(false);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setPage(1);
    setShowHistory(false);
  };

  const handleHistoryClick = (historyItem: SearchHistoryItem) => {
    setSearchQuery(historyItem.query);
    setShowHistory(false);
    setFilters(prev => ({ ...prev, search: historyItem.query }));
    setPage(1);
  };

  const handleRemoveFromHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    searchHistoryService.removeSearch(id);
    const updatedHistory = searchHistoryService.getHistory('mapping');
    setSearchHistory(updatedHistory);
  };

  const handleClearHistory = () => {
    searchHistoryService.clearHistory('mapping');
    setSearchHistory([]);
    toast({
      title: 'History Cleared',
      description: 'Search history has been cleared.',
      variant: 'default'
    });
  };

  const handleInputFocus = () => {
    if (!searchQuery.trim() && searchHistory.length > 0) {
      setShowHistory(true);
    }
  };

  const downloadMappings = () => {
    const csvHeader = 'namaste_code,namaste_term,category,chapter_name,icd11_tm2_code,icd11_tm2_description,icd11_biomedicine_code,confidence_score\n';
    const csvData = mappings.map(mapping => 
      `${mapping.namaste_code},${mapping.namaste_term},${mapping.category},${mapping.chapter_name},${mapping.icd11_tm2_code},${mapping.icd11_tm2_description},${mapping.icd11_biomedicine_code},${mapping.confidence_score}`
    ).join('\n');
    
    const blob = new Blob([csvHeader + csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'namaste_icd11_mappings.csv';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Download Started',
      description: 'Mappings are being downloaded as CSV.',
      variant: 'default'
    });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">All Mappings</h1>
          <p className="text-muted-foreground mt-2">
            Browse complete NAMASTE to ICD-11 terminology database
          </p>
        </div>
        <Button onClick={downloadMappings} variant="success">
          <Download className="w-4 h-4 mr-2" />
          Download CSV
        </Button>
      </div>

      {/* Filters Card */}
      <Card className="shadow-medical">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filters & Search
          </CardTitle>
          <CardDescription>
            Filter mappings by category, chapter, or search terms
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      ref={searchInputRef}
                      placeholder="Search terms..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      onFocus={handleInputFocus}
                      className="pr-10"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    {searchQuery && (
                      <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
                        <div className="animate-pulse h-2 w-2 bg-primary rounded-full" />
                      </div>
                    )}
                  </div>
                  <Button onClick={handleSearch} size="sm">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Search History Dropdown */}
                {showHistory && searchHistory.length > 0 && (
                  <div
                    ref={historyRef}
                    className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-glow z-50 max-h-60 overflow-y-auto"
                  >
                    <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                      <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Recent Searches</span>
                      </div>
                      {searchHistory.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearHistory}
                          className="text-xs h-6 px-2"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                    {searchHistory.map((historyItem) => (
                      <div
                        key={historyItem.id}
                        className="p-3 hover:bg-accent cursor-pointer border-b border-border last:border-0 group"
                        onClick={() => handleHistoryClick(historyItem)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{historyItem.query}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(historyItem.timestamp).toLocaleDateString()}
                                {historyItem.resultCount !== undefined && (
                                  <> • {historyItem.resultCount} results</>
                                )}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleRemoveFromHistory(e, historyItem.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-md bg-card/95 border border-border/50 shadow-2xl">
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Chapter</label>
              <Select onValueChange={(value) => handleFilterChange('chapter', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Chapters" />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-md bg-card/95 border border-border/50 shadow-2xl">
                  <SelectItem value="all">All Chapters</SelectItem>
                  {chapters.map(chapter => (
                    <SelectItem key={chapter} value={chapter}>
                      {chapter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <Button onClick={clearFilters} variant="outline" className="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Terminology Mappings
            </div>
            <Badge variant="outline">
              {filters.search ? `${total} search results` : `${total} total mappings`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading mappings..." />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NAMASTE Term</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Chapter</TableHead>
                      <TableHead>ICD-11 TM2</TableHead>
                      <TableHead>ICD-11 Bio</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings.map((mapping, index) => (
                      <TableRow key={index} className="hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {mapping.namaste_term}
                        </TableCell>
                        <TableCell>
                          <code className="bg-primary/10 px-2 py-1 rounded text-xs">
                            {mapping.namaste_code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{mapping.category}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {mapping.chapter_name}
                        </TableCell>
                        <TableCell>
                          <code className="bg-accent/10 px-2 py-1 rounded text-xs">
                            {mapping.icd11_tm2_code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <code className="bg-secondary/50 px-2 py-1 rounded text-xs">
                            {mapping.icd11_biomedicine_code}
                          </code>
                        </TableCell>
                        <TableCell>
                          <span className={`font-medium ${getConfidenceColor(mapping.confidence_score)}`}>
                            {(mapping.confidence_score * 100).toFixed(1)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} mappings
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Mappings;