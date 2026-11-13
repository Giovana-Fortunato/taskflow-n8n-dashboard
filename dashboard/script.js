
// ==========================================
// TASKFLOW - DASHBOARD
// Versão inicial: armazenamento local
// ==========================================

//const STORAGE_KEY = "taskflow_tasks";

const API_URL = "http://localhost:5678/webhook/taskflow/tarefas";
const API_UPDATE_URL = "http://localhost:5678/webhook/taskflow/tarefas";


// ==========================================
// ELEMENTOS DA INTERFACE
// ==========================================

const tasksList = document.getElementById("tasks-list");
const taskModal = document.getElementById("task-modal");
const taskForm = document.getElementById("task-form");

const searchInput = document.getElementById("search-input");
const disciplineFilter = document.getElementById("filter-discipline");
const priorityFilter = document.getElementById("filter-priority");
const statusFilter = document.getElementById("filter-status");

// ==========================================
// ARMAZENAMENTO E INTEGRAÇÃO COM N8N
// ==========================================

let tasks = [];

//function saveTasks() {
//  cadastro, edição e exclusã serão enviados diretamente ao n8n.
// localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
//}

async function loadTasksFromAPI() {
    try {
        const response = await fetch(API_URL);

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("O n8n não retornou uma lista de tarefas.");
        }

        tasks = data.map(row => ({
            id: String(row.ID ?? "").trim(),
            rowNumber: row.row_number ?? null,
            tarefa: String(row.Tarefa ?? ""),
            disciplina: String(row.Disciplina ?? ""),
            descricao: String(row["Descrição"] ?? ""),
            data: String(row["Data de Entrega"] ?? ""),
            prioridade: String(row.Prioridade ?? "Média"),
            status: String(row.Status ?? "Pendente")
        }));

        refreshDashboard();

        console.log("Tarefas carregadas do n8n:", tasks);

    } catch (error) {
        console.error("Erro ao carregar tarefas do n8n:", error);

        tasks = [];
        refreshDashboard();

        alert(
            "Não foi possível carregar as tarefas do servidor. " +
            "Verifique se o n8n está funcionando."
        );
    }
}

// ==========================================
// UTILITÁRIOS
// ==========================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function formatDate(date) {
    if (!date) return "Sem data";

    const [year, month, day] = date.split("-");

    if (!year || !month || !day) return date;

    return `${day}/${month}/${year}`;
}

// ==========================================
// VERIFICAÇÃO DE PRAZO
// ==========================================

