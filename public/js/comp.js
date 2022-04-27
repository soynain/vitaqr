const closee = document.getElementById('closeBtn')
const editar = document.getElementById('editPrincBtn')
const QReditar = document.getElementById('editQRBtn')
const infBasRed=document.getElementById('infBasRed')
const privacidadBtn=document.getElementById('privacidadBtn')
var reemplazado = false;

window.addEventListener("load", function (event) {
  if (sessionStorage.getItem('rem') === 'true') {
    sessionStorage.removeItem('rem')
    swal("tu código qr ha sido reemplazado");
  }
});
QReditar.addEventListener('click', () => {
  swal("¿Quieres renovar tu código QR?", {
    buttons: {
      confirmar: {
        text: "si",
        value: "true",
      },
      cancelar: {
        text: "no",
        value: "false",
      }
    },
  }).then((value) => {
    switch (value) {

      case "false":
        swal("tu código qr sigue intacto");
        break;

      case "true":
        try {
          fetch('/users/profile/edit/qr-update', {  //responde nos devuelve un objeto con parametros varios
            method: 'POST',
            redirect: 'follow'
          }).then(response => {
            console.log(response)
            sessionStorage.setItem('rem', 'true')
            window.location.href = response.url; //paece este método es para redirigir a páginas por medio de respuesta del backend             

          });
        } catch (err) {
          console.error(`Error: ${err}`);
        }

        break;
    }
  });
  /* const r = confirm("¿Quieres renovar tu código QR?");
  if (r == true) {
    try {     
     await fetch('/users/profile/edit/qr-update', {  //responde nos devuelve un objeto con parametros varios
       method: 'POST',
       redirect: 'follow' 
     }).then(response =>{
       console.log(response)
       window.location.href = response.url; //paece este método es para redirigir a páginas por medio de respuesta del backend  
       alert('tu codigo qr ha sido actualizado') 
     });
   } catch(err) {
     console.error(`Error: ${err}`);
   }
 } else {
   alert('tu código qr no ha sido reemplazado')
 }*/

})

closee.addEventListener('click', async () => {
  try {
    await fetch('/users/profile/logout', {  //responde nos devuelve un objeto con parametros varios
      method: 'GET',
      redirect: 'follow'
    }).then(response => {
      if (response.redirected) {
        window.location.href = response.url; //paece este método es para redirigir a páginas por medio de respuesta del backend
      }
    });

  } catch (err) {
    console.error(`Error: ${err}`);
  }
});
editar.addEventListener('click', async () => {
  try {
    await fetch('/users/profile/edit', {  //responde nos devuelve un objeto con parametros varios
      method: 'GET',
      redirect: 'follow'
    }).then(response => {
      console.log(response)
      window.location.href = response.url; //paece este método es para redirigir a páginas por medio de respuesta del backend

    });
  } catch (err) {
    console.error(`Error: ${err}`);
  }
});

/*infBasRed.addEventListener('click', async()=>{
  try {
    await fetch('/users/profile/panelInfoBasica', {  //responde nos devuelve un objeto con parametros varios
      method: 'GET',
      redirect: 'follow'
    }).then(response => {
      console.log(response)
      window.location.href = response.url; //paece este método es para redirigir a páginas por medio de respuesta del backend
    });
  } catch (err) {
    console.error(`Error: ${err}`);
  }
})*/

privacidadBtn.addEventListener('click', async()=>{
  try {
    await fetch('/users/profile/privacidad', {  //responde nos devuelve un objeto con parametros varios
      method: 'GET',
      redirect: 'follow'
    }).then(response => {
      console.log(response)
      window.location.href = response.url; //paece este método es para redirigir a páginas por medio de respuesta del backend
    });
  } catch (err) {
    console.error(`Error: ${err}`);
  }
})