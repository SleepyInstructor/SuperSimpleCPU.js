/* global
  computer, document, twosComplementToNumber, numberToTwosComplement
  */
//Setup simulated CPU
var webcomputer = new computer({
    memorySize: 16,
    inputCallback: function() {
        "use strict";
        var element = document.getElementById("input");
        return element.value;
    },
    outputCallback: function(output) {
        "use strict";
        var element = document.getElementById("output");
        var cleanUpOutput = function() {
            element.classList.remove("touched");
            element.removeEventListener("animationend", cleanUpOutput, false);
        }
        element.classList.add("touched");
        element.addEventListener("animationend", cleanUpOutput, false);
        element.innerHTML = output;
    }
});
//Initial memory
var computerTools = new cpuTools(webcomputer);
//Data Bindings
//This file should be included after other files. Connects up
//the model to view
//Data binding
//Should probbaly use Angular.js to do this, but I want
//to avoid dependencies on other projects, so code-behind it is!

webcomputer.uploadMemory(computerTools.assembler(programs[0].asmCode.join("\n"))[1]);

function addFlashEffect(element) {
    var cleanUp = function() {
        element.classList.remove("touched");
        element.removeEventListener("animationend", cleanUp, false);
    }
    element.classList.add("touched");
    element.addEventListener("animationend", cleanUp, false);
}
var registersBindings = {
    computer: webcomputer,
    registers: webcomputer.cpu.registers,
    ir: "ir",
    pc: "pc",
    acc: "acc",
    state: "state",

    update: function(changeHightlights) {

        var irElement = document.getElementById(this.ir);
        var pcElement = document.getElementById(this.pc);
        var accElement = document.getElementById(this.acc);
        var stateElement = document.getElementById(this.state);
        if (typeof(changeHightlights) !== "object") {
            // force changeHighlights to be an object
            // so the rest of the code is simpler.
            changeHightlights = {};
        }
        stateElement.innerHTML = this.computer.cpu.state;
        irElement.innerHTML = this.registers.ir;
        pcElement.innerHTML = this.registers.pc;
        accElement.innerHTML = this.registers.acc;

        if (changeHightlights.hasOwnProperty("ir")) {
            addFlashEffect(irElement);
        }
        if (changeHightlights.hasOwnProperty("pc")) {
            addFlashEffect(pcElement);
        }
        if (changeHightlights.hasOwnProperty("acc")) {
            addFlashEffect(accElement);
        }

    }
};
var memoryBindings = {

    memLabel: "memory",
    registers: webcomputer.cpu.registers,
    update: function(changeHightlights) {
        var memOption = document.getElementById("binaryOption");
        var binaryMode = memOption.checked;


        if (typeof(changeHightlights) !== "object") {
            changeHightlights = {};
        }
        var dc = computerTools.dissassembler().split("\n").map(function(st,num){return st.trim()});
        var activeCell = changeHightlights.hasOwnProperty("memory") ? changeHightlights.memory : -1;
        var pc = this.registers.pc;

        var newTable = '<table ><tr><th>Index</th><th>Value</th></tr>' + webcomputer.memory.map(function(obj, num) {
            var outString = "";
            var animateClass = num == activeCell ? 'class="memValue touched"' : 'class="memVale"';
            var displayNumber = binaryMode ? obj : binaryToNumber(obj);
            var indexClass = num === pc ? 'class="memIndex pc"' : 'class="memIndex"';
            outString += '<tr><td ' + indexClass + '><label>' + num + ' </label></td>';
            outString += '<td><label ' + animateClass + ' title="'+ dc[num]+'">' + displayNumber + '</label></td></tr>';
            return outString;
        } ).join("") + '</table>';
        document.getElementById(this.memLabel).innerHTML = newTable;
    }
};
var bindings = [registersBindings, memoryBindings];

function updateBindings(changeHightlights) {
    "use strict";
    bindings.forEach(function(Object, number) {
        Object.update(changeHightlights);
    });
}
updateBindings();

//Event Handlers

function assemble() {
    var codeBlock = document.getElementById("codeWindow").value;
    var output =  computerTools.assembler(codeBlock);
    var asm = output[1];
    var errorLog = output[0];

    if (errorLog.length === 0) {
        if (asm.length < 16) {
            for (var i = asm.length; i < 16; i += 1) {
                asm.push("0000000000000000");
            }
        }
        webcomputer.uploadMemory(asm);
    } else {
        document.getElementById("log").innerHTML = errorLog.join("<br>");
    }
    updateBindings();
}

