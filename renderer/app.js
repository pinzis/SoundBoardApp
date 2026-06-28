// Global Application State
let sounds = [];
let activeCategory = 'all';
let searchQuery = '';
let settings = {
  playbackDeviceId: 'default',
  microphoneDeviceId: 'default',
  monitorDeviceId: 'default',
  monitorEnabled: true,
  globalAmplifier: 1.0,
  playbackVolume: 100,
  monitorVolume: 70,
  fadeDuration: 100,
  categories: null, // [{ id, name, color }] — seeded on first load
  micEffect: { enabled: false, type: 'none', intensity: 0.5, selfMonitor: false },
  language: null   // null = not yet chosen (shows language picker on first launch)
};

// Palette available for categories / sound colors
const COLOR_OPTIONS = [
  { id: 'purple', label: 'Viola', token: 'var(--aurora-violet)' },
  { id: 'magenta', label: 'Magenta', token: 'var(--aurora-magenta)' },
  { id: 'cyan', label: 'Ciano', token: 'var(--aurora-cyan)' },
  { id: 'green', label: 'Menta', token: 'var(--aurora-mint)' },
  { id: 'yellow', label: 'Oro', token: 'oklch(0.82 0.16 85)' }
];

function colorToken(id) {
  const c = COLOR_OPTIONS.find(o => o.id === id);
  return c ? c.token : 'var(--aurora-violet)';
}

/* ===== i18n =============================================================== */

let currentLang = 'it';

const STRINGS = {
  it: {
    'brand-sub': 'Studio · Live',
    'categories': 'Categorie',
    'btn-add-sound': 'Nuovo suono',
    'btn-add-category': '',
    'all-sounds': 'Tutti i suoni',
    'eyebrow-active-cat': 'Categoria attiva',
    'sounds-count': (n) => `${n} ${n === 1 ? 'suono caricato' : 'suoni caricati'}`,
    'empty-title': 'Ancora nessun suono',
    'empty-sub': 'Aggiungi il tuo primo suono per riempire la board.',
    'btn-empty-add': 'Aggiungi un suono',
    'btn-stop-all': 'Ferma tutto',
    'live-text': 'In ascolto',
    'search-ph': 'Cerca suono…',
    // Sound modal
    'sound-modal-new': 'Nuovo suono',
    'sound-modal-edit': 'Modifica Suono',
    'label-sound-title': 'Nome del suono',
    'ph-sound-title': 'Es. Applausi, Tamburo, Risata',
    'label-file': 'File audio o video',
    'dropzone-hint': 'Trascina il file qui o',
    'dropzone-browse': 'sfoglia',
    'no-file': 'Nessun file selezionato',
    'label-category': 'Categoria',
    'label-color': 'Colore',
    'label-volume': 'Volume',
    'label-hotkey': 'Scorciatoia globale',
    'btn-record': 'Registra',
    'btn-recording': 'Rilascia i tasti...',
    'hotkey-none': 'Nessuna',
    'hotkey-press': 'Premi i tasti...',
    'btn-cancel': 'Annulla',
    'btn-save-sound': 'Salva suono',
    'btn-saving': 'Salvataggio...',
    // Colors
    'color-purple': 'Viola', 'color-magenta': 'Magenta', 'color-cyan': 'Ciano',
    'color-green': 'Menta', 'color-yellow': 'Oro',
    // Settings modal
    'settings-title': 'Routing audio',
    'label-virtual-mic': 'Microfono virtuale',
    'vm-searching': 'Ricerca in corso…',
    'vm-found': '✓ Microfono virtuale (VB-Cable) già installato.',
    'vm-not-found': 'Nessun microfono virtuale rilevato. Installa VB-Cable per usare la tua voce filtrata in Discord, Teams, ecc.',
    'btn-install-vbcable': 'Installa VB-Cable (microfono virtuale)',
    'label-input-device': 'Microfono da usare nelle app',
    'label-playback-device': 'Output soundboard',
    'label-monitor-device': 'Monitor nelle cuffie',
    'label-amplifier': 'Amplificatore (gain)',
    'label-playback-vol': 'Volume soundboard',
    'label-monitor-vol': 'Volume monitor',
    'label-fade': 'Fade in / out',
    'label-updates': 'Aggiornamenti',
    'btn-check-updates': 'Controlla aggiornamenti',
    'update-current': 'Versione attuale',
    'btn-install-update': 'Riavvia e installa',
    'route-status': 'Stato routing',
    'route-soundboard': 'Soundboard',
    'route-input': 'Input app',
    'route-monitor': 'Monitor',
    'btn-save-settings': 'Salva impostazioni',
    'label-language': 'Lingua',
    // Mic FX modal
    'mic-fx-title': 'Effetti microfono',
    'label-mic-intensity': 'Intensità effetto',
    'label-mic-level': 'Livello microfono',
    'label-self-monitor': 'Ascolta la tua voce filtrata nelle cuffie (monitor)',
    // Presets
    'preset-none': 'Nessuno', 'preset-girl': 'Ragazza', 'preset-mask': 'Maschera',
    'preset-underwater': "Sott'acqua", 'preset-robot': 'Robot', 'preset-echo': 'Eco',
    'preset-phone': 'Telefono',
    // Default select options
    'default-mic': 'Microfono predefinito',
    'default-playback': 'Dispositivo di Riproduzione Predefinito',
    'default-monitor': 'Dispositivo di Monitoraggio Predefinito',
    'default-monitor-display': 'Non Attivo',
    // Notifications
    'notif-settings-saved': 'Impostazioni salvate con successo.',
    'notif-file-unsupported': 'Estensione file non supportata! Usa MP3, MP4, WAV, OGG o M4A.',
    'notif-no-file': 'Seleziona prima un file audio!',
    'notif-save-error': 'Errore nel salvataggio del suono.',
    'notif-vbcable-installed': 'VB-Cable installato con successo! Riavvia la soundboard per usarlo.',
    'notif-shortcut-stolen': (shortcut, sound) => `La scorciatoia "${shortcut}" per il suono "${sound}" è stata riassegnata.`,
    'notif-shortcut-failed': (shortcut) => `Impossibile registrare la scorciatoia "${shortcut}". Potrebbe essere già in uso da un'altra app.`,
    'notif-shortcut-warning': 'Attenzione: i tasti senza modificatori bloccheranno la digitazione in altre app.',
    'notif-mic-error': (err) => `Impossibile avviare gli effetti microfono: ${err}`,
    'notif-output-matched': (dev) => `Output soundboard abbinato: ${dev}`,
    'notif-audio-error': "Errore: motore audio non disponibile. Riavvia l'app.",
    'notif-sound-error': (err) => `Errore: ${err}`,
    // Cat / card UI
    'cat-rename-title': 'Rinomina', 'cat-delete-title': 'Elimina',
    'cat-name-ph': 'Nome categoria…',
    'confirm-delete-sound': 'Sei sicuro di voler eliminare questo suono?',
    'confirm-delete-cat': (name) => `Eliminare la categoria "${name}"?`,
    'confirm-delete-cat-sounds': (name, count) => `Eliminare "${name}"? ${count} ${count === 1 ? 'suono tornerà' : 'suoni torneranno'} in "Tutti i suoni".`,
    'rename-cat-prompt': (name) => `Nuovo nome categoria:`,
    // Route summary
    'route-hint-matched': "Il microfono scelto e l'output soundboard sono salvati. Nelle app seleziona quel microfono come input.",
    'route-hint-mic': "Microfono scelto. Se usi VB-Cable/Voicemeeter, seleziona anche il relativo output come destinazione soundboard.",
    'route-hint-default': "Scegli un microfono virtuale: se trovo l'output gemello lo imposto come destinazione della soundboard.",
    'default-mic-display': 'Predefinito',
    // Update
    'update-checking': 'Controllo aggiornamenti…',
    'update-available': (v) => `Nuova versione v${v} trovata. Download in corso…`,
    'update-not-available': "Hai già l'ultima versione.",
    'update-downloading': (p) => `Download aggiornamento… ${p}%`,
    'update-downloaded-label': (v) => `Aggiornamento v${v} pronto da installare.`,
    'update-downloaded-prompt': (v) => `È pronto l'aggiornamento v${v}. Riavviare e installare ora?`,
    'update-notif-available': (v) => `Aggiornamento v${v} disponibile: download in corso…`,
    'update-notif-downloaded': (v) => `Aggiornamento v${v} scaricato. Riavvia per installare.`,
    'update-error-404': 'Nessuna release trovata su GitHub. Esegui npm run release per pubblicare la prima versione.',
    'update-error-enoent': 'File di aggiornamento non trovato. Pubblica una release con npm run release.',
    'update-error-network': 'Nessuna connessione a internet.',
    'update-error-generic': 'Errore controllo aggiornamenti.',
    'update-error-prefix': 'Errore controllo: ',
    'update-not-packaged': 'Aggiornamenti disponibili solo nella versione installata.',
    // VB-Cable
    'vm-downloading': 'Download VB-Cable in corso…',
    'vm-extracting': 'Estrazione…',
    'vm-installing': 'Installazione (conferma la richiesta admin)…',
    'vm-done-status': '✓ VB-Cable installato! Riavvia la soundboard per vederlo nei dispositivi.',
    'vm-error-status': (msg) => `Errore: ${msg}`,
    'vm-detect-error': 'Impossibile rilevare i dispositivi audio.',
    // Language picker
    'lang-pick-title': 'Scegli la lingua / Choose language / Elige idioma',
    // Mic setup (first launch)
    'mic-setup-title': 'Configura il microfono',
    'mic-setup-sub': 'Scegli quali dispositivi usare. Potrai cambiarli in qualsiasi momento dalle impostazioni.',
    'btn-mic-setup-start': 'Inizia',
    // Default cat names
    'cat-music': 'Musica', 'cat-effects': 'Effetti',
    // Mic FX hint (HTML allowed)
    'mic-fx-hint': 'Per usare la voce con effetti nelle altre app, seleziona <strong>VB-Cable</strong> (lo stesso output della soundboard) come microfono. Il monitoraggio usa la periferica scelta in <strong>Routing audio &rarr; Monitor nelle cuffie</strong>.',
  },
  en: {
    'brand-sub': 'Studio · Live',
    'categories': 'Categories',
    'btn-add-sound': 'New sound',
    'all-sounds': 'All sounds',
    'eyebrow-active-cat': 'Active category',
    'sounds-count': (n) => `${n} ${n === 1 ? 'sound loaded' : 'sounds loaded'}`,
    'empty-title': 'No sounds yet',
    'empty-sub': 'Add your first sound to fill the board.',
    'btn-empty-add': 'Add a sound',
    'btn-stop-all': 'Stop all',
    'live-text': 'Listening',
    'search-ph': 'Search sound…',
    'sound-modal-new': 'New sound',
    'sound-modal-edit': 'Edit Sound',
    'label-sound-title': 'Sound name',
    'ph-sound-title': 'e.g. Applause, Drum, Laugh',
    'label-file': 'Audio or video file',
    'dropzone-hint': 'Drag file here or',
    'dropzone-browse': 'browse',
    'no-file': 'No file selected',
    'label-category': 'Category',
    'label-color': 'Color',
    'label-volume': 'Volume',
    'label-hotkey': 'Global shortcut',
    'btn-record': 'Record',
    'btn-recording': 'Release keys...',
    'hotkey-none': 'None',
    'hotkey-press': 'Press keys...',
    'btn-cancel': 'Cancel',
    'btn-save-sound': 'Save sound',
    'btn-saving': 'Saving...',
    'color-purple': 'Purple', 'color-magenta': 'Magenta', 'color-cyan': 'Cyan',
    'color-green': 'Mint', 'color-yellow': 'Gold',
    'settings-title': 'Audio Routing',
    'label-virtual-mic': 'Virtual microphone',
    'vm-searching': 'Searching…',
    'vm-found': '✓ Virtual microphone (VB-Cable) already installed.',
    'vm-not-found': 'No virtual microphone detected. Install VB-Cable to use your filtered voice in Discord, Teams, etc.',
    'btn-install-vbcable': 'Install VB-Cable (virtual microphone)',
    'label-input-device': 'Microphone to use in apps',
    'label-playback-device': 'Soundboard output',
    'label-monitor-device': 'Monitor in headphones',
    'label-amplifier': 'Amplifier (gain)',
    'label-playback-vol': 'Soundboard volume',
    'label-monitor-vol': 'Monitor volume',
    'label-fade': 'Fade in / out',
    'label-updates': 'Updates',
    'btn-check-updates': 'Check for updates',
    'update-current': 'Current version',
    'btn-install-update': 'Restart and install',
    'route-status': 'Routing status',
    'route-soundboard': 'Soundboard',
    'route-input': 'App input',
    'route-monitor': 'Monitor',
    'btn-save-settings': 'Save settings',
    'label-language': 'Language',
    'mic-fx-title': 'Microphone effects',
    'label-mic-intensity': 'Effect intensity',
    'label-mic-level': 'Microphone level',
    'label-self-monitor': 'Hear your filtered voice in headphones (monitor)',
    'preset-none': 'None', 'preset-girl': 'Girl', 'preset-mask': 'Mask',
    'preset-underwater': 'Underwater', 'preset-robot': 'Robot', 'preset-echo': 'Echo',
    'preset-phone': 'Phone',
    'default-mic': 'Default microphone',
    'default-playback': 'Default playback device',
    'default-monitor': 'Default monitor device',
    'default-monitor-display': 'Inactive',
    'notif-settings-saved': 'Settings saved successfully.',
    'notif-file-unsupported': 'Unsupported file! Use MP3, MP4, WAV, OGG or M4A.',
    'notif-no-file': 'Please select an audio file first!',
    'notif-save-error': 'Error saving sound.',
    'notif-vbcable-installed': 'VB-Cable installed! Restart the soundboard to use it.',
    'notif-shortcut-stolen': (shortcut, sound) => `Shortcut "${shortcut}" for "${sound}" was reassigned.`,
    'notif-shortcut-failed': (shortcut) => `Could not register shortcut "${shortcut}". It may be in use by another app.`,
    'notif-shortcut-warning': 'Warning: keys without modifiers will block typing in other apps.',
    'notif-mic-error': (err) => `Could not start mic effects: ${err}`,
    'notif-output-matched': (dev) => `Soundboard output matched: ${dev}`,
    'notif-audio-error': 'Error: audio engine unavailable. Restart the app.',
    'notif-sound-error': (err) => `Error: ${err}`,
    'cat-rename-title': 'Rename', 'cat-delete-title': 'Delete',
    'cat-name-ph': 'Category name…',
    'confirm-delete-sound': 'Are you sure you want to delete this sound?',
    'confirm-delete-cat': (name) => `Delete category "${name}"?`,
    'confirm-delete-cat-sounds': (name, count) => `Delete "${name}"? ${count} ${count === 1 ? 'sound' : 'sounds'} will return to "All sounds".`,
    'rename-cat-prompt': () => `New category name:`,
    'route-hint-matched': 'Microphone and soundboard output saved. Select that microphone as input in your apps.',
    'route-hint-mic': 'Microphone chosen. If using VB-Cable/Voicemeeter, also select the matching output as soundboard destination.',
    'route-hint-default': 'Choose a virtual microphone: if I find the matching output, I will set it as the soundboard destination.',
    'default-mic-display': 'Default',
    'update-checking': 'Checking for updates…',
    'update-available': (v) => `New version v${v} found. Downloading…`,
    'update-not-available': 'You already have the latest version.',
    'update-downloading': (p) => `Downloading update… ${p}%`,
    'update-downloaded-label': (v) => `Update v${v} ready to install.`,
    'update-downloaded-prompt': (v) => `Update v${v} is ready. Restart and install now?`,
    'update-notif-available': (v) => `Update v${v} available: downloading…`,
    'update-notif-downloaded': (v) => `Update v${v} downloaded. Restart to install.`,
    'update-error-404': 'No release found on GitHub. Run npm run release to publish the first version.',
    'update-error-enoent': 'Update file not found. Publish a release with npm run release.',
    'update-error-network': 'No internet connection.',
    'update-error-generic': 'Update check error.',
    'update-error-prefix': 'Check error: ',
    'update-not-packaged': 'Updates only available in the installed version.',
    'vm-downloading': 'Downloading VB-Cable…',
    'vm-extracting': 'Extracting…',
    'vm-installing': 'Installing (confirm the admin request)…',
    'vm-done-status': '✓ VB-Cable installed! Restart the soundboard to see it in devices.',
    'vm-error-status': (msg) => `Error: ${msg}`,
    'vm-detect-error': 'Unable to detect audio devices.',
    'lang-pick-title': 'Scegli la lingua / Choose language / Elige idioma',
    'mic-setup-title': 'Set up your microphone',
    'mic-setup-sub': 'Pick which devices to use. You can change these anytime in settings.',
    'btn-mic-setup-start': 'Get started',
    'cat-music': 'Music', 'cat-effects': 'Effects',
    'mic-fx-hint': 'To use your effected voice in other apps, select <strong>VB-Cable</strong> (the same output as the soundboard) as your microphone. Monitoring uses the device selected in <strong>Audio Routing &rarr; Monitor in headphones</strong>.',
  },
  es: {
    'brand-sub': 'Estudio · Directo',
    'categories': 'Categorías',
    'btn-add-sound': 'Nuevo sonido',
    'all-sounds': 'Todos los sonidos',
    'eyebrow-active-cat': 'Categoría activa',
    'sounds-count': (n) => `${n} ${n === 1 ? 'sonido cargado' : 'sonidos cargados'}`,
    'empty-title': 'Aún sin sonidos',
    'empty-sub': 'Añade tu primer sonido para llenar el tablero.',
    'btn-empty-add': 'Añadir un sonido',
    'btn-stop-all': 'Detener todo',
    'live-text': 'Escuchando',
    'search-ph': 'Buscar sonido…',
    'sound-modal-new': 'Nuevo sonido',
    'sound-modal-edit': 'Editar Sonido',
    'label-sound-title': 'Nombre del sonido',
    'ph-sound-title': 'Ej. Aplausos, Tambor, Risa',
    'label-file': 'Archivo de audio o vídeo',
    'dropzone-hint': 'Arrastra el archivo aquí o',
    'dropzone-browse': 'busca',
    'no-file': 'Ningún archivo seleccionado',
    'label-category': 'Categoría',
    'label-color': 'Color',
    'label-volume': 'Volumen',
    'label-hotkey': 'Atajo global',
    'btn-record': 'Grabar',
    'btn-recording': 'Suelta las teclas...',
    'hotkey-none': 'Ninguno',
    'hotkey-press': 'Pulsa las teclas...',
    'btn-cancel': 'Cancelar',
    'btn-save-sound': 'Guardar sonido',
    'btn-saving': 'Guardando...',
    'color-purple': 'Violeta', 'color-magenta': 'Magenta', 'color-cyan': 'Cian',
    'color-green': 'Menta', 'color-yellow': 'Oro',
    'settings-title': 'Enrutamiento de audio',
    'label-virtual-mic': 'Micrófono virtual',
    'vm-searching': 'Buscando…',
    'vm-found': '✓ Micrófono virtual (VB-Cable) ya instalado.',
    'vm-not-found': 'No se detectó micrófono virtual. Instala VB-Cable para usar tu voz filtrada en Discord, Teams, etc.',
    'btn-install-vbcable': 'Instalar VB-Cable (micrófono virtual)',
    'label-input-device': 'Micrófono a usar en las apps',
    'label-playback-device': 'Salida del tablero',
    'label-monitor-device': 'Monitor en auriculares',
    'label-amplifier': 'Amplificador (ganancia)',
    'label-playback-vol': 'Volumen del tablero',
    'label-monitor-vol': 'Volumen del monitor',
    'label-fade': 'Fade in / out',
    'label-updates': 'Actualizaciones',
    'btn-check-updates': 'Buscar actualizaciones',
    'update-current': 'Versión actual',
    'btn-install-update': 'Reiniciar e instalar',
    'route-status': 'Estado de enrutamiento',
    'route-soundboard': 'Tablero',
    'route-input': 'Entrada de la app',
    'route-monitor': 'Monitor',
    'btn-save-settings': 'Guardar ajustes',
    'label-language': 'Idioma',
    'mic-fx-title': 'Efectos de micrófono',
    'label-mic-intensity': 'Intensidad del efecto',
    'label-mic-level': 'Nivel del micrófono',
    'label-self-monitor': 'Escucha tu voz filtrada en los auriculares (monitor)',
    'preset-none': 'Ninguno', 'preset-girl': 'Chica', 'preset-mask': 'Máscara',
    'preset-underwater': 'Bajo el agua', 'preset-robot': 'Robot', 'preset-echo': 'Eco',
    'preset-phone': 'Teléfono',
    'default-mic': 'Micrófono predeterminado',
    'default-playback': 'Dispositivo de reproducción predeterminado',
    'default-monitor': 'Dispositivo de monitoreo predeterminado',
    'default-monitor-display': 'No Activo',
    'notif-settings-saved': 'Ajustes guardados correctamente.',
    'notif-file-unsupported': '¡Extensión no compatible! Usa MP3, MP4, WAV, OGG o M4A.',
    'notif-no-file': '¡Selecciona primero un archivo de audio!',
    'notif-save-error': 'Error al guardar el sonido.',
    'notif-vbcable-installed': '¡VB-Cable instalado! Reinicia el tablero para usarlo.',
    'notif-shortcut-stolen': (shortcut, sound) => `El atajo "${shortcut}" de "${sound}" fue reasignado.`,
    'notif-shortcut-failed': (shortcut) => `No se pudo registrar el atajo "${shortcut}". Puede que esté en uso por otra app.`,
    'notif-shortcut-warning': 'Aviso: las teclas sin modificadores bloquearán la escritura en otras apps.',
    'notif-mic-error': (err) => `No se pudieron iniciar los efectos del micrófono: ${err}`,
    'notif-output-matched': (dev) => `Salida del tablero emparejada: ${dev}`,
    'notif-audio-error': 'Error: motor de audio no disponible. Reinicia la app.',
    'notif-sound-error': (err) => `Error: ${err}`,
    'cat-rename-title': 'Renombrar', 'cat-delete-title': 'Eliminar',
    'cat-name-ph': 'Nombre de categoría…',
    'confirm-delete-sound': '¿Seguro que quieres eliminar este sonido?',
    'confirm-delete-cat': (name) => `¿Eliminar la categoría "${name}"?`,
    'confirm-delete-cat-sounds': (name, count) => `¿Eliminar "${name}"? ${count} ${count === 1 ? 'sonido volverá' : 'sonidos volverán'} a "Todos los sonidos".`,
    'rename-cat-prompt': () => `Nuevo nombre de categoría:`,
    'route-hint-matched': 'Micrófono y salida del tablero guardados. Selecciona ese micrófono como entrada en tus apps.',
    'route-hint-mic': 'Micrófono elegido. Si usas VB-Cable/Voicemeeter, selecciona también la salida correspondiente como destino del tablero.',
    'route-hint-default': 'Elige un micrófono virtual: si encuentro la salida gemela, la configuro como destino del tablero.',
    'default-mic-display': 'Predeterminado',
    'update-checking': 'Buscando actualizaciones…',
    'update-available': (v) => `Nueva versión v${v} encontrada. Descargando…`,
    'update-not-available': 'Ya tienes la última versión.',
    'update-downloading': (p) => `Descargando actualización… ${p}%`,
    'update-downloaded-label': (v) => `Actualización v${v} lista para instalar.`,
    'update-downloaded-prompt': (v) => `La actualización v${v} está lista. ¿Reiniciar e instalar ahora?`,
    'update-notif-available': (v) => `Actualización v${v} disponible: descargando…`,
    'update-notif-downloaded': (v) => `Actualización v${v} descargada. Reinicia para instalar.`,
    'update-error-404': 'No se encontró ningún release en GitHub. Ejecuta npm run release para publicar la primera versión.',
    'update-error-enoent': 'Archivo de actualización no encontrado. Publica un release con npm run release.',
    'update-error-network': 'Sin conexión a internet.',
    'update-error-generic': 'Error al buscar actualizaciones.',
    'update-error-prefix': 'Error de comprobación: ',
    'update-not-packaged': 'Las actualizaciones solo están disponibles en la versión instalada.',
    'vm-downloading': 'Descargando VB-Cable…',
    'vm-extracting': 'Extrayendo…',
    'vm-installing': 'Instalando (confirma la solicitud de administrador)…',
    'vm-done-status': '✓ ¡VB-Cable instalado! Reinicia el tablero para verlo en los dispositivos.',
    'vm-error-status': (msg) => `Error: ${msg}`,
    'vm-detect-error': 'No se pueden detectar los dispositivos de audio.',
    'lang-pick-title': 'Scegli la lingua / Choose language / Elige idioma',
    'mic-setup-title': 'Configura el micrófono',
    'mic-setup-sub': 'Elige qué dispositivos usar. Podrás cambiarlos en cualquier momento en los ajustes.',
    'btn-mic-setup-start': 'Empezar',
    'cat-music': 'Música', 'cat-effects': 'Efectos',
    'mic-fx-hint': 'Para usar tu voz con efectos en otras apps, selecciona <strong>VB-Cable</strong> (la misma salida que el tablero) como micrófono. El monitor usa el dispositivo seleccionado en <strong>Enrutamiento de audio &rarr; Monitor en auriculares</strong>.',
  }
};

