const express = require('express');
const router = express.Router(); //sirve para exportar a otros archivos
const path = require('path'); //exportar archivos
const siquel = require('../querys/condb.js').siquel;//los module exports nos dejan exportar muchos objetos
const cryptar = require('../querys/moduloCrypt') //cuando hay archivos en la misma carpeta, ponemos dos puntos
const promisePool = siquel.promise()



router.post('/registrardoctor', async (req, res) => {
   // console.log(req.body)
    const hash = await cryptar.encryptPassword(req.body.userpass)
    try {
        await promisePool.execute('insert into doctor values (null,?,?,?,?,?,?,?,?,?,?)',
            [req.body.nombreCompleto, req.body.cargo,
            req.body.especialidad, req.body.dependencia,
            req.body.clinicaBase, req.body.consultorio,
            req.body.cedulaprofesional, req.body.modalidadtrabajo,
            req.body.username, hash])
        return res.sendStatus(200)
    } catch (err) {
        console.log(err)
        res.sendStatus(401)
    }
})

module.exports = router
