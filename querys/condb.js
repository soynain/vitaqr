const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const path = require('path')
const util = require('util')
//require('dotenv').config()


const siquel = mysql.createPool({ 
  host: process.env.HOST_NAME,
  port: process.env.PORTDB,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 1,
  timezone:'+00:00'
});





router.get('/:id', async (req, res) => {
  let searchValid = req.params.id
  const promisePool = siquel.promise()
  let perQuery={},contactQuery=[],privacyOpc={}
  try {
    const [results, fields] = await promisePool.execute('SELECT * FROM `user_prof` where idPulsera = ?', [searchValid])
    if (results.length > 0) {
      perQuery = results[0]   //hay que hacer esto para acceder al objeto, es un array de objetos
      console.log(perQuery)
      try {
        const [results1, fields] = await promisePool.execute
          ('select id, nombreCompleto, relacion, telefono from `user_prof` inner join `contact_info` on contact_info.id_prim=user_prof.idPrim where idPulsera=?',
            [searchValid])
        contactQuery = results1;
        console.log(contactQuery)
      } catch (err) {
        console.log(err, ' segunda query')
        return res.sendStatus(400)
      }
      try {
        const [results2, fields] = await promisePool.execute('select idvis,inf_bas,contactos,alergias,padecimientos,medicamentos,medico from `user_prof` inner join visibilidad on visibilidad.idvis=user_prof.idPrim where idPulsera=?'
          , [searchValid])
        privacyOpc = results2[0]
        console.log(privacyOpc)
        if(req.useragent.isDesktop || req.useragent.browser!=='okhttp'){
          return res.render('cons.ejs', { fila1: perQuery, fila2: contactQuery, fila3: privacyOpc })
        }else if(req.useragent.browser==='okhttp' || req.useragent.isBot){
          const obj={InformacionPersonal:perQuery,Contactos:contactQuery,Privacidad:privacyOpc}
          return res.json(obj)
        }
      } catch (err) {
        console.log(err, ' tercera query')
        return res.sendStatus(400)
      }
    } else {
      if(req.useragent.isDesktop){
        return res.send('<h1>NO EXISTE</h1')
      }else{
        return res.sendStatus(404)
      }
    }
  } catch (err) {
    console.log(err, ' primera query');
    return res.sendStatus(400)
  }

  /*console.time('test')
  await siquel.execute('SELECT * FROM `user_prof` where idPulsera = ?', [searchValid], (err, results, fields) => {
    if (err) throw err;
    if (results.length > 0) {
      const perQuery = results[0]   //hay que hacer esto para acceder al objeto, es un array de objetos
      console.log(perQuery)
      siquel.execute
        ('select id, nombreCompleto, relacion, telefono from `user_prof` inner join `contact_info` on contact_info.id_prim=user_prof.idPrim where idPulsera=?',
          [searchValid], (err, results, fields) => {
            if (err) throw err;
            const contactQuery = results;
            console.log(contactQuery)
            siquel.execute('select idvis,inf_bas,contactos,alergias,padecimientos,medicamentos,medico from `user_prof` inner join visibilidad on visibilidad.idvis=user_prof.idPrim where idPulsera=?'
              , [searchValid], (err, results, fields) => {
                const privacyOpc = results[0]
                console.log(privacyOpc)
                res.render('cons.ejs', { fila1: perQuery, fila2: contactQuery, fila3: privacyOpc })
                console.timeEnd('test')
              })
          })
    } else {
      res.send('<h1>NO EXISTE<h1>')
    }
  }
  );*/
})

siquel.query = util.promisify(siquel.query) //conviertes al metodo query en algo que puede
//ser asincrono, y usarlo con then si asi lo gustas o con await y async

module.exports = {
  router: router,
  siquel: siquel
}