// t(key, ...args) — look up a translation string; args are passed if the value is a function
function t(key, ...args) {
  const dict = STRINGS[currentLang] || STRINGS.it;
  const val = dict[key] ?? STRINGS.it[key];
  if (typeof val === 'function') return val(...args);
  return val ?? key;
}

// Apply the selected language to all translatable DOM elements
function applyLanguage(lang) {
  if (lang && STRINGS[lang]) currentLang = lang;
  else currentLang = 'it';

  // Static labels / buttons
  const set = (id, key, html = false) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (html) el.innerHTML = t(key);
    else el.textContent = t(key);
  };
  const setAttr = (id, attr, key) => {
    const el = document.getElementById(id);
    if (el) el.setAttribute(attr, t(key));
  };

  set('brand-sub-text', 'brand-sub');
  set('sidebar-cats-label', 'categories');
  set('btn-add-sound-text', 'btn-add-sound');
  set('btn-empty-add-text', 'btn-empty-add');
  set('eyebrow-cat', 'eyebrow-active-cat');
  set('btn-stop-all-label', 'btn-stop-all');
  set('live-text', 'live-text');
  set('empty-title', 'empty-title');
  set('empty-sub', 'empty-sub');
  setAttr('search-input', 'placeholder', 'search-ph');

  // Sound modal
  set('label-sound-title', 'label-sound-title');
  setAttr('sound-title', 'placeholder', 'ph-sound-title');
  set('label-file-upload', 'label-file');
  set('dropzone-hint-text', 'dropzone-hint');
  set('link-browse-file', 'dropzone-browse');
  set('file-name-preview', 'no-file');
  set('label-sound-category', 'label-category');
  set('label-sound-color', 'label-color');
  set('label-sound-volume', 'label-volume');
  set('label-hotkey-field', 'label-hotkey');
  set('btn-record-hotkey', 'btn-record');
  set('hotkey-display', 'hotkey-none');
  set('btn-cancel-sound-modal', 'btn-cancel');
  set('btn-submit-sound-modal', 'btn-save-sound');

  // Color options in the color select
  const colorSel = document.getElementById('sound-color');
  if (colorSel) {
    Array.from(colorSel.options).forEach(opt => {
      const key = 'color-' + opt.value;
      const tr = t(key);
      if (tr !== key) opt.textContent = tr;
    });
  }

  // Settings modal
  set('settings-modal-title', 'settings-title');
  set('label-virtual-mic-field', 'label-virtual-mic');
  set('btn-install-vbcable', 'btn-install-vbcable');
  set('label-input-device-field', 'label-input-device');
  set('label-playback-device-field', 'label-playback-device');
  set('label-monitor-device-field', 'label-monitor-device');
  set('label-amplifier-field', 'label-amplifier');
  set('label-playback-vol-field', 'label-playback-vol');
  set('label-monitor-vol-field', 'label-monitor-vol');
  set('label-fade-field', 'label-fade');
  set('label-updates-field', 'label-updates');
  set('btn-check-updates', 'btn-check-updates');
  set('btn-install-update', 'btn-install-update');
  set('route-status-title', 'route-status');
  set('route-soundboard-label', 'route-soundboard');
  set('route-input-label', 'route-input');
  set('route-monitor-label', 'route-monitor');
  set('btn-save-settings', 'btn-save-settings');
  set('label-language-field', 'label-language');

  // Device dropdowns — update the "default" option labels
  const defOptUpdate = (selId, key) => {
    const sel = document.getElementById(selId);
    if (sel && sel.options[0]) sel.options[0].textContent = t(key);
  };
  defOptUpdate('select-input-device', 'default-mic');
  defOptUpdate('select-playback-device', 'default-playback');
  defOptUpdate('select-monitor-device', 'default-monitor');

  // First-launch mic setup overlay
  set('mic-setup-title', 'mic-setup-title');
  set('mic-setup-sub', 'mic-setup-sub');
  set('setup-label-input-field', 'label-input-device');
  set('setup-label-playback-field', 'label-playback-device');
  set('setup-label-monitor-field', 'label-monitor-device');
  set('btn-mic-setup-start', 'btn-mic-setup-start');
  defOptUpdate('setup-input-device', 'default-mic');
  defOptUpdate('setup-playback-device', 'default-playback');
  defOptUpdate('setup-monitor-device', 'default-monitor');

  // Mic FX modal
  set('mic-fx-modal-title', 'mic-fx-title');
  set('label-mic-intensity-field', 'label-mic-intensity');
  set('label-mic-level-field', 'label-mic-level');
  set('label-self-monitor-field', 'label-self-monitor');
  set('mic-fx-hint-el', 'mic-fx-hint', true);

  // Re-render presets so names update
  renderMicPresets();

  // Re-render categories so "all sounds" label updates
  renderCategories();
  renderSoundGrid();

  // Highlight the active language button
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('lang-btn-active', b.dataset.lang === currentLang);
  });
}

