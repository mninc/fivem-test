Delay = (ms) => new Promise(res => setTimeout(res, ms));

let characterAttributes = null;
on("core:newAttributes", (newAttributes) => {
    characterAttributes = newAttributes;
});


let inRobZone = false;
on("pz-wrapper:enter", zone => {
    if (zone === "legion-square-bank-robbery") inRobZone = true;
});
on("pz-wrapper:exit", zone => {
    if (zone === "legion-square-bank-robbery") inRobZone = false;
});

on("bank-robbery:use-tool", (id, removeItemEmitTo) => {
    if (inRobZone) {
        emit(removeItemEmitTo, id);
        ExecuteCommand("e hack");
        setTimeout(() => {
            emit("core:setAttributes", { cash: characterAttributes.cash + 2000 });
        }, 6500);
    }
});
