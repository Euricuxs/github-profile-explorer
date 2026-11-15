import { Route, Routes } from 'react-router'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProfilePage } from './pages/ProfilePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/users/:username" element={<ProfilePage />} />

      {/* The catch-all route has to come last: React Router ranks the
          routes by how specific they are, so a wildcard in front of the
          other routes would swallow every address. */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
