// ========================================================
// LÓGICA REFINADA Y PROFESIONAL DE ASISTENCIA Y RESIDENCIA (VANILLA JS)
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

  // Modal Día Individual & Incapacidad
  const modalIndividual = document.getElementById("modalIndividual");
  const btnToolAddIndividual = document.getElementById("btnToolAddIndividual");
  const btnToolAddSickLeave = document.getElementById("btnToolAddSickLeave");
  const btnCloseIndividual = document.getElementById("btnCloseIndividual");
  const formIndividual = document.getElementById("formIndividual");
  const modalIndividualTitle = document.getElementById("modalIndividualTitle");
  const indivId = document.getElementById("indivId");
  const indivDate = document.getElementById("indivDate");
  const indivStatusType = document.getElementById("indivStatusType");
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

  // Export Button
  const btnExportExcel = document.getElementById("btnExportExcel");

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

  // Reloj digital en vivo
  startLiveClock();

  function startLiveClock() {
    updateClock();
    setInterval(updateClock, 1000);
  }

  function updateClock() {
    const now = new Date();
    const days = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];
    const months = ["ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO", "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"];
    
    if (clockDate) clockDate.textContent = `${days[now.getDay()]}, ${now.getDate()} DE ${months[now.getMonth()]} DE ${now.getFullYear()}`;
    if (clockTime) clockTime.textContent = now.toTimeString().split(' ')[0];
  }

  // Cliente Supabase
  const client = getSupabaseClient();
  if (!client) {
    showToast("Por favor configura tus credenciales de Supabase.", "warning");
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
        target_hours: 500.0
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
      userRoleBadge.style.background = "rgba(16, 185, 129, 0.2)";
      userRoleBadge.style.color = "#34d399";
      practicanteDashboard.classList.add("hidden");
      asesorDashboard.classList.remove("hidden");
      loadAsesorData();
    } else {
      userRoleBadge.textContent = "Practicante";
      userRoleBadge.style.background = "rgba(99, 102, 241, 0.2)";
      userRoleBadge.style.color = "#a5b4fc";
      asesorDashboard.classList.add("hidden");
      practicanteDashboard.classList.remove("hidden");
      loadPracticanteData();
    }
  }

  // Auth Forms
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
      showToast("¡Sesión iniciada!", "success");
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
        showToast("Límite de correos por hora alcanzado en Supabase Auth. Intenta con otro correo o deshabilita 'Confirm email' en tu panel.", "warning");
      } else {
        showToast(`Error de registro: ${error.message}`, "danger");
      }
    } else {
      showToast("¡Cuenta registrada exitosamente!", "success");
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

  // --- CARGAR & RECALCULAR MÉTRICAS EN TIEMPO REAL ---
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
    const target = currentProfile?.target_hours || 500.0;

    logs.forEach(log => {
      const h = Number(log.hours || 0);
      totalWorked += h;
      if ((h > 0 || log.status_type === 'enfermedad') && log.date) {
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
            No tienes asistencias registradas aún. Haz clic en <strong>Registrar / Editar Día</strong> para agregar tu primera jornada.
          </td>
        </tr>`;
    } else {
      tablePracticanteBody.innerHTML = logs.map(item => {
        const dateObj = new Date(item.date + "T00:00:00");
        const daysShort = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        const dayName = daysShort[dateObj.getDay()];

        const statusType = item.status_type || 'normal';
        let statusBadgeHTML = '<span class="status-pill normal">Regular</span>';
        if (statusType === 'enfermedad') statusBadgeHTML = '<span class="status-pill enfermedad">Incapacidad</span>';
        if (statusType === 'permiso') statusBadgeHTML = '<span class="status-pill permiso">Permiso</span>';
        if (statusType === 'feriado') statusBadgeHTML = '<span class="status-pill feriado">Feriado</span>';

        return `
          <tr>
            <td><strong>${formatDisplayDate(item.date)}</strong></td>
            <td><span style="color: var(--text-muted); font-weight: 600;">${dayName}</span></td>
            <td>${statusBadgeHTML}</td>
            <td>${item.entry_time ? `<span class="badge-time in">${item.entry_time.substring(0,5)}</span>` : '-'}</td>
            <td>${item.lunch_start ? `<span class="badge-time lunch">${item.lunch_start.substring(0,5)} - ${item.lunch_end ? item.lunch_end.substring(0,5) : ''}</span>` : '-'}</td>
            <td>${item.exit_time ? `<span class="badge-time out">${item.exit_time.substring(0,5)}</span>` : '-'}</td>
            <td><strong style="color: var(--primary);">${formatHoursToHHMM(item.hours)}</strong></td>
            <td style="text-align: right;">
              <button class="action-icon-btn btn-edit-single" data-id="${item.id}" title="Editar">
                <i data-feather="edit-2" style="width: 14px; height: 14px;"></i>
              </button>
              <button class="action-icon-btn btn-delete-single" data-id="${item.id}" title="Eliminar" style="color: #f87171;">
                <i data-feather="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
            </td>
          </tr>
        `;
      }).join("");

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
          if (confirm("¿Deseas eliminar este registro de asistencia?")) {
            await client.from("time_logs").delete().eq("id", id);
            showToast("Registro eliminado.", "success");
            loadPracticanteData();
          }
        });
      });
    }

    feather.replace();
  }

  // --- BOTONES MARCADO HOY ---
  function checkTodayPunchStatus() {
    const todayStr = new Date().toISOString().split('T')[0];
    todayLogEntry = rawPracticanteLogs.find(l => l.date === todayStr);

    if (todayLogEntry) {
      lblPunchEntrada.textContent = todayLogEntry.entry_time ? todayLogEntry.entry_time.substring(0,5) : "--:--";
      lblPunchAlmuerzo.textContent = todayLogEntry.lunch_start ? todayLogEntry.lunch_start.substring(0,5) : "--:--";
      lblPunchSalida.textContent = todayLogEntry.exit_time ? todayLogEntry.exit_time.substring(0,5) : "--:--";
      lblTodayHours.textContent = formatHoursToHHMM(todayLogEntry.hours);
      lblTodayLunch.textContent = (todayLogEntry.lunch_start && todayLogEntry.lunch_end) ? "01:00" : "00:00";
      lblTodayExtra.textContent = formatHoursToHHMM(todayLogEntry.extra_hours);

      if (todayLogEntry.entry_time && !todayLogEntry.exit_time) {
        clockStatusBadge.textContent = "En jornada activa hoy";
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
    if (!currentUser) {
      showToast("Debes iniciar sesión para marcar asistencia.", "warning");
      return;
    }

    const nowTime = new Date().toTimeString().split(' ')[0].substring(0,5);
    const todayStr = new Date().toISOString().split('T')[0];

    let entryT = todayLogEntry?.entry_time || null;
    let lStartT = todayLogEntry?.lunch_start || null;
    let lEndT = todayLogEntry?.lunch_end || null;
    let exitT = todayLogEntry?.exit_time || null;

    if (type === "entry") {
      entryT = nowTime;
    } else if (type === "lunch") {
      lStartT = nowTime;
      lEndT = addMinutesToTime(nowTime, 60);
    } else if (type === "exit") {
      exitT = nowTime;
    }

    let computed = { hours: 0, extra_hours: 0 };
    if (entryT && exitT) {
      computed = calculateHoursFromTimes(entryT, lStartT, lEndT, exitT);
    }

    let payload = {
      user_id: currentUser.id,
      date: todayStr,
      entry_time: entryT,
      lunch_start: lStartT,
      lunch_end: lEndT,
      exit_time: exitT,
      hours: computed.hours,
      extra_hours: computed.extra_hours,
      status_type: "normal",
      description: "Jornada registrada en tiempo real"
    };

    if (todayLogEntry && todayLogEntry.id) {
      payload.id = todayLogEntry.id;
    }

    const { data, error } = await client.from("time_logs").upsert(payload, { onConflict: "user_id, date" });
    if (error) {
      showToast(`Error al marcar asistencia: ${error.message}`, "danger");
    } else {
      const typeLabel = type === "entry" ? "Entrada" : (type === "lunch" ? "Inicio de Almuerzo" : "Salida");
      showToast(`¡${typeLabel} marcada a las ${nowTime}!`, "success");
      loadPracticanteData();
    }
  }

  // --- LÓGICA REGISTRAR / EDITAR DÍA INDIVIDUAL O INCAPACIDAD ---
  btnToolAddIndividual.addEventListener("click", () => openIndividualModal("normal"));
  btnToolAddSickLeave.addEventListener("click", () => openIndividualModal("enfermedad"));

  function openIndividualModal(defaultType = "normal") {
    formIndividual.reset();
    indivId.value = "";
    indivDate.valueAsDate = new Date();
    indivStatusType.value = defaultType;
    indivEntry.value = "10:00";
    indivExit.value = "16:30";
    indivLunchStart.value = "13:00";
    indivLunchEnd.value = "14:00";
    indivDesc.value = defaultType === "enfermedad" ? "Incapacidad por enfermedad / médica" : "Residencia profesional";

    modalIndividualTitle.textContent = defaultType === "enfermedad" ? "Registrar Incapacidad / Permiso" : "Registrar Día de Asistencia";
    modalIndividual.classList.add("open");
  }

  function openEditIndividualModal(log) {
    indivId.value = log.id;
    indivDate.value = log.date;
    indivStatusType.value = log.status_type || "normal";
    indivEntry.value = log.entry_time ? log.entry_time.substring(0,5) : "10:00";
    indivExit.value = log.exit_time ? log.exit_time.substring(0,5) : "16:30";
    indivLunchStart.value = log.lunch_start ? log.lunch_start.substring(0,5) : "13:00";
    indivLunchEnd.value = log.lunch_end ? log.lunch_end.substring(0,5) : "14:00";
    indivDesc.value = log.description || "";

    modalIndividualTitle.textContent = "Editar Registro de Día";
    modalIndividual.classList.add("open");
  }

  indivStatusType.addEventListener("change", (e) => {
    const type = e.target.value;
    if (type === "enfermedad" || type === "permiso" || type === "feriado") {
      if (indivDesc.value === "Residencia profesional" || !indivDesc.value) {
        indivDesc.value = type === "enfermedad" ? "Incapacidad por enfermedad / médica" : "Permiso justificado";
      }
    }
  });

  btnCloseIndividual.addEventListener("click", () => modalIndividual.classList.remove("open"));

  formIndividual.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = indivDate.value;
    const statusType = indivStatusType.value;
    const entryT = indivEntry.value;
    const exitT = indivExit.value;
    const lStartT = indivLunchStart.value;
    const lEndT = indivLunchEnd.value;
    const desc = indivDesc.value.trim();

    let computed = { hours: 0, extra_hours: 0 };
    if (statusType === "normal" && entryT && exitT) {
      computed = calculateHoursFromTimes(entryT, lStartT, lEndT, exitT);
    }

    const payload = {
      user_id: currentUser.id,
      date,
      entry_time: statusType === "normal" ? entryT : (entryT || null),
      lunch_start: statusType === "normal" ? lStartT : (lStartT || null),
      lunch_end: statusType === "normal" ? lEndT : (lEndT || null),
      exit_time: statusType === "normal" ? exitT : (exitT || null),
      hours: computed.hours,
      extra_hours: computed.extra_hours,
      status_type: statusType,
      description: desc
    };

    if (indivId.value) payload.id = indivId.value;

    const { error } = await client.from("time_logs").upsert(payload, { onConflict: "user_id, date" });
    if (error) {
      showToast(`Error al guardar: ${error.message}`, "danger");
    } else {
      showToast("¡Registro guardado con éxito!", "success");
      modalIndividual.classList.remove("open");
      loadPracticanteData();
    }
  });

  // --- LÓGICA META DE HORAS ---
  btnEditTarget.addEventListener("click", () => {
    inputTargetHours.value = currentProfile?.target_hours || 500.0;
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

  // --- EXPORTAR REPORTES ---
  if (inputSearchLogs) {
    inputSearchLogs.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) {
        renderPracticanteTable(rawPracticanteLogs);
      } else {
        const filtered = rawPracticanteLogs.filter(l =>
          (l.date && l.date.includes(term)) ||
          (l.description && l.description.toLowerCase().includes(term)) ||
          (l.status_type && l.status_type.toLowerCase().includes(term))
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

    let csvContent = "\uFEFFFecha,Día,Estado,Entrada,Inicio Almuerzo,Fin Almuerzo,Salida,Horas Totales,Horas Extra,Notas\n";
    const daysShort = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

    rawPracticanteLogs.forEach(l => {
      const d = new Date(l.date + "T00:00:00");
      const dayName = daysShort[d.getDay()];
      csvContent += `"${l.date}","${dayName}","${l.status_type || 'normal'}","${l.entry_time || ''}","${l.lunch_start || ''}","${l.lunch_end || ''}","${l.exit_time || ''}","${l.hours}","${l.extra_hours || 0}","${(l.description || '').replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Residencia_Profesional_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast("Reporte descargado exitosamente en formato CSV.", "success");
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
        const target = Number(item.target_hours || 500.0);
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

  // --- AUXILIARES Y CÁLCULOS ---
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

  function addMinutesToTime(timeStr, addMinutes) {
    const [h, m] = timeStr.split(':').map(Number);
    const totalM = h * 60 + m + addMinutes;
    const newH = Math.floor(totalM / 60) % 24;
    const newM = totalM % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
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
      btn.innerHTML = originalHtml;
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
