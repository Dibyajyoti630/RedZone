import ShieldIcon from './icons/ShieldIcon.jsx'
import HomeIcon from './icons/HomeIcon.jsx'
import FeaturesIcon from './icons/FeaturesIcon.jsx'
import AboutIcon from './icons/AboutIcon.jsx'
import AdminIcon from './icons/AdminIcon.jsx'

import { Link } from 'react-router-dom'

export default function NavBar({ isAuthenticated = false, isAdmin = false, onLogout }) {
  return (
    <header className="navbar">
      <div className="container nav-content">
        <div className="brand">
          <div className="logo">
            <ShieldIcon className="shield" size={18} />
          </div>
          <span className="brand-name">RedZone</span>
        </div>

        <input id="nav-toggle" type="checkbox" className="nav-toggle" aria-label="Toggle navigation" />
        <label htmlFor="nav-toggle" className="hamburger" aria-label="Open menu" aria-controls="nav-menu" aria-expanded="false">
          <span />
          <span />
          <span />
        </label>

        <nav id="nav-menu" className="nav-links nav-center">
          <a href="#home"><HomeIcon /> <span>Home</span></a>
          <a href="#features"><FeaturesIcon /> <span>Features</span></a>
          <a href="#about"><AboutIcon /> <span>About</span></a>
          {isAdmin && (
            <Link to="/admin"><AdminIcon /> <span>Admin</span></Link>
          )}
        </nav>

        <div className="nav-right">
          {isAuthenticated ? (
            <>
              <span className="user-status">
                {isAdmin ? 'Admin' : 'User'} Logged In
              </span>
              <button onClick={onLogout} className="btn btn-ghost">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">Login</Link>
              <Link to="/signup" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}


