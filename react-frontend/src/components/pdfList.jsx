import { useEffect, useState } from 'react';

function PdfList({ papers, onSelect, selectedPaper }) {
  const [hoveredPaper, setHoveredPaper] = useState(null);

  // Auto-select first paper if papers exist and none is selected
  useEffect(() => {
    if (papers.length > 0 && !selectedPaper) {
      onSelect(papers[0]);
    }
  }, [papers, onSelect, selectedPaper]);

  // Format filename to show truncated version with extension
  const formatFilename = (filename) => {
    if (filename.length <= 15) return filename;
    
    const extension = filename.split('.').pop();
    const name = filename.substring(0, filename.length - extension.length - 1);
    return `${name.substring(0, 10)}...${extension}`;
  };

  // Format date to a readable string
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="w-full mt-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Uploaded Papers</h2>
      <div className="flex overflow-x-auto pb-4 space-x-4">
        {papers.length > 0 ? (
          papers.map((paper) => (
            <div
              key={paper.id}
              onClick={() => onSelect(paper)}
              onMouseEnter={() => setHoveredPaper(paper.id)}
              onMouseLeave={() => setHoveredPaper(null)}
              className={`flex-shrink-0 w-40 cursor-pointer p-4 rounded-lg ${
                selectedPaper?.id === paper.id
                  ? "bg-blue-100 border-2 border-blue-500"
                  : "bg-white border border-gray-200"
              }`}
            >
              <div className="w-full h-40 flex items-center justify-center bg-gray-100 mb-2">
                <svg 
                  className="w-12 h-12 text-red-500" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 384 512"
                >
                  <path 
                    fill="currentColor" 
                    d="M181.9 256.1c-5-16-4.9-46.9-2-46.9 8.4 0 7.6 36.9 2 46.9zm-1.7 47.2c-7.7 20.2-17.3 43.3-28.4 62.7 18.3-7 39-17.2 62.9-21.9-12.7-9.6-24.9-23.4-34.5-40.8zM86.1 428.1c0 .8 13.2-5.4 34.9-40.2-6.7 6.3-29.1 24.5-34.9 40.2zM248 160h136v328c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24V24C0 10.7 10.7 0 24 0h200v136c0 13.2 10.8 24 24 24zm-8 171.8c-20-12.2-33.3-29-42.7-53.8 4.5-18.5 11.6-46.6 6.2-64.2-4.7-29.4-42.4-26.5-47.8-6.8-5 18.3-.4 44.1 8.1 77-11.6 27.6-28.7 64.6-40.8 85.8-.1 0-.1.1-.2.1-27.1 13.9-73.6 44.5-54.5 68 5.6 6.9 16 10 21.5 10 17.9 0 35.7-18 61.1-61.8 25.8-8.5 54.1-19.1 79-23.2 21.7 11.8 47.1 19.5 64 19.5 29.2 0 31.2-32 19.7-43.4-13.9-13.6-54.3-9.7-73.6-7.2zM377 105L279 7c-4.5-4.5-10.6-7-17-7h-6v128h128v-6.1c0-6.3-2.5-12.4-7-16.9zm-74.1 255.3c4.1-2.7-2.5-11.9-42.8-9 37.1 15.8 42.8 9 42.8 9z"
                  />
                </svg>
              </div>
              <div className="relative">
                <p className="text-sm font-medium text-center w-full">
                  {formatFilename(paper.filename)}
                </p>
                <p className="text-xs text-gray-500 text-center mt-1">
                  {paper.upload_date ? formatDate(paper.upload_date) : "No date"}
                </p>
                {hoveredPaper === paper.id && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap z-10">
                    {paper.filename}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No papers uploaded yet</p>
        )}
      </div>
    </div>
  );
}

export default PdfList;
