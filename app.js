const express = require('express');
const app = express();
const path = require('path')
const morgan = require('morgan')
const session = require('express-session')
//const MySQLStore=require('express-mysql-session')(session) //para vincularlo a tu session local
const passport = require('passport')
const aux = require('./querys/condb').siquel
const useragent = require('express-useragent');

var port = process.env.PORT || 3000;
app.set('view engine', 'ejs') //el view engine que se usa para modificar html dinamico
require('./querys/auth.js').passport //para inicializar el passport
require('./querys/authmedico').passport

app.use(session({     //es un iniciador de sesión y cookies que se guarda en mysql
  secret: 'pruebases',
  resave: false,
  saveUninitialized: false,
  cookie: { _expires: new Date(253402300000000) }	// sesion muy larga
  // store: new MySQLStore(aux)
}))
app.use(express.static(__dirname + '/public'));  //la página main
app.use(morgan('dev'))  //para VER LOS jsons y los request en consola
app.use(express.json()) //jsons ver en consola
app.use(express.urlencoded({ extended: false })); //no se para que es
app.use(passport.initialize())  //empezar passport
app.use(passport.session())  //multiples sesiones
app.use(useragent.express());

app.get('/', (req, res) => {
  res.render("index");
})


app.use('/users', require('./querys/users'))   //concatenar una dirección con otro conjunto de direcciones
app.use('/show_public_profile', require('./querys/condb').router) //lo mismo que arriba
app.use('/mobile',require('./querys/usersmobile'))
app.use('/medico',require('./querys/usersdesktop'))
app.use('/admin',require('./querys/admindesktop'))

app.listen(port, (req, res) => {
  console.log("estoy escuchando");
});





module.exports = app;





