class helpWrapper {
    constructor(computer, panel){

        this.computer = computer;
        //Populate the panel

        var instructionContainer = document.getElementById(panel);
        var iTable = generateIntructionHelpTable(computer.cpu.instructionSet);
        instructionContainer.innerHTML = iTable;

        this.helpBox = document.getElementById(panel);
    }
    //No methods, since this object does nothing, once it is setup.

}
