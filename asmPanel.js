//Asm panel is self updating because everything is going to modify the code
//Window.
//There will be one function here, that needs to communicate with another part of the program.
class assemblerWrapper {
    constructor(computer, panel, updatefcn) {
        this.computer = computer;
        this.panel = document.getElementById(panel);
        var computerTools = new cpuTools(computer);
        var dasmButtonRef = this.panel.getElementsByClassName("disassembleButton").item(0);
        dasmButtonRef.addEventListener("click", function() {
            var codeWindow = document.getElementById("codeWindow");
            codeWindow.value = computerTools.dissassembler(webcomputer.memory);
        });
        var asmButtonRef = this.panel.getElementsByClassName("assembleButton").item(0);
        asmButtonRef.addEventListener("click", function assemble() {
            var codeBlock = document.getElementById("codeWindow").value;
            var output = computerTools.assembler(codeBlock);
            var asm = output[1];
            var errorLog = output[0];

            if (errorLog.length === 0) {
                if (asm.length < 16) {
                    for (var i = asm.length; i < 16; i += 1) {
                        asm.push("0000000000000000");
                    }
                }
                computer.uploadMemory(asm);
            } else {
                document.getElementById("log").innerHTML = errorLog.join("<br>");
            }
            updatefcn();
        });
        var selectRef = document.getElementById("asmSelection");
        selectRef.addEventListener("change", function() {
            var selected = Number(document.getElementById("asmSelection").value);
            var program = programs[selected];
            document.getElementById("codeWindow").value = program.asmCode.join("\n");
        });
    };
}
