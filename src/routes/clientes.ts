import { prisma } from "../../lib/prisma"
import { Router } from "express"
import { z } from "zod"
import nodemailer from "nodemailer"

const router = Router()

const clienteSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve possuir no mínimo com 3 caracteres')
    .max(40, 'Nome deve ter no máximo 40 caracteres'),
  email: z.email(),
  obs: z.string().optional()
})

router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany()
    res.status(200).json(clientes)
  } catch (error) {
    res.status(500).json({ erro: "Erro no servidor" })
  }
})

router.post("/", async (req, res) => {
  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  // Desestrutura os dados validados
  const { nome,email, obs = "" } = valida.data

  try {
    const cliente = await prisma.cliente.create({
      data: { nome, email, obs }
    })
    res.status(201).json(cliente)
  } catch (error) {
    res.status(500).json({ error })
  }
})

router.put("/:id", async (req, res) => {
  const { id } = req.params

  const valida = clienteSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { nome, email, obs } = valida.data

  try {
    const cliente = await prisma.cliente.update({
      where: { id: Number(id) },
      data: { nome, email, obs }
    })
    res.status(200).json(cliente)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

router.delete("/:id", async (req, res) => {
  const { id } = req.params

  try {
    const cliente = await prisma.cliente.delete({
      where: { id: Number(id) }
    })
    res.status(200).json(cliente)
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
    const cliente = await prisma.cliente.findUnique({
      where: { id }
    })

    if (!cliente) {
      res.status(404).json({ erro: 'Cliente não cadastrado' })
      return
    }

    res.status(200).json(cliente)
  } catch (error) {
    console.log(error)
    res.status(500).json({ erro: 'Erro interno do servidor' })
  }
})

function gerarTabelaHTML(dados: any) {
  const clienteNome = dados?.nome ?? 'Cliente'
  const clienteEmail = dados?.email ?? ''
  const reservas = Array.isArray(dados?.reservas) ? dados.reservas : []

  let html = `
    <html>
    <body style="font-family: Helvetica, Arial, sans-serif;">
    <h2>Relatório de Reservas e Viagens</h2>
    <h3>Cliente: ${clienteNome}</h3>
    ${clienteEmail ? `<h4>Email: ${clienteEmail}</h4>` : ''}
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <thead style="background-color: rgb(195, 191, 191);">
        <tr>
          <th>Data</th>
          <th>Tipo</th>
          <th>Descrição</th>
          <th>Valor R$</th>
        </tr>
      </thead>
      <tbody>
  `

  let totalReservas = 0
  for (const reserva of reservas) {
    const data = new Date(reserva.data)
    const dataFormatada = data.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const valor = Number(reserva.preco ?? 0)
    totalReservas += valor
    const destino = reserva.viagem?.destino ?? 'Destino não informado'
    const transporte = reserva.viagem?.transporte ?? 'Desconhecido'

    html += `
      <tr>
        <td>${dataFormatada}</td>
        <td>Reserva</td>
        <td>${reserva.pacote} - ${destino} (${transporte})</td>
        <td style="text-align: right;">${valor.toLocaleString('pt-br', { minimumFractionDigits: 2 })}</td>
      </tr>
    `
  }

  if (reservas.length === 0) {
    html += `
      <tr>
        <td colspan="4" style="text-align: center; padding: 16px;">Nenhuma reserva encontrada para este cliente.</td>
      </tr>
    `
  }

  html += `
      <tr style="font-weight: bold; background-color:rgb(235, 232, 232);">
        <td colspan="3" style="text-align: right;">Total Geral:</td>
        <td style="text-align: right;">R$ ${totalReservas.toLocaleString('pt-br', { minimumFractionDigits: 2 })}</td>
      </tr>
  `

  html += `
          </tbody>
        </table>
      </body>
    </html>
  `

  return html
}

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  secure: false, 
  auth: {
    user: process.env.MAILTRAP_EMAIL,
    pass: process.env.MAILTRAP_SENHA
  },
  tls: {
    rejectUnauthorized: false
  }
});


async function enviaEmail(dados: any) {
  const mensagem = gerarTabelaHTML(dados)

  try {
    const info = await transporter.sendMail({
      from: 'Agencia de Viagens <agencia.Viagens@gmail.com>',
      to: dados.email,
      subject: "Relatório de Reservas e Viagens",
      text: "Relatório de Reservas e Viagens",
      html: mensagem,
    });

    console.log("Message sent:", info.messageId);
  } catch (error) {
    console.error("Erro ao enviar email:", error)
    throw error
  }
}

router.get("/email/:id", async (req, res) => {
  const { id } = req.params
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { id: Number(id) },
      include: {
        reservas: {
          include: {
            viagem: true
          }
        }
      }
    })

    if (!cliente) {
      res.status(404).json({ erro: 'Cliente não encontrado' })
      return
    }

    await enviaEmail(cliente)

    res.status(200).json(cliente)
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

const emailIdsSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1)
})

router.post('/email/ids', async (req, res) => {
  const valida = emailIdsSchema.safeParse(req.body)
  if (!valida.success) {
    res.status(400).json({ erro: valida.error })
    return
  }

  const { ids } = valida.data

  try {
    const clientes = await prisma.cliente.findMany({
      where: { id: { in: ids } },
      include: {
        reservas: {
          include: {
            viagem: true
          }
        }
      }
    })

    if (clientes.length === 0) {
      res.status(404).json({ erro: 'Nenhum cliente encontrado para os IDs informados' })
      return
    }

    for (const cliente of clientes) {
      await enviaEmail(cliente)
    }

    res.status(200).json({
      mensagem: `${clientes.length} emails enviados com sucesso`,
      clientes: clientes.map(c => ({ id: c.id, email: c.email }))
    })
  } catch (error) {
    res.status(500).json({ erro: error })
  }
})

export default router