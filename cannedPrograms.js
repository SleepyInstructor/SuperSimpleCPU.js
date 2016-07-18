/*
 * example simple CPU programs
 */
var programs = [{
        name: "sequence",
        asmCode: ["    LDI  5",
            "    ADD  X",
            "    STO  Y",
            "    STP",
            "X   DAT  40",
            "Y   DAT  0"
        ]
    }, {
        name: "input/output",
        asmCode: ["    INP",
            "    OUT",
            "    STP"

        ]
    }, {
        name: "Negative Numbers",
        asmCode: ["    LDI  4",
            "    SUB  5",
            "    STP",
            "    DAT  0      ; Filler",
            "    DAT  0      ; More filler",
            "    DAT  6      ; The data number",

        ]

    }, {
        name: "Copy Number",
        asmCode: ["    LDI  13     ; Notice how LDI differs from",
            "    LOD  13     ; LOD!",
            "    STO  12     ; Store ACC into memory cell 12",
            "    STP",
            "    DAT  0      ; Lots of Filler",
            "    DAT  0      ;",
            "    DAT  0      ;",
            "    DAT  0      ;",
            "    DAT  0      ;",
            "    DAT  0      ;",
            "    DAT  0      ;",
            "    DAT  0      ;",
            "    DAT  6      ; The data number"

        ]
    }, {
        name: "Counting loop",
        asmCode: ["     LDI  6     ; How many times thru the loop",
            "TOP  JNG  DONE  ; Top of the loop",
            "     SUB  ONE   ; Subtract 1",
            "     JMP  TOP   ; Bottom of the loop",
            "DONE STP        ; Stop the program",
            "ONE  DAT  1     ; A data value, the constant 1"
        ]
    }, {
        name: "GCD",
        asmCode: ["TOP  LOD  A     ;loop; if (A = B) then",
            "     SUB  B     ;    ",
            "     JZR  DONE  ;    exit;",
            "     JNG  ELSE  ;if (A > B) then",
            "     STO  A     ;    A = A - B",
            "     JMP  TOP   ;",
            "ELSE LOD  B     ;else",
            "     SUB  A     ;",
            "     STO  B     ;    B = B - A",
            "     JMP  TOP   ;endloop",
            "DONE STP        ;stop",
            "     DAT  0     ;(filler, 3 memory cells)",
            "     DAT  0     ;",
            "     DAT  0     ;",
            "A    DAT  18    ;A = 18",
            "B    DAT  24    ;B = 24"
        ]

}];
