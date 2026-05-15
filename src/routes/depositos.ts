import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { includes, z } from "zod"
import { Tipos } from "../../generated/prisma/enums";

const router = Router()

export const depositoSchema = z.object({
    alunoId: z.number().int()
      .positive('ID do aluno deve ser um número positivo'),
    tipo: z.enum(Tipos),
    valor: z.number()
      .positive('Valor deve ser um número positivo'),
})

router.get("/", async (req, res) => {
    try {
        const depositos = await prisma.deposito.findMany({
            include: { aluno: true }
        })
        res.status(200).json(depositos)
    } catch (error) {
        res.status(500).json({ erro: "Erro no servidor" })
    }
})

router.post("/", async (req, res) => {
    const valida = depositoSchema.safeParse(req.body)

    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    // Desestrutura os dados validados
    const { alunoId, valor, tipo } = valida.data

    const aluno = await prisma.aluno.findUnique({
        where: { id: alunoId }
    })

    if (!aluno) {
        res.status(404).json({ erro: 'Aluno não cadastrado' })
        return
    }

    try {
        // Transação para incluir o depósito e alterar o saldo do aluno
        const [deposito, aluno] = await prisma.$transaction([
           prisma.deposito.create({ data: { alunoId, tipo, valor }}),
           prisma.aluno.update({
            data: { saldo: { increment: valor }},
            where: { id: alunoId }
           })
        ])        
        res.status(201).json({deposito, aluno})
    } catch (error) {
        res.status(500).json({ error })
    }
})

/*
router.put("/:id", async (req, res) => {
    // recebe o id passado como parâmetro
    const { id } = req.params

    const valida = jogadorSchema.safeParse(req.body)
    if (!valida.success) {
        res.status(400).json({ erro: valida.error })
        return
    }

    // Desestrutura os dados validados
    const { nome, posicao, selecaoId, dataNasc, numCamisa } = valida.data

    try {
        const jogador = await prisma.jogador.update({
            where: { id: Number(id) },
            data: { nome, posicao, selecaoId, dataNasc, numCamisa }
        })
        res.status(200).json(jogador)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.delete("/:id", async (req, res) => {
    // recebe o id passado como parâmetro
    const { id } = req.params

    // realiza a exclusão do jogador
    try {
        const jogador = await prisma.jogador.delete({
            where: { id: Number(id) }
        })
        res.status(200).json(jogador)
    } catch (error) {
        res.status(500).json({ erro: error })
    }
})

router.get('/:id', async (req, res) => {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
        res.status(400).json({ erro: 'Código inválido' })
        return
    }

    try {
        const jogador = await prisma.jogador.findUnique({
            where: { id }
        })

        if (!jogador) {
            res.status(404).json({ erro: 'Jogador não cadastrado' })
            return
        }

        res.status(200).json(jogador)
    } catch (error) {
        console.log(error)
        res.status(500).json({ erro: 'Erro interno do servidor' })
    }
})
*/

export default router