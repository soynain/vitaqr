const camposFormularioDesactivados=document.querySelectorAll('.camposBloqueados')
const btnActivarCampos=document.getElementsByClassName('btnActivar')[0]
const btnEnviar=document.getElementsByClassName('btnEnviar')[0]


btnActivarCampos.addEventListener('click', ()=>{
    camposFormularioDesactivados.forEach(campo=>{
        campo.disabled=false
    })
    btnActivarCampos.disabled=true;
    btnEnviar.disabled=false;
})
