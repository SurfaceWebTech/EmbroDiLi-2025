import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { Upload, AlertCircle, CheckCircle, Database, Trash2, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';

export default function ImportDocuments() {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ processed: 0, successful: 0, failed: 0 });
  const [chunks, setChunks] = useState([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [fileSelected, setFileSelected] = useState(false);
  const fileData = useRef(null);
  const navigate = useNavigate();

  const CHUNK_SIZE = 2000; // Process 2000 rows at a time

  const truncateDocuments = async () => {
    try {
      const { error } = await supabase.rpc('truncate_documents');
      
      if (error) {
        console.error('Error truncating documents:', error);
        toast.error('Failed to clear documents table');
        return false;
      }
      
      toast.success('Documents table cleared successfully');
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred while clearing the table');
      return false;
    }
  };

  const validateRow = (row) => {
    const requiredFields = [
      'id',
      'category_id',
      'subcategory_id',
      'design_no',
      'description',
      'extension',
      'file_type',
      'total_area',
      'duration_min',
      'total_switches',
      'colours',
      'width',
      'height',
      'stabilizer_required',
      'design_options',
      'design_information',
      'confidential',
      'transfer'
    ];

    const missingFields = requiredFields.filter(field => !row[field]);
    if (missingFields.length > 0) {
      console.warn(`Missing required fields for row: ${missingFields.join(', ')}`);
      return false;
    }

    return true;
  };

  const cleanNumeric = (value, defaultValue = 0) => {
    if (!value || value === '') return defaultValue;
    const cleaned = value.toString().replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? defaultValue : num;
  };

  const processChunk = async (chunk) => {
    const documents = chunk.map(row => {
      try {
        if (!validateRow(row)) {
          return null;
        }

        return {
          id: parseInt(row.id || 0),
          category_id: parseInt(row.category_id || 1),
          subcategory_id: parseInt(row.subcategory_id || 1),
          design_no: row.design_no?.trim(),
          description: row.description?.trim() || '',
          extension: row.extension?.trim() || '',
          file_type: row.file_type?.trim() || '',
          total_area: cleanNumeric(row.total_area),
          duration_min: cleanNumeric(row.duration_min),
          total_switches: parseInt(row.total_switches) || 0,
          colours: parseInt(row.colours) || 0,
          width: cleanNumeric(row.width),
          height: cleanNumeric(row.height),
          stabilizer_required: row.stabilizer_required?.trim() || '',
          design_options: row.design_options?.trim() || '',
          design_information: row.design_information?.trim() || '',
          confidential: row.confidential?.trim() || '',
          transfer: row.transfer?.trim() || ''
        };
      } catch (error) {
        console.error('Error processing row:', error, row);
        return null;
      }
    }).filter(doc => doc !== null);

    return documents;
  };

  const insertBatch = async (documents) => {
    try {
      const batchSize = 500;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        console.log('Upserting batch:', batch[0]); // Debug log

        const { error } = await supabase
          .from('documents')
          .upsert(batch, {
            onConflict: 'design_no',
            ignoreDuplicates: false
          })
          .select();

        if (error) {
          console.error('Batch upsert error:', error);
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('Upsert error:', error);
      return false;
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setFileSelected(true);
    setProgress(0);
    setStats({ processed: 0, successful: 0, failed: 0 });
    setChunks([]);
    setCurrentChunkIndex(0);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim(),
      preview: 1, // First check the headers
      complete: (results) => {
        // Verify column names
        const expectedColumns = [
          'id', 'category_id', 'subcategory_id', 'design_no', 'description',
          'extension', 'file_type', 'total_area', 'duration_min', 'total_switches',
          'colours', 'width', 'height', 'stabilizer_required', 'design_options',
          'design_information', 'confidential', 'transfer'
        ];

        const missingColumns = expectedColumns.filter(col => 
          !results.meta.fields.includes(col)
        );

        if (missingColumns.length > 0) {
          toast.error(`Missing columns: ${missingColumns.join(', ')}`);
          setFileSelected(false);
          return;
        }

        // If headers are correct, parse the full file
        Papa.parse(file, {
          header: true,
          skipEmptyLines: 'greedy',
          transformHeader: (header) => header.trim(),
          complete: (fullResults) => {
            const { data } = fullResults;
            
            // Split data into chunks
            const totalChunks = Math.ceil(data.length / CHUNK_SIZE);
            const newChunks = Array.from({ length: totalChunks }, (_, i) => {
              const start = i * CHUNK_SIZE;
              return data.slice(start, start + CHUNK_SIZE);
            });

            setChunks(newChunks);
            fileData.current = {
              totalRows: data.length,
              chunks: newChunks
            };

            toast.success(`File loaded: ${data.length} rows split into ${newChunks.length} chunks`);
          },
          error: (error) => {
            console.error('Parse error:', error);
            toast.error('Error parsing CSV file');
          }
        });
      },
      error: (error) => {
        console.error('Parse error:', error);
        toast.error('Error parsing CSV file');
      }
    });
  };

  const processNextChunk = async () => {
    if (!fileData.current || currentChunkIndex >= chunks.length) {
      return;
    }

    setImporting(true);
    const chunk = chunks[currentChunkIndex];

    try {
      const processedDocuments = await processChunk(chunk);
      
      if (processedDocuments.length > 0) {
        const success = await insertBatch(processedDocuments);
        if (success) {
          setStats(prev => ({
            ...prev,
            successful: prev.successful + processedDocuments.length
          }));
          toast.success(`Chunk ${currentChunkIndex + 1} imported successfully`);
        } else {
          setStats(prev => ({
            ...prev,
            failed: prev.failed + chunk.length
          }));
          toast.error(`Failed to import chunk ${currentChunkIndex + 1}`);
        }
      }

      setStats(prev => ({
        ...prev,
        processed: prev.processed + chunk.length
      }));

      const newProgress = ((currentChunkIndex + 1) / chunks.length) * 100;
      setProgress(Math.min(100, Math.round(newProgress)));
      
      setCurrentChunkIndex(prev => prev + 1);
      
      if (currentChunkIndex + 1 >= chunks.length) {
        toast.success('All chunks processed successfully!');
        setTimeout(() => navigate('/admin'), 2000);
      }
    } catch (error) {
      console.error('Error processing chunk:', error);
      toast.error(`Error processing chunk ${currentChunkIndex + 1}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Import Documents</h1>

        <div className="space-y-4">
          {/* Database Actions */}
          <div className="flex justify-end space-x-4 mb-6">
            <button
              onClick={truncateDocuments}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              disabled={importing}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Documents Table
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">CSV File Requirements</h3>
                <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
                  <li>File must be in CSV format</li>
                  <li>Column names must match exactly (case-sensitive)</li>
                  <li>All columns are required</li>
                  <li>Duplicate design numbers will update existing records</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Table Structure */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start">
              <Database className="w-5 h-5 text-gray-400 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-gray-800">Required CSV Columns</h3>
                <div className="mt-2 text-sm text-gray-600">
                  <ul className="list-disc list-inside pl-4 space-y-1">
                    <li>id (integer)</li>
                    <li>category_id (integer)</li>
                    <li>subcategory_id (integer)</li>
                    <li>design_no (text, unique)</li>
                    <li>description (text)</li>
                    <li>extension (text)</li>
                    <li>file_type (text)</li>
                    <li>total_area (numeric)</li>
                    <li>duration_min (numeric)</li>
                    <li>total_switches (integer)</li>
                    <li>colours (integer)</li>
                    <li>width (numeric)</li>
                    <li>height (numeric)</li>
                    <li>stabilizer_required (text)</li>
                    <li>design_options (text)</li>
                    <li>design_information (text)</li>
                    <li>confidential (text)</li>
                    <li>transfer (text)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Select a CSV file
                  </span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={handleFileSelect}
                    disabled={importing}
                  />
                </label>
              </div>
              <p className="mt-1 text-xs text-gray-500">CSV files only</p>
            </div>
          </div>

          {/* Chunk Processing */}
          {fileSelected && chunks.length > 0 && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Chunk {currentChunkIndex + 1} of {chunks.length}
                </span>
                <button
                  onClick={processNextChunk}
                  disabled={importing || currentChunkIndex >= chunks.length}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-dark disabled:opacity-50"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Process Next Chunk
                </button>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="text-sm text-gray-600">
                <div>Processed: {stats.processed} rows</div>
                <div>Successful: {stats.successful} rows</div>
                {stats.failed > 0 && <div className="text-red-600">Failed: {stats.failed} rows</div>}
              </div>
            </div>
          )}

          {/* Success Message */}
          {progress === 100 && !importing && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Import completed
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Redirecting to dashboard...</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}