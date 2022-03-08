on("bank:atm", () => {
    if (!playerAttributes) return;
    emitNet("database:loadAccounts", playerAttributes.cid, "bank:loadedAccounts");
});

onNet("bank:loadedAccounts", accounts => {
    SetNuiFocus(
        true, true
    );
    SendNuiMessage(JSON.stringify({ action: "open_atm", accounts }));
});

let playerAttributes;
on("core:newAttributes", attributes => {
    playerAttributes = attributes;
});

RegisterCommand("cashChange", (source, args, raw) => {
    const change = parseInt(args[0]);
    playerAttributes.cash += change;
    emit("core:setAttributes", { cash: playerAttributes.cash });
});

RegisterNuiCallbackType('cashChange')
on('__cfx_nui:cashChange', (data, cb) => {
    SetNuiFocus(
        false, false
    );
    cb();

    emitNet("database:processTransaction", {
        cid: playerAttributes.cid,
        accountNumber: data.accountNumber,
        amount: data.amount,
        direction: data.action === "deposit" ? "incoming" : "outgoing",
        transactionType: data.action
    }, "bank:finishedTransaction");
});

onNet("bank:finishedTransaction", data => {
    console.log("old cash", playerAttributes.cash);
    if (data.transactionType === "deposit") {
        playerAttributes.cash -= data.amount;
    } else if (data.transactionType === "withdraw") {
        playerAttributes.cash += data.amount;
    }
    console.log("new cash", playerAttributes.cash);

    emit("core:setAttributes", { cash: playerAttributes.cash });
});

RegisterNuiCallbackType('loadTransactions')
on('__cfx_nui:loadTransactions', (data, cb) => {
    cb();
    emitNet("database:loadTransactions", {
        accountNumber: data.accountNumber,
    }, "bank:loadedTransactions");
});

onNet("bank:loadedTransactions", transactions => {
    SendNuiMessage(JSON.stringify({ action: "transactions", transactions }));
});

RegisterNuiCallbackType('close')
on('__cfx_nui:close', (data, cb) => {
    cb();
    SetNuiFocus(
        false, false
    );
});
