window.INVITACION = {
  nombreBebe: "", nombresPadres: "",
  zona: "America/Bogota",
  fecha: "2026-12-05",    // AAAA-MM-DD (el año 2026 se asumió: confírmalo)
  hora: "13:00",          // 24 h HH:MM (1:00 p. m.)
  duracionHoras: 3,       // duración para calendario y estado "en marcha"
  lugar: "Conjunto Balzares",
  direccion: "Calle 181C #11-75, Bogotá, Colombia",   // alimenta el botón y el mapa ("Bogotá, Colombia" se añadió para que Maps encuentre la dirección)
  coordenadas: "",        // Opcional "lat,lng" (ej. "4.7110,-74.0721"); tiene prioridad sobre la dirección
  mapaUrl: "",            // Opcional: enlace de Google Maps propio
  whatsappMama: "573146837337",       // Reemplaza por el número real de mamá, con indicativo y sin "+".
  whatsappPapa: "573138523590",                   // Pega aquí el número real de papá, con indicativo y sin "+".
  mensajeInvitacion: "",
  textoRegalos: "No te preocupes por seleccionar un regalo: esta lista solo busca orientar a los demás invitados y evitar repeticiones. Los papás no sabrán quién eligió cada regalo.",

  /* Google Apps Script: pega aquí SOLO la URL /exec de tu aplicación web (ver README).
     No incluyas el ID privado de la hoja ni credenciales. Vacío = guardar desactivado. */
  regalosApi: { webAppUrl: "https://script.google.com/macros/s/AKfycbyDtJhPflv8c17Hfm8zzhXLg1oZVjpmhDR8mcyk9LZSsH8kRKNo8FD7QYWR8_OvGLYAlQ/exec" },

  /* Lista de regalos. "unico" = una sola reserva en todo el evento; "varios" = repetible.
     Los id son estables: coinciden con el catálogo autorizado de Code.gs. No los cambies. */
  regalos: [
    { id: "tina", nombre: "Tina para bebé", tipo: "unico" },
    { id: "kit-aseo", nombre: "Kit de aseo completo", tipo: "unico" },
    { id: "cuna-moises", nombre: "Cuna o moisés", tipo: "unico" },
    { id: "monitor", nombre: "Monitor para bebé", tipo: "unico" },
    { id: "termometro", nombre: "Termómetro digital", tipo: "unico" },
    { id: "organizador-panales", nombre: "Organizador de pañales", tipo: "unico" },
    { id: "aspirador-nasal", nombre: "Aspirador Nasal", tipo: "unico" },
    { id: "extractor-leche", nombre: "Kit de extractor de leche", tipo: "unico" },
    { id: "paseador", nombre: "Paseador", tipo: "unico" },
    { id: "silla-comer", nombre: "Silla de comer", tipo: "unico" },
    { id: "ropa-3-6", nombre: "Ropa para 3 - 6 meses", tipo: "varios" },
    { id: "ropa-6-9", nombre: "Ropa para 6 - 9 meses", tipo: "varios" },
    { id: "ropa-9-12", nombre: "Ropa para 9 - 12 meses", tipo: "varios" },
    { id: "ropa-12-18", nombre: "Ropa para 12 - 18 meses", tipo: "varios" },
    { id: "mamelucos", nombre: "Mamelucos", tipo: "varios" },
    { id: "pijamas", nombre: "Pijamas", tipo: "varios" },
    { id: "panales-3-4", nombre: "Pañales etapa 3 - 4", tipo: "varios" },
    { id: "cobija", nombre: "Cobija para bebe", tipo: "varios" },
    { id: "toallas", nombre: "Toallas - Salida de baño", tipo: "varios" },
    { id: "juguetes", nombre: "Juguetes de Interacción - didácticos", tipo: "varios" },
    { id: "regalo-libre", nombre: "Regalo libre", tipo: "varios" }
  ]
};
