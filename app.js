const API_URL = "http://localhost:8080";

const aviso = document.getElementById('aviso');
const conexiónBadge = document.getElementById('conexión');

function mostrarAviso(mensaje, esError = true) {

    aviso.className = `alert alert-${esError ? 'danger' : 'success'}`;
    aviso.textContent = mensaje;
    setTimeout(() => {
        
        aviso.className = '';
        aviso.textContent = '';

    }, 5000);
}

async function peticion(endpoint, opciones = {}) {

    try {
        const respuesta = await fetch(`${API_URL}${endpoint}`, opciones);
        conexiónBadge.textContent = "Conectado";
        conexiónBadge.className = "badge text-bg-success";

        if(!respuesta.ok){

            const errText = await respuesta.text();
            throw new Error (`Error ${respuesta.status}: ${errText}`);

        }

        if(respuesta.status !== 204 && respuesta.headers.get("content-type")?.includes("application/json")){


            return await respuesta.json();

        }

        return null;
    } catch (error){

        conexiónBadge.textContent = "Error de conexión";
        conexiónBadge.className = "badge text-bg-danger";
        mostrarAviso(error.message);
        throw error;
        
    }

}

const tabs = document.querySelectorAll('.nav-tabs .nav-link');
const secciones = {

    'Torneos': document.getElementById('tabTorneos'),
    'Jugadores': document.getElementById('tabJugadores'),
    'Videojuegos': document.getElementById('tabVideojuegos')

};

tabs.forEach(tab => {

    tab.addEventListener('click', (e) =>{

        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        Object.values(secciones).forEach(sec => sec.hidden = true);
        secciones[e.target.textContent].hidden = false;
    });

});

tabs[1].classList.add('active');

async function cargarJugadores() {
    const jugadores = await peticion('/jugadores');
    const tbody = document.getElementById('cuerpoJugadores');
    const selectJugador = document.getElementById('iJugador');
    tbody.innerHTML = '';
    selectJugador.innerHTML = '<option value=""></option>';
    
    jugadores.forEach(j => {

        tbody.innerHTML += `
            <tr>
                <td>${j.id}</td>
                <td>${j.nick}</td>
                <td>${j.email}</td>
                <td>${j.nivel}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="verTorneosJugador(${j.id}, '${j.nick}')">Torneos</button>
                    <button class="btn btn-sm btn-warning" onclick="editarJugador(${j.id}, '${j.nick}', '${j.email}', ${j.nivel})">Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarJugador(${j.id})">Eliminar</button>
                </td>
            </tr>`;
        selectJugador.innerHTML += `<option value="${j.id}">${j.nick}</option>`;
    });
}

document.getElementById('btnBuscarJugador').addEventListener('click', async () => {
    const id = document.getElementById('buscarJugadorId').value;
    if (!id) return;
    const j = await peticion(`/jugadores/${id}`);
    document.getElementById('resJugador').innerHTML = `<div class="alert alert-info">Encontrado: [${j.id}] ${j.nick} - ${j.email} (Nivel ${j.nivel})</div>`;
});

