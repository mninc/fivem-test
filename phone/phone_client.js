let phoneOpen = false;
let characterAttributes;

SetNuiFocusKeepInput(true);

RegisterKeyMapping('phone', 'Phone', 'keyboard', 'o');
RegisterCommand('phone', async () => {
    if (phoneOpen) {
        phoneOpen = false;
        ExecuteCommand("e c");
        SetNuiFocus(
            false, false
        );
        SendNuiMessage(JSON.stringify({ action: "close_phone" }));
    } else {
        phoneOpen = true;
        ExecuteCommand("e phone");
        SetNuiFocus(
            true, true
        );
        SendNuiMessage(JSON.stringify({ action: "open_phone" }));
    }
});

setTick(() => {
    if (phoneOpen) {
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

RegisterNuiCallbackType('addContact')
on('__cfx_nui:addContact', (data, cb) => {
    cb();
    emitNet("database:addContact", GetPlayerServerId(PlayerId()), { phoneNumber: characterAttributes.phoneNumber, contactName: data.name, contactNumber: data.number }, "phone:processedContactsChange");
});

RegisterNuiCallbackType('removeContact')
on('__cfx_nui:removeContact', (data, cb) => {
    cb();
    emitNet("database:removeContact", GetPlayerServerId(PlayerId()), { phoneNumber: characterAttributes.phoneNumber, contactNumber: data.number }, "phone:processedContactsChange");
});

onNet("phone:processedContactsChange", () => {
    SendNuiMessage(JSON.stringify({ action: "contact_processed" }));
});

RegisterNuiCallbackType('loadContacts')
on('__cfx_nui:loadContacts', (data, cb) => {
    cb();
    console.log("loading contacts")
    emitNet("database:loadContacts", GetPlayerServerId(PlayerId()), { phoneNumber: characterAttributes.phoneNumber }, "phone:contacts");
});

onNet("phone:contacts", contacts => {
    SendNuiMessage(JSON.stringify({ action: "contacts", contacts }));
});

on("core:newAttributes", newAttributes => {
    characterAttributes = newAttributes;
});

setInterval(sendTime, 2000);

function sendTime() {
    if (!phoneOpen) return;

    SendNuiMessage(JSON.stringify({ action: "time", time: { hours: GetClockHours(), minutes: GetClockMinutes() } }));
}

RegisterNuiCallbackType('loadSMSOverview')
on('__cfx_nui:loadSMSOverview', (data, cb) => {
    cb();
    emitNet("database:smsThreadOverview", GetPlayerServerId(PlayerId()), { phoneNumber: characterAttributes.phoneNumber }, "phone:smsOverview");
});

onNet("phone:smsOverview", overview => {
    SendNuiMessage(JSON.stringify({ action: "smsOverview", overview }));
});

RegisterNuiCallbackType('loadSMSMessages')
on('__cfx_nui:loadSMSMessages', (data, cb) => {
    cb();
    emitNet("database:smsMessages", GetPlayerServerId(PlayerId()), { phoneNumber: characterAttributes.phoneNumber, contactNumber: data.number }, "phone:smsMessages");
});

onNet("phone:smsMessages", messages => {
    SendNuiMessage(JSON.stringify({ action: "smsMessages", messages }));
});

RegisterNuiCallbackType('elementFocus')
on('__cfx_nui:elementFocus', (data, cb) => {
    cb();
    SetNuiFocusKeepInput(!data.focus);
});

RegisterNuiCallbackType('sendSMS')
on('__cfx_nui:sendSMS', (data, cb) => {
    cb();
    emitNet("database:sendSMS", GetPlayerServerId(PlayerId()), { phoneNumber: characterAttributes.phoneNumber, contactNumber: data.number, content: data.content }, "phone:sentSMS");
});

onNet("phone:sentSMS", data => {
    emitNet("database:smsMessages", GetPlayerServerId(PlayerId()), { phoneNumber: characterAttributes.phoneNumber, contactNumber: data.number }, "phone:smsMessages");
});
