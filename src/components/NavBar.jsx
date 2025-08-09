import ShieldIcon from './icons/ShieldIcon.jsx'
import HomeIcon from './icons/HomeIcon.jsx'
import FeaturesIcon from './icons/FeaturesIcon.jsx'
import AboutIcon from './icons/AboutIcon.jsx'

export default function NavBar() {
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
        </nav>

        <div className="nav-right">
          <a href="#login" className="btn btn-ghost">Login</a>
          <a href="#signup" className="btn btn-primary">Sign Up</a>
        </div>
      </div>
    </header>
  )
}


