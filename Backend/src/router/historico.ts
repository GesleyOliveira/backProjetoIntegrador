import express from 'express'
import { promisePool } from '../db/db'


const router = express.Router()

// POST - Histórico de points (ao ler QR code)
router.post('/historico/points', async (req, res): Promise<void> => {
  const { id, iduser, points } = req.body
 
  if (!id || !iduser || typeof points !== 'number') {
    res.status(400).json({ error: 'Campos obrigatórios: id, iduser, points' })
    return 
  }

  try {
    await promisePool.query(
      'INSERT INTO histPoints (id, iduser, points) VALUES (?, ?, ?)',
      [id, iduser, points]
    )
    res.status(201).json({ message: 'Histórico de points registrado com sucesso' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao registrar histórico de points' })
  }
})

// POST - Histórico de transações (ao realizar troca)
router.post('/historico/transacoes', async (req, res): Promise<void> => {
  const { iduser, description, points } = req.body

  if (!iduser || !description || typeof points !== 'number') {
      res.status(400).json({ error: 'Campos obrigatórios: iduser, description, points' })
      return
  }

  try {
    await promisePool.query(
      'INSERT INTO histtransactions (iduser, description, points) VALUES (?, ?, ?)',
      [iduser, description, points]
    )
    res.status(201).json({ message: 'Histórico de transação registrado com sucesso' })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao registrar histórico de transação' })
  }
})

// ✅ GET - Histórico combinado filtrado por data
router.get('/historico/:iduser', async (req, res): Promise<void> => {
  const { iduser } = req.params
  const { dataInicio, dataFim } = req.query

  if (!dataInicio || !dataFim) {
      res.status(400).json({ error: 'Informe dataInicio e dataFim no formato YYYY-MM-DD' })
      return
  }

  try {
    const [points] = await promisePool.query(
      `SELECT 'ponto' AS tipo, iduser, points, date, id, NULL AS description
       FROM histPoints
       WHERE iduser = ? AND data BETWEEN ? AND ?`,
      [iduser, dataInicio, dataFim]
    )

    const [transacoes] = await promisePool.query(
      `SELECT 'transacao' AS tipo, iduser, points, date, NULL AS id, description
       FROM histtransactions
       WHERE iduser = ? AND data BETWEEN ? AND ?`,
      [iduser, dataInicio, dataFim]
    )

    const resultado = [...(points as any[]), ...(transacoes as any[])]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

    res.json(resultado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar histórico combinado' })
  }
})

// ✅ GET - Todos os históricos (points + transações) SEM filtro de data
router.get('/historico/todos/:iduser', async (req, res): Promise<void> => {
  const { iduser } = req.params

  try {
    const [points] = await promisePool.query(
      `SELECT 'ponto' AS tipo, iduser, points, date, id
       FROM histPoints
       WHERE iduser = ?`,
      [iduser]
    )

    const [transacoes] = await promisePool.query(
      `SELECT 'transacao' AS tipo, iduser, points, date, description
       FROM histtransactions
       WHERE iduser = ?`,
      [iduser]
    )

    const resultado = [...(points as any[]), ...(transacoes as any[])]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

    res.json(resultado)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao buscar histórico completo' })
  }
})

// PUT - Atualizar pontos ou descrição por ID e tabela
router.put('/historico/:tabela/:registroId', async (req, res): Promise<void> => {
  const { tabela, registroId } = req.params
  const { points, description } = req.body

  if (!['histPoints', 'histtransactions'].includes(tabela)) {
    res.status(400).json({ error: 'Tabela inválida. Use histPoints ou histtransactions.' })
    return
  }

  try {
    let query = ''
    let values: any[] = []

    if (tabela === 'histPoints') {
      if (points === undefined) {
        res.status(400).json({ error: 'Campo atualizável obrigatório: points' })
        return
      }

      query = `UPDATE histPoints SET points = ? WHERE id = ?`
      values = [points, registroId]
    }

    if (tabela === 'histtransactions') {
      if (points === undefined && !description) {
        res.status(400).json({ error: 'Campos atualizáveis: points, description' })
        return
      }

      const updates = []
      if (points !== undefined) {
        updates.push('points = ?')
        values.push(points)
      }
      if (description) {
        updates.push('description = ?')
        values.push(description)
      }

      query = `UPDATE histtransactions SET ${updates.join(', ')} WHERE id = ?`
      values.push(registroId)
    }

    await promisePool.query(query, values)
    res.status(200).json({ message: `Registro atualizado na tabela ${tabela}` })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao atualizar registro' })
  }
})


// DELETE - Remover registro de pontos ou transações por ID
router.delete('/historico/:tabela/:id', async (req, res): Promise<void> => {
  const { tabela, id } = req.params

  if (!['histPoints', 'histtransactions'].includes(tabela)) {
    res.status(400).json({ error: 'Tabela inválida. Use histPoints ou histtransactions.' })
    return
  }

  try {
    const [result] = await promisePool.query(
      `DELETE FROM \`${tabela}\` WHERE id = ?`,
      [id]
    )
    res.status(200).json({ message: `Registro removido da tabela ${tabela}` })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Erro ao remover registro' })
  }
})



export default router
