import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Score from './pages/Score.jsx'
import Search from './pages/Search.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/search" element={<Search />} />
      <Route path="/score/:projectId" element={<Score />} />
    </Routes>
  )
}
