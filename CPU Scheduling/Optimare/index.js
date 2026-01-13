const numOfProcessInp = document.getElementById("numOfProcess");
const confirmNumProcBtn = document.getElementById("confirmProcessNum");
confirmNumProcBtn.addEventListener("click", () => {
    const numOfProcess = numOfProcessInp.value;

    if (numOfProcess) addRows(numOfProcess);
    else showNotification("Please input the number of processes", "error");
});

function addRows(numberOfProcesses) {
    const inputTable = document.getElementById("inputTable");
    const tbody = inputTable.querySelector('tbody') || inputTable;
    
    tbody.innerHTML = "";

    for (let i = 0; i < numberOfProcesses; i++) {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>P${(i+1)}</td>
            <td><input type="number" placeholder="0" class="processArrivalTime"></td>
            <td><input type="number" placeholder="0" class="processBurstTime"></td>
            <td><input type="number" placeholder="0" class="processPriorityValue"></td>
        `;
        tbody.appendChild(tr);
    }
}

const algorithmInp = document.getElementById("algorithm");
const confirmAlgorithmBtn = document.getElementById("confirmAlgo");
confirmAlgorithmBtn.addEventListener("click", () => {
    const algorithm = algorithmInp.value;

    if (algorithm) {
        const hasArrival = checkArrivalTime();
        const hasBurst = checkBurstTime();
        const hasPriority = checkPriorityValues();
        
        let missing = [];
        if (!hasArrival) missing.push("Arrival Time");
        if (!hasBurst) missing.push("Burst Time");
        if (!hasPriority) missing.push("Priority Value");
        
        if (missing.length > 0) {
            showNotification(`Missing ${missing.join(", ")} inputs`, "error");
            return;
        }
        
        switch (algorithm) {
            case "FCFS":
                solveFCFS();
                break;
            case "SJF":
                solveSJF();
                break;
            case "Priority":
                solvePriorityValue();
                break;
            case "SRTF":
                solveSRTF();
                break;
            case "ALL":
                solveAllAlgorithms();
                break;
        }
    } else {
        showNotification("Please select an algorithm", "error");
    }
});

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
        processNumber: i+1,
        at: parseInt(input.value),
        bt: parseInt(bursts[i].value),
        priority: parseInt(priorities[i].value),
        remainingTime: parseInt(bursts[i].value),
        isCompleted: false
    }));
}

let currentSimulationData = null;

function finalizeCalculation(processes, idleTimes, totalTime) {
    const totalWT = processes.reduce((sum, p) => sum + p.wt, 0);
    const totalTAT = processes.reduce((sum, p) => sum + p.tat, 0);
    const totalBT = processes.reduce((sum, p) => sum + p.bt, 0);

    const avgWT = (totalWT / processes.length).toFixed(2);
    const avgTAT = (totalTAT / processes.length).toFixed(2);
    const cpuUtil = ((totalBT / totalTime) * 100).toFixed(2);

    currentSimulationData = {
        algorithm: algorithmInp.value,
        processes,
        avgWT,
        avgTAT,
        cpuUtil,
        idleTimes,
        totalTime
    };

    renderMetrics(avgWT, avgTAT, cpuUtil);
    renderGanttChart(processes, idleTimes);
    renderDetailsTable(processes);
    showExportButton();
    
    showNotification("Simulation completed successfully!", "success");
}

function finalizeSRTF(processes, ganttData, idleTimes, totalTime) {
    const totalWT = processes.reduce((sum, p) => sum + p.wt, 0);
    const totalTAT = processes.reduce((sum, p) => sum + p.tat, 0);
    const totalBT = processes.reduce((sum, p) => sum + p.bt, 0);

    const avgWT = (totalWT / processes.length).toFixed(2);
    const avgTAT = (totalTAT / processes.length).toFixed(2);
    const cpuUtil = ((totalBT / totalTime) * 100).toFixed(2);

    currentSimulationData = {
        algorithm: 'SRTF',
        processes,
        ganttData,
        avgWT,
        avgTAT,
        cpuUtil,
        idleTimes,
        totalTime
    };

    renderMetrics(avgWT, avgTAT, cpuUtil);
    renderGanttChartSRTF(ganttData, idleTimes);
    renderDetailsTable(processes);
    showExportButton();
    
    showNotification("Simulation completed successfully!", "success");
}

function solveFCFS() {
    let processes = getProcessData();
    let idleTimes = [];

    processes.sort((a, b) => {
        if (a.at === b.at) {
            return a.processNumber - b.processNumber;
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
            currentTime = p.at;
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
            return a.processNumber - b.processNumber;
        });

        if (readyQueue.length > 0) {
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
                if (a.bt !== b.bt) return a.bt - b.bt;
                if (a.at !== b.at) return a.at - b.at;
                return a.processNumber - b.processNumber;
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

    processes.forEach(p => p.firstStartTime = null);

    while (completedCount < processes.length) {
        let readyQueue = processes.filter(p => p.at <= currentTime && !p.isCompleted);

        if (readyQueue.length > 0) {
            readyQueue.sort((a, b) => {
                if (a.remainingTime !== b.remainingTime) return a.remainingTime - b.remainingTime;
                if (a.at !== b.at) return a.at - b.at;
                return a.processNumber - b.processNumber;
            });

            let p = readyQueue[0];

            if (p.firstStartTime === null) {
                p.firstStartTime = currentTime;
            }

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

function solveAllAlgorithms() {
    document.getElementById("metricsSection").style.display = "none";
    document.getElementById("ganttSection").style.display = "none";
    document.getElementById("detailsSection").style.display = "none";
    
    const resultsDiv = document.getElementById("resultsDiv");
    resultsDiv.innerHTML = "";
    
    const comparisonTemplate = document.getElementById("comparisonTemplate");
    if (!comparisonTemplate) {
        showNotification("Template not found. Please refresh the page.", "error");
        return;
    }
    
    const comparisonContainer = comparisonTemplate.cloneNode(true);
    comparisonContainer.id = "comparisonContainer";
    comparisonContainer.style.display = "block";
    
    const algorithms = ['FCFS', 'SJF', 'SRTF', 'Priority'];
    
    const results = {};
    
    algorithms.forEach(algo => {
        let processes, idleTimes, ganttData, totalTime;
        
        switch(algo) {
            case 'FCFS':
                ({processes, idleTimes, totalTime} = computeFCFS());
                break;
            case 'SJF':
                ({processes, idleTimes, totalTime} = computeSJF());
                break;
            case 'SRTF':
                ({processes, ganttData, idleTimes, totalTime} = computeSRTF());
                break;
            case 'Priority':
                ({processes, idleTimes, totalTime} = computePriority());
                break;
        }
        
        const totalWT = processes.reduce((sum, p) => sum + p.wt, 0);
        const totalTAT = processes.reduce((sum, p) => sum + p.tat, 0);
        const totalBT = processes.reduce((sum, p) => sum + p.bt, 0);
        
        results[algo] = {
            processes,
            ganttData,
            idleTimes,
            avgWT: (totalWT / processes.length).toFixed(2),
            avgTAT: (totalTAT / processes.length).toFixed(2),
            cpuUtil: ((totalBT / totalTime) * 100).toFixed(2),
            totalTime
        };
    });

    currentSimulationData = {
        algorithm: 'ALL',
        results
    };
    
    populateBestAlgorithmSummary(comparisonContainer, results, algorithms);
    
    algorithms.forEach(algo => {
        populateAlgorithmCard(comparisonContainer, algo, results[algo]);
    });
    
    resultsDiv.appendChild(comparisonContainer);
    showExportButton();
    showNotification("All algorithms simulated successfully!", "success");
}

function populateBestAlgorithmSummary(container, results, algorithms) {
    let bestWT = { algo: '', value: Infinity };
    let bestTAT = { algo: '', value: Infinity };
    let bestCPU = { algo: '', value: 0 };
    
    algorithms.forEach(algo => {
        const wt = parseFloat(results[algo].avgWT);
        const tat = parseFloat(results[algo].avgTAT);
        const cpu = parseFloat(results[algo].cpuUtil);
        
        if (wt < bestWT.value) bestWT = { algo, value: wt };
        if (tat < bestTAT.value) bestTAT = { algo, value: tat };
        if (cpu > bestCPU.value) bestCPU = { algo, value: cpu };
    });
    
    container.querySelector('.best-wt-algo').textContent = bestWT.algo;
    container.querySelector('.best-wt-value').textContent = bestWT.value;
    container.querySelector('.best-tat-algo').textContent = bestTAT.algo;
    container.querySelector('.best-tat-value').textContent = bestTAT.value;
    container.querySelector('.best-cpu-algo').textContent = bestCPU.algo;
    container.querySelector('.best-cpu-value').textContent = bestCPU.value + '%';
}

function populateAlgorithmCard(container, algo, result) {
    const algoNames = {
        'FCFS': 'First Come First Serve',
        'SJF': 'Shortest Job First',
        'SRTF': 'Shortest Remaining Time First',
        'Priority': 'Priority Scheduling'
    };
    
    const cardTemplate = document.getElementById('algorithmCardTemplate');
    if (!cardTemplate) {
        console.error('Algorithm card template not found');
        return;
    }
    
    const cardClone = cardTemplate.cloneNode(true);
    cardClone.style.display = 'block';
    cardClone.removeAttribute('id');
    
    cardClone.querySelector('.algo-name').textContent = algoNames[algo];
    cardClone.querySelector('.algo-wt').textContent = result.avgWT;
    cardClone.querySelector('.algo-tat').textContent = result.avgTAT;
    cardClone.querySelector('.algo-cpu').textContent = result.cpuUtil + '%';
    
    const ganttDiv = cardClone.querySelector('.algo-gantt');
    const timelineDiv = cardClone.querySelector('.algo-timeline');
    ganttDiv.id = `gantt-${algo}`;
    timelineDiv.id = `timeline-${algo}`;
    
    container.querySelector('.algorithm-cards-container').appendChild(cardClone);
    
    setTimeout(() => {
        renderMiniGanttChart(algo, result);
    }, 0);
}

function renderMiniGanttChart(algo, result) {
    const ganttDiv = document.getElementById(`gantt-${algo}`);
    const timelineDiv = document.getElementById(`timeline-${algo}`);
    
    let timeline = [];
    
    if (algo === 'SRTF' && result.ganttData) {
        timeline = [...result.ganttData];
    } else {
        result.processes.forEach(s => {
            timeline.push({
                id: s.id,
                start: s.startTime,
                end: s.finishTime,
                type: 'process'
            });
        });
    }
    
    result.idleTimes.forEach(i => {
        timeline.push({...i, id: 'Idle', type: 'idle'});
    });
    
    timeline.sort((a, b) => a.start - b.start);
    
    timeline.forEach(block => {
        const duration = block.end - block.start;
        if (duration <= 0) return;
        
        const div = document.createElement("div");
        div.className = `gantt-block ${block.type === 'process' ? 'process-block' : 'idle-block'}`;
        div.style.width = `${duration * 30}px`;
        div.innerHTML = `<div class="gantt-block-label">${block.id}</div>`;
        div.title = `${block.id}: ${block.start} → ${block.end}`;
        ganttDiv.appendChild(div);
    });
    
    let currentPosition = 0;
    timeline.forEach((block, idx) => {
        const duration = block.end - block.start;
        if (idx === 0 || block.start !== timeline[idx-1].start) {
            const marker = document.createElement("div");
            marker.className = "timeline-marker";
            marker.textContent = block.start;
            marker.style.left = `${currentPosition}px`;
            timelineDiv.appendChild(marker);
        }
        currentPosition += duration * 30;
    });
    
    const finalMarker = document.createElement("div");
    finalMarker.className = "timeline-marker";
    finalMarker.textContent = timeline[timeline.length - 1].end;
    finalMarker.style.left = `${currentPosition}px`;
    timelineDiv.appendChild(finalMarker);
}

function computeFCFS() {
    let processes = getProcessData();
    let idleTimes = [];

    processes.sort((a, b) => {
        if (a.at === b.at) return a.processNumber - b.processNumber;
        return a.at - b.at;
    });

    let currentTime = 0;
    processes.forEach(p => {
        if (currentTime < p.at) {
            idleTimes.push({ start: currentTime, end: p.at, duration: p.at - currentTime });
            currentTime = p.at;
        }
        p.startTime = currentTime;
        p.finishTime = currentTime + p.bt;
        p.tat = p.finishTime - p.at;
        p.wt = p.tat - p.bt;
        currentTime = p.finishTime;
    });

    return { processes, idleTimes, totalTime: currentTime };
}

function computeSJF() {
    let processes = getProcessData();
    let idleTimes = [];
    let currentTime = 0;
    let completedCount = 0;

    while (completedCount < processes.length) {
        let readyQueue = processes.filter(p => p.at <= currentTime && !p.isCompleted);
        readyQueue.sort((a, b) => {
            if (a.bt !== b.bt) return a.bt - b.bt;
            if (a.at !== b.at) return a.at - b.at;
            return a.processNumber - b.processNumber;
        });

        if (readyQueue.length > 0) {
            let p = readyQueue[0];
            p.startTime = currentTime;
            p.finishTime = p.startTime + p.bt;
            p.tat = p.finishTime - p.at;
            p.wt = p.startTime - p.at;
            p.isCompleted = true;
            completedCount++;
            currentTime = p.finishTime;
        } else {
            let uncompleted = processes.filter(p => !p.isCompleted);
            let nextArrival = Math.min(...uncompleted.map(p => p.at));
            idleTimes.push({ start: currentTime, end: nextArrival, duration: nextArrival - currentTime });
            currentTime = nextArrival;
        }
    }

    return { processes, idleTimes, totalTime: currentTime };
}

function computePriority() {
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
                return a.processNumber - b.processNumber;
            });

            let p = readyQueue[0];
            p.startTime = currentTime;
            p.finishTime = p.startTime + p.bt;
            p.tat = p.finishTime - p.at;
            p.wt = p.startTime - p.at;
            p.isCompleted = true;
            completedCount++;
            currentTime = p.finishTime;
        } else {
            let uncompleted = processes.filter(p => !p.isCompleted);
            let nextArrival = Math.min(...uncompleted.map(p => p.at));
            idleTimes.push({ start: currentTime, end: nextArrival, duration: nextArrival - currentTime });
            currentTime = nextArrival;
        }
    }

    return { processes, idleTimes, totalTime: currentTime };
}

function computeSRTF() {
    let processes = getProcessData();
    let idleTimes = [];
    let ganttData = [];
    let currentTime = 0;
    let completedCount = 0;

    processes.forEach(p => p.firstStartTime = null);

    while (completedCount < processes.length) {
        let readyQueue = processes.filter(p => p.at <= currentTime && !p.isCompleted);

        if (readyQueue.length > 0) {
            readyQueue.sort((a, b) => {
                if (a.remainingTime !== b.remainingTime) return a.remainingTime - b.remainingTime;
                if (a.at !== b.at) return a.at - b.at;
                return a.processNumber - b.processNumber;
            });

            let p = readyQueue[0];

            if (p.firstStartTime === null) {
                p.firstStartTime = currentTime;
            }

            if (ganttData.length > 0 && ganttData[ganttData.length - 1].id === p.id) {
                ganttData[ganttData.length - 1].end++;
            } else {
                ganttData.push({ id: p.id, start: currentTime, end: currentTime + 1, type: 'process' });
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
            idleTimes.push({ start: currentTime, end: nextArrival, duration: nextArrival - currentTime });
            currentTime = nextArrival;
        }
    }
    
    return { processes, ganttData, idleTimes, totalTime: currentTime };
}

function renderMetrics(avgWT, avgTAT, cpuUtil) {
    const metricsSection = document.getElementById("metricsSection");
    metricsSection.style.display = "block";
    
    document.getElementById("avgWT").textContent = avgWT;
    document.getElementById("avgTAT").textContent = avgTAT;
    document.getElementById("cpuUtil").textContent = cpuUtil + "%";
    
    animateValue("avgWT", 0, parseFloat(avgWT), 1000);
    animateValue("avgTAT", 0, parseFloat(avgTAT), 1000);
    animateValue("cpuUtil", 0, parseFloat(cpuUtil), 1000, "%");
}

function animateValue(id, start, end, duration, suffix = "") {
    const element = document.getElementById(id);
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = current.toFixed(2) + suffix;
    }, 16);
}

function renderGanttChart(segments, idleTimes) {
    const ganttSection = document.getElementById("ganttSection");
    const ganttChartDiv = document.getElementById("ganttChartDiv");
    
    ganttSection.style.display = "block";
    ganttChartDiv.innerHTML = "";

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

    timeline.forEach(block => {
        const duration = block.end - block.start;
        if (duration <= 0) return;

        const div = document.createElement("div");
        div.className = `gantt-block ${block.type === 'process' ? 'process-block' : 'idle-block'}`;
        div.style.width = `${duration * 50}px`;

        div.innerHTML = `
            <div class="gantt-block-label">${block.id}</div>
            <div class="gantt-block-time">${duration}u</div>
        `;

        div.title = `${block.id}: ${block.start} → ${block.end} (${duration} units)`;

        ganttChartDiv.appendChild(div);
    });

    renderTimeline(timeline);
}

function renderGanttChartSRTF(ganttData, idleTimes) {
    const ganttSection = document.getElementById("ganttSection");
    const ganttChartDiv = document.getElementById("ganttChartDiv");
    
    ganttSection.style.display = "block";
    ganttChartDiv.innerHTML = "";

    let timeline = [...ganttData];
    
    idleTimes.forEach(i => {
        timeline.push({...i, id: 'Idle', type: 'idle'});
    });

    timeline.sort((a, b) => a.start - b.start);

    timeline.forEach(block => {
        const duration = block.end - block.start;
        if (duration <= 0) return;

        const div = document.createElement("div");
        div.className = `gantt-block ${block.type === 'process' ? 'process-block' : 'idle-block'}`;
        div.style.width = `${duration * 50}px`;

        div.innerHTML = `
            <div class="gantt-block-label">${block.id}</div>
            <div class="gantt-block-time">${duration}u</div>
        `;

        div.title = `${block.id}: ${block.start} → ${block.end} (${duration} units)`;

        ganttChartDiv.appendChild(div);
    });

    renderTimeline(timeline);
}

function renderTimeline(timeline) {
    const ganttTimeline = document.getElementById("ganttTimeline");
    ganttTimeline.innerHTML = "";
    
    let timePoints = new Set();
    timeline.forEach(block => {
        timePoints.add(block.start);
        timePoints.add(block.end);
    });
    
    let sortedTimes = Array.from(timePoints).sort((a, b) => a - b);
    let currentPosition = 0;
    
    timeline.forEach(block => {
        const duration = block.end - block.start;
        const marker = document.createElement("div");
        marker.className = "timeline-marker";
        marker.textContent = block.start;
        marker.style.left = `${currentPosition}px`;
        ganttTimeline.appendChild(marker);
        currentPosition += duration * 50;
    });
    
    const finalMarker = document.createElement("div");
    finalMarker.className = "timeline-marker";
    finalMarker.textContent = timeline[timeline.length - 1].end;
    finalMarker.style.left = `${currentPosition}px`;
    ganttTimeline.appendChild(finalMarker);
}

function renderDetailsTable(processes) {
    const detailsSection = document.getElementById("detailsSection");
    const detailsTableBody = document.getElementById("detailsTableBody");
    
    detailsSection.style.display = "block";
    detailsTableBody.innerHTML = "";
    
    processes.sort((a, b) => a.processNumber - b.processNumber);
    
    processes.forEach(p => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><strong>${p.id}</strong></td>
            <td>${p.at}</td>
            <td>${p.bt}</td>
            <td>${p.finishTime}</td>
            <td>${p.tat}</td>
            <td>${p.wt}</td>
        `;
        detailsTableBody.appendChild(tr);
    });
}

