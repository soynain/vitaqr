const express = require('express');
const router = express.Router(); //sirve para exportar a otros archivos
const path = require('path'); //exportar archivos
const siquel = require('../querys/condb.js').siquel;//los module exports nos dejan exportar muchos objetos
const cryptar = require('../querys/moduloCrypt') //cuando hay archivos en la misma carpeta, ponemos dos puntos
const passport = require('passport')
const QRCode = require('qrcode')
const ox = require('crypto');
var block = false; //no puedo acceder a rutas de acceso y login

function loggedIn(req, res, next) { //middleware para no acceder a rutas de usuario
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/users/login');
  }
}
function blocki(req, res, next) { //middleware para no acceder a rutas de registro y login
  if (block == true) {
    res.redirect('/users/profile')
  } else {
    next();
  }
}


function generatePassword(wishlist = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz') {
  return Array.from(ox.randomFillSync(new Uint8Array(8)))
    .map((x) => wishlist[x % wishlist.length])
    .join('').toString();
}

router.get('/login', blocki, (req, res) => {
  const typee = 'none'
  res.render('login.ejs', mens = { typee });
})
router.get('/recuperarContra', (req, res) => {
  res.sendFile("recuPass.html", { root: path.join(__dirname, '../views') })
})
router.get('/successRecovery', (req, res) => {
  res.sendFile("successRecov.html", { root: path.join(__dirname, '../views') })
})
/*router.get('/register', blocki, (req, res) => {
  res.render('registro.ejs');
})*/

router.get('/profile/logout', loggedIn, function (req, res) {
  req.logout();
  res.redirect('/users/login');
  block = false;  //middleware para poder acceder a login y register
});

router.get('/profile/edit', loggedIn, async (req, res) => { //panel principal
  await siquel.execute('SELECT * FROM `contact_info` where id_Prim=?', [req.user.idPrim], (err, results, fields) => {
    if (err)
      throw err;
    //  resAuxiliar=results;
    //  console.log(resAuxiliar)
    if (results.length > 0) {
      res.render('edit.ejs', { results });
    } else {
      res.render('edit.ejs');
    }
  }
  );
});


//obtener la id pulsera del req.user
router.get('/profile', loggedIn, (req, res) => { //mandar a renderizar el blob desde la bdd
  block = true;
  siquel.execute('select image from `blob_temp` where id=?', [req.user.idPulsera], (err, results, fields) => {
    if (err) throw err;
    //console.log(results)
    console.log(results)
    let data = results[0].image;
    let extra = req.user.idPulsera;
    res.render('profile', optionss = { data, extra })
    //  res.send('<p>a guebo</p>')
  })
})

/*router.get("/profile/panelInfoBasica", loggedIn, (req, res) => {
  siquel.execute('select fullname, numTelefono, fechaNac, sexo, color_ojos, altura, peso from user_prof where idPrim=?',
    [req.user.idPrim], (err, results, fields) => {
      if (err) throw err;
      console.log(results)
      console.log(results[0].idDoctor)
      res.render('editarDatos.ejs', { results })
    })
})*/

router.get('/profile/privacidad', loggedIn, async (req, res) => {
  try {
    const [rows] = await siquel.query('select idvis, inf_bas, contactos, alergias, padecimientos, medicamentos, medico from user_prof inner join visibilidad on visibilidad.idvis=user_prof.idPrim where idPulsera=?', [req.user.idPulsera])
    console.log(rows)
    res.render('editPrivacidad', { rows: rows })
  } catch (error) {
    console.log(error)
    res.redirect('/users/profile')
  }

})

router.post('/profile/privacidad/save', loggedIn, async (req, res) => {
  const { inf_bas = 0, contactos = 0, alergias = 0, padecimientos = 0, medicamentos = 0,
    medico = 0 } = req.body;
  try {
    await siquel.execute(
      'update `visibilidad` set inf_bas=?,contactos=?,alergias=?,padecimientos=?,medicamentos=?,medico=? where idvis=?',
      [inf_bas, contactos, alergias, padecimientos, medicamentos, medico, req.user.idPrim]);
    return res.redirect('/users/profile')
    console.log('hecho')
  } catch (err) {
    console.log(err)
    console.log('diablos')
    return res.redirect('/users/profile/privacidad')
  }
})