// True only during the very first run (no language chosen yet). Drives the
// first-launch mic-setup step after audio devices have been enumerated.
let isFirstLaunch = false;

// Show the language picker overlay (first-launch)
function showLanguagePicker() {
  return new Promise(resolve => {
    const overlay = document.getElementById('lang-picker-overlay');
    if (!overlay) { resolve(); return; }
    overlay.classList.add('open');
    overlay.querySelectorAll('.lang-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        currentLang = lang;
        settings.language = lang;
        saveAppData();
        applyLanguage(lang);
        overlay.classList.remove('open');
        resolve();
      }, { once: true });
    });
  });
}

// Show the first-launch microphone setup overlay. Must be called after
// refreshAudioDevices() so the settings selects are already populated — we
// clone their options into the setup selects, then mirror the chosen devices
// back into the settings modal and persist them.
function showMicSetup() {
  return new Promise(resolve => {
    const overlay = document.getElementById('mic-setup-overlay');
    if (!overlay) { resolve(); return; }

    const inSel = document.getElementById('setup-input-device');
    const playSel = document.getElementById('setup-playback-device');
    const monSel = document.getElementById('setup-monitor-device');
    const monCheck = document.getElementById('setup-enable-monitor');

    // Mirror the (already-populated) settings-modal selects into the setup ones
    const cloneOptions = (fromId, toSel, value) => {
      const from = document.getElementById(fromId);
      toSel.innerHTML = '';
      Array.from(from.options).forEach(o => toSel.add(new Option(o.text, o.value)));
      toSel.value = Array.from(toSel.options).some(o => o.value === value) ? value : 'default';
    };
    cloneOptions('select-input-device', inSel, settings.microphoneDeviceId || 'default');
    cloneOptions('select-playback-device', playSel, settings.playbackDeviceId || 'default');
    cloneOptions('select-monitor-device', monSel, settings.monitorDeviceId || 'default');

    monCheck.checked = settings.monitorEnabled !== false;
    monSel.disabled = !monCheck.checked;
    monCheck.onchange = () => { monSel.disabled = !monCheck.checked; };

    overlay.classList.add('open');

    document.getElementById('btn-mic-setup-start').addEventListener('click', () => {
      settings.microphoneDeviceId = inSel.value;
      settings.playbackDeviceId = playSel.value;
      settings.monitorEnabled = monCheck.checked;
      settings.monitorDeviceId = monSel.value;

      // Reflect the choices in the settings modal so they stay in sync
      const sync = (id, value) => { const el = document.getElementById(id); if (el) el.value = value; };
      sync('select-input-device', settings.microphoneDeviceId);
      sync('select-playback-device', settings.playbackDeviceId);
      sync('select-monitor-device', settings.monitorDeviceId);
      const enMon = document.getElementById('enable-monitor-device');
      if (enMon) enMon.checked = settings.monitorEnabled;

      saveAppData();
      updateStatusPanel();
      overlay.classList.remove('open');
      resolve();
    }, { once: true });
  });
}

const DEFAULT_CATEGORIES = [
  { id: 'meme', name: 'Meme', color: 'magenta' },
  { id: 'gaming', name: 'Gaming', color: 'cyan' },
  { id: 'music', name: 'Musica', color: 'purple' },
  { id: 'effects', name: 'Effetti', color: 'green' }
];

// Microphone effect presets — names resolved via t() so they follow the active language
const MIC_PRESETS = [
  { id: 'none', nameKey: 'preset-none', icon: '<path d="M5 12h14"></path>' },
  { id: 'girl', nameKey: 'preset-girl', icon: '<path d="M12 3v10"></path><path d="m8 7 4-4 4 4"></path><circle cx="12" cy="18" r="3"></circle>' },
  { id: 'mask', nameKey: 'preset-mask', icon: '<path d="M12 21v-10"></path><path d="m8 17 4 4 4-4"></path><circle cx="12" cy="6" r="3"></circle>' },
  { id: 'underwater', nameKey: 'preset-underwater', icon: '<path d="M3 8c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2"></path><path d="M3 14c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2"></path>' },
  { id: 'robot', nameKey: 'preset-robot', icon: '<rect x="5" y="8" width="14" height="11" rx="2"></rect><path d="M12 8V4M9 13h.01M15 13h.01"></path>' },
  { id: 'echo', nameKey: 'preset-echo', icon: '<path d="M4 12h2l2-6 3 14 2-9 1.5 4H20"></path>' },
  { id: 'phone', nameKey: 'preset-phone', icon: '<path d="M5 4h4l1.5 5-2 1a12 12 0 0 0 5 5l1-2 5 1.5V19a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"></path>' }
];

// Audio Engine variables
let playbackContext = null;
let monitorContext = null;
let playbackAnalyser = null;
let monitorAnalyser = null;

// Microphone effect engine
let micStream = null;
let micContext = null;          // cable path → playbackDeviceId (VB-Cable, heard by other apps)
let micSourceNode = null;
let micAnalyser = null;
let micTeardownFns = [];

// Self-monitor path → monitorDeviceId (your own filtered voice in your headphones)
let micMonitorContext = null;
let micMonitorSource = null;
let micMonitorTeardownFns = [];

// Generation counters — prevent concurrent startMic* calls from overlapping
let _micEffectGen = 0;
let _micMonitorGen = 0;
let _rebuildMicTimer = null;

const audioBufferCache = new Map(); // key: filePath, value: AudioBuffer
const activePlayingSounds = new Map(); // key: soundId, value: { sourcePlay, gainPlay, sourceMon, gainMon, intervalId, startTime, duration }

// Hotkey Recording state
let isRecordingHotkey = false;
let recordedKeys = new Set();
let recordingSoundId = null;

// Initialize app on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings & sounds
  await loadAppData();

  // Request mic permission so device names are resolved
  await requestMediaPermissions();

  // Populate output audio devices lists
  await refreshAudioDevices();

  // First launch: let the user pick their mic/output devices before the audio
  // engine spins up, so the chosen sinkIds take effect immediately.
  if (isFirstLaunch) {
    await showMicSetup();
  }

  // Initialize Audio Contexts
  initAudioEngine();

  // Render Category Menu & Sounds Grid
  renderCategories();
  renderSoundGrid();

  // Build mic effect preset cards
  renderMicPresets();

  // Start Canvas Spectrum Visualizer animation loop
  initVisualizer();
  initMicMeter();

  // Set up event listeners
  setupEventListeners();

  // Wire the auto-updater UI
  initUpdater();

  // Detect/install virtual mic (VB-Cable)
  initVirtualMic();

  // Resume microphone effect chain if it was left enabled
  if (settings.micEffect && settings.micEffect.enabled) {
    startMicEffect();
  }
  updateMicFxButtonState();

  // Listen for background hotkey triggers from main process
  window.electronAPI.onTriggerSound((soundId) => {
    const sound = sounds.find(s => s.id === soundId);
    if (sound) {
      playSound(sound);
    }
  });

  // Handle hotkey stolen notifications
  window.electronAPI.onShortcutStolen(({ soundId, shortcut }) => {
    const sound = sounds.find(s => s.id === soundId);
    if (sound) {
      sound.hotkey = '';
      saveAppData();
      renderSoundGrid();
      showNotification(t('notif-shortcut-stolen', shortcut, sound.title));
    }
  });
});

// Request media permissions so Electron lets us read audio device names
async function requestMediaPermissions() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the tracks immediately as we only needed permission
    stream.getTracks().forEach(track => track.stop());
  } catch (err) {
    console.warn('Could not get microphone access to list devices. Generic names will be shown.', err);
  }
}

// Load configurations and soundboard data
async function loadAppData() {
  const data = await window.electronAPI.loadConfig();
  if (data) {
    if (data.sounds) sounds = data.sounds;
    if (data.settings) settings = { ...settings, ...data.settings };
  } else {
    // Seed default settings and empty sounds
    sounds = [];
    saveAppData();
  }

  // Seed categories on first run / migrate old configs
  if (!Array.isArray(settings.categories) || settings.categories.length === 0) {
    settings.categories = DEFAULT_CATEGORIES.map(c => ({ ...c }));
  }
  // Guard the mic effect shape against partial/old configs
  if (!settings.micEffect || typeof settings.micEffect !== 'object') {
    settings.micEffect = { enabled: false, type: 'none', intensity: 0.5, selfMonitor: false };
  }
  if (typeof settings.micEffect.selfMonitor !== 'boolean') {
    settings.micEffect.selfMonitor = false;
  }

  // Apply saved language (or show picker if not yet chosen)
  if (settings.language && STRINGS[settings.language]) {
    currentLang = settings.language;
  } else {
    // First launch: show language picker before continuing. The mic-setup step
    // is shown later (in DOMContentLoaded) once audio devices are enumerated.
    isFirstLaunch = true;
    await showLanguagePicker();
  }
  applyLanguage(currentLang);

  // Register all saved hotkeys in the Electron backend
  for (const sound of sounds) {
    if (sound.hotkey) {
      await window.electronAPI.registerShortcut(sound.id, sound.hotkey);
    }
  }

  // Set UI elements with loaded settings
  updateSettingsUI();
  updateStatusPanel();
}

// Save configurations and soundboard data
async function saveAppData() {
  const config = {
    sounds,
    settings
  };
  await window.electronAPI.saveConfig(config);
  updateStatusPanel();
}

// Paint the filled portion of a range input so it tracks the thumb
function updateRangeFill(input) {
  if (!input) return;
  const min = parseFloat(input.min) || 0;
  const max = parseFloat(input.max) || 100;
  const val = parseFloat(input.value);
  const pct = max > min ? ((val - min) / (max - min)) * 100 : 0;
  input.style.setProperty('--p', `${pct}%`);
}

// Update UI settings panel values
function updateSettingsUI() {
  document.getElementById('enable-monitor-device').checked = settings.monitorEnabled;
  document.getElementById('select-input-device').value = settings.microphoneDeviceId || 'default';
  document.getElementById('select-playback-device').value = settings.playbackDeviceId;
  document.getElementById('select-monitor-device').value = settings.monitorDeviceId;
  
  document.getElementById('slider-amplifier').value = settings.globalAmplifier * 100;
  document.getElementById('val-amplifier').textContent = `${settings.globalAmplifier.toFixed(1)}x (${Math.round(20 * Math.log10(settings.globalAmplifier))} dB)`;
  
  document.getElementById('slider-playback-vol').value = settings.playbackVolume;
  document.getElementById('val-playback-vol').textContent = `${settings.playbackVolume}%`;
  
  document.getElementById('slider-monitor-vol').value = settings.monitorVolume;
  document.getElementById('val-monitor-vol').textContent = `${settings.monitorVolume}%`;
  
  document.getElementById('slider-fade-duration').value = settings.fadeDuration;
  document.getElementById('val-fade-duration').textContent = `${settings.fadeDuration} ms`;

  // Toggle monitor dropdown state based on checkbox
  document.getElementById('select-monitor-device').disabled = !settings.monitorEnabled;
  updateRouteSummary();

  // Repaint all slider fills
  ['slider-amplifier', 'slider-playback-vol', 'slider-monitor-vol', 'slider-fade-duration']
    .forEach(id => updateRangeFill(document.getElementById(id)));
}

