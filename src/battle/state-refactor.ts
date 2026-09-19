/**
 * PROTOTYPE for ticket #6 — "Design state architecture for battles"
 *
 * Purpose: demonstrate, concretely and type-checked, HOW to refactor the
 * monolithic `State` so it can carry a battle without entangling battle logic
 * with I/O. Two architectural commitments (from closed tickets #7, #8, #9):
 *
 *   1. Battle state is EPHEMERAL and lives on `State` as `battle: BattleState | null`.
 *      It is created on `battle` and cleared on battle end. `lastWildEncounter`
 *      threads the wild find from `explore` into `battle <name>`.
 *
 *   2. Battle LOGIC is pure and State- FREE. The state machine transforms plain
 *      `BattleState` values and can be unit-tested by feeding turn sequences with
 *      no State, no I/O, no network (ticket #9). `command_battle.ts` is the ONLY
 *      place that reads/writes `state.battle` and does printing/API calls.
 *
 * This module is intentionally independent of `state.ts`: that is the proof.
 * Battle logic never imports State, so tests never need it either.
 */

import type { Pokemon } from "../pokeapi.js";

/* ------------------------------------------------------------------ *
 * 1. Battle value types (shape from ticket #7)
 * ------------------------------------------------------------------ */

export type BattleCategory = "physical" | "special" | "status";

export type BattleMove = {
    name: string;
    type: string;
    power: number; // 0 for status moves
    accuracy: number; // 100 for moves that always hit
    pp: number;
    currentPP: number;
    category: BattleCategory;
};

export type BattleStatus = "none" | "burn" | "paralysis" | "freeze" | "poison";

export type BattlePokemon = {
    name: string;
    level: number;
    maxHp: number;
    currentHp: number;
    moves: BattleMove[];
    status: BattleStatus;
    speed: number;
    attack: number;
    defense: number;
};

export type BattleState = {
    player: BattlePokemon;
    opponent: BattlePokemon;
    turnOrder: "player" | "opponent";
    turnNumber: number;
    activeMoveIndex: number | null;
};

/** A freshly-built battle from two partner pokémon — ticket #7's BattlePokemon. */
export function buildBattle(player: BattlePokemon, opponent: BattlePokemon): BattleState {
    const turnOrder: "player" | "opponent" =
        player.speed >= opponent.speed ? "player" : "opponent";
    return { player, opponent, turnOrder, turnNumber: 1, activeMoveIndex: null };
}

/** Build a BattlePokemon from a captured Pokemon (ticket #3 restructured stats). */
export function toBattlePokemon(p: Pokemon, level: number): BattlePokemon {
    const stats = Object.fromEntries(
        p.stats.map((s) => [s.stat.name.replace(/-/g, ""), s.base_stat]),
    ) as Record<"hp" | "attack" | "defense" | "special_attack" | "special_defense" | "speed", number>;

    const statScale = Math.max(1, Math.round((level / 5) * (stats.speed ?? 0) / 100) + 5);
    constHp(stats.hp, level);

    return {
        name: p.name,
        level,
        maxHp: constHp(stats.hp, level),
        currentHp: constHp(stats.hp, level),
        moves: [], // populated by fetchMove() — ticket #3 follow-up
        status: "none",
        speed: statScale,
        attack: Math.max(1, Math.round((level / 5) * (stats.attack ?? 0) / 100) + 5),
        defense: Math.max(1, Math.round((level / 5) * (stats.defense ?? 0) / 100) + 5),
    };
}

function constHp(baseHp: number, level: number): number {
    return Math.floor((2 * baseHp) / 8 + 5 + (level / 5));
}

/* ------------------------------------------------------------------ *
 * 2. The pure state machine (State-free — testable, ticket #9)
 * ------------------------------------------------------------------ */

export type BattleResult =
    | { kind: "turn"; state: BattleState; message: string }
    | { kind: "over"; state: BattleState; message: string };

/**
 * Advance one turn by executing the actor's move at `moveIndex`.
 * Pure: returns a new BattleState. Never mutates, never touches State or I/O.
 * Enforces the faint-after-turn resolution and PP depletion from ticket #8.
 */
