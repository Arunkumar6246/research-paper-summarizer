import { useState } from 'react';
import Modal from './modal';

function UploadDocument({ onUpload }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError("");
      } else {
        setFile(null);
        setError("Please select a PDF file");
        setShowModal(true);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (file) {
      setIsUploading(true);
      try {
        await onUpload(file);
      } finally {
        setIsUploading(false);
        setFile(null);
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="flex justify-center items-center w-full">
      <div className="w-full max-w-2xl p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Upload Research Paper</h2>
        
        {isUploading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-lg font-medium text-gray-700">Processing your paper...</p>
            <p className="text-sm text-gray-500 mt-2">
              We're extracting sections and generating summaries. This may take a minute.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <div className="relative inline-block">
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-blue-500 hover:text-blue-700"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                >
                  {file ? file.name : "Choose PDF file"}
                </label>
                {showTooltip && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap">
                    Only PDF files are accepted
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">or drag and drop here</p>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    Note: The system will automatically extract sections from your research paper and generate summaries for each section. Only PDF files are accepted.
                  </p>
                </div>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={!file}
              className={`w-full py-2 px-4 rounded-md ${
                file
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              } transition-colors`}
            >
              Upload Paper
            </button>
          </form>
        )}
      </div>

      <Modal 
        isOpen={showModal} 
        onClose={closeModal} 
        title="Invalid File"
      >
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={closeModal}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            OK
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default UploadDocument;
