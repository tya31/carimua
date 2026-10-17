import { Route, Routes } from 'react-router-dom'
import RequireAuth from './auth/RequireAuth.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import MuaList from './pages/MuaList.jsx'
import MuaProfile from './pages/MuaProfile.jsx'
import NotFound from './pages/NotFound.jsx'

// Peta URL → halaman. Semua halaman dibungkus <Layout> (navbar + footer).
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/mua" element={<MuaList />} />
        <Route path="/mua/:slug" element={<MuaProfile />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
