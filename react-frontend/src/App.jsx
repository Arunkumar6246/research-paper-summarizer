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
  const [streamingSections, setStreamingSections] = useState([]);
  const [streamingTokens, setStreamingTokens] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [isNewUpload, setIsNewUpload] = useState(false);
  const [processingPaperId, setProcessingPaperId] = useState(null);
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
        setIsNewUpload(true);
        setSummaries([]);
        setProcessingPaperId(newPaper.id);
        
        // Start streaming process for the new paper
        processNewPaper(newPaper);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      console.error('Failed to upload file');
    }
  };

  const processNewPaper = async (paper) => {
    setIsProcessing(true);
    setStreamingSections([]);
    setStreamingTokens('');
    setDisplayText('');
    
    try {
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
            
            if (update.token) {
              const filteredToken = filterStreamingToken(update.token);
              
              setStreamingTokens(prev => {
                const newTokens = prev + update.token;
                const sections = parseTokensToSections(newTokens);
                if (sections) {
                  setStreamingSections(prevSections => {
                    if (sections.length > prevSections.length) {
                      setDisplayText('');
                    }
                    return sections;
                  });
                }
                return newTokens;
              });
              
              if (filteredToken) {
                setDisplayText(prev => prev + filteredToken);
              }
              
            } else if (update.status === 'complete') {
              setIsProcessing(false);
              setIsNewUpload(false);
              setProcessingPaperId(null);
              // Fetch final summaries from database
              const summaryResponse = await fetch(`${API_URL}/summary/paper/${paper.id}`);
              if (summaryResponse.ok) {
                const data = await summaryResponse.json();
                setSummaries(data);
              }
              setStreamingSections([]);
              setStreamingTokens('');
              setDisplayText('');
              
            } else if (update.status === 'error') {
              setIsProcessing(false);
              setIsNewUpload(false);
              setProcessingPaperId(null);
              setStreamingSections([]);
              setStreamingTokens('');
              setDisplayText('');
            }
          } catch (e) {
            console.error('Error parsing update:', e);
          }
        }
      }
    } catch (error) {
      console.error('Error processing paper:', error);
      setIsProcessing(false);
      setIsNewUpload(false);
      setProcessingPaperId(null);
      setStreamingSections([]);
      setStreamingTokens('');
      setDisplayText('');
    }
  };

  const filterStreamingToken = (token) => {
    // Filter out JSON special characters and formatting
    const specialChars = ['{', '}', '[', ']', '"', ':', ',', '\n', '\t'];
    
    // Skip tokens containing json, page_no, Section Title
    const skipPatterns = ['json', 'page_no', 'Section Title', 'Summary'];
    if (skipPatterns.some(pattern => token.includes(pattern))) {
      return '';
    }
    
    // If token is only special characters, return empty string
    if (specialChars.some(char => token.includes(char)) && token.trim().length <= 3) {
      return '';
    }
    
    // Clean up the token but preserve meaningful text
    return token.replace(/[{}\[\]"]/g, '');
  };

  const parseTokensToSections = (tokens) => {
    try {
      // Use the same logic as extract_json_from_text from backend
      // Method 1: Extract from array brackets
      let jsonStart = tokens.indexOf('[');
      let jsonEnd = tokens.lastIndexOf(']');
      
      if (jsonStart >= 0 && jsonEnd > jsonStart) {
        try {
          const jsonStr = tokens.substring(jsonStart, jsonEnd + 1);
          const parsed = JSON.parse(jsonStr);
          return parsed.map(item => ({
            title: item['Section Title'] || '',
            summary: item['Summary'] || '',
            page: item['page_no'] || 1
          }));
        } catch (e) {
          // Continue to next method
        }
      }
      
      // Method 2: Extract partial objects using regex
      const titleMatches = tokens.match(/"Section Title"\s*:\s*"([^"]*)"/g);
      const summaryMatches = tokens.match(/"Summary"\s*:\s*"([^"]*)"/g);
      
      if (!titleMatches && !summaryMatches) return null;
      
      const titles = titleMatches ? titleMatches.map(match => {
        const result = match.match(/"([^"]*)"/g);
        return result ? result[1].replace(/"/g, '') : '';
      }) : [];
      
      const summaries = summaryMatches ? summaryMatches.map(match => {
        const result = match.match(/"([^"]*)"/g);
        return result ? result[1].replace(/"/g, '') : '';
      }) : [];
      
      const sections = [];
      const maxSections = Math.max(titles.length, summaries.length);
      
      for (let i = 0; i < maxSections; i++) {
        sections.push({
          title: titles[i] || '',
          summary: summaries[i] || '',
          page: 1
        });
      }
      
      return sections.length > 0 ? sections : null;
    } catch (e) {
      return null;
    }
  };

  const handleSelectPaper = async (paper) => {
    setSelectedPaper(paper);
    setIsNewUpload(false);
    
    // Skip fetching summaries if this paper is currently being processed
    if (processingPaperId === paper.id) {
      return;
    }
    
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
              streamingSections={streamingSections}
              displayText={displayText}
              isNewUpload={isNewUpload}
            />
          </div>
        )}
      </div>
    </div>
  );  
}

export default App;
