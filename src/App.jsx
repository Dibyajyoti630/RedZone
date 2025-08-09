import NavBar from './components/NavBar.jsx'
import Hero from './components/Hero.jsx'
import Features from './components/Features.jsx'
import Testimonial from './components/Testimonial.jsx'
import About from './components/About.jsx'
import Footer from './components/Footer.jsx'

export default function App() {
  return (
    <div className="app">
      <NavBar />
      <main>
        <Hero />
        <Features />
        <About />
        {/* <Testimonial /> */}
      </main>
      <Footer />
    </div>
  )
}


