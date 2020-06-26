const pg = require('pg')

const postgres = {
  database: process.env.PG_DB,
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASS,
}

module.exports = {
  query: (sqlStr) => {
    return new Promise((resolve, reject) => {
      let client = new pg.Client(postgres)
      client.connect((err) => {
        if (err) {
          reject(err)
        } else {
          client.query(sqlStr, (err, result) => {
            if (err) {
              reject(err)
            } else {
              let datos = {
                data: []
              }
              switch (result.command) {
                case 'SELECT':
                  //console.log(result)
                  resolve(result.rows)
                  break;
                case 'CREATE':
                  console.log('CREATE')
                  resolve(result.command)
                  break;
                case 'INSERT':
                  //console.log('INSERT', result.rowCount)
                  if (result.rowCount > 0) {
                    //console.log(result.rows)
                    datos.data = result.rows
                  }
                  resolve(datos)
                  break;
                case 'UPDATE':
                  //console.log('UPDATE', result.rowCount)
                  if (result.rowCount > 0) {
                    //console.log(result.rows)
                    datos.data = result.rows
                  }
                  resolve(datos)
                  break;
                case 'DELETE':
                  //console.log('UPDATE', result.rowCount)
                  if (result.rowCount > 0) {
                    //console.log(result.rows)
                    datos.data = result.rows
                  }
                  resolve(datos)
                  break;
                default:
                  //console.log('default:', result)
                  //console.log(result)
                  resolve(result)
              }
            }
            client.end()
          })
        }
      })
    })
  }
}