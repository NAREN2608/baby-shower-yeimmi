(() => {
  "use strict";
  const C = window.INVITACION || {}, R = document.documentElement;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const txt = k => String(C[k] ?? "").trim(), pad = n => String(n).padStart(2, "0"), TZ = txt("zona") || "America/Bogota";
  R.classList.add("js");

  // Colombia no usa horario de verano: America/Bogota es UTC-5 todo el año. El formato ISO con -05:00 evita ambigüedades.
  const f = /^\d{4}-\d{2}-\d{2}$/.test(txt("fecha")) ? txt("fecha") : "";
  const h = /^\d{2}:\d{2}$/.test(txt("hora")) ? txt("hora") : "";
  const ini = f && h ? new Date(`${f}T${h}:00-05:00`) : null;
  const valida = !!ini && !isNaN(ini);
  const durMs = (Number(C.duracionHoras) || 3) * 36e5;
  const fmt = (d, o) => new Intl.DateTimeFormat("es-CO", { timeZone: TZ, ...o }).format(d);
  const lugar = txt("direccion") || txt("lugar"); // la dirección ya incluye el nombre cuando se escribe completa
  const coord = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(txt("coordenadas")) ? txt("coordenadas").replace(/\s/g, "") : "";
  const consulta = coord || lugar;
  const mapa = txt("mapaUrl") || (consulta ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}` : "");
  const whatsapp = {
    mama: txt("whatsappMama").replace(/\D/g, ""),
    papa: txt("whatsappPapa").replace(/\D/g, "")
  };
  const V = {
    mensajeInvitacion: txt("mensajeInvitacion"), nombreBebe: txt("nombreBebe"), nombresPadres: txt("nombresPadres"),
    lugar: txt("lugar"), direccion: txt("direccion"), textoRegalos: txt("textoRegalos"),
    fechaTxt: f ? fmt(new Date(`${f}T12:00:00-05:00`), { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "",
    horaTxt: valida ? fmt(ini, { hour: "numeric", minute: "2-digit" }) : "",
    cuenta: valida && Date.now() < ini.getTime(), cal: valida, mapa, asistencia: !!(whatsapp.mama || whatsapp.papa)
  };
  $$("[data-campo]").forEach(el => { const v = V[el.dataset.campo]; if (v) { el.textContent = v; el.classList.remove("pend"); } else if (!el.hasAttribute("data-opc") && el.tagName !== "P") el.classList.add("pend"); });
  $$("[data-campo][data-opc]").forEach(el => { if (!V[el.dataset.campo]) el.hidden = true; });
  $$("[data-si]").forEach(el => { el.hidden = !V[el.dataset.si]; });

  if (mapa) $("#mapa").href = mapa;
  if (consulta) { // Mapa incrustado sin clave API; el botón de arriba funciona aunque este no cargue.
    const caja = $("#mapa-caja"), fr = document.createElement("iframe");
    fr.src = `https://maps.google.com/maps?q=${encodeURIComponent(consulta)}&output=embed`;
    fr.title = "Mapa del lugar del evento"; fr.loading = "lazy"; fr.referrerPolicy = "no-referrer-when-downgrade";
    caja.append(fr); caja.hidden = false;
  }
  if (valida) {
    const z = d => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
    const esc = s => s.replace(/([,;\\])/g, "\\$1");
    $("#cal").addEventListener("click", () => {
      const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Invitacion baby shower//ES", "BEGIN:VEVENT",
        `UID:${z(ini)}@babyshower`, `DTSTAMP:${z(new Date())}`, `DTSTART:${z(ini)}`, `DTEND:${z(new Date(ini.getTime() + durMs))}`,
        `SUMMARY:${esc(V.nombreBebe ? "Baby shower de " + V.nombreBebe : "Baby shower")}`, ...(lugar ? [`LOCATION:${esc(lugar)}`] : []),
        "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" })); a.download = "baby-shower.ics";
      document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1e3);
    });
    const est = $("#estado"), cuenta = $(".cuenta");
    const tick = () => {
      const ms = ini.getTime() - Date.now();
      if (ms > 0) {
        const s = Math.floor(ms / 1e3), v = { d: Math.floor(s / 86400), h: Math.floor(s % 86400 / 3600), m: Math.floor(s % 3600 / 60), s: s % 60 };
        cuenta.hidden = false; $$("[data-c]").forEach(n => n.textContent = pad(v[n.dataset.c]));
      } else {
        cuenta.hidden = true; est.hidden = false;
        est.textContent = Date.now() < ini.getTime() + durMs ? "¡El baby shower está en marcha!" : "El baby shower ya se celebró. ¡Gracias por acompañarnos!";
        if (Date.now() >= ini.getTime() + durMs) clearInterval(id);
      }
    };
    const id = setInterval(tick, 1e3); tick();
  }
  // Confirmación de asistencia por WhatsApp: independiente de los regalos. Solo lleva nombre, respuesta y personas.
  if (V.asistencia) {
    const nom = $("#as-nombre"), cant = $("#as-n"), msg = $("#as-msg"), caja = $("#as-cant");
    const asiste = () => document.querySelector('input[name="asiste"]:checked').value === "si";
    const personas = () => parseInt(cant.value, 10);
    const enlace = numero => {
      const l = ["¡Hola! Quiero confirmar mi asistencia al baby shower.", "", `Nombre: ${nom.value.trim()}`, `Confirmación: ${asiste() ? "Sí asistiré" : "No podré asistir"}`];
      if (asiste()) l.push(`Número de personas: ${personas() || 1}`);
      l.push("", "¡Gracias!");
      return `https://wa.me/${numero}?text=${encodeURIComponent(l.join("\n"))}`;
    };
    const destinos = [
      { numero: whatsapp.mama, boton: $("#wa-mama"), alterno: $("#wa-mama-alt") },
      { numero: whatsapp.papa, boton: $("#wa-papa"), alterno: $("#wa-papa-alt") }
    ];
    const sync = () => { caja.hidden = !asiste(); destinos.forEach(d => { d.boton.hidden = !d.numero; if (d.numero) d.boton.href = d.alterno.href = enlace(d.numero); }); };
    const error = (t, el) => { msg.textContent = t; msg.classList.add("error"); el.focus(); };
    $("#form-asistencia").addEventListener("input", sync); $("#form-asistencia").addEventListener("change", sync); sync();
    destinos.forEach(d => d.boton.addEventListener("click", e => {
      if (nom.value.trim().length < 2) { e.preventDefault(); return error("Escribe tu nombre para preparar el mensaje.", nom); }
      if (asiste() && !(personas() >= 1 && personas() <= 20)) { e.preventDefault(); return error("Indica cuántas personas asistirán (de 1 a 20).", cant); }
      msg.classList.remove("error"); d.alterno.hidden = false;
      msg.textContent = "Se abrirá WhatsApp con el mensaje preparado. Revísalo y pulsa enviar allí: tu confirmación llega a los papás solo cuando lo envíes.";
    }));
  }

  // Dos estados: 1) globo (siempre al cargar) y 2) invitación. El estado vive solo en clases del DOM:
  // no se usa localStorage, sessionStorage ni cookies, así que cada carga vuelve al globo.
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  const reiniciar = () => { R.classList.remove("asciende", "abierta"); scrollTo(0, 0); };
  const abrir = () => {
    R.classList.add("abierta"); scrollTo(0, 0);
    const t = $("#t-bi"); if (t) t.focus({ preventScroll: true });
  };
  $("#abrir").addEventListener("click", e => {
    e.preventDefault();
    if (reduce) return abrir();
    R.classList.add("asciende"); setTimeout(abrir, 900);
  });
  addEventListener("pageshow", e => { if (e.persisted) reiniciar(); }); // volver con "atrás" (bfcache) también muestra el globo

  const rev = $$(".rev");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visto"); io.unobserve(e.target); } }), { threshold: .2 });
    rev.forEach(el => io.observe(el));
  } else rev.forEach(el => el.classList.add("visto"));
})();
