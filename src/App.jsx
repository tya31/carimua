import { Route, Routes } from 'react-router-dom'
import RequireAuth from './auth/RequireAuth.jsx'
import Container from './components/Container.jsx'
import Layout from './components/Layout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import MuaList from './pages/MuaList.jsx'
import MuaProfile from './pages/MuaProfile.jsx'
import NotFound from './pages/NotFound.jsx'

// Peta URL → halaman. Semua halaman dibungkus <Layout> (navbar + footer).
// Beranda tampil full-width; halaman lain dibungkus <Container> (lebar maksimal + padding).
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route element={<Container />}>
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
      </Route>
    </Routes>
  )
}

export default App
