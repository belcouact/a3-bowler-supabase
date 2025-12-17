import { Navigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const A3Redirect = () => {
  const { a3Cases } = useApp();

  if (a3Cases && a3Cases.length > 0) {
    return <Navigate to={`/a3-analysis/${a3Cases[0].id}/problem-statement`} replace />;
  }

  return (
    <div className="text-center py-10 text-gray-500">
      <p>No A3 Cases found.</p>
      <p className="text-sm mt-2">Create a new case using the + button in the sidebar.</p>
    </div>
  );
};

export default A3Redirect;
