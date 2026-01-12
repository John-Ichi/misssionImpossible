let tasks = [];
let idAcc = 0;
let editingTaskId = null;

const addTaskDiv = document.getElementById("addTaskDiv");
const tasksDiv = document.getElementById("tasksDiv");
const scheduleDiv = document.getElementById("scheduleDiv");

function showModal(title, message) {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    modal.classList.add('show');
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('show');
}

function logTasks() {
    console.log('Current tasks:', tasks);
    console.log('Number of tasks:', tasks.length);
    if (tasks.length === 0) {
        console.log('No tasks to display');
    }
}

function addTask() {
    editingTaskId = null;
    const template = document.getElementById('addTaskFormTemplate');
    const clone = template.content.cloneNode(true);
    addTaskDiv.innerHTML = '';
    addTaskDiv.appendChild(clone);
    document.getElementById('submitButtonText').textContent = 'Add Task';
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    editingTaskId = taskId;
    const [durationHours, durationMinutes] = task.duration.split(':').map(Number);

    const template = document.getElementById('addTaskFormTemplate');
    const clone = template.content.cloneNode(true);
    addTaskDiv.innerHTML = '';
    addTaskDiv.appendChild(clone);

    document.getElementById('taskName').value = task.taskName;
    document.getElementById('startTime').value = task.startTime;
    document.getElementById('durationHours').value = durationHours;
    document.getElementById('durationMinutes').value = durationMinutes;
    document.getElementById('priorityValue').value = task.priority;
    document.getElementById('submitButtonText').textContent = 'Update Task';
    
    const submitBtn = addTaskDiv.querySelector('.btn-primary');
    submitBtn.classList.remove('btn-primary');
    submitBtn.classList.add('btn-success');

    addTaskDiv.scrollIntoView({ behavior: 'smooth' });
}

function deleteTask(taskId) {
    showModal('Confirm Delete', 'Are you sure you want to delete this task?');
    
    const modal = document.getElementById('modal');
    const footer = modal.querySelector('.modal-footer');
    footer.innerHTML = `
        <button class="btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn-danger" onclick="confirmDelete(${taskId})">Delete</button>
    `;
}

function confirmDelete(taskId) {
    tasks = tasks.filter(t => t.id !== taskId);
    renderTasks();
    scheduleDiv.innerHTML = '';
    closeModal();
}

function cancelTask() {
    editingTaskId = null;
    addTaskDiv.innerHTML = "";
}

function validateField(input) {
    if (!input.value.trim()) {
        input.classList.add('error');
    } else {
        input.classList.remove('error');
    }
}

function validateDuration() {
    const durationHours = document.getElementById('durationHours');
    const durationMinutes = document.getElementById('durationMinutes');
    
    if (!durationHours || !durationMinutes) return;
    
    if (!durationHours.value && !durationMinutes.value) {
        durationHours.classList.add('error');
        durationMinutes.classList.add('error');
    } else {
        durationHours.classList.remove('error');
        durationMinutes.classList.remove('error');
    }
}

function clearError(input) {
    input.classList.remove('error');
}

function confirmTask() {
    const taskNameInp = document.getElementById("taskName");
    const startTimeInp = document.getElementById("startTime");
    const durationHours = document.getElementById("durationHours");
    const durationMinutes = document.getElementById("durationMinutes");
    const priorityValueInp = document.getElementById("priorityValue");

    taskNameInp.classList.remove('error');
    startTimeInp.classList.remove('error');
    durationHours.classList.remove('error');
    durationMinutes.classList.remove('error');
    priorityValueInp.classList.remove('error');

    let hasError = false;
    let errorMessage = 'Please fill in the following fields:\n';

    if (!taskNameInp.value) {
        taskNameInp.classList.add('error');
        errorMessage += '• Task Name\n';
        hasError = true;
    }

    if (!startTimeInp.value) {
        startTimeInp.classList.add('error');
        errorMessage += '• Start Time\n';
        hasError = true;
    }

    if (!durationHours.value && !durationMinutes.value) {
        durationHours.classList.add('error');
        durationMinutes.classList.add('error');
        errorMessage += '• Duration (hours or minutes)\n';
        hasError = true;
    }

    if (!priorityValueInp.value) {
        priorityValueInp.classList.add('error');
        errorMessage += '• Priority\n';
        hasError = true;
    }

    if (hasError) {
        showModal('Missing Information', errorMessage.trim());
        return false;
    }

    const hours = (durationHours.value < 10) ? `0${durationHours.value || 0}` : (durationHours.value || '00');
    const minutes = (durationMinutes.value < 10) ? `0${durationMinutes.value || 0}` : (durationMinutes.value || '00');

    if (editingTaskId) {
        const task = tasks.find(t => t.id === editingTaskId);
        if (task) {
            task.taskName = taskNameInp.value;
            task.startTime = startTimeInp.value;
            task.duration = `${hours}:${minutes}`;
            task.priority = priorityValueInp.value;
        }
        editingTaskId = null;
    } else {
        idAcc++;
        tasks.push({
            id: idAcc,
            taskName: taskNameInp.value,
            startTime: startTimeInp.value,
            duration: `${hours}:${minutes}`,
            priority: priorityValueInp.value
        });
    }

    addTaskDiv.innerHTML = "";
    renderTasks();
    scheduleDiv.innerHTML = '';
}

