import type { State } from "./state.js";

export async function commandMapb(state: State) {
    if (state.prevLocationsURL === null) {
        console.log("You're on the first page");
        return;
    }

    const locations = await state.pokeapi.fetchLocations(
        state.prevLocationsURL,
    );

    for (const location of locations.results) {
        console.log(location.name);
    }

    state.nextLocationsURL = locations.next;
    state.prevLocationsURL = locations.previous
}