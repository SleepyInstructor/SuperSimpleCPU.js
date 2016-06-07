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
webcomputer.uploadMemory(["0011000000000101",
    "0001000000000010",
    "1111000000000000",
    "1111000000000000",
    "1111000000000000",
    "1111000000000000",
    "1111000000000000",
    "1111000000000000",
    "1111000000000000",
    "1111000000000000",
    "1111000000000000",
    "1111000000000000",
    "1111000000000000",
    "1111000000000000",
    "1111000000000000",
    "1111000000000000"
]);
//Data Bindings
//This file should be included after other files. Connects up
//the model to view
//Data binding
//Should probbaly use Angular.js to do this, but I want
//to avoid dependencies on other projects, so code-behind it is!

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
        if (typeof(changeHightlights) !== "object") {
            changeHightlights = {};
        }
        var activeCell = changeHightlights.hasOwnProperty("memory") ? changeHightlights.memory : -1;
        var pc = this.registers.pc;

        var newTable = '<table ><tr><th>Index</th><th>Value</th></tr>' + webcomputer.memory.map(function(obj, num) {
            var outString = "";
            var animateClass = num == activeCell ? 'class="memValue touched"' : 'class="memVale"';
            var indexClass = num === pc ? 'class="memIndex pc"' : 'class="memIndex"';
            outString += '<tr><td ' + indexClass + '><label>' + num + ' </label></td>';
            outString += '<td><label ' + animateClass + '>' + obj + '</label></td></tr>';
            return outString;
        }).join("") + '</table>';
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

function dissassemble() {
    "use strict";
    //aliasing
    var memory = webcomputer.dumpMemory();
    var instructionset = webcomputer.cpu.instructionSet;
    var reverseLookup = webcomputer.cpu.reverseLookupTable;


    var asm = memory.map(function(bitString, Number) {
        var opcode = bitString.substring(0, 4); //Assume 4 bit
        var operandString = bitString.substring(4);
        var pnem, operand;
        if (reverseLookup.hasOwnProperty(opcode)) {
            pnem = reverseLookup[opcode];
            operand = (instructionset[pnem].decodeOperand || function() {
                return "";
            })(operandString);
        } else {
            pnem = "dat";
            operand = twosComplementToNumber(bitString);
        }

        return pnem + " " + operand;
    });
    var textString = asm.join("\n");
    document.getElementById("codeWindow").value = textString;

}

function assemble() {
    "use strict";
    //aliases
    var instructionset = webcomputer.cpu.instructionSet;
    var lookupTable = webcomputer.cpu.forwardLookupTable;

    var codeBlock = document.getElementById("codeWindow").value;
    var errorLog = [];
    var errorCount = 0;
    var temp = codeBlock.trim().split("\n");
    var asm = temp.map(function(string, lineNum) {
        var codeArray = string.trim().split(" ");
        var opcode = codeArray[0];
        if (opcode === "dat") {
            //data
            if (codeArray.length < 2) {
                errorCount += 1;
                errorLog.push("Line " + lineNum + ": No operand for dat");
                return "0000000000000000";
            } else {
                return numberToTwosComplement(codeArray[1], 16);
            }
        } else if (instructionset.hasOwnProperty(codeArray[0])) {
            opcode = instructionset[codeArray[0]].opcode;
            var operand = "000000000000";
            if (instructionset[codeArray[0]].hasOwnProperty("encodeOperand")) {
                if (!isNaN(codeArray[1])) {
                    operand = instructionset[codeArray[0]].encodeOperand(Number(codeArray[1]), 12);
                } else {
                    errorLog.push("Line " + lineNum + ": invalid operand");
                    errorCount += 1;
                }
            } else {
                if (codeArray.length > 1) {
                    errorLog.push("Line " + lineNum + ": Unexpected operand");
                    errorCount += 1;
                }
            }
            return opcode + operand;

        } else {
            errorCount += 1;
            errorLog.push("Line " + lineNum + ": opcode not recognized");
            return "0000000000000000";
        }
    });
    if (errorCount === 0) {
        if (asm.length < 16) {
            for (var i = asm.length; i < 16; i += 1) {
                asm.push("0000000000000000");
            }
        }
        webcomputer.uploadMemory(asm);
    } else {
        document.getElementById("log").innerHTML = errorLog.join("<br>");
    }
    updateBindings()
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

function displayInstructions() {
    var instructionContainer = document.getElementById("instructionSet");
    var iTable = generateIntructionHelpTable(webcomputer.cpu.instructionSet);
    instructionContainer.innerHTML = iTable;

}

function generateIntructionHelpTable(instructionSet) {

    if (typeof(instructionSet) !== "object") {
        return "";
    }
    function colWrap(data){ return "<td>" + data + "</td>";}

    var instructions = Object.getOwnPropertyNames(instructionSet);
    var rows = instructions.map(function(object, index){
        return "<tr>"+colWrap(object)+colWrap(instructionSet[object].opcode)+
               colWrap(instructionSet[object].description)+"</tr>";
    });
    var headings = "<tr><th>Mnemonic</th><th>Opcode</th><th>Description</th></tr>";
    return "<table>"+headings+rows.join("")+"</table>";

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

drawUnderlay();
displayInstructions();
