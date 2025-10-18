import { useState, useEffect, useRef } from 'react';
import { enhancedFhirService } from '@/services/fhirServiceV2';
import { NAMASTEMapping, SearchResult } from '@/types/fhir';
import { searchHistoryService, SearchHistoryItem } from '@/services/searchHistoryService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Search as SearchIcon, FileCode, Send, Copy, CheckCircle, AlertCircle, History, Clock, X, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Search = () => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<NAMASTEMapping | null>(null);
  const [showFHIRModal, setShowFHIRModal] = useState(false);
  const [fhirResource, setFhirResource] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  // Initialize search history (starts empty for new users)
  useEffect(() => {
    const loadSearchHistory = () => {
      // For new users, this will return an empty array
      const history = searchHistoryService.getHistory('search');
      setSearchHistory(history);
    };
    
    loadSearchHistory();
  }, []);

  // Debounced search for suggestions and history
  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(async () => {
        try {
          // Get search suggestions from FHIR service
          const response = await enhancedFhirService.lookup(query, 1, 5);
          setSuggestions(response.results);
          setShowSuggestions(true);
          setShowHistory(false);
        } catch (error) {
          console.error('Suggestion search failed:', error);
        }
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      // Show search history when input is empty but focused
      if (document.activeElement === searchInputRef.current) {
        setShowHistory(true);
      }
    }
  }, [query]);

  // Handle clicks outside suggestions and history
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickedOutsideSuggestions = suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node);
      const clickedOutsideHistory = historyRef.current &&
        !historyRef.current.contains(event.target as Node);
      const clickedOutsideInput = searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node);
      
      if (clickedOutsideInput) {
        if (clickedOutsideSuggestions) {
          setShowSuggestions(false);
        }
        if (clickedOutsideHistory) {
          setShowHistory(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (searchQuery?: string) => {
    const searchTerm = searchQuery || query;
    if (!searchTerm.trim()) return;

    setLoading(true);
    setShowSuggestions(false);
    setShowHistory(false);
    
    try {
      const response = await enhancedFhirService.lookup(searchTerm);
      setResults(response.results);
      
      // Save successful search to history
      searchHistoryService.addSearch(searchTerm, 'search', response.results.length);
      
      // Refresh search history state
      const updatedHistory = searchHistoryService.getHistory('search');
      setSearchHistory(updatedHistory);
      
      if (response.results.length === 0) {
        toast({
          title: 'No Results Found',
          description: 'Try different search terms or browse all mappings.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Search Failed',
        description: 'Unable to perform search. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchResult) => {
    setQuery(suggestion.namaste.namaste_term);
    setShowSuggestions(false);
    handleSearch(suggestion.namaste.namaste_term);
  };

  const handleHistoryClick = (historyItem: SearchHistoryItem) => {
    setQuery(historyItem.query);
    setShowHistory(false);
    handleSearch(historyItem.query);
  };

  const handleRemoveFromHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    searchHistoryService.removeSearch(id);
    const updatedHistory = searchHistoryService.getHistory('search');
    setSearchHistory(updatedHistory);
  };

  const handleClearHistory = () => {
    searchHistoryService.clearHistory('search');
    setSearchHistory([]);
    toast({
      title: 'History Cleared',
      description: 'Search history has been cleared.',
      variant: 'default'
    });
  };

  const handleInputFocus = () => {
    if (query.length < 2 && searchHistory.length > 0) {
      setShowHistory(true);
    }
  };

  const generateFHIR = (mapping: NAMASTEMapping) => {
    const condition = {
      resourceType: 'Condition',
      id: mapping.namaste_code,
      meta: {
        profile: ['http://terminology.gov.in/StructureDefinition/NAMASTECondition'],
        lastUpdated: new Date().toISOString()
      },
      identifier: [
        {
          system: 'http://terminology.gov.in/namaste',
          value: mapping.namaste_code
        }
      ],
      clinicalStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
            code: 'active',
            display: 'Active'
          }
        ]
      },
      verificationStatus: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
            code: 'confirmed',
            display: 'Confirmed'
          }
        ]
      },
      category: [
        {
          coding: [
            {
              system: 'http://terminology.gov.in/CodeSystem/condition-category',
              code: mapping.category.toLowerCase(),
              display: mapping.category
            },
            {
              system: 'http://snomed.info/sct',
              code: '439401001',
              display: 'Diagnosis'
            }
          ]
        }
      ],
      code: {
        coding: [
          {
            system: 'http://terminology.gov.in/CodeSystem/namaste',
            version: '1.0.0',
            code: mapping.namaste_code,
            display: mapping.namaste_term,
            userSelected: true
          },
          {
            system: 'http://id.who.int/icd/release/11/2022-02/tm2',
            code: mapping.icd11_tm2_code,
            display: mapping.icd11_tm2_description
          },
          {
            system: 'http://id.who.int/icd/release/11/2022-02/biomedicine',
            code: mapping.icd11_biomedicine_code,
            display: mapping.icd11_tm2_description
          }
        ],
        text: mapping.namaste_term
      },
      subject: {
        reference: 'Patient/demo-patient-123',
        display: 'Demo Patient'
      },
      encounter: {
        reference: 'Encounter/demo-encounter-456'
      },
      recordedDate: new Date().toISOString(),
      recorder: {
        reference: 'Practitioner/demo-practitioner-789',
        display: 'Dr. Priya Sharma'
      },
      note: [
        {
          text: `Traditional ${mapping.category} diagnosis mapped to ICD-11 with ${(mapping.confidence_score * 100).toFixed(1)}% confidence`,
          time: new Date().toISOString()
        }
      ]
    };

    setFhirResource(condition);
    setShowFHIRModal(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'FHIR resource copied to clipboard.',
      variant: 'default'
    });
  };

  const sendToEMR = (mapping: NAMASTEMapping) => {
    // Mock EMR integration
    toast({
      title: 'Sent to EMR',
      description: `${mapping.namaste_term} mapping sent to Electronic Medical Record system.`,
      variant: 'default'
    });
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return 'text-success';
    if (score >= 0.7) return 'text-warning';
    return 'text-destructive';
  };

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.9) return 'success';
    if (score >= 0.7) return 'warning';
    return 'destructive';
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Search & Map Terms
        </h1>
        <p className="text-muted-foreground">
          Find NAMASTE traditional medicine terms and their ICD-11 mappings
        </p>
      </div>

      {/* Search Input */}
      <Card className="shadow-medical">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchIcon className="w-5 h-5 text-primary" />
            FHIR Terminology Lookup
          </CardTitle>
          <CardDescription>
            Search for traditional medicine terms, NAMASTE codes, or conditions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  ref={searchInputRef}
                  placeholder="Search for 'kasa', 'respiratory', 'NAM001', or any condition..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={handleInputFocus}
                  className="pr-10"
                  disabled={loading}
                />
                <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Button 
                onClick={() => handleSearch()} 
                disabled={loading || !query.trim()}
                variant="medical"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Search'}
              </Button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-glow z-50 max-h-60 overflow-y-auto"
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-accent cursor-pointer border-b border-border last:border-0"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">
                          {suggestion.highlights?.term ? (
                            <span dangerouslySetInnerHTML={{ __html: suggestion.highlights.term }} />
                          ) : (
                            suggestion.namaste.namaste_term
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {suggestion.namaste.namaste_code} • {suggestion.namaste.category}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {(suggestion.namaste.confidence_score * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
        </CardContent>
      </Card>

      {/* Search Results */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Searching terminology database..." />
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Search Results ({results.length})
          </h2>
          
          <div className="grid gap-4">
            {results.map((result, index) => (
              <Card key={index} className="shadow-card hover:shadow-medical transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {result.highlights?.term ? (
                          <span dangerouslySetInnerHTML={{ __html: result.highlights.term }} />
                        ) : (
                          result.namaste.namaste_term
                        )}
                        <Badge variant="outline">{result.namaste.namaste_code}</Badge>
                      </CardTitle>
                      <CardDescription className="mt-2">
                        <Badge className="mr-2">{result.namaste.category}</Badge>
                        <span>{result.namaste.chapter_name}</span>
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={result.namaste.confidence_score >= 0.9 ? 'default' : result.namaste.confidence_score >= 0.7 ? 'outline' : 'destructive'}
                      className="ml-4"
                    >
                      {(result.namaste.confidence_score * 100).toFixed(1)}% confidence
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* ICD-11 Mappings */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-secondary/30 rounded-lg">
                      <h4 className="font-medium text-sm text-primary mb-2">ICD-11 TM2 Mapping</h4>
                      <p className="text-sm">
                        <code className="bg-primary/10 px-2 py-1 rounded text-xs">
                          {result.namaste.icd11_tm2_code}
                        </code>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.namaste.icd11_tm2_description}
                      </p>
                    </div>
                    
                    <div className="p-3 bg-accent/10 rounded-lg">
                      <h4 className="font-medium text-sm text-primary mb-2">ICD-11 Biomedicine</h4>
                      <p className="text-sm">
                        <code className="bg-accent/20 px-2 py-1 rounded text-xs">
                          {result.namaste.icd11_biomedicine_code}
                        </code>
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Biomedical equivalent mapping
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="fhir"
                      size="sm"
                      onClick={() => {
                        setSelectedMapping(result.namaste);
                        generateFHIR(result.namaste);
                      }}
                    >
                      <FileCode className="w-4 h-4 mr-2" />
                      Generate FHIR
                    </Button>
                    
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => sendToEMR(result.namaste)}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send to EMR
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && query && results.length === 0 && (
        <Card className="shadow-card">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground mb-4">
              No mappings found for "{query}". Try different search terms or check the complete mappings list.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setQuery('')}>
                Clear Search
              </Button>
              <Button asChild variant="default">
                <a href="/mappings">Browse All Mappings</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FHIR Resource Modal */}
      <Dialog open={showFHIRModal} onOpenChange={setShowFHIRModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-primary" />
              FHIR R4 Condition Resource
            </DialogTitle>
            <DialogDescription>
              Generated FHIR Condition resource for {selectedMapping?.namaste_term}
            </DialogDescription>
          </DialogHeader>
          
          {fhirResource && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(fhirResource, null, 2))}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy JSON
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => {
                    setShowFHIRModal(false);
                    sendToEMR(selectedMapping!);
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send to EMR
                </Button>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(fhirResource, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Search;