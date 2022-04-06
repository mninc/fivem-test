import doorState from './dist/server/doors.js';

function toggleDoor(doorId: number) {
    if (typeof doorId !== "number" || !doorState[doorId]) return console.error("bad door");

    doorState[doorId].locked = !doorState[doorId].locked;

    emitNet('doors:set', -1, doorId, doorState[doorId].locked);
}
onNet('doors:toggle', (doorId: number) => {
    toggleDoor(doorId);
});

on('playerJoining', () => {
    emitNet('doors:initialize', global.source, doorState);
});
setTimeout(() => {
    emitNet('doors:initialize', -1, doorState); // in case resource restarts
}, 1000); // delay to allow client side event listeners to be set up
