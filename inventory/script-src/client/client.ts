interface ItemAttributes {
    _id?: string;
    item_id: string;
}
interface Item extends ItemAttributes {
    ammo?: number;
    icon: string;
    name: string;
    description: string;
    type: "weapon" | "consumable" | "equipment";
    weapon_hash?: string;
    cost?: number;
}
interface ContainerSlot {
    items: Item[]
}
type Container = ContainerSlot[];
interface Inventory {
    character: Container;
    container: Container;
}
interface CharacterAttributes {
    cid: number;
    health: number;
    ped: string;
    cash: number;
    phoneNumber: number;
}



RegisterKeyMapping('inventory', 'Inventory', 'keyboard', 'h');
let inventoryOpen = false;
let otherContainer: string;
RegisterCommand('inventory', async () => {
    if (inventoryOpen) {
        inventoryOpen = false;
        SetNuiFocus(
            false, false
        );
        SendNuiMessage(JSON.stringify({ action: "disable_inventory" }));
    } else {
        inventory.container = [];
        inventoryChange();
        otherContainer = getBin();
        if (otherContainer) {
            emitNet('database:loadContainer', GetPlayerServerId(PlayerId()), { type: otherContainer.split("-")[0], identifier: otherContainer }, 'inventory:loadedContainer');
        }
        inventoryOpen = true;
        SetNuiFocusKeepInput(true);
        SetNuiFocus(
            true, true
        );
        SendNuiMessage(JSON.stringify({ action: "enable_inventory", shop: false }));
    }
}, false);

onNet('inventory:shop', async (shopInventory: Container) => {
    inventory.container = shopInventory;
    inventoryChange();
    inventoryOpen = true;
    SetNuiFocusKeepInput(true);
    SetNuiFocus(
        true, true
    );
    SendNuiMessage(JSON.stringify({ action: "enable_inventory", shop: true, cash: characterAttributes.cash }));
});

function inventoryChange() {
    SendNuiMessage(JSON.stringify({ action: "inventory", inventory }));
}

setTick(() => {
    if (inventoryOpen) {
        DisableControlAction(0, 24, true);
        DisableControlAction(0, 25, true);
        DisableControlAction(0, 257, true);

        // looking around
        DisableControlAction(0, 1, true);
        DisableControlAction(0, 2, true);
        DisableControlAction(0, 4, true);
        DisableControlAction(0, 6, true);
        DisableControlAction(0, 270, true);
        DisableControlAction(0, 271, true);
        DisableControlAction(0, 272, true);
        DisableControlAction(0, 273, true);
    }
});

on('onResourceStart', (resource: string) => {
    if (resource !== "inventory") return;
    SetWeaponsNoAutoswap(true);
    const ped = PlayerPedId();
    RemoveAllPedWeapons(ped, true);
});

const inventory: Inventory = {
    character: [],
    container: []
};

onNet('inventory:loadedContainer', async (container: Container) => {
    inventory.container = container;
    inventoryChange();
});

onNet('inventory:loadedInventory', async (characterInventory: Container) => {
    inventory.character = characterInventory;
    inventoryChange();
});

let characterAttributes: CharacterAttributes = null;
on("core:newAttributes", (newAttributes: CharacterAttributes) => {
    if (characterAttributes === null || characterAttributes.cid !== newAttributes.cid) {
        inventory.character = [];
        emitNet('database:loadContainer', GetPlayerServerId(PlayerId()), { type: 'inventory', identifier: newAttributes.cid.toString() }, 'inventory:loadedInventory');
    }
    characterAttributes = newAttributes;
});

on("inventory:receiveItem", (item: ItemAttributes) => {
    emitNet('database:newItem', GetPlayerServerId(PlayerId()), { item, container: { type: 'inventory', identifier: characterAttributes.cid.toString() } }, { itemAdded: 'inventory:newItem', container: 'inventory:loadedInventory' });
});
onNet('inventory:newItem', async (item: Item) => {
    SendNuiMessage(JSON.stringify({ action: "showItem", item: { title: "Received 1x", icon: item.icon, name: item.name, _id: item._id } }));
});
on('inventory:removeItem', async (item: String) => {
    emitNet('database:deleteItem', GetPlayerServerId(PlayerId()), { item, container: { type: 'inventory', identifier: characterAttributes.cid.toString() } }, { itemRemoved: 'inventory:removedItem', container: 'inventory:loadedInventory' });
});
onNet('inventory:removedItem', async (item: Item) => {
    SendNuiMessage(JSON.stringify({ action: "showItem", item: { title: "Removed 1x", icon: item.icon, name: item.name, _id: item._id } }));
});

RegisterNuiCallbackType('buyItems');
on('__cfx_nui:buyItems', (data: { items: string[] }, cb: Function) => {
    cb();
    emitNet('database:boughtItems', GetPlayerServerId(PlayerId()), data.items, 'inventory:boughtItemsData');
});

onNet('inventory:boughtItemsData', async (items: string[]) => {
    SendNuiMessage(JSON.stringify({ action: "bought_items", items }));
});


RegisterNuiCallbackType('closeInventory');
on('__cfx_nui:closeInventory', (_: any, cb: Function) => {
    SetNuiFocus(
        false, false
    );
    inventoryOpen = false;
    cb();
});

RegisterNuiCallbackType('cashChange');
on('__cfx_nui:cashChange', (data: any, cb: Function) => {
    cb();
    emit("core:setAttributes", { cash: characterAttributes.cash + data.change });
});

