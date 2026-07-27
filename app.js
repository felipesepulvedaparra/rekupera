// ════════════════════════════════════════
// REKUPERA APP.JS
// Lógica principal con Supabase
// ════════════════════════════════════════

// ── ESTADO GLOBAL ──
let currentUser = null
let currentProfile = null
let currentProgram = 'peso'
let currentMessages = []
let painValue = 0

const VICTORIA_EMAIL = 'victoria@rekupera.cl' // cambia al email real de Victoria

const PROGRAM_CONFIG = {
  embarazada: { accent:'#7C5CBF', accentL:'#EDE8F8', accentD:'#5A3EA0', emoji:'🤰', label:'Embarazada', grad:'linear-gradient(145deg,#5A3EA0,#7C5CBF)' },
  postparto:  { accent:'#C8506A', accentL:'#F8E8EC', accentD:'#9B3050', emoji:'👶', label:'Post-parto',  grad:'linear-gradient(145deg,#9B3050,#C8506A)' },
  lesion:     { accent:'#2A7AB5', accentL:'#E4F0FA', accentD:'#1A5A8A', emoji:'🦴', label:'Post-lesión', grad:'linear-gradient(145deg,#1A5A8A,#2A7AB5)' },
  mayor:      { accent:'#3A8A5A', accentL:'#E2F4EA', accentD:'#2A6A40', emoji:'🧓', label:'Adulto mayor',grad:'linear-gradient(145deg,#2A6A40,#3A8A5A)' },
  peso:       { accent:'#D4783A', accentL:'#FAEEE4', accentD:'#A8501C', emoji:'✨', label:'Bajar de peso',grad:'linear-gradient(145deg,#A8501C,#D4783A)' },
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', async () => {
  updateClock()
  setInterval(updateClock, 60000)
  renderScreen('login')
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    currentUser = session.user
    await loadProfile()
  }
})

function updateClock() {
  const now = new Date()
  const h = now.getHours().toString().padStart(2,'0')
  const m = now.getMinutes().toString().padStart(2,'0')
  const el = document.getElementById('st-time')
  if (el) el.textContent = h + ':' + m
}

// ── RENDER SCREENS ──
function renderScreen(name) {
  const wrap = document.getElementById('screens-wrap')
  const screens = {
    login:    renderLogin,
    programs: renderPrograms,
    home:     renderHome,
    progreso: renderProgreso,
    videos:   renderVideos,
    chat:     renderChat,
    coach:    renderCoach,
    loading:  renderLoading,
  }
  wrap.innerHTML = ''
  const screen = document.createElement('div')
  screen.className = 'screen active'
  screen.id = 's-' + name
  screen.innerHTML = screens[name] ? screens[name]() : ''
  wrap.appendChild(screen)
  setAccent(PROGRAM_CONFIG[currentProgram]?.accent || '#C8506A')
}

function setAccent(color) {
  document.documentElement.style.setProperty('--accent', color)
  const cfg = Object.values(PROGRAM_CONFIG).find(p => p.accent === color)
  if (cfg) {
    document.documentElement.style.setProperty('--accent-l', cfg.accentL)
    document.documentElement.style.setProperty('--accent-d', cfg.accentD)
  }
}

function showScreen(name) {
  renderScreen(name)
}

function goTab(name, btn) {
  document.querySelectorAll('.nav-t').forEach(t => t.classList.remove('active'))
  if (btn) btn.classList.add('active')
  renderScreen(name)
  if (name === 'chat') loadMessages()
  if (name === 'progreso') loadMedidas()
  if (name === 'videos') loadVideos()
}

// ── LOGIN ──
function renderLogin() {
  return `
  <div style="background:var(--bg2);flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 28px;">
    <div class="login-logo">
      <div class="login-logo-icon"><i class="ti ti-activity"></i></div>
      <h1>Rekupera</h1>
      <p>Preparación física guiada por<br>Victoria Cartes Campos</p>
    </div>
    <div class="login-form">
      <div class="form-field">
        <div class="form-lbl">Correo electrónico</div>
        <input class="form-inp" id="inp-email" type="email" placeholder="tu@correo.cl" autocomplete="email">
      </div>
      <div class="form-field">
        <div class="form-lbl">Contraseña</div>
        <input class="form-inp" id="inp-pass" type="password" placeholder="••••••••" autocomplete="current-password">
      </div>
      <button class="btn-main" onclick="loginUser()" style="margin-top:4px;">
        <i class="ti ti-login"></i> Ingresar
      </button>
      <div class="login-divider">¿No tienes cuenta?</div>
      <button class="btn-main" onclick="showRegister()" style="background:var(--bg3);color:var(--text2);">
        <i class="ti ti-user-plus"></i> Crear cuenta
      </button>
    </div>
  </div>`
}

