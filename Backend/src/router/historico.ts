import express = require('express');
import { promisePool } from '../db/db'

const router = express.Router()

/**
 * @swagger
 * /historico/points:
 *   post:
 *     summary:Registra um histórico de pontos (ex: ao ler QR code)
 *     tags:
 *       - Histórico
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *               - iduser
 *               - points
 *             properties:
 *               id:
 *                 type: string
 *               iduser:
 *                 type: string
 *               points:
 *                 type: number
 *     responses:
 *       201:
 *         description: Histórico de points registrado com sucesso
 *       400:
 *         description: Campos obrigatórios ausentes
 *       500:
 *         description: Erro interno
 */
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

/**
 * @swagger
 * /historico/transacoes:
 *   post:
 *     summary:Registra um histórico de transações (ex: ao realizar troca)
 *     tags:
 *       - Histórico
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - iduser
 *               - description
 *               - points
 *             properties:
 *               iduser:
 *                 type: string
 *               description:
 *                 type: string
 *               points:
 *                 type: number
 *     responses:
 *       201:
 *         description: Histórico de transação registrado com sucesso
 *       400:
 *         description: Campos obrigatórios ausentes
 *       500:
 *         description: Erro interno
 */

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

/**
 * @swagger
 * /historico/{iduser}:
 *   get:
 *     summary: Obtém histórico combinado (points + transações) por intervalo de datas
 *     tags:
 *       - Histórico
 *     parameters:
 *       - in: path
 *         name: iduser
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: dataInicio
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dataFim
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Histórico combinado retornado com sucesso
 *       400:
 *         description: Datas não fornecidas
 *       500:
 *         description: Erro interno
 */
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

/**
 * @swagger
 * /historico/todos/{iduser}:
 *   get:
 *     summary: Obtém todos os históricos (points + transações) sem filtro de data
 *     tags:
 *       - Histórico
 *     parameters:
 *       - in: path
 *         name: iduser
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Histórico completo retornado com sucesso
 *       500:
 *         description: Erro interno
 */

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

/**
 * @swagger
 * /historico/{tabela}/{registroId}:
 *   put:
 *     summary: Atualiza pontos ou descrição por ID e tabela
 *     tags:
 *       - Histórico
 *     parameters:
 *       - in: path
 *         name: tabela
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - histPoints
 *             - histtransactions
 *       - in: path
 *         name: registroId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               points:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registro atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno
 */
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

/**
 * @swagger
 * /historico/{tabela}/{id}:
 *   delete:
 *     summary: Remove registro de pontos ou transações por ID
 *     tags:
 *       - Histórico
 *     parameters:
 *       - in: path
 *         name: tabela
 *         required: true
 *         schema:
 *           type: string
 *           enum:
 *             - histPoints
 *             - histtransactions
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registro removido com sucesso
 *       400:
 *         description: Tabela inválida
 *       500:
 *         description: Erro interno
 */
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
