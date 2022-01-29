const passport= require('passport')
const LocalStrategy=require('passport-local').Strategy //para verificaciones locales
const siquel=require('../querys/condb').siquel
const cryptar=require('../querys/moduloCrypt')
//no requieres exportar este modulo con module.exports porque ya invocas a todos los passports
//desde app.js, solo debes requerir la ruta al principio en inizializador

//recuerda en los primeros camposn incluyendo el async, poner los nombres de acuerdo al tag NAME
//en HTML, no en id ni class, ponlos igualito. 
//done es para mandar mensajes flash con req.flash
//y confirmarle al passport authenticate que ya termino y puedes ser redirigido
passport.use('local.signin', new LocalStrategy({
    usernameField: 'usuario',
    passwordField: 'contra',
    passReqToCallback: true
  }, async (req, usuario, contra, done) => {
    const rows = await siquel.query('SELECT * FROM `user_prof` WHERE usuario = ?', [usuario]);
    if (rows.length > 0) {
      //rows son filas, 0 que almacenaras una fila, y user es el objeto con las columnas
      const user = rows[0];  
      const validPassword = await cryptar.matchPassword(contra, user.userpass)
      if (validPassword) {
       done(null, user);
      }else{
       done(null, false);
      }
    }else{
      return done(null, false);
    }
  }));

passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser(async (id, done) => {
  console.log(id);
    await siquel.query('SELECT * FROM `user_prof` where idPrim = ?', [id.idPrim],(err, rows)=>{
      done(null, rows[0]);
    });
  });
