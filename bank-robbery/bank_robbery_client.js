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

async function start() {
    const hash = "cs_lazlow";
    RequestModel(hash);
    while (!HasModelLoaded(hash)) {
        await Delay(20);
    }

    const bankPed = CreatePed(0, hash, 146.2488, -1058.7614, 29.1861, 178.5029, false, false);
    FreezeEntityPosition(bankPed, true);
    SetEntityInvincible(bankPed, true);
    SetBlockingOfNonTemporaryEvents(bankPed, true);
    emit("peek:registerPeekablePed", bankPed, "bank-robbery:ped");
}
start();

on("bank-robbery:ped", () => {
    emitNet('database:loadShop', "bank-robbery-vendor", 'inventory:shop');
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
