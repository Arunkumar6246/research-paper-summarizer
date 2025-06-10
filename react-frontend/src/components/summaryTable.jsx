// components/summaryTable.jsx
import { useEffect, useRef } from 'react';
import { API_URL } from '../config';

function SummaryTable({ summaries, paperId, isProcessing, processingProgress, processingMessage, isNewUpload }) {
  const tableRef = useRef(null);
  const lastRowRef = useRef(null);

  // Scroll to the bottom when new summaries are added during processing
  useEffect(() => {
    if (lastRowRef.current && isProcessing) {
      lastRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [summaries.length, isProcessing]);

  // Filter out any invalid summaries
  const validSummaries = Array.isArray(summaries) ? 
    summaries.filter(summary => summary && summary.section_title) : [];

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Paper Summaries</h2>
      
      {isProcessing && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {processingMessage || `Processing paper... ${processingProgress}% complete`}
          </p>
        </div>
      )}
      
      {!isProcessing && processingMessage && (
        <div className="mb-4 p-2 bg-green-100 border-l-4 border-green-500 text-green-700">
          {processingMessage}
        </div>
      )}
      
      {validSummaries.length > 0 ? (
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto" ref={tableRef}>
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Section</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Summary</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {validSummaries.map((summary, index) => (
                <tr 
                  key={index} 
                  ref={index === validSummaries.length - 1 ? lastRowRef : null}
                  className={index === validSummaries.length - 1 && isProcessing ? "bg-blue-50" : ""}
                >
                  <td className="py-3 px-4 text-sm text-gray-800">{summary.section_title}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{summary.summary_text}</td>
                  <td className="py-3 px-4">
                    <a
                      href={`${API_URL}/paper/${paperId}/view#page=${summary.page}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      View in PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !isProcessing ? (
        <p className="text-gray-500">No summaries available</p>
      ) : (
        <p className="text-gray-500">Generating summaries...</p>
      )}
    </div>
  );
}

export default SummaryTable;
