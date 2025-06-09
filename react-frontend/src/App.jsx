import { useState, useEffect } from 'react';
import './assets/css/style.css';
import UploadDocument from './components/uploadDocument';
import PdfList from './components/pdfList';
import SummaryTable from './components/summaryTable';

function App() {
  const [papers, setPapers] = useState([]);
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [summaries, setSummaries] = useState([]);

  // Fetch papers on component mount
  useEffect(() => {
    const fetchPapers = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/paper/get_all_papers');
        if (response.ok) {
          const data = await response.json();
          setPapers(data);
        }
      } catch (error) {
        console.error('Error fetching papers:', error);
      }
    };

    fetchPapers();
  }, []);

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await fetch('http://localhost:8000/api/paper/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const newPaper = await response.json();
        setPapers([...papers, newPaper]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleSelectPaper = async (paper) => {
    setSelectedPaper(paper);
    
    try {
      const response = await fetch(`http://localhost:8000/api/summary/paper/${paper.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setSummaries(data);
      }
    } catch (error) {
      console.error('Error fetching summaries:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          Research Paper Summarizer
        </h1>
        
        <UploadDocument onUpload={handleUpload} />
        
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
    </div>
  );
}

export default App;
