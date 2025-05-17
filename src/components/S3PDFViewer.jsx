import { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Configure the worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const S3PDFViewer = ({ s3Url, scale = 1.5, pageNumber = 1, onLoadSuccess = () => {} }) => {
  const containerRef = useRef(null);
  const [isMounted, setIsMounted] = useState(true);
  const [currentPage, setCurrentPage] = useState(pageNumber);
  const [totalPages, setTotalPages] = useState(0);
  const [error, setError] = useState('');
  const [pdfDoc, setPdfDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  const sanitizeS3Url = (url) => {
    if (!url) return '';
    return url
      .replace(/ /g, '+')  // Convert spaces to +
      .replace(/'/g, '%27') // Escape apostrophes
      .replace(/\(/g, '%28') // Escape parentheses
      .replace(/\)/g, '%29');
  };

  // Handle PDF loading
  useEffect(() => {
    setIsMounted(true);
    let pdfInstance = null;
    const abortController = new AbortController();
    
    const loadPDF = async () => {
      try {
        setLoading(true);
        setError('');
        
        if (!s3Url) {
          setError('No PDF URL provided');
          setLoading(false);
          return;
        }

        const cleanedUrl = sanitizeS3Url(s3Url);
        
        const loadingTask = pdfjsLib.getDocument({
          url: cleanedUrl,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/'
        });

        // Check if the operation was aborted
        if (abortController.signal.aborted) {
          return;
        }

        pdfInstance = await loadingTask.promise;
        
        if (!isMounted || abortController.signal.aborted) {
          if (pdfInstance) {
            pdfInstance.destroy();
          }
          return;
        }
        
        setPdfDoc(pdfInstance);
        setTotalPages(pdfInstance.numPages);
        setCurrentPage(pageNumber);
        
        onLoadSuccess({
          numPages: pdfInstance.numPages,
          currentPage: pageNumber
        });
      } catch (err) {
        if (isMounted && !abortController.signal.aborted) {
          // Only show errors that aren't related to cancellation
          if (err.name !== 'AbortException' && err.message !== 'The user aborted a request.') {
            setError(`PDF Error: ${err.message}`);
            console.error('PDF Loading Failed:', {
              url: s3Url,
              error: err
            });
          }
        }
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadPDF();

    // Cleanup function
    return () => {
      abortController.abort();
      setIsMounted(false);
      
      // Destroy the PDF document
      if (pdfInstance) {
        try {
          pdfInstance.destroy();
        } catch (e) {
          // Ignore destruction errors during cleanup
        }
      }
    };
  }, [s3Url, pageNumber, onLoadSuccess]);

  return (
    <div className="s3-pdf-viewer h-full" ref={containerRef}>
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
      
      {error && (
        <div className="error-banner px-4 py-3 bg-red-100 text-red-800 rounded-md my-4">
          {error}
        </div>
      )}
      
      <div className="h-full pdf-iframe-container">
        <iframe 
          src={s3Url} 
          className="w-full h-full border-0"
          title="PDF Viewer"
        />
      </div>
    </div>
  );
};

export default S3PDFViewer;