async function loginUser() {
  const email = document.getElementById('inp-email')?.value?.trim()
  const pass  = document.getElementById('inp-pass')?.value
  if (!email || !pass) return showToast('Completa correo y contraseña')
  showToast('Ingresando…')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
  if (error) return showToast('Error: ' + error.message)
  currentUser = data.user
  await loadProfile()
}

function showRegister() {
  const wrap = document.getElementById('screens-wrap')
  wrap.innerHTML = `
  <div class="screen active" id="s-register" style="background:var(--bg2);flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:28px 24px;">
    <div class="login-logo" style="margin-bottom:24px;">
      <div class="login-logo-icon"><i class="ti ti-activity"></i></div>
      <h1>Crear cuenta</h1>
    </div>
    <div class="login-form">
      <div class="form-field"><div class="form-lbl">Nombre completo</div><input class="form-inp" id="r-nombre" type="text" placeholder="Tu nombre"></div>
      <div class="form-field"><div class="form-lbl">Correo electrónico</div><input class="form-inp" id="r-email" type="email" placeholder="tu@correo.cl"></div>
      <div class="form-field"><div class="form-lbl">Contraseña</div><input class="form-inp" id="r-pass" type="password" placeholder="Mínimo 6 caracteres"></div>
      <button class="btn-main" onclick="registerUser()" style="margin-top:4px;"><i class="ti ti-user-plus"></i> Crear cuenta</button>
      <button class="link-btn" onclick="renderScreen('login')">← Volver al inicio</button>
    </div>
  </div>`
}

async function registerUser() {
  const nombre = document.getElementById('r-nombre')?.value?.trim()
  const email  = document.getElementById('r-email')?.value?.trim()
  const pass   = document.getElementById('r-pass')?.value
  if (!nombre || !email || !pass) return showToast('Completa todos los campos')
  if (pass.length < 6) return showToast('La contraseña debe tener al menos 6 caracteres')
  showToast('Creando cuenta…')
  const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { data: { full_name: nombre } } })
  if (error) return showToast('Error: ' + error.message)
  currentUser = data.user
  // Create profile
  await supabase.from('profiles').upsert({ id: currentUser.id, nombre, email, programa: null, es_victoria: false })
  showToast('¡Cuenta creada! Elige tu programa 🎉')
  document.getElementById('bottom-nav').style.display = 'none'
  renderScreen('programs')
}

// ── LOAD PROFILE ──
async function loadProfile() {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single()
  currentProfile = profile
  if (!profile) {
    renderScreen('programs')
    document.getElementById('bottom-nav').style.display = 'none'
    return
  }
  if (profile.es_victoria) {
    renderScreen('coach')
    document.getElementById('bottom-nav').style.display = 'none'
    return
  }
  if (!profile.programa) {
    renderScreen('programs')
    document.getElementById('bottom-nav').style.display = 'none'
    return
  }
  currentProgram = profile.programa
  setAccent(PROGRAM_CONFIG[currentProgram].accent)
  document.getElementById('bottom-nav').style.display = 'flex'
  renderScreen('home')
}

// ── PROGRAMS ──
function renderPrograms() {
  return `
  <div class="programs-header">
    <h2>¿Cuál es tu situación?</h2>
    <p>Victoria diseñará tu programa según tu etapa</p>
  </div>
  <div class="prog-list">
    ${Object.entries(PROGRAM_CONFIG).map(([key, p]) => `
    <div class="prog-opt" onclick="selectProgram('${key}')" style="background:${p.grad};">
      <div class="prog-opt-inner">
        <div class="prog-opt-icon" style="background:rgba(255,255,255,.18);">${p.emoji}</div>
        <div>
          <div class="prog-opt-name">${p.label}</div>
          <div class="prog-opt-desc">${programDesc(key)}</div>
        </div>
        <i class="ti ti-arrow-right prog-arrow"></i>
      </div>
    </div>`).join('')}
  </div>`
}

function programDesc(k) {
  const d = { embarazada:'Ejercicio seguro según trimestre', postparto:'Recuperación suelo pélvico y diástasis', lesion:'Rodilla, hombro, tobillo, lumbar', mayor:'Movilidad, equilibrio y fuerza funcional', peso:'Cardio, fuerza y hábitos saludables' }
  return d[k] || ''
}

async function selectProgram(prog) {
  currentProgram = prog
  setAccent(PROGRAM_CONFIG[prog].accent)
  if (currentUser) {
    await supabase.from('profiles').upsert({ id: currentUser.id, programa: prog })
    currentProfile = { ...currentProfile, programa: prog }
  }
  document.getElementById('bottom-nav').style.display = 'flex'
  renderScreen('home')
}