renderTasks();

function renderTasks() {
    if (tasks.length === 0) {
        tasksDiv.innerHTML = '<h2>Tasks</h2>';
        const emptyTemplate = document.getElementById('emptyStateTemplate');
        const clone = emptyTemplate.content.cloneNode(true);
        tasksDiv.appendChild(clone);
        return;
    }

    tasksDiv.innerHTML = "<h2>Tasks</h2>";

    tasks.forEach(task => {
        const template = document.getElementById('taskCardTemplate');
        const clone = template.content.cloneNode(true);
        
        clone.querySelector('[data-field="taskName"]').textContent = task.taskName;
        clone.querySelector('[data-field="id"]').textContent = task.id;
        clone.querySelector('[data-field="startTime"]').textContent = task.startTime;
        clone.querySelector('[data-field="duration"]').textContent = task.duration;
        clone.querySelector('[data-field="priority"]').textContent = task.priority;
        
        clone.querySelector('[data-action="edit"]').onclick = () => editTask(task.id);
        clone.querySelector('[data-action="delete"]').onclick = () => deleteTask(task.id);
        
        tasksDiv.appendChild(clone);
    });

    const algoTemplate = document.getElementById('algorithmSectionTemplate');
    const algoClone = algoTemplate.content.cloneNode(true);
    tasksDiv.appendChild(algoClone);
}

function optimizeSchedule() {
    const selectAlgorithmInp = document.getElementById("algorithm");
    const algorithm = selectAlgorithmInp.value;

    if (algorithm && tasks.length !== 0) {
        if (algorithm === "ALL") {
            scheduleDiv.innerHTML = "";
            optimizeFCFS();
            optimizeSJF();
            optimizePriority();
            optimizeSRTF();
        } else {
            switch (algorithm) {
                case "FCFS":
                    optimizeFCFS();
                    break;
                case "SJF":
                    optimizeSJF();
                    break;
                case "Priority":
                    optimizePriority();
                    break;
                case "SRTF":
                    optimizeSRTF();
                    break;
            }
        }
    }
}

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return (hours * 60) + minutes;
}

function durationToMinutes(durationStr) {
    const [hours, minutes] = durationStr.split(":").map(Number);
    return (hours * 60) + minutes;
}

function minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function optimizeFCFS() {
    const isAllMode = scheduleDiv.innerHTML !== "";
    
    if (!isAllMode) {
        scheduleDiv.innerHTML = "";
    }
    
    const headerDiv = document.createElement("div");
    headerDiv.className = "schedule-header";
    headerDiv.innerHTML = `
        <h2>FCFS Schedule</h2>
        ${!isAllMode ? `<div class="export-buttons">
            <button class="btn-secondary" onclick="exportSchedule('txt')">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 10V13C14 13.5 13.5 14 13 14H3C2.5 14 2 13.5 2 13V10M8 10V2M8 10L5 7M8 10L11 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Export as Text
            </button>
        </div>` : ''}
    `;
    scheduleDiv.appendChild(headerDiv);

    let processes = [...tasks];
    let schedule = [];
    let currentTime = 0;
    let totalBurst = 0;
    let idleTime = 0;

    processes.sort((a, b) => {
        const timeA = timeToMinutes(a.startTime);
        const timeB = timeToMinutes(b.startTime);
        if (timeA === timeB) return a.id - b.id;
        else return timeA - timeB;
    });

    processes.forEach(task => {
        const arrival = timeToMinutes(task.startTime);
        const burst = durationToMinutes(task.duration);
        totalBurst += burst;

        if (currentTime < arrival) {
            schedule.push({
                label: "Idle",
                start: currentTime,
                end: arrival
            });
            idleTime += arrival - currentTime;
            currentTime = arrival;
        }

        task.actualStart = currentTime;
        task.finishTime = currentTime + burst;
        task.turnaroundTime = task.finishTime - arrival;
        task.waitingTime = task.actualStart - arrival;

        schedule.push({
            label: task.taskName,
            start: task.actualStart,
            end: task.finishTime
        });

        currentTime = task.finishTime;
    });

    const cpuUtilization = ((totalBurst / currentTime) * 100).toFixed(2);

    window.currentScheduleData = { algorithm: 'FCFS', schedule, processes, cpuUtilization };
    renderSchedule(schedule);
    renderDetails(processes);
    renderMetrics(processes, cpuUtilization);
}

