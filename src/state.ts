import { createInterface, Interface } from "readline";
import { commandExit } from "./command_exit.js";
import { commandHelp } from "./command_help.js";
import { commandMap } from "./command_map.js";
import { commandMapb } from "./command_mapb.js";
import { commandExplore } from "./command_explore.js";
import { commandCatch } from "./command_catch.js";
import { commandInspect } from "./command_inspect.js";
import { commandPokedex } from "./command_pokedex.js";
import { PokeAPI, type Pokemon } from "./pokeapi.js";


export type CLICommand = {
    name: string;
    description : string;
    callback: (state: State, ...args: string[]) => Promise<void>;
};

export type State = {
    readline: Interface;
    commands: Record <string, CLICommand>;
    pokeapi: PokeAPI;
    nextLocationsURL: string | null;
    prevLocationsURL: string | null;
    pokedex: Record<string, Pokemon>;
};

export function initState(): State {
    const readline = createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: "Pokedex >",
    });

    const state: State = {
        readline,
        commands: {},
        pokeapi: new PokeAPI(),
        nextLocationsURL: null,
        prevLocationsURL: null,
        pokedex: {},
    };

    state.commands = {
        exit: {
            name: "exit",
            description: "Exit the Pokedex",
            callback: commandExit,
        },
        help: {
            name: "help",
            description: "Displays a help message",
            callback: commandHelp,
        },
        map: {
            name: "map",
            description: "Display the next 20 locations",
            callback: commandMap,
        },
        mapb: {
            name: "mapb",
            description: "Display the previous 20 locations",
            callback: commandMapb,
        },
        explore: {
            name: "explore",
            description: "Explore a location area",
            callback: commandExplore,
        },
        catch: {
            name: "catch",
            description: "Catch a Pokemon",
            callback: commandCatch,
        },
        inspect: {
            name: "inspect",
            description: "Inspect a caught Pokemon",
            callback: commandInspect,
        },
        pokedex: {
            name: "pokedex",
            description: "List all caught Pokemon",
            callback: commandPokedex,
        },
    };

    return state;
}