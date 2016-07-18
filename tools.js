/*
 *tools.js: File which contains code for the assembler and dissassembler
 *as well as helper functions.
 *The cpuTools contructor will create the assembler and dissembler for a particular computer
 *that is passed in as a parameter.
 */

//Function to find all the symbols on the left hand column
function findSymbols(codeBlock) {
    var symbolTable = codeBlock.reduce(function(hashTable, currentValue, currentIndex, arr) {
        "use strict";
        if (currentValue[0] !== ' ') {
            var stringArray = currentValue.split(" ");
            if (isNaN(stringArray[0])) {
                hashTable[stringArray[0]] = currentIndex;
            }
        }
        return hashTable;
    }, {});
    return symbolTable;
}
//Helper to remove all the symbols and replace them with their numeric values
function stripSymbols(codeBlock) {
    return codeBlock.map(function(object, number) {
        var output = object;
        if (object[0] !== ' ') {
            var arr = object.split(" ");
            arr.shift();
            output = arr.join(" ");

        }
        return output;
    });
}

//Main class, contains the assembler and dissembler, which relies
// on the CPU for the instrution set.
class cpuTools {
    constructor(computer) {
        this.computer = computer;
    }
    assembler(codeBlockString) {
        "use strict";
        //aliases
        var instructionset = this.computer.cpu.instructionSet;
        var lookupTable = this.computer.cpu.forwardLookupTable;
        //Splits the lines, and remove comments
        var codeBlock = codeBlockString.split("\n").map(function(line, num) {
            var commentBegin = line.indexOf(";");
            //remove comments from the end of the line
            //comments begin with a semicolon.
            if (commentBegin === -1) {
                return line;
            } else {
                return line.substring(0, commentBegin);
            }

        });
        var errorLog = [];
        var symbolTable = findSymbols(codeBlock);
        var temp = stripSymbols(codeBlock);

        //convert asm to binary
        var asm = temp.map(function(string, lineNum) {
            var codeArray = string.trim().split(/  */);
            var opcode = codeArray[0];
            //Look for dat opcode indicating data
            if (opcode === "dat" || opcode === "DAT") {
                if (codeArray.length < 2) {
                    errorLog.push("Line " + lineNum + ": No operand for dat");
                    return "0000000000000000";
                } else {
                    return numberToTwosComplement(codeArray[1], 16);
                }
            } else if (instructionset.hasOwnProperty(codeArray[0])) {
                //If the opcode exist in the instruction set
                //convert the operand to binary, according
                //to how the instruction wants the operand encoded.
                opcode = instructionset[codeArray[0]].opcode;
                var operand = "000000000000";
                if (instructionset[codeArray[0]].hasOwnProperty("encodeOperand")) {
                    if (!isNaN(codeArray[1])) {
                        //If the operand is a number, convert
                        operand = instructionset[codeArray[0]].encodeOperand(Number(codeArray[1]), 12);
                    } else if (symbolTable.hasOwnProperty(codeArray[1])) {
                        //If the operand is a symbol, lookup first, then convert
                        operand = instructionset[codeArray[0]].encodeOperand(Number(symbolTable[codeArray[1]]), 12);
                    } else {
                        // expected operand but none found
                        errorLog.push("Line " + lineNum + ": invalid operand");
                    }
                } else {
                    //Did not expect operand, but found one.
                    if (codeArray.length > 1) {
                        errorLog.push("Line " + lineNum + ": Unexpected operand");
                    }
                }
                //concatenate the two parts
                return opcode + operand;
            } else {
                errorLog.push("Line " + lineNum + ": opcode not recognized");
                return "0000000000000000";
            }
        });
        return [errorLog, asm];

    }

    dissassembler() {
        "use strict";
        //aliasing
        var memory = this.computer.dumpMemory();
        return this.dissassemble(memory);
    }

    dissassemble(memArray) {
        var memory = memArray;
        var instructionset = this.computer.cpu.instructionSet;
        var reverseLookup = this.computer.cpu.reverseLookupTable;


        var asm = memory.map(function(bitString, Number) {
            var opcode = bitString.substring(0, 4); //Assume 4 bit
            var operandString = bitString.substring(4);
            var pnem, operand;
            if (reverseLookup.hasOwnProperty(opcode)) {
                //First four bits is an operand
                pnem = reverseLookup[opcode];
                operand = (instructionset[pnem].decodeOperand || function() {
                    return "";
                })(operandString);
            } else {
                //First four bit is not an operand, assume it is data
                pnem = "DAT";
                operand = twosComplementToNumber(bitString);
            }
            return "    " + pnem + " " + operand;
        });
        return asm.join("\n");
    }
}
