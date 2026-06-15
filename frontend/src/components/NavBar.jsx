import { NavLink } from 'react-router-dom';
import { Home, Users, Receipt, Plus, BarChart2 } from 'lucide-react';

export default function NavBar({ onAddSale }) {
  return (
    <nav className="nav-bar">
      <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
        <Home size={20} />
        <span>Home</span>
      </NavLink>

      <NavLink to="/sales" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
        <Receipt size={20} />
        <span>Sales</span>
      </NavLink>

      <button onClick={onAddSale} className="fab" aria-label="Add sale">
        <Plus size={22} />
      </button>

      <NavLink to="/customers" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
        <Users size={20} />
        <span>Customers</span>
      </NavLink>

      <NavLink to="/insights" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
        <BarChart2 size={20} />
        <span>Insights</span>
      </NavLink>
    </nav>
  );
}