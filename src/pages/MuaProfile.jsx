import { useParams } from 'react-router-dom'

// Fase 4: bio, galeri portofolio, paket & harga, tombol WhatsApp.
function MuaProfile() {
  // :slug di rute /mua/:slug, misalnya /mua/rina-makeup → slug = "rina-makeup"
  const { slug } = useParams()

  return (
    <section>
      <h1 className="text-2xl font-bold">Profil MUA</h1>
      <p className="mt-2 text-gray-500">Slug: {slug}</p>
    </section>
  )
}

export default MuaProfile