// Update TOP HUD status values
function updateStatusPanel() {
  // We will resolve device names from select values
  const inputSelect = document.getElementById('select-input-device');
  const playSelect = document.getElementById('select-playback-device');
  const monSelect = document.getElementById('select-monitor-device');

  const micName = inputSelect.options[inputSelect.selectedIndex]?.text || settings.microphoneDeviceId || t('default-mic-display');
  const playName = playSelect.options[playSelect.selectedIndex]?.text || settings.playbackDeviceId;
  const monName = settings.monitorEnabled
    ? (monSelect.options[monSelect.selectedIndex]?.text || settings.monitorDeviceId)
    : t('default-monitor-display');

  document.getElementById('status-playback-device').textContent = playName;
  document.getElementById('status-microphone-device').textContent = micName;
  document.getElementById('status-monitor-device').textContent = monName;
  document.getElementById('status-amplifier').textContent = `${settings.globalAmplifier.toFixed(1)}x`;
  updateRouteSummary();
}

function normalizeDeviceName(label) {
  return label
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(input|output|ingresso|uscita|microphone|mic|speaker|speakers|cuffie|headphones|altoparlanti|dispositivo|device|audio)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function findMatchingOutputForInput(inputDevice, outputDevices) {
  const inputLabel = inputDevice?.label || '';
  if (!inputLabel) return null;

  const exactCablePair = inputLabel
    .replace(/\bOutput\b/i, 'Input')
    .replace(/\bUscita\b/i, 'Ingresso');

  const exactMatch = outputDevices.find(device => device.label && device.label.toLowerCase() === exactCablePair.toLowerCase());
  if (exactMatch) return exactMatch;

  const normalizedInput = normalizeDeviceName(inputLabel);
  if (!normalizedInput) return null;

  return outputDevices.find(device => {
    const normalizedOutput = normalizeDeviceName(device.label || '');
    return normalizedOutput && (normalizedOutput === normalizedInput || normalizedOutput.includes(normalizedInput) || normalizedInput.includes(normalizedOutput));
  }) || null;
}

function updateRouteSummary() {
  const inputSelect = document.getElementById('select-input-device');
  const playSelect = document.getElementById('select-playback-device');
  const monSelect = document.getElementById('select-monitor-device');
  const routePlayback = document.getElementById('route-playback-name');
  const routeMicrophone = document.getElementById('route-microphone-name');
  const routeMonitor = document.getElementById('route-monitor-name');
  const hint = document.getElementById('route-hint');

  if (!inputSelect || !playSelect || !monSelect || !routePlayback || !routeMicrophone || !routeMonitor || !hint) return;

  routePlayback.textContent = playSelect.options[playSelect.selectedIndex]?.text || 'Default';
  routeMicrophone.textContent = inputSelect.options[inputSelect.selectedIndex]?.text || 'Microfono predefinito';
  routeMonitor.textContent = settings.monitorEnabled
    ? (monSelect.options[monSelect.selectedIndex]?.text || t('default-mic-display'))
    : t('default-monitor-display');

  const micSelected = (settings.microphoneDeviceId || 'default') !== 'default';
  const outputSelected = settings.playbackDeviceId !== 'default';
  if (micSelected && outputSelected) {
    hint.textContent = t('route-hint-matched');
  } else if (micSelected) {
    hint.textContent = t('route-hint-mic');
  } else {
    hint.textContent = t('route-hint-default');
  }
}

// Fetch audio devices and populate dropdown selectors
async function refreshAudioDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const outputs = devices.filter(device => device.kind === 'audiooutput');
    const inputs = devices.filter(device => device.kind === 'audioinput');

    const inputSelect = document.getElementById('select-input-device');
    const playSelect = document.getElementById('select-playback-device');
    const monSelect = document.getElementById('select-monitor-device');

    // Save current values
    const currentInputVal = settings.microphoneDeviceId || 'default';
    const currentPlayVal = settings.playbackDeviceId;
    const currentMonVal = settings.monitorDeviceId;

    // Reset dropdowns
    inputSelect.innerHTML = '';
    playSelect.innerHTML = '';
    monSelect.innerHTML = '';

    // Add Default option
    const defOptionInput = new Option(t('default-mic'), 'default');
    const defOptionPlay = new Option(t('default-playback'), 'default');
    const defOptionMon = new Option(t('default-monitor'), 'default');
    inputSelect.add(defOptionInput);
    playSelect.add(defOptionPlay);
    monSelect.add(defOptionMon);

    inputs.forEach(device => {
      const label = device.label || `Microfono (${device.deviceId.slice(0, 5)}...)`;
      inputSelect.add(new Option(label, device.deviceId));
    });

    outputs.forEach(device => {
      // Use deviceId or fallback, filter empty labels
      const label = device.label || `Dispositivo di output (${device.deviceId.slice(0, 5)}...)`;
      playSelect.add(new Option(label, device.deviceId));
      monSelect.add(new Option(label, device.deviceId));
    });

    // Restore selected values if still exist
    if (Array.from(inputSelect.options).some(opt => opt.value === currentInputVal)) {
      inputSelect.value = currentInputVal;
    } else {
      inputSelect.value = 'default';
      settings.microphoneDeviceId = 'default';
    }

    if (Array.from(playSelect.options).some(opt => opt.value === currentPlayVal)) {
      playSelect.value = currentPlayVal;
    } else {
      playSelect.value = 'default';
      settings.playbackDeviceId = 'default';
    }

    if (Array.from(monSelect.options).some(opt => opt.value === currentMonVal)) {
      monSelect.value = currentMonVal;
    } else {
      monSelect.value = 'default';
      settings.monitorDeviceId = 'default';
    }

    updateStatusPanel();
  } catch (err) {
    console.error("Errore nell'elencare i dispositivi audio:", err);
  }
}

// Initialize Web Audio contexts and analysers
function initAudioEngine() {
  try {
    if (playbackContext) {
      playbackContext.close().catch(() => {});
    }
    // Create context without sinkId in constructor — passing an invalid saved
    // deviceId here throws and leaves playbackContext null, breaking all playback.
    // Instead we always create with defaults and apply sinkId separately.
    playbackContext = new AudioContext({ latencyHint: 'interactive' });
    playbackAnalyser = playbackContext.createAnalyser();
    playbackAnalyser.fftSize = 2048;

    if (settings.playbackDeviceId !== 'default') {
      playbackContext.setSinkId(settings.playbackDeviceId).catch(err => {
        console.warn('setSinkId (playback) falló:', err);
        settings.playbackDeviceId = 'default';
      });
    }

    if (settings.monitorEnabled) {
      if (monitorContext) {
        monitorContext.close().catch(() => {});
      }
      monitorContext = new AudioContext({ latencyHint: 'interactive' });
      monitorAnalyser = monitorContext.createAnalyser();
      monitorAnalyser.fftSize = 2048;
      monitorAnalyser.connect(monitorContext.destination);

      if (settings.monitorDeviceId !== 'default') {
        monitorContext.setSinkId(settings.monitorDeviceId).catch(err => {
          console.warn('setSinkId (monitor) falló:', err);
          settings.monitorDeviceId = 'default';
        });
      }
    } else {
      if (monitorContext) {
        monitorContext.close().catch(() => {});
        monitorContext = null;
      }
      monitorAnalyser = null;
    }
  } catch (e) {
    console.error("Errore durante l'inizializzazione del motore audio:", e);
  }
}

// Handle dynamic device updates
async function updateAudioDestinations() {
  initAudioEngine();
  updateStatusPanel();
}

async function getDecodedBuffer(filePath) {
  if (audioBufferCache.has(filePath)) {
    return audioBufferCache.get(filePath);
  }

  // Use media://app/ so the path lands in the URL pathname (not the hostname).
  // Treating a Windows path as the URL host causes Chromium to mangle it.
  const response = await fetch(`media://app/${encodeURIComponent(filePath)}`);
  if (!response.ok) {
    throw new Error(`File non accessibile (HTTP ${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  if (!arrayBuffer.byteLength) {
    throw new Error('File vuoto o percorso non valido');
  }

  // Reuse the existing AudioContext instead of a throwaway OfflineAudioContext.
  // OfflineAudioContext(1,1,44100) — one-sample length — is unreliable for decoding
  // in some Chromium builds.
  if (!playbackContext) initAudioEngine();
  const audioBuffer = await playbackContext.decodeAudioData(arrayBuffer);

  audioBufferCache.set(filePath, audioBuffer);
  return audioBuffer;
}

// Play Soundboard Sound
async function playSound(sound) {
  if (!playbackContext) initAudioEngine();
  if (!playbackContext) {
    showNotification(t('notif-audio-error'));
    return;
  }

  const card = document.querySelector(`.sound-card[data-id="${sound.id}"]`);

  if (activePlayingSounds.has(sound.id)) {
    stopSound(sound.id);
    return;
  }

  setCardLoading(sound.id, true);

  try {
    const buffer = await getDecodedBuffer(sound.filePath);
    setCardLoading(sound.id, false);

    // Resume Audio Contexts if suspended (browser behavior)
    if (playbackContext && playbackContext.state === 'suspended') {
      await playbackContext.resume();
    }
    if (monitorContext && monitorContext.state === 'suspended') {
      await monitorContext.resume();
    }

    // Double check if device changed or if we need to sync sinkIds
    if (playbackContext && playbackContext.sinkId !== settings.playbackDeviceId) {
      if (settings.playbackDeviceId === 'default') {
        await playbackContext.setSinkId('');
      } else {
        await playbackContext.setSinkId(settings.playbackDeviceId);
      }
    }
    if (monitorContext && settings.monitorEnabled && monitorContext.sinkId !== settings.monitorDeviceId) {
      if (settings.monitorDeviceId === 'default') {
        await monitorContext.setSinkId('');
      } else {
        await monitorContext.setSinkId(settings.monitorDeviceId);
      }
    }

    // Playback Channel
    const sourcePlay = playbackContext.createBufferSource();
    sourcePlay.buffer = buffer;
    
    const gainPlay = playbackContext.createGain();
    const indVolume = sound.volume / 100;
    const playVolume = settings.playbackVolume / 100;
    const targetGainPlay = indVolume * playVolume * settings.globalAmplifier;

    sourcePlay.connect(gainPlay);

    // If monitor is disabled, route visualizer to playback channel
    if (!settings.monitorEnabled && playbackAnalyser) {
      gainPlay.connect(playbackAnalyser);
      playbackAnalyser.connect(playbackContext.destination);
    } else {
      gainPlay.connect(playbackContext.destination);
    }

    // Monitor Channel (Optional)
    let sourceMon = null;
    let gainMon = null;
    const targetGainMon = indVolume * (settings.monitorVolume / 100) * settings.globalAmplifier;

    if (monitorContext && settings.monitorEnabled && monitorAnalyser) {
      sourceMon = monitorContext.createBufferSource();
      sourceMon.buffer = buffer;

      gainMon = monitorContext.createGain();
      sourceMon.connect(gainMon);
      gainMon.connect(monitorAnalyser);
    }

    // Apply fade-in
    const fadeTime = settings.fadeDuration / 1000; // convert to seconds
    if (fadeTime > 0) {
      gainPlay.gain.setValueAtTime(0, playbackContext.currentTime);
      gainPlay.gain.linearRampToValueAtTime(targetGainPlay, playbackContext.currentTime + fadeTime);

      if (gainMon && monitorContext) {
        gainMon.gain.setValueAtTime(0, monitorContext.currentTime);
        gainMon.gain.linearRampToValueAtTime(targetGainMon, monitorContext.currentTime + fadeTime);
      }
    } else {
      gainPlay.gain.setValueAtTime(targetGainPlay, playbackContext.currentTime);
      if (gainMon) gainMon.gain.setValueAtTime(targetGainMon, monitorContext.currentTime);
    }

    // Start playing
    const startPlayTime = playbackContext.currentTime;
    sourcePlay.start(startPlayTime);

    if (sourceMon && monitorContext) {
      const startMonTime = monitorContext.currentTime;
      sourceMon.start(startMonTime);
    }

    // Update UI playing state
    if (card) {
      card.classList.add('playing');
      const playIcon = card.querySelector('.btn-play-sound');
      if (playIcon) {
        playIcon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>`;
      }
    }

    // Start progress tracking
    const startTime = Date.now();
    const duration = buffer.duration;
    const progressBar = card?.querySelector('.card-progress-bar');

    const intervalId = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = (elapsed / duration) * 100;
      if (progressBar) {
        progressBar.style.width = `${Math.min(progress, 100)}%`;
      }
    }, 50);

    // Stop and cleanup when audio ends naturally
    sourcePlay.onended = () => {
      const active = activePlayingSounds.get(sound.id);
      if (active && active.intervalId === intervalId) {
        cleanupSoundUI(sound.id);
        activePlayingSounds.delete(sound.id);
      }
    };

    activePlayingSounds.set(sound.id, {
      sourcePlay,
      gainPlay,
      sourceMon,
      gainMon,
      intervalId,
      startTime,
      duration
    });

  } catch (err) {
    setCardLoading(sound.id, false);
    console.error("Errore durante la riproduzione del suono:", err);
    showNotification(t('notif-sound-error', err?.message || 'file non supportato'));
  }
}

// Stop Soundboard Sound
function stopSound(soundId) {
  const active = activePlayingSounds.get(soundId);
  if (!active) return;

  clearInterval(active.intervalId);

  const fadeTime = settings.fadeDuration / 1000; // in seconds

  try {
    if (fadeTime > 0 && playbackContext) {
      // Fade out
      active.gainPlay.gain.setValueAtTime(active.gainPlay.gain.value, playbackContext.currentTime);
      active.gainPlay.gain.linearRampToValueAtTime(0, playbackContext.currentTime + fadeTime);
      active.sourcePlay.stop(playbackContext.currentTime + fadeTime);

      if (active.gainMon && monitorContext) {
        active.gainMon.gain.setValueAtTime(active.gainMon.gain.value, monitorContext.currentTime);
        active.gainMon.gain.linearRampToValueAtTime(0, monitorContext.currentTime + fadeTime);
        active.sourceMon.stop(monitorContext.currentTime + fadeTime);
      }
    } else {
      active.sourcePlay.stop();
      if (active.sourceMon) active.sourceMon.stop();
    }
  } catch (e) {
    // Might have already ended
  }

  cleanupSoundUI(soundId);
  activePlayingSounds.delete(soundId);
}

