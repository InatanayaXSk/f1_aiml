import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { RegulationExplorer } from './pages/RegulationExplorer';
import { CircuitAnalyzer } from './pages/CircuitAnalyzer';
import { TeamComparison } from './pages/TeamComparison';
import { PresentationSummary } from './pages/PresentationSummary';
import ModelValidation from './pages/ModelValidation';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/presentation" element={<PresentationSummary />} />
            <Route path="/validation" element={<ModelValidation />} />
            <Route path="/regulations" element={<RegulationExplorer />} />
            <Route path="/circuits" element={<CircuitAnalyzer />} />
            <Route path="/teams" element={<TeamComparison />} />
          </Routes>
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
