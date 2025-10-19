import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import ProductGrid from "./components/ProductGrid";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8098";

function App() {
  const [view, setView] = useState("login");
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("pass123");
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const authed = token ? { Authorization: "Bearer " + token } : {};

  // persist token
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  // ---------- AUTH ----------
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
      loadProducts();
    } else {
      alert("Login failed");
    }
  }

  // ---------- CATALOG ----------
  async function loadProducts() {
    try {
      const r = await fetch(`${API_BASE}/catalog/products`);
      if (r.ok) setProducts(await r.json());
      else console.error("catalog fetch failed", r.status, await r.text());
    } catch (e) {
      console.error("catalog fetch failed", e);
    }
  }

  // ---------- CART ----------
  async function addToCart(sku) {
    if (!token) {
      alert("Please log in first.");
      setView("login");
      return;
    }
    try {
      const r = await fetch(`${API_BASE}/cart/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authed },
        body: JSON.stringify({ productId: sku, qty: 1 }),
      });
      if (r.ok) {
        await loadCart();
      } else {
        const msg = await r.text();
        console.error("Add to cart failed", r.status, msg);
        alert(`Add to cart failed (${r.status}). ${msg || ""}`);
      }
    } catch (e) {
      console.error("cart add failed", e);
      alert("Add to cart failed (network). See console for details.");
    }
  }

  async function loadCart() {
    try {
      const r = await fetch(`${API_BASE}/cart/items`, { headers: { ...authed } });
      if (r.ok) {
        const items = await r.json();
        // merge duplicate productId rows
        const merged = Object.values(
          items.reduce((acc, item) => {
            if (!acc[item.productId]) acc[item.productId] = { ...item };
            else acc[item.productId].qty += item.qty;
            return acc;
          }, {})
        );
        setCart(merged);
      } else {
        console.error("cart fetch failed", r.status, await r.text());
      }
    } catch (e) {
      console.error("cart fetch failed", e);
    }
  }

  async function checkout() {
    if (!token) {
      alert("Please log in first.");
      setView("login");
      return;
    }
    try {
      const r = await fetch(`${API_BASE}/cart/checkout`, {
        method: "POST",
        headers: { ...authed },
      });
      if (r.ok) {
        alert("✅ Order placed!");
        setCart([]);
      } else {
        const msg = await r.text();
        console.error("Checkout failed", r.status, msg);
        alert(`Checkout failed (${r.status}). ${msg || ""}`);
      }
    } catch (e) {
      console.error("Checkout error", e);
      alert("Checkout failed (network). See console for details.");
    }
  }

  // auto-load after token restore
  useEffect(() => {
    if (token) {
      setView("catalog");
      loadProducts();
    }
  }, [token]);

  return (
    <div
      style={{
        fontFamily: "system-ui, Arial",
        padding: 20,
        maxWidth: 1100,
        margin: "0 auto",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: 20 }}>
        Microservices Shop (Lean)
      </h1>

      {/* NAV */}
      {token && (
        <nav style={{ marginBottom: 20, textAlign: "center" }}>
          <button onClick={() => setView("catalog")}>Catalog</button>{" "}
          <button
            onClick={() => {
              setView("cart");
              loadCart();
            }}
          >
            Cart ({cart.reduce((sum, i) => sum + (i.qty || 0), 0)})
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

      {/* LOGIN */}
      {view === "login" && (
        <div style={{ display: "grid", gap: 8, maxWidth: 320, margin: "0 auto" }}>
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
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={signup}>Sign Up</button>
            <button onClick={login}>Log In</button>
          </div>
        </div>
      )}

      {/* CATALOG */}
      {view === "catalog" && (
        <ProductGrid products={products} onAddToCart={addToCart} />
      )}

      {/* CART */}
      {view === "cart" && (
        <div>
          <h2 style={{ textAlign: "center" }}>Cart</h2>
          {cart.length === 0 ? (
            <p style={{ textAlign: "center" }}>Your cart is empty.</p>
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
