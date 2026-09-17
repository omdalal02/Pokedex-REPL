import type { State } from "./state.js";

export async function commandExplore(
    state: State,
    ...args: string[]
): Promise<void> {
    const areaName = args[0];

    console.log(`Exploring ${areaName}...`);
    console.log("Found Pokemon:");

    const location = await state.pokeapi.fetchLocation(areaName);

    for (const encounter of location.pokemon_encounters) {
        console.log(` - ${encounter.pokemon.name}`);
    }
}