export function advanceTurn(state: BattleState, moveIndex: number): BattleResult {
    const actor = state.turnOrder === "player" ? state.player : state.opponent;
    const target = state.turnOrder === "player" ? state.opponent : state.player;
    const move = actor.moves[moveIndex];

    if (!move) {
        throw new RangeError(`No move at index ${moveIndex}`);
    }

    const damage = move.category === "status" ? 0 : laneADamage(move, actor, target);
    const hit = move.accuracy >= 100 || Math.random() * 100 <= move.accuracy;
    const appliedDamage = hit ? Math.max(1, damage) : 0;

    const newTarget = {
        ...target,
        currentHp: Math.max(0, target.currentHp - appliedDamage),
    };

    const movedMoves = state.turnOrder === "player" ? state.player.moves : state.opponent.moves;
    const debited = movedMoves.map((m, i) =>
        i === moveIndex ? { ...m, currentPP: Math.max(0, m.currentPP - 1) } : m,
    );

    const nextActor =
        state.turnOrder === "player"
            ? { ...state.player, moves: debited }
            : { ...state.opponent, moves: debited };

    const fainted = newTarget.currentHp <= 0;

    if (fainted) {
        const winnerName = state.turnOrder === "player" ? state.player.name : state.opponent.name;
        return {
            kind: "over",
            state: { ...state, player: nextActor, opponent: newTarget, activeMoveIndex: moveIndex },
            message: `${winnerName} fainted. Battle over.`,
        };
    }

    // #8: PP depletion/forfeit handled by the command layer, not the pure state machine.
    return {
        kind: "turn",
        state: {
            ...state,
            player: nextActor,
            opponent: newTarget,
            turnNumber: state.turnNumber + 1,
            activeMoveIndex: moveIndex,
        },
        message: `${actor.name} used ${move.name} for ${appliedDamage} damage.`,
    };
}

/** Lane A damage formula — placeholder for src/battle/damage.ts (ticket #7). */
function laneADamage(move: BattleMove, actor: BattlePokemon, target: BattlePokemon): number {
    const stat = move.category === "special" ? "special_attack" : "attack";
    const atk = stat === "special_attack" ? 0 : actor.attack; // special handled by damage.ts
    const base = move.power;
    return Math.round(((2 * actor.level) / 5 + 2) * base * (atk || 1) / Math.max(1, target.defense) / 50) + 2;
}

/* ------------------------------------------------------------------ *
 * 3. How State changes (the answer to ticket #6)
 * ------------------------------------------------------------------ */

/**
 * The only change to `state.ts`: two additive fields on State.
 * Everything battle-related stays inside this module and command_battle.ts.
 */
export type RefactoredState = {
    readline: unknown; // Interface
    commands: Record<string, unknown>; // Record<string, CLICommand>
    pokeapi: unknown; // PokeAPI
    nextLocationsURL: string | null;
    prevLocationsURL: string | null;
    pokedex: Record<string, unknown>; // Record<string, Pokemon>

    // NEW — ticket #6:
    lastWildEncounter: string | null; // set by explore, read by `battle <name>`
    battle: BattleState | null; // created on `battle`, cleared on battle end
};

/**
 * Illustrative read/write boundary. The pure state machine above is the engine;
 * this (in command_battle.ts) is the only I/O layer that reads/writes state.battle.
 */
export function enterBattle(state: Partial<RefactoredState>, moves: BattleMove[]): BattleState {
    const player = toBattlePokemon({ name: "egnis", base_experience: 100, height: 1, weight: 1,
        stats: [{ stat: { name: "hp" }, base_stat: 60 }, { stat: { name: "attack" }, base_stat: 55 },
            { stat: { name: "defense" }, base_stat: 50 }, { stat: { name: "special_attack" }, base_stat: 55 },
            { stat: { name: "special_defense" }, base_stat: 50 }, { stat: { name: "speed" }, base_stat: 50 }] } as Pokemon, 5);
    const opponent = toBattlePokemon({ name: "gregrill", base_experience: 100, height: 1, weight: 1,
        stats: [{ stat: { name: "hp" }, base_stat: 60 }, { stat: { name: "attack" }, base_stat: 55 },
            { stat: { name: "defense" }, base_stat: 50 }, { stat: { name: "special_attack" }, base_stat: 55 },
            { stat: { name: "special_defense" }, base_stat: 50 }, { stat: { name: "speed" }, base_stat: 50 }] } as Pokemon, 5);
    player.moves = moves;
    opponent.moves = moves.slice(0, 2).map((m) => ({ ...m, currentPP: m.pp }));

    const battle = buildBattle(player, opponent);
    return battle; // caller assigns: state.battle = battle; (and sets lastWildEncounter on explore)
}