// ── HOME ──
function renderHome() {
  const p = PROGRAM_CONFIG[currentProgram]
  const nombre = currentProfile?.nombre || 'Bienvenida'
  const days = ['D','L','M','X','J','V','S']
  const today = new Date()
  const weekDays = Array.from({length:7}, (_,i) => {
    const d = new Date(today); d.setDate(today.getDate() - today.getDay() + i + 1)
    const isPast = d < today && d.toDateString() !== today.toDateString()
    const isToday = d.toDateString() === today.toDateString()
    return `<div class="wday ${isPast?'done':''} ${isToday?'today':''}">
      <span class="wd">${days[d.getDay()]}</span>
      <span class="wn">${d.getDate()}</span>
    </div>`
  }).join('')

  const sesiones = getSesionesPrograma(currentProgram)
  return `
  <div class="client-hero" style="background:${p.grad};">
    <div class="ch-greeting">Buenos días ☀️</div>
    <div class="ch-name">${nombre}</div>
    <div class="ch-program">${p.emoji} ${p.label} · Semana 1</div>
    <div class="ch-stats">
      <div class="ch-stat"><div class="ch-stat-v">1</div><div class="ch-stat-l">Semana actual</div></div>
      <div class="ch-stat"><div class="ch-stat-v">0</div><div class="ch-stat-l">Sesiones</div></div>
      <div class="ch-stat"><div class="ch-stat-v">—</div><div class="ch-stat-l">Adherencia</div></div>
    </div>
  </div>
  <div class="week-strip">${weekDays}</div>
  <div class="section-lbl">Sesión de hoy</div>
  <div class="today-sess">
    <div class="ts-top">
      <div class="ts-icon" style="background:${p.accentL};color:${p.accent};">
        <i class="ti ${getSesionIcon(currentProgram)}"></i>
      </div>
      <div>
        <div class="ts-title">${sesiones[0].titulo}</div>
        <div class="ts-meta">${sesiones[0].meta}</div>
        <div style="margin-top:8px;display:flex;gap:6px;">
          <span class="tag" style="background:${p.accentL};color:${p.accent};">Hoy</span>
        </div>
      </div>
    </div>
    <div class="ts-exs">
      ${sesiones[0].ejercicios.map((e,i) => `
      <div class="ts-ex">
        <div class="ts-ex-n" style="background:${p.accentL};color:${p.accent};">${i+1}</div>
        <span class="ts-ex-name">${e[0]}</span>
        <span class="ts-ex-sets">${e[1]}</span>
      </div>`).join('')}
    </div>
    <div class="ts-btn">
      <button class="btn-main" onclick="showToast('¡Sesión iniciada! 💪')">
        <i class="ti ti-player-play"></i> Comenzar sesión
      </button>
    </div>
  </div>
  <div class="section-lbl">Tu especialista</div>
  <div class="victoria-pill" onclick="goTab('chat', document.querySelector('[data-tab=chat]'))">
    <div class="vp-av">VC<div class="vp-dot"></div></div>
    <div>
      <div class="vp-name">Victoria Cartes Campos</div>
      <div class="vp-status">Preparadora física · en línea</div>
    </div>
    <div class="vp-unread">1</div>
  </div>
  <div style="height:22px;"></div>`
}

function getSesionIcon(prog) {
  const icons = { embarazada:'ti-heart', postparto:'ti-heart', lesion:'ti-run', mayor:'ti-yoga', peso:'ti-flame' }
  return icons[prog] || 'ti-flame'
}

function getSesionesPrograma(prog) {
  const s = {
    embarazada: [{ titulo:'Movilidad y respiración prenatal', meta:'25 min · 4 ejercicios · suave', ejercicios:[['Caminata suave','15 min'],['Sentadilla pelviana','2×12'],['Respiración diafragmática','3×10'],['Estiramiento de cadera','5 min']] }],
    postparto:  [{ titulo:'Suelo pélvico — activación', meta:'20 min · 5 ejercicios · baja intensidad', ejercicios:[['Activación suelo pélvico','3×10'],['Respiración hipopresiva','3×5'],['Puente de glúteos','3×12'],['Estiramiento abdominal','2×30s'],['Relajación final','5 min']] }],
    lesion:     [{ titulo:'Movilidad articular — fase I', meta:'25 min · 4 ejercicios · suave', ejercicios:[['Movilización pasiva','10 min'],['Cuádriceps isométrico','3×15'],['Propiocepción','3×20s'],['Hielo y elevación','10 min']] }],
    mayor:      [{ titulo:'Movilidad y equilibrio', meta:'30 min · 5 ejercicios · suave', ejercicios:[['Marcha en el lugar','5 min'],['Sentadilla con silla','3×10'],['Equilibrio unipodal','3×20s'],['Fortalecimiento brazos','3×10'],['Estiramiento global','5 min']] }],
    peso:       [{ titulo:'Cardio + Core — Semana 1', meta:'35 min · 5 ejercicios · moderada', ejercicios:[['Caminata activa','20 min'],['Sentadillas','3×15'],['Plancha abdominal','3×30s'],['Estocadas','3×12'],['Cierre y respiración','5 min']] }],
  }
  return s[prog] || s.peso
}

