import React, { useState, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

// Always use API_BASE from .env, fallback to gateway
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

function App(){
  const [view, setView] = useState('login')
  const [email, setEmail] = useState('test@example.com')
  const [password, setPassword] = useState('pass123')
  const [token, setToken] = useState(null)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])

  // attach token if logged in
  const authed = token ? { 'Authorization': 'Bearer ' + token } : {}

  // --- AUTH ---
  async function signup(){
    const r = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email, password })
    })
    if (r.ok) {
      alert('Signed up! Now log in.')
    } else {
      const err = await r.json().catch(()=>({}))
      alert('Signup failed: ' + (err.error || r.status))
    }
  }

  async function login(){
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email, password })
    })
    const j = await r.json()
    if (j.token) {
      setToken(j.token)
      setView('catalog')
    } else {
      alert('Login failed')
    }
  }

  // --- CATALOG ---
  async function loadProducts(){
    try {
      const r = await fetch(`${API_BASE}/catalog/products`)
      if (r.ok) {
        setProducts(await r.json())
      }
    } catch (e) {
      console.error('catalog fetch failed', e)
    }
  }

  // --- CART ---
  async function addToCart(sku){
    await fetch(`${API_BASE}/cart/add`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', ...authed },
      body: JSON.stringify({ productId: sku, qty: 1 })
    })
    await loadCart()
  }

  async function loadCart(){
    const r = await fetch(`${API_BASE}/cart/items`, { headers: { ...authed } })
    if (r.ok) setCart(await r.json())
  }

  async function checkout(){
    const r = await fetch(`${API_BASE}/cart/checkout`, {
      method: 'POST',
      headers: { ...authed }
    })
    if (r.ok) {
      alert('Order placed (via webhook)!')
      await loadCart()
    } else {
      alert('Checkout failed')
    }
  }

  // Auto-load catalog when switching to it
  useEffect(() => { if (view === 'catalog') loadProducts() }, [view])

  // --- RENDER ---
  return (
    <div style={{ fontFamily:'system-ui, Arial', padding:20, maxWidth:800, margin:'0 auto' }}>
      <h1>Microservices Shop (Lean)</h1>

      <nav style={{ marginBottom:20 }}>
        <button onClick={() => setView('login')}>Login</button>{' '}
        <button onClick={() => setView('catalog')}>Catalog</button>{' '}
        <button onClick={() => { setView('cart'); loadCart() }}>Cart</button>
      </nav>

      {view === 'login' && (
        <div style={{ display:'grid', gap:8, maxWidth:320 }}>
          <input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
          <input placeholder="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={signup}>Sign Up</button>
            <button onClick={login}>Log In</button>
          </div>
        </div>
      )}

      {view === 'catalog' && (
        <div>
          <h2>Catalog</h2>
          <ul>
            {products.map(p => (
              <li key={p.sku} style={{ marginBottom:8 }}>
                <strong>{p.name}</strong> — ${p.price.toFixed(2)}{' '}
                <button onClick={() => addToCart(p.sku)}>Add</button>
              </li>
            ))}
          </ul>
        </div>
      )}

  {view==='cart' && (
  <div>
    <h2>Cart</h2>
    <ul>
      {cart.map((i, idx) => {
        const product = products.find(p => p.sku === i.productId)
        const name = product ? product.name : i.productId
        const price = product ? product.price.toFixed(2) : '?'
        return (
          <li key={idx}>
            <strong>{name}</strong> — ${price} × {i.qty}
          </li>
        )
      })}
    </ul>
    <button onClick={checkout}>Checkout</button>
  </div>
)}
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App/>)
