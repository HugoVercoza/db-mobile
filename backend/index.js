require('dotenv').config();
const express = require('express');
const { Pinecone } = require('@pinecone-database/pinecone');
const { pipeline, mean_pooling } = require('@xenova/transformers');
const fs = require('fs');
const { normalize } = require('path');

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

// Rota de upload
app.post('/upload-produtos', async (req,res) => {
  try {
    //lendo os produtos
    const dados = fs.readFileSync('./produtos.json', 'utf-8');
    const produtos = JSON.parse(dados);

    const gerarVetores = await getEmbedder();
    const listaDeEnvio = [];

    for (const produto of produtos){
      const output = await gerarVetores(produto.descricao, {
        pooling: "mean",
        normalize: true
      });
    

      const vetor = Array.from(output.data);

      listaDeEnvio.push({
        id: produto.id.toString(),
        values: vetor,
        metadata: {
          nome: produto.nome,
          preco: produto.preco,
          categoria: produto.categoria
        }
      });
    }

    // Envia para o pinecone
    await index.upsert(listaDeEnvio);

    res.json({message: "Enviado para o Pinecone"});
  } catch (error) {
    console.error("Erro ao concluir o processo", error);
    res.status(500).json({error: "Erro interno no servidor"});
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor on-line em http://localhost:${PORT}`);
});