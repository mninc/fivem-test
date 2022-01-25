
const mongoose = require("mongoose");

const database = require('./database');

function docToJSON(doc) {
    doc = doc.toJSON();
    doc._id = doc._id.toString();
    return doc;
}
function docsToJSON(docs) {
    return docs.map(docToJSON);
}

mongoose.connect(`mongodb://127.0.0.1:27017/manic-fivem`, {
    authSource: 'admin',
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}, (err) => {
    if (err) {
        console.error('Mongoose startup error: ' + err);
        setTimeout(() => {
            process.exit(0);
        }, 1000 * 20);
    } else {
        console.info('Mongoose startup successful');
    }
});

function getSteamid(NetID) {
    let i = 0;
    while (true) {
        let identifier = GetPlayerIdentifier(NetID, i);
        if (!identifier) return;
        if (identifier.startsWith("steam")) return BigInt('0x' + identifier.split(":")[1]).toString(10);
        i++;
    }
}

onNet("database:loadInventory", async (source, returnParam, containerID) => {
    const steamid = getSteamid(source);
    let inventory = await database.findOne(database.models.Container, { type: "inventory", identifier: steamid });
    if (!inventory) {
        inventory = new database.models.Container({ type: "inventory", identifier: steamid });
        inventory.setItems();
        database.save(inventory);
    }
    inventory = inventory.toJSON();
    let itemIDs = [].concat(...inventory.items);
    let container;
    if (containerID) {
        container = await database.findOne(database.models.Container, { identifier: containerID });
        if (!container) {
            container = new database.models.Container({ type: containerID.split("-")[0], identifier: containerID });
            container.setItems();
            database.save(container);
        }
        itemIDs = itemIDs.concat(...container.items);
        container = container.toJSON();
    }
    let items = await database.find(database.models.Item, {_id: { $in: itemIDs }}, null, { lean: true });
    items = items.map(item => {
        item._id = item._id.toString();
        return item;
    });
    emitNet("inventory:inventoryContents", source, returnParam, inventory, container, items);
});

onNet("database:setSlot", async (container, slot, stack) => {
    console.log("setting stack");
    if (typeof container == "number") container = getSteamid(container);

    const $set = {};
    $set[`items.${slot}`] = stack;
    database.findOneAndUpdate(database.models.Container, { identifier: container }, { $set });
    console.log({ identifier: container }, { $set });
});

onNet("database:setWeaponAmmo", async (source, mongoID, newAmmo) => {
    database.findByIdAndUpdate(database.models.Item, mongoID, { $set: { ammo: newAmmo } });
});

onNet("database:getCharacters", async (source) => {
    const steamid = getSteamid(source);
    const characters = await database.find(database.models.Character, { steamid });
    emitNet("character_selector:characters", source, docsToJSON(characters));
});

onNet("database:createCharacter", async(source, characterData) => {
    const character = new database.models.Character({
        steamid: getSteamid(source),
        ped: characterData.ped,
        name: characterData.name,
        health: 200
    });
    await character.save();
    emitNet("character_selector:finishedCreatingCharacter", source);
});

onNet("database:deleteCharacter", async(source, character) => {
    await database.deleteOne(database.models.Character, {_id: character.character});
    emitNet("character_selector:deletedCharacter", source);
});
