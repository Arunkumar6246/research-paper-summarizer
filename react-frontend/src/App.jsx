import { useState, useEffect } from 'react';
import './assets/css/style.css';
import UploadDocument from './components/uploadDocument';
import PdfList from './components/pdfList';
import SummaryTable from './components/summaryTable';
import { API_URL } from './config';

function App() {
  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [summaries, setSummaries] = useState([]);
  const [notification, setNotification] = useState(null);

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

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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
        setPapers([...papers, newPaper]);
        setNotification({
          type: 'success',
          message: `Successfully uploaded ${file.name}`
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setNotification({
        type: 'error',
        message: 'Failed to upload file'
      });
    }
  };

  const handleSelectPaper = async (paper) => {
    setSelectedPaper(paper);
    
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
          <div className="mt-8">
            <SummaryTable 
              summaries={summaries} 
              paperId={selectedPaper.id}
            />
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-4 py-2 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}
    </div>
  );  
}

export default App;
