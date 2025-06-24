// components/summaryTable.jsx
import { useEffect, useRef } from 'react';
import { API_URL } from '../config';

function SummaryTable({ summaries, paperId, isProcessing, streamingSections, displayText, isNewUpload }) {
  const tableRef = useRef(null);
  const lastRowRef = useRef(null);
  const streamingRef = useRef(null);

  // Auto-scroll to streaming section during streaming
  useEffect(() => {
    if (isProcessing && streamingRef.current) {
      streamingRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [displayText, isProcessing]);

  // Combine final summaries with streaming sections
  const validSummaries = Array.isArray(summaries) ? 
    summaries.filter(summary => summary && summary.section_title) : [];
  
  const displaySections = isProcessing ? streamingSections : validSummaries;
  
  // Use the same parsing logic as App.jsx for consistency
  const parseStreamingContent = () => {
    if (!displayText) return [];
    
    try {
      // Extract partial objects using regex (same as App.jsx)
      const titleMatches = displayText.match(/"Section Title"\s*:\s*"([^"]*)"/g);
      const summaryMatches = displayText.match(/"Summary"\s*:\s*"([^"]*)"/g);
      
      if (!titleMatches && !summaryMatches) return [];
      
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
          page: 1,
          isStreaming: i === maxSections - 1 && (titles[i] || summaries[i]) // Last section is streaming
        });
      }
      
      return sections;
    } catch (e) {
      return [];
    }
  };
  
  const streamingRows = parseStreamingContent();

  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Paper Summaries</h2>
      
      {(displaySections.length > 0 || isProcessing) ? (
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
              {/* Show streaming rows during processing, final summaries after */}
              {(isProcessing && streamingRows.length > 0 ? streamingRows : displaySections).map((summary, index) => {
                const isStreamingRow = isProcessing && summary.isStreaming;
                const isLastRow = index === (isProcessing && streamingRows.length > 0 ? streamingRows : displaySections).length - 1;
                
                return (
                  <tr 
                    key={index} 
                    ref={isLastRow ? lastRowRef : null}
                    className={isStreamingRow ? "bg-yellow-50" : ""}
                  >
                    <td className="py-3 px-4 text-sm text-gray-800">
                      {summary.section_title || summary.title}
                      {isStreamingRow && <span className="animate-pulse">|</span>}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {summary.summary_text || summary.summary}
                      {isStreamingRow && summary.summary && <span className="animate-pulse">|</span>}
                    </td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      ) : !isProcessing ? (
        <p className="text-gray-500">No summaries available</p>
      ) : (
        <p className="text-gray-500">Generating summaries...</p>
      )}
      
      {/* Streaming display section below table */}
      {isProcessing && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200" ref={streamingRef}>
          <h3 className="text-sm font-medium text-blue-800 mb-2">Live Streaming:</h3>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {displayText}<span className="animate-pulse">|</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SummaryTable;
