export function ProductCard({ produto }) {
  return (
    <div className="product-card">
      <div className="badge">{produto.metadata.categoria}</div>
      <h3>{produto.metadata.nome}</h3>
      <p className="price">R$ {produto.metadata.preco}</p>
      <div className="score-bar">
        <div 
          className="score-fill" 
          style={{ width: `${produto.score * 100}%` }}
        ></div>
      </div>
      <small>Precisão: {(produto.score * 100).toFixed(1)}%</small>
    </div>
  );
}