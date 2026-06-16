import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import NavBar from './components/NavBar';
import AddSaleSheet from './components/AddSaleSheet';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import SalesHistory from './pages/SalesHistory';
import Insights from './pages/Insights';
import Account from './pages/Account';
import Privacy from './pages/Privacy';
import { User, HelpCircle } from 'lucide-react';

function Layout({ children, refreshKey, onAddSale, title }) {
  return (
    <div className="app-shell">
      <header className="top-bar">
        {title && <h1 className="top-bar-title">{title}</h1>}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link to="/privacy" className="user-icon-link" aria-label="Privacy Policy">
            <HelpCircle size={20} />
          </Link>
          <Link to="/account" className="user-icon-link" aria-label="Account">
            <User size={24} />
          </Link>
        </div>
      </header>
      <main className="app-main">{children}</main>
      <NavBar onAddSale={onAddSale} />
    </div>
  );
}

function AppRoutes() {
  const [showAddSale, setShowAddSale] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = () => setRefreshKey((k) => k + 1);

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout onAddSale={() => setShowAddSale(true)} title="Overview">
                <Home refreshKey={refreshKey} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <Layout onAddSale={() => setShowAddSale(true)} title="Sales">
                <SalesHistory refreshKey={refreshKey} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <Layout onAddSale={() => setShowAddSale(true)} title="Customers">
                <Customers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute>
              <Layout onAddSale={() => setShowAddSale(true)} title={null}>
                <CustomerDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/insights"
          element={
            <ProtectedRoute>
              <Layout onAddSale={() => setShowAddSale(true)} title="Insights">
                <Insights />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Layout onAddSale={() => setShowAddSale(true)} title="Account">
                <Account />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/privacy"
          element={
            <ProtectedRoute>
              <Layout onAddSale={() => setShowAddSale(true)} title="Privacy">
                <Privacy />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>

      {showAddSale && (
        <AddSaleSheet onClose={() => setShowAddSale(false)} onSaved={handleSaved} />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