function getTodayDate() {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function isTaskOverdue(task) {
    return task.status !== "Concluída" &&
        task.data &&
        task.data < getTodayDate();
}

function generateId() {
    return "TF-" + Date.now().toString(36).toUpperCase();
}

// ==========================================
// INDICADORES
// ==========================================

function updateStatistics() {
    const total = tasks.length;
    const pending = tasks.filter(t => t.status === "Pendente").length;
    const progress = tasks.filter(t => t.status === "Em andamento").length;
    const completed = tasks.filter(t => t.status === "Concluída").length;
    const overdue = tasks.filter(t => isTaskOverdue(t)).length;

    const percentage = total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    document.getElementById("total-tasks").textContent = total;
    document.getElementById("pending-tasks").textContent = pending;
    document.getElementById("progress-tasks").textContent = progress;
    document.getElementById("completed-tasks").textContent = completed;
    document.getElementById("overdue-tasks").textContent = overdue;

    document.getElementById("progress-percentage").textContent =
        `${percentage}%`;

    document.getElementById("progress-fill").style.width =
        `${percentage}%`;

    document.getElementById("progress-caption").textContent =
        total === 0
            ? "Cadastre sua primeira tarefa para acompanhar o progresso."
            : `${completed} de ${total} tarefas concluídas.`;

    document.getElementById("task-count").textContent =
        `${total} ${total === 1 ? "tarefa" : "tarefas"}`;
}

// ==========================================
// FILTRO DE DISCIPLINAS
// ==========================================

function updateDisciplineFilter() {
    const selected = disciplineFilter.value;

    const disciplines = [...new Set(
        tasks.map(task => task.disciplina).filter(Boolean)
    )].sort((a, b) => a.localeCompare(b, "pt-BR"));

    disciplineFilter.innerHTML =
        '<option value="">Todas as disciplinas</option>';

    disciplines.forEach(discipline => {
        const option = document.createElement("option");
        option.value = discipline;
        option.textContent = discipline;
        disciplineFilter.appendChild(option);
    });

    if (disciplines.includes(selected)) {
        disciplineFilter.value = selected;
    }
}

const EMPTY_ILLUSTRATION = `
<svg class="empty-illustration" viewBox="0 0 260 200" role="img" aria-label="Gatinho dormindo sobre uma pilha de livros">
    <circle cx="130" cy="104" r="84" fill="#EFE8F8"/>
    <circle cx="214" cy="52" r="6" fill="#DCC9F0"/>
    <circle cx="44" cy="70" r="4" fill="#CFE0CB"/>
    <path d="M58 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#C9A8E0"/>
    <path d="M206 128 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#9DB9D3"/>

    <ellipse cx="130" cy="180" rx="92" ry="6" fill="#302A3B" opacity=".07"/>

    <!-- livros -->
    <rect x="50" y="148" width="160" height="28" rx="5" fill="#A9C9A8"/>
    <rect x="58" y="154" width="148" height="16" rx="2" fill="#FFFFFF"/>
    <path d="M64 159 H200 M64 165 H200" stroke="#E4DEEE" stroke-width="1.5"/>

    <rect x="64" y="124" width="134" height="24" rx="5" fill="#A9C2D9"/>
    <rect x="70" y="129" width="122" height="14" rx="2" fill="#FFFFFF"/>
    <path d="M76 134 H186 M76 139 H186" stroke="#E4DEEE" stroke-width="1.5"/>
    <rect x="160" y="124" width="8" height="24" fill="#C9A8E0"/>

    <rect x="56" y="104" width="146" height="20" rx="5" fill="#EFB9AE"/>
    <rect x="62" y="109" width="134" height="10" rx="2" fill="#FFFFFF"/>

    <!-- gato -->
    <g class="cat">
        <path d="M184 98 C204 104 200 124 172 120 C150 117 130 114 116 112"
              fill="none" stroke="#F2C49B" stroke-width="13" stroke-linecap="round"/>
        <path d="M184 98 C196 102 198 110 192 116" fill="none" stroke="#E5A577"
              stroke-width="13" stroke-linecap="round" opacity=".55"/>

        <ellipse cx="140" cy="86" rx="50" ry="22" fill="#F2C49B"/>
        <path d="M128 66 q6 10 0 20 M146 65 q6 10 0 20 M164 68 q5 9 0 18"
              fill="none" stroke="#E5A577" stroke-width="5" stroke-linecap="round"/>

        <path d="M78 70 L82 50 L95 63 Z" fill="#F2C49B" stroke="#F2C49B" stroke-width="5" stroke-linejoin="round"/>
        <path d="M100 62 L112 50 L114 70 Z" fill="#F2C49B" stroke="#F2C49B" stroke-width="5" stroke-linejoin="round"/>
        <path d="M82 66 L84 56 L90 63 Z" fill="#EFA9A0"/>
        <path d="M104 62 L110 56 L110 66 Z" fill="#EFA9A0"/>

        <circle cx="96" cy="84" r="22" fill="#F2C49B"/>
        <path d="M86 70 q3 4 0 8 M96 66 q3 5 0 9" fill="none" stroke="#E5A577" stroke-width="3" stroke-linecap="round"/>

        <path d="M84 86 q4 4 8 0 M100 86 q4 4 8 0" fill="none" stroke="#3B342C"
              stroke-width="2.2" stroke-linecap="round"/>
        <path d="M94 93 l2 2.5 2 -2.5 z" fill="#D9887E"/>
        <path d="M96 95.5 q-3 4 -6 2 M96 95.5 q3 4 6 2" fill="none" stroke="#3B342C"
              stroke-width="1.6" stroke-linecap="round"/>
        <circle cx="82" cy="94" r="3.5" fill="#EFA9A0" opacity=".7"/>
        <circle cx="111" cy="94" r="3.5" fill="#EFA9A0" opacity=".7"/>

        <ellipse cx="112" cy="104" rx="11" ry="5.5" fill="#F7D6B8"/>
        <ellipse cx="128" cy="105" rx="9" ry="5" fill="#F7D6B8"/>
    </g>

    <!-- zzz -->
    <g class="zzz" font-family="Fraunces, Georgia, serif" font-style="italic" fill="#91899D">
        <text x="118" y="54" font-size="13">z</text>
        <text x="132" y="40" font-size="17">z</text>
        <text x="150" y="24" font-size="21">z</text>
    </g>
</svg>`;


// ==========================================
// EXIBIÇÃO DAS TAREFAS
// ==========================================

function renderTasks() {
    const search = searchInput.value.toLowerCase().trim();
    const discipline = disciplineFilter.value;
    const priority = priorityFilter.value;
    const status = statusFilter.value;

    const filteredTasks = tasks.filter(task => {
        const matchesSearch =
            task.tarefa.toLowerCase().includes(search) ||
            task.disciplina.toLowerCase().includes(search);

        const matchesDiscipline =
            !discipline || task.disciplina === discipline;

        const matchesPriority =
            !priority || task.prioridade === priority;

        const matchesStatus = !status ||
            (status === "Atrasada"
                ? isTaskOverdue(task)
                : task.status === status);

        return matchesSearch &&
            matchesDiscipline &&
            matchesPriority &&
            matchesStatus;
    });

    if (filteredTasks.length === 0) {
        tasksList.innerHTML = `
            <div class="empty-state" style="padding: 40px 15px; text-align: center;">
                ${EMPTY_ILLUSTRATION}
                <h3 style="font-family: 'Plus Jakarta Sans', serif; font-size: 26px; color: #2A2532; margin-bottom: 8px; font-weight: 500;">
                    Tudo limpo por aqui!
                </h3>
                <p style="color: #91899D; font-size: 15px;">
                    Que tal adicionar uma nova tarefa?
                </p>
            </div>
        `;
        return;
    }
    tasksList.innerHTML = filteredTasks.map(task => {
        const priorityClass = {
            "Alta": "priority-high",
            "Média": "priority-medium",
            "Baixa": "priority-low"
        }[task.prioridade] || "priority-medium";

        const displayStatus = isTaskOverdue(task)
            ? "Atrasada"
            : task.status;

        const statusClass = {
            "Pendente": "status-pending",
            "Em andamento": "status-progress",
            "Concluída": "status-completed",
            "Atrasada": "status-overdue"
        }[displayStatus] || "status-pending";

        return `
            <article class="task-card">
                <div class="task-main">
                    <h4>${escapeHTML(task.tarefa)}</h4>

                    ${task.descricao ? `
                        <p class="task-description">
                            ${escapeHTML(task.descricao)}
                        </p>
                    ` : ""}

                    <div class="task-meta">
                        <span>
                            <i data-lucide="book-open"></i>
                            ${escapeHTML(task.disciplina)}
                        </span>

                        <span>
                            <i data-lucide="calendar"></i>
                            ${formatDate(task.data)}
                        </span>

                        <span class="badge ${priorityClass}">
                            ${escapeHTML(task.prioridade)}
                        </span>
                    </div>
                </div>

               <div class="task-actions">
    <span class="badge ${statusClass}">
        ${escapeHTML(displayStatus)}
    </span>

    ${task.id ? `
        <button class="action-button"
                data-action="edit"
                data-id="${escapeHTML(task.id)}"
                title="Editar tarefa">
            <i data-lucide="pencil"></i>
        </button>

        <button class="action-button delete"
                data-action="delete"
                data-id="${escapeHTML(task.id)}"
                title="Excluir tarefa">
            <i data-lucide="trash-2"></i>
        </button>
    ` : `
        <span title="Esta tarefa ainda não possui ID">
            <i data-lucide="lock"></i>
        </span>
    `}
</div>
            </article>
        `;
    }).join("");

    lucide.createIcons();
}

// ==========================================
// ATUALIZAÇÃO GERAL
// ==========================================

function refreshDashboard() {
    updateStatistics();
    updateDisciplineFilter();
    renderTasks();
}

// ==========================================
// MODAL
// ==========================================

function openModal(task = null) {
    taskForm.reset();

    if (task) {
        document.getElementById("modal-title").textContent =
            "Editar tarefa";

        document.getElementById("task-id").value = task.id;
        document.getElementById("task-name").value = task.tarefa;
        document.getElementById("task-discipline").value = task.disciplina;
        document.getElementById("task-description").value = task.descricao;
        document.getElementById("task-date").value = task.data;
        document.getElementById("task-priority").value = task.prioridade;
        document.getElementById("task-status").value = task.status;
    } else {
        document.getElementById("modal-title").textContent =
            "Nova tarefa";

        document.getElementById("task-id").value = "";
        document.getElementById("task-priority").value = "Média";
        document.getElementById("task-status").value = "Pendente";
    }

    taskModal.classList.add("show");
    lucide.createIcons();
}

function closeModal() {
    taskModal.classList.remove("show");
}


// ==========================================
// CADASTRAR E EDITAR
// ==========================================

let isSubmittingTask = false;


taskForm.addEventListener("submit", async event => {
    event.preventDefault();

    // Impede envios duplicados
    if (isSubmittingTask) return;

    const id = document.getElementById("task-id").value;

    const taskData = {
        id: id || generateId(),
        tarefa: document.getElementById("task-name").value.trim(),
        disciplina: document.getElementById("task-discipline").value.trim(),
        descricao: document.getElementById("task-description").value.trim(),
        data: document.getElementById("task-date").value,
        prioridade: document.getElementById("task-priority").value,
        status: document.getElementById("task-status").value
    };

    // Validação dos campos
    if (!taskData.tarefa || !taskData.disciplina || !taskData.data) {
        alert("Preencha os campos obrigatórios.");
        return;
    }

    const submitButton = taskForm.querySelector(
        'button[type="submit"], input[type="submit"]'
    );

    if (!submitButton) {
        console.error("Botão de envio não encontrado.");
        return;
    }

    const originalButtonHTML = submitButton.innerHTML;
    const originalButtonText = submitButton.value;

    // Bloqueia novos envios
    isSubmittingTask = true;
    submitButton.disabled = true;

    if (id) {
        submitButton.textContent = "Atualizando...";
    } else {
        submitButton.textContent = "Salvando...";
    }

    try {
        const response = await fetch(API_URL, {
            method: id ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(taskData)
        });

        if (!response.ok) {
            throw new Error("Não foi possível salvar a tarefa.");
        }

        const result = await response.json();

        if (!result.sucesso) {
            throw new Error(result.mensagem || "Erro na operação.");
        }

        await loadTasksFromAPI();

        closeModal();

        if (id) {
            showToast(
                "Tarefa atualizada!",
                "As alterações foram salvas com sucesso."
            );
        } else {
            showToast(
                "Tarefa cadastrada!",
                "Sua tarefa foi salva com sucesso."
            );
        }

    } catch (error) {
        console.error("Erro ao salvar tarefa:", error);

        showToast(
            "Ops! Algo deu errado.",
            "Não foi possível salvar. Tente novamente."
        );

    } finally {
        // Libera o botão novamente
        isSubmittingTask = false;
        submitButton.disabled = false;

        if (submitButton.tagName === "INPUT") {
            submitButton.value = originalButtonText;
        } else {
            submitButton.innerHTML = originalButtonHTML;
        }

        lucide.createIcons();
    }
});

// ==========================================
// EDITAR E EXCLUIR
// ==========================================


tasksList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = button.dataset.id;
    const action = button.dataset.action;

    const task = tasks.find(item => item.id === id);

    if (!task) return;

    if (action === "edit") {
        openModal(task);
    }

    if (action === "delete") {
        openDeleteModal(task);
    }
});


