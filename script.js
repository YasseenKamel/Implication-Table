class FSMTableGenerator {
    constructor() {
        this.n = 1;
        this.m = 1;
        this.fsmType = 'Mealy';
        this.tableData = [['']]; // Always start with one empty row
        this.activeCell = null;
        this.headers = [];
        
        this.initElements();
        this.bindEvents();
        this.generateTable();
        this.onTableUpdate();
    }

    initElements() {
        this.inputN = document.getElementById('inputN');
        this.inputM = document.getElementById('inputM');
        this.fsmTypeRadios = document.querySelectorAll('input[name="fsmType"]');
        this.table = document.getElementById('fsmTable');
        this.tableContainer = document.querySelector('.table-container');
    }

    bindEvents() {
        this.inputN.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-5]/g, '').slice(0,1);
            if (e.target.value) {
                this.n = parseInt(e.target.value) || 1;
                this.generateTable();
                this.onTableUpdate();
            }
        });

        this.inputM.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0,2);
            if (e.target.value) {
                this.m = parseInt(e.target.value) || 1;
                this.generateTable();
                this.onTableUpdate();
            }
        });

        this.fsmTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.fsmType = e.target.value;
                this.generateTable();
                this.onTableUpdate();
            });
        });
    }

    getTableHeaders(n, m, fsmType) {
        const cols = ['Del', 'Present State'];
        const safeN = Math.min(n, 5);
        const numInputs = 1 << safeN;

        // Next State columns
        for (let i = 0; i < numInputs; i++) {
            const binaryStr = i.toString(2).padStart(safeN, '0');
            const inputVars = [];
            for (let bitIdx = 0; bitIdx < safeN; bitIdx++) {
                inputVars.push(`x${bitIdx + 1}=${binaryStr[safeN - 1 - bitIdx]}`);
            }
            cols.push(`N.S ${inputVars.join(',')}`);
        }

        // Output columns
        if (fsmType === 'Mealy') {
            for (let outIdx = 0; outIdx < m; outIdx++) {
                for (let inIdx = 0; inIdx < numInputs; inIdx++) {
                    const binaryStr = inIdx.toString(2).padStart(safeN, '0');
                    const inputVars = [];
                    for (let bitIdx = 0; bitIdx < safeN; bitIdx++) {
                        inputVars.push(`x${bitIdx + 1}=${binaryStr[safeN - 1 - bitIdx]}`);
                    }
                    cols.push(`Out${outIdx + 1} (${inputVars.join(',')})`);
                }
            }
        } else {
            for (let outIdx = 0; outIdx < m; outIdx++) {
                cols.push(`Output ${outIdx + 1}`);
            }
        }

        return cols;
    }

    isOutputColumn(colIdx) {
        if (colIdx < 2) return false;
        const header = this.headers[colIdx].toLowerCase();
        return header.includes('out') || header.includes('output');
    }

    generateTable() {
        this.headers = this.getTableHeaders(this.n, this.m, this.fsmType);
        
        // Ensure we always have at least one row
        if (this.tableData.length === 0) {
            this.tableData = [['']];
        }

        let tableHTML = '<thead><tr>';
        
        // Headers
        this.headers.forEach((header, idx) => {
            tableHTML += `<th title="${header}">${header}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        // Data rows
        this.tableData.forEach((row, rowIdx) => {
            const isLastRow = rowIdx === this.tableData.length - 1;
            tableHTML += `<tr${isLastRow ? ' class="last-row"' : ''}>`;
            
            // First column (Delete) - FIXED: Only show X for non-last rows, input for last row
            if (isLastRow) {
                // Last row always gets input field (no delete)
                tableHTML += '<td class="data-cell"><input type="text" value="" data-row="' + rowIdx + '" data-col="0" readonly></td>';
            } else {
                // All other rows get delete X
                tableHTML += '<td class="delete-cell" data-row="' + rowIdx + '">X</td>';
            }
            
            // Data cells (columns 1+)
            for (let colIdx = 1; colIdx < this.headers.length; colIdx++) {
                const cellClass = this.isOutputColumn(colIdx) ? 'output-cell' : 'state-cell';
                const cellValue = row[colIdx] || '';
                const maxLength = this.isOutputColumn(colIdx) ? 1 : 999;
                
                tableHTML += `
                    <td class="data-cell ${cellClass}">
                        <input type="text" 
                               value="${cellValue}" 
                               maxlength="${maxLength}"
                               data-row="${rowIdx}" 
                               data-col="${colIdx}">
                    </td>
                `;
            }
            
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody>';
        this.table.innerHTML = tableHTML;

        // Bind new input events
        this.bindCellInputs();
    }

    bindCellInputs() {
        // Clear previous active states
        document.querySelectorAll('.active').forEach(el => el.classList.remove('active'));

        // Bind input events
        this.table.querySelectorAll('input[type="text"]:not([readonly])').forEach(input => {
            const row = parseInt(input.dataset.row);
            const col = parseInt(input.dataset.col);
            const isOutput = this.isOutputColumn(col);

            input.addEventListener('input', (e) => {
                if (isOutput) {
                    e.target.value = e.target.value.replace(/[^01]/g, '').slice(0, 1);
                }
                
                // Extend row array if needed
                while (this.tableData[row] && this.tableData[row].length <= col) {
                    this.tableData[row].push('');
                }
                this.tableData[row][col] = e.target.value;
                this.onTableUpdate();
                // Auto-add new row when typing in last row (except delete column)
                if (row === this.tableData.length - 1 && col > 0 && e.target.value.trim()) {
                    this.tableData.push(new Array(this.headers.length).fill(''));
                    this.generateTable();
                    this.onTableUpdate();
                }
            });

            input.addEventListener('focus', (e) => {
                this.activeCell = { row: parseInt(e.target.dataset.row), col: parseInt(e.target.dataset.col) };
                
                // Clear other active cells
                document.querySelectorAll('.data-cell').forEach(cell => {
                    cell.classList.remove('active');
                });
                
                e.target.closest('.data-cell').classList.add('active');
                e.target.select();
            });

            input.addEventListener('keydown', (e) => {
                const row = parseInt(e.target.dataset.row);
                const col = parseInt(e.target.dataset.col);
                
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (row < this.tableData.length - 1) {
                        const nextInput = this.table.querySelector(`input[data-row="${row + 1}"][data-col="${col}"]`);
                        if (nextInput) {
                            nextInput.focus();
                            nextInput.select();
                        }
                    }
                }
            });
        });

        // FIXED: Delete cell clicks - Now properly handles ALL rows except the last one
        this.table.querySelectorAll('.delete-cell').forEach(cell => {
            cell.addEventListener('click', (e) => {
                const rowIdx = parseInt(e.currentTarget.dataset.row);
                // FIXED: Can delete ANY row except when it would leave zero rows
                if (rowIdx >= 0 && rowIdx < this.tableData.length - 1) { 
                    this.tableData.splice(rowIdx, 1);
                    // Always ensure at least one row exists
                    if (this.tableData.length === 0) {
                        this.tableData = [['']];
                    }
                    this.generateTable();
                    this.onTableUpdate();
                }
            });
        });
    }
    onTableUpdate() {
        const data = this.tableData
            .slice(0, -1) // ignore last input row
            .map(row => row.slice(1)); // ignore delete column if needed

        // console.log(data);
    }
    getTableData() {
        const table = document.getElementById("fsmTable");

        const allRows = Array.from(table.rows);
        const trimmedRows = allRows.slice(1, -1);
        const tableData = trimmedRows.map(row => {
        const allCells = Array.from(row.cells);
        
        return allCells.slice(1).map(cell => {
            const input = cell.querySelector('input');
            return input ? input.value : cell.innerText.trim();
        });
        });
        return tableData;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.fsmTable = new FSMTableGenerator();
});

function first_implications(a,b){
    const areEqual = (arr1, arr2) => 
    arr1.length === arr2.length && 
    arr1.every((val, index) => val === arr2[index]);
    const data = window.fsmTable.getTableData();
    const n=window.fsmTable.n,m=window.fsmTable.m,outp=(window.fsmTable.fsmType=="Mealy"?((m*(2**n))):(m));
    if(!areEqual(data[a].slice(-outp),data[b].slice(-outp))){
        return 0;
    }
    let ans="";
    for(let i = 1;i<=2**n;i++){
        if(data[a][i]!=data[b][i]){
            let x = data[a][i],y = data[b][i];
            if((data[a][0]==x&&data[b][0]==y)||(data[a][0]==y&&data[b][0]==x)){
                continue;
            }
            ans+=data[a][i]+'-'+data[b][i]+'\n';
        }
    }
    return (ans==""?1:ans);
}

function generateImpTable(){
    const data = window.fsmTable.getTableData();
    const n = data.length;
    let tab = [],f=1;
    tab[0]=[];
    const mp={};
    for(let i=0;i<n;i++){
        mp[data[i][0]]=i;
    }
    for(let i=0;i<n-1;i++){
        tab[0][i]=[];
        for(let j=0;j<=i;j++){
            tab[0][i][j]=first_implications(i+1,j);
        }
    }
    console.log(tab);
    for(let idx=1;f;idx++){
        tab[idx]=[];
        f=0;
        for(let i=0;i<n-1;i++){
            tab[idx][i]=[];
            for(let j=0;j<=i;j++){
                if(tab[idx-1][i][j]==1||tab[idx-1][i][j]==0){
                    tab[idx][i][j]=tab[idx-1][i][j];
                }
                else{
                    const imps = tab[idx-1][i][j].split("\n");
                    tab[idx][i][j]=tab[idx-1][i][j];
                    let sm=0;
                    for(let k = 0 ; k < imps.length-1;k++){
                        const im = imps[k];
                        let a = mp[im.split("-")[0]];
                        let b = mp[im.split("-")[1]];

                        let row = Math.max(a, b) - 1;
                        let col = Math.min(a, b);
                        if(tab[idx-1][row][col]==0){
                            tab[idx][i][j] = 0;
                            f=1;
                            break;
                        }
                        if(tab[idx-1][row][col]==1){
                            sm++;
                        }
                    }
                    if(sm==imps.length-1){
                        f=1;
                        tab[idx][i][j]=1;
                    }
                }
            }
        }
    }
    tab.pop();
    console.log(tab);
    return tab;
}

let cur_ver=0;

function Next(){
    cur_ver++;
    if(cur_ver == generateImpTable().length-1){
        document.getElementById("Next").disabled=true;
    }
    document.getElementById("Prev").disabled=false;
    disp_current();
}

function Prev(){
    cur_ver--;
    if(cur_ver == 0){
        document.getElementById("Prev").disabled=true;
    }
    document.getElementById("Next").disabled=false;
    disp_current();
}

function disp_current(){
    const tab=generateImpTable();
    const data = window.fsmTable.getTableData();
    const n = data.length;
    const container = document.getElementById("impTableContainer");

    container.innerHTML = "";

    const table = document.createElement("table");

    for (let i = 1; i < n; i++) {
        const row = document.createElement("tr");
        const celllabel = document.createElement("td");
        celllabel.classList.add('imp-label');
        celllabel.textContent=data[i][0];
        row.appendChild(celllabel);
        for (let j = 0; j < i; j++) {
            const cell = document.createElement("td");
            cell.classList.add('imp-data');
            cell.textContent = tab[cur_ver][i-1][j];
            if(tab[cur_ver][i-1][j]==1){
                cell.textContent='';
                cell.style.backgroundColor = "green";
            }
            if(tab[cur_ver][i-1][j]==0){
                cell.textContent='';
                cell.style.backgroundColor = "red";
            }
            row.appendChild(cell);
        }

        table.appendChild(row);
    }
    const rowend = document.createElement("tr");
    const cell = document.createElement("td");
    rowend.appendChild(cell);
    for (let i = 0; i < n-1; i++) {
        const cell = document.createElement("td");
        cell.classList.add('imp-label');
        cell.textContent = data[i][0];
        rowend.appendChild(cell);
    }
    table.appendChild(rowend);
    container.appendChild(table);
}

function displayImpTable() {
    const tab=generateImpTable();
    const data = window.fsmTable.getTableData();
    const n = data.length;
    const container = document.getElementById("impTableContainer");

    container.innerHTML = "";

    const table = document.createElement("table");
    cur_ver=0;

    for (let i = 1; i < n; i++) {
        const row = document.createElement("tr");
        const celllabel = document.createElement("td");
        celllabel.classList.add('imp-label');
        celllabel.textContent=data[i][0];
        row.appendChild(celllabel);
        for (let j = 0; j < i; j++) {
            const cell = document.createElement("td");
            cell.classList.add('imp-data');
            cell.textContent = tab[0][i-1][j];
            if(tab[0][i-1][j]==1){
                cell.textContent='';
                cell.style.backgroundColor = "green";
            }
            if(tab[0][i-1][j]==0){
                cell.textContent='';
                cell.style.backgroundColor = "red";
            }
            row.appendChild(cell);
        }

        table.appendChild(row);
    }
    const rowend = document.createElement("tr");
    const cell = document.createElement("td");
    rowend.appendChild(cell);
    for (let i = 0; i < n-1; i++) {
        const cell = document.createElement("td");
        cell.classList.add('imp-label');
        cell.textContent = data[i][0];
        rowend.appendChild(cell);
    }
    table.appendChild(rowend);
    container.appendChild(table);

    const btncont = document.getElementById("navBtnContainer");
    btncont.innerHTML='<button class="btn btn-primary" type="button" style="margin-top: 30px;" id="Prev" onclick="Prev()">Previous</button> <button class="btn btn-primary" type="button" style="margin-top: 30px;" id="Next" onclick="Next()">Next</button>';
    document.getElementById("Prev").disabled=true;
    if(tab.length==1){
        document.getElementById("Next").disabled=true;
    }
    generateGraph();
}

let adj={},vis={};

function generateGraph(){
    const tab=generateImpTable();
    const data = window.fsmTable.getTableData();
    const n = data.length;
    for(let i = 0 ; i < n ; i++){
        adj[data[i][0]]=[];
        vis[data[i][0]]=-1;
    }
    for(let i=0;i<n-1;i++){
        for(let j=0;j<=i;j++){
            if(tab[tab.length-1][i][j]==0){
                continue;
            }
            adj[data[i+1][0]].push(data[j][0]);
            adj[data[j][0]].push(data[i+1][0]);
        }
    }
    assign();
}

function dfs(node, val){
    vis[node]=val;
    for(let i=0;i<adj[node].length;i++){
        if(vis[adj[node][i]]==-1){
            dfs(adj[node][i],val);
        }
    }
}

class StaticTableGenerator {
    constructor(tableData2D, n = 1, m = 1, fsmType = 'Mealy') {
        this.n = n;
        this.m = m;
        this.fsmType = fsmType;
        this.tableData = tableData2D || [];
        this.headers = [];
        this.tableElement = null;
        
        this.generateStaticTable();
    }

    getTableHeaders(n, m, fsmType) {
        const cols = ['Present State']; // No delete column!
        const safeN = Math.min(n, 5);
        const numInputs = 1 << safeN;

        // Next State columns
        for (let i = 0; i < numInputs; i++) {
            const binaryStr = i.toString(2).padStart(safeN, '0');
            const inputVars = [];
            for (let bitIdx = 0; bitIdx < safeN; bitIdx++) {
                inputVars.push(`x${bitIdx + 1}=${binaryStr[safeN - 1 - bitIdx]}`);
            }
            cols.push(`N.S ${inputVars.join(',')}`);
        }

        // Output columns
        if (fsmType === 'Mealy') {
            for (let outIdx = 0; outIdx < m; outIdx++) {
                for (let inIdx = 0; inIdx < numInputs; inIdx++) {
                    const binaryStr = inIdx.toString(2).padStart(safeN, '0');
                    const inputVars = [];
                    for (let bitIdx = 0; bitIdx < safeN; bitIdx++) {
                        inputVars.push(`x${bitIdx + 1}=${binaryStr[safeN - 1 - bitIdx]}`);
                    }
                    cols.push(`Out${outIdx + 1} (${inputVars.join(',')})`);
                }
            }
        } else {
            for (let outIdx = 0; outIdx < m; outIdx++) {
                cols.push(`Output ${outIdx + 1}`);
            }
        }

        return cols;
    }

    isOutputColumn(colIdx) {
        if (colIdx < 1) return false; // Present State is col 0
        const header = this.headers[colIdx].toLowerCase();
        return header.includes('out') || header.includes('output');
    }

    generateStaticTable(containerId = 'staticTableContainer') {
        this.headers = this.getTableHeaders(this.n, this.m, this.fsmType);
        
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with id "${containerId}" not found!`);
            return null;
        }

        let tableHTML = `
            <table class="static-fsm-table">
                <thead>
                    <tr>
        `;
        
        // Headers (no delete column)
        this.headers.forEach((header) => {
            tableHTML += `<th title="${header}">${header}</th>`;
        });
        tableHTML += '</tr></thead><tbody>';

        // Data rows - use provided 2D array
        this.tableData.forEach((row, rowIdx) => {
            tableHTML += '<tr>';
            
            // Present State column (col 0)
            const stateValue = row[0] || '';
            tableHTML += `
                <td class="state-cell static-cell">
                    <span>${stateValue}</span>
                </td>
            `;
            
            // Data cells (columns 1+)
            for (let colIdx = 1; colIdx < this.headers.length; colIdx++) {
                const cellValue = row[colIdx] || '';
                const cellClass = this.isOutputColumn(colIdx) ? 'output-cell static-cell' : 'data-cell static-cell';
                
                tableHTML += `
                    <td class="${cellClass}">
                        <span>${cellValue}</span>
                    </td>
                `;
            }
            
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';
        
        container.innerHTML = tableHTML;
        this.tableElement = container.querySelector('.static-fsm-table');
        
        this.applyStaticStyling();
        return this.tableElement;
    }

    applyStaticStyling() {
        // Add CSS classes for static table styling
        if (this.tableElement) {
            const style = document.createElement('style');
            style.textContent = `
                .static-fsm-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-family: monospace;
                    font-size: 14px;
                    table-layout: fixed;
                    background: white;
                    margin-top: 20px;
                }
                
                .static-fsm-table th {
                    height: 45px;
                    border: 2px solid #888;
                    text-align: center;
                    vertical-align: middle;
                    background: linear-gradient(145deg, #666, #555);
                    color: white;
                    font-weight: bold;
                    font-size: 13px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
                
                .static-fsm-table th:first-child {
                    width: 120px;
                    min-width: 120px;
                }
                
                .static-fsm-table th:not(:first-child) {
                    min-width: 85px;
                }
                
                .static-fsm-table td {
                    height: 45px;
                    border: 2px solid #ccc;
                    text-align: center;
                    vertical-align: middle;
                    padding: 8px 4px;
                    background: white;
                }
                
                .static-fsm-table .static-cell {
                    font-weight: bold;
                    font-family: monospace;
                    font-size: 15px;
                }
                
                .static-fsm-table .state-cell {
                    background: rgba(255, 100, 100, 0.2) !important;
                    color: #d32f2f;
                    font-weight: bold;
                }
                
                .static-fsm-table .output-cell {
                    background: rgba(100, 150, 255, 0.1) !important;
                    color: #1976d2;
                }
                
                .static-fsm-table .data-cell {
                    background: rgba(240, 240, 240, 0.5);
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Update table data
    updateTableData(newTableData) {
        this.tableData = newTableData || [];
        this.generateStaticTable();
    }

    // Get current table data as 2D array
    getTableData() {
        return this.tableData;
    }

    // Static method to create table from JSON/data
    static fromJSON(jsonData, containerId) {
        const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
        const generator = new StaticTableGenerator(
            data.tableData,
            data.n,
            data.m,
            data.fsmType
        );
        generator.generateStaticTable(containerId);
        return generator;
    }
}




let grps=[];

function deleteDuplicateRowsInPlace(arr) {
    const seen = new Map();
    let writeIndex = 0;
    
    for (let readIndex = 0; readIndex < arr.length; readIndex++) {
        const key = JSON.stringify(arr[readIndex]);
        if (!seen.has(key)) {
            seen.set(key, true);
            arr[writeIndex] = arr[readIndex];
            writeIndex++;
        }
    }
    
    arr.length = writeIndex;
    return arr;
}

function assign(){
    const data = window.fsmTable.getTableData();
    const n = data.length;
    let idx=0;
    grps=[];
    for(let i = 0 ; i < n ; i++){
        if(vis[data[i][0]]==-1){
            dfs(data[i][0],idx);
            grps[idx]=[];
            idx++;
        }
    }
    for(let i = 0 ; i < n ; i++){
        grps[vis[data[i][0]]].push(data[i][0]);
    }
    console.log(grps);
    document.getElementById("eqContainer").innerHTML='<h1>Equivalent Classes</h1><h2 id="eqData"></h2>';
    let ans = "",finalData=JSON.parse(JSON.stringify(data));;
    for(let i = 0 ; i <grps.length;i++){
        ans += "{";
        for(let j=0;j<grps[i].length;j++){
            if(j){
                ans += " , ";
            }
            ans += grps[i][j];
        }
        ans += "} ";
    }
    for(let i = 0 ; i < finalData.length ; i ++){
        for(let j = 0 ; j < finalData[i].length ; j ++){
            const n1=window.fsmTable.n,m1=window.fsmTable.m,outp=(window.fsmTable.fsmType=="Mealy"?((m1*(2**n1))):(m1));
            if(j<finalData[i].length-outp){
                finalData[i][j]=String.fromCharCode("A".charCodeAt(0)+vis[finalData[i][j]]);
            }
        }
    }
    finalData=deleteDuplicateRowsInPlace(finalData);
    document.getElementById("eqData").innerHTML=ans;
    const staticTable = new StaticTableGenerator(finalData, 1, 1, window.fsmTable.fsmType);
    staticTable.generateStaticTable('staticTableContainer');
}

