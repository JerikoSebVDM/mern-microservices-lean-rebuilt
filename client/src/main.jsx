import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

function App() {
  // --- STATE ---
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("pass123");
  const [token, setToken] = useState(() => localStorage.getItem("token")); // ✅ restore saved token
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const authed = token ? { Authorization: "Bearer " + token } : {};

  // ✅ Persist JWT token across refreshes
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  // --- AUTH ---
  async function signup() {
    const r = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (r.ok) alert("Signed up! Now log in.");
    else alert("Signup failed.");
  }

  async function login() {
    const r = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const j = await r.json();
    if (j.token) {
      setToken(j.token);
      setView("catalog");
    } else alert("Login failed");
  }

  // --- CATALOG ---
  async function loadProducts() {
    try {
      const r = await fetch(`${API_BASE}/catalog/products`);
      if (r.ok) setProducts(await r.json());
    } catch (e) {
      console.error("catalog fetch failed", e);
    }
  }

  // --- CART ---
  async function addToCart(sku) {
    try {
      const r = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authed },
        body: JSON.stringify({ productId: sku, qty: 1 }),
      });
      if (r.ok) await loadCart();
      else console.error("Add to cart failed", r.status);
    } catch (e) {
      console.error("cart add failed", e);
    }
  }

  async function loadCart() {
    try {
      const r = await fetch(`${API_BASE}/cart/items`, { headers: { ...authed } });
      if (r.ok) {
        const items = await r.json();
        const merged = Object.values(
          items.reduce((acc, item) => {
            if (!acc[item.productId]) acc[item.productId] = { ...item };
            else acc[item.productId].qty += item.qty;
            return acc;
          }, {})
        );
        setCart(merged);
      }
    } catch (e) {
      console.error("cart fetch failed", e);
    }
  }

  async function checkout() {
    const r = await fetch(`${API_BASE}/cart/checkout`, {
      method: "POST",
      headers: { ...authed },
    });
    if (r.ok) {
      alert("✅ Order placed!");
      setCart([]);
    } else {
      alert("Checkout failed");
    }
  }

  // ✅ Load products automatically after login or restore
  useEffect(() => {
    if (token) {
      setView("catalog");
      loadProducts();
    }
  }, [token]);

  // --- UI ---
  return (
    <div
      style={{
        fontFamily: "system-ui, Arial",
        padding: 20,
        maxWidth: 800,
        margin: "0 auto",
      }}
    >
      <h1>Microservices Shop (Lean)</h1>

      {/* Navigation */}
      {token && (
        <nav style={{ marginBottom: 20 }}>
          <button onClick={() => setView("catalog")}>Catalog</button>{" "}
          <button
            onClick={() => {
              setView("cart");
              loadCart();
            }}
          >
            Cart
          </button>{" "}
          <button
            onClick={() => {
              setToken(null);
              setView("login");
              setCart([]);
            }}
          >
            Logout
          </button>
        </nav>
      )}

      {view === "login" && (
        <div style={{ display: "grid", gap: 8, maxWidth: 320 }}>
          <input
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={signup}>Sign Up</button>
            <button onClick={login}>Log In</button>
          </div>
        </div>
      )}

      {view === "catalog" && (
        <div>
          <h2>Catalog</h2>
          <ul>
            {products.map((p) => (
              <li key={p.sku} style={{ marginBottom: 8 }}>
                <strong>{p.name}</strong> — ${p.price.toFixed(2)}{" "}
                <button onClick={() => addToCart(p.sku)}>Add</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {view === "cart" && (
        <div>
          <h2>Cart</h2>
          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <ul>
              {cart.map((i, idx) => {
                const product = products.find(
                  (p) => p.sku === i.productId || p.id === i.productId
                );
                const name = product ? product.name : i.productId;
                const price = product ? product.price.toFixed(2) : "?";
                return (
                  <li key={idx}>
                    <strong>{name}</strong> — ${price} × {i.qty}
                  </li>
                );
              })}
            </ul>
          )}
          <button onClick={checkout}>Checkout</button>
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
