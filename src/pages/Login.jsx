import { Link } from 'react-router-dom'

export default function Login() {
  return (
    <section className="auth container">
      <div className="auth-card">
        <h2>Welcome back</h2>
        <p className="muted">Log in to continue</p>
        <form className="form">
          <label>
            <span>Email</span>
            <input type="email" placeholder="you@example.com" required />
          </label>
          <label>
            <span>Password</span>
            <input type="password" placeholder="••••••••" required />
          </label>
          <button type="submit" className="btn btn-primary btn-glow" style={{ width: '100%' }}>Login</button>
        </form>
        <p className="muted" style={{ marginTop: 12 }}>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </section>
  )
}


