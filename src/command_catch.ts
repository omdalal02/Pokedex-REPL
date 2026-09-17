import type { State } from "./state.js";

export async function commandCatch(
    state: State,
    ...args: string[]
): Promise<void> {
    const pokemonName = args[0];

    console.log(`Throwing a Pokeball at ${pokemonName}...`);

    const pokemon = await state.pokeapi.fetchPokemon(pokemonName);

    const chance = Math.max(0.1, 1 - pokemon.base_experience / 300);

    if (Math.random() < chance) {
        console.log(`${pokemonName} was caught!`);
        state.pokedex[pokemonName] = pokemon;
    } else {
        console.log(`${pokemonName} escaped!`);
    }
}