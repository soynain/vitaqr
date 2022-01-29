const express = require('express');
const router = express.Router(); //sirve para exportar a otros archivos
const path = require('path'); //exportar archivos
const siquel = require('../querys/condb.js').siquel;//los module exports nos dejan exportar muchos objetos
const cryptar = require('../querys/moduloCrypt') //cuando hay archivos en la misma carpeta, ponemos dos puntos
const passport = require('passport')
const QRCode = require('easyqrcodejs-nodejs');
const ox = require('crypto');
var block = false; //no puedo acceder a rutas de acceso y login
const promisePool=siquel.promise()

function loggedIn(req, res, next) { //middleware para no acceder a rutas de usuario
  if (req.isAuthenticated()) {
    next();
  } else {
    res.sendStatus(401)
  }
}
function blocki(req, res, next) { //middleware para no acceder a rutas de registro y login
  if (block == true) {
    res.sendStatus(401)
  } else {
    next();
  }
}



router.get('/failed', (req, res) => {
  res.sendStatus(401)
})

router.get('/datosprincipales', loggedIn, async (req, res) => {
  try {
    const [InformacionPersonal, fields] = await siquel.query(`select fullname,fechaNac,sexo,color_ojos,altura,peso,numTelefono,image from 
    user_prof inner join blob_temp on user_prof.idPrim=blob_temp.id where idPrim=?`, [req.user.idPrim]);
  //  console.log(InformacionPersonal)
    if (Object.keys(InformacionPersonal).length !== 0) {
      return res.json({ InformacionPersonal });
    } else {
      return res.sendStatus(404)
    }
  } catch (err) {
    console.log(err)
    res.sendStatus(401)
  }
})

router.get('/contactos',loggedIn, async (req, res) => {
  try { 
    const [Contactos,fields] = await promisePool.query('select nombreCompleto, relacion, telefono from contact_info inner join user_prof on contact_info.id_Prim=user_prof.idPrim where id_Prim=?' , [req.user.idPrim]);
  //  console.log(Contactos);
   if (Contactos.length!==0) {
      return res.json({ Contactos });
    } else {
      return res.sendStatus(404)
    }
  } catch (err) {
    console.log(err)
    res.sendStatus(401)
  }
})

router.post('/login',
  passport.authenticate('local.signin', {
    failureRedirect: '/mobile/failed'
  }), (req, res) => {
    res.sendStatus(200)
  }
)



module.exports = router