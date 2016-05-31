/*jshint
   moz : true
*/
/*globals
   class, leftpad, console
*/
//Class basic computer 
function leftPad(size, baseString, padChar) {
    "use strict";
    return Array(size - baseString.length).fill(padChar).join("") + baseString;
}

function twosComplementToNumber(encodedString) {
    "use strict";
    var leadingOne=encodedString.charAt(0) === '1';
    var newString = leadingOne ?
        encodedString.split("").map(function(val) {
            return val === '0' ? '1' : '0';
        }).join("") :
        encodedString;
    return leadingOne ? -(parseInt(newString, 2) + 1) : parseInt(newString, 2);
}

function numberToTwosComplement(number, numBits) {
    "use strict";
    var neg = number < 0;
    var posNum = !neg ? Math.abs(number) : Math.abs(number) - 1;
    var baseNumber = leftPad(numBits, posNum.toString(2), '0');
    var newNumber = neg ?
        baseNumber.split("").map(function(val) {
            return val === '0' ? '1' : '0';
        }).join("") :
        baseNumber;
    return newNumber;
}

function binaryToNumber(encodedString) {
     "use strict";
    return parseInt(encodedString, 2);
}

function numberToBinary(number, numbits) {
     "use strict";
    return leftPad(numbits, number.toString(2), "0");
}
//The CPU with the the registers and opcodes
//
class dataTransferObject {
    constructor(pTo, pFrom, pValue) {
        this.to = pTo;
        this.from = pFrom;
        this.val = pValue;
    }
}
class CPU {
    constructor(inputCallback, outputCallback) {
        this.inputCallback = inputCallback;
        this.outputCallback = outputCallback;
        this.CPUstates = {
            stopped: "stopped",
            normal: "normal"
        };
        this.state = this.CPUstates.normal;

        this.registers = {

            pc: 0,
            acc: 0,
            ir: 0
        };


        this.instructionSet = {
            "STP": {
                opcode: "1111",
                execute: function(operand) {
                     "use strict";
                    this.state = this.CPUstates.stopped;
                }.bind(this)
            },
            "ADD": {
                opcode: "0001",
                execute: function(operand) {
                     "use strict";
                    this.registers.acc = parseInt(this.registers.acc) +twosComplementToNumber(operand);
                }.bind(this),
                decodeOperand: twosComplementToNumber,
                encodeOperand: numberToTwosComplement,
                dataTransferDirection: function(operand, memory) {
                     "use strict";
                    return new dataTransferObject("acc", undefined, undefined);
                }
            },
            "SUB": {
                opcode: "0010",
                execute: function(operand) {
                     "use strict";
                    this.registers.acc -= twosComplementToNumber(operand);
                }.bind(this),
                decodeOperand: twosComplementToNumber,
                encodeOperand: numberToTwosComplement,
                dataTransferDirection: function(operand, memory) {
                     "use strict";
                    return new dataTransferObject("acc", undefined, undefined);
                }
            },
            "LOD": {
                opcode: "0011",
                load: function(operand, memory) {
                     "use strict";
                    var address = parseInt(operand, 2);
                    var value = twosComplementToNumber(memory[address]);
                    this.registers.acc = value;
                }.bind(this),
                decodeOperand: binaryToNumber,
                encodeOperand: numberToBinary,
                dataTransferDirection: function(operand, memory) {
                     "use strict";
                    var address = parseInt(operand, 2);
                    return new dataTransferObject("acc", "memory", twosComplementToNumber(memory[address]));
                }
            },
            "LDI": {
                opcode: "0100",
                load: function(operand, memory) {
                     "use strict";
                    this.registers.acc = twosComplementToNumber(operand);
                }.bind(this),
                decodeOperand: twosComplementToNumber,
                encodeOperand: numberToTwosComplement,
                dataTransferDirection: function(operand, memory) {
                     "use strict";
                    return new dataTransferObject("acc", undefined, undefined);
                }
            },
            "STO": {
                opcode: "0101",
                execute: function(operand) {
                     "use strict";
                    var address = parseInt(operand, 2);
                    memory[address] = numberToTwosComplement(this.registers.acc, 16);
                }.bind(this),
                decodeOperand: binaryToNumber,
                encodeOperand: numberToBinary,
                dataTransferDirection: function(operand, memory) {
                     "use strict";
                    return new dataTransferObject("memory", "acc", numberToTwosComplement(this.registers.acc, 16));
                }.bind(this)
            },
            "INP": {
                opcode: "0110",
                execute: function(operand) {
                     "use strict";
                    this.registers.acc = this.inputCallback();
                }.bind(this),
                dataTransferDirection: function(operand, memory) {
                     "use strict";
                    return new dataTransferObject("acc", "input", this.inputCallback());
                }.bind(this)

            },
            "OUT": {
                opcode: "0111",
                execute: function(operand) {
                    this.outputCallback(this.registers.acc);
                }.bind(this),
                dataTransferDirection: function(operand, memory) {
                     "use strict";
                    return new dataTransferObject("output", "acc", numberToTwosComplement(this.registers.acc, 16));
                }.bind(this)
            },
            "JMP": {
                opcode: "1000",
                execute: function(operand) {
                     "use strict";
                    this.registers.pc = parseInt(operand, 2);
                }.bind(this),
                decodeOperand: binaryToNumber,
                encodeOperand: numberToBinary
            },
            "JNG": {
                opcode: "1001",
                execute: function(operand) {
                     "use strict";
                    if (this.registers.acc < 0) {
                        this.registers.pc = parseInt(operand, 2);
                    }
                }.bind(this),
                decodeOperand: binaryToNumber,
                encodeOperand: numberToBinary
            },
            "JZR": {
                opcode: "1010",
                execute: function(operand) {
                     "use strict";
                    if (this.registers.acc === 0) {
                        this.registers.pc = parseInt(operand, 2);
                    }
                }.bind(this),
                decodeOperand: binaryToNumber,
                encodeOperand: numberToBinary
            }

        };
        this.forwardLookupTable = function(IS) {
            var table = {};
            for (var prop in IS) {
                table[prop] = IS[prop].opcode;
            }
            return table;
        }(this.instructionSet);
        this.reverseLookupTable = function(IS) {
            var table = {};
            for (var prop in IS) {
                table[IS[prop].opcode] = prop;
            }
            return table;
        }(this.instructionSet);
    }
    reset() {
        for (var prop in this.registers) {
            this.registers[prop] = 0;
        }
        this.state = this.CPUstates.normal;
    }

}