//Event handlers
function nextInstruction() {
    "use strict";
    if (webcomputer.cpu.state == webcomputer.cpu.CPUstates.stopped) {
        return;
    }

    function execPart1() {
        var currentPC = webcomputer.cpu.pc;
        webcomputer.executeClockPulse(); //perform fetch instruction
        //animate fetch
        animation("memoryToAcc", execPart2, "instructions");
    }


    //update bindings to reflect update in the PC and IR

    function execPart2() {
        updateBindings({
            ir: "changed",
            pc: "changed"
        });
        //Perform the remainder of the cycles
        webcomputer.executeNextInstruction();

        //Get animation data.
        //JavaScript Promises would be great here actually.
        //Sticking with the simple stuff for now.

        if (webcomputer.cpu.instructionSet[webcomputer.opcode].hasOwnProperty("dataTransferDirection")) {
            var dt = webcomputer.cpu.instructionSet[webcomputer.opcode].dataTransferDirection(webcomputer.operand, webcomputer.memory);

            var animeString = "none";
            var configObject = {};
            var val;
            if (dt.to === "acc" && dt.from === "memory") {
                animeString = "memoryToAcc";
                val = dt.val;
                configObject.acc = "";
            } else if (dt.from === "acc" && dt.to === "memory") {
                animeString = "accToMemory";
                val = dt.val;
                configObject.memory = binaryToNumber(webcomputer.operand);
            } else if (dt.to === "acc" && dt.from === "input") {
                animeString = "ioToAcc";
                val = dt.val;
                configObject.acc = "";
            } else if (dt.to === "output" && dt.from === "acc") {
                animeString = "accToIo";
                val = twosComplementToNumber(dt.val);
                configObject.output = "";
            } else if (dt.to === "acc") {
                animeString = "none";
                val = "";
                configObject.acc = "";
            } else {
                animeString = "none";
                val = "";
            }
            if (animeString !== "none") {


                animation(animeString, updateBindings.bind(this, configObject), val);
            } else {
                updateBindings(configObject);
            }
        } else {
            updateBindings();
        }
    }

    execPart1(); //Part 2 is executed inside part 1.
}

//Execute the program, without doing intermediate updates.
function executeProgram() {
    while (webcomputer.cpu.state !== webcomputer.cpu.CPUstates.stopped) {
        webcomputer.executeNextInstruction();
    }
    updateBindings();
}

function resetComputer() {
    "use strict";
    webcomputer.reset();
    updateBindings();
}


function generateIntructionHelpTable(instructionSet) {

    if (typeof(instructionSet) !== "object") {
        return "";
    }

    function colWrap(data) {
        return "<td>" + data + "</td>";
    }

    var instructions = Object.getOwnPropertyNames(instructionSet);
    var rows = instructions.map(function(object, index) {
        return "<tr>" + colWrap(object) + colWrap(instructionSet[object].opcode) +
            colWrap(instructionSet[object].description) + "</tr>";
    });
    var headings = "<tr><th>Mnemonic</th><th>Opcode</th><th>Description</th></tr>";
    return "<table>" + headings + rows.join("") + "</table>";

}
/*Helpers */
function animation(anime, afterFunction, val) {
    "use strict";
    var container = document.getElementById("cpucontainer");
    var label = document.createElement("LABEL");
    label.innerHTML = val;
    label.style.position = "absolute";
    label.style.top = "200px";
    label.style.animationName = anime;
    label.style.animationDuration = "1s";
    //The element will remove itself once the animation ends
    var cleanup = function() {
        container.removeChild(label);
        afterFunction();
    }
    label.addEventListener("animationend", cleanup, false);
    container.appendChild(label);
}
//Draws the underlay for the graphics
function drawUnderlay() {
    var canvas = document.getElementById("underlay");
    var ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.lineTo(50, 50);
    ctx.lineTo(50, 150);
    ctx.lineTo(400, 150);
    ctx.stroke();
    ctx.beginPath();
    ctx.lineTo(250, 100);
    ctx.lineTo(250, 150);
    ctx.stroke();
};

function clearMem() {
    for (var i = 0; i < webcomputer.memory.length; i += 1) {
        webcomputer.memory[i] = "0000000000000000";
    }
    updateBindings();
}

function updateMem(){
    memoryBindings.update();
}
function populateDropDowns(){
    var dropDown = document.getElementById("asmSelection");
    var memDropDown = document.getElementById("memSelection");
    var options = programs.map( function(obj,number){
        return "<option value = '"+number+"'>"+obj.name+"</option>"
    }).join("");
    dropDown.innerHTML = options;
    memDropDown.innerHTML = options;

}
function loadAsm(){
    var selected = Number(document.getElementById("asmSelection").value);
    var program = programs[selected];
    document.getElementById("codeWindow").value = program.asmCode.join("\n");

}
function loadMem(){
    var selected = Number(document.getElementById("memSelection").value);
    var program = programs[selected];
    var binary = computerTools.assembler(program.join("\n"));
    //Ignore errors
    webcomputer.uploadMemory(binary[1]);
    updateBindings();

}


//for future refactoring.
var helpPanelObject;
var assemblerPanelObject;
function setup(){

    drawUnderlay();
    helpPanelObject = new helpWrapper(webcomputer, "instructionSet");
    assemblerPanelObject = new assemblerWrapper(webcomputer, "disassemblywindow", updateBindings);
    populateDropDowns();
}
