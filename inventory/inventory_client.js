RegisterKeyMapping('inventory', 'Inventory', 'keyboard', 'h');
let inventoryOpen = false;
RegisterCommand('inventory', async () => {
  if (inventoryOpen) {
    inventoryOpen = false;
    SetNuiFocus(
      false, false
    );
    SendNuiMessage(JSON.stringify({ action: "disable_inventory" }));
  } else {
    inventoryOpen = true;
    emitNet('database:loadInventory', GetPlayerServerId(PlayerId()), { action: "show_inventory" }, getBin());
  }
});

setTick(() => {
  if (inventoryOpen) {
    DisableControlAction(0, 24, true);
    DisableControlAction(0, 25, true);
    DisableControlAction(0, 257, true);
  }
});

on('onResourceStart', resource => {
  if (resource !== "inventory") return;
  SetNuiFocusKeepInput(true);
  SetWeaponsNoAutoswap(true);
  const ped = PlayerPedId();
  RemoveAllPedWeapons(ped);
});

onNet('inventory:inventoryContents', async (data, inventory, container, items) => {
  //console.log(data);
  let itemMap = {};
  items.forEach(item => itemMap[item._id] = item);

  function mapItems(items) {
    for (let i = 0; i < items.length; i++) {
      for (let j = 0; j < items[i].length; j++) {
        items[i][j] = itemMap[items[i][j]];
      }
    }
  }

  mapItems(inventory.items);
  if (container) mapItems(container.items);

  if (data.action === "show_inventory") {
    inventoryOpen = true;
    SetNuiFocus(
      true, true
    );
    SendNuiMessage(JSON.stringify({ action: "enable_inventory", inventory, container }));
  } else if (data.action === "equip_slot") {
    const item = inventory.items[data.slot - 1][0];
    console.log(item);
    if (!item || item.type !== "weapon") return;
    await equipWeapon(item.weapon_hash, item.ammo, item.icon, item._id);
  }
});

RegisterNuiCallbackType('nuiFocusOff')
on('__cfx_nui:nuiFocusOff', (data, cb) => {
  SetNuiFocus(
    false, false
  );
  cb();
});

function wait(time) {
  return new Promise(resolve => {
    setTimeout(resolve, time);
  });
}


let itemEquipped = false, currentAmmo, ammoCheckInterval;
async function equipWeapon(hash, ammo, icon, mongoID) {
  const ped = PlayerPedId();
  const currentWeapon = GetCurrentPedWeapon(ped)[1];
  if (!itemEquipped) {
    RemoveAllPedWeapons(ped);
    GiveWeaponToPed(ped, hash, ammo, false, true);
    currentAmmo = ammo;
    SendNuiMessage(JSON.stringify({ action: "equip_item", icon }));
    itemEquipped = hash;
    ammoCheckInterval = setInterval(() => {
      let newAmmo = GetAmmoInPedWeapon(ped, hash);
      if (newAmmo !== currentAmmo) {
        currentAmmo = newAmmo;
        emitNet('database:setWeaponAmmo', GetPlayerServerId(PlayerId()), mongoID, newAmmo);
      }
    }, 2000);
  } else {
    
    //SetPedAmmo(ped, itemEquipped, 0);
    GiveWeaponToPed(ped, "weapon_unarmed", 0, false, true);
    itemEquipped = false;
    clearInterval(ammoCheckInterval);
    currentAmmo = undefined;
  }
}

RegisterNuiCallbackType('equipWeapon')
on('__cfx_nui:equipWeapon', async (data, cb) => {
  SetNuiFocus(
    false, false
  );
  await equipWeapon(data.weapon_hash, data.ammo, data.icon, data._id);

  cb();
});

RegisterCommand('invuse', async (source, args) => {
  const slot = parseInt(args[0]);
  if (!slot) return;

  emitNet('database:loadInventory', GetPlayerServerId(PlayerId()), { action: "equip_slot", slot }, null); // identifier
});
RegisterKeyMapping('invuse 1', 'Inventory Slot 1', 'keyboard', '1');
RegisterKeyMapping('invuse 2', 'Inventory Slot 2', 'keyboard', '2');
RegisterKeyMapping('invuse 3', 'Inventory Slot 3', 'keyboard', '3');
RegisterKeyMapping('invuse 4', 'Inventory Slot 4', 'keyboard', '4');

RegisterNuiCallbackType('setSlot')
on('__cfx_nui:setSlot', async (data, cb) => {
  SetNuiFocus(
    false, false
  );

  console.log("setting slot, duh");

  emitNet('database:setSlot', data.container === "user" ? GetPlayerServerId(PlayerId()) : data.container, data.slot, data.stack);

  cb();
});

const dumpsterModels = ["prop_cs_dumpster_01a", "p_dumpster_t", "prop_dumpster_3a", "prop_dumpster_4b", "prop_dumpster_4a", "prop_dumpster_01a", "prop_dumpster_02b", "prop_dumpster_02a", "prop_snow_dumpster_01"];
const dumpsterHashes = dumpsterModels.map(model => GetHashKey(model));

function getBin() {
  const pC = GetEntityCoords(PlayerPedId(), false);
  const closestEntity = {
    entity: null,
    distance: Number.MAX_SAFE_INTEGER,
  };
  function processEntity(entity) {
    const type = GetEntityType(entity);
    if (type === 0 || type === 1) return; // no 'no object' or peds. need to add vehicle
    const eC = GetEntityCoords(entity);
    const distance = Math.hypot(pC[0] - eC[0], pC[1] - eC[1], pC[2] - eC[2]);
    if (distance < 5 && distance < closestEntity.distance) {
      const hash = GetEntityModel(entity);
      if (dumpsterHashes.includes(hash)) {
        closestEntity.entity = entity;
        closestEntity.distance = distance;
      }
    }
  }
  const firstObject = FindFirstObject();
  processEntity(firstObject[1]);
  let nextObject = FindNextObject(firstObject[0]);
  while (nextObject[0]) {
    processEntity(nextObject[1]);
    nextObject = FindNextObject(firstObject[0]);
  }
  EndFindObject(firstObject[0]);
  if (!closestEntity.entity) return;

  //const type = GetEntityType(closestEntity.entity);
  const eC = GetEntityCoords(closestEntity.entity);
  console.log(`dumpster-${Math.round(eC[0])}-${Math.round(eC[1])}-${Math.round(eC[2])}`);
  return `dumpster-${Math.round(eC[0])}-${Math.round(eC[1])}-${Math.round(eC[2])}`;
  // not the best system. improvements coule be made:
  // get coords when it first loads in (always spawns in unmoved?), a check for a saved dumpster within a few units around instead of just rounding
}
