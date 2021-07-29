RegisterKeyMapping('inventory', 'Inventory', 'keyboard', 'e');
RegisterCommand('inventory', async () => {
  emitNet('database:loadInventory', GetPlayerServerId(PlayerId()), { action: "show_inventory" }, null); // identifier
});

onNet('inventory:inventoryContents', async (data, inventory, container, items) => {
  console.log(data);
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
    SetNuiFocus(
      true, true
    );
    SendNuiMessage(JSON.stringify({ action: "enable_inventory", inventory, container }));
  } else if (data.action === "equip_slot") {
    const item = inventory.items[data.slot - 1][0];
    if (!item || item.type !== "weapon") return;
    await equipWeapon(item.weapon_hash, item.ammo, item.icon);
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

async function equipWeapon(hash, ammo, icon) {
  const ped = PlayerPedId();
  const currentWeapon = GetCurrentPedWeapon(ped)[1];
  if (currentWeapon === GetHashKey("weapon_unarmed")) {
    GiveWeaponToPed(ped, hash, ammo, false, true);
    SendNuiMessage(JSON.stringify({ action: "equip_item", icon }));
  } else {
    SetCurrentPedWeapon(ped, "weapon_unarmed", false);
    await wait(1000);
    RemoveAllPedWeapons(ped);
  }
}

RegisterNuiCallbackType('equipWeapon')
on('__cfx_nui:equipWeapon', async (data, cb) => {
  SetNuiFocus(
    false, false
  );
  await equipWeapon(data.weapon_hash, data.ammo, data.icon);
  
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

