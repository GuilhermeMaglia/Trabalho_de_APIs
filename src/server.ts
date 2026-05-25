import express from 'express'
const app = express()
const port = 3000

import routesClientes from "./routes/cliente"
// import routesDepositos from "./routes/depositos"

app.use(express.json())

app.use("/clientes", routesClientes)
// app.use("/depositos", routesDepositos)

app.get('/', (req, res) => {
  res.send('API: Sistema de Controle de Cantina Escolar')
})

app.listen(port, () => {
  console.log(`Servidor Rodando na Porta: ${port}`)
})
