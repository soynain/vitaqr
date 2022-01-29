const btnDelete = document.querySelectorAll('#delContBtn')
const btnEdit = document.querySelectorAll('#editContBtn')
const auxs = document.querySelectorAll('.nomb')
const formulario = document.getElementById('cambiosForm');
const nombrecompleto = document.getElementById('nombree')
const relaciontxt = document.getElementById('rel')
const telefonotxt = document.getElementById('telee')






var indexx = 0;
btnDelete.forEach((currentValue, index) => (currentValue).addEventListener('click', async () => {
  try {
    await fetch('/users/profile/edit/info-delete', {  //responde nos devuelve un objeto con parametros varios
      method: 'POST', // or 'PUT'
      body: JSON.stringify({ nombre: auxs[index].innerText }), // data can be `string` or {object}!
      headers: {
        'Content-type': 'application/json; charset=UTF-8'
      },
      redirect: 'follow'
    }).then(response => {
      if (response.redirected) {
        window.location.href = response.url; //paece este método es para redirigir a páginas por medio de respuesta del backend
      }
    });
    console.log('hecho')
  } catch (err) {
    console.error(`Error: ${err}`);
  }
}));

btnEdit.forEach((currentValue, index) => (currentValue).addEventListener('click', async () => {
  indexx = index
}));

const enviarIndex = () => {
  console.log(nombrecompleto.value)
  console.log(relaciontxt.value)
  console.log(telefonotxt.value)
  if (nombrecompleto.value !== '' && relaciontxt.value !== '' && telefonotxt.value !== '') {
    if (nombrecompleto.value.match('[0-9]')) {
      alert('Solo se permiten letras en el campo de nombre');
    } else {
      if (relaciontxt.value.match('[0-9]')) {
        alert('Solo se permiten letras en el campo de relación');
      } else {
        if (!telefonotxt.value.match('[a-zA-Z ]')) {
          if (telefonotxt.value.match('[0-9]{10}')) {
            var input = document.createElement('input');//prepare a new input DOM element
            input.setAttribute('name', 'nombreCompletoAnterior');//set the param name
            input.setAttribute('value', auxs[indexx].innerText);//set the value
            input.setAttribute('class', 'form-control')
            input.setAttribute('type', 'text')
            formulario.appendChild(input);//append the input to the form
            formulario.submit();//send with added input}
          }else{
            alert('Solo se permiten números a 10 digitos');
          }
        } else {
          alert('solo se permiten digitos en el campo de teléfono')
        }
      }
    }
  } else {
    alert('Verifique que todos sus campos esten llenos')
  }
}