export interface ItemAttributes {
    _id?: string;
    item_id: string;
}
export interface Item extends ItemAttributes {
    ammo?: number;
    icon: string;
    name: string;
    description: string;
    type: "weapon" | "ammo" | "consumable" | "equipment";
    weapon_hash?: string;
    cost?: number;
}
export interface ContainerSlot {
    items: Item[]
}
export type Container = ContainerSlot[];
export interface Inventory {
    character: Container;
    container: Container;
}
export interface CharacterAttributes {
    cid: number;
    health: number;
    ped: string;
    cash: number;
    phoneNumber: number;
    whitelists: string[];
    jobs: string[];
}
export type Coords = [number, number, number, number];
export type Coords3 = [number, number, number];

export interface ContextMenuItem {
    title: string;
    description?: string[];
    action?: string[];
    children?: ContextMenuItem[];
}