RegisterNuiCallbackType('updatedInventory');
on('__cfx_nui:updatedInventory', (data: any, cb: Function) => {
    cb();

    emitNet('database:updateContainer', GetPlayerServerId(PlayerId()), { query: { type: 'inventory', identifier: characterAttributes.cid.toString() }, items: data.inventory.inventory }, 'inventory:loadedInventory');
    if (otherContainer && data.inventory.container.length) {
        emitNet('database:updateContainer', GetPlayerServerId(PlayerId()), { query: { type: otherContainer.split("-")[0], identifier: otherContainer }, items: data.inventory.container }, 'inventory:loadedContainer');
    }
});

function wait(time: number) {
    return new Promise(resolve => {
        setTimeout(resolve, time);
    });
}

let itemEquipped: null | string = null;
let currentAmmo: number = -1;
let ammoCheckInterval: NodeJS.Timer;

async function useItem(item: Item) {
    if (item.type === "weapon") {
        const ped = PlayerPedId();
        const currentWeapon = GetCurrentPedWeapon(ped, true)[1];
        if (!itemEquipped) {
            RemoveAllPedWeapons(ped, true);
            GiveWeaponToPed(ped, item.weapon_hash, item.ammo, false, true);
            currentAmmo = item.ammo;
            SendNuiMessage(JSON.stringify({ action: "showItem", item: { title: "Equipped", icon: item.icon, name: item.name, _id: item._id } }));
            itemEquipped = item.weapon_hash;
            ammoCheckInterval = setInterval(() => {
                let newAmmo = GetAmmoInPedWeapon(ped, item.weapon_hash);
                if (newAmmo !== currentAmmo) {
                    currentAmmo = newAmmo;
                    emitNet('database:setWeaponAmmo', GetPlayerServerId(PlayerId()), item._id, newAmmo);
                }
            }, 2000);
        } else {
            GiveWeaponToPed(ped, "weapon_unarmed", 0, false, true);
            SendNuiMessage(JSON.stringify({ action: "showItem", item: { title: "Holstered", icon: item.icon, name: item.name, _id: item._id } }));
            itemEquipped = null;
            clearInterval(ammoCheckInterval);
            currentAmmo = undefined;
        }
    } else if (item.type === "equipment") {
        if (item.item_id === "hacking_tool") {
            emit("bank-robbery:use-tool", item._id, "inventory:removeItem");
        }
    }
}

RegisterNuiCallbackType('useItem')
on('__cfx_nui:useItem', async (data: { item: Item }, cb: Function) => {
    cb();
    SetNuiFocus(
        false, false
    );
    await useItem(data.item);
});

RegisterCommand('invuse', async (source: number, args: string[]) => {
    let slot = parseInt(args[0]);
    if (!slot) return;
    slot -= 1;

    let invSlot = inventory.character[slot];
    if (!invSlot) return;
    let item = invSlot.items[0];
    if (!item) return;
    await useItem(item);
}, false);
RegisterKeyMapping('invuse 1', 'Inventory Slot 1', 'keyboard', '1');
RegisterKeyMapping('invuse 2', 'Inventory Slot 2', 'keyboard', '2');
RegisterKeyMapping('invuse 3', 'Inventory Slot 3', 'keyboard', '3');
RegisterKeyMapping('invuse 4', 'Inventory Slot 4', 'keyboard', '4');

RegisterNuiCallbackType('elementFocus')
on('__cfx_nui:elementFocus', (data: { focus: boolean }, cb: Function) => {
    cb();
    SetNuiFocusKeepInput(!data.focus);
});


const dumpsterModels = ["prop_cs_dumpster_01a", "p_dumpster_t", "prop_dumpster_3a", "prop_dumpster_4b", "prop_dumpster_4a", "prop_dumpster_01a", "prop_dumpster_02b", "prop_dumpster_02a", "prop_snow_dumpster_01"];
const dumpsterHashes = dumpsterModels.map(model => GetHashKey(model));

function getBin() {
    const pC = GetEntityCoords(PlayerPedId(), false);
    const closestEntity = {
        entity: null,
        distance: Number.MAX_SAFE_INTEGER,
    };
    function processEntity(entity: number) {
        const type = GetEntityType(entity);
        if (type === 0 || type === 1) return; // no 'no object' or peds. need to add vehicle
        const eC = GetEntityCoords(entity, true);
        const distance = Math.hypot(pC[0] - eC[0], pC[1] - eC[1], pC[2] - eC[2]);
        if (distance < 5 && distance < closestEntity.distance) {
            const hash = GetEntityModel(entity);
            if (dumpsterHashes.includes(hash)) {
                closestEntity.entity = entity;
                closestEntity.distance = distance;
            }
        }
    }
    const firstObject = FindFirstObject(0);
    processEntity(firstObject[1]);
    let nextObject = FindNextObject(firstObject[0]);
    while (nextObject[0]) {
        processEntity(nextObject[1]);
        nextObject = FindNextObject(firstObject[0]);
    }
    EndFindObject(firstObject[0]);
    if (!closestEntity.entity) return;

    //const type = GetEntityType(closestEntity.entity);
    const eC = GetEntityCoords(closestEntity.entity, true);
    return `dumpster-${Math.round(eC[0])}-${Math.round(eC[1])}-${Math.round(eC[2])}`;
    // not the best system. improvements coule be made:
    // get coords when it first loads in (always spawns in unmoved?), a check for a saved dumpster within a few units around instead of just rounding
}