// ==========================================
// EVENTOS DOS FILTROS
// ==========================================

searchInput.addEventListener("input", renderTasks);
disciplineFilter.addEventListener("change", renderTasks);
priorityFilter.addEventListener("change", renderTasks);
statusFilter.addEventListener("change", renderTasks);


// ==========================================
// NAVEGAÇÃO DO MENU LATERAL
// ==========================================

const dashboardPage = document.getElementById("dashboard-page");
const profilePage = document.getElementById("profile-page");
const profileButton = document.getElementById("profileButton");

function updateActiveMenu(activeItem) {
    document.querySelectorAll(".nav-item, #profileButton").forEach(item => {
        item.classList.remove("active");
    });

    if (activeItem) {
        activeItem.classList.add("active");
    }
}

function showDashboard(activeItem, filterStatus = "") {
    dashboardPage.style.display = "block";
    profilePage.style.display = "none";

    statusFilter.value = filterStatus;

    updateActiveMenu(activeItem);
    renderTasks();

    if (activeItem && activeItem.id === "dashboardButton") {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    } else if (activeItem) {
        document.getElementById("tasks-section").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    lucide.createIcons();
}

function showProfile() {
    dashboardPage.style.display = "none";
    profilePage.style.display = "block";

    updateActiveMenu(profileButton);

    lucide.createIcons();
}

document.querySelectorAll(".nav-item, #profileButton").forEach(item => {
    item.addEventListener("click", event => {
        event.preventDefault();

        if (item.id === "profileButton") {
            showProfile();
            return;
        }

        if (item.dataset.filterStatus) {
            showDashboard(item, item.dataset.filterStatus);
            return;
        }

        showDashboard(item);
    });
});

// ==========================================
// BOTÕES DO MODAL
// ==========================================

document.getElementById("add-task-btn")
    .addEventListener("click", () => openModal());

document.getElementById("close-modal")
    .addEventListener("click", closeModal);

document.getElementById("cancel-modal")
    .addEventListener("click", closeModal);

taskModal.addEventListener("click", event => {
    if (event.target === taskModal) {
        closeModal();
    }
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeModal();
    }
});

