import express from 'express'
import historicoRoutes from './router/historico'


const app = express()
app.use(express.json())

// ✅ Ativa as rotas de histórico
app.use(historicoRoutes)



app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000')
})
