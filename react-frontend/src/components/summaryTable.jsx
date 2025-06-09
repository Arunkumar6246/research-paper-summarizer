// components/summaryTable.jsx
function SummaryTable({ summaries, paperId }) {
  return (
    <div className="w-full">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Paper Summaries</h2>
      {summaries.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Section</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Summary</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {summaries.map((summary, index) => (
                <tr key={index}>
                  <td className="py-3 px-4 text-sm text-gray-800">{summary.section_title}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{summary.summary_text}</td>
                  <td className="py-3 px-4">
                    <a
                      href={`http://localhost:8000/api/paper/${paperId}/view#page=${summary.page}`}
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
      ) : (
        <p className="text-gray-500">No summaries available</p>
      )}
    </div>
  );
}

export default SummaryTable;
