// levantamos las variables de entorno de .env
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const stripe = require('stripe')(process.env.STRIPE_SK) 
const db = require('./db')

// aca ponermos las funciones que consultan la base de datos

// buscamos un cliente por su cuenta de correo
const getClienteByEmail = async (email) => {
  try {
    const rows = await db.query(
      `SELECT * FROM public.clientes WHERE email = '${email}'`
    )
    return rows
  } catch (error) {
    console.error(error.message)
    return []
  }
}

const insertCliente = async (cliente) => {
  try {
    const strInsert = `INSERT INTO public.clientes (nombre_completo, email, stripe_id, stripe_object) VALUES ( '${cliente.name}', '${cliente.email}', '${cliente.id}', '${JSON.stringify(cliente)}'  ) RETURNING id;`
    //console.log(strInsert)
    const rows = await db.query(strInsert)
    return rows
  } catch (error) {
    console.error(error.message)
    return []
  }
}

const insertPago = async (payment) => {
  try {
    const strInsert = `INSERT INTO public.pagos (cliente_id, monto) VALUES ( ${payment.cliente_id}, ${payment.monto} ) RETURNING id;`
    //console.log(strInsert)
    const rows = await db.query(strInsert)
    return rows
  } catch (error) {
    console.error(error.message)
    return []
  }
}

const updatePago = async (pago_id, cliente_id, response_stripe) => {
  try {
    const strUpdate = `UPDATE public.pagos SET cliente_id=${cliente_id}, response_stripe = '${JSON.stringify(response_stripe)}', status='A' WHERE id = ${pago_id} RETURNING *;`
    //console.log(strUpdate)
    const rows = await db.query(strUpdate)
    return rows
  } catch (error) {
    console.error(
      `Error al actualizar el pago con el ID: ${id}. Mensaje: ${error.message}`
    )
    return []
  }
}

app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json())

// seteamos la carpeta public en la raiz
app.use('/', express.static(__dirname + '/public'))

// aca las rutas
app.post('/pagar', async(req, res) => {
  //console.log(req.body)
  try {
    //console.log(req.body)
    const rowCliente = await getClienteByEmail(req.body.token.email)
    const rowPago = await insertPago({
      cliente_id: 0,
      monto: req.body.monto
    })
    //console.log(rowCliente)
    //console.log(rowPago.data[0].id)
    const pago_id = rowPago.data[0].id
    //return res.status(200).json({status: 200, message: `Ok`})
    if (!rowCliente.length) {
      stripe.customers
        .create({
          name: req.body.token.card.name,
          email: req.body.token.email,
          address: req.body.token.card.adress_line1,
          source: req.body.token.id,
        })
        .then(async(cliente) => {
          //console.log(cliente)
          // aca tenemos que insertar el cliente.
          const rowInsCliente = await insertCliente(cliente)
          console.log(`Nuevo cliente con ID: ${rowInsCliente.data[0].id}`)
          stripe.charges
            .create({
              amount: req.body.monto * 100,
              currency: 'usd',
              customer: cliente.id,
              description: `Compra de producto # .Cliente: ${req.body.token.card.name}`
            })
            .then(async(datos) => {
              console.log(`Pago recibido del cliente: ${cliente.id}: ${req.body.token.card.name}`)
              //console.log(JSON.stringify(datos))
              const rowUpdatePago = await updatePago(pago_id, rowInsCliente.data[0].id, datos)
              //console.log(rowUpdatePayment)
              //console.log(JSON.parse(JSON.stringify(datos)))
              res.status(200).json({status: datos.status})
            })
            .catch((err) => {
              console.error(err.message)
              res
                .status(500)
                .json({ success: false, message: `Error al procesar el pago, charges create` })
            })
        })
        .catch((err) => {
          console.error(err.message)
          res.status(500).json({
            success: false,
            message: `Error al registrar el cliente`,
          })
        })
    } else {
      // Si el cliente ya existe
      const cliente = rowCliente[0]
      stripe.charges
        .create({
          amount: req.body.monto * 100,
          currency: 'usd',
          customer: cliente.stripe_id,
          description: `Compra de producto # .Cliente: ${req.body.token.card.name}`
        })
        .then(async(datos) => {
          console.log(`Cargo al cliente ${cliente.stripe_id}: ${req.body.token.card.name}`)
          const rowUpdatePago = await updatePago(pago_id, cliente.id, datos)
          res.status(200).json({status: datos.status})
        })
        .catch((err) => {
          console.error(`Error al cargar el pago al cliente ${cliente.stripe_id}. Mensaje: ${err.message}`)
          res
            .status(500)
            .json({ success: false, message: `Error al procesar el pago, charges create` })
        })
    }
  } catch (err) {
    console.error(err.message)
    res
      .status(500)
      .json({ success: false, message: `Error al procesar el pago` })
  }
})


app.listen(process.env.PORT, process.env.HOST, (err) => {
  if (err) {
    // Si hay error al levantar el servicio http
    console.log(err.message)
  } else {
    console.log("Escuchando en http://localhost:3000")
  }
})