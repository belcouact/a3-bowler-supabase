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
          <Route path="a3-analysis" element={<Navigate to="/a3-analysis/1/problem-statement" replace />} />
          <Route path="a3-analysis/:id" element={<A3Analysis />}>
            <Route index element={<Navigate to="problem-statement" replace />} />
            <Route path="problem-statement" element={<ProblemStatement />} />
            <Route path="data-analysis" element={<DataAnalysis />} />
            <Route path="why-analysis" element={<WhyAnalysis />} />
            <Route path="action-plan" element={<ActionPlan />} />
            <Route path="result" element={<Result />} />
            <Route path="summary" element={<Summary />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
