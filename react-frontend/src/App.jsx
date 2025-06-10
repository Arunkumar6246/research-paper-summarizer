import { useState, useEffect, useRef } from 'react';
import './assets/css/style.css';
import UploadDocument from './components/uploadDocument';
import PdfList from './components/pdfList';
import SummaryTable from './components/summaryTable';
import { API_URL } from './config';

function App() {
  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingMessage, setProcessingMessage] = useState('');
  const [isNewUpload, setIsNewUpload] = useState(false);
  const summaryTableRef = useRef(null);

  const fetchPapers = async () => {
    try {
      const response = await fetch(`${API_URL}/paper/get_all_papers`);
      if (response.ok) {
        const data = await response.json();
        setPapers(data);
        setSelectedPaper(null);
      }
    } catch (error) {
      console.error('Error fetching papers:', error);
    }
  };

  // Fetch papers on component mount
  useEffect(() => {
    fetchPapers();
  }, []);

  // Scroll to summary table when a new paper is uploaded
  useEffect(() => {
    if (isNewUpload && summaryTableRef.current) {
      setTimeout(() => {
        summaryTableRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    }
  }, [isNewUpload, selectedPaper]);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch(`${API_URL}/paper/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const newPaper = await response.json();
        const updatedPapers = [...papers, newPaper];
        setPapers(updatedPapers);
        setSelectedPaper(newPaper);
        setProcessingMessage(`Successfully uploaded ${file.name}`);
        setIsNewUpload(true); // Flag that this is a new upload
        setSummaries([]); // Clear any existing summaries
        
        // Start streaming process for the new paper
        processNewPaper(newPaper);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setProcessingMessage('Failed to upload file');
    }
  };

  const processNewPaper = async (paper) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    
    try {
      // Use fetch with streaming response
      const response = await fetch(`${API_URL}/paper/${paper.id}/process`);
      
      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        const lines = text.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const update = JSON.parse(line);
            
            if (update.status === 'saving' && update.section) {
              // Update progress
              setProcessingProgress(update.progress || 0);
              setProcessingMessage(`Processing: ${update.section.title}`);
              
              // Add with delay for visual effect
              setTimeout(() => {
                setSummaries(prev => [...prev, {
                  section_title: update.section.title,
                  summary_text: update.section.summary,
                  page: update.section.page
                }]);
              }, 2000); // Longer delay for better visual effect
              
              // Wait a bit before processing the next update to create visual spacing
              await new Promise(resolve => setTimeout(resolve, 500));
              
            } else if (update.status === 'complete') {
              setTimeout(() => {
                setIsProcessing(false);
                setProcessingMessage('Paper processing complete');
                setIsNewUpload(false); // Reset the new upload flag
              }, 2000);
            } else if (update.status === 'error') {
              setIsProcessing(false);
              setProcessingMessage(update.message || 'Error processing paper');
              setIsNewUpload(false);
            }
          } catch (e) {
            console.error('Error parsing update:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error processing paper:', error);
      setIsProcessing(false);
      setProcessingMessage('Failed to process paper');
      setIsNewUpload(false);
    }
  };

  const handleSelectPaper = async (paper) => {
    // Don't do anything if we're already processing this paper
    if (isProcessing && selectedPaper?.id === paper.id) {
      return;
    }
    
    setSelectedPaper(paper);
    setIsNewUpload(false);
    
    try {
      const response = await fetch(`${API_URL}/summary/paper/${paper.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setSummaries(data);
      }
    } catch (error) {
      console.error('Error fetching summaries:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 relative">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Research Paper Summarizer
        </h1>
        
        <UploadDocument onUpload={handleUpload} onUploadComplete={fetchPapers} />
        
        <PdfList 
          papers={papers} 
          onSelect={handleSelectPaper} 
          selectedPaper={selectedPaper} 
        />
        
        {selectedPaper && (
          <div className="mt-8" ref={summaryTableRef}>
            <SummaryTable 
              summaries={summaries} 
              paperId={selectedPaper.id}
              isProcessing={isProcessing}
              processingProgress={processingProgress}
              processingMessage={processingMessage}
              isNewUpload={isNewUpload}
            />
          </div>
        )}
      </div>
    </div>
  );  
}

export default App;
