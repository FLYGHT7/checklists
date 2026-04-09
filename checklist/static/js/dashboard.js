/**
 * Dashboard.js - Script optimizado para carga rápida
 */

// Configuración
const CONFIG = {
  updateInterval: 120000, // Actualizar cada 2 minutos para reducir carga
  apiEndpoint: "/todo_list/",
  statsEndpoint: "/todo_list/{id}/stats/",
  selectors: {
    todoLists: ".modern-card[data-list-id]",
    totalCompleted: "#total-completed-tasks",
    taskTotal: ".stat-pill:nth-child(1) .stat-value",
    taskTodo: ".stat-pill:nth-child(2) .stat-value",
    taskDone: ".stat-pill:nth-child(3) .stat-value",
    listProgress: ".progress.list-progress",
    listProgressBar: ".progress-bar.list-progress-bar",
  },
  storageKey: "taskStatusChanged",
};

// Clase para gestionar el dashboard
class DashboardManager {
  constructor(config) {
    this.config = config;
    this.updateInterval = null;
    this.isPageVisible = true;
    this.isInitialized = false;
  }

  /**
   * Inicializa el gestor del dashboard con carga diferida
   */
  init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Inicializar eventos básicos inmediatamente
    this.setupBasicEventListeners();

    // Diferir la inicialización completa para después de la carga inicial
    this.deferInitialization();

