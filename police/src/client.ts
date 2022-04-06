import { CharacterAttributes, Coords, ContextMenuItem } from '../../types/dist';

let characterAttributes: CharacterAttributes = null;

on("core:newAttributes", (newAttributes: CharacterAttributes) => {
    characterAttributes = newAttributes;
});

on("police:sign-in-menu", () => {
    let menu: ContextMenuItem[] = [
        {
            title: "Police Duty Menu"
        }
    ];
    if (characterAttributes && characterAttributes.whitelists.includes("police")) {
        menu.push(
            {
                title: "Sign On Duty",
                action: ["police:sign-on"]
            },
            {
                title: "Sign Off Duty",
                action: ["police:sign-off"]
            }
        );
    } else {
        menu.push({
            title: "Your are not a cop!"
        })
    }
    emit("context-menu:open-menu", menu);
});

on("police:sign-on", () => {
    emit("core:setAttributes", { jobs: ["police"] });
});
on("police:sign-off", () => {
    emit("core:setAttributes", { jobs: [] });
});

let Delay = (ms: number) => new Promise(res => setTimeout(res, ms));
async function createSigninPed() {
    const pedHash = "s_m_y_cop_01";
    const coords: Coords = [440.6850, -978.8528, 29.6896, 182.2415];
    RequestModel(pedHash);
    while (!HasModelLoaded(pedHash)) {
        await Delay(20);
    }

    const ped = CreatePed(0, pedHash, ...coords, false, false);
    FreezeEntityPosition(ped, true);
    SetEntityInvincible(ped, true);
    SetBlockingOfNonTemporaryEvents(ped, true);
    emit("peek:registerPeekablePed", ped, ["police:sign-in-menu"]);
}
createSigninPed();