function showExportButton() {
    const exportBtn = document.getElementById("exportBtn");
    
    if (exportBtn) {
        const newExportBtn = exportBtn.cloneNode(true);
        exportBtn.parentNode.replaceChild(newExportBtn, exportBtn);
        
        newExportBtn.addEventListener("click", exportSimulation);
        
        newExportBtn.style.display = "flex";
        
        console.log("Export button ready");
    } else {
        console.error("Export button not found in HTML");
    }
}

function exportSimulation() {
    console.log("Export function called");
    console.log("Current simulation data:", currentSimulationData);
    
    if (!currentSimulationData) {
        showNotification("No simulation data to export", "error");
        return;
    }

    try {
        let content = "";
        const timestamp = new Date().toLocaleString();
        
        content += "=====================================\n";
        content += "CPU SCHEDULING SIMULATION RESULTS\n";
        content += "=====================================\n";
        content += `Generated: ${timestamp}\n\n`;

        if (currentSimulationData.algorithm === 'ALL') {
            content += exportAllAlgorithms(currentSimulationData.results);
        } else {
            content += exportSingleAlgorithm(currentSimulationData);
        }

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cpu_scheduling_${currentSimulationData.algorithm}_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification("Results exported successfully!", "success");
    } catch (error) {
        console.error('Export error:', error);
        showNotification("Export failed: " + error.message, "error");
    }
}

