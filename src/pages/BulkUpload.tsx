import { useState, useCallback } from 'react';
import { enhancedFhirService } from '@/services/fhirServiceV2';
import { NAMASTEMapping } from '@/types/fhir';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Upload, Download, FileCode, AlertCircle, CheckCircle, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const BulkUpload = () => {
  const { toast } = useToast();
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedMappings, setParsedMappings] = useState<NAMASTEMapping[]>([]);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a CSV file.',
        variant: 'destructive'
      });
      return;
    }

    setUploadedFile(file);
    setProcessing(true);
    setErrors([]);
    setParsedMappings([]);
    setDownloadUrl(null);

    try {
      const text = await file.text();
      const lines = text.split('\n');
      const header = lines[0];
      
      // Validate header
      const expectedHeader = 'namaste_code,namaste_term,category,chapter_name,icd11_tm2_code,icd11_tm2_description,icd11_biomedicine_code,confidence_score';
      if (header.trim().toLowerCase() !== expectedHeader.toLowerCase()) {
        throw new Error('Invalid CSV format.\nExpected header: ' + expectedHeader + '\nActual header: ' + header);
      }

      const mappings: NAMASTEMapping[] = [];
      const validationErrors: string[] = [];

      lines.slice(1).forEach((line, index) => {
        if (!line.trim()) return;
        
        const lineNumber = index + 2; // +2 because we skip header and 0-index
        const fields = line.split(',').map(field => field.trim().replace(/^"|"$/g, ''));
        
        if (fields.length < 8) {
          validationErrors.push(`Line ${lineNumber}: Missing required fields. Expected 8 fields, got ${fields.length}`);
          return;
        }

        const [namaste_code, namaste_term, category, chapter_name, icd11_tm2_code, icd11_tm2_description, icd11_biomedicine_code, confidence_score] = fields;

        // Validation
        if (!namaste_code) {
          validationErrors.push(`Line ${lineNumber}: Missing NAMASTE code`);
          return;
        }
        if (!['Ayurveda', 'Siddha', 'Unani'].includes(category)) {
          validationErrors.push(`Line ${lineNumber}: Invalid category. Must be Ayurveda, Siddha, or Unani`);
          return;
        }
        const confidenceNum = parseFloat(confidence_score);
        if (isNaN(confidenceNum) || confidenceNum < 0 || confidenceNum > 1) {
          validationErrors.push(`Line ${lineNumber}: Invalid confidence score. Must be between 0 and 1`);
          return;
        }

        mappings.push({
          namaste_code,
          namaste_term,
          category: category as 'Ayurveda' | 'Siddha' | 'Unani',
          chapter_name,
          icd11_tm2_code,
          icd11_tm2_description,
          icd11_biomedicine_code,
          confidence_score: confidenceNum
        });
      });

      setErrors(validationErrors);
      setParsedMappings(mappings);

      if (validationErrors.length === 0 && mappings.length > 0) {
        toast({
          title: 'File Parsed Successfully',
          description: `${mappings.length} mappings ready for processing.`,
          variant: 'default'
        });
      } else if (validationErrors.length > 0) {
        toast({
          title: 'Validation Errors Found',
          description: `${validationErrors.length} errors found in uploaded file.`,
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'File Processing Error',
        description: error instanceof Error ? error.message : 'Failed to process file.',
        variant: 'destructive'
      });
      setErrors(['Failed to parse CSV file. Please check the format.']);
    } finally {
      setProcessing(false);
    }
  };

  const generateFHIRBundle = async () => {
    if (parsedMappings.length === 0) return;

    setProcessing(true);
    try {
      const result = await enhancedFhirService.processBulkUpload(parsedMappings);
      setDownloadUrl(result.downloadUrl);
      
      toast({
        title: 'FHIR Bundle Generated',
        description: `Successfully generated FHIR bundle for ${parsedMappings.length} mappings.`,
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: 'Generation Failed',
        description: 'Failed to generate FHIR bundle.',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const downloadBundle = () => {
    if (downloadUrl) {
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `fhir-bundle-${Date.now()}.json`;
      a.click();
    }
  };

  const reset = () => {
    setUploadedFile(null);
    setParsedMappings([]);
    setErrors([]);
    setDownloadUrl(null);
    setDragActive(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Bulk Upload</h1>
        <p className="text-muted-foreground mt-2">
          Upload CSV files to process multiple NAMASTE mappings and generate FHIR bundles
        </p>
      </div>

      {/* Upload Area */}
      {!uploadedFile && (
        <Card className="shadow-medical">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" />
              CSV File Upload
            </CardTitle>
            <CardDescription>
              Upload a CSV file with NAMASTE to ICD-11 mappings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className={`w-16 h-16 mx-auto mb-4 ${dragActive ? 'text-primary' : 'text-muted-foreground'}`} />
              <h3 className="text-lg font-semibold mb-2">
                {dragActive ? 'Drop your CSV file here' : 'Drag & drop CSV file'}
              </h3>
              <p className="text-muted-foreground mb-6">
                or click to browse and select a file
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileInput}
                className="hidden"
                id="csv-upload"
              />
              <Button asChild variant="medical">
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <File className="w-4 h-4 mr-2" />
                  Select CSV File
                </label>
              </Button>
            </div>

            <Alert className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Required CSV format:</strong><br />
                namaste_code,namaste_term,category,chapter_name,icd11_tm2_code,icd11_tm2_description,icd11_biomedicine_code,confidence_score<br />
                <br />
                <strong>Category must be:</strong> Ayurveda, Siddha, or Unani<br />
                <strong>Confidence score:</strong> Decimal between 0.0 and 1.0
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {processing && (
        <Card className="shadow-card">
          <CardContent className="py-12">
            <div className="text-center">
              <LoadingSpinner size="lg" text="Processing CSV file..." />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Errors */}
      {errors.length > 0 && (
        <Card className="shadow-card border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Validation Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {errors.map((error, index) => (
                <div key={index} className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                  {error}
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={reset} variant="outline">
                Upload Different File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parsed Results */}
      {parsedMappings.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Parsed Mappings
              </div>
              <Badge variant="outline">
                {parsedMappings.length} mappings
              </Badge>
            </CardTitle>
            <CardDescription>
              Review the parsed mappings before generating FHIR bundle
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={generateFHIRBundle} variant="fhir" disabled={processing}>
                <FileCode className="w-4 h-4 mr-2" />
                Generate FHIR Bundle
              </Button>
              <Button onClick={reset} variant="outline">
                Reset
              </Button>
            </div>

            <div className="rounded-md border max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NAMASTE Code</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Chapter</TableHead>
                    <TableHead>Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedMappings.slice(0, 10).map((mapping, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <code className="bg-primary/10 px-2 py-1 rounded text-xs">
                          {mapping.namaste_code}
                        </code>
                      </TableCell>
                      <TableCell className="font-medium">
                        {mapping.namaste_term}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{mapping.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {mapping.chapter_name}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {(mapping.confidence_score * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedMappings.length > 10 && (
                <div className="p-4 text-center text-sm text-muted-foreground border-t">
                  ... and {parsedMappings.length - 10} more mappings
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Download Section */}
      {downloadUrl && (
        <Card className="shadow-card border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              FHIR Bundle Ready
            </CardTitle>
            <CardDescription>
              Your FHIR bundle has been generated successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Generated FHIR R4-compliant bundle with {parsedMappings.length} Condition resources.
                Each resource includes dual coding with NAMASTE and ICD-11 mappings.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Button onClick={downloadBundle} variant="success">
                <Download className="w-4 h-4 mr-2" />
                Download FHIR Bundle
              </Button>
              <Button onClick={reset} variant="outline">
                Process Another File
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkUpload;