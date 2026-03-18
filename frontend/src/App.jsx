import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Score from './pages/Score.jsx'
import Search from './pages/Search.jsx'
import Methodology from './pages/Methodology.jsx'

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/score/:projectId" element={<Score />} />
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
        userSelect: 'none'
      }}>
        crafted by aravind
      </p>
    </div>
  )
}
