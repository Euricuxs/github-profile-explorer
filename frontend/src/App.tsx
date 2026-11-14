import { Route, Routes } from 'react-router'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/users/:username" element={<ProfilePage />} />
    </Routes>
  )
}