function optimizeSJF() {
    const isAllMode = scheduleDiv.innerHTML !== "";
    
    if (!isAllMode) {
        scheduleDiv.innerHTML = "";
    }
    
    const headerDiv = document.createElement("div");
    headerDiv.className = "schedule-header";
    headerDiv.innerHTML = `
        <h2>SJF Schedule</h2>
        ${!isAllMode ? `<div class="export-buttons">
            <button class="btn-secondary" onclick="exportSchedule('txt')">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 10V13C14 13.5 13.5 14 13 14H3C2.5 14 2 13.5 2 13V10M8 10V2M8 10L5 7M8 10L11 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Export as Text
            </button>
        </div>` : ''}
    `;
    scheduleDiv.appendChild(headerDiv);

    let processes = [...tasks];
    let schedule = [];
    let currentTime = 0;
    let totalBurst = 0;
    let idleTime = 0;

    processes.forEach(p => p.burst = durationToMinutes(p.duration));

    let completed = [];

    while (completed.length < processes.length) {
        const available = processes.filter(p => !completed.includes(p) && timeToMinutes(p.startTime) <= currentTime);

        if (available.length === 0) {
            const nextArrival = Math.min(...processes.filter(p => !completed.includes(p)).map(p => timeToMinutes(p.startTime)));
            schedule.push({
                label: "Idle",
                start: currentTime,
                end: nextArrival
            });
            idleTime += nextArrival - currentTime;
            currentTime = nextArrival;
            continue;
        }

        available.sort((a, b) => {
            const timeA = timeToMinutes(a.startTime);
            const timeB = timeToMinutes(b.startTime);

            if (a.burst !== b.burst) return a.burst - b.burst;
            if (timeA !== timeB) return timeA - timeB;
            return a.id - b.id;
        });

        const task = available[0];
        const arrival = timeToMinutes(task.startTime);
        task.actualStart = currentTime;
        task.finishTime = currentTime + task.burst;
        task.turnaroundTime = task.finishTime - arrival;
        task.waitingTime = task.actualStart - arrival;

        schedule.push({
            label: task.taskName,
            start: task.actualStart,
            end: task.finishTime
        });

        totalBurst += task.burst;
        currentTime = task.finishTime;
        completed.push(task);
    }

    const cpuUtilization = ((totalBurst / currentTime) * 100).toFixed(2);

    window.currentScheduleData = { algorithm: 'SJF', schedule, processes, cpuUtilization };
    renderSchedule(schedule);
    renderDetails(processes);
    renderMetrics(processes, cpuUtilization);
}

function optimizePriority() {
    const isAllMode = scheduleDiv.innerHTML !== "";
    
    if (!isAllMode) {
        scheduleDiv.innerHTML = "";
    }
    
    const headerDiv = document.createElement("div");
    headerDiv.className = "schedule-header";
    headerDiv.innerHTML = `
        <h2>Priority Schedule</h2>
        ${!isAllMode ? `<div class="export-buttons">
            <button class="btn-secondary" onclick="exportSchedule('txt')">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 10V13C14 13.5 13.5 14 13 14H3C2.5 14 2 13.5 2 13V10M8 10V2M8 10L5 7M8 10L11 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Export as Text
            </button>
        </div>` : ''}
    `;
    scheduleDiv.appendChild(headerDiv);

    let processes = [...tasks];
    let schedule = [];
    let currentTime = 0;
    let totalBurst = 0;
    let idleTime = 0;

    processes.forEach(p => p.burst = durationToMinutes(p.duration));

    let completed = [];

    while (completed.length < processes.length) {
        const available = processes.filter(p => !completed.includes(p) && timeToMinutes(p.startTime) <= currentTime);
        
        if (available.length === 0) {
            const nextArrival = Math.min(...processes.filter(p => !completed.includes(p)).map(p => timeToMinutes(p.startTime)));
            schedule.push({
                label: "Idle",
                start: currentTime,
                end: nextArrival
            });
            idleTime += nextArrival - currentTime;
            currentTime = nextArrival;
            continue;
        }

        available.sort((a, b) => {
            const timeA = timeToMinutes(a.startTime);
            const timeB = timeToMinutes(b.startTime);

            if (a.priority !== b.priority) return a.priority - b.priority;
            if (a.burst !== b.burst) return a.burst - b.burst;
            if (timeA !== timeB) return timeA - timeB;
            return a.id - b.id;
        });

        const task = available[0];
        const arrival = timeToMinutes(task.startTime);
        task.actualStart = currentTime;
        task.finishTime = currentTime + task.burst;
        task.turnaroundTime = task.finishTime - arrival;
        task.waitingTime = task.actualStart - arrival;

        schedule.push({
            label: task.taskName,
            start: task.actualStart,
            end: task.finishTime
        });

        totalBurst += task.burst;
        currentTime = task.finishTime;
        completed.push(task);
    }

    const cpuUtilization = ((totalBurst / currentTime) * 100).toFixed(2);

    window.currentScheduleData = { algorithm: 'Priority', schedule, processes, cpuUtilization };
    renderSchedule(schedule);
    renderDetails(processes);
    renderMetrics(processes, cpuUtilization);
}

