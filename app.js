// ========================================================
// LÓGICA DE LA APLICACIÓN MEJORADA (VANILLA JS)
// ========================================================

document.addEventListener("DOMContentLoaded", () => {
  // Config Modal Elements
  const configModal = document.getElementById("configModal");
  const btnConfigModal = document.getElementById("btnConfigModal");
  const btnCloseConfig = document.getElementById("btnCloseConfig");
  const formConfigSupabase = document.getElementById("formConfigSupabase");
  const cfgUrl = document.getElementById("cfgUrl");
  const cfgKey = document.getElementById("cfgKey");

  // Forgot Password Modal Elements
  const forgotModal = document.getElementById("forgotModal");
  const linkForgotPassword = document.getElementById("linkForgotPassword");
  const btnCloseForgot = document.getElementById("btnCloseForgot");
  const formForgotPass = document.getElementById("formForgotPass");
  const forgotEmail = document.getElementById("forgotEmail");
  const btnForgotSubmit = document.getElementById("btnForgotSubmit");

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

  // Dashboards
  const practicanteDashboard = document.getElementById("practicanteDashboard");
  const asesorDashboard = document.getElementById("asesorDashboard");

  // Practicante Elements
  const formAddHours = document.getElementById("formAddHours");
  const logDate = document.getElementById("logDate");
  const logHours = document.getElementById("logHours");
  const logDesc = document.getElementById("logDesc");
  const btnAddHoursSubmit = document.getElementById("btnAddHoursSubmit");
  const tablePracticanteBody = document.getElementById("tablePracticanteBody");
  const statTotalHoursPracticante = document.getElementById("statTotalHoursPracticante");
  const statTotalLogsPracticante = document.getElementById("statTotalLogsPracticante");
  const statProgressBar = document.getElementById("statProgressBar");
  const inputSearchLogs = document.getElementById("inputSearchLogs");

  // Asesor Elements
  const tableAsesorBody = document.getElementById("tableAsesorBody");
  const statTotalPracticantes = document.getElementById("statTotalPracticantes");
  const statGrandTotalHours = document.getElementById("statGrandTotalHours");

  let currentUser = null;
  let currentProfile = null;
  let rawPracticanteLogs = [];

  // Reset por defecto a la fecha de hoy
  resetFormDate();

  function resetFormDate() {
    if (logDate) {
      logDate.valueAsDate = new Date();
    }
  }

  // --- 1. MODAL DE CONFIGURACIÓN SUPABASE ---
  btnConfigModal.addEventListener("click", () => {
    cfgUrl.value = localStorage.getItem("time_tracker_supabase_url") || SUPABASE_URL;
    cfgKey.value = localStorage.getItem("time_tracker_supabase_key") || SUPABASE_ANON_KEY;
    configModal.classList.add("open");
  });

  btnCloseConfig.addEventListener("click", () => {
    configModal.classList.remove("open");
  });

  formConfigSupabase.addEventListener("submit", (e) => {
    e.preventDefault();
    localStorage.setItem("time_tracker_supabase_url", cfgUrl.value.trim());
    localStorage.setItem("time_tracker_supabase_key", cfgKey.value.trim());
    configModal.classList.remove("open");
    showToast("Credenciales de Supabase guardadas correctamente. Recargando...", "success");
    setTimeout(() => location.reload(), 1000);
  });

  // --- 2. MODAL DE RECUPERAR CONTRASEÑA ---
  if (linkForgotPassword) {
    linkForgotPassword.addEventListener("click", (e) => {
      e.preventDefault();
      const currentLoginEmail = document.getElementById("loginEmail").value.trim();
      if (currentLoginEmail) {
        forgotEmail.value = currentLoginEmail;
      }
      forgotModal.classList.add("open");
    });
  }

  if (btnCloseForgot) {
    btnCloseForgot.addEventListener("click", () => {
      forgotModal.classList.remove("open");
    });
  }

  if (formForgotPass) {
    formForgotPass.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = forgotEmail.value.trim();
      if (!email) return;

      setBtnLoading(btnForgotSubmit, true, "Enviando...");

      try {
        const { data, error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.href
        });

        if (error) {
          showToast(`Error: ${error.message}`, "danger");
        } else {
          showToast("¡Enlace enviado! Revisa tu bandeja de entrada o carpeta de SPAM.", "success");
          formForgotPass.reset();
          forgotModal.classList.remove("open");
        }
      } catch (err) {
        showToast(`Error inesperado: ${err.message}`, "danger");
      } finally {
        setBtnLoading(btnForgotSubmit, false, '<i data-feather="send"></i> Enviar Enlace');
      }
    });
  }

  // --- 3. TABS DE AUTH (Login / Registro) ---
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

  // --- 4. INICIALIZAR SUPABASE & ESCUCHAR ESTADO DE SESIÓN ---
  const client = getSupabaseClient();
  if (!client) {
    showToast("Por favor configura las credenciales de Supabase en el botón superior derecho.", "warning");
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

  // Cargar Perfil de Usuario (Rol)
  async function loadUserProfile() {
    try {
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error al cargar perfil:", error);
      }

      currentProfile = data || {
        id: currentUser.id,
        full_name: currentUser.user_metadata?.full_name || currentUser.email,
        role: currentUser.user_metadata?.role || "practicante"
      };

      renderAuthenticatedView();
    } catch (err) {
      console.error(err);
      renderUnauthenticatedView();
    }
  }

  // --- 5. CONTROL DE VISTAS SEGÚN AUTENTICACIÓN Y ROL ---
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
      userRoleBadge.className = "role-badge asesor";
      practicanteDashboard.classList.add("hidden");
      asesorDashboard.classList.remove("hidden");
      loadAsesorData();
    } else {
      userRoleBadge.textContent = "Practicante";
      userRoleBadge.className = "role-badge practicante";
      asesorDashboard.classList.add("hidden");
      practicanteDashboard.classList.remove("hidden");
      loadPracticanteData();
    }
  }

  // --- 6. LÓGICA DE AUTENTICACIÓN & FIXES DE RESET DE FORMULARIOS ---

  // Iniciar Sesión
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!client) {
      showToast("Por favor configura primero las credenciales de Supabase.", "warning");
      return;
    }

    setBtnLoading(btnLoginSubmit, true, "Entrando...");

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    
    setBtnLoading(btnLoginSubmit, false, '<i data-feather="log-in"></i> Entrar');

    if (error) {
      showToast(`Error de acceso: ${error.message}`, "danger");
    } else {
      showToast("¡Inicio de sesión exitoso!", "success");
      formLogin.reset(); // FIX: Limpiar formulario tras login exitoso
    }
  });

  // Registro de Usuario
  formRegister.addEventListener("submit", async (e) => {
    e.preventDefault();
    const full_name = document.getElementById("regName").value.trim();
    const email = document.getElementById("regEmail").value.trim();
    const password = document.getElementById("regPassword").value;
    const role = document.getElementById("regRole").value;

    if (!client) {
      showToast("Por favor configura primero las credenciales de Supabase.", "warning");
      return;
    }

    setBtnLoading(btnRegisterSubmit, true, "Creando cuenta...");

    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: {
        data: { full_name, role }
      }
    });

    setBtnLoading(btnRegisterSubmit, false, '<i data-feather="user-plus"></i> Crear Cuenta');

    if (error) {
      showToast(`Error de registro: ${error.message}`, "danger");
    } else {
      showToast("¡Cuenta creada exitosamente! Si se requiere verificación de correo, revisa tu bandeja.", "success");
      formRegister.reset(); // FIX: Limpiar formulario tras registro exitoso
      
      // Si el auto-confirm está activo en Supabase, cambiar a pestaña Login
      tabLogin.click();
    }
  });

  // Cerrar Sesión
  btnLogout.addEventListener("click", async () => {
    if (client) {
      await client.auth.signOut();
      formLogin.reset(); // FIX: Limpiar campos de login al salir
      formRegister.reset(); // FIX: Limpiar campos de registro al salir
      showToast("Has cerrado sesión correctamente.", "info");
    }
  });

  // --- 7. VISTA PRACTICANTE (Cargar, Filtrar, Agregar y Eliminar Horas) ---

  async function loadPracticanteData() {
    tablePracticanteBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 2rem;">Cargando tus registros...</td></tr>`;

    const { data, error } = await client
      .from("time_logs")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      showToast(`Error al cargar tus horas: ${error.message}`, "danger");
      return;
    }

    rawPracticanteLogs = data || [];
    renderPracticanteTable(rawPracticanteLogs);
  }

  function renderPracticanteTable(logs) {
    let totalHours = 0;
    if (logs.length === 0) {
      tablePracticanteBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
            No hay registros para mostrar. ¡Agrega tus horas usando el formulario superior!
          </td>
        </tr>`;
    } else {
      tablePracticanteBody.innerHTML = logs.map(item => {
        totalHours += Number(item.hours);
        return `
          <tr>
            <td><strong>${item.date}</strong></td>
            <td>
              <span style="background: rgba(99, 102, 241, 0.15); color: #a5b4fc; padding: 0.3rem 0.75rem; border-radius: 20px; font-weight: 700; font-size: 0.9rem;">
                ${Number(item.hours).toFixed(2)} hrs
              </span>
            </td>
            <td>${escapeHtml(item.description || '-')}</td>
            <td style="text-align: right;">
              <button class="btn-danger btn-delete-log" data-id="${item.id}">
                <i data-feather="trash-2" style="width: 14px; height: 14px;"></i> Eliminar
              </button>
            </td>
          </tr>
        `;
      }).join("");

      // Listener para botones de eliminar
      document.querySelectorAll(".btn-delete-log").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const logId = e.currentTarget.getAttribute("data-id");
          if (confirm("¿Estás seguro de eliminar este registro de horas?")) {
            await deleteLogEntry(logId);
          }
        });
      });
    }

    // Actualizar métricas y barra de progreso (Meta de 100 horas)
    statTotalHoursPracticante.textContent = `${totalHours.toFixed(1)} hrs`;
    statTotalLogsPracticante.textContent = rawPracticanteLogs.length;

    const progressPercent = Math.min(100, (totalHours / 100) * 100);
    if (statProgressBar) {
      statProgressBar.style.width = `${progressPercent}%`;
    }

    feather.replace();
  }

  // Filtro de búsqueda en tiempo real
  if (inputSearchLogs) {
    inputSearchLogs.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase().trim();
      if (!term) {
        renderPracticanteTable(rawPracticanteLogs);
      } else {
        const filtered = rawPracticanteLogs.filter(log =>
          (log.description && log.description.toLowerCase().includes(term)) ||
          (log.date && log.date.includes(term))
        );
        renderPracticanteTable(filtered);
      }
    });
  }

  // Registrar nueva entrada de horas (FIX: Limpiar formulario tras guardar)
  formAddHours.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = logDate.value;
    const hours = parseFloat(logHours.value);
    const description = logDesc.value.trim();

    if (!date || isNaN(hours) || hours <= 0 || !description) {
      showToast("Por favor completa todos los campos correctamente.", "warning");
      return;
    }

    setBtnLoading(btnAddHoursSubmit, true, "Guardando...");

    const { data, error } = await client.from("time_logs").insert([
      {
        user_id: currentUser.id,
        date,
        hours,
        description
      }
    ]);

    setBtnLoading(btnAddHoursSubmit, false, '<i data-feather="check-circle"></i> Guardar');

    if (error) {
      showToast(`Error al guardar horas: ${error.message}`, "danger");
    } else {
      showToast("¡Registro de horas guardado exitosamente!", "success");
      
      // FIX CRÍTICO: Limpiar el formulario y resetear la fecha a la de hoy
      formAddHours.reset();
      resetFormDate();

      loadPracticanteData();
    }
  });

  // Eliminar registro
  async function deleteLogEntry(logId) {
    const { error } = await client.from("time_logs").delete().eq("id", logId);
    if (error) {
      showToast(`Error al eliminar: ${error.message}`, "danger");
    } else {
      showToast("Registro eliminado con éxito.", "success");
      loadPracticanteData();
    }
  }

  // --- 8. VISTA ASESOR EXTERNO (Resumen por Practicante) ---

  async function loadAsesorData() {
    tableAsesorBody.innerHTML = `<tr><td colspan="2" style="text-align: center; padding: 2.5rem;">Cargando resumen de practicantes...</td></tr>`;

    const { data, error } = await client.rpc("get_totals_per_practicante");

    if (error) {
      showToast(`Error al obtener resumen de practicantes: ${error.message}`, "danger");
      tableAsesorBody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: var(--accent-red); padding: 2rem;">Error de permisos o función RPC no encontrada en Supabase.</td></tr>`;
      return;
    }

    let grandTotal = 0;
    if (!data || data.length === 0) {
      tableAsesorBody.innerHTML = `
        <tr>
          <td colspan="2" style="text-align: center; color: var(--text-muted); padding: 2.5rem;">
            No hay ningún practicante registrado en el sistema.
          </td>
        </tr>`;
    } else {
      tableAsesorBody.innerHTML = data.map(item => {
        const hours = Number(item.total_hours || 0);
        grandTotal += hours;
        return `
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 0.85rem;">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), var(--secondary)); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; box-shadow: 0 4px 10px var(--primary-glow);">
                  ${item.full_name ? item.full_name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <strong style="font-size: 1rem; color: var(--text-main);">${escapeHtml(item.full_name || 'Practicante')}</strong>
                </div>
              </div>
            </td>
            <td style="text-align: right;">
              <span style="background: rgba(16, 185, 129, 0.15); color: var(--accent-green); border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.4rem 0.9rem; border-radius: 20px; font-weight: 800; font-size: 0.95rem;">
                ${hours.toFixed(2)} hrs acumuladas
              </span>
            </td>
          </tr>
        `;
      }).join("");
    }

    statTotalPracticantes.textContent = data ? data.length : 0;
    statGrandTotalHours.textContent = `${grandTotal.toFixed(1)} hrs`;
    feather.replace();
  }

  // --- UTILIDADES (Loading en Botones, Toast & Escape HTML) ---

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
