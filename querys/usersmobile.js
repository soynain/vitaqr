const express = require('express');
const router = express.Router(); //sirve para exportar a otros archivos
const path = require('path'); //exportar archivos
const siquel = require('../querys/condb.js').siquel;//los module exports nos dejan exportar muchos objetos
const cryptar = require('../querys/moduloCrypt') //cuando hay archivos en la misma carpeta, ponemos dos puntos
const passport = require('passport')
const QRCode = require('qrcode')
const ox = require('crypto');
var block = false; //no puedo acceder a rutas de acceso y login
const promisePool = siquel.promise()

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

function generatePassword(wishlist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz') {
  return Array.from(ox.randomFillSync(new Uint8Array(8)))
    .map((x) => wishlist[x % wishlist.length])
    .join('').toString();
}

router.get('/failed', (req, res) => {
  res.sendStatus(401)
})

router.get('/datosprincipales', loggedIn, async (req, res) => {
  console.log(req.user.idPrim)
  try {
    const [InformacionPersonal, fields] = await promisePool.query(`select fullname,fechaNac,sexo,color_ojos,altura,peso,numTelefono,image from 
    user_prof inner join blob_temp on user_prof.idPulsera=blob_temp.id where idPrim=?`, [req.user.idPrim]);
   if (Object.keys(InformacionPersonal[0]).length !== 0) {
      InformacionPersonal[0]['idPulsera'] = req.user.idPulsera
      return res.json({ InformacionPersonal:InformacionPersonal[0] });
    } else {
      return res.sendStatus(404)
    }
  } catch (err) {
    console.log(err)
    res.sendStatus(401)
  }
})

router.get('/contactos', loggedIn, async (req, res) => {
  try {
    const [Contactos, fields] = await promisePool.query('select id, nombreCompleto, relacion, telefono from contact_info inner join user_prof on contact_info.id_Prim=user_prof.idPrim where id_Prim=?', [req.user.idPrim]);
    // console.log(req.useragent);
    if (Contactos.length !== 0) {
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
    block = true;
  }
)

router.post('/mod-informacion-personal', loggedIn, async (req, res) => {
  const { fullname, fechaNac, sexo, color_ojos, altura, peso, numTelefono } = req.body
  try {
    await promisePool.query('update user_prof set fullname=?,fechaNac=?,sexo=?,color_ojos=?,altura=?,peso=?,numTelefono=? where idPrim=?',
      [fullname, new Date(fechaNac), sexo, color_ojos, altura, peso, numTelefono, req.user.idPrim]);
    return res.sendStatus(200)
  } catch (err) {
    console.log(err)
    return res.sendStatus(500)
  }
})

router.post('/add-contacto', loggedIn, async (req, res) => {
  const { id_Prim, nombreCompleto, relacion, telefono } = req.body
  try {
    await promisePool.execute('insert into contact_info values (null,?,?,?,?)', [id_Prim, nombreCompleto, relacion, telefono])
    return res.sendStatus(200)
  } catch (err) {
    console.log(err)
    res.sendStatus(500)
  }
})

router.post('/delete-contacto', loggedIn, async (req, res) => {
  const { id, nombreCompleto, relacion } = req.body
  try {
    await promisePool.execute('delete from contact_info where id=? and nombreCompleto=? and relacion=?', [id, nombreCompleto, relacion])
    return res.sendStatus(200)
  } catch (err) {
    console.log(err)
    res.sendStatus(500)
  }
})

router.post('/renovar-qr', loggedIn, async (req, res) => {
  const { idPulsera } = req.body
  const newIdPulsera = generatePassword()
  const data = await QRCode.toDataURL(`https://vitaqr.herokuapp.com/show_public_profile/${newIdPulsera}`)
  try {
    await promisePool.query('update blob_temp set image=? where id=?', [data, idPulsera]);
    try {
      await promisePool.query('update blob_temp set id=? where id=?', [newIdPulsera, idPulsera]);
      return res.sendStatus(200)
    } catch (err) {
      console.log(err, ' segundo update')
      return res.sendStatus(500)
    }
  } catch (err) {
    console.log(err, ' primer update')
    return res.sendStatus(500)
  }
})

router.get('/logout', loggedIn, (req, res) => {
  req.logout();
  res.sendStatus(200)
  block = false;
});


module.exports = router