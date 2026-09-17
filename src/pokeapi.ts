import { Cache } from "./pokecache.js";

export class PokeAPI {
    private static readonly baseURL = "https://pokeapi.co/api/v2";
    private cache: Cache;

    constructor() {
        this.cache = new Cache(60000);
    }
    
    async fetchLocations(pageURL?: string): Promise<ShallowLocations> {
        const url = pageURL ?? `${PokeAPI.baseURL}/location-area/`;
        const cached = this.cache.get<ShallowLocations>(url);

        if (cached) {
            return cached;
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch locations: ${response.status}`);
        }

        const data: ShallowLocations = await response.json();

        this.cache.add(url, data);

        return data;
    }

    async fetchLocation(locationName: string): Promise<Location> {
        const url = `${PokeAPI.baseURL}/location-area/${locationName}`;
        const cached = this.cache.get<Location>(url);

        if (cached) {
            return cached;
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch location: ${response.status}`);
        }

        const data: Location = await response.json();
        
        this.cache.add(url, data);

        return data;
    }

    async fetchPokemon(name: string): Promise<Pokemon> {
        const url = `${PokeAPI.baseURL}/pokemon/${name}`;
        const cached = this.cache.get<Pokemon>(url);

        if (cached) {
            return cached;
        }

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch pokemon: ${response.status}`);
        }

        const data: Pokemon = await response.json();
        
        this.cache.add(url, data);

        return data;
    }
}

export type ShallowLocations = {
    count: number;
    next: string | null;
    previous: string | null;
    results: {
        name: string;
        url: string;
    }[];
};

export type Location = {
    name: string;
    pokemon_encounters: {
        pokemon: {
            name: string;
        };
    }[];
};

export type Pokemon = {
    name: string;
    base_experience: number;
    height: number;
    weight: number;
    stats: {
        base_stat: number;
        stat: {
            name: string;
        };
    }[];
    types: {
        type: {
            name: string;
        };
    }[];
};