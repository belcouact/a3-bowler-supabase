import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
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
const AICoach = lazy(() => import('./pages/a3-subpages/AICoach'));

const LoadingView = ({ message }: { message: string }) => (
  <div className="flex items-center justify-center py-16">
    <div className="flex flex-col items-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="mt-3 text-base font-medium text-gray-700">{message}</p>
    </div>
  </div>
);

const MarkmapLoader = () => {
  return <LoadingView message="Loading markmap.js..." />;
};

const PortfolioPlaceholder = () => {
  return null;
};

function App() {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/metric-bowler" replace />} />
          <Route
            path="mindmap"
            element={
              <Suspense fallback={<MarkmapLoader />}>
                <MarkmapPage />
              </Suspense>
            }
          />
          <Route
            path="metric-bowler"
            element={
              <Suspense fallback={null}>
                <MetricBowler />
              </Suspense>
            }
          />
          <Route
            path="metric-bowler/:id"
            element={
              <Suspense fallback={null}>
                <MetricBowler />
              </Suspense>
            }
          />
          <Route
            path="a3-analysis"
            element={
              <Suspense fallback={null}>
                <Outlet />
              </Suspense>
            }
          >
            <Route index element={<A3Redirect />} />
            <Route path=":id" element={<A3Analysis />}>
              <Route index element={<Navigate to="problem-statement" replace />} />
              <Route path="problem-statement" element={<ProblemStatement />} />
              <Route path="data-analysis" element={<DataAnalysis />} />
              <Route path="why-analysis" element={<WhyAnalysis />} />
              <Route path="action-plan" element={<ActionPlan />} />
              <Route path="result" element={<Result />} />
              <Route path="summary" element={<Summary />} />
              <Route path="ai-coach" element={<AICoach />} />
            </Route>
          </Route>
          <Route path="portfolio" element={<PortfolioPlaceholder />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
