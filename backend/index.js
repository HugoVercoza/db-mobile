require('dotenv').config();
const express = require('express');
const { Pinecone } = require('@pinecone-database/pinecone');
const { pipeline } = require('@xenova/transformers');
const fs = require('fs');

const app = express();
app.use(express.json());

// Configurar o pinecone
const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
});
const index = pc.index('ecommerce-dbmobile-index');

// Gerar os vetores (Embeddings)
let embedder = null;
async function getEmbedder() {
    if (embedder === null) {
        embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    }
    return embedder;
}

// Rota de Teste
app.get('/', (req, res) => {
  res.send('Servidor Rodando!');
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor on-line em http://localhost:${PORT}`);
});