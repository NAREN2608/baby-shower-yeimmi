/* Lista de regalos: Google Sheets mediante Google Apps Script.
   Las lecturas usan JSONP porque ContentService redirige a googleusercontent.com.
   La escritura se envía en un formulario POST a un iframe y se confirma después por requestId. */
(() => {
  "use strict";
  const C = window.INVITACION || {}, API = (C.regalosApi || {}).webAppUrl || "", G = C.regalos || [];
  const $ = s => document.querySelector(s);
  const activo = /^https:\/\/script\.google\.com\/macros\/s\/.+\/exec(?:\?.*)?$/.test(API);
  const unicosElegidos = new Set(), conteo = {}, marcados = new Set();
  let enviando = false, listo = false, pendiente = null;
  const esUnico = id => G.some(g => g.id === id && g.tipo === "unico");
  const nombreDe = id => (G.find(g => g.id === id) || {}).nombre || id;
  const esc = s => String(s).replace(/[&<>\"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const estado = t => { $("#estado-db").textContent = t; };
  const aviso = (t, error) => { const e = $("#msg-regalos"); e.textContent = t; e.classList.toggle("error", !!error); };
  const resumen = () => { $("#resumen").textContent = marcados.size ? [...marcados].map(nombreDe).join(", ") : "Aún no has elegido nada."; };

  function pintar() {
    for (const id of [...marcados]) if (esUnico(id) && unicosElegidos.has(id)) marcados.delete(id);
    for (const [ul, tipo] of [["#lista-unicos", "unico"], ["#lista-varios", "varios"]]) {
      $(ul).innerHTML = G.filter(g => g.tipo === tipo).map(g => {
        const ya = tipo === "unico" && unicosElegidos.has(g.id), off = ya || !listo, n = conteo[g.id] || 0;
        const chip = !listo ? "" : tipo === "unico" ? (ya ? "Elegido" : "Disponible") : (n ? `Elegido por ${n} invitado${n === 1 ? "" : "s"}` : "");
        return `<li><label class="item${ya ? " res" : ""}"><input type="checkbox" value="${esc(g.id)}"${off ? " disabled" : ""}${marcados.has(g.id) ? " checked" : ""}><span class="nom">${esc(g.nombre)}</span>${chip ? `<span class="chip">${chip}</span>` : ""}</label></li>`;
      }).join("");
    }
    resumen(); $("#enviar").disabled = !listo || enviando;
  }

  function jsonp(params) {
    return new Promise((resolve, reject) => {
      const callback = `regalosJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const url = new URL(API); url.searchParams.set("callback", callback); url.searchParams.set("_", String(Date.now()));
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      const script = document.createElement("script"), timer = setTimeout(() => limpiar(new Error("La consulta tardó demasiado.")), 12000);
      function limpiar(error) { clearTimeout(timer); delete window[callback]; script.remove(); if (error) reject(error); }
      window[callback] = data => { limpiar(); resolve(data); };
      script.onerror = () => limpiar(new Error("No se pudo consultar la lista."));
      script.src = url.toString(); document.head.append(script);
    });
  }

  async function consultar() {
    const r = await jsonp({ action: "state" });
    if (!r || !r.ok) throw new Error((r && r.error) || "Respuesta no válida.");
    unicosElegidos.clear(); (r.unicosElegidos || []).forEach(id => unicosElegidos.add(id));
    Object.keys(conteo).forEach(k => delete conteo[k]); Object.assign(conteo, r.conteos || {});
    listo = true; estado("Lista al día."); pintar();
  }

  function enviarPost(requestId, giftIds) {
    const frame = document.createElement("iframe"), form = document.createElement("form");
    const target = `regalos_post_${requestId.replace(/[^a-z0-9]/gi, "")}`;
    frame.name = target; frame.hidden = true; form.hidden = true; form.method = "post"; form.action = API; form.target = target;
    [["requestId", requestId], ["giftIds", JSON.stringify(giftIds)]].forEach(([name, value]) => {
      const input = document.createElement("input"); input.name = name; input.value = value; form.append(input);
    });
    document.body.append(frame, form); form.submit(); setTimeout(() => { form.remove(); frame.remove(); }, 30000);
  }

  async function esperarResultado(requestId) {
    const limite = Date.now() + 25000;
    while (Date.now() < limite) {
      const r = await jsonp({ action: "request", requestId });
      if (r && r.ok && r.encontrada) return r;
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    throw new Error("No pudimos confirmar el registro todavía. Conservamos tu selección: vuelve a intentarlo con el mismo botón.");
  }

  async function guardar(e) {
    e.preventDefault();
    if (!marcados.size) return aviso("Elige al menos un regalo.", true);
    const ids = [...marcados];
    if (ids.some(id => !G.some(g => g.id === id))) return aviso("La selección contiene un regalo no válido.", true);
    const mismaSeleccion = pendiente && pendiente.giftIds.length === ids.length && pendiente.giftIds.every(id => ids.includes(id));
    const requestId = mismaSeleccion ? pendiente.requestId : (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    pendiente = { requestId, giftIds: ids };
    enviando = true; pintar(); aviso("Guardando tu selección…");
    try {
      enviarPost(requestId, ids);
      const r = await esperarResultado(requestId);
      await consultar();
      pendiente = null;
      if (!r.exito) return aviso(r.error || "No se pudo guardar: otro invitado ya eligió un regalo único. Actualizamos la lista; elige otro y vuelve a guardar.", true);
      marcados.clear(); $("#form-regalos").reset(); aviso("¡Gracias! Guardamos tu selección de regalos. Esto no confirma tu asistencia.");
    } catch (error) {
      aviso(error.message || "No se pudo confirmar la selección. Revisa tu conexión e inténtalo de nuevo.", true);
    } finally { enviando = false; pintar(); }
  }

  $("#form-regalos").addEventListener("change", e => { if (e.target.matches("input[type=checkbox]")) { e.target.checked ? marcados.add(e.target.value) : marcados.delete(e.target.value); resumen(); } });
  $("#form-regalos").addEventListener("submit", guardar);
  pintar();
  if (!activo) estado("Puedes ver la lista. Podrás guardar tu selección cuando se configure Google Apps Script.");
  else { estado("Consultando la lista…"); consultar().catch(() => { listo = false; estado("No se pudo consultar la lista. Guardar está desactivado; recarga la página."); pintar(); }); }
})();
