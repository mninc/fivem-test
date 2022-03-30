let phoneOpen = false;
let characterAttributes;

SetNuiFocusKeepInput(true);

RegisterKeyMapping('phone', 'Phone', 'keyboard', 'p');
function phoneToggle(fromPhone) {
    if (IsPauseMenuActive() || !characterAttributes || !characterAttributes.cid) return;

    if (phoneOpen) {
        phoneOpen = false;
        emit("core:disableControlActions", "phone", { attack: false, look: false, escape: false });
        ExecuteCommand("e c");
        SetNuiFocus(
            false, false
        );
        if (!fromPhone) {
            SendNuiMessage(JSON.stringify({ action: "close_phone" }));
        }
    } else {
        phoneOpen = true;
        emit("core:disableControlActions", "phone", { attack: true, look: true, escape: true });
        ExecuteCommand("e phone");
        SetNuiFocus(
            true, true
        );
        if (!fromPhone) {
            SendNuiMessage(JSON.stringify({ action: "open_phone" }));
        }
    }
}
RegisterCommand('phone', phoneToggle);
RegisterNuiCallbackType('close')
on('__cfx_nui:close', (data, cb) => {
    cb();
    phoneToggle(true);
});

RegisterNuiCallbackType('addContact')
on('__cfx_nui:addContact', (data, cb) => {
    cb();
    emitNet("database:addContact", { phoneNumber: characterAttributes.phoneNumber, contactName: data.name, contactNumber: data.number }, "phone:processedContactsChange");
});

RegisterNuiCallbackType('removeContact')
on('__cfx_nui:removeContact', (data, cb) => {
    cb();
    emitNet("database:removeContact", { phoneNumber: characterAttributes.phoneNumber, contactNumber: data.number }, "phone:processedContactsChange");
});

onNet("phone:processedContactsChange", () => {
    SendNuiMessage(JSON.stringify({ action: "contact_processed" }));
});

RegisterNuiCallbackType('loadContacts')
on('__cfx_nui:loadContacts', (data, cb) => {
    cb();
    emitNet("database:loadContacts", { phoneNumber: characterAttributes.phoneNumber }, "phone:contacts");
});
onNet("phone:contacts", contacts => {
    SendNuiMessage(JSON.stringify({ action: "contacts", contacts }));
});

RegisterNuiCallbackType('loadVehicles')
on('__cfx_nui:loadVehicles', (data, cb) => {
    cb();
    emitNet("database:load-vehicles-phone", { cid: characterAttributes.cid }, "phone:vehicles");
});
onNet("phone:vehicles", vehicles => {
    SendNuiMessage(JSON.stringify({ action: "vehicles", vehicles }));
});

on("core:newAttributes", newAttributes => {
    characterAttributes = newAttributes;
    SendNuiMessage(JSON.stringify({ action: "character_attributes", characterAttributes }));
});
RegisterNuiCallbackType('ready');
on('__cfx_nui:ready', async (data, cb) => {
    cb();
    SendNuiMessage(JSON.stringify({ action: "character_attributes", characterAttributes }));
});

setInterval(sendTime, 2000);

let initial = false;
function sendTime() {
    if (initial && !phoneOpen) return;

    initial = true;
    SendNuiMessage(JSON.stringify({ action: "time", time: { hours: GetClockHours(), minutes: GetClockMinutes() } }));
}

RegisterNuiCallbackType('loadSMSOverview')
on('__cfx_nui:loadSMSOverview', (data, cb) => {
    cb();
    emitNet("database:smsThreadOverview", { phoneNumber: characterAttributes.phoneNumber }, "phone:smsOverview");
});

onNet("phone:smsOverview", overview => {
    SendNuiMessage(JSON.stringify({ action: "smsOverview", overview }));
});

RegisterNuiCallbackType('loadSMSMessages')
on('__cfx_nui:loadSMSMessages', (data, cb) => {
    cb();
    emitNet("database:smsMessages", { phoneNumber: characterAttributes.phoneNumber, contactNumber: data.number }, "phone:smsMessages");
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
    emitNet("database:sendSMS", { phoneNumber: characterAttributes.phoneNumber, contactNumber: data.number, content: data.content }, "phone:sentSMS");
});

onNet("phone:sentSMS", data => {
    emitNet("database:smsMessages", { phoneNumber: characterAttributes.phoneNumber, contactNumber: data.number }, "phone:smsMessages");
});


let currentTaskStep;
on("phone:task", task => {
    SendNuiMessage(JSON.stringify({ action: "task", task }));
    let newTaskStep;
    if (task.complete) {
        newTaskStep = "Task Complete!";
    } else if (!task.in_progress) {
        newTaskStep = "Task Cancelled.";
    }
    if (!newTaskStep) {
        for (let i = 0; i < task.steps.length; i++) {
            let step = task.steps[i];
            if (step.state === 1) {
                newTaskStep = step.heading;

                break;
            }
        }
    }
    if (currentTaskStep !== newTaskStep) {
        currentTaskStep = newTaskStep;
        SendNuiMessage(JSON.stringify({ action: "notification", notification: { title: currentTaskStep } }));
    }
});

RegisterNuiCallbackType('trackCoordinates')
on('__cfx_nui:trackCoordinates', (data, cb) => {
    cb();
    SetNewWaypoint(...data.coords);
});
