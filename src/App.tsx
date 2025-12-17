import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import MetricBowler from './pages/MetricBowler';
import A3Analysis from './pages/A3Analysis';
import ProblemStatement from './pages/a3-subpages/ProblemStatement';
import DataAnalysis from './pages/a3-subpages/DataAnalysis';
import WhyAnalysis from './pages/a3-subpages/WhyAnalysis';
import ActionPlan from './pages/a3-subpages/ActionPlan';
import Result from './pages/a3-subpages/Result';
import Summary from './pages/a3-subpages/Summary';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/metric-bowler" replace />} />
          
          {/* Metric Bowler Routes */}
          <Route path="metric-bowler" element={<MetricBowler />} />
          <Route path="metric-bowler/:id" element={<MetricBowler />} />
          
          {/* A3 Analysis Routes */}
          <Route path="a3-analysis" element={<A3Analysis />}>
            <Route index element={<div className="text-center py-10 text-gray-500">Select an A3 Case to view details</div>} />
            <Route path=":id/problem-statement" element={<ProblemStatement />} />
            <Route path=":id/data-analysis" element={<DataAnalysis />} />
            <Route path=":id/why-analysis" element={<WhyAnalysis />} />
            <Route path=":id/action-plan" element={<ActionPlan />} />
            <Route path=":id/result" element={<Result />} />
            <Route path=":id/summary" element={<Summary />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
