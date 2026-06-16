import { NavLink } from 'react-router-dom';
import { Home, Users, Receipt, Plus, BarChart2 } from 'lucide-react';

export default function NavBar({ onAddSale, isSheetOpen }) {
  return (
    <>
      <style>{`
        .nav-bar {
          display: flex;
          align-items: center;
          justify-content: space-around;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 64px;
          background: var(--color-background-primary, #fff);
          border-top: 0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.1));
          padding-bottom: env(safe-area-inset-bottom);
          transition: z-index 0s;
        }
        .nav-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          text-decoration: none;
          color: var(--color-text-tertiary, #aaa);
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          padding: 6px 12px;
          border-radius: 12px;
          transition: color 0.15s;
        }
        .nav-link.active {
          color: #3C3489;
        }
        .nav-link.active svg {
          stroke: #3C3489;
        }
        .fab {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #0C1A2E;
          border: none;
          cursor: pointer;
          color: #fff;
          flex-shrink: 0;
          transition: opacity 0.15s;
        }
        .fab:active {
          opacity: 0.8;
        }
      `}</style>
      <nav
        className="nav-bar"
        style={{ zIndex: isSheetOpen ? 40 : 100 }}
      >
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
    </>
  );
}