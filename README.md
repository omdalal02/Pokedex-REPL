# Pokedex REPL

A TypeScript-based command-line REPL (Read-Eval-Print Loop) that explores the Pokémon world through interactive commands. Fetches data from [PokeAPI](https://pokeapi.co/) and lets you catch Pokémon, explore areas, inspect stats, and build your own Pokédex collection — right from the terminal.

![Node.js](https://img.shields.io/badge/Node.js-22.15.0-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-7.0-green)

## Features

- 🗺️ **Commands**
  - `help` — List all available commands and their usage
  - `map` — Display the Kanto map with Pokémon sprites and battle buttons
  - `mapb` — Display the Kanto Battle map with battle encounter
  - `explore <location>` — Explore a location area and discover Pokémon encounters
  - `catch <pokemon>` — Catch a Pokémon with experience-based capture chance
  - `inspect <pokemon>` — Inspect a caught Pokémon's name, height, weight, stats, and types
  - `pokedex` — List all Pokémon caught in your Pokedex
  - `exit` — Exit the REPL

- ⚡ **Caching** — API responses are cached with 60s TTL to reduce redundant requests
- 📦 **State Management** — Clean state object tracks loading state, location history, and your Pokedex collection
- 🧪 **Tests** — Vitest integration tests for REPL commands and caching behavior

## Installation

```bash
npm install
```

## Usage

```bash
npm run dev
```

Start the REPL and try:

```
> help
> map
> explore Kanto
> catch Pikachu
> inspect Pikachu
> pokedex
> exit
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript |
| `npm run start` | Run the built REPL |
| `npm run dev` | Build and run in dev mode |
| `npm test` | Run Vitest tests |

## Project Structure

```
src/
├── main.ts                # Entry point
├── repl.ts                # ReadlineInterface-based REPL
├── state.ts               # State management (loading, loaded, error, commands, pokedex)
├── pokeapi.ts             # PokeAPI integration (locations, pokemon, caching)
├── pokecache.ts           # TTL-based cache with auto-reap loop
├── command_help.ts        # help command
├── command_map.ts         # map command (Kanto map with sprites)
├── command_mapb.ts        # mapb command (Battle map)
├── command_explore.ts     # explore command (location area)
├── command_catch.ts       # catch command (Pokeball mechanics)
├── command_inspect.ts     # inspect command (pokemon details)
├── command_pokedex.ts     # pokedex command (collection list)
├── command_exit.ts        # exit command
└── tests/
    ├── repl.test.ts       # REPL command tests
    └── pokecache.test.ts  # Cache TTL tests
```

## License

ISC
