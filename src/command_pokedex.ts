import type { State } from "./state.js";

export async function commandPokedex(
    state: State,
    ...args: string[]
): Promise<void> {
    console.log("Your Pokedex:");
    
    for (const pokemonName of Object.keys(state.pokedex)) {
        console.log(` - ${pokemonName}`);
    }
}