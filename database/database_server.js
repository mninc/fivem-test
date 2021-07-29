
const mongoose = require("mongoose");

const database = require('./database');

mongoose.connect(`mongodb://127.0.0.1:27017/manic-fivem`, {
    authSource: 'admin',
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
}, (err) => {
    if (err) {
        Bot.error('Mongoose startup error: ' + err);
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

RegisterCommand("guid2", async (source, args, raw) => {
    console.log(getSteamid(source));
}, false);

onNet("database:loadInventory", async (source, returnParam, containerID) => {
    const steamid = getSteamid(source);
    let inventory = await database.findOne(database.models.Container, { type: "inventory", identifier: steamid });
    if (!inventory) {
        inventory = new database.models.Container({ type: "inventory", identifier: steamid });
        inventory.setItems();
        database.save(inventory);
    }
    inventory = inventory.toJSON();
    let container = containerID && await database.findOne(database.models.Container, { indentifier: containerID });
    let itemIDs = [].concat(...inventory.items);
    if (container) {
        itemIDs = itemIDs.concat(...container.items);
        container = conatiner.toJSON();
    }
    let items = await database.find(database.models.Item, {_id: { $in: itemIDs }}, null, { lean: true });
    items = items.map(item => {
        item._id = item._id.toString();
        return item;
    });
    emitNet("inventory:inventoryContents", source, returnParam, inventory, container, items);
});
