import './assets/css/style.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          React with Tailwind CSS
        </h1>
        <p className="text-gray-600">
          This is a React application styled with Tailwind CSS.
        </p>
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
          Click me
        </button>
      </div>
    </div>
  );
}

export default App;

