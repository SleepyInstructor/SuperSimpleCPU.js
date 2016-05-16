
//Setup simulated CPU
var webcomputer = new computer({
    memorySize : 16,
    inputCallback : function(){
        "use strict";
        var element = document.getElementById("input");
        return element.value;
    },
    outputCallback: function(output){
        "use strict";
        var element = document.getElementById("output");
        element.innerHTML = output;
    }
});
//Initial memory
webcomputer.uploadMemory(["0001000000000001",
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
                         "1111000000000000"]);
//Data binding
//Should probbaly use Angular.js to do this, but I want
//to avoid dependencies on other projects, so code-behind it is!
var registersBindings = {
     registers: webcomputer.cpu.registers,
     ir : "ir",
     pc : "pc",
     acc : "acc",
    state : "state",
    
     update : function(){
         document.getElementById(this.ir).innerHTML = this.registers.ir;
         document.getElementById(this.pc).innerHTML = this.registers.pc;
         document.getElementById(this.acc).innerHTML = this.registers.acc;
         
     }
}
var memoryBindings = {

    memLabel : "memory",
    update:function(){
        document.getElementById(this.memLabel).innerHTML = webcomputer.memory.join("<br>");
    }
}
bindings = [registersBindings, memoryBindings];

//Setup initial display
bindings.forEach(function(Object,number){
    Object.update();
});

//Event HAndlers

function dissassemble(){
    //aliasing
    var memory = webcomputer.dumpMemory();
    var instructionset = webcomputer.cpu.instructionSet;
    var reverseLookup = webcomputer.cpu.reverseLookupTable;
    
    var asm = memory.map(function (bitString, Number){
        var opcode = bitString.substring(0,4); //Assume 4 bit
        var operandString = bitString.substring(4);
        if( reverseLookup.hasOwnProperty(opcode)){
            pnem = reverseLookup[opcode];
            operand = (instructionset[pnem].decodeOperand || function(){ return "";})(operandString);
        }else {
            pnem = "dat";
            operand =  twosComplementToNumber(bitString);
        }
        
        return pnem + " " + operand;   
    });
    var textString = asm.join("\n");
    document.getElementById("codeWindow").value = textString;
     
}
function assemble(){
    //aliases
    var instructionset = webcomputer.cpu.instructionSet;
    var lookupTable = webcomputer.cpu.forwardLookupTable;
    
    var codeBlock = document.getElementById("codeWindow").value;
    var errorLog = [];
    var errorCount = 0;
    var temp= codeBlock.trim().split("\n");
    var asm = temp.map(function(string, lineNum){
        var codeArray = string.trim().split(" ");
        var opcode = codeArray[0];
        if(opcode === "dat"){
            //data
            if(codeArray.length < 2){
                errorCount += 1;
                errorLog.push("Line " + lineNum+": No operand for dat");
                return "0000000000000000";
            } else {
                return numberToTwosComplement(codeArray[1],16);
            }
        } else if(instructionset.hasOwnProperty(codeArray[0])){
            var opcode = instructionset[codeArray[0]].opcode;
            var operand= "000000000000";
            if(instructionset[codeArray[0]].hasOwnProperty("encodeOperand")){
                if(!isNaN(codeArray[1])){
                    operand = instructionset[codeArray[0]].encodeOperand(Number(codeArray[1]),12);
                } else {
                    errorLog.push("Line " + lineNum+": invalid operand");
                    errorCount +=1;
                }
            } else {
                if(codeArray.length > 1){
                  errorLog.push("Line " + lineNum+": Unexpected operand");
                    errorCount +=1;
                }
            }
           return opcode + operand;
                  
        } else {
                  errorCount +=1;
                  errorLog.push("Line " + lineNum+": opcode not recognized");
                 return "0000000000000000";
        }    
    });
    if(errorCount === 0){
        if(asm.length < 16){
            for(var i = asm.length; i < 16; i += 1){
                asm.push("0000000000000000");
            }
        }
        webcomputer.uploadMemory(asm);
    } else {
        document.getElementById("log").innerHTML = errorLog.join("<br>");
    }
    bindings.forEach(function(Object,number){
    Object.update();});
}

function nextInstruction(){
    webcomputer.executeNextInstruction();
    bindings.forEach(function(Object,number){
    Object.update();
});
}
function resetComputer(){
    webcomputer.reset();
    bindings.forEach(function(Object,number){
    Object.update();
});
}
                     
