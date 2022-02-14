
const mongoose = require("mongoose");

const database = require('./database');

function docToJSON(doc) {
    return JSON.parse(JSON.stringify(doc));
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
    let items = await database.find(database.models.Item, { _id: { $in: itemIDs } }, null, { lean: true });
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
    emitNet("character_selector:characters", source, docToJSON(characters));
});

onNet("database:getCharacter", async (source, cid, emitTo) => {
    emitNet(emitTo, source, docToJSON(await database.findOne(database.models.Character, { cid })));
});

let nextCharacterID = -1;
on('onServerResourceStart', async resource => {
    if (resource !== "database") return;
    let character = await database.findOne(database.models.Character, {}, null, { sort: { created: -1 } });
    nextCharacterID = character ? (character.cid + 1) : 1000;
});

onNet("database:createCharacter", async (source, characterData) => {
    const character = new database.models.Character({
        steamid: getSteamid(source),
        ped: characterData.ped,
        name: characterData.name,
        health: 200,
        created: new Date(),
        cid: nextCharacterID,
        cash: 5000,
        phoneNumber: parseInt(`415555${nextCharacterID}`),
    });
    nextCharacterID++;
    await character.save();
    emitNet("character_selector:finishedCreatingCharacter", source);
});

onNet("database:deleteCharacter", async (source, character) => {
    await database.deleteOne(database.models.Character, { cid: character.character });
    emitNet("character_selector:deletedCharacter", source);
});

onNet("database:updateCharacter", async (source, character, updates) => {
    console.log("update character", character, updates);
    await database.findOneAndUpdate(database.models.Character, { cid: character }, { $set: updates });
});

onNet("database:loadAccounts", async (source, cid, emitTo) => {
    let accounts = await database.find(database.models.BankAccount, { access: cid });
    if (!accounts.length) {
        let personalAccount = new database.models.BankAccount({
            owner: cid,
            access: [cid],
            balance: 0,
            id: parseInt(`60${cid}`),
            type: "personal"
        });
        await personalAccount.save();
        accounts = [personalAccount];
    }
    emitNet(emitTo, source, docToJSON(accounts));
});

onNet("database:processTransaction", async (source, data, emitTo) => {
    console.log("process transaction", data);
    let account = await database.findOne(database.models.BankAccount, { id: data.accountNumber });
    let character = await database.findOne(database.models.Character, { cid: data.cid });
    if (!character || !account) return console.log("no account or char", character, account);
    if (data.transactionType === "deposit") {
        if (character.cash < data.amount) return console.log("not enough money to deposit");
        let transaction = new database.models.BankTransaction({
            accountNumber: data.accountNumber,
            amount: data.amount,
            direction: "incoming",
            transactionType: "deposit",
            at: new Date()
        });
        await database.save(transaction);
        account.balance += data.amount;
        await database.save(account);
    } else if (data.transactionType === "withdraw") {
        if (account.balance < data.amount) return console.log("not enough money to withdraw");
        let transaction = new database.models.BankTransaction({
            accountNumber: data.accountNumber,
            amount: data.amount,
            direction: "outgoing",
            transactionType: "withdraw",
            at: new Date()
        });
        await database.save(transaction);
        account.balance -= data.amount;
        await database.save(account);
    }
    emitNet(emitTo, source, data);
});

onNet("database:loadTransactions", async (source, data, emitTo) => {
    emitNet(
        emitTo,
        source,
        docToJSON(await database.find(database.models.BankTransaction, { accountNumber: data.accountNumber }, null, { sort: { at: -1 }, limit: 20 }))
    );
});

onNet("database:addContact", async (source, data, emitTo) => {
    console.log(data);
    await database.findOneAndUpdate(
        database.models.Contact,
        {
            phoneBook: data.phoneNumber,
            phoneNumber: data.contactNumber
        },
        {
            $set: { name: data.contactName }
        },
        {
            upsert: true
        }
    );
    emitNet(
        emitTo,
        source
    );
});

onNet("database:removeContact", async (source, data, emitTo) => {
    await database.deleteOne(
        database.models.Contact,
        {
            phoneBook: data.phoneNumber,
            phoneNumber: data.contactNumber
        }
    );
    emitNet(
        emitTo,
        source
    );
});

onNet("database:smsThreadOverview", async (source, data, emitTo) => {
    console.log("overview", data);
    //let incoming = docToJSON(await database.models.TextMessage.find({ to: data.phoneNumber }).sort({ at: -1 }).distinct("from"));
    let incoming = await database.models.TextMessage.aggregate([
        // each Object is an aggregation.
        {
            $match: {
                $or: [
                    { from: data.phoneNumber },
                    { to: data.phoneNumber }
                ]
            }
        }, {
            $sort: {
                at: -1
            }
        }, {
            $group: {
                _id: { $cond: { if: { "$eq": ["$from", data.phoneNumber] }, then: "$to", else: "$from" } },
                mostRecentMessage: { $first: "$content" }
            }
        }, {
            $project: {
                _id: 0,
                number: "$_id",
                mostRecentMessage: "$mostRecentMessage"
            }
        }
    ])
    console.log(incoming);
    /*let outgoing = docToJSON(await database.models.TextMessage.find({ from: data.phoneNumber }).sort({ at: -1 }).distinct("to"));
    console.log(outgoing);
    outgoing.forEach(message => {
        let matchingIncoming = incoming.find(incomingMessage => incomingMessage.from === message.to);
        if (matchingIncoming) {
            if (matchingIncoming.at < message.at) { // outgoing message is more recent
                matchingIncoming.at = message.at;
                matchingIncoming.from = message.from;
                matchingIncoming.to = message.to;
                matchingIncoming.content = message.content;
            }
        } else {
            incoming.push(message);
        }
    });
    console.log(incoming);*/

    emitNet(
        emitTo,
        source,
        docToJSON(incoming)
    );
});

onNet("database:loadContacts", async (source, data, emitTo) => {
    console.log(data);
    emitNet(
        emitTo,
        source,
        docToJSON(await database.find(database.models.Contact, { phoneBook: data.phoneNumber }))
    );
});

onNet("database:smsMessages", async (source, data, emitTo) => {
    let d = docToJSON(await database.find(database.models.TextMessage, { $or: [{ from: data.phoneNumber, to: data.contactNumber }, { from: data.contactNumber, to: data.phoneNumber }] }, null, { sort: { at: 1 } }));
    console.log(d);
    emitNet(
        emitTo,
        source,
        d
    );
});

onNet("database:sendSMS", async (source, data, emitTo) => {
    await database.save(database.models.TextMessage({
        from: data.phoneNumber,
        to: data.contactNumber,
        at: new Date(),
        content: data.content
    }));
    emitNet(
        emitTo,
        source,
        { number: data.contactNumber }
    );
});
