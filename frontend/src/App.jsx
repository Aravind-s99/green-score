import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import LandingPage from './pages/LandingPage.jsx'
import Home from './pages/Home.jsx'
import Score from './pages/Score.jsx'
import Search from './pages/Search.jsx'
import About from './pages/About.jsx'
import Methodology from './pages/Methodology.jsx'

export default function App() {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/score/:projectId" element={<Score />} />
        <Route path="/about" element={<About />} />
        <Route path="/methodology" element={<Methodology />} />
      </Routes>
      <p style={{
        position: 'fixed',
        bottom: '12px',
        right: '16px',
        fontSize: '11px',
        color: '#c9a84c30',
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: '0.12em',
        pointerEvents: 'none',
        zIndex: 9999,
        userSelect: 'none',
        margin: 0,
      }}>
        crafted by aravind
      </p>
    </div>
  )
}