function optimizeSRTF() {
    const isAllMode = scheduleDiv.innerHTML !== "";
    
    if (!isAllMode) {
        scheduleDiv.innerHTML = "";
    }
    
    const headerDiv = document.createElement("div");
    headerDiv.className = "schedule-header";
    headerDiv.innerHTML = `
        <h2>SRTF Schedule</h2>
        ${!isAllMode ? `<div class="export-buttons">
            <button class="btn-secondary" onclick="exportSchedule('txt')">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M14 10V13C14 13.5 13.5 14 13 14H3C2.5 14 2 13.5 2 13V10M8 10V2M8 10L5 7M8 10L11 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                Export as Text
            </button>
        </div>` : ''}
    `;
    scheduleDiv.appendChild(headerDiv);

    let processes = [...tasks];
    let schedule = [];
    let currentTime = 0;
    let totalBurst = 0;
    let idleTime = 0;

    processes.forEach(p => p.remaining = durationToMinutes(p.duration));

    let completed = [];
    let lastTask = null;

    while (completed.length < processes.length) {
        const available = processes.filter(p => !completed.includes(p) && timeToMinutes(p.startTime) <= currentTime);

        if (available.length === 0) {
            const nextArrival = Math.min(...processes.filter(p => !completed.includes(p)).map(p => timeToMinutes(p.startTime)));
            if (lastTask && schedule.length && schedule[schedule.length-1].label === "Idle") {
                schedule[schedule.length-1].end = nextArrival;
            } else {
                schedule.push({
                    label: "Idle",
                    start: currentTime,
                    end: nextArrival
                });
            }
            idleTime += nextArrival - currentTime;
            currentTime = nextArrival;
            lastTask = null;
            continue;
        }

        available.sort((a, b) => {
            const timeA = timeToMinutes(a.startTime);
            const timeB = timeToMinutes(b.startTime);

            if (a.remaining !== b.remaining) return a.remaining - b.remaining;
            if (timeA !== timeB) return timeA - timeB;
            return a.id - b.id;
        });

        const task = available[0];

        if (!task.actualStart) task.actualStart = currentTime;
        const nextArrivalTimes = processes
            .filter(p => !completed.includes(p) && p !== task && timeToMinutes(p.startTime) > currentTime)
            .map(p => timeToMinutes(p.startTime));
        const nextArrival = nextArrivalTimes.length ? Math.min(...nextArrivalTimes) : Infinity;

        const timeSlice = Math.min(task.remaining, nextArrival - currentTime);

        if (lastTask === task && schedule.length) {
            schedule[schedule.length-1].end += timeSlice;
        } else {
            schedule.push({
                label: task.taskName,
                start: currentTime,
                end: currentTime + timeSlice
            });
        }

        task.remaining -= timeSlice;
        currentTime += timeSlice;
        lastTask = task;

        if (task.remaining === 0) {
            const arrival = timeToMinutes(task.startTime);
            const burstTime = durationToMinutes(task.duration);
            task.finishTime = currentTime;
            task.turnaroundTime = task.finishTime - arrival;
            task.waitingTime = task.turnaroundTime - burstTime;
            totalBurst += burstTime;
            completed.push(task);
            lastTask = null;
        }
    }

    const cpuUtilization = ((totalBurst / currentTime) * 100).toFixed(2);

    window.currentScheduleData = { algorithm: 'SRTF', schedule, processes, cpuUtilization };
    renderSchedule(schedule);
    renderDetails(processes);
    renderMetrics(processes, cpuUtilization);
}