//Basic computer with 4 micro-operations
//Fetch phase: get the instruction from memory
//             Update the PC
//Decode:      seperate the operand and operator
//load:        load and data from memory to the appropriate register
//exec:        Run the instruction, which can include one of
//             1)Modifying the registers
//             2)storing data to memory
//             3)Changing the PC based on jump statements
class computer {
    constructor(config) {
        if (typeof(config) !== "object") {
            console.error("Expected configuration object as input parameter.");
            console.error("{ memorySize: ..., inputCallback : function(){...}, outputCallback : function(outWord){...}}");
            return;
        }
        this.cpu = new CPU(config.inputCallback || function() {
                return 0;
            },
            config.outputCallback || function(outWord) {});
        this.memory = new Array(config.memorySize || 16); //default 16 words
        this.opcode = "";
        this.operand = "";

        this.ProcessorStates = {
            fetch: "fetch",
            decode: "decode",
            load: "load",
            exec: "exec"
        };
        this.NextState = {
            fetch: "decode",
            decode: "load",
            load: "exec",
            exec: "fetch"
        };
        this.currentState = this.ProcessorStates.fetch;
    }
    //CPU actions based on state
    fetch() {
        //fetch retries the instruction from memory
        this.cpu.registers.ir = this.memory[this.cpu.registers.pc];
        this.cpu.registers.pc += 1;
    }
    decode() {

        var i = 0;
        var irString = this.cpu.registers.ir;
        var found = false;
        for (i = 1; i < irString.length; i += 1) {
            if (this.cpu.reverseLookupTable.hasOwnProperty(irString.substring(0, i))) {
                this.opcode = this.cpu.reverseLookupTable[irString.substring(0, i)];
                this.operand = irString.substring(i, irString.length);
                found = true;
                break;
            }
        }
        if (!found) {
            this.cpu.state = this.cpu.CPUstates.stopped;

        } else if (this.cpu.instructionSet[this.opcode].hasOwnProperty("loadSetup")) {
            this.cpu.instructionSet[this.opcode].loadSetup(this.operand);
        }

    }
    load() {
        if (this.cpu.instructionSet[this.opcode].hasOwnProperty("load")) {
            this.cpu.instructionSet[this.opcode].load(this.operand,this.memory);
        }
    }
    exec() {
        if (this.cpu.instructionSet[this.opcode].hasOwnProperty("execute")) {
            this.cpu.instructionSet[this.opcode].execute(this.operand,this.memory);
        }

    }
    //Changes the content of the memory
    uploadMemory(mem) {
        this.memory = mem.slice();
    }
    //return a copy of the memory
    dumpMemory() {
        return this.memory.slice();
    }

    //Reset the CPU, the cpu will not run if it
    //enters a stopped state, and needs to be reset.
    reset() {
        this.cpu.reset();
        this.currentState = this.ProcessorStates.fetch;
    }
    //If an instruction is in a the middle of the decode/fetch/load/execute cycle
    //this command will finish that cycle.
    //If the cpu is in the fectch state, it will fininsh one complete cycle
    executeNextInstruction() {
        if (this.cpu.state === this.cpu.CPUstates.normal) {
            switch (this.currentState) {
                case this.ProcessorStates.fetch:
                    this.executeClockPulse();
                case this.ProcessorStates.decode:
                    this.executeClockPulse();
                case this.ProcessorStates.load:
                    this.executeClockPulse();
                case this.ProcessorStates.exec:
                    this.executeClockPulse();
            }
        }
    }
    //Execute 1 step of the cycle
    //This allows illustration of the cycle in the UI.
    executeClockPulse() {
        this[this.currentState]();
        this.currentState = this.NextState[this.currentState];
    }
}
