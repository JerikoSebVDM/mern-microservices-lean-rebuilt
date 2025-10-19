import React from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8098";

export default function ProductGrid({ products, onAddToCart }) {
  return (
    <div style={styles.page}>
      <h2 style={styles.title}>Shop Our Collection</h2>

      <div style={styles.grid}>
        {products.map((p) => (
          <div key={p._id} style={styles.card} className="product-card">
            <div style={styles.imageWrapper}>
              <img
                src={
                  p.image?.startsWith("/uploads")
                    ? `${API_BASE}/catalog${p.image}`
                    : p.image
                }
                alt={p.name}
                style={styles.image}
                loading="lazy"
              />
            </div>

            <div style={styles.details}>
              <h3 style={styles.name}>{p.name}</h3>
              <p style={styles.price}>${p.price?.toFixed(2)}</p>

              <button
                style={styles.button}
                onClick={() => onAddToCart && onAddToCart(p.sku)}
                aria-label={`Add ${p.name} to cart`}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Inline styles ---
const styles = {
  page: {
    padding: "40px 20px",
    backgroundColor: "#f8f9fb",
    minHeight: "100vh",
    fontFamily: "Inter, system-ui, Arial, sans-serif",
  },
  title: {
    textAlign: "center",
    marginBottom: "30px",
    color: "#333",
    fontSize: "1.8rem",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "25px",
  },
  card: {
    background: "#fff",
    borderRadius: "14px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
    overflow: "hidden",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  imageWrapper: {
    width: "100%",
    height: "200px",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.3s ease",
  },
  details: {
    padding: "16px",
    textAlign: "center",
  },
  name: {
    fontSize: "1.1rem",
    fontWeight: "600",
    color: "#222",
    marginBottom: "8px",
  },
  price: {
    fontSize: "1rem",
    color: "#007bff",
    fontWeight: "500",
    marginBottom: "12px",
  },
  button: {
    background: "#1677ff",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.92rem",
    fontWeight: 600,
    transition: "background 0.2s ease, transform 0.2s ease",
  },
};

// --- hover CSS (kept separate to avoid inline limits)
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  .product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.15);
  }
  .product-card:hover img {
    transform: scale(1.05);
  }
  button:hover {
    background: #0f5edb !important;
    transform: scale(1.03);
  }
`;
document.head.appendChild(styleTag);