//rutas post
router.post('/profile/edit/qr-update', loggedIn, async (req, res) => { //editar contactos existentes, el where se modifica con el foreign ke
  const idPulsera = generatePassword()
  /*const especificaciones = {
    text: "https://vitaqr.herokuapp.com/show_public_profile/" + idPulsera,
    width: 21,
    height: 21
  }*/
  QRCode.toDataURL(`https://vitaqr.herokuapp.com/show_public_profile/${idPulsera}`, function (err, url) {
   // console.log(url)
    siquel.query('update `blob_temp` set image=? where id=?', [url, req.user.idPulsera], (err, results, fields) => {
      if (err) throw err;
   //   console.log(data)
      console.log('código QR ACTUALIZADO')
      siquel.query('update `blob_temp` set id=? where id=?', [idPulsera, req.user.idPulsera], (err, results, fields) => {
        if (err) throw err;
   //     console.log(data)
        console.log('código QR ACTUALIZADO')
        req.user.idPulsera = idPulsera;
        res.redirect('/users/profile')
      })
    })
  })
})


router.post('/profile/edit/info-edit', loggedIn, async (req, res) => { //editar contactos existentes, el where se modifica con el foreign ke
  siquel.execute('UPDATE `contact_info` set nombreCompleto = ?, relacion = ?, telefono = ? where id=?',
    [req.body.nombreCont, req.body.relacionCont, req.body.telefonoCont, req.body.nombreCompletoAnterior], (err, results, fields) => {
      if (err) throw err;
      console.log('usuario modificado')
      res.redirect('/users/profile/edit')
    });
})

router.post('/profile/edit/info-new-entry', loggedIn, async (req, res) => { //insertar nuevo contacto, no muchas modificaciones mas que el foreign key
  try {
    const [rows, fields] = await siquel.query('INSERT INTO `contact_info` values(null,?, ?, ?, ?)', [req.user.idPrim, req.body.nombreCont, req.body.relacionCont, req.body.telefonoCont]);
    console.log('usuario registrado')
    res.redirect('/users/profile/edit')
  } catch {
    console.log('error actualizando')
    res.redirect('/users/profile/edit')
  }

})

router.post('/profile/edit/info-delete', loggedIn, async (req, res) => { //insertar nuevo contacto, no muchas modificaciones mas que el foreign key
  siquel.query('DELETE FROM `contact_info` where id=?', [req.body.nombre], (err, results, fields) => {
    if (err) throw err;
    console.log('usuario eliminado')
    res.redirect('/users/profile/edit')
  }
  );
})

//en registro se crea un id aleatorio, se insertan los campos principales
//y luego se genera el qr con el id aleatorio y se inserta en blob_temp
/*router.post('/register', async (req, res) => {
  let errors = [] //es como una implementación chafa de la libreria req.flash
  const idPulsera = generatePassword()
  if (!req.body.nombres || !req.body.usuario || !req.body.contra) {
    errors.push({ msg: "llena todos los campos" })
  }
  if (errors.length > 0) {
    res.render('registro', errors = { errors }) //buscar un flash
  } else {
    const hash = await cryptar.encryptPassword(req.body.contra) //se encriptar contraseñas, asincrono
    const especificaciones = {
      text: "https://vitaqr.herokuapp.com/show_public_profile/" + idPulsera,
      width: 21,
      height: 21
    }
    QRCode.toDataURL(`https://vitaqr.herokuapp.com/show_public_profile/${idPulsera}`, function (err, url) {
      console.log(url)
      siquel.query('INSERT INTO `blob_temp` values(?, ?)', [idPulsera, data], (err, results, fields) => {
        if (err) throw err;
        console.log(data)
        console.log('código QR guardado')
        siquel.query('INSERT INTO `user_prof` values(null,?,?,?,?,null,null,null,null,null,null,1)', [req.body.nombres, req.body.usuario, hash, idPulsera], (err, results, fields) => {
          if (err) throw err;
          console.log(results)
          siquel.query('INSERT INTO `visibilidad` values(?,1,1,1,1,1,1)', [results.insertId], (err, results, fields) => {
            if (err) throw err;
            console.log('usuario registrado')
            res.render('login', exito = { mensaje: 'ya puede iniciar sesion' })
          })
        })
      })
    })
  }
});*/

