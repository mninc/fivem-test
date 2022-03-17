
const mongoose = require("mongoose");

const database = require('./database');
const vehicleColours = require('./vehicle_colours');

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
}, async (err) => {
    if (err) {
        console.error('Mongoose startup error: ' + err);
        setTimeout(() => {
            process.exit(0);
        }, 1000 * 20);
    } else {
        console.info('Mongoose startup successful');

        // not the best system
        try {
            await mongoose.connection.dropCollection("itemschemas");
        } catch { }
        database.models.ItemSchema.insertMany(require("./itemSchema.json"));
        try {
            await mongoose.connection.dropCollection("shops");
        } catch { }
        database.models.Shop.insertMany(require("./shops.json"));
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

async function loadContainer(query) {
    // careful with a dodgy query
    let slots = await database.models.Container.aggregate([
        {
            '$match': query
        }, {
            '$unwind': {
                'path': '$items',
                'includeArrayIndex': 'slot'
            }
        }, {
            '$lookup': {
                'from': 'items',
                'localField': 'items',
                'foreignField': '_id',
                'as': 'itemAttributes'
            }
        }, {
            '$unwind': {
                'path': '$itemAttributes',
                'includeArrayIndex': 'slotIndex',
                'preserveNullAndEmptyArrays': true
            }
        }, {
            '$lookup': {
                'from': 'itemschemas',
                'localField': 'itemAttributes.item_id',
                'foreignField': 'item_id',
                'as': 'itemSchemas'
            }
        }, {
            '$project': {
                'itemFinal': {
                    '$mergeObjects': [
                        {
                            'item_id': -1
                        }, {
                            '$arrayElemAt': [
                                '$itemSchemas', 0
                            ]
                        }, '$itemAttributes'
                    ]
                },
                'slot': '$slot',
                'slotIndex': '$slotIndex'
            }
        }, {
            '$project': {
                'itemFinal': {
                    '$cond': {
                        'if': {
                            '$eq': [
                                '$itemFinal.item_id', -1
                            ]
                        },
                        'then': '$$REMOVE',
                        'else': '$itemFinal'
                    }
                },
                'slot': '$slot',
                'slotIndex': '$slotIndex'
            }
        }, {
            '$group': {
                '_id': '$slot',
                'items': {
                    '$push': '$itemFinal'
                }
            }
        }, {
            '$project': {
                '_id': 0,
                'slot': '$_id',
                'items': '$items'
            }
        }, {
            '$sort': {
                'slot': 1
            }
        }
    ]);
    if (!slots.length) {
        let container = new database.models.Container(query);
        container.setItems();
        await container.save();
        return await loadContainer(query);
    } else {
        return docToJSON(slots);
    }
}

async function loadItem(id) {
    let item = await database.models.Item.aggregate([
        {
            '$match': {
                '_id': mongoose.Types.ObjectId(id)
            }
        }, {
            '$lookup': {
                'from': 'itemschemas',
                'localField': 'item_id',
                'foreignField': 'item_id',
                'as': 'schema'
            }
        }, {
            '$replaceRoot': {
                'newRoot': {
                    '$mergeObjects': [
                        {
                            '$arrayElemAt': [
                                '$schema', 0
                            ]
                        }, '$$ROOT'
                    ]
                }
            }
        }, {
            '$project': {
                'schema': 0
            }
        }
    ]);
    if (!item.length) return console.error("no item found", id);
    return docToJSON(item[0]);
}

onNet("database:updateContainer", async (data, emitTo) => {
    let source = global.source;
    await database.findOneAndUpdate(database.models.Container, data.query, { $set: { items: data.items } });
    emitNet(emitTo, source, await loadContainer(data.query));
});

onNet("database:loadContainer", async (query, emitTo) => {
    emitNet(emitTo, global.source, await loadContainer(query));
});

async function loadShop(id) {
    let shop = await database.models.Shop.aggregate([
        {
            '$match': {
                'id': id
            }
        }, {
            '$unwind': {
                'path': '$items'
            }
        }, {
            '$lookup': {
                'from': 'itemschemas',
                'localField': 'items.item_id',
                'foreignField': 'item_id',
                'as': 'schema'
            }
        }, {
            '$project': {
                'items': [
                    {
                        '$mergeObjects': [
                            {
                                '$arrayElemAt': [
                                    '$schema', 0
                                ]
                            }, '$items'
                        ]
                    }
                ]
            }
        }
    ]);
    return docToJSON(shop);
}

onNet("database:loadShop", async (id, emitTo) => {
    emitNet(emitTo, global.source, await loadShop(id));
});

onNet("database:boughtItems", async (items, emitTo) => {
    let source = global.source;
    let ids = [];
    for (let i = 0; i < items.length; i++) {
        let item = new database.models.Item({
            item_id: items[i]
        });
        await item.save();
        ids.push(item._id);
    }
    emitNet(emitTo, source, docToJSON(ids));
});

onNet("database:setWeaponAmmo", async (mongoID, newAmmo) => {
    database.findByIdAndUpdate(database.models.Item, mongoID, { $set: { ammo: newAmmo } });
});

onNet("database:newItem", async (data, emitTo) => {
    let source = global.source;
    // TODO: weight
    let item = new database.models.Item(data.item);
    let container = await loadContainer(data.container);
    let insertAtSlot = -1;
    for (let i = 0; i < container.length; i++) {
        let slot = container[i];
        if (!slot.items.length || (slot.items[0].item_id === item.item_id && slot.items[0].stackable)) {
            insertAtSlot = i;
            break;
        }
    }
    if (insertAtSlot !== -1) {
        await item.save();
        emitNet(emitTo.itemAdded, source, await loadItem(item._id));
        let $push = {};
        $push[`items.${insertAtSlot}`] = item._id;
        await database.findOneAndUpdate(database.models.Container, data.container, { $push });
        emitNet(emitTo.container, source, await loadContainer(data.container));
    } else {
        console.log("inventory full");
    }

});

onNet("database:deleteItem", async (data, emitTo) => {
    let source = global.source;
    let container = await database.models.Container.findOne(data.container);
    if (!container) return;

    // should check existence of item

    for (let i = 0; i < container.items.length; i++) {
        container.items[i] = container.items[i].filter(item => item.toString() !== data.item);
    }
    container.markModified("items");
    await container.save();

    emitNet(emitTo.itemRemoved, source, await loadItem(data.item));
    emitNet(emitTo.container, source, await loadContainer(data.container));
});

onNet("database:getCharacters", async () => {
    let source = global.source;
    const steamid = getSteamid(source);
    const characters = await database.find(database.models.Character, { steamid });
    emitNet("character_selector:characters", source, docToJSON(characters));
});

onNet("database:getCharacter", async (cid, emitTo) => {
    emitNet(emitTo, global.source, docToJSON(await database.findOne(database.models.Character, { cid })));
});

let nextCharacterID = -1;
on('onServerResourceStart', async resource => {
    if (resource !== "database") return;
    let character = await database.findOne(database.models.Character, {}, null, { sort: { created: -1 } });
    nextCharacterID = character ? (character.cid + 1) : 1000;
});

onNet("database:createCharacter", async (characterData) => {
    let source = global.source;
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

onNet("database:deleteCharacter", async (character) => {
    let source = global.source;
    await database.deleteOne(database.models.Character, { cid: character.character });
    emitNet("character_selector:deletedCharacter", source);
});

onNet("database:updateCharacter", async (character, updates) => {
    await database.findOneAndUpdate(database.models.Character, { cid: character }, { $set: updates });
});

onNet("database:loadAccounts", async (cid, emitTo) => {
    let source = global.source;
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

onNet("database:processTransaction", async (data, emitTo) => {
    let source = global.source;
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

onNet("database:loadTransactions", async (data, emitTo) => {
    emitNet(
        emitTo,
        global.source,
        docToJSON(await database.find(database.models.BankTransaction, { accountNumber: data.accountNumber }, null, { sort: { at: -1 }, limit: 20 }))
    );
});

onNet("database:addContact", async (data, emitTo) => {
    let source = global.source;
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

onNet("database:removeContact", async (data, emitTo) => {
    let source = global.source;
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

onNet("database:smsThreadOverview", async (data, emitTo) => {
    let source = global.source;
    let incoming = await database.models.TextMessage.aggregate([
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

    emitNet(
        emitTo,
        source,
        docToJSON(incoming)
    );
});

onNet("database:loadContacts", async (data, emitTo) => {
    emitNet(
        emitTo,
        global.source,
        docToJSON(await database.find(database.models.Contact, { phoneBook: data.phoneNumber }))
    );
});

onNet("database:smsMessages", async (data, emitTo) => {
    emitNet(
        emitTo,
        global.source,
        docToJSON(await database.find(database.models.TextMessage, { $or: [{ from: data.phoneNumber, to: data.contactNumber }, { from: data.contactNumber, to: data.phoneNumber }] }, null, { sort: { at: 1 } }))
    );
});

onNet("database:sendSMS", async (data, emitTo) => {
    let source = global.source;
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

async function loadTasksJSON(query) {
    let tasks = await database.models.Task.aggregate([
        {
            '$match': query
        }, {
            '$lookup': {
                'from': 'characters',
                'localField': 'characters',
                'foreignField': 'cid',
                'as': 'serverIds'
            }
        }, {
            '$addFields': {
                'serverIds': {
                    '$map': {
                        'input': '$serverIds',
                        'in': '$$this.playerServerId'
                    }
                }
            }
        }
    ]);
    tasks = docToJSON(tasks);

    for (let i = 0; i < tasks.length; i++) {
        let task = tasks[i];

        task.steps = [];
        if (task.task_type === "boost") {
            task.steps = [
                {
                    heading: "Find and steal the car",
                    body: `You're looking for a ${vehicleColours[task.vehicle.colours.primary]} and ${vehicleColours[task.vehicle.colours.secondary]} ${task.vehicle.model}`
                }, {
                    heading: "Take the car to the drop off spot"
                }, {
                    heading: "Leave the area"
                }
            ];
        }

        for (let j = 0; j < task.steps.length; j++) {
            let step = task.steps[j];
            if (task.complete) {
                step.state = 2;
            } else if (task.current_step < j) { // not yet done
                step.state = 0;
            } else if (task.current_step === j) { // in progress
                step.state = 1;
            } else { // done
                step.state = 2;
            }
        }
    }

    return tasks;
}

async function loadTaskJSON(query) {
    let tasks = await loadTasksJSON(query);
    if (!tasks.length) return;
    return tasks[0];
}

on("database:createTask", async (data, emitTo) => {
    let tasks = await database.models.Task.find({ owner_cid: data.cid, in_progress: true });
    for (let i = 0; i < tasks.length; i++) {
        let task = tasks[i];
        task.in_progress = false;
        await task.save();
        emit(
            emitTo,
            await loadTaskJSON({ _id: mongoose.Types.ObjectId(task._id) })
        );
    }

    let task = new database.models.Task({
        owner_cid: data.cid,
        characters: [data.cid],
        task_type: data.task_type,
        current_step: 0,
        in_progress: true,
        complete: false,
        started: new Date(),
        vehicle: data.vehicle,
    });
    await task.save();
    emit(
        emitTo,
        await loadTaskJSON({ _id: mongoose.Types.ObjectId(task._id) })
    );
});

on("database:loadTask", async (data, emitTo) => {
    emit(
        emitTo,
        await loadTaskJSON({
            cid: data.cid,
            in_progress: true
        })
    );
});

on("database:loadActiveTasks", async (emitTo) => {
    let tasks = await loadTasksJSON({
        in_progress: true
    });
    console.log(tasks);
    for (let i = 0; i < tasks.length; i++) {
        emit(
            emitTo,
            tasks[i]
        );
    }
});

on("database:updateTask", async (data, emitTo) => {
    await database.models.Task.updateOne({ _id: data.task }, { $set: data.update });
    console.log(data.task);
    emit(
        emitTo,
        await loadTaskJSON({ _id: mongoose.Types.ObjectId(data.task) })
    );
});

onNet("database:characterSelected", async (cid) => {
    let source = global.source;
    let steamid = getSteamid(source);
    await database.models.Character.updateMany({ steamid }, { $set: { playerServerId: null } });
    await database.models.Character.updateOne({ steamid, cid }, { $set: { playerServerId: source } });
    emit(
        "tasks:loaded-task",
        await loadTaskJSON({
            owner_cid: cid,
            in_progress: true
        })
    );
});

on("playerDropped", async () => {
    let source = global.source;
    let steamid = getSteamid(source);
    await database.models.Character.updateMany({ steamid }, { $set: { playerServerId: null } });
});
