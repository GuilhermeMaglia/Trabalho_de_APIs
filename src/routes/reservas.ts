import { prisma } from "../../lib/prisma"
import { Router } from 'express'
import { z } from 'zod'
import { Pacotes } from "../../generated/prisma/enums"

const router = Router()

export const reservaSchema = z.object({
  clienteId: z.number().int().positive('ID do cliente deve ser um número positivo'),
  viagemId: z.number().int().positive('ID da viagem deve ser um número positivo'),
  pacote: z.nativeEnum(Pacotes),
  preco: z.number().positive({ message: "Valor deve ser positivo" })
})

router.get("/", async (req, res) => {
  try {
    const reservas = await prisma.reserva.findMany({
      include: {
        cliente: true,
        viagem: true
      }
    })
    res.status(200).json(reservas)
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
    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: {
        cliente: true,
        viagem: true
      }
    })

    if (!reserva) {
      res.status(404).json({ erro: "Reserva não encontrada" })
      return
    }

    res.status(200).json(reserva)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.post("/", async (req, res) => {
  const valida = reservaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { clienteId, viagemId, pacote, preco } = valida.data

  try {
    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } })
    if (!cliente) {
      res.status(400).json({ erro: "Cliente não encontrado" })
      return
    }

    const viagem = await prisma.viagem.findUnique({ where: { id: viagemId } })
    if (!viagem) {
      res.status(400).json({ erro: "Viagem não encontrada" })
      return
    }

    if (viagem.Nvagas <= 0) {
      res.status(400).json({ erro: "Esta viagem não possui vagas disponíveis" })
      return
    }

    const [reserva] = await prisma.$transaction([
      prisma.reserva.create({
        data: {
          clienteId,
          viagemId,
          pacote,
          preco
        }
      }),
      prisma.viagem.update({
        where: { id: viagemId },
        data: {
          Nvagas: { decrement: 1 },
          Nreservas: { increment: 1 }
        }
      })
    ])

    res.status(201).json(reserva)
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

  const valida = reservaSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { clienteId, viagemId, pacote, preco } = valida.data

  try {
    const reservaAtual = await prisma.reserva.findUnique({
      where: { id },
      include: { viagem: true }
    })
    if (!reservaAtual) {
      res.status(404).json({ erro: "Reserva não encontrada" })
      return
    }

    const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } })
    if (!cliente) {
      res.status(400).json({ erro: "Cliente não encontrado" })
      return
    }

    if (viagemId !== reservaAtual.viagemId) {
      const novaViagem = await prisma.viagem.findUnique({ where: { id: viagemId } })
      if (!novaViagem) {
        res.status(400).json({ erro: "Nova viagem não encontrada" })
        return
      }

      if (novaViagem.Nvagas <= 0) {
        res.status(400).json({ erro: "A nova viagem não possui vagas disponíveis" })
        return
      }

      const [reserva] = await prisma.$transaction([
        prisma.reserva.update({
          where: { id },
          data: {
            clienteId,
            viagemId,
            pacote,
            preco
          }
        }),
        prisma.viagem.update({
          where: { id: reservaAtual.viagemId },
          data: {
            Nvagas: { increment: 1 },
            Nreservas: { decrement: 1 }
          }
        }),
        prisma.viagem.update({
          where: { id: viagemId },
          data: {
            Nvagas: { decrement: 1 },
            Nreservas: { increment: 1 }
          }
        })
      ])

      res.status(200).json(reserva)
      return
    }

    const reserva = await prisma.reserva.update({
      where: { id },
      data: {
        clienteId,
        viagemId,
        pacote,
        preco
      }
    })

    res.status(200).json(reserva)
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
    const reserva = await prisma.reserva.findUnique({
      where: { id },
      include: { viagem: true }
    })

    if (!reserva) {
      res.status(404).json({ erro: "Reserva não encontrada" })
      return
    }

    const [deletedReserva] = await prisma.$transaction([
      prisma.reserva.delete({ where: { id } }),
      prisma.viagem.update({
        where: { id: reserva.viagemId },
        data: {
          Nvagas: { increment: 1 },
          Nreservas: { decrement: 1 }
        }
      })
    ])

    res.status(200).json(deletedReserva)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

export default router