router.post('/login', (req, res) => { //no hace falta modificar la autenticación
  var mensaje = ''

  if (!req.body.usuario || !req.body.contra) {
    mensaje = 'Sus campos están vacios, favor de verificar'
  } else {
    mensaje = 'Por favor revise si su usuario y contraseña son correctos'
  }
  passport.authenticate('local.signin', function (err, user) {
    if (err) throw err
    // User does not exist
    if (!user) {
      res.render('login.ejs', mens = { mensaje, typee: 'block' });
      return
    }
    req.logIn(user, function (err) {
      res.redirect('/users/profile/');
      return
    });
  })(req, res);
  //s block=true;
})
/*
router.post('/profile/panelInfoBasica/modDatos', loggedIn, async (req, res) => {
  const reqObj = req.body
  console.log(reqObj)
  console.log(reqObj.fullname)
  console.log(reqObj.color_ojos)
  console.log(reqObj.numTelefono)
  console.log(reqObj.altura.toString())
  console.log(reqObj.fechaNac)
  console.log(reqObj.sexo)
  console.log(reqObj.peso)

  siquel.query('UPDATE `user_prof` SET `fullname` = ? WHERE `user_prof`.`idPrim` = ?;',
    [reqObj.fullname, req.user.idPrim],
    function (err, results, fields) {
      if (err) throw err;
      console.log(`primera query ejecutada`)
      siquel.query('UPDATE `user_prof` SET `color_ojos` = ? WHERE `user_prof`.`idPrim` = ?;',
        [reqObj.color_ojos, req.user.idPrim],
        function (err, results, fields) {
          if (err) throw err;
          console.log(`segundaa query ejecutada`)
          siquel.query('UPDATE `user_prof` SET `numTelefono` = ? WHERE `user_prof`.`idPrim` = ?;',
            [reqObj.numTelefono, req.user.idPrim],
            function (err, results, fields) {
              if (err) throw err;
              console.log(`tercera query ejecutada`)
              siquel.query('UPDATE `user_prof` SET `altura` = ? WHERE `user_prof`.`idPrim` = ?;',
                [reqObj.altura.toString(), req.user.idPrim],
                function (err, results, fields) {
                  if (err) throw err;
                  console.log(`cuarta query ejecutada`)
                  siquel.query('UPDATE `user_prof` SET `fechaNac` = ? WHERE `user_prof`.`idPrim` = ?;',
                    [reqObj.fechaNac, req.user.idPrim],
                    function (err, results, fields) {
                      if (err) throw err;
                      console.log(`quinta query ejecutada`)
                      siquel.query('UPDATE `user_prof` SET `sexo` = ? WHERE `user_prof`.`idPrim` = ?;',
                        [reqObj.sexo, req.user.idPrim],
                        function (err, results, fields) {
                          if (err) throw err;
                          console.log(`sexta query ejecutada`)
                          siquel.query('UPDATE `user_prof` SET `peso` = ? WHERE `user_prof`.`idPrim` = ?;',
                            [reqObj.peso, req.user.idPrim],
                            function (err, results, fields) {
                              if (err) throw err;
                              console.log(`septima query ejecutada`)
                              res.redirect('/users/profile')
                            });
                        });
                    });
                });
            });
        });
    });
})*/


module.exports = router