let jugadorEditandoId = null;
document.getElementById('formJugador').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nick: document.getElementById('jNick').value,
        email: document.getElementById('jEmail').value,
        nivel: parseInt(document.getElementById('jNivel').value)
    };
    
    if (jugadorEditandoId) {
        await peticion(`/jugadores/${jugadorEditandoId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        jugadorEditandoId = null;
        document.getElementById('btnJugador').textContent = "Crear Jugador";
    } else {
        await peticion('/jugadores', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    }
    document.getElementById('formJugador').reset();
    cargarJugadores();
});

window.editarJugador = (id, nick, email, nivel) => {
    jugadorEditandoId = id;
    document.getElementById('jNick').value = nick;
    document.getElementById('jEmail').value = email;
    document.getElementById('jNivel').value = nivel;
    document.getElementById('btnJugador').textContent = "Guardar Cambios";
};

window.eliminarJugador = async (id) => {
    await peticion(`/jugadores/${id}`, { method: 'DELETE' });
    cargarJugadores();
};

window.verTorneosJugador = async (id, nick) => {
    const torneos = await peticion(`/jugadores/${id}/participaciones`);
    const ul = document.getElementById('listaTorneosJugador');
    document.getElementById('tituloTorneosJugador').textContent = `Torneos de ${nick}`;
    ul.innerHTML = '';
    torneos.forEach(t => {
        ul.innerHTML += `<li class="list-group-item">[${t.id}] ${t.nombre} - ${t.estado}</li>`;
    });
    document.getElementById('panelTorneosJugador').hidden = false;
};

async function cargarVideojuegos() {
    const juegos = await peticion('/videojuegos');
    const tbody = document.getElementById('cuerpoVideojuegos');
    const selectFiltro = document.getElementById('filtroVideojuego');
    const selectTorneo = document.getElementById('tVideojuego');
    
    tbody.innerHTML = '';
    selectFiltro.innerHTML = '<option value=""></option>';
    selectTorneo.innerHTML = '<option value=""></option>';
    
    juegos.forEach(v => {

        tbody.innerHTML += `
            <tr>
                <td>${v.id}</td>
                <td>${v.nombre}</td>
                <td>${v.genero}</td>
            </tr>`;
        selectFiltro.innerHTML += `<option value="${v.id}">${v.nombre}</option>`;
        selectTorneo.innerHTML += `<option value="${v.id}">${v.nombre}</option>`;
    });
}

document.getElementById('btnBuscarVideojuego').addEventListener('click', async () => {
    const id = document.getElementById('buscarVideojuegoId').value;
    if (!id) return;
    const v = await peticion(`/videojuegos/${id}`);
    document.getElementById('resVideojuego').innerHTML = `<div class="alert alert-info">Encontrado: [${v.id}] ${v.nombre} (${v.genero})</div>`;
});

document.getElementById('formJuego').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nombre: document.getElementById('vjNombre').value,
        genero: document.getElementById('vjGenero').value
    };
    await peticion('/videojuegos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    document.getElementById('formJuego').reset();
    cargarVideojuegos();
});

async function cargarTorneos(query = '') {
    const torneos = await peticion(`/torneos${query}`);
    const tbody = document.getElementById('cuerpoTorneos');
    const selectInscripcion = document.getElementById('iTorneo');
    
    tbody.innerHTML = '';
    selectInscripcion.innerHTML = '<option value=""></option>';
    
    torneos.forEach(t => {

        tbody.innerHTML += `
            <tr>
                <td>${t.id}</td>
                <td>${t.nombre}</td>
                <td>${t.videojuego.nombre}</td>
                <td>${t.estado}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="verJugadoresTorneo(${t.id}, '${t.nombre}')">Jugadores</button>
                    <button class="btn btn-sm btn-warning" onclick="editarTorneo(${t.id}, '${t.nombre}', ${t.videojuego.id}, '${t.estado}', '${t.fecha}', ${t.premio}" >Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarTorneo(${t.id})">Eliminar</button>
                </td>
            </tr>`;
        selectInscripcion.innerHTML += `<option value="${t.id}">${t.nombre}</option>`;
    });
}

document.getElementById('btnFiltrarTorneo').addEventListener('click', () => {
    const estado = document.getElementById('filtroEstado').value;
    const videojuegoId = document.getElementById('filtroVideojuego').value;
    const params = new URLSearchParams();
    if (estado) params.append('estado', estado);
    if (videojuegoId) params.append('videojuegoId', videojuegoId);
    cargarTorneos(`?${params.toString()}`);
});

document.getElementById('btnBuscarTorneo').addEventListener('click', async () => {
    const id = document.getElementById('buscarTorneoId').value;
    if (!id) return;
    const t = await peticion(`/torneos/${id}`);
    document.getElementById('resTorneo').innerHTML = `<div class="alert alert-info">Encontrado: [${t.id}] ${t.nombre} - ${t.estado}</div>`;
});

let torneoEditandoId = null;
document.getElementById('formTorneo').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
        nombre: document.getElementById('tNombre').value,
        videojuego: { id: parseInt(document.getElementById('tVideojuego').value) },
        estado: document.getElementById('tEstado').value,
        fecha: document.getElementById('tFecha').value,
        premio: parseFloat(document.getElementById('tPremio').value)
    };
    
    if (torneoEditandoId) {
        await peticion(`/torneos/${torneoEditandoId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        torneoEditandoId = null;
        document.getElementById('btnTorneo').textContent = "Crear Torneo";
    } else {
        await peticion('/torneos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    }
    document.getElementById('formTorneo').reset();
    cargarTorneos();
});

window.editarTorneo = (id, nombre, videojuegoId, estado, fecha, premio) => {
    torneoEditandoId = id;
    document.getElementById('tNombre').value = nombre;
    document.getElementById('tVideojuego').value = videojuegoId;
    document.getElementById('tEstado').value = estado;
    document.getElementById('tFecha').value = fechaa;
    document.getElementById('tPremio').value = premio;
    document.getElementById('btnTorneo').textContent = "Guardar Cambios";
};

window.eliminarTorneo = async (id) => {
    await peticion(`/torneos/${id}`, { method: 'DELETE' });
    cargarTorneos();
};

window.verJugadoresTorneo = async (id, nombre) => {
    const jugadores = await peticion(`/torneos/${id}/participaciones`);
    const ul = document.getElementById('listaJugadoresTorneo');
    document.getElementById('tituloJugadoresTorneo').textContent = `Jugadores de ${nombre}`;
    ul.innerHTML = '';
    jugadores.forEach(j => {
        ul.innerHTML += `<li class="list-group-item">[${j.id}] ${j.nick} - ${j.email}</li>`;
    });
    document.getElementById('panelJugadoresTorneo').hidden = false;
};

document.getElementById('formInscripcion').addEventListener('submit', async (e) => {
    e.preventDefault();
    const torneoId = document.getElementById('iTorneo').value;
    const jugadorId = document.getElementById('iJugador').value;
    
    await peticion('/participaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ torneo: { id: torneoId }, jugador: { id: jugadorId } })
    });
    document.getElementById('formInscripcion').reset();
    mostrarAviso("Jugador inscrito correctamente", false);
});

cargarJugadores();
cargarVideojuegos();
cargarTorneos();