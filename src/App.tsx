import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import NewRental from './pages/NewRental';
import Rentals from './pages/Rentals';
import Reports from './pages/Reports';
import TestQRs from './pages/TestQRs';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/new" element={<NewRental />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/test-qrs" element={<TestQRs />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