function renderSchedule(schedule) {
    schedule.forEach(block => {
        const div = document.createElement("div");
        div.className = block.label === "Idle" ? "schedule-block idle" : "schedule-block";
        div.innerHTML = `
            <div class="schedule-block-title">${block.label}</div>
            <div class="schedule-block-time">
                ${minutesToTime(block.start)} → ${minutesToTime(block.end)}
                (${block.end - block.start} minutes)
            </div>
        `;
        scheduleDiv.appendChild(div);
    });
}

function renderDetails(processes) {
    const detailsSection = document.createElement("div");
    detailsSection.innerHTML = `
        <h3>Process Details</h3>
        <table>
            <thead>
                <tr>
                    <th>Task</th>
                    <th>Arrival</th>
                    <th>Burst</th>
                    <th>Start</th>
                    <th>Finish</th>
                    <th>TAT (min)</th>
                    <th>WT (min)</th>
                </tr>
            </thead>
            <tbody>
                ${processes.map(p => `
                    <tr>
                        <td>${p.taskName}</td>
                        <td>${p.startTime}</td>
                        <td>${p.duration}</td>
                        <td>${minutesToTime(p.actualStart)}</td>
                        <td>${minutesToTime(p.finishTime)}</td>
                        <td>${p.turnaroundTime}</td>
                        <td>${p.waitingTime}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;
    scheduleDiv.appendChild(detailsSection);
}

function renderMetrics(processes, cpuUtilization) {
    const avgTAT = (processes.reduce((s, p) => s + p.turnaroundTime, 0) / processes.length);
    const avgWT = (processes.reduce((s, p) => s + p.waitingTime, 0) / processes.length);

    const metricsSection = document.createElement("div");
    metricsSection.innerHTML = `
        <h3>Performance Metrics</h3>
        <div class="metrics">
            <div class="metric-card">
                <div class="metric-label">Average Turnaround Time</div>
                <div class="metric-value">${avgTAT.toFixed(2)} min</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Average Waiting Time</div>
                <div class="metric-value">${avgWT.toFixed(2)} min</div>
            </div>
            <div class="metric-card">
                <div class="metric-label">Task Engagement</div>
                <div class="metric-value">${cpuUtilization}%</div>
            </div>
        </div>
    `;
    scheduleDiv.appendChild(metricsSection);
}

function exportSchedule(format) {
    if (!window.currentScheduleData) {
        showModal('No Schedule', 'Please generate a schedule first before exporting.');
        return;
    }

    const { algorithm, schedule, processes, cpuUtilization } = window.currentScheduleData;
    
    if (format === 'txt') {
        let text = '='.repeat(60) + '\n';
        text += `SCHEDULE MANAGER - ${algorithm} ALGORITHM\n`;
        text += 'Generated: ' + new Date().toLocaleString() + '\n';
        text += '='.repeat(60) + '\n\n';

        text += 'SCHEDULE TIMELINE\n';
        text += '-'.repeat(60) + '\n';
        schedule.forEach(block => {
            const duration = block.end - block.start;
            text += `${block.label.padEnd(20)} | ${minutesToTime(block.start)} → ${minutesToTime(block.end)} (${duration} min)\n`;
        });

        text += '\n' + '='.repeat(60) + '\n';
        text += 'PROCESS DETAILS\n';
        text += '-'.repeat(60) + '\n';
        text += 'Task'.padEnd(20) + 'Arrival'.padEnd(12) + 'Burst'.padEnd(12) + 'Start'.padEnd(12) + 'Finish'.padEnd(12) + 'TAT'.padEnd(10) + 'WT\n';
        text += '-'.repeat(60) + '\n';

        processes.forEach(p => {
            text += p.taskName.padEnd(20);
            text += p.startTime.padEnd(12);
            text += p.duration.padEnd(12);
            text += minutesToTime(p.actualStart).padEnd(12);
            text += minutesToTime(p.finishTime).padEnd(12);
            text += (p.turnaroundTime + ' min').padEnd(10);
            text += (p.waitingTime + ' min');
            text += '\n';
        });

        const avgTAT = (processes.reduce((s, p) => s + p.turnaroundTime, 0) / processes.length).toFixed(2);
        const avgWT = (processes.reduce((s, p) => s + p.waitingTime, 0) / processes.length).toFixed(2);

        text += '\n' + '='.repeat(60) + '\n';
        text += 'PERFORMANCE METRICS\n';
        text += '-'.repeat(60) + '\n';
        text += `Average Turnaround Time: ${avgTAT} minutes\n`;
        text += `Average Waiting Time: ${avgWT} minutes\n`;
        text += `Task Engagement: ${cpuUtilization}%\n`;
        text += '='.repeat(60) + '\n';

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schedule_${algorithm}_${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
}