function exportSingleAlgorithm(data) {
    const algoNames = {
        'FCFS': 'First Come First Serve',
        'SJF': 'Shortest Job First',
        'SRTF': 'Shortest Remaining Time First',
        'Priority': 'Priority Scheduling'
    };

    let content = "";
    content += `ALGORITHM: ${algoNames[data.algorithm] || data.algorithm}\n`;
    content += "=====================================\n\n";

    content += "PERFORMANCE METRICS\n";
    content += "-------------------------------------\n";
    content += `Average Waiting Time:     ${data.avgWT} time units\n`;
    content += `Average Turnaround Time:  ${data.avgTAT} time units\n`;
    content += `CPU Utilization:          ${data.cpuUtil}%\n`;
    content += `Total Execution Time:     ${data.totalTime} time units\n\n`;

    content += "PROCESS DETAILS\n";
    content += "-------------------------------------\n";
    content += "Process | AT | BT | FT | TAT | WT\n";
    content += "--------|----|----|----|----|----\n";
    
    const sortedProcesses = [...data.processes].sort((a, b) => a.processNumber - b.processNumber);
    sortedProcesses.forEach(p => {
        content += `${p.id.padEnd(7)} | ${String(p.at).padStart(2)} | ${String(p.bt).padStart(2)} | ${String(p.finishTime).padStart(2)} | ${String(p.tat).padStart(3)} | ${String(p.wt).padStart(2)}\n`;
    });

    content += "\n";
    content += "GANTT CHART\n";
    content += "-------------------------------------\n";
    
    if (data.ganttData) {
        let timeline = [...data.ganttData];
        data.idleTimes.forEach(i => {
            timeline.push({...i, id: 'Idle', type: 'idle'});
        });
        timeline.sort((a, b) => a.start - b.start);
        
        timeline.forEach(block => {
            const duration = block.end - block.start;
            content += `[${block.id}] ${block.start} -> ${block.end} (${duration} units)\n`;
        });
    } else {
        let timeline = [];
        data.processes.forEach(p => {
            timeline.push({
                id: p.id,
                start: p.startTime,
                end: p.finishTime,
                type: 'process'
            });
        });
        data.idleTimes.forEach(i => {
            timeline.push({...i, id: 'Idle', type: 'idle'});
        });
        timeline.sort((a, b) => a.start - b.start);
        
        timeline.forEach(block => {
            const duration = block.end - block.start;
            content += `[${block.id}] ${block.start} -> ${block.end} (${duration} units)\n`;
        });
    }

    content += "\n";
    return content;
}