document.getElementById("add-task-sidebar-btn")
    .addEventListener("click", () => openModal());


const deleteModal = document.getElementById("deleteModal");
const deleteTaskName = document.getElementById("deleteTaskName");
const cancelDelete = document.getElementById("cancelDelete");
const confirmDelete = document.getElementById("confirmDelete");

let taskToDelete = null;

function openDeleteModal(task) {
    taskToDelete = task;

    deleteTaskName.textContent = `"${task.tarefa}"`;
    deleteModal.classList.add("active");

    if (typeof lucide !== "undefined") {
        lucide.createIcons();
    }
}

function closeDeleteModal() {
    deleteModal.classList.remove("active");
    taskToDelete = null;
}

cancelDelete.addEventListener("click", closeDeleteModal);

let isDeletingTask = false;


confirmDelete.addEventListener("click", async () => {
    if (!taskToDelete || isDeletingTask) return;

    const id = taskToDelete.id;

    const originalButtonHTML = confirmDelete.innerHTML;

    // Bloqueia novos cliques
    isDeletingTask = true;
    confirmDelete.disabled = true;
    confirmDelete.textContent = "Excluindo...";

    try {
        const response = await fetch(
            `${API_URL}?id=${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Não foi possível excluir a tarefa.");
        }

        const result = await response.json();

        if (!result.sucesso) {
            throw new Error(result.mensagem || "Erro ao excluir.");
        }

        await loadTasksFromAPI();

        closeDeleteModal();

        showToast(
            "Tarefa excluída!",
            "A tarefa foi removida com sucesso."
        );

    } catch (error) {
        console.error("Erro na exclusão:", error);

        showToast(
            "Ops! Algo deu errado.",
            "Não foi possível excluir a tarefa."
        );

    } finally {
        isDeletingTask = false;
        confirmDelete.disabled = false;
        confirmDelete.innerHTML = originalButtonHTML;

        lucide.createIcons();
    }
});



deleteModal.addEventListener("click", event => {
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
});


let toastTimeout;

function showToast(title, message) {
    const toast = document.getElementById("toast");

    document.getElementById("toast-title").textContent = title;
    document.getElementById("toast-message").textContent = message;

    clearTimeout(toastTimeout);

    toast.classList.add("show");
    lucide.createIcons();

    toastTimeout = setTimeout(() => {
        hideToast();
    }, 3500);
}

function hideToast() {
    document.getElementById("toast").classList.remove("show");
}



// ==========================================
// INICIALIZAÇÃO
// ==========================================

loadTasksFromAPI();
lucide.createIcons();