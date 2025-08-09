import { Link } from 'react-router-dom'

export default function Signup() {
  return (
    <section className="auth container">
      <div className="auth-card">
        <h2>Create your account</h2>
        <p className="muted">Join RedZone to stay safe anywhere</p>
        <form className="form">
          <label>
            <span>Name</span>
            <input type="text" placeholder="Full name" required />
          </label>
          <label>
            <span>Email</span>
            <input type="email" placeholder="you@example.com" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" placeholder="••••••••" required />
          </label>
          <button type="submit" className="btn btn-primary btn-glow" style={{ width: '100%' }}>Sign Up</button>
        </form>
        <p className="muted" style={{ marginTop: 12 }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </section>
  )
}