function exportAllAlgorithms(results) {
    const algoNames = {
        'FCFS': 'First Come First Serve',
        'SJF': 'Shortest Job First',
        'SRTF': 'Shortest Remaining Time First',
        'Priority': 'Priority Scheduling'
    };

    let content = "";
    content += "ALGORITHM COMPARISON MODE\n";
    content += "=====================================\n\n";

    content += "BEST PERFORMANCE SUMMARY\n";
    content += "-------------------------------------\n";
    
    let bestWT = { algo: '', value: Infinity };
    let bestTAT = { algo: '', value: Infinity };
    let bestCPU = { algo: '', value: 0 };
    
    ['FCFS', 'SJF', 'SRTF', 'Priority'].forEach(algo => {
        const wt = parseFloat(results[algo].avgWT);
        const tat = parseFloat(results[algo].avgTAT);
        const cpu = parseFloat(results[algo].cpuUtil);
        
        if (wt < bestWT.value) bestWT = { algo, value: wt };
        if (tat < bestTAT.value) bestTAT = { algo, value: tat };
        if (cpu > bestCPU.value) bestCPU = { algo, value: cpu };
    });

    content += `Lowest Avg Waiting Time:     ${bestWT.algo} (${bestWT.value})\n`;
    content += `Lowest Avg Turnaround Time:  ${bestTAT.algo} (${bestTAT.value})\n`;
    content += `Highest CPU Utilization:     ${bestCPU.algo} (${bestCPU.value}%)\n\n`;

    content += "DETAILED COMPARISON\n";
    content += "=====================================\n\n";

    ['FCFS', 'SJF', 'SRTF', 'Priority'].forEach(algo => {
        const result = results[algo];
        
        content += `\n--- ${algoNames[algo]} ---\n\n`;
        content += `Average Waiting Time:     ${result.avgWT} time units\n`;
        content += `Average Turnaround Time:  ${result.avgTAT} time units\n`;
        content += `CPU Utilization:          ${result.cpuUtil}%\n`;
        content += `Total Execution Time:     ${result.totalTime} time units\n\n`;

        content += "Process Details:\n";
        content += "Process | AT | BT | FT | TAT | WT\n";
        content += "--------|----|----|----|----|----\n";
        
        const sortedProcesses = [...result.processes].sort((a, b) => a.processNumber - b.processNumber);
        sortedProcesses.forEach(p => {
            content += `${p.id.padEnd(7)} | ${String(p.at).padStart(2)} | ${String(p.bt).padStart(2)} | ${String(p.finishTime).padStart(2)} | ${String(p.tat).padStart(3)} | ${String(p.wt).padStart(2)}\n`;
        });

        content += "\nGantt Chart:\n";
        
        if (algo === 'SRTF' && result.ganttData) {
            let timeline = [...result.ganttData];
            result.idleTimes.forEach(i => {
                timeline.push({...i, id: 'Idle', type: 'idle'});
            });
            timeline.sort((a, b) => a.start - b.start);
            
            timeline.forEach(block => {
                const duration = block.end - block.start;
                content += `[${block.id}] ${block.start} -> ${block.end} (${duration} units)\n`;
            });
        } else {
            let timeline = [];
            result.processes.forEach(p => {
                timeline.push({
                    id: p.id,
                    start: p.startTime,
                    end: p.finishTime,
                    type: 'process'
                });
            });
            result.idleTimes.forEach(i => {
                timeline.push({...i, id: 'Idle', type: 'idle'});
            });
            timeline.sort((a, b) => a.start - b.start);
            
            timeline.forEach(block => {
                const duration = block.end - block.start;
                content += `[${block.id}] ${block.start} -> ${block.end} (${duration} units)\n`;
            });
        }

        content += "\n";
    });

    return content;
}

function showNotification(message, type = 'success') {
    const container = document.getElementById("notificationContainer");
    const toast = document.createElement("div");

    toast.className = `toast ${type}`;
    
    const iconSvg = type === 'success' 
        ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'
        : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    
    toast.innerHTML = `
        <span class="toast-icon">${iconSvg}</span>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("fade-out");
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}