    // Removed verbose logs — use browser devtools Network tab to debug
  }

  /**
   * Configura los event listeners básicos
   */
  setupBasicEventListeners() {
    // Actualizar cuando la página vuelve a estar activa
    document.addEventListener("visibilitychange", () => {
      this.isPageVisible = document.visibilityState === "visible";
      if (this.isPageVisible && this.isInitialized) {
        this.updateDashboardStats();
      }
    });

    // Escuchar cambios en localStorage (comunicación entre páginas)
    window.addEventListener("storage", (event) => {
      if (event.key === this.config.storageKey && this.isInitialized) {
        this.updateDashboardStats();
      }
    });
  }

  /**
   * Difiere la inicialización completa para mejorar el tiempo de carga inicial
   */
  deferInitialization() {
    // Usar requestIdleCallback si está disponible, o setTimeout como fallback
    // Always pass { timeout: 2000 } so a busy CPU doesn’t defer indefinitely
    const scheduleInit = window.requestIdleCallback
      ? (cb) => window.requestIdleCallback(cb, { timeout: 2000 })
      : (cb) => setTimeout(cb, 1000);

    scheduleInit(() => {
      // Actualizar estadísticas después de que la página esté completamente cargada
      if (document.readyState === "complete") {
        this.completeInitialization();
      } else {
        window.addEventListener("load", () => this.completeInitialization());
      }
    });
  }

  /**
   * Completa la inicialización después de la carga inicial
   */
  completeInitialization() {
    this.setDynamicGreeting();
    this.setCurrentDate();
    this.setupScrollIndicators();
    this.syncAllProgressBars();

    // Mostrar skeleton en barras de progreso y stat de Completed antes del fetch
    this.showSkeletons();

    // Configurar intervalo de actualización
    this.setupUpdateInterval();

    // Actualizar estadísticas iniciales
    this.updateDashboardStats();
  }

  /**
   * Añade skeleton-shimmer a los elementos que se actualizan vía fetch
   */
  showSkeletons() {
    // Stat number: solo el de Completed se recalcula via JS
    const completedEl = document.querySelector(
      this.config.selectors.totalCompleted,
    );
    if (completedEl) completedEl.classList.add("skeleton-shimmer");

    // Progress bars: todas se recalculan via fetch
    document
      .querySelectorAll(this.config.selectors.listProgressBar)
      .forEach((bar) => bar.classList.add("skeleton-shimmer"));
  }

  /**
   * Sets a time-based greeting in the welcome header
   */
  setDynamicGreeting() {
    const el = document.getElementById("dashboard-greeting");
    if (!el) return;
    const hour = new Date().getHours();
    const greeting =
      hour < 12
        ? el.dataset.morning
        : hour < 18
          ? el.dataset.afternoon
          : el.dataset.evening;
    if (greeting) el.textContent = greeting;
  }

  /**
   * Renders the current date in the welcome header
   */
  setCurrentDate() {
    const el = document.getElementById("dashboard-date");
    if (!el) return;
    el.textContent = new Date().toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  /**
   * Configura y actualiza los indicadores de scroll horizontal
   */
  setupScrollIndicators() {
    const updateContainer = (container) => {
      if (!container) return;
      const content = container.closest(".recent-section-content");
      if (!content) return;

      const hasOverflow = container.scrollHeight > container.clientHeight + 4;
      const atBottom =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 8;

      content.classList.toggle("is-overflowing", hasOverflow);
      content.classList.toggle("at-bottom", !hasOverflow || atBottom);
    };

    ["todoListsContainer", "formsContainer"].forEach((containerId) => {
      const container = document.getElementById(containerId);
      if (!container || container.dataset.scrollBound === "true") return;

      container.dataset.scrollBound = "true";

      // Actualizar al hacer scroll
      container.addEventListener("scroll", () => updateContainer(container), {
        passive: true,
      });

      // Actualización inicial
      updateContainer(container);
    });

    // Re-check on resize (layout shifts can change overflow)
    window.addEventListener(
      "resize",
      () => {
        ["todoListsContainer", "formsContainer"].forEach((id) => {
          updateContainer(document.getElementById(id));
        });
      },
      { passive: true },
    );
  }

  /**
   * Configura el intervalo de actualización con manejo inteligente
   */
  setupUpdateInterval() {
    // Limpiar intervalo existente si lo hay
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Crear nuevo intervalo que solo actualiza si la página está visible
    this.updateInterval = setInterval(() => {
      if (this.isPageVisible) {
        this.updateDashboardStats();
      }
    }, this.config.updateInterval);
  }

  /**
   * Actualiza las estadísticas del dashboard con priorización
   */
  async updateDashboardStats() {
    const todoLists = document.querySelectorAll(
      this.config.selectors.todoLists,
    );

    // Si no hay listas en el dashboard, no hacer nada
    if (todoLists.length === 0) {
      return;
    }

    let totalCompletedTasks = 0;
    const updatePromises = [];

    // Preparar actualizaciones para cada lista visible primero
    todoLists.forEach((list) => {
      const listId = list.getAttribute("data-list-id");
      if (!listId) return;

      // Verificar si la lista está en el viewport
      const isVisible = this.isElementInViewport(list);

      const promise = this.updateListStats(list, listId, isVisible)
        .then((doneCount) => {
          totalCompletedTasks += doneCount;
        })
        .catch((error) => {
          console.error(`Error al actualizar lista ${listId}:`, error);
        });

      updatePromises.push(promise);
    });

    // Esperar a que todas las actualizaciones terminen
    try {
      await Promise.allSettled(updatePromises);

      // Actualizar el contador global de tareas completadas
      const totalCompletedElement = document.querySelector(
        this.config.selectors.totalCompleted,
      );
      if (totalCompletedElement) {
        totalCompletedElement.textContent = totalCompletedTasks;
        totalCompletedElement.classList.remove("skeleton-shimmer");
      }
    } catch (error) {
      console.error("Error al actualizar estadísticas:", error);
      // Quitar skeletons aunque falle el fetch
      document
        .querySelectorAll(".skeleton-shimmer")
        .forEach((el) => el.classList.remove("skeleton-shimmer"));
    }
  }

  /**
   * Verifica si un elemento está en el viewport
   * @param {HTMLElement} element - Elemento a verificar
   * @returns {boolean} - True si está en el viewport
   */
  isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  /**
   * Actualiza las estadísticas de una lista específica con priorización
   * @param {HTMLElement} listElement - Elemento DOM de la lista
   * @param {string} listId - ID de la lista
   * @param {boolean} isVisible - Si la lista está visible en el viewport
   * @returns {Promise<number>} - Promesa que resuelve al número de tareas completadas
   */
  async updateListStats(listElement, listId, isVisible) {
    // Priorizar listas visibles
    if (!isVisible) {
      // Retrasar la actualización de listas no visibles
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    try {
      // Usar el endpoint específico de estadísticas
      const statsEndpoint = this.config.statsEndpoint.replace("{id}", listId);
      const response = await fetch(statsEndpoint, {
        method: "GET",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      // Obtener datos JSON
      const data = await response.json();

      // Actualizar los contadores en la tarjeta
      this.updateListCounters(listElement, {
        total: data.total || 0,
        todo: data.todo || 0,
        done: data.done || 0,
      });

      return data.done || 0;
    } catch (error) {
      console.error(`Error al obtener datos para lista ${listId}:`, error);

      // Como fallback, obtener datos del DOM
      return this.getStatsFromDOM(listElement);
    }
  }

  /**
   * Actualiza los contadores en la tarjeta de lista
   * @param {HTMLElement} listElement - Elemento DOM de la lista
   * @param {Object} stats - Estadísticas a actualizar
   */
  updateListCounters(listElement, stats) {
    const totalElement = listElement.querySelector(
      this.config.selectors.taskTotal,
    );
    const todoElement = listElement.querySelector(
      this.config.selectors.taskTodo,
    );
    const doneElement = listElement.querySelector(
      this.config.selectors.taskDone,
    );

    if (totalElement) totalElement.textContent = stats.total;
    if (todoElement) todoElement.textContent = stats.todo;
    if (doneElement) doneElement.textContent = stats.done;

    // Quitar skeleton de la barra de progreso de esta card
    const progressBar = listElement.querySelector(
      this.config.selectors.listProgressBar,
    );
    if (progressBar) progressBar.classList.remove("skeleton-shimmer");

    this.updateListProgress(listElement, stats);
  }

  /**
   * Sincroniza todas las barras de progreso con sus valores actuales
   */
  syncAllProgressBars() {
    const listCards = document.querySelectorAll(
      this.config.selectors.todoLists,
    );
    listCards.forEach((listElement) => {
      const progressElement = listElement.querySelector(
        this.config.selectors.listProgress,
      );
      const totalElement = listElement.querySelector(
        this.config.selectors.taskTotal,
      );
      const doneElement = listElement.querySelector(
        this.config.selectors.taskDone,
      );

      const ariaValue = parseInt(
        progressElement?.getAttribute("aria-valuenow") || "0",
        10,
      );
      const total = parseInt(totalElement?.textContent || "0", 10);
      const done = parseInt(doneElement?.textContent || "0", 10);

      const percent = Number.isFinite(ariaValue)
        ? ariaValue
        : total > 0
          ? Math.round((done / total) * 100)
          : 0;

      this.setProgressValue(listElement, percent);
    });
  }

  /**
   * Actualiza barra/valor de progreso para una lista
   * @param {HTMLElement} listElement - Elemento DOM de la lista
   * @param {{total:number,todo:number,done:number}} stats - Estadísticas actualizadas
   */
  updateListProgress(listElement, stats) {
    const percent =
      stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
    this.setProgressValue(listElement, percent);
  }

  /**
   * Aplica un porcentaje de progreso a los elementos visuales
   * @param {HTMLElement} listElement - Elemento DOM de la lista
   * @param {number} percent - Porcentaje de 0 a 100
   */
  setProgressValue(listElement, percent) {
    const safePercent = Math.max(
      0,
      Math.min(100, Number.isFinite(percent) ? percent : 0),
    );

    const progressElement = listElement.querySelector(
      this.config.selectors.listProgress,
    );
    const progressBar = listElement.querySelector(
      this.config.selectors.listProgressBar,
    );
    const progressText = listElement.querySelector(
      ".list-progress-meta strong",
    );

    if (progressElement) {
      progressElement.setAttribute("aria-valuenow", String(safePercent));
    }

    if (progressBar) {
      // Remove old color classes and apply semantic one
      progressBar.classList.remove(
        "progress-low",
        "progress-medium",
        "progress-high",
      );
      if (safePercent > 0) {
        progressBar.classList.add(
          safePercent < 50
            ? "progress-low"
            : safePercent < 80
              ? "progress-medium"
              : "progress-high",
        );
      }
      progressBar.style.width = `${safePercent}%`;
      progressBar.setAttribute("data-progress", String(safePercent));
    }

    if (progressText) {
      progressText.textContent = `${safePercent}%`;
    }
  }

  /**
   * Obtiene estadísticas directamente del DOM como último recurso
   * @param {HTMLElement} listElement - Elemento DOM de la lista
   * @returns {number} - Número de tareas completadas
   */
  getStatsFromDOM(listElement) {
    const doneElement = listElement.querySelector(
      this.config.selectors.taskDone,
    );
    return doneElement ? parseInt(doneElement.textContent, 10) || 0 : 0;
  }
}

/**
 * Función para notificar cambios en el estado de las tareas
 * Esta función se exporta para ser usada en otras páginas
 */
function notifyTaskStatusChanged() {
  localStorage.setItem(CONFIG.storageKey, Date.now().toString());
}

// Exportar la función para que pueda ser usada en otras páginas
window.notifyTaskStatusChanged = notifyTaskStatusChanged;

// Inicializar el dashboard cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  // Inicializar con carga diferida para mejorar el tiempo de carga inicial
  const dashboardManager = new DashboardManager(CONFIG);
  dashboardManager.init();
});