// Stop All Playing Sounds
function stopAllSounds() {
  for (const soundId of activePlayingSounds.keys()) {
    stopSound(soundId);
  }
}

// Reset sound card UI
function cleanupSoundUI(soundId) {
  const card = document.querySelector(`.sound-card[data-id="${soundId}"]`);
  if (card) {
    card.classList.remove('playing');
    const playIcon = card.querySelector('.btn-play-sound');
    if (playIcon) {
      playIcon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    }
    const progressBar = card.querySelector('.card-progress-bar');
    if (progressBar) {
      progressBar.style.width = '0%';
    }
  }
}

// Set card spinner loading state
function setCardLoading(soundId, isLoading) {
  const card = document.querySelector(`.sound-card[data-id="${soundId}"]`);
  if (!card) return;
  const playIcon = card.querySelector('.btn-play-sound');
  if (!playIcon) return;
  
  if (isLoading) {
    playIcon.disabled = true;
    playIcon.innerHTML = `<svg class="spinner" viewBox="0 0 50 50" width="20" height="20" style="animation: spin 1s linear infinite;"><circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" stroke-width="5" stroke-dasharray="80 200"></circle></svg>`;
    
    // Inline spin animation styles injection if not exist
    if (!document.getElementById('spin-anim')) {
      const style = document.createElement('style');
      style.id = 'spin-anim';
      style.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }
  } else {
    playIcon.disabled = false;
    playIcon.innerHTML = `<svg viewBox="0 0 24 24" width="20" height="20"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
  }
}

// Escape user-provided strings before injecting into innerHTML
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// Render Categories Menu list (dynamic, from settings.categories)
function renderCategories() {
  const list = document.getElementById('category-list');
  if (!list) return;

  // keep active highlight valid
  if (activeCategory !== 'all' && !settings.categories.some(c => c.id === activeCategory)) {
    activeCategory = 'all';
  }

  list.innerHTML = '';
  list.appendChild(buildCategoryItem({ id: 'all', name: t('all-sounds'), color: null }, false));
  settings.categories.forEach(cat => list.appendChild(buildCategoryItem(cat, true)));

  const activeName = activeCategory === 'all'
    ? t('all-sounds')
    : (settings.categories.find(c => c.id === activeCategory)?.name || t('all-sounds'));
  document.getElementById('current-category-title').textContent = activeName;
}

function buildCategoryItem(cat, editable) {
  const li = document.createElement('li');
  li.className = 'cat category-item' + (cat.id === activeCategory ? ' active' : '');
  li.setAttribute('data-category', cat.id);
  li.style.setProperty('--c', cat.color ? colorToken(cat.color) : 'var(--foreground)');

  li.innerHTML = `<span class="cat-name">${escapeHtml(cat.name)}</span>` + (editable ? `
    <span class="cat-actions">
      <button class="cat-act rename" title="${t('cat-rename-title')}" aria-label="${t('cat-rename-title')}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>
      </button>
      <button class="cat-act remove" title="${t('cat-delete-title')}" aria-label="${t('cat-delete-title')}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path></svg>
      </button>
    </span>` : '');

  li.addEventListener('click', (e) => {
    if (e.target.closest('.cat-act')) return;
    setActiveCategory(cat.id);
  });

  if (editable) {
    li.querySelector('.rename').addEventListener('click', (e) => { e.stopPropagation(); renameCategory(cat.id); });
    li.querySelector('.remove').addEventListener('click', (e) => { e.stopPropagation(); deleteCategory(cat.id); });
  }
  return li;
}

function setActiveCategory(id) {
  activeCategory = id;
  renderCategories();
  renderSoundGrid();
}

// Inline category creation — a temporary <li> appears directly in the list
function openCategoryInlineEdit() {
  const list = document.getElementById('category-list');
  if (!list) return;

  // Toggle off if already open
  const existing = list.querySelector('.cat-inline-edit');
  if (existing) { existing.remove(); return; }

  // Auto-pick a color not yet used
  const usedColors = settings.categories.map(c => c.color);
  const autoColor = (COLOR_OPTIONS.find(c => !usedColors.includes(c.id)) || COLOR_OPTIONS[0]).id;
  let editColor = autoColor;

  const li = document.createElement('li');
  li.className = 'cat cat-inline-edit';
  li.innerHTML = `<input class="cat-edit-input" type="text" placeholder="Nome categoria…" maxlength="24"><span class="cat-edit-swatches"></span>`;

  const swatchHost = li.querySelector('.cat-edit-swatches');
  COLOR_OPTIONS.forEach(c => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'cat-swatch' + (c.id === editColor ? ' selected' : '');
    b.style.setProperty('--c', c.token);
    b.title = c.label;
    b.setAttribute('data-color', c.id);
    b.addEventListener('mousedown', (e) => {
      e.preventDefault(); // don't steal focus from input
      editColor = c.id;
      swatchHost.querySelectorAll('.cat-swatch').forEach(s => s.classList.remove('selected'));
      b.classList.add('selected');
    });
    swatchHost.appendChild(b);
  });

  list.appendChild(li);
  const input = li.querySelector('.cat-edit-input');
  input.placeholder = t('cat-name-ph');
  input.focus();

  let committed = false;
  function commit() {
    if (committed) return;
    committed = true;
    const name = input.value.trim();
    li.remove();
    if (!name) return;
    const id = 'cat_' + Date.now().toString(36);
    settings.categories.push({ id, name, color: editColor });
    saveAppData();
    renderCategories();
  }
  function cancel() {
    if (committed) return;
    committed = true;
    li.remove();
  }

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  });
  input.addEventListener('blur', () => setTimeout(commit, 180));
}

function renameCategory(id) {
  const cat = settings.categories.find(c => c.id === id);
  if (!cat) return;
  const name = prompt(t('rename-cat-prompt', cat.name), cat.name);
  if (name === null) return;
  const trimmed = name.trim();
  if (!trimmed) return;
  cat.name = trimmed;
  saveAppData();
  renderCategories();
}

function deleteCategory(id) {
  const cat = settings.categories.find(c => c.id === id);
  if (!cat) return;
  const count = sounds.filter(s => s.category === id).length;
  const msg = count > 0
    ? t('confirm-delete-cat-sounds', cat.name, count)
    : t('confirm-delete-cat', cat.name);
  if (!confirm(msg)) return;
  sounds.forEach(s => { if (s.category === id) s.category = ''; });
  settings.categories = settings.categories.filter(c => c.id !== id);
  if (activeCategory === id) activeCategory = 'all';
  saveAppData();
  renderCategories();
  renderSoundGrid();
}

// Populate the sound modal's category dropdown from current categories
function populateCategorySelect() {
  const sel = document.getElementById('sound-category');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '';
  settings.categories.forEach(c => sel.add(new Option(c.name, c.id)));
  if (settings.categories.some(c => c.id === prev)) sel.value = prev;
}

// Build a deterministic mini waveform (bar heights derived from a seed string)
function buildMiniWave(seed) {
  const bars = 26;
  let acc = 0;
  for (let i = 0; i < seed.length; i++) acc += seed.charCodeAt(i);
  let html = '';
  for (let i = 0; i < bars; i++) {
    const t = (Math.sin(acc * 0.13 + i * 0.7) + Math.sin(i * 0.31 + acc)) * 0.5;
    const h = Math.round((0.25 + Math.abs(t) * 0.7) * 100);
    html += `<i style="height:${h}%"></i>`;
  }
  return html;
}

// Render Sound Cards grid
function renderSoundGrid() {
  const grid = document.getElementById('sound-grid');
  const emptyState = document.getElementById('empty-state');
  
  // Filter sounds
  let filtered = sounds;
  if (activeCategory !== 'all') {
    filtered = sounds.filter(s => s.category === activeCategory);
  }
  if (searchQuery) {
    filtered = filtered.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }

  // Update counts
  document.getElementById('sounds-count').textContent = t('sounds-count', filtered.length);

  // If empty
  if (filtered.length === 0) {
    grid.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }

  grid.style.display = 'grid';
  emptyState.style.display = 'none';
  grid.innerHTML = '';

  filtered.forEach((sound, index) => {
    const isPlaying = activePlayingSounds.has(sound.id);
    const hotkeyText = sound.hotkey ? sound.hotkey : t('hotkey-none');

    const card = document.createElement('div');
    card.className = `sound-card pad color-${sound.color || 'purple'} ${isPlaying ? 'playing' : ''}`;
    card.setAttribute('data-id', sound.id);
    // Staggered entrance, capped so large libraries stay snappy
    card.style.animationDelay = `${Math.min(index * 26, 320)}ms`;

    // Extract file duration string if buffered, or generic label
    let durationText = '--:--';
    if (audioBufferCache.has(sound.filePath)) {
      const minutes = Math.floor(audioBufferCache.get(sound.filePath).duration / 60);
      const seconds = Math.floor(audioBufferCache.get(sound.filePath).duration % 60);
      durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    card.innerHTML = `
      <div class="pad-top">
        <div class="pad-id">
          <div class="card-title" title="${sound.title}">${sound.title}</div>
          <div class="card-duration">${durationText}</div>
        </div>
        <button class="btn-play-sound" aria-label="Riproduci ${sound.title}">
          ${isPlaying
            ? `<svg viewBox="0 0 24 24" width="20" height="20"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>`
            : `<svg viewBox="0 0 24 24" width="20" height="20"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`}
        </button>
      </div>
      <div class="mini-wave">${buildMiniWave(sound.id + sound.title)}</div>
      <div class="pad-bottom">
        <span class="card-hotkey" title="Scorciatoia tasti">${hotkeyText}</span>
        <div class="card-actions-menu">
          <button class="btn-card-action edit-btn" title="Modifica" aria-label="Modifica">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"></path></svg>
          </button>
          <button class="btn-card-action delete delete-btn" title="Elimina" aria-label="Elimina">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M10 11v6M14 11v6"></path></svg>
          </button>
        </div>
      </div>
      <div class="card-progress-container">
        <div class="card-progress-bar"></div>
      </div>
    `;

    // Hook events inside card
    card.querySelector('.btn-play-sound').addEventListener('click', (e) => {
      e.stopPropagation();
      playSound(sound);
    });
    
    card.querySelector('.edit-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openSoundModal(sound);
    });

    card.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      deleteSound(sound.id);
    });

    // Allow double clicking card to play
    card.addEventListener('dblclick', () => {
      playSound(sound);
    });

    // Populate duration asynchronously if not already cached
    if (durationText === '--:--') {
      getDecodedBuffer(sound.filePath).then(buffer => {
        const minutes = Math.floor(buffer.duration / 60);
        const seconds = Math.floor(buffer.duration % 60);
        const durationSpan = card.querySelector('.card-duration');
        if (durationSpan) {
          durationSpan.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
      }).catch(() => {});
    }

    grid.appendChild(card);
  });
}

// Add/Edit Sound Actions
async function deleteSound(soundId) {
  if (confirm(t('confirm-delete-sound'))) {
    stopSound(soundId);
    
    // Unregister hotkey
    await window.electronAPI.unregisterShortcut(soundId);
    
    sounds = sounds.filter(s => s.id !== soundId);
    await saveAppData();
    renderSoundGrid();
  }
}

// Modals Trigger
function openSoundModal(sound = null) {
  const modal = document.getElementById('sound-modal');
  const title = document.getElementById('sound-modal-title');
  const form = document.getElementById('sound-form');
  
  // Reset form
  form.reset();
  populateCategorySelect();
  document.getElementById('file-name-preview').textContent = t('no-file');
  document.getElementById('sound-file-path').value = '';
  document.getElementById('sound-id').value = '';
  document.getElementById('sound-hotkey').value = '';
  document.getElementById('hotkey-display').textContent = t('hotkey-none');
  document.getElementById('sound-volume-val').textContent = '80%';
  document.getElementById('sound-volume').value = 80;
  updateRangeFill(document.getElementById('sound-volume'));
  
  if (sound) {
    title.textContent = t('sound-modal-edit');
    document.getElementById('sound-id').value = sound.id;
    document.getElementById('sound-title').value = sound.title;
    document.getElementById('sound-file-path').value = sound.filePath;
    
    // Display basename of file path
    const parts = sound.filePath.split(/[\\/]/);
    document.getElementById('file-name-preview').textContent = parts[parts.length - 1];
    
    document.getElementById('sound-category').value = sound.category;
    document.getElementById('sound-color').value = sound.color;
    document.getElementById('sound-volume').value = sound.volume;
    document.getElementById('sound-volume-val').textContent = `${sound.volume}%`;
    updateRangeFill(document.getElementById('sound-volume'));
    document.getElementById('sound-hotkey').value = sound.hotkey;
    document.getElementById('hotkey-display').textContent = sound.hotkey || t('hotkey-none');
  } else {
    title.textContent = t('sound-modal-new');
  }

  modal.classList.add('open');
}

function closeSoundModal() {
  document.getElementById('sound-modal').classList.remove('open');
  // Reset hotkey recorder state if active
  isRecordingHotkey = false;
  const recordBtn = document.getElementById('btn-record-hotkey');
  recordBtn.classList.remove('btn-accent');
  recordBtn.classList.add('btn-soft');
  recordBtn.textContent = t('btn-record');
  document.getElementById('hotkey-display').classList.remove('recording');
}

function openSettingsModal() {
  updateSettingsUI();
  document.getElementById('settings-modal').classList.add('open');
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.remove('open');
}

// Hotkey Recording engine
function startHotkeyRecording(soundId) {
  isRecordingHotkey = true;
  recordingSoundId = soundId;
  recordedKeys.clear();

  const recordBtn = document.getElementById('btn-record-hotkey');
  recordBtn.textContent = t('btn-recording');
  recordBtn.classList.add('btn-accent');
  recordBtn.classList.remove('btn-soft');

  const hotkeyDisplay = document.getElementById('hotkey-display');
  hotkeyDisplay.textContent = t('hotkey-press');
  hotkeyDisplay.classList.add('recording');
}

function stopHotkeyRecording(cancelled = false) {
  isRecordingHotkey = false;

  const recordBtn = document.getElementById('btn-record-hotkey');
  recordBtn.classList.remove('btn-accent');
  recordBtn.classList.add('btn-soft');
  recordBtn.textContent = t('btn-record');

  const hotkeyDisplay = document.getElementById('hotkey-display');
  hotkeyDisplay.classList.remove('recording');

  if (cancelled) {
    const inputVal = document.getElementById('sound-hotkey').value;
    hotkeyDisplay.textContent = inputVal || t('hotkey-none');
    return;
  }

  const shortcutStr = formatElectronShortcut(recordedKeys);
  if (shortcutStr) {
    document.getElementById('sound-hotkey').value = shortcutStr;
    hotkeyDisplay.textContent = shortcutStr;
    // One-time warning when no modifier is used (single key will intercept typing in other apps)
    const hasModifier = recordedKeys.has('Control') || recordedKeys.has('Alt') || recordedKeys.has('Shift');
    if (!hasModifier) {
      showNotification(t('notif-shortcut-warning'));
    }
  } else {
    hotkeyDisplay.textContent = t('hotkey-none');
    document.getElementById('sound-hotkey').value = '';
  }
}

// Translate key states to Electron shortcut representation.
// Returns '' if there is no non-modifier key in the set.
function formatElectronShortcut(keysSet) {
  const parts = [];
  if (keysSet.has('Control')) parts.push('Ctrl');
  if (keysSet.has('Alt')) parts.push('Alt');
  if (keysSet.has('Shift')) parts.push('Shift');

  for (const key of keysSet) {
    if (key !== 'Control' && key !== 'Alt' && key !== 'Shift') {
      if (key === ' ') parts.push('Space');
      else if (key.length === 1) parts.push(key.toUpperCase());
      else parts.push(key);
    }
  }

  // Require at least one non-modifier key
  const hasMain = parts.some(p => !['Ctrl', 'Alt', 'Shift'].includes(p));
  if (!hasMain) return '';

  return parts.join('+');
}

// Event Listeners setup
function setupEventListeners() {
  // Search bar
  document.getElementById('search-input').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderSoundGrid();
  });

  // Stop All button
  document.getElementById('btn-stop-all').addEventListener('click', stopAllSounds);

  // Global ESC key listener to stop all sounds
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Close modals if open, else stop all
      const settingsModal = document.getElementById('settings-modal');
      const soundModal = document.getElementById('sound-modal');
      
      const micFxModal = document.getElementById('mic-fx-modal');
      if (settingsModal.classList.contains('open')) {
        closeSettingsModal();
      } else if (soundModal.classList.contains('open')) {
        closeSoundModal();
      } else if (micFxModal && micFxModal.classList.contains('open')) {
        closeMicFxModal();
      } else {
        stopAllSounds();
      }
    }
  });

  // Add Sound button
  document.getElementById('btn-add-sound').addEventListener('click', () => openSoundModal());
  document.getElementById('btn-empty-add').addEventListener('click', () => openSoundModal());

  // Close modals buttons
  document.getElementById('btn-close-sound-modal').addEventListener('click', closeSoundModal);
  document.getElementById('btn-cancel-sound-modal').addEventListener('click', closeSoundModal);
  document.getElementById('btn-close-settings-modal').addEventListener('click', closeSettingsModal);

  // Settings trigger
  document.getElementById('btn-open-settings').addEventListener('click', openSettingsModal);

  // File Picker Browse Link trigger
  document.getElementById('link-browse-file').addEventListener('click', async (e) => {
    e.preventDefault();
    const filePath = await window.electronAPI.selectFile();
    if (filePath) {
      handleFileSelected(filePath);
    }
  });

  // File drag and drop
  const dropZone = document.getElementById('file-drop-zone');
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const validExtensions = ['.mp3', '.mp4', '.wav', '.ogg', '.m4a'];
      const ext = file.path.slice(file.path.lastIndexOf('.')).toLowerCase();
      
      if (validExtensions.includes(ext)) {
        handleFileSelected(file.path);
      } else {
        showNotification(t('notif-file-unsupported'));
      }
    }
  });

  // Slider feedback events
  document.getElementById('sound-volume').addEventListener('input', (e) => {
    document.getElementById('sound-volume-val').textContent = `${e.target.value}%`;
    updateRangeFill(e.target);
  });

  document.getElementById('slider-playback-vol').addEventListener('input', (e) => {
    settings.playbackVolume = parseInt(e.target.value);
    document.getElementById('val-playback-vol').textContent = `${settings.playbackVolume}%`;
    updateRangeFill(e.target);
  });

  document.getElementById('slider-monitor-vol').addEventListener('input', (e) => {
    settings.monitorVolume = parseInt(e.target.value);
    document.getElementById('val-monitor-vol').textContent = `${settings.monitorVolume}%`;
    updateRangeFill(e.target);
  });

  document.getElementById('slider-amplifier').addEventListener('input', (e) => {
    settings.globalAmplifier = parseFloat(e.target.value) / 100;
    document.getElementById('val-amplifier').textContent = `${settings.globalAmplifier.toFixed(1)}x (${Math.round(20 * Math.log10(settings.globalAmplifier))} dB)`;
    updateRangeFill(e.target);
  });

  document.getElementById('slider-fade-duration').addEventListener('input', (e) => {
    settings.fadeDuration = parseInt(e.target.value);
    document.getElementById('val-fade-duration').textContent = `${settings.fadeDuration} ms`;
    updateRangeFill(e.target);
  });

  // Category inline creation
  document.getElementById('btn-add-category').addEventListener('click', openCategoryInlineEdit);

  // Mic FX modal
  document.getElementById('btn-open-mic-fx').addEventListener('click', openMicFxModal);
  document.getElementById('btn-close-mic-fx-modal').addEventListener('click', closeMicFxModal);

  // Microphone effect controls (inside mic-fx modal)
  document.getElementById('enable-mic-effect').addEventListener('change', (e) => {
    settings.micEffect.enabled = e.target.checked;
    document.getElementById('mic-fx-body').classList.toggle('disabled', !e.target.checked);
    updateMicFxButtonState();
    saveAppData();
    if (e.target.checked) startMicEffect();
    else stopMicEffect();
  });

  document.getElementById('slider-mic-intensity').addEventListener('input', (e) => {
    settings.micEffect.intensity = parseInt(e.target.value) / 100;
    document.getElementById('val-mic-intensity').textContent = `${e.target.value}%`;
    updateRangeFill(e.target);
    saveAppData();
    rebuildMicGraphsDebounced();
  });

  // Self-monitor: hear your own filtered voice in your headphones (monitor device)
  document.getElementById('enable-mic-self-monitor').addEventListener('change', (e) => {
    settings.micEffect.selfMonitor = e.target.checked;
    saveAppData();
    if (settings.micEffect.enabled) {
      if (e.target.checked) startMicMonitor();
      else stopMicMonitor();
    }
  });

  document.getElementById('enable-monitor-device').addEventListener('change', (e) => {
    settings.monitorEnabled = e.target.checked;
    document.getElementById('select-monitor-device').disabled = !settings.monitorEnabled;
    updateRouteSummary();
  });

  document.getElementById('select-input-device').addEventListener('change', (e) => {
    settings.microphoneDeviceId = e.target.value;
    const selectedOption = e.target.options[e.target.selectedIndex];
    const outputDevices = Array.from(document.getElementById('select-playback-device').options)
      .filter(option => option.value !== 'default')
      .map(option => ({ deviceId: option.value, label: option.text }));
    const matchedOutput = findMatchingOutputForInput({ label: selectedOption?.text || '' }, outputDevices);

    if (matchedOutput) {
      settings.playbackDeviceId = matchedOutput.deviceId;
      document.getElementById('select-playback-device').value = matchedOutput.deviceId;
      showNotification(t('notif-output-matched', matchedOutput.label));
    }

    updateStatusPanel();
  });

  document.getElementById('select-playback-device').addEventListener('change', (e) => {
    settings.playbackDeviceId = e.target.value;
    updateStatusPanel();
  });

  document.getElementById('select-monitor-device').addEventListener('change', (e) => {
    settings.monitorDeviceId = e.target.value;
    updateStatusPanel();
  });

  // Hotkey record trigger
  document.getElementById('btn-record-hotkey').addEventListener('click', () => {
    const soundId = document.getElementById('sound-id').value || 'temp';
    startHotkeyRecording(soundId);
  });

  // Clear hotkey trigger
  document.getElementById('btn-clear-hotkey').addEventListener('click', () => {
    document.getElementById('sound-hotkey').value = '';
    document.getElementById('hotkey-display').textContent = 'Nessuna';
  });

  // Hotkey keydown capture
  window.addEventListener('keydown', (e) => {
    if (!isRecordingHotkey) return;
    
    e.preventDefault();
    
    // Escape cancels
    if (e.key === 'Escape') {
      stopHotkeyRecording(true);
      return;
    }
    
    // Backspace clears
    if (e.key === 'Backspace' && recordedKeys.size === 0) {
      document.getElementById('sound-hotkey').value = '';
      document.getElementById('hotkey-display').textContent = 'Nessuna';
      stopHotkeyRecording(true);
      return;
    }

    // Add key to set (filtering duplicates)
    if (e.key !== 'Process' && e.key !== 'Unidentified') {
      recordedKeys.add(e.key);
      
      // Update display showing combo in real-time
      const recordBtn = document.getElementById('btn-record-hotkey');
      const tempCombo = formatElectronShortcut(recordedKeys);
      if (tempCombo) {
        document.getElementById('hotkey-display').textContent = tempCombo;
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    if (!isRecordingHotkey) return;
    // Stop recording once all modifier/main keys are released
    stopHotkeyRecording();
  });

  // Submit Sound Form
  document.getElementById('sound-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('sound-id').value;
    const title = document.getElementById('sound-title').value;
    const filePathVal = document.getElementById('sound-file-path').value;
    const category = document.getElementById('sound-category').value;
    const color = document.getElementById('sound-color').value;
    const volume = parseInt(document.getElementById('sound-volume').value);
    const hotkey = document.getElementById('sound-hotkey').value;

    if (!filePathVal) {
      showNotification(t('notif-no-file'));
      return;
    }

    setModalSavingState(true);

    try {
      let finalFilePath = filePathVal;
      
      // Copy the file to local UserData directory if it's a new sound OR if file changed
      const originalSound = id ? sounds.find(s => s.id === id) : null;
      if (!originalSound || originalSound.filePath !== filePathVal) {
        finalFilePath = await window.electronAPI.saveSoundFile(filePathVal);
      }

      const soundObject = {
        id: id || Date.now().toString(),
        title,
        filePath: finalFilePath,
        category,
        color,
        volume,
        hotkey
      };

      if (id) {
        // Edit Mode
        const index = sounds.findIndex(s => s.id === id);
        
        // If hotkey changed or removed, unregister old one first
        if (originalSound && originalSound.hotkey && originalSound.hotkey !== hotkey) {
          await window.electronAPI.unregisterShortcut(id);
        }
        
        sounds[index] = soundObject;
      } else {
        // Create Mode
        sounds.push(soundObject);
      }

      // Save configurations
      await saveAppData();

      // Register new hotkey globally if set
      if (hotkey) {
        const success = await window.electronAPI.registerShortcut(soundObject.id, hotkey);
        if (!success) {
          showNotification(t('notif-shortcut-failed', hotkey));
          soundObject.hotkey = ''; // reset hotkey
          await saveAppData();
        }
      }

      setModalSavingState(false);
      closeSoundModal();
      renderSoundGrid();

    } catch (err) {
      setModalSavingState(false);
      console.error(err);
      showNotification(t('notif-save-error'));
    }
  });

  // Language selector (in settings modal and first-launch picker)
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      settings.language = lang;
      saveAppData();
      applyLanguage(lang);
    });
  });

  // Settings Save
  document.getElementById('btn-save-settings').addEventListener('click', async () => {
    const inputSelect = document.getElementById('select-input-device');
    const playSelect = document.getElementById('select-playback-device');
    const monSelect = document.getElementById('select-monitor-device');
    
    settings.microphoneDeviceId = inputSelect.value;
    settings.playbackDeviceId = playSelect.value;
    settings.monitorDeviceId = monSelect.value;
    settings.monitorEnabled = document.getElementById('enable-monitor-device').checked;
    
    // Save to file
    await saveAppData();

    // Reload destinations
    await updateAudioDestinations();

    // Re-apply mic input/output routing if effects are running
    if (settings.micEffect.enabled) {
      await startMicEffect();
    }

    closeSettingsModal();
    renderSoundGrid();
    showNotification(t('notif-settings-saved'));
  });
}

// Helpers for modal submit buttons
function setModalSavingState(isSaving) {
  const submitBtn = document.getElementById('btn-submit-sound-modal');
  if (isSaving) {
    submitBtn.disabled = true;
    submitBtn.textContent = t('btn-saving');
  } else {
    submitBtn.disabled = false;
    submitBtn.textContent = t('btn-save-sound');
  }
}

// Handle file path when selected via dialog or drop
function handleFileSelected(filePath) {
  document.getElementById('sound-file-path').value = filePath;
  
  // Extract file basename
  const parts = filePath.split(/[\\/]/);
  const fileName = parts[parts.length - 1];
  document.getElementById('file-name-preview').textContent = fileName;
  
  // Pre-fill name field if empty
  const titleInput = document.getElementById('sound-title');
  if (!titleInput.value) {
    const dotIndex = fileName.lastIndexOf('.');
    titleInput.value = dotIndex !== -1 ? fileName.slice(0, dotIndex) : fileName;
  }
}

// Trigger in-app notifications
function showNotification(message) {
  const host = document.getElementById('toast-host');
  if (!host) return;

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  host.appendChild(toast);

  // Force reflow so the entrance transition runs
  void toast.offsetHeight;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/* ===== Auto-update ======================================================= */

let updateDownloaded = false;

async function initUpdater() {
  if (!window.electronAPI || !window.electronAPI.onUpdateStatus) return;

  const versionEl = document.getElementById('update-version');
  const statusEl = document.getElementById('update-status-text');
  const checkBtn = document.getElementById('btn-check-updates');
  const installBtn = document.getElementById('btn-install-update');

  try {
    const v = await window.electronAPI.getAppVersion();
    if (versionEl) versionEl.textContent = `v${v}`;
  } catch (e) { /* ignore */ }

  checkBtn?.addEventListener('click', async () => {
    if (statusEl) statusEl.textContent = t('update-checking');
    const res = await window.electronAPI.checkForUpdates();
    if (res && !res.ok) {
      if (res.reason === 'not-packaged') {
        if (statusEl) statusEl.textContent = t('update-not-packaged');
      } else {
        if (statusEl) statusEl.textContent = t('update-error-prefix') + res.reason;
      }
    }
  });

  installBtn?.addEventListener('click', () => window.electronAPI.installUpdate());

  window.electronAPI.onUpdateStatus((p) => {
    if (!p) return;
    switch (p.state) {
      case 'checking':
        if (statusEl) statusEl.textContent = t('update-checking');
        break;
      case 'available':
        if (statusEl) statusEl.textContent = t('update-available', p.version);
        showNotification(t('update-notif-available', p.version));
        break;
      case 'not-available':
        if (statusEl) statusEl.textContent = t('update-not-available');
        break;
      case 'downloading':
        if (statusEl) statusEl.textContent = t('update-downloading', p.percent);
        break;
      case 'downloaded':
        updateDownloaded = true;
        if (statusEl) statusEl.textContent = t('update-downloaded-label', p.version);
        if (installBtn) installBtn.style.display = '';
        showNotification(t('update-notif-downloaded', p.version));
        if (confirm(t('update-downloaded-prompt', p.version))) {
          window.electronAPI.installUpdate();
        }
        break;
      case 'error': {
        const raw = p.message || '';
        let friendly;
        if (raw.includes('404'))        friendly = t('update-error-404');
        else if (raw.includes('ENOENT') || raw.includes('latest.yml')) friendly = t('update-error-enoent');
        else if (raw.includes('ENOTFOUND') || raw.includes('ECONNREFUSED')) friendly = t('update-error-network');
        else friendly = t('update-error-generic');
        if (statusEl) statusEl.textContent = friendly;
        break;
      }
    }
  });
}

/* ===== Virtual Microphone (VB-Cable) ===================================== */

const VBCABLE_REGEX = /\b(cable|vb-?audio|vb-?cable|voicemeeter)\b/i;

async function initVirtualMic() {
  const statusEl  = document.getElementById('vm-status');
  const installBtn = document.getElementById('btn-install-vbcable');

  // Detect whether a virtual audio device is already present
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const found = devices.some(d => VBCABLE_REGEX.test(d.label));
    if (found) {
      if (statusEl) statusEl.textContent = t('vm-found');
      if (installBtn) installBtn.style.display = 'none';
    } else {
      if (statusEl) statusEl.textContent = t('vm-not-found');
      if (installBtn) installBtn.style.display = '';
    }
  } catch {
    if (statusEl) statusEl.textContent = t('vm-detect-error');
  }

  // Wire install button
  installBtn?.addEventListener('click', async () => {
    installBtn.disabled = true;
    await window.electronAPI.installVbCable();
  });

  // Handle progress events from main process
  window.electronAPI.onVbCableProgress((p) => {
    const progressEl = document.getElementById('vm-progress');
    const fillEl     = document.getElementById('vm-fill');
    const labelEl    = document.getElementById('vm-label');

    switch (p.state) {
      case 'downloading':
        if (statusEl)   statusEl.textContent = t('vm-downloading');
        if (progressEl) progressEl.style.display = '';
        if (fillEl)     fillEl.style.width = `${p.percent}%`;
        if (labelEl)    labelEl.textContent = `${p.percent}%`;
        break;
      case 'extracting':
        if (fillEl)  fillEl.style.width = '100%';
        if (labelEl) labelEl.textContent = t('vm-extracting');
        break;
      case 'installing':
        if (labelEl) labelEl.textContent = t('vm-installing');
        break;
      case 'done':
        if (progressEl) progressEl.style.display = 'none';
        if (statusEl)   statusEl.textContent = t('vm-done-status');
        if (installBtn) installBtn.style.display = 'none';
        showNotification(t('notif-vbcable-installed'));
        break;
      case 'error':
        if (progressEl) progressEl.style.display = 'none';
        if (statusEl)   statusEl.textContent = t('vm-error-status', p.message || 'installazione fallita');
        if (installBtn) { installBtn.disabled = false; installBtn.style.display = ''; }
        break;
    }
  });
}

/* ===== Mic FX modal ====================================================== */

function updateMicFxButtonState() {
  const btn = document.getElementById('btn-open-mic-fx');
  if (btn) btn.classList.toggle('fx-active', !!settings.micEffect.enabled);
}

function updateMicFxUI() {
  const micFx = settings.micEffect;
  const enableCb = document.getElementById('enable-mic-effect');
  const intensitySlider = document.getElementById('slider-mic-intensity');
  const intensityVal = document.getElementById('val-mic-intensity');
  const body = document.getElementById('mic-fx-body');
  if (enableCb) enableCb.checked = micFx.enabled;
  if (intensitySlider) {
    intensitySlider.value = Math.round(micFx.intensity * 100);
    updateRangeFill(intensitySlider);
  }
  if (intensityVal) intensityVal.textContent = `${Math.round(micFx.intensity * 100)}%`;
  const selfMonCb = document.getElementById('enable-mic-self-monitor');
  if (selfMonCb) selfMonCb.checked = !!micFx.selfMonitor;
  syncMicPresetSelection();
  if (body) body.classList.toggle('disabled', !micFx.enabled);
}

function openMicFxModal() {
  updateMicFxUI();
  document.getElementById('mic-fx-modal').classList.add('open');
}

function closeMicFxModal() {
  document.getElementById('mic-fx-modal').classList.remove('open');
}

// Realistic oscilloscope visualizer (time-domain waveform)
function initVisualizer() {
  const canvas = document.getElementById('visualizer-canvas');
  const canvasCtx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const auroraStops = ['#a24bff', '#ff4fa3', '#7b6bff', '#5fe3e8'];

  function sizeCanvas() {
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    canvasCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeCanvas();
  window.addEventListener('resize', sizeCanvas);

  const N = 256;
  const smoothWave = new Float32Array(N);
  let phase = 0;

  function pickAnalyser() {
    if (activePlayingSounds.size > 0) {
      if (monitorContext && settings.monitorEnabled && monitorAnalyser) return monitorAnalyser;
      if (playbackContext && playbackAnalyser) return playbackAnalyser;
    }
    if (settings.micEffect.enabled && micAnalyser) return micAnalyser;
    return null;
  }

  function draw() {
    requestAnimationFrame(draw);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const mid = height / 2;
    canvasCtx.clearRect(0, 0, width, height);

    const analyser = pickAnalyser();
    const live = !!analyser;

    let raw = null;
    if (live) {
      raw = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteTimeDomainData(raw);
    }

    phase += 0.035;

    for (let i = 0; i < N; i++) {
      let target;
      if (live) {
        const idx = Math.floor((i / N) * raw.length);
        target = (raw[idx] - 128) / 128; // -1..1
      } else {
        // calm idle ripple
        target = Math.sin(phase + i * 0.18) * 0.05 * (0.6 + 0.4 * Math.sin(phase * 0.5));
      }
      smoothWave[i] += (target - smoothWave[i]) * (live ? 0.5 : 0.1);
    }

    const amp = height * 0.42;
    const pts = [];
    for (let i = 0; i < N; i++) {
      pts.push([(i / (N - 1)) * width, mid - smoothWave[i] * amp]);
    }

    const lineGrad = canvasCtx.createLinearGradient(0, 0, width, 0);
    auroraStops.forEach((c, i) => lineGrad.addColorStop(i / (auroraStops.length - 1), c));

    // Soft filled area under the curve
    canvasCtx.beginPath();
    canvasCtx.moveTo(0, mid);
    pts.forEach(([x, y]) => canvasCtx.lineTo(x, y));
    canvasCtx.lineTo(width, mid);
    canvasCtx.closePath();
    const fill = canvasCtx.createLinearGradient(0, 0, 0, height);
    fill.addColorStop(0, 'rgba(162,75,255,0.20)');
    fill.addColorStop(0.5, 'rgba(255,79,163,0.10)');
    fill.addColorStop(1, 'rgba(95,227,232,0.02)');
    canvasCtx.fillStyle = fill;
    canvasCtx.fill();

    // The waveform line, with glow when live
    canvasCtx.beginPath();
    pts.forEach(([x, y], i) => (i === 0 ? canvasCtx.moveTo(x, y) : canvasCtx.lineTo(x, y)));
    canvasCtx.lineWidth = live ? 2.4 : 1.6;
    canvasCtx.lineJoin = 'round';
    canvasCtx.lineCap = 'round';
    canvasCtx.strokeStyle = lineGrad;
    if (live) {
      canvasCtx.shadowColor = 'rgba(255,79,163,0.55)';
      canvasCtx.shadowBlur = 14;
    } else {
      canvasCtx.globalAlpha = 0.5;
    }
    canvasCtx.stroke();
    canvasCtx.shadowBlur = 0;
    canvasCtx.globalAlpha = 1;
  }

  draw();
}

/* ===== Microphone effect engine ========================================= */

// Render mic preset cards
function renderMicPresets() {
  const host = document.getElementById('fx-presets');
  if (!host) return;
  host.innerHTML = '';
  MIC_PRESETS.forEach(p => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fx-preset' + (p.id === settings.micEffect.type ? ' selected' : '');
    btn.setAttribute('data-preset', p.id);
    btn.innerHTML = `
      <span class="fx-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p.icon}</svg></span>
      <span class="fx-name">${escapeHtml(t(p.nameKey))}</span>`;
    btn.addEventListener('click', () => {
      settings.micEffect.type = p.id;
      syncMicPresetSelection();
      saveAppData();
      rebuildMicGraphs();
    });
    host.appendChild(btn);
  });
}

function syncMicPresetSelection() {
  document.querySelectorAll('#fx-presets .fx-preset').forEach(b => {
    b.classList.toggle('selected', b.getAttribute('data-preset') === settings.micEffect.type);
  });
}

function makeDistortionCurve(amount) {
  const k = amount || 0;
  const n = 44100;
  const curve = new Float32Array(n);
  const deg = Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

// Acquire the mic, build the effect chain, route to the soundboard output (VB-Cable)
// and optionally to the monitor device (self-monitor of your filtered voice).
async function startMicEffect() {
  const gen = ++_micEffectGen;
  await stopMicEffect();
  if (!settings.micEffect.enabled) return;
  if (gen !== _micEffectGen) return;
  try {
    const audioConstraints = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
    if (settings.microphoneDeviceId && settings.microphoneDeviceId !== 'default') {
      audioConstraints.deviceId = { exact: settings.microphoneDeviceId };
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });

    // If superseded by a newer call, discard this stream and bail
    if (gen !== _micEffectGen) { stream.getTracks().forEach(t => t.stop()); return; }
    micStream = stream;

    // ---- Cable path: processed mic → soundboard output (VB-Cable), heard by other apps ----
    micContext = new AudioContext({ latencyHint: 'interactive' });
    micSourceNode = micContext.createMediaStreamSource(micStream);
    micAnalyser = micContext.createAnalyser();
    micAnalyser.fftSize = 2048;
    buildMicChain();
    // Route processed mic to the same device as the soundboard (VB-Cable)
    if (settings.playbackDeviceId && settings.playbackDeviceId !== 'default') {
      micContext.setSinkId(settings.playbackDeviceId).catch(err => console.warn('setSinkId (mic) falló:', err));
    }
    if (micContext.state === 'suspended') await micContext.resume();

    // ---- Self-monitor path: processed mic → monitor device (your headphones) ----
    if (settings.micEffect.selfMonitor) {
      await startMicMonitor();
    }
  } catch (err) {
    if (gen !== _micEffectGen) return;
    console.error('Errore avvio effetti microfono:', err);
    showNotification(t('notif-mic-error', err?.message || err));
    settings.micEffect.enabled = false;
    const cb = document.getElementById('enable-mic-effect');
    if (cb) cb.checked = false;
    document.getElementById('mic-fx-body')?.classList.add('disabled');
    await stopMicEffect();
  }
}

// Spin up (or tear down) the self-monitor context using the already-acquired micStream
async function startMicMonitor() {
  const gen = ++_micMonitorGen;
  await stopMicMonitor();
  if (gen !== _micMonitorGen) return;
  if (!micStream) return;
  try {
    micMonitorContext = new AudioContext({ latencyHint: 'interactive' });
    micMonitorSource = micMonitorContext.createMediaStreamSource(micStream);

    const type = settings.micEffect.type;
    const intensity = Math.max(0, Math.min(1, settings.micEffect.intensity));
    const { output, teardown } = buildEffectGraph(micMonitorContext, micMonitorSource, type, intensity);
    output.connect(micMonitorContext.destination);
    micMonitorTeardownFns = teardown;
    micMonitorTeardownFns.push(() => { try { micMonitorSource.disconnect(); } catch (e) {} });

    const monId = settings.monitorDeviceId;
    micMonitorContext.setSinkId(monId && monId !== 'default' ? monId : '')
      .catch(err => console.warn('setSinkId (mic monitor) falló:', err));
    if (micMonitorContext.state === 'suspended') await micMonitorContext.resume();
  } catch (err) {
    console.warn('Impossibile avviare il monitor della voce filtrata:', err);
    stopMicMonitor();
  }
}

async function stopMicMonitor() {
  micMonitorTeardownFns.forEach(fn => { try { fn(); } catch (e) {} });
  micMonitorTeardownFns = [];
  if (micMonitorSource) { try { micMonitorSource.disconnect(); } catch (e) {} micMonitorSource = null; }
  const ctx = micMonitorContext;
  micMonitorContext = null;
  if (ctx) { try { await ctx.close(); } catch (e) {} }
}

async function stopMicEffect() {
  await stopMicMonitor();
  micTeardownFns.forEach(fn => { try { fn(); } catch (e) {} });
  micTeardownFns = [];
  if (micSourceNode) { try { micSourceNode.disconnect(); } catch (e) {} micSourceNode = null; }
  if (micAnalyser) { try { micAnalyser.disconnect(); } catch (e) {} micAnalyser = null; }
  const ctx = micContext;
  micContext = null;
  if (ctx) { try { await ctx.close(); } catch (e) {} }
  if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }
}

// Rebuild the effect graphs in the existing contexts without re-acquiring the stream
// (used when the preset or intensity changes).
async function rebuildMicGraphs() {
  if (settings.micEffect.enabled && micContext) buildMicChain();
  if (settings.micEffect.enabled && micMonitorContext) await startMicMonitor();
}
function rebuildMicGraphsDebounced() {
  clearTimeout(_rebuildMicTimer);
  _rebuildMicTimer = setTimeout(() => rebuildMicGraphs(), 150);
}

// (Re)build the cable-path effect node graph for the current preset + intensity.
function buildMicChain() {
  if (!micContext || !micSourceNode || !micAnalyser) return;

  micTeardownFns.forEach(fn => { try { fn(); } catch (e) {} });
  micTeardownFns = [];
  try { micSourceNode.disconnect(); } catch (e) {}
  try { micAnalyser.disconnect(); } catch (e) {}

  const ctx = micContext;
  const type = settings.micEffect.type;
  const intensity = Math.max(0, Math.min(1, settings.micEffect.intensity));

  const { output, teardown } = buildEffectGraph(ctx, micSourceNode, type, intensity);
  micTeardownFns = teardown;

  // Keep the analyser (VU-meter) fed always; only make it audible on a real (non-default)
  // output device — otherwise the filtered voice would echo back on the default speakers.
  output.connect(micAnalyser);
  const outTap = ctx.createGain();
  outTap.gain.value = (settings.playbackDeviceId && settings.playbackDeviceId !== 'default') ? 1 : 0;
  micAnalyser.connect(outTap);
  outTap.connect(ctx.destination);
  micTeardownFns.push(() => {
    try { micAnalyser.disconnect(); } catch (e) {}
    try { outTap.disconnect(); } catch (e) {}
  });
}

// Build a self-contained effect graph in `ctx` from `inputNode`; returns the final output
// node (a limiter) plus the teardown functions for every node created here.
function buildEffectGraph(ctx, inputNode, type, intensity) {
  const teardown = [];
  intensity = Math.max(0, Math.min(1, intensity));

  const inGain = ctx.createGain();
  const outGain = ctx.createGain();
  inputNode.connect(inGain);
  let last = inGain;

  switch (type) {
    case 'girl': {
      const j = new JunglePitch(ctx);
      j.setPitchOffset(0.3 + intensity * 0.7);
      last.connect(j.input); last = j.output;
      teardown.push(() => j.stop());
      break;
    }
    case 'mask': {
      const j = new JunglePitch(ctx);
      j.setPitchOffset(-(0.3 + intensity * 0.7));
      last.connect(j.input); last = j.output;
      teardown.push(() => j.stop());
      break;
    }
    case 'underwater': {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 700 - intensity * 380;
      lp.Q.value = 6;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.4 + intensity * 3.5;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 120 * intensity;
      lfo.connect(lfoGain); lfoGain.connect(lp.frequency);
      lfo.start();
      last.connect(lp); last = lp;
      teardown.push(() => {
        try { lfo.stop(); } catch (e) {}
        try { lfo.disconnect(); } catch (e) {}
        try { lfoGain.disconnect(); } catch (e) {}
        try { lp.disconnect(); } catch (e) {}
      });
      break;
    }
    case 'robot': {
      const ring = ctx.createGain();
      ring.gain.value = 1 - intensity * 0.9;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 30 + intensity * 100;
      const depth = ctx.createGain();
      depth.gain.value = intensity * 0.9;
      osc.connect(depth); depth.connect(ring.gain);
      osc.start();
      last.connect(ring); last = ring;
      teardown.push(() => {
        try { osc.stop(); } catch (e) {}
        try { osc.disconnect(); } catch (e) {}
        try { depth.disconnect(); } catch (e) {}
        try { ring.disconnect(); } catch (e) {}
      });
      break;
    }
    case 'echo': {
      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.12 + intensity * 0.22; // max 0.34 s
      const fb = ctx.createGain();
      fb.gain.value = 0.18 + intensity * 0.32; // max 0.50 — stable
      // high-pass in the loop cuts DC / rumble so it can't ring up indefinitely
      const fbFilter = ctx.createBiquadFilter();
      fbFilter.type = 'highpass';
      fbFilter.frequency.value = 180;
      delay.connect(fb); fb.connect(fbFilter); fbFilter.connect(delay);
      last.connect(delay);
      delay.connect(outGain); // wet
      last.connect(outGain);  // dry
      last = null;
      teardown.push(() => {
        try { delay.disconnect(); } catch (e) {}
        try { fb.disconnect(); } catch (e) {}
        try { fbFilter.disconnect(); } catch (e) {}
      });
      break;
    }
    case 'phone': {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1500;
      bp.Q.value = 0.6 + intensity * 1.6;
      const shaper = ctx.createWaveShaper();
      shaper.curve = makeDistortionCurve(intensity * 80);
      shaper.oversample = '2x';
      last.connect(bp); bp.connect(shaper); last = shaper;
      teardown.push(() => {
        try { bp.disconnect(); } catch (e) {}
        try { shaper.disconnect(); } catch (e) {}
      });
      break;
    }
    case 'none':
    default:
      break;
  }

  // Hard limiter — prevents runaway feedback from blowing the signal
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -6;
  limiter.knee.value = 3;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.08;

  if (last) last.connect(outGain);
  outGain.connect(limiter);
  teardown.push(() => {
    try { inGain.disconnect(); } catch (e) {}
    try { outGain.disconnect(); } catch (e) {}
    try { limiter.disconnect(); } catch (e) {}
  });

  return { output: limiter, teardown };
}

// Small horizontal mic level meter (settings panel)
function roundRectPath(c, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function initMicMeter() {
  const canvas = document.getElementById('mic-meter-canvas');
  if (!canvas) return;
  const c = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  function size() {
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();
  window.addEventListener('resize', size);

  let level = 0;
  function draw() {
    requestAnimationFrame(draw);
    const w = canvas.offsetWidth, h = canvas.offsetHeight;
    c.clearRect(0, 0, w, h);

    let target = 0;
    if (settings.micEffect.enabled && micAnalyser) {
      const buf = new Uint8Array(micAnalyser.frequencyBinCount);
      micAnalyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
      target = Math.min(1, Math.sqrt(sum / buf.length) * 2.4);
    }
    level += (target - level) * 0.3;

    const r = h / 2;
    c.fillStyle = 'rgba(255,255,255,0.06)';
    roundRectPath(c, 0, 0, w, h, r);
    c.fill();

    const fw = Math.max(0, level * w);
    if (fw > 1) {
      const g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, '#7b6bff');
      g.addColorStop(0.5, '#ff4fa3');
      g.addColorStop(1, '#5fe3e8');
      c.fillStyle = g;
      roundRectPath(c, 0, 0, fw, h, r);
      c.fill();
    }
  }
  draw();
}

// Live pitch shifter (Chris Wilson "Jungle" technique: dual modulated delay lines + crossfade)
class JunglePitch {
  constructor(context) {
    this.context = context;
    this.input = context.createGain();
    this.output = context.createGain();

    const delayTime = 0.100;
    const fadeTime = 0.050;
    const bufferTime = 0.100;
    this.delayTimeVal = delayTime;

    this.mod1 = context.createBufferSource();
    this.mod2 = context.createBufferSource();
    this.mod3 = context.createBufferSource();
    this.mod4 = context.createBufferSource();
    const shapeBuffer = this._delayBuffer(context, bufferTime, fadeTime, false);
    const shapeBufferInverse = this._delayBuffer(context, bufferTime, fadeTime, true);
    this.mod1.buffer = shapeBuffer;
    this.mod2.buffer = shapeBuffer;
    this.mod3.buffer = shapeBufferInverse;
    this.mod4.buffer = shapeBufferInverse;
    [this.mod1, this.mod2, this.mod3, this.mod4].forEach(m => { m.loop = true; });

    this.mod1Gain = context.createGain();
    this.mod2Gain = context.createGain();
    this.mod3Gain = context.createGain();
    this.mod4Gain = context.createGain();
    this.mod3Gain.gain.value = 0;
    this.mod4Gain.gain.value = 0;

    this.mod1.connect(this.mod1Gain);
    this.mod2.connect(this.mod2Gain);
    this.mod3.connect(this.mod3Gain);
    this.mod4.connect(this.mod4Gain);

    this.modGain1 = context.createGain();
    this.modGain2 = context.createGain();
    this.delay1 = context.createDelay();
    this.delay2 = context.createDelay();
    this.mod1Gain.connect(this.modGain1);
    this.mod2Gain.connect(this.modGain2);
    this.mod3Gain.connect(this.modGain1);
    this.mod4Gain.connect(this.modGain2);
    this.modGain1.connect(this.delay1.delayTime);
    this.modGain2.connect(this.delay2.delayTime);

    this.fade1 = context.createBufferSource();
    this.fade2 = context.createBufferSource();
    const fadeBuffer = this._fadeBuffer(context, bufferTime, fadeTime);
    this.fade1.buffer = fadeBuffer;
    this.fade2.buffer = fadeBuffer;
    this.fade1.loop = true;
    this.fade2.loop = true;

    this.mix1 = context.createGain();
    this.mix2 = context.createGain();
    this.mix1.gain.value = 0;
    this.mix2.gain.value = 0;
    this.fade1.connect(this.mix1.gain);
    this.fade2.connect(this.mix2.gain);

    this.input.connect(this.delay1);
    this.input.connect(this.delay2);
    this.delay1.connect(this.mix1);
    this.delay2.connect(this.mix2);
    this.mix1.connect(this.output);
    this.mix2.connect(this.output);

    const t = context.currentTime + 0.050;
    const t2 = t + bufferTime - fadeTime;
    this.mod1.start(t);
    this.mod2.start(t2);
    this.mod3.start(t);
    this.mod4.start(t2);
    this.fade1.start(t);
    this.fade2.start(t2);

    this._sources = [this.mod1, this.mod2, this.mod3, this.mod4, this.fade1, this.fade2];
  }

  setDelay(d) {
    this.modGain1.gain.setTargetAtTime(0.5 * d, this.context.currentTime, 0.010);
    this.modGain2.gain.setTargetAtTime(0.5 * d, this.context.currentTime, 0.010);
  }

  setPitchOffset(mult) {
    if (mult > 0) {
      this.mod1Gain.gain.value = 0;
      this.mod2Gain.gain.value = 0;
      this.mod3Gain.gain.value = 1;
      this.mod4Gain.gain.value = 1;
    } else {
      this.mod1Gain.gain.value = 1;
      this.mod2Gain.gain.value = 1;
      this.mod3Gain.gain.value = 0;
      this.mod4Gain.gain.value = 0;
    }
    this.setDelay(this.delayTimeVal * Math.abs(mult));
  }

  stop() {
    this._sources.forEach(s => { try { s.stop(); } catch (e) {} try { s.disconnect(); } catch (e) {} });
    try { this.input.disconnect(); } catch (e) {}
    try { this.output.disconnect(); } catch (e) {}
  }

  _fadeBuffer(context, activeTime, fadeTime) {
    const length1 = activeTime * context.sampleRate;
    const length2 = (activeTime - 2 * fadeTime) * context.sampleRate;
    const length = length1 + length2;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const p = buffer.getChannelData(0);
    const fadeLength = fadeTime * context.sampleRate;
    const fadeIndex1 = fadeLength;
    const fadeIndex2 = length1 - fadeLength;
    for (let i = 0; i < length1; ++i) {
      let value;
      if (i < fadeIndex1) value = Math.sqrt(i / fadeLength);
      else if (i >= fadeIndex2) value = Math.sqrt(1 - (i - fadeIndex2) / fadeLength);
      else value = 1;
      p[i] = value;
    }
    for (let i = length1; i < length; ++i) p[i] = 0;
    return buffer;
  }

  _delayBuffer(context, activeTime, fadeTime, shiftUp) {
    const length1 = activeTime * context.sampleRate;
    const length2 = (activeTime - 2 * fadeTime) * context.sampleRate;
    const length = length1 + length2;
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const p = buffer.getChannelData(0);
    for (let i = 0; i < length1; ++i) {
      if (shiftUp) p[i] = (length1 - i) / length;
      else p[i] = i / length1;
    }
    for (let i = length1; i < length; ++i) p[i] = 0;
    return buffer;
  }
}
