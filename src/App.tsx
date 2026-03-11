import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import NewRental from './pages/NewRental';
import Rentals from './pages/Rentals';
import Reports from './pages/Reports';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<NewRental />} />
          <Route path="/rentals" element={<Rentals />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
