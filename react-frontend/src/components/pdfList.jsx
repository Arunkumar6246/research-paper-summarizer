function PdfList({ papers, onSelect, selectedPaper }) {
  return (
    <div className="w-full mt-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Uploaded Papers</h2>
      <div className="flex overflow-x-auto pb-4 space-x-4">
        {papers.length > 0 ? (
          papers.map((paper) => (
            <div
              key={paper.id}
              onClick={() => onSelect(paper)}
              className={`flex-shrink-0 cursor-pointer p-4 rounded-lg ${
                selectedPaper?.id === paper.id
                  ? "bg-blue-100 border-2 border-blue-500"
                  : "bg-white border border-gray-200"
              }`}
            >
              <div className="w-32 h-40 flex items-center justify-center bg-gray-100 mb-2">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-center truncate">
                {paper.filename}
              </p>
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
