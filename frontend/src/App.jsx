import { useState } from 'react'
import axios from 'axios'
import { ProductCard } from './components/ProductCard'
import './App.css'

function App() {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState([])
  const [carregando, setCarregando] = useState(false)

  const handleBuscar = async (e) => {
    e.preventDefault()
    if (!busca.trim()) return
    setCarregando(true)
    try {
      const response = await axios.post('http://localhost:3000/buscar', { busca })
      setResultados(response.data)
    } catch (error) {
      alert("Erro ao buscar no banco vetorial.")
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>UNINASSAU STORE 🥼</h1>
        <form onSubmit={handleBuscar} className="search-box">
          <input 
            type="text" 
            value={busca} 
            onChange={(e) => setBusca(e.target.value)} 
            placeholder="O que você procura?"
          />
          <button type="submit">Pesquisar</button>
        </form>
      </header>

      <main className="product-grid">
        {carregando ? (
          <p>IA Processando vetores...</p>
        ) : (
          resultados.map(item => <ProductCard key={item.id} produto={item} />)
        )}
      </main>
    </div>
  )
}

export default App