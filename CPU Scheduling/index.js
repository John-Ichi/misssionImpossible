const numOfProcessInp = document.getElementById("numOfProcess");
const confirmNumProcBtn = document.getElementById("confirmProcessNum");
confirmNumProcBtn.addEventListener("click", () => {
    const numOfProcess = numOfProcessInp.value;

    if (numOfProcess) addRows(numOfProcess);
    else showNotification("Please input the number of processes", "error");
});

function addRows(numberOfProcesses) {
    inputTable.innerHTML = `
        <tr>
            <th>Process ID</th>
            <th>Arrival Time</th>
            <th>Burst Time</th>
            <th>Priority Value</th>
        </tr>
    `;

    for (let i = 0; i < numberOfProcesses; i++) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>P${(i+1)}</td>
            <td><input type="number" placeholder="0" class="processArrivalTime"></td>
            <td><input type="number" placeholder="0" class="processBurstTime"></td>
            <td><input type="number" placeholder="0" class="processPriorityValue"></td>
        `;
        inputTable.appendChild(tr);
    }
}

const inputTable = document.getElementById("inputTable");

const algorithmInp = document.getElementById("algorithm");
const confirmAlgorithmBtn = document.getElementById("confirmAlgo");
confirmAlgorithmBtn.addEventListener("click", () => {
    const algorithm = algorithmInp.value;

    if (algorithm) {
        switch (algorithm) {
            case "FCFS":
                if (checkArrivalTime() && checkBurstTime()) solveFCFS();
                else showNotification("Missing Arrival Time and Burst Time inputs", "error");
                break;
            case "SJF":
                if (checkArrivalTime() && checkBurstTime()) solveSJF();
                else showNotification("Missing Arrival Time and Burst Time inputs", "error");
                break;
            case "Priority":
                if (checkArrivalTime() && checkBurstTime() && checkPriorityValues()) solvePriorityValue();
                else showNotification("Missing Arrival Time, Burst Time, and Priority Value inputs", "error");
                break;
            case "SRTF":
                if (checkArrivalTime() && checkBurstTime()) solveSRTF();
                else showNotification("Missing Arrival Time and Burst Time inputs", "error");
                break;
        }
    } else {
        showNotification("Please select an algorithm", "error");
    }
});

const resultsDiv = document.getElementById("resultsDiv");
const ganttChartDiv = document.getElementById("ganttChartDiv");

function checkArrivalTime() {
    const arrivalTimeValues = document.querySelectorAll(".processArrivalTime");
    let arrivalTimeData = true;
    arrivalTimeValues.forEach(entry => { if (!entry.value) arrivalTimeData = false; });

    if (arrivalTimeValues.length !== 0 && arrivalTimeData) return true;
    else return false;
}

function checkBurstTime() {
    const burstTimeValues = document.querySelectorAll(".processBurstTime");
    let burstTimeData = true;
    burstTimeValues.forEach(entry => { if (!entry.value) burstTimeData = false; });

    if (burstTimeValues.length !== 0 && burstTimeData) return true;
    else return false;
}

function checkPriorityValues() {
    const priorityValues = document.querySelectorAll(".processPriorityValue");
    let priorityData = true;

    priorityValues.forEach(entry => { if (!entry.value) priorityData = false; });

    if (priorityValues.length !== 0 && priorityData) return true;
    else return false;
}

function getProcessData() {
    const arrivals = document.querySelectorAll(".processArrivalTime");
    const bursts = document.querySelectorAll(".processBurstTime");
    const priorities = document.querySelectorAll(".processPriorityValue");

    return Array.from(arrivals).map((input, i) => ({
        id: `P${(i+1)}`,
        at: parseInt(input.value),
        bt: parseInt(bursts[i].value),
        priority: parseInt(priorities[i].value),
        remainingTime: parseInt(bursts[i].value),
        isCompleted: false
    }));
}

function finalizeCalculation(processes, idleTimes, totalTime) {
    const totalWT = processes.reduce((sum, p) => sum + p.wt, 0);
    const totalTAT = processes.reduce((sum, p) => sum + p.tat, 0);
    const totalBT = processes.reduce((sum, p) => sum + p.bt, 0);

    const avgWT = (totalWT / processes.length).toFixed(2);
    const avgTAT = (totalTAT / processes.length).toFixed(2);
    const cpuUtil = ((totalBT / totalTime) * 100).toFixed(2);

    renderResultsTable(processes, avgWT, avgTAT, cpuUtil);
    renderGanttChart(processes, idleTimes);
}

function finalizeSRTF(processes, ganttData, idleTimes, totalTime) {
    const totalWT = processes.reduce((sum, p) => sum + p.wt, 0);
    const totalTAT = processes.reduce((sum, p) => sum + p.tat, 0);
    const totalBT = processes.reduce((sum, p) => sum + p.bt, 0);

    const avgWT = (totalWT / processes.length).toFixed(2);
    const avgTAT = (totalTAT / processes.length).toFixed(2);
    const cpuUtil = ((totalBT / totalTime) * 100).toFixed(2);

    renderResultsTable(processes, avgWT, avgTAT, cpuUtil);
    renderGanttChart(ganttData, idleTimes);
}

function solveFCFS() {
    let processes = getProcessData();
    let idleTimes = [];

    processes.sort((a, b) => {
        if (a.at === b.at) {
            return a.id.localeCompare(b.id);
        }
        return a.at - b.at;
    });

    let currentTime = 0;
    processes.forEach(p => {
        if (currentTime < p.at) {
            idleTimes.push({
                start: currentTime,
                end: p.at,
                duration: p.at - currentTime
            });
            currentTime = p.at
        }

        p.startTime = currentTime;
        p.finishTime = currentTime + p.bt;
        p.tat = p.finishTime - p.at;
        p.wt = p.tat - p.bt;
        currentTime = p.finishTime;
    });

    finalizeCalculation(processes, idleTimes, currentTime);
}

function solveSJF() {
    let processes = getProcessData();
    let idleTimes = [];
    let currentTime = 0;
    let completedCount = 0;

    while (completedCount < processes.length) {
        let readyQueue = processes.filter(p => p.at <= currentTime && !p.isCompleted);
        readyQueue.sort((a, b) => {
            if (a.bt !== b.bt) return a.bt - b.bt;
            if (a.at !== b.at) return a.at - b.at;
            return parseInt(a.id.replace("P","")) - parseInt(b.id.replace("P",""));
        });

        if (readyQueue.length > 0) {
            readyQueue.sort((a, b) => a.bt - b.bt);
            let p = readyQueue[0];
            p.startTime = currentTime;
            p.finishTime = p.startTime + p.bt;
            p.tat = p.finishTime - p.at;
            p.wt = p.tat - p.bt;
            p.isCompleted = true;
            completedCount++;
            currentTime = p.finishTime;
        } else {
            let uncompleted = processes.filter(p => !p.isCompleted);
            let nextArrival = Math.min(...uncompleted.map(p => p.at));

            idleTimes.push({
                start: currentTime,
                end: nextArrival,
                duration: nextArrival - currentTime
            });

            currentTime = nextArrival;
        }
    }

    finalizeCalculation(processes, idleTimes, currentTime);
}

function solvePriorityValue() {
    let processes = getProcessData();
    let idleTimes = [];
    let currentTime = 0;
    let completedCount = 0;

    while (completedCount < processes.length) {
        let readyQueue = processes.filter(p => p.at <= currentTime && !p.isCompleted);

        if (readyQueue.length > 0) {
            readyQueue.sort((a, b) => {
                if (a.priority !== b.priority) return a.priority - b.priority;
                if (a.at !== b.at) return a.at - b.at;
                return parseInt(a.id.replace("P","")) - parseInt(b.id.replace("P",""));
            });

            let p = readyQueue[0];
            p.startTime = currentTime;
            p.finishTime = p.startTime + p.bt;
            p.tat = p.finishTime - p.at;
            p.wt = p.tat - p.bt;
            p.isCompleted = true;
            completedCount++;
            currentTime = p.finishTime;
        } else {
            let uncompleted = processes.filter(p => !p.isCompleted);
            let nextArrival = Math.min(...uncompleted.map(p => p.at));

            idleTimes.push({
                start: currentTime,
                end: nextArrival,
                duration: nextArrival - currentTime
            });

            currentTime = nextArrival;
        }
    }

    finalizeCalculation(processes, idleTimes, currentTime);
}

function solveSRTF() {
    let processes = getProcessData();
    let idleTimes = [];
    let ganttData = [];
    let currentTime = 0;
    let completedCount = 0;

    while (completedCount < processes.length) {
        let readyQueue = processes.filter(p => p.at <= currentTime && !p.isCompleted);

        if (readyQueue.length > 0) {
            readyQueue.sort((a, b) => {
                if (a.remainingTime !== b.remainingTime) return a.remainingTime - b.remainingTime;
                if (a.at !== b.at) return a.at - b.at;
                return (parseInt(a.id.replace("P","")) - parseInt(b.id.replace("P","")));
            });

            let p = readyQueue[0];

            if (ganttData.length > 0 && ganttData[ganttData.length - 1].id === p.id) {
                ganttData[ganttData.length - 1].end++;
            } else {
                ganttData.push({
                    id: p.id,
                    start: currentTime,
                    end: currentTime + 1,
                    type: 'process'
                });
            }

            p.remainingTime--;
            currentTime++;

            if (p.remainingTime === 0) {
                p.isCompleted = true;
                p.finishTime = currentTime;
                p.tat = p.finishTime - p.at;
                p.wt = p.tat - p.bt;
                completedCount++;
            }
        } else {
            let uncompleted = processes.filter(p => !p.isCompleted);
            let nextArrival = Math.min(...uncompleted.map(p => p.at));

            idleTimes.push({
                start: currentTime,
                end: nextArrival,
                duration: nextArrival - currentTime
            });

            currentTime = nextArrival;
        }
    }
    finalizeSRTF(processes, ganttData, idleTimes, currentTime);
}

function renderResultsTable(processes, avgWT, avgTAT, cpuUtil) {
    resultsDiv.innerHTML = "";
    resultsDiv.innerHTML = `<table border="0" cellpadding="5" id="resultsTable"></table>`;

    const resultsTable = document.getElementById("resultsTable");

    resultsTable.innerHTML = "";
    resultsTable.innerHTML += `
        <tr>
            <th>Process</th>
            <th>Arrival Time</th>
            <th>Burst Time</th>
            <th>Ending Time</th>
            <th>Turnaround Time</th>
            <th>Waiting Time</th>
        </tr>
    `;

    processes.forEach(p => {
        resultsTable.innerHTML += `
            <tr>
                <td>${p.id}</td>
                <td>${p.at}</td>
                <td>${p.bt}</td>
                <td>${p.finishTime}</td>
                <td>${p.tat}</td>
                <td>${p.wt}</td>
            </tr>
        `;
    });

    const resultDetails = document.createElement("p");
    resultDetails.innerHTML = `
        Average Waiting Time: ${avgWT}<br>
        Average Turnaround Time: ${avgTAT}<br>
        CPU Utilization: ${cpuUtil}
    `;

    resultsDiv.appendChild(resultDetails);
}

function renderGanttChart(segments, idleTimes) {
    ganttChartDiv.innerHTML = "<h3>Gantt Chart</h3>";
    const chartWrapper = document.createElement("div");
    chartWrapper.id = "ganttChartWrapper";
    chartWrapper.style.display = "flex";
    chartWrapper.style.paddingBottom = "25px";

    let timeline = [];

    segments.forEach(s => {
        let startTime = s.startTime !== undefined ? s.startTime : s.start;
        let endTime = s.finishTime !== undefined ? s.finishTime : s.end;

        if (startTime === undefined) startTime = endTime - s.bt;

        timeline.push({
            id: s.id,
            start: startTime,
            end: endTime,
            type: 'process'
        });
    });

    idleTimes.forEach(i => {
        timeline.push({...i, id: 'Idle', type: 'idle'});
    });

    timeline.sort((a, b) => a.start - b.start);

    timeline.forEach((block, index) => {
        const duration = block.end - block.start;
        if (duration <= 0) return;

        const div = document.createElement("div");
        div.className = `gantt-block ${block.type === 'process' ? 'process-block' : 'idle-block'}`;
        div.style.width = `${duration * 40}px`;
        div.style.flexShrink = "0";

        div.innerHTML = `
            <span>${block.id}</span>
            <span class="time-label">${block.start}</span>
        `;

        if (index === timeline.length - 1) {
            const lastTime = document.createElement("span");
            lastTime.className = "time-label end-time";
            lastTime.style.right = "0";
            lastTime.style.left = "auto";
            lastTime.innerText = block.end;
            div.appendChild(lastTime);
        }

        chartWrapper.appendChild(div);
    });

    ganttChartDiv.appendChild(chartWrapper);
}

function showNotification(message, type = 'success') {
    const container = document.getElementById("notificationContainer");
    const toast = document.createElement("div");

    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("fade-out");
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}