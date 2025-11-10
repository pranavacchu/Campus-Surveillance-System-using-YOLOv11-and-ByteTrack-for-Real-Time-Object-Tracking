import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Homepage from "./Homepage"
import Dashboard from "./Dashboard"
import Dataset from "./Dataset"
import VideoSearch from "./VideoSearch"

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dataset" element={<Dataset />} />
        <Route path="/video-search" element={<VideoSearch />} />
      </Routes>
    </Router>
  )
}

export default App