// ── PROGRESO ──
function renderProgreso() {
  const p = PROGRAM_CONFIG[currentProgram]
  return `
  <div class="prog-screen-header">
    <h2>Mi progreso</h2>
    <p>Fotos y medidas semana a semana</p>
  </div>
  <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 20px;background:var(--bg2);border-bottom:1px solid var(--border);">
    <button style="width:34px;height:34px;border-radius:50%;background:var(--bg3);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;"><i class="ti ti-chevron-left" style="font-size:16px;color:var(--text2);"></i></button>
    <span style="font-size:15px;font-weight:700;color:var(--text);">Semana actual vs Inicio</span>
    <button style="width:34px;height:34px;border-radius:50%;background:var(--bg3);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;"><i class="ti ti-chevron-right" style="font-size:16px;color:var(--text2);"></i></button>
  </div>
  <div class="photo-grid" id="photo-grid">
    <div class="photo-slot" style="background:var(--bg3);">
      <div class="photo-placeholder"><i class="ti ti-camera-off"></i><span>Foto inicio<br>no disponible</span></div>
      <div class="photo-slot-week">Inicio</div>
      <div class="photo-slot-lbl">Antes</div>
    </div>
    <div class="photo-slot" style="background:color-mix(in srgb,${p.accent} 8%,var(--bg3));" onclick="document.getElementById('modal-medidas').classList.add('open')">
      <div class="photo-placeholder">
        <i class="ti ti-camera" style="color:${p.accent};"></i>
        <span style="color:${p.accent};">Subir foto<br>de hoy</span>
      </div>
      <div class="photo-slot-week">Hoy</div>
      <div class="photo-slot-lbl">Ahora</div>
    </div>
  </div>
  <button class="btn-main" style="margin:12px 18px 0;width:calc(100% - 36px);" onclick="document.getElementById('modal-medidas').classList.add('open')">
    <i class="ti ti-plus"></i> Registrar medidas de hoy
  </button>
  <div class="measures-block">
    <div class="mb-header">
      <span class="mb-title">Medidas corporales</span>
      <button class="mb-add" onclick="document.getElementById('modal-medidas').classList.add('open')">+ Registrar</button>
    </div>
    <div id="medidas-list">
      <div class="empty-state">
        <i class="ti ti-ruler"></i>
        <p>Aún no tienes medidas registradas.<br>¡Empieza hoy!</p>
      </div>
    </div>
  </div>
  <div style="height:22px;"></div>`
}

async function loadMedidas() {
  if (!currentUser) return
  const { data } = await supabase
    .from('medidas')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false })
    .limit(10)

  const list = document.getElementById('medidas-list')
  if (!list) return
  if (!data || data.length === 0) {
    list.innerHTML = `<div class="empty-state"><i class="ti ti-ruler"></i><p>Aún no tienes medidas registradas.<br>¡Empieza hoy!</p></div>`
    return
  }

  const latest = data[0]
  const first  = data[data.length - 1]
  const p = PROGRAM_CONFIG[currentProgram]
  const rows = [
    ['ti-weight', 'Peso', latest.peso, first.peso, 'kg'],
    ['ti-circle', 'Cintura', latest.cintura, first.cintura, 'cm'],
    ['ti-circle-dotted', 'Cadera', latest.cadera, first.cadera, 'cm'],
    ['ti-minus', 'Muslo', latest.muslo, first.muslo, 'cm'],
  ]

  list.innerHTML = rows.filter(r => r[2]).map(([icon, name, val, ini, unit]) => {
    const diff = val && ini ? (val - ini).toFixed(1) : null
    const isPos = diff < 0
    return `<div class="measure-item">
      <div class="mi-ico" style="background:${p.accentL};color:${p.accent};"><i class="ti ${icon}"></i></div>
      <span class="mi-name">${name}</span>
      <div>
        <div class="mi-val">${val} ${unit}</div>
        ${diff ? `<div class="mi-delta ${isPos?'pos':'neg'}">${isPos?'↓':'↑'} ${Math.abs(diff)} ${unit}</div>` : ''}
      </div>
    </div>`
  }).join('')

  // Load photos
  const { data: fotos } = await supabase.from('fotos_progreso').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: true })
  if (fotos && fotos.length > 0) {
    const grid = document.getElementById('photo-grid')
    if (!grid) return
    const urlFirst = supabase.storage.from('fotos-progreso').getPublicUrl(fotos[0].path).data.publicUrl
    const urlLast  = supabase.storage.from('fotos-progreso').getPublicUrl(fotos[fotos.length-1].path).data.publicUrl
    grid.innerHTML = `
      <div class="photo-slot"><img src="${urlFirst}" alt="Antes"><div class="photo-slot-week">Inicio</div><div class="photo-slot-lbl">Antes</div></div>
      <div class="photo-slot"><img src="${urlLast}" alt="Ahora"><div class="photo-slot-week">Hoy</div><div class="photo-slot-lbl">Ahora</div></div>`
  }
}

