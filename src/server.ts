import express from 'express'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const port = 3000

import routesClientes from "./routes/clientes"
import routesReservas from "./routes/reservas"
import routesViagens from "./routes/viagens"

app.use(express.json())

app.use("/clientes", routesClientes)
app.use("/reservas", routesReservas)
app.use("/viagens", routesViagens)

app.get('/', (req, res) => {
  res.send('API: Sistema de Controle de Viagens e Reservas')
})

app.listen(port, () => {
  console.log(`Servidor Rodando na Porta: ${port}`)
})
