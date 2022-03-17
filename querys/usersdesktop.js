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

router.get('/datosdoctor', loggedIn, async (req, res) => {
    console.log(req.user);
    try {
        const [InfoDoctor, fields] = await promisePool.query('select id,nombreCompleto,cargo,especialidad,dependencia,clinicaBase,consultorio,cedulaprofesional,modalidadtrabajo from doctor where id=?', [req.user.id]);
        if (Object.keys(InfoDoctor[0]).length !== 0) {
            return res.json({ InfoDoctor: InfoDoctor[0] });
        } else {
            return res.sendStatus(404)
        }
    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

router.get('/listapacientes', loggedIn, async (req, res) => {
    try {
        const [ListaPacientesJava, fields] = await promisePool.query(`select user_prof.idPrim,user_prof.nombres,user_prof.apellidos,user_prof.usuario,user_prof.userpass,user_prof.idPulsera,
        user_prof.fechaNac,user_prof.sexo,user_prof.altura,
        user_prof.peso,user_prof.numTelefono,user_prof.idDoctor,user_prof.donanteorg from doctor 
        inner join user_prof on user_prof.idDoctor=doctor.id where doctor.id=?;`, [req.user.id])
        console.log(ListaPacientesJava)
        if (Object.keys(ListaPacientesJava).length !== 0) {
            return res.json({ ListaPacientesJava: ListaPacientesJava });
        } else {
            //contactos no existentes
            return res.sendStatus(404)
        }
    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

router.post('/login',
    passport.authenticate('local.signin2', { failWithError: true }),
    (req, res, next) => {
        console.log(req.body)
        return res.sendStatus(200)
        block = true;
    }, (err, req, res, next) => {
        if (err) {
            return res.sendStatus(401)
        }
    }
)

//y luego se genera el qr con el id aleatorio y se inserta en blob_temp
router.post('/registrarnuevopaciente', loggedIn, async (req, res) => {
    console.log(req.body)
    const { nombres, apellidos, usuario, userpass, fechaNac, sexo, altura, peso, numTelefono, donanteorg } = req.body
    const idPulsera = generatePassword()
    const hash = await cryptar.encryptPassword(userpass) //se encriptar contraseñas, asincrono
    QRCode.toDataURL(`https://vitaqr.herokuapp.com/show_public_profile/${idPulsera}`, function (err, url) {
        //   console.log(url)
        siquel.query('INSERT INTO `blob_temp` values(?, ?)', [idPulsera, url], (err, results, fields) => {
            if (err) throw err;
            //  console.log(data)
            console.log('código QR guardado')
            siquel.query('INSERT INTO `user_prof` values(null,?,?,?,?,?,?,?,?,?,?,?,?)',
                [nombres, apellidos, usuario[0], hash, idPulsera, new Date(fechaNac).toLocaleString('sv').replace(' ', 'T'), sexo, altura, peso, numTelefono, req.user.id, donanteorg], (err, results, fields) => {
                    if (err) throw err;

                    const { insertId } = results
                    /*visibilidad por default open*/
                    siquel.query('INSERT INTO `visibilidad` values(?,1,1,1,1,1,1)',
                        [results.insertId], (err, results, fields) => {
                            if (err) throw err;
                            console.log('usuario registrado')
                            return res.json({ id: insertId })
                        })
                })
        })
    })
});

router.post('/borrarpaciente', loggedIn, async (req, res) => {
    try {
        await promisePool.query('delete from blob_temp where id=?', [req.body.idPulsera])
        return res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

router.post('/mod-datos-paciente', loggedIn, async (req, res) => {
    console.log(req.body)
    const { fechaNac, sexo, altura, peso, numTelefono, donanteOrg, idUsuarioSeleccionado } = req.body
    try {
        await promisePool.query('update user_prof set fechaNac=?,sexo=?,altura=?,peso=?,numTelefono=?,donanteOrg=? where idPrim=?',
            [new Date(fechaNac).toLocaleString('sv').replace(' ', 'T'), sexo, altura, peso, numTelefono, donanteOrg, idUsuarioSeleccionado]);
        return res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

router.get('/listacitas', loggedIn, async (req, res) => {
    console.log(req.get('idPrim'));
    try {
        const [HistorialCitasMedicas, fields] = await promisePool.query(`select * from citasmedicas where idPaciente=? and idMedico=?`
            , [req.get('idPrim'), req.user.id])
        console.log(HistorialCitasMedicas)
        if (Object.keys(HistorialCitasMedicas).length !== 0) {
            return res.json({ HistorialCitasMedicas: HistorialCitasMedicas });
        } else {
            //No hay citas
            return res.sendStatus(404)
        }

    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

router.post('/registrarcita', loggedIn, async (req, res) => {
    const { fechahoracita, motivocita, idPaciente } = req.body;
    try {
        /*TOLOCALEString no te altera la fecha a utc*/
        await promisePool.query('insert into citasmedicas values (null,?,?,?,?)'
            , [new Date(fechahoracita).toLocaleString('sv').replace(' ', 'T')
                , motivocita, idPaciente, req.user.id])
        return res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
    return res.sendStatus(200)
})

router.post('/registraralergia', async (req, res) => {
    //  let ListaAlergias=JSON.parse(req.body.ListaAlergias)
    const ListaAlergias = JSON.parse(req.body.ListaAlergias)
    console.log(ListaAlergias, typeof (ListaAlergias))
    //  let promiseArrayOfQueries = []
    try {
        for (let i = 0; i < Object.keys(ListaAlergias).length; i++) {
            await promisePool.query('insert into alergias values (null,?,?,?,?,?)'
                , [ListaAlergias[i].nombre, ListaAlergias[i].reaccion, ListaAlergias[i].idPac, ListaAlergias[i].sintomas, new Date(ListaAlergias[i].fechaDiagnostico).toLocaleString('sv').replace(' ', 'T')])
        }
        //  Promise.all([promiseArrayOfQueries])
        return res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

router.post('/registrarpadecimiento', async (req, res) => {
    //  let ListaAlergias=JSON.parse(req.body.ListaAlergias)
    const ListaPadecimientos = JSON.parse(req.body.ListaPadecimientos)
    console.log(ListaPadecimientos, typeof (ListaPadecimientos))
    //  let promiseArrayOfQueries = []
    try {
        for (let i = 0; i < Object.keys(ListaPadecimientos).length; i++) {
            await promisePool.execute('insert into padecimientos values (null,?,?,?,?,?)'
                , [ListaPadecimientos[i].nombre, ListaPadecimientos[i].gravedad, ListaPadecimientos[i].causa, new Date(ListaPadecimientos[i].fechaDiagnostico).toLocaleString('sv').replace(' ', 'T'), ListaPadecimientos[i].idPac])
        }
        //  Promise.all([promiseArrayOfQueries])
        return res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

router.post('/registrarmedicamento', async (req, res) => {
    //  let ListaAlergias=JSON.parse(req.body.ListaAlergias)
    const ListaMedicamentos = JSON.parse(req.body.ListaMedicamentos)
    console.log(ListaMedicamentos, typeof (ListaMedicamentos))
    //  let promiseArrayOfQueries = []
    try {
        for (let i = 0; i < Object.keys(ListaMedicamentos).length; i++) {
            await promisePool.execute('insert into medicamentos values (?,?,?,null,?,?)'
                , [ListaMedicamentos[i].nombre, ListaMedicamentos[i].dosis, ListaMedicamentos[i].frecuencia, ListaMedicamentos[i].idPac, new Date(ListaMedicamentos[i].fechaInicio).toLocaleString('sv').replace(' ', 'T')])
        }
        //  Promise.all([promiseArrayOfQueries])
        return res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

router.post('/paciente-baja', loggedIn, (req, res) => {
    siquel.query('insert into bajas(nombres, apellidos, fechaNac, fechaBaja) select nombres, apellidos, fechaNac, now() from user_prof where idPulsera=?', [req.body.idPulsera], (err, results, fields) => {
        if (err) throw err;
        const { insertId } = results
        siquel.query('update bajas set motivoBaja=? where id=?', [req.body.motivoBaja, insertId], (err, results, fields) => {
            if (err) throw err;
            siquel.query('delete from blob_temp where id=?', [req.body.idPulsera], (err, results, fields) => {
                if (err) throw err;
                return res.sendStatus(200)
            })
        })
    })
})

router.post('/actualizar-padecimiento', loggedIn, async (req, res) => {
    const Padecimiento= JSON.parse(req.body.Padecimiento)
    const idRow=req.body.idRow
    try {
        await promisePool.execute('update padecimientos set nombre=?,gravedad=?,causa=?,fechaDiagnostico=? where id=?'
        ,[Padecimiento.nombre,Padecimiento.gravedad,Padecimiento.causa,new Date(Padecimiento.fechaDiagnostico).toLocaleString('sv').replace(' ', 'T'),idRow])
        return res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

router.post('/actualizar-alergia', loggedIn, async (req, res) => {
    const Alergia = JSON.parse(req.body.Alergia)
    const idRow=req.body.idRow
    try {
        await promisePool.execute('update alergias set nombre=?,reaccion=?,sintomas=?,fechaDiagnostico=? where id=?'
        ,[Alergia.nombre,Alergia.reaccion,Alergia.sintomas,new Date(Alergia.fechaDiagnostico).toLocaleString('sv').replace(' ', 'T'),idRow])
        return res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

router.post('/actualizar-medicamento',loggedIn,async(req,res)=>{
   // console.log(req.body)
    const Medicamento = JSON.parse(req.body.Medicamento)
    const idRow=req.body.idRow
    try {
        await promisePool.execute('update medicamentos set nombre=?,dosis=?,frecuencia=?,fechaInicio=? where id=?'
        ,[Medicamento.nombre,Medicamento.dosis,Medicamento.frecuencia,new Date(Medicamento.fechaInicio).toLocaleString('sv').replace(' ', 'T'),idRow])
        return res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

router.post('/borrar-padecimiento',loggedIn,async(req,res)=>{
    console.log(req.body)
    try {
        await promisePool.execute('delete from padecimientos where id=?'
        ,[req.body.idRow])
        return res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

router.post('/borrar-alergia',loggedIn,async(req,res)=>{
    console.log(req.body)
    try {
        await promisePool.execute('delete from alergias where id=?'
        ,[req.body.idRow])
        return res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

router.post('/borrar-medicamento',loggedIn,async(req,res)=>{
    console.log(req.body)
    try {
        await promisePool.execute('delete from medicamentos where id=?'
        ,[req.body.idRow])
        return res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})


router.get('/listaalergias', async (req, res) => {
    console.log(req.get('idPrim'));
    try {
        const [HistorialAlergias, fields] = await promisePool.query(`select * from alergias where idPac=?`
            , [req.get('idPrim')])
        if (Object.keys(HistorialAlergias).length !== 0) {
            return res.json({ HistorialAlergias: HistorialAlergias });
        } else {
            //No hay citas
            return res.sendStatus(404)
        }

    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

router.get('/listapadecimientos', async (req, res) => {
    console.log(req.get('idPrim'));
    try {
        const [HistorialPadecimientos, fields] = await promisePool.query(`select * from padecimientos where idPac=?`
            , [req.get('idPrim')])
        if (Object.keys(HistorialPadecimientos).length !== 0) {
            return res.json({ HistorialPadecimientos: HistorialPadecimientos });
        } else {
            //No hay citas
            return res.sendStatus(404)
        }

    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

router.get('/listamedicamentos', async (req, res) => {
    console.log(req.get('idPrim'));
    try {
        const [HistorialMedicamentos, fields] = await promisePool.query(`select * from medicamentos where idPac=?`
            , [req.get('idPrim')])
        if (Object.keys(HistorialMedicamentos).length !== 0) {
            return res.json({ HistorialMedicamentos: HistorialMedicamentos });
        } else {
            //No hay citas
            return res.sendStatus(404)
        }

    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})


router.get('/logout', loggedIn, (req, res) => {
    req.logout();
    res.sendStatus(200)
    block = false;
});

module.exports = router