async function guardarMedidas() {
  if (!currentUser) return showToast('Debes estar logueada')
  const peso    = parseFloat(document.getElementById('inp-peso')?.value)
  const cintura = parseFloat(document.getElementById('inp-cintura')?.value)
  const cadera  = parseFloat(document.getElementById('inp-cadera')?.value)
  const muslo   = parseFloat(document.getElementById('inp-muslo')?.value)
  const fotoFile= document.getElementById('inp-foto')?.files?.[0]

  const btn = document.getElementById('btn-guardar-medidas')
  if (btn) { btn.textContent = 'Guardando…'; btn.disabled = true }

  const { error: medErr } = await supabase.from('medidas').insert({ user_id: currentUser.id, peso: peso||null, cintura: cintura||null, cadera: cadera||null, muslo: muslo||null })
  if (medErr) { showToast('Error al guardar: ' + medErr.message); if(btn){btn.textContent='Guardar medidas';btn.disabled=false}; return }

  if (fotoFile) {
    const ext  = fotoFile.name.split('.').pop()
    const path = `${currentUser.id}/${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('fotos-progreso').upload(path, fotoFile)
    if (!upErr) await supabase.from('fotos_progreso').insert({ user_id: currentUser.id, path })
  }

  document.getElementById('modal-medidas').classList.remove('open')
  if (btn) { btn.textContent = 'Guardar medidas'; btn.disabled = false }
  showToast('Medidas guardadas. Victoria las verá ✓')
  loadMedidas()
}

function previewPhoto(input) {
  const file = input.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = e => {
    document.getElementById('preview-img').src = e.target.result
    document.getElementById('photo-preview').style.display = 'block'
  }
  reader.readAsDataURL(file)
}

// ── VIDEOS ──
function renderVideos() {
  return `
  <div class="videos-header">
    <h2>Ejercicios en video</h2>
    <p>Videos de Victoria para tu programa</p>
  </div>
  <div class="video-filters" id="video-filters">
    <button class="vf-btn active" onclick="filterVideos('todos',this)">Todos</button>
    <button class="vf-btn" onclick="filterVideos('embarazada',this)">🤰 Embarazo</button>
    <button class="vf-btn" onclick="filterVideos('postparto',this)">👶 Post-parto</button>
    <button class="vf-btn" onclick="filterVideos('lesion',this)">🦴 Lesión</button>
    <button class="vf-btn" onclick="filterVideos('mayor',this)">🧓 Adulto mayor</button>
    <button class="vf-btn" onclick="filterVideos('peso',this)">✨ Peso</button>
  </div>
  <div class="video-grid" id="video-grid">
    <div class="video-loading"><div class="spinner"></div><span style="margin-top:10px;font-size:13px;color:var(--text3);">Cargando videos…</span></div>
  </div>`
}

let allVideos = []
async function loadVideos(categoria = 'todos') {
  const grid = document.getElementById('video-grid')
  if (!grid) return

  let query = supabase.from('videos').select('*').order('created_at', { ascending: false })
  if (categoria !== 'todos') query = query.eq('categoria', categoria)
  const { data, error } = await query

  if (error || !data || data.length === 0) {
    grid.innerHTML = `<div class="video-empty"><i class="ti ti-video-off"></i><p>No hay videos en esta categoría aún.<br>Victoria los irá subiendo.</p></div>`
    return
  }

  allVideos = data
  grid.innerHTML = data.map(v => {
    const p = PROGRAM_CONFIG[v.categoria] || PROGRAM_CONFIG.peso
    return `
    <div class="video-card" onclick="openVideo('${v.id}')">
      <div class="video-thumb" style="background:${p.accentL};">
        <span style="font-size:28px;">${p.emoji}</span>
        <div class="video-play-overlay"><i class="ti ti-player-play"></i></div>
      </div>
      <div class="video-info">
        <div class="video-title">${v.titulo}</div>
        <div class="video-meta">${v.duracion || ''} · ${v.nivel || ''}</div>
        <div class="video-tags">
          <span class="tag" style="background:${p.accentL};color:${p.accent};">${p.label}</span>
        </div>
      </div>
    </div>`
  }).join('')
}

function filterVideos(cat, btn) {
  document.querySelectorAll('.vf-btn').forEach(b => b.classList.remove('active'))
  btn.classList.add('active')
  loadVideos(cat)
}

async function openVideo(videoId) {
  const video = allVideos.find(v => v.id === videoId)
  if (!video) return
  const { data: { publicUrl } } = supabase.storage.from('videos-ejercicios').getPublicUrl(video.storage_path)
  document.getElementById('video-title-modal').textContent = video.titulo
  document.getElementById('video-desc-modal').textContent = video.descripcion || ''
  const player = document.getElementById('video-player')
  player.src = publicUrl
  player.load()
  document.getElementById('modal-video').classList.add('open')
}

// ── CHAT ──
function renderChat() {
  return `
  <div class="chat-head">
    <div class="chat-av">VC<div class="chat-online"></div></div>
    <div>
      <div class="chat-name">Victoria Cartes Campos</div>
      <div class="chat-status-txt">En línea · responde en &lt;2 hrs</div>
    </div>
    <button class="chat-wa" onclick="showToast('Abriendo WhatsApp…')"><i class="ti ti-brand-whatsapp"></i> WhatsApp</button>
  </div>
  <div class="msgs" id="msgs"><div class="msgs-loading"><div class="spinner"></div></div></div>
  <div class="quick-chips">
    <div class="qc" onclick="sendQuick('¿Puedo hacer la sesión de hoy con dolor de cabeza?')">¿Con dolor de cabeza?</div>
    <div class="qc" onclick="sendQuick('Ya hice la sesión ✅')">Sesión lista ✅</div>
    <div class="qc" onclick="sendQuick('Tengo una consulta sobre los ejercicios')">Tengo una consulta</div>
  </div>
  <div class="chat-inp-row">
    <input class="chat-inp" id="chat-inp" type="text" placeholder="Escribe a Victoria…">
    <button class="send-b" onclick="sendMessage()"><i class="ti ti-send"></i></button>
  </div>`
}

async function loadMessages() {
  if (!currentUser) return
  const msgs = document.getElementById('msgs')
  if (!msgs) return

  const { data, error } = await supabase
    .from('mensajes')
    .select('*')
    .or(`de_id.eq.${currentUser.id},para_id.eq.${currentUser.id}`)
    .order('created_at', { ascending: true })
    .limit(50)

  if (error || !data || data.length === 0) {
    msgs.innerHTML = `
      <div class="msg-wrap vic">
        <div class="msg-av2 vic">VC</div>
        <div>
          <div class="bub">Hola 👋 Bienvenida a Rekupera. Estoy aquí para acompañarte en tu proceso. ¡Cualquier duda me escribes!</div>
          <div class="msg-t">Victoria</div>
        </div>
      </div>`
    return
  }

  msgs.innerHTML = data.map(m => {
    const isMine = m.de_id === currentUser.id
    const initials = isMine ? (currentProfile?.nombre?.split(' ').map(n=>n[0]).join('').slice(0,2) || 'YO') : 'VC'
    return `
    <div class="msg-wrap ${isMine?'me':'vic'}">
      <div class="msg-av2 ${isMine?'me':'vic'}">${initials}</div>
      <div>
        <div class="bub">${m.texto}</div>
        <div class="msg-t">${formatTime(m.created_at)}</div>
      </div>
    </div>`
  }).join('')
  msgs.scrollTop = msgs.scrollHeight

  // Realtime subscription
  supabase.channel('mensajes').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, payload => {
    const m = payload.new
    if (m.de_id !== currentUser.id && m.para_id !== currentUser.id) return
    const isMine = m.de_id === currentUser.id
    const initials = isMine ? (currentProfile?.nombre?.split(' ').map(n=>n[0]).join('').slice(0,2) || 'YO') : 'VC'
    const div = document.createElement('div')
    div.className = `msg-wrap ${isMine?'me':'vic'}`
    div.innerHTML = `<div class="msg-av2 ${isMine?'me':'vic'}">${initials}</div><div><div class="bub">${m.texto}</div><div class="msg-t">${formatTime(m.created_at)}</div></div>`
    msgs.appendChild(div)
    msgs.scrollTop = msgs.scrollHeight
  }).subscribe()
}

async function sendMessage() {
  const inp = document.getElementById('chat-inp')
  const texto = inp?.value?.trim()
  if (!texto || !currentUser) return
  inp.value = ''
  const { data: victoria } = await supabase.from('profiles').select('id').eq('es_victoria', true).single()
  if (!victoria) return showToast('Error al enviar mensaje')
  await supabase.from('mensajes').insert({ de_id: currentUser.id, para_id: victoria.id, texto })
}

async function sendQuick(text) {
  if (!currentUser) return
  const { data: victoria } = await supabase.from('profiles').select('id').eq('es_victoria', true).single()
  if (!victoria) return showToast('Error al enviar')
  await supabase.from('mensajes').insert({ de_id: currentUser.id, para_id: victoria.id, texto: text })
}

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('chat-inp') === document.activeElement) sendMessage()
})

// ── COACH PANEL ──
function renderCoach() {
  return `
  <div id="s-coach-inner" style="background:#0F0E0D;flex:1;overflow-y:auto;">
  <div class="coach-header">
    <div><h2>Hola, Victoria 👋</h2><p>Panel de seguimiento de clientas</p></div>
    <button class="coach-notif"><i class="ti ti-bell"></i><div class="notif-dot"></div></button>
  </div>
  <div class="coach-stats" id="coach-stats">
    <div class="cs-card"><div class="cs-val" id="cs-total">—</div><div class="cs-lbl">Clientas</div></div>
    <div class="cs-card"><div class="cs-val" id="cs-hoy">—</div><div class="cs-lbl">Activas hoy</div></div>
    <div class="cs-card"><div class="cs-val" id="cs-alertas">—</div><div class="cs-lbl">Sin registrar</div></div>
  </div>
  <div class="coach-lbl">Clientas activas</div>
  <div class="clients-list" id="clients-list">
    <div style="display:flex;align-items:center;justify-content:center;padding:24px;gap:10px;color:rgba(255,255,255,.3);font-size:13px;">
      <div class="spinner" style="border-color:rgba(255,255,255,.1);border-top-color:#C8506A;"></div>
      Cargando clientas…
    </div>
  </div>
  <div class="coach-lbl">Subir video de ejercicio</div>
  <div class="upload-video-section">
    <div class="inp-grp" style="padding:0 0 0;">
      <div class="inp-lbl" style="color:rgba(255,255,255,.35);">TÍTULO DEL VIDEO</div>
      <input class="m-inp" id="v-titulo" type="text" placeholder="Ej: Activación suelo pélvico nivel I">
    </div>
    <div class="inp-grp">
      <div class="inp-lbl" style="color:rgba(255,255,255,.35);">PROGRAMA</div>
      <select class="m-inp" id="v-cat">
        <option value="">Selecciona programa…</option>
        ${Object.entries(PROGRAM_CONFIG).map(([k,p]) => `<option value="${k}">${p.emoji} ${p.label}</option>`).join('')}
      </select>
    </div>
    <div class="inp-grp">
      <div class="inp-lbl" style="color:rgba(255,255,255,.35);">DURACIÓN Y NIVEL</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <input class="m-inp" id="v-dur" type="text" placeholder="Ej: 15 min">
        <select class="m-inp" id="v-nivel"><option value="">Nivel…</option><option>Básico</option><option>Intermedio</option><option>Avanzado</option></select>
      </div>
    </div>
    <div class="inp-grp">
      <div class="inp-lbl" style="color:rgba(255,255,255,.35);">DESCRIPCIÓN</div>
      <textarea class="m-inp" id="v-desc" rows="2" placeholder="Describe brevemente el ejercicio…" style="resize:none;"></textarea>
    </div>
    <div class="upload-area" onclick="document.getElementById('v-file').click()">
      <i class="ti ti-video-plus" style="font-size:32px;color:#C8506A;"></i>
      <p style="color:rgba(255,255,255,.5);">Toca para seleccionar el video</p>
      <p id="v-filename" style="font-size:11px;color:rgba(255,255,255,.3);"></p>
    </div>
    <input type="file" id="v-file" accept="video/*" style="display:none" onchange="document.getElementById('v-filename').textContent=this.files[0]?.name||''">
    <div class="upload-progress" id="v-progress-bar" style="display:none;">
      <div class="upload-bar" id="v-bar" style="width:0%"></div>
    </div>
    <button class="btn-main" onclick="subirVideo()" style="background:#C8506A;">
      <i class="ti ti-upload"></i> Subir video
    </button>
    <button class="btn-main" onclick="cerrarSesion()" style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.5);margin-top:4px;">
      <i class="ti ti-logout"></i> Cerrar sesión
    </button>
  </div>
  </div>`
}

async function loadCoachData() {
  const { data: clientas } = await supabase.from('profiles').select('*').eq('es_victoria', false).not('programa', 'is', null)
  const totalEl = document.getElementById('cs-total')
  const alertEl = document.getElementById('cs-alertas')
  if (totalEl) totalEl.textContent = clientas?.length || 0
  if (alertEl) alertEl.textContent = '—'

  const list = document.getElementById('clients-list')
  if (!list || !clientas || clientas.length === 0) {
    if (list) list.innerHTML = `<div style="padding:20px;text-align:center;color:rgba(255,255,255,.3);font-size:13px;">No hay clientas registradas aún.</div>`
    return
  }

  list.innerHTML = clientas.map(c => {
    const p = PROGRAM_CONFIG[c.programa] || PROGRAM_CONFIG.peso
    const initials = c.nombre?.split(' ').map(n=>n[0]).join('').slice(0,2) || '??'
    return `
    <div class="client-card" onclick="showToast('Abriendo perfil de ${c.nombre}…')">
      <div class="cc-top">
        <div class="cc-av" style="background:${p.accent};">${initials}</div>
        <div>
          <div class="cc-name">${c.nombre || c.email}</div>
          <div class="cc-prog">${p.emoji} ${p.label}</div>
        </div>
      </div>
      <div class="cc-foot">
        <div class="cc-metrics">
          <div class="cc-m"><div class="cc-m-val">${p.emoji}</div><div class="cc-m-lbl">Programa</div></div>
          <div class="cc-m"><div class="cc-m-val">—</div><div class="cc-m-lbl">Sesiones</div></div>
          <div class="cc-m"><div class="cc-m-val">—</div><div class="cc-m-lbl">Medidas</div></div>
        </div>
      </div>
    </div>`
  }).join('')
}

async function subirVideo() {
  const titulo = document.getElementById('v-titulo')?.value?.trim()
  const cat    = document.getElementById('v-cat')?.value
  const dur    = document.getElementById('v-dur')?.value?.trim()
  const nivel  = document.getElementById('v-nivel')?.value
  const desc   = document.getElementById('v-desc')?.value?.trim()
  const file   = document.getElementById('v-file')?.files?.[0]
  if (!titulo || !cat || !file) return showToast('Completa título, programa y selecciona un video')

  const bar  = document.getElementById('v-bar')
  const prog = document.getElementById('v-progress-bar')
  if (prog) prog.style.display = 'block'
  if (bar)  bar.style.width = '10%'

  const ext  = file.name.split('.').pop()
  const path = `${cat}/${Date.now()}.${ext}`
  const { error: upErr } = await supabase.storage.from('videos-ejercicios').upload(path, file)
  if (upErr) { showToast('Error al subir: ' + upErr.message); return }
  if (bar) bar.style.width = '80%'

  const { error: dbErr } = await supabase.from('videos').insert({ titulo, categoria: cat, duracion: dur, nivel, descripcion: desc, storage_path: path })
  if (dbErr) { showToast('Error al guardar: ' + dbErr.message); return }

  if (bar) bar.style.width = '100%'
  setTimeout(() => { if (prog) prog.style.display = 'none'; if (bar) bar.style.width = '0%' }, 1500)
  showToast('Video subido exitosamente ✓')
  document.getElementById('v-titulo').value = ''
  document.getElementById('v-desc').value = ''
  document.getElementById('v-filename').textContent = ''
}

// ── UTILS ──
function closeModal(id, e) {
  if (e.target === document.getElementById(id)) {
    document.getElementById(id).classList.remove('open')
    const vp = document.getElementById('video-player')
    if (vp) { vp.pause(); vp.src = '' }
  }
}

async function cerrarSesion() {
  await supabase.auth.signOut()
  currentUser = null; currentProfile = null
  document.getElementById('bottom-nav').style.display = 'none'
  renderScreen('login')
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const h = d.getHours().toString().padStart(2,'0')
  const m = d.getMinutes().toString().padStart(2,'0')
  return h + ':' + m
}

function showToast(msg) {
  const t = document.getElementById('toast')
  document.getElementById('tmsg').textContent = msg
  t.classList.add('show')
  setTimeout(() => t.classList.remove('show'), 3200)
}

// Load coach data after render
const coachObserver = new MutationObserver(() => {
  if (document.getElementById('clients-list')) {
    loadCoachData()
    coachObserver.disconnect()
  }
})
coachObserver.observe(document.getElementById('app'), { childList: true, subtree: true })
