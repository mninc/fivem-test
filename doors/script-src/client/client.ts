import { Coords3, CharacterAttributes } from '../../../types/dist';

let characterAttributes: CharacterAttributes = null;

on("core:newAttributes", (newAttributes: CharacterAttributes) => {
    characterAttributes = newAttributes;
});

onNet('doors:set', (doorId: number, isLocked: boolean) => {
    DoorSystemSetDoorState(doorId, isLocked ? 1 : 0, false, false);
    allDoors[doorId].locked = isLocked;
});

interface Door {
    model: number,
    coordinates: Coords3,
    locked: boolean,
    jobs?: string[],
    range?: number,
}
const defaultRange = 2;

let allDoors: Door[] = null;
onNet('doors:initialize', (newDoors: Door[]) => {
    allDoors = newDoors;
    for (let doorId = 0; doorId < allDoors.length; doorId++) {
        let door = allDoors[doorId];
        AddDoorToSystem(doorId, door.model, ...door.coordinates, false, false, false);
        DoorSystemSetDoorState(doorId, door.locked ? 1 : 0, false, false);
    }
});

function getCloseDoors() {
    if (!allDoors) return [];
    let close = [];
    let a = GetEntityCoords(PlayerPedId(), false);
    for (let doorId = 0; doorId < allDoors.length; doorId++) {
        let door = allDoors[doorId];
        let b = door.coordinates;
        let distance = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
        if (distance < (door.range || defaultRange)) {
            close.push(doorId);
        }
    }
    return close;
}

RegisterKeyMapping('toggleDoor', 'Lock/Unlock Door', 'keyboard', 'e');
RegisterCommand("toggleDoor", () => {
    let doors = getCloseDoors();
    for (let i = 0; i < doors.length; i++) {
        let doorId = doors[i];
        let door = allDoors[doorId];
        if (!door.jobs || characterAttributes.jobs.some(job => door.jobs.includes(job))) {
            emitNet('doors:toggle', doorId);
            ExecuteCommand("e keyfob");
        }
    }
}, false);

setInterval(() => {
    let doorId = getCloseDoors()[0];
    if (doorId) {
        let door = allDoors[doorId];
        SendNuiMessage(JSON.stringify(
            {
                action: "door",
                state: {
                    nearbyDoor: true,
                    doorLocked: door.locked,
                    haveKeys: !door.jobs || characterAttributes.jobs.some(job => door.jobs.includes(job)),
                }
            }
        ));
    } else {
        SendNuiMessage(JSON.stringify(
            {
                action: "door",
                state: {
                    nearbyDoor: false,
                }
            }
        ));
    }
}, 100);
