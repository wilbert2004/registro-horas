// ========================================================
// LÓGICA COMPLETA DE HORAS TRACK PRO (VANILLA JS)
// ========================================================

document.addEventListener("DOMContentLoaded", () => {
  // Config Modal
  const configModal = document.getElementById("configModal");
  const btnConfigModal = document.getElementById("btnConfigModal");
  const btnCloseConfig = document.getElementById("btnCloseConfig");
  const formConfigSupabase = document.getElementById("formConfigSupabase");
  const cfgUrl = document.getElementById("cfgUrl");
  const cfgKey = document.getElementById("cfgKey");

  // Forgot Pass Modal
  const forgotModal = document.getElementById("forgotModal");
  const linkForgotPassword = document.getElementById("linkForgotPassword");
  const btnCloseForgot = document.getElementById("btnCloseForgot");
  const formForgotPass = document.getElementById("formForgotPass");
  const forgotEmail = document.getElementById("forgotEmail");
  const btnForgotSubmit = document.getElementById("btnForgotSubmit");

  // Modal Historial Retroactivo
  const modalRetro = document.getElementById("modalRetro");
  const btnHeaderRetro = document.getElementById("btnHeaderRetro");
  const btnToolGenerarRetro = document.getElementById("btnToolGenerarRetro");
  const btnCloseRetro = document.getElementById("btnCloseRetro");
  const formGenerarRetro = document.getElementById("formGenerarRetro");
  const retroStartDate = document.getElementById("retroStartDate");
  const retroEndDate = document.getElementById("retroEndDate");
  const retroEntry = document.getElementById("retroEntry");
  const retroExit = document.getElementById("retroExit");
  const retroLunchStart = document.getElementById("retroLunchStart");
  const retroLunchEnd = document.getElementById("retroLunchEnd");
  const retroSkipWeekends = document.getElementById("retroSkipWeekends");
  const btnSubmitRetro = document.getElementById("btnSubmitRetro");

  // Modal Día Individual
  const modalIndividual = document.getElementById("modalIndividual");
  const btnToolAddIndividual = document.getElementById("btnToolAddIndividual");
  const btnCloseIndividual = document.getElementById("btnCloseIndividual");
  const formIndividual = document.getElementById("formIndividual");
  const modalIndividualTitle = document.getElementById("modalIndividualTitle");
  const indivId = document.getElementById("indivId");
  const indivDate = document.getElementById("indivDate");
  const indivEntry = document.getElementById("indivEntry");
  const indivExit = document.getElementById("indivExit");
  const indivLunchStart = document.getElementById("indivLunchStart");
  const indivLunchEnd = document.getElementById("indivLunchEnd");
  const indivDesc = document.getElementById("indivDesc");

  // Modal Meta
  const modalTarget = document.getElementById("modalTarget");
  const btnEditTarget = document.getElementById("btnEditTarget");
  const btnCloseTarget = document.getElementById("btnCloseTarget");
  const formTarget = document.getElementById("formTarget");
  const inputTargetHours = document.getElementById("inputTargetHours");

  // Export / Backup Buttons
  const btnExportExcel = document.getElementById("btnExportExcel");
  const btnBackupJSON = document.getElementById("btnBackupJSON");
  const fileRestoreJSON = document.getElementById("fileRestoreJSON");
  const btnClearAllLogs = document.getElementById("btnClearAllLogs");

  // Auth UI Elements
  const authSection = document.getElementById("authSection");
  const tabLogin = document.getElementById("tabLogin");
  const tabRegister = document.getElementById("tabRegister");
  const formLogin = document.getElementById("formLogin");
  const formRegister = document.getElementById("formRegister");
  const btnLoginSubmit = document.getElementById("btnLoginSubmit");
  const btnRegisterSubmit = document.getElementById("btnRegisterSubmit");
  const userPill = document.getElementById("userPill");
  const userName = document.getElementById("userName");
  const userRoleBadge = document.getElementById("userRoleBadge");
  const btnLogout = document.getElementById("btnLogout");

  // Clock Elements
  const clockDate = document.getElementById("clockDate");
  const clockTime = document.getElementById("clockTime");
  const clockStatusBadge = document.getElementById("clockStatusBadge");
  const btnPunchEntrada = document.getElementById("btnPunchEntrada");
  const btnPunchAlmuerzo = document.getElementById("btnPunchAlmuerzo");
  const btnPunchSalida = document.getElementById("btnPunchSalida");
  const lblPunchEntrada = document.getElementById("lblPunchEntrada");
  const lblPunchAlmuerzo = document.getElementById("lblPunchAlmuerzo");
  const lblPunchSalida = document.getElementById("lblPunchSalida");
  const lblTodayHours = document.getElementById("lblTodayHours");
  const lblTodayLunch = document.getElementById("lblTodayLunch");
  const lblTodayExtra = document.getElementById("lblTodayExtra");

  // Dashboards & Metrics
  const practicanteDashboard = document.getElementById("practicanteDashboard");
  const asesorDashboard = document.getElementById("asesorDashboard");
  const statWorkedHours = document.getElementById("statWorkedHours");
  const statTargetHours = document.getElementById("statTargetHours");
  const statPercentBadge = document.getElementById("statPercentBadge");
  const statProgressBar = document.getElementById("statProgressBar");
  const statRemainingHours = document.getElementById("statRemainingHours");
  const statCompletedDays = document.getElementById("statCompletedDays");
  const tablePracticanteBody = document.getElementById("tablePracticanteBody");
  const inputSearchLogs = document.getElementById("inputSearchLogs");
  const tableAsesorBody = document.getElementById("tableAsesorBody");
  const statTotalPracticantes = document.getElementById("statTotalPracticantes");
  const statGrandTotalHours = document.getElementById("statGrandTotalHours");

  let currentUser = null;
  let currentProfile = null;
  let rawPracticanteLogs = [];
  let todayLogEntry = null;

  // --- RELOJ EN TIEMPO REAL ---
  startLiveClock();

  function startLiveClock() {
    updateClock();
    setInterval(updateClock, 1000);
  }

  function updateClock() {
    const now = new Date();
    const days = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
    const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    
    if (clockDate) {
      clockDate.textContent = `${days[now.getDay()]}, ${now.getDate()} DE ${months[now.getMonth()]} DE ${now.getFullYear()}`;
    }
    if (clockTime) {
      clockTime.textContent = now.toTimeString().split(' ')[0];
    }
  }

  // Set default End Date to Today for Retro
  if (retroEndDate) {
    retroEndDate.valueAsDate = new Date();
  }

  // --- CONFIGURACIÓN DE SUPABASE CLIENT ---
  const client = getSupabaseClient();
  if (!client) {
    showToast("Configura tus credenciales de Supabase con el botón ⚙️ en el header.", "warning");
  } else {
    initAuthListener();
  }

  function initAuthListener() {
    client.auth.onAuthStateChange(async (event, session) => {
      if (session && session.user) {
        currentUser = session.user;
        await loadUserProfile();
      } else {
        currentUser = null;
        currentProfile = null;
        renderUnauthenticatedView();
      }
    });
  }

  async function loadUserProfile() {
    try {
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      currentProfile = data || {
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || currentUser.email,
        role: currentUser.user_metadata?.role || "practicante",
        target_hours: 480.0
      };

      renderAuthenticatedView();
    } catch (err) {
      console.error(err);
      renderUnauthenticatedView();
    }
  }

  function renderUnauthenticatedView() {
    authSection.classList.remove("hidden");
    userPill.classList.add("hidden");
    practicanteDashboard.classList.add("hidden");
    asesorDashboard.classList.add("hidden");
  }

  function renderAuthenticatedView() {
    authSection.classList.add("hidden");
    userPill.classList.remove("hidden");
    userName.textContent = currentProfile.full_name;

    if (currentProfile.role === "asesor") {
      userRoleBadge.textContent = "Asesor Externo";
      userRoleBadge.className = "header-badge";
      userRoleBadge.style.background = "rgba(16, 185, 129, 0.2)";
      userRoleBadge.style.color = "#34d399";
      practicanteDashboard.classList.add("hidden");
      asesorDashboard.classList.remove("hidden");
      loadAsesorData();
    } else {
      userRoleBadge.textContent = "Practicante";
      userRoleBadge.className = "header-badge";
      asesorDashboard.classList.add("hidden");
      practicanteDashboard.classList.remove("hidden");
      loadPracticanteData();
    }
  }

  // --- AUTENTICACIÓN ---
  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    formLogin.classList.remove("hidden");
    formRegister.classList.add("hidden");
  });

  tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    formRegister.classList.remove("hidden");
    formLogin.classList.add("hidden");
  });

  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    setBtnLoading(btnLoginSubmit, true, "Entrando...");
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    setBtnLoading(btnLoginSubmit, false, '<i data-feather="log-in"></i> Entrar');

    if (error) {
      showToast(`Error de acceso: ${error.message}`, "danger");
    } else {
      showToast("¡Sesión iniciada con éxito!", "success");
      formLogin.reset();
    }
  });

  formRegister.addEventListener("submit", async (e) => {
    e.preventDefault();
    const full_name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const role = document.getElementById("regRole").value;

    setBtnLoading(btnRegisterSubmit, true, "Creando cuenta...");
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { full_name, role } }
    });
    setBtnLoading(btnRegisterSubmit, false, '<i data-feather="user-plus"></i> Crear Cuenta');

    if (error) {
      if (error.message.includes("rate limit")) {
        showToast("Límite de envíos de Supabase alcanzado. Prueba con otro correo o deshabilita la confirmación por email en Supabase Auth.", "danger");
      } else {
        showToast(`Error de registro: ${error.message}`, "danger");
      }
    } else {
      showToast("¡Cuenta creada! Puedes iniciar sesión.", "success");
      formRegister.reset();
      tabLogin.click();
    }
  });

  btnLogout.addEventListener("click", async () => {
    if (client) {
      await client.auth.signOut();
      formLogin.reset();
      formRegister.reset();
      showToast("Sesión cerrada.", "info");
    }
  });

  // --- PRACTICANTE: CARGAR & RECALCULAR MÉTRICAS EN TIEMPO REAL ---
  async function loadPracticanteData() {
    tablePracticanteBody.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem;">Cargando historial...</td></tr>`;

    const { data, error } = await client
      .from("time_logs")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      showToast(`Error al cargar datos: ${error.message}`, "danger");
      return;
    }

    rawPracticanteLogs = data || [];
    recalculatePracticanteMetrics(rawPracticanteLogs);
    renderPracticanteTable(rawPracticanteLogs);
    checkTodayPunchStatus();
  }

  function recalculatePracticanteMetrics(logs) {
    let totalWorked = 0;
    let completedDaysSet = new Set();
    const target = currentProfile?.target_hours || 480.0;

    logs.forEach(log => {
      const h = Number(log.hours || 0);
      totalWorked += h;
      if (h > 0 && log.date) {
        completedDaysSet.add(log.date);
      }
    });

    const remaining = Math.max(0, target - totalWorked);
    const percent = Math.min(100, Math.round((totalWorked / target) * 100));

    statWorkedHours.textContent = totalWorked.toFixed(1);
    statTargetHours.textContent = target.toFixed(1);
    statRemainingHours.textContent = remaining.toFixed(1);
    statCompletedDays.textContent = completedDaysSet.size;
    statPercentBadge.textContent = `${percent}%`;
    if (statProgressBar) statProgressBar.style.width = `${percent}%`;
  }

  function renderPracticanteTable(logs) {
    if (logs.length === 0) {
      tablePracticanteBody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
            No tienes días registrados aún. Haz clic en <strong>✨ Rellenar Historial Retroactivo</strong> arriba para generar tus asistencias automáticas.
          </td>
        </tr>`;
    } else {
      tablePracticanteBody.innerHTML = logs.map(item => {
        const dateObj = new Date(item.date + "T00:00:00");
        const daysShort = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        const dayName = daysShort[dateObj.getDay()];

        return `
          <tr>
            <td><strong>${formatDisplayDate(item.date)}</strong></td>
            <td><span style="color: var(--text-muted); font-weight: 600;">${dayName}</span></td>
            <td>${item.entry_time ? `<span class="badge-time in">${item.entry_time.substring(0,5)}</span>` : '-'}</td>
            <td>${item.lunch_start ? `<span class="badge-time lunch">${item.lunch_start.substring(0,5)} - ${item.lunch_end ? item.lunch_end.substring(0,5) : ''}</span>` : '-'}</td>
            <td>${item.exit_time ? `<span class="badge-time out">${item.exit_time.substring(0,5)}</span>` : '-'}</td>
            <td><strong style="color: var(--primary);">${formatHoursToHHMM(item.hours)}</strong></td>
            <td><span style="color: var(--text-muted);">${item.extra_hours ? formatHoursToHHMM(item.extra_hours) : '00:00'}</span></td>
            <td style="text-align: right;">
              <button class="action-icon-btn btn-edit-single" data-id="${item.id}" title="Editar">
                <i data-feather="edit" style="width: 15px; height: 15px;"></i>
              </button>
              <button class="action-icon-btn btn-delete-single" data-id="${item.id}" title="Eliminar" style="color: #f87171;">
                <i data-feather="trash-2" style="width: 15px; height: 15px;"></i>
              </button>
            </td>
          </tr>
        `;
      }).join("");

      // Action Listeners
      document.querySelectorAll(".btn-edit-single").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const id = e.currentTarget.getAttribute("data-id");
          const log = rawPracticanteLogs.find(l => l.id === id);
          if (log) openEditIndividualModal(log);
        });
      });

      document.querySelectorAll(".btn-delete-single").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = e.currentTarget.getAttribute("data-id");
          if (confirm("¿Estás seguro de eliminar este registro?")) {
            await client.from("time_logs").delete().eq("id", id);
            showToast("Registro eliminado.", "success");
            loadPracticanteData();
          }
        });
      });
    }

    feather.replace();
  }

  // --- BOTONES DE MARCADO DE HOY (Clock Punching) ---
  function checkTodayPunchStatus() {
    const todayStr = new Date().toISOString().split('T')[0];
    todayLogEntry = rawPracticanteLogs.find(l => l.date === todayStr);

    if (todayLogEntry) {
      lblPunchEntrada.textContent = todayLogEntry.entry_time ? todayLogEntry.entry_time.substring(0,5) : "--:--";
      lblPunchAlmuerzo.textContent = todayLogEntry.lunch_start ? `${todayLogEntry.lunch_start.substring(0,5)}` : "--:--";
      lblPunchSalida.textContent = todayLogEntry.exit_time ? todayLogEntry.exit_time.substring(0,5) : "--:--";
      
      lblTodayHours.textContent = formatHoursToHHMM(todayLogEntry.hours);
      lblTodayLunch.textContent = (todayLogEntry.lunch_start && todayLogEntry.lunch_end) ? "01:00" : "00:00";
      lblTodayExtra.textContent = formatHoursToHHMM(todayLogEntry.extra_hours);

      if (todayLogEntry.entry_time && !todayLogEntry.exit_time) {
        clockStatusBadge.textContent = "En jornada activa";
        clockStatusBadge.classList.add("active");
      } else if (todayLogEntry.exit_time) {
        clockStatusBadge.textContent = "Jornada completada hoy";
        clockStatusBadge.classList.remove("active");
      }
    } else {
      lblPunchEntrada.textContent = "--:--";
      lblPunchAlmuerzo.textContent = "--:--";
      lblPunchSalida.textContent = "--:--";
      lblTodayHours.textContent = "00:00";
      lblTodayLunch.textContent = "00:00";
      lblTodayExtra.textContent = "00:00";
      clockStatusBadge.textContent = "Sin jornada activa hoy";
      clockStatusBadge.classList.remove("active");
    }
  }

  btnPunchEntrada.addEventListener("click", () => punchAction("entry"));
  btnPunchAlmuerzo.addEventListener("click", () => punchAction("lunch"));
  btnPunchSalida.addEventListener("click", () => punchAction("exit"));

  async function punchAction(type) {
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0,5);
    const todayStr = new Date().toISOString().split('T')[0];

    let payload = {
      user_id: currentUser.id,
      date: todayStr,
      entry_time: todayLogEntry?.entry_time || (type === "entry" ? nowTime : "08:00"),
      lunch_start: todayLogEntry?.lunch_start || (type === "lunch" ? nowTime : "12:00"),
      lunch_end: todayLogEntry?.lunch_end || (type === "lunch" ? "13:00" : "13:00"),
      exit_time: todayLogEntry?.exit_time || (type === "exit" ? nowTime : "17:00"),
      description: "Jornada registrada en tiempo real"
    };

    if (type === "entry") payload.entry_time = nowTime;
    if (type === "lunch") { payload.lunch_start = nowTime; payload.lunch_end = addHourToTime(nowTime, 1); }
    if (type === "exit") payload.exit_time = nowTime;

    // Calcular horas
    const computed = calculateHoursFromTimes(payload.entry_time, payload.lunch_start, payload.lunch_end, payload.exit_time);
    payload.hours = computed.hours;
    payload.extra_hours = computed.extra_hours;

    const { error } = await client.from("time_logs").upsert(payload, { onConflict: "user_id, date" });
    if (error) {
      showToast(`Error al marcar: ${error.message}`, "danger");
    } else {
      showToast(`Marcado exitoso (${type.toUpperCase()}) a las ${nowTime}`, "success");
      loadPracticanteData();
    }
  }

  // --- LÓGICA DE GENERACIÓN DE HISTORIAL RETROACTIVO (28 AGO - HOY) ---
  btnHeaderRetro.addEventListener("click", () => modalRetro.classList.add("open"));
  btnToolGenerarRetro.addEventListener("click", () => modalRetro.classList.add("open"));
  btnCloseRetro.addEventListener("click", () => modalRetro.classList.remove("open"));

  formGenerarRetro.addEventListener("submit", async (e) => {
    e.preventDefault();

    const startDateStr = retroStartDate.value;
    const endDateStr = retroEndDate.value;
    const entryT = retroEntry.value;
    const exitT = retroExit.value;
    const lStartT = retroLunchStart.value;
    const lEndT = retroLunchEnd.value;
    const skipWeekends = retroSkipWeekends.checked;

    if (!startDateStr || !endDateStr) {
      showToast("Selecciona el rango de fechas.", "warning");
      return;
    }

    const start = new Date(startDateStr + "T00:00:00");
    const end = new Date(endDateStr + "T00:00:00");

    if (start > end) {
      showToast("La fecha de inicio no puede ser posterior a la fecha final.", "warning");
      return;
    }

    setBtnLoading(btnSubmitRetro, true, "Generando registros...");

    // Calcular horas por jornada regular
    const computed = calculateHoursFromTimes(entryT, lStartT, lEndT, exitT);

    const logsToInsert = [];
    let cur = new Date(start);

    while (cur <= end) {
      const dayOfWeek = cur.getDay(); // 0 = Dom, 6 = Sáb
      if (!(skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6))) {
        const curDateStr = cur.toISOString().split('T')[0];
        logsToInsert.push({
          user_id: currentUser.id,
          date: curDateStr,
          entry_time: entryT,
          lunch_start: lStartT,
          lunch_end: lEndT,
          exit_time: exitT,
          hours: computed.hours,
          extra_hours: computed.extra_hours,
          description: "Jornada regular de prácticas"
        });
      }
      cur.setDate(cur.getDate() + 1);
    }

    // Inserción masiva mediante upsert
    const { data, error } = await client.from("time_logs").upsert(logsToInsert, { onConflict: "user_id, date" });

    setBtnLoading(btnSubmitRetro, false, "🚀 Generar e Insertar");

    if (error) {
      showToast(`Error en inserción masiva: ${error.message}`, "danger");
    } else {
      showToast(`¡Se generaron e insertaron ${logsToInsert.length} días de práctica correctamente!`, "success");
      modalRetro.classList.remove("open");
      loadPracticanteData();
    }
  });

  // --- LÓGICA DÍA INDIVIDUAL ---
  btnToolAddIndividual.addEventListener("click", () => {
    formIndividual.reset();
    indivId.value = "";
    indivDate.valueAsDate = new Date();
    indivEntry.value = "08:00";
    indivExit.value = "17:00";
    indivLunchStart.value = "12:00";
    indivLunchEnd.value = "13:00";
    indivDesc.value = "Jornada regular de prácticas";
    modalIndividualTitle.textContent = "📅 Añadir Día Individual";
    modalIndividual.classList.add("open");
  });

  function openEditIndividualModal(log) {
    indivId.value = log.id;
    indivDate.value = log.date;
    indivEntry.value = log.entry_time ? log.entry_time.substring(0,5) : "08:00";
    indivExit.value = log.exit_time ? log.exit_time.substring(0,5) : "17:00";
    indivLunchStart.value = log.lunch_start ? log.lunch_start.substring(0,5) : "12:00";
    indivLunchEnd.value = log.lunch_end ? log.lunch_end.substring(0,5) : "13:00";
    indivDesc.value = log.description || "";
    modalIndividualTitle.textContent = "✏️ Editar Día Individual";
    modalIndividual.classList.add("open");
  }

  btnCloseIndividual.addEventListener("click", () => modalIndividual.classList.remove("open"));

  formIndividual.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = indivDate.value;
    const entryT = indivEntry.value;
    const exitT = indivExit.value;
    const lStartT = indivLunchStart.value;
    const lEndT = indivLunchEnd.value;
    const desc = indivDesc.value.trim();

    const computed = calculateHoursFromTimes(entryT, lStartT, lEndT, exitT);

    const payload = {
      user_id: currentUser.id,
      date,
      entry_time: entryT,
      lunch_start: lStartT,
      lunch_end: lEndT,
      exit_time: exitT,
      hours: computed.hours,
      extra_hours: computed.extra_hours,
      description: desc
    };

    if (indivId.value) {
      payload.id = indivId.value;
    }

    const { error } = await client.from("time_logs").upsert(payload, { onConflict: "user_id, date" });
    if (error) {
      showToast(`Error al guardar día: ${error.message}`, "danger");
    } else {
      showToast("¡Día guardado correctamente!", "success");
      modalIndividual.classList.remove("open");
      loadPracticanteData();
    }
  });

  // --- LÓGICA META DE HORAS ---
  btnEditTarget.addEventListener("click", () => {
    inputTargetHours.value = currentProfile?.target_hours || 480.0;
    modalTarget.classList.add("open");
  });
  btnCloseTarget.addEventListener("click", () => modalTarget.classList.remove("open"));

  formTarget.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newTarget = parseFloat(inputTargetHours.value);
    if (!newTarget || newTarget <= 0) return;

    const { error } = await client.from("profiles").update({ target_hours: newTarget }).eq("id", currentUser.id);
    if (error) {
      showToast(`Error al actualizar meta: ${error.message}`, "danger");
    } else {
      currentProfile.target_hours = newTarget;
      showToast("¡Meta de horas actualizada!", "success");
      modalTarget.classList.remove("open");
      recalculatePracticanteMetrics(rawPracticanteLogs);
    }
  });

  // --- BUSCADOR Y EXPORTAR EXCEL / RESPALDO JSON ---
  if (inputSearchLogs) {
    inputSearchLogs.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) {
        renderPracticanteTable(rawPracticanteLogs);
      } else {
        const filtered = rawPracticanteLogs.filter(l =>
          (l.date && l.date.includes(term)) ||
          (l.description && l.description.toLowerCase().includes(term))
        );
        renderPracticanteTable(filtered);
      }
    });
  }

  btnExportExcel.addEventListener("click", () => {
    if (rawPracticanteLogs.length === 0) {
      showToast("No hay registros para exportar.", "warning");
      return;
    }

    let csvContent = "\uFEFFFecha,Día,Entrada,Inicio Almuerzo,Fin Almuerzo,Salida,Horas Totales,Horas Extra,Descripción\n";
    const daysShort = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    rawPracticanteLogs.forEach(l => {
      const d = new Date(l.date + "T00:00:00");
      const dayName = daysShort[d.getDay()];
      csvContent += `"${l.date}","${dayName}","${l.entry_time || ''}","${l.lunch_start || ''}","${l.lunch_end || ''}","${l.exit_time || ''}","${l.hours}","${l.extra_hours || 0}","${(l.description || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_Horas_Practicas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast("Reporte descargado en formato CSV Excel.", "success");
  });

  btnBackupJSON.addEventListener("click", () => {
    const jsonStr = JSON.stringify(rawPracticanteLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Respaldo_Horas_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast("Respaldo de seguridad JSON descargado.", "success");
  });

  fileRestoreJSON.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const logs = JSON.parse(event.target.result);
        if (Array.isArray(logs)) {
          const payload = logs.map(l => ({
            user_id: currentUser.id,
            date: l.date,
            entry_time: l.entry_time,
            lunch_start: l.lunch_start,
            lunch_end: l.lunch_end,
            exit_time: l.exit_time,
            hours: l.hours,
            extra_hours: l.extra_hours || 0,
            description: l.description || "Restaurado de respaldo JSON"
          }));

          const { error } = await client.from("time_logs").upsert(payload, { onConflict: "user_id, date" });
          if (error) {
            showToast(`Error al restaurar: ${error.message}`, "danger");
          } else {
            showToast(`¡Se restauraron ${payload.length} registros exitosamente!`, "success");
            loadPracticanteData();
          }
        }
      } catch (err) {
        showToast("Archivo JSON no válido.", "danger");
      }
    };
    reader.readAsText(file);
  });

  btnClearAllLogs.addEventListener("click", async () => {
    if (confirm("⚠️ ¿ATENCIÓN: Estás seguro de borrar TODO tu historial de prácticas? Esta acción no se puede deshacer.")) {
      const { error } = await client.from("time_logs").delete().eq("user_id", currentUser.id);
      if (error) {
        showToast(`Error al borrar: ${error.message}`, "danger");
      } else {
        showToast("Historial borrado por completo.", "info");
        loadPracticanteData();
      }
    }
  });

  // --- VISTA ASESOR EXTERNO ---
  async function loadAsesorData() {
    tableAsesorBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2.5rem;">Cargando resumen de practicantes...</td></tr>`;

    const { data, error } = await client.rpc("get_totals_per_practicante");

    if (error) {
      showToast(`Error en RPC Asesor: ${error.message}`, "danger");
      tableAsesorBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--accent-red);">No se pudo cargar el resumen. Verifica los permisos de RLS.</td></tr>`;
      return;
    }

    let grandTotal = 0;
    if (!data || data.length === 0) {
      tableAsesorBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">No hay practicantes registrados aún.</td></tr>`;
    } else {
      tableAsesorBody.innerHTML = data.map(item => {
        const hours = Number(item.total_hours || 0);
        const target = Number(item.target_hours || 480.0);
        const percent = Math.min(100, Math.round((hours / target) * 100));
        grandTotal += hours;

        return `
          <tr>
            <td>
              <strong style="font-size: 0.95rem; color: var(--text-main);">${escapeHtml(item.full_name || 'Practicante')}</strong>
            </td>
            <td><span style="font-weight: 700; color: #34d399;">${item.completed_days || 0} días</span></td>
            <td>
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div class="progress-bar-bg" style="width: 120px; margin: 0;">
                  <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                </div>
                <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-muted);">${percent}%</span>
              </div>
            </td>
            <td style="text-align: right;">
              <span style="background: rgba(16, 185, 129, 0.15); color: #34d399; padding: 0.35rem 0.8rem; border-radius: 20px; font-weight: 800;">
                ${hours.toFixed(2)} hrs
              </span>
            </td>
          </tr>
        `;
      }).join("");
    }

    statTotalPracticantes.textContent = data ? data.length : 0;
    statGrandTotalHours.textContent = `${grandTotal.toFixed(1)}`;
    feather.replace();
  }

  // --- UTILIDADES ---
  function calculateHoursFromTimes(entry, lunchStart, lunchEnd, exit) {
    if (!entry || !exit) return { hours: 0, extra_hours: 0 };

    const parseMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };

    const entryM = parseMinutes(entry);
    const exitM = parseMinutes(exit);
    let totalM = exitM - entryM;

    if (lunchStart && lunchEnd) {
      const lStartM = parseMinutes(lunchStart);
      const lEndM = parseMinutes(lunchEnd);
      const lunchM = lEndM - lStartM;
      if (lunchM > 0) totalM -= lunchM;
    }

    const hours = Math.max(0, totalM / 60);
    const extra_hours = hours > 8.0 ? (hours - 8.0) : 0;

    return {
      hours: Number(hours.toFixed(2)),
      extra_hours: Number(extra_hours.toFixed(2))
    };
  }

  function formatHoursToHHMM(decimalHours) {
    if (!decimalHours || decimalHours <= 0) return "00:00";
    const hrs = Math.floor(decimalHours);
    const mins = Math.round((decimalHours - hrs) * 60);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  function addHourToTime(timeStr, addHours) {
    const [h, m] = timeStr.split(':').map(Number);
    const newH = (h + addHours) % 24;
    return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  function setBtnLoading(btn, isLoading, originalHtml) {
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      btn.innerHTML = `<span class="spinner"></span> <span>${originalHtml}</span>`;
    } else {
      btn.disabled = false;
      btn.innerHTML = originalHtml;
      feather.replace();
    }
  }

  function showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toastMessage");
    const toastIcon = document.getElementById("toastIcon");

    toastMessage.textContent = message;

    if (type === "danger") {
      toast.style.borderColor = "rgba(239, 68, 68, 0.5)";
      toastIcon.setAttribute("data-feather", "alert-triangle");
      toastIcon.style.color = "var(--accent-red)";
    } else if (type === "success") {
      toast.style.borderColor = "rgba(16, 185, 129, 0.5)";
      toastIcon.setAttribute("data-feather", "check-circle");
      toastIcon.style.color = "var(--accent-green)";
    } else if (type === "warning") {
      toast.style.borderColor = "rgba(245, 158, 11, 0.5)";
      toastIcon.setAttribute("data-feather", "alert-circle");
      toastIcon.style.color = "#f59e0b";
    } else {
      toast.style.borderColor = "var(--card-border)";
      toastIcon.setAttribute("data-feather", "info");
      toastIcon.style.color = "var(--primary)";
    }

    feather.replace();
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 4000);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
});
