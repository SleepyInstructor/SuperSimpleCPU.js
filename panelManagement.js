//Panel management.
//Code for managing the different panes are here

function adjustVisibility(boxName,panelName){
    var box = document.getElementById(boxName);
    var panel = document.getElementById(panelName);
    if(box.checked){
       panel.removeAttribute("style");
    } else {
        panel.style.visibility = "collapse";

        panel.style.height = "0px";
        panel.style.width = "0px";
    }


}
