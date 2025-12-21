import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from './components/Layout';

const MetricBowler = lazy(() => import('./pages/MetricBowler'));
const A3Analysis = lazy(() => import('./pages/A3Analysis'));
const ProblemStatement = lazy(() => import('./pages/a3-subpages/ProblemStatement'));
const DataAnalysis = lazy(() => import('./pages/a3-subpages/DataAnalysis'));
const WhyAnalysis = lazy(() => import('./pages/a3-subpages/WhyAnalysis'));
const ActionPlan = lazy(() => import('./pages/a3-subpages/ActionPlan'));
const Result = lazy(() => import('./pages/a3-subpages/Result'));
const Summary = lazy(() => import('./pages/a3-subpages/Summary'));
const A3Redirect = lazy(() => import('./components/A3Redirect'));
const MarkmapPage = lazy(() => import('./pages/MarkmapPage'));

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<div className="p-4 text-gray-500">Loading...</div>}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/metric-bowler" replace />} />
            <Route path="mindmap" element={<MarkmapPage />} />
            <Route path="metric-bowler" element={<MetricBowler />} />
            <Route path="metric-bowler/:id" element={<MetricBowler />} />
            <Route path="a3-analysis" element={<Outlet />}>
              <Route index element={<A3Redirect />} />
              <Route path=":id" element={<A3Analysis />}>
                <Route index element={<Navigate to="problem-statement" replace />} />
                <Route path="problem-statement" element={<ProblemStatement />} />
                <Route path="data-analysis" element={<DataAnalysis />} />
                <Route path="why-analysis" element={<WhyAnalysis />} />
                <Route path="action-plan" element={<ActionPlan />} />
                <Route path="result" element={<Result />} />
                <Route path="summary" element={<Summary />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
