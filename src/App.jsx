import { Route, Routes } from 'react-router-dom'
import RequireAuth from './auth/RequireAuth.jsx'
import Container from './components/Container.jsx'
import Layout from './components/Layout.jsx'
import BookingPage from './pages/BookingPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import ChooseRole from './pages/ChooseRole.jsx'
import ClientHome from './pages/ClientHome.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Home from './pages/Home.jsx'
import Legal from './pages/Legal.jsx'
import Login from './pages/Login.jsx'
import MuaList from './pages/MuaList.jsx'
import MuaProfile from './pages/MuaProfile.jsx'
import NotFound from './pages/NotFound.jsx'

// Peta URL → halaman. Semua halaman dibungkus <Layout> (navbar + footer).
// Beranda tampil full-width; halaman lain dibungkus <Container> (lebar maksimal + padding).
//
// Akses:
// - /                beranda, publik
// - /mua/:slug       profil MUA, publik (supaya link di bio Instagram bisa langsung dibuka)
// - /mua             cari MUA, WAJIB login (klien atau MUA)
// - /akun            rumah klien
// - /dashboard       rumah MUA
function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route element={<Container />}>
          <Route
            path="/mua"
            element={
              <RequireAuth>
                <MuaList />
              </RequireAuth>
            }
          />
          <Route path="/mua/:slug" element={<MuaProfile />} />
          <Route
            path="/mua/:slug/booking"
            element={
              <RequireAuth role="client">
                <BookingPage />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/pilih-peran" element={<ChooseRole />} />
          <Route
            path="/akun"
            element={
              <RequireAuth role="client">
                <ClientHome />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard"
            element={
              <RequireAuth role="mua">
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/chat/:id?"
            element={
              <RequireAuth>
                <ChatPage />
              </RequireAuth>
            }
          />
          <Route path="/privasi" element={<Legal kind="privacy" />} />
          <Route path="/syarat" element={<Legal kind="terms" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
