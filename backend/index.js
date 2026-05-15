require('dotenv').config();
const express = require('express');
const { Pinecone } = require('@pinecone-database/pinecone');
const { pipeline, mean_pooling } = require('@xenova/transformers');
const fs = require('fs');
const { normalize } = require('path');
const { get } = require('http');
const cors = require('cors');

const app = express();
app.use(cors());
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


// Rota de upload para os produtos que estao no json
app.post('/upload-produtos', async (req,res) => {
  try {
    //lendo os produtos
    const dados = fs.readFileSync('./produtos.json', 'utf-8');
    const produtos = JSON.parse(dados);

    const gerarVetores = await getEmbedder();
    const listaDeEnvio = [];

    for (const produto of produtos){

      //melhorando a qualidade de busca da IA
      const textoVetor = `Produto: ${produto.nome}. Categoria: ${produto.categoria}. Descrição: ${produto.descricao}`

      const output = await gerarVetores(textoVetor, {
        pooling: "mean",
        normalize: true
      });

      const vetor = Array.from(output.data);
      
      const produtoFormatado = {
        id: produto.id.toString(),
        values: vetor,
        metadata: {
          nome: String(produto.nome),
          preco: String(produto.preco),
          categoria: String(produto.categoria),
          descricao: String(produto.descricao)
        }
      }

      listaDeEnvio.push(produtoFormatado);
    }

    // Envia para o pinecone
    await index.upsert(listaDeEnvio);

    res.json({message: "Enviado para o Pinecone"});
  } catch (error) {
    console.error("Erro ao concluir o processo", error);
    res.status(500).json({error: error.message});
  }
});

// Rota para cadastrar produtos novos
app.post('/cadastrar-produto', async (req, res) => {
    try {
        const { id, nome, preco, categoria, descricao } = req.body;
        const gerarVetores = await getEmbedder();
        // Gera o vetor do novo produto
        const textoVetor = `Produto: ${nome}, Categoria: ${categoria}, Descrição: ${descricao}`;

        const output = await gerarVetores(textoVetor, { 
          pooling: "mean", 
          normalize: true 
        });
        const vetor = Array.from(output.data);

        await index.upsert([{
            id: String(id),
            values: vetor,
            metadata: {
              nome: nome,
              preco: String(preco),
              categoria: categoria,
              descricao: descricao
            }
        }]);

        res.json({ message: `Produto ${nome} cadastrado` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rota de busca
app.post('/buscar', async (req, res) => {
  try {
    const { busca } = req.body; // o que digitou
    const gerarVetores = await getEmbedder();

    // transforma o que digitou em vetor
    const output = await gerarVetores(busca, {
      pooling: 'mean',
      normalize: true
    });
    const vetorBusca = Array.from(output.data);

    // busca no banco os 5 mais parecidos (topK: 5)
    const resultado = await index.query({
      vector: vetorBusca,
      topK: 3,
      includeMetadata: true // metadata onde tem o nome e preço
    });

    res.json(resultado.matches);
  } catch (error) {
    console.error("Erro na busca: ", error);
    res.status(500).json({error: error.message});
  }
});

//Rota para limpar o banco
app.delete('/limpar-banco', async (req, res) => {
  try {
    // Apaga os vetores do index
    await index.deleteAll();
    
    res.json({ message: "Banco de dados limpo" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Rota para remover 1 produto cadastrado pelo id
 app.delete('/remover-produto/:id', async (req, res) => {
  try{
    const { id } = req.params;
    if(!id){
      return res.status(400).json({error: "O id é obrigatório"});
    } else{
      await index.deleteMany([String(id)]);

      res.json({message: `Produto de id ${id}, foi removido`})
    }

  } catch (error){
    console.error(500).json({error: error.message});
  }
 });

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor on-line em http://localhost:${PORT}`);
});