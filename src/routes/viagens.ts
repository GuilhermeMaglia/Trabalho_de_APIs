import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'
import { Transportes } from "../../generated/prisma/enums"

const router = Router()

const viagemSchema = z.object({
  destino: z.string().min(3, 'Destino deve ter no mínimo 3 caracteres').max(60, 'Destino deve ter no máximo 60 caracteres'),
  transporte: z.nativeEnum(Transportes),
  dataSaida: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg)
    return arg
  }, z.date()),
  dataRetorno: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg)
    return arg
  }, z.date()),
  roteiro: z.string().optional(),
  localSaida: z.string().optional(),
  Nvagas: z.number().int().nonnegative({ message: "Número de vagas deve ser zero ou maior" })
}).refine((data) => data.dataRetorno > data.dataSaida, {
  message: 'Data de retorno deve ser posterior à data de saída',
  path: ['dataRetorno']
})

router.get("/", async (req, res) => {
  try {
    const viagens = await prisma.viagem.findMany({
      include: {
        reservas: {
          include: {
            cliente: true
          }
        }
      }
    })
    res.status(200).json(viagens)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) {
    res.status(400).json({ erro: "ID inválido" })
    return
  }

  try {
    const viagem = await prisma.viagem.findUnique({
      where: { id },
      include: {
        reservas: {
          include: {
            cliente: true
          }
        }
      }
    })

    if (!viagem) {
      res.status(404).json({ erro: "Viagem não encontrada" })
      return
    }

    res.status(200).json(viagem)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  const valida = viagemSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { destino, transporte, dataSaida, dataRetorno, roteiro, localSaida, Nvagas } = valida.data

  try {
    const viagem = await prisma.viagem.create({
      data: {
        destino,
        transporte,
        dataSaida,
        dataRetorno,
        roteiro,
        localSaida,
        Nvagas
      }
    })

    res.status(201).json(viagem)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.put("/:id", async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) {
    res.status(400).json({ erro: "ID inválido" })
    return
  }

  const valida = viagemSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { destino, transporte, dataSaida, dataRetorno, roteiro, localSaida, Nvagas } = valida.data

  try {
    const viagemAtual = await prisma.viagem.findUnique({ where: { id } })
    if (!viagemAtual) {
      res.status(404).json({ erro: "Viagem não encontrada" })
      return
    }

    if (Nvagas < viagemAtual.Nreservas) {
      res.status(400).json({ erro: "Número de vagas deve ser maior ou igual ao total de reservas já realizadas" })
      return
    }

    const viagem = await prisma.viagem.update({
      where: { id },
      data: {
        destino,
        transporte,
        dataSaida,
        dataRetorno,
        roteiro,
        localSaida,
        Nvagas
      }
    })

    res.status(200).json(viagem)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.delete("/:id", async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) {
    res.status(400).json({ erro: "ID inválido" })
    return
  }

  try {
    const viagem = await prisma.viagem.delete({ where: { id } })
    res.status(200).json(viagem)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

export default router
