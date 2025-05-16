import express = require('express');
import historicoRoutes from './router/historico'
import { swaggerUi, swaggerSpec } from './swagger'


const app = express()
app.use(express.json())

// Swagger docs em /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// ✅ Ativa as rotas de histórico
app.use(historicoRoutes)



app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000')
  console.log('Swagger em http://localhost:3000/api-docs')
})
