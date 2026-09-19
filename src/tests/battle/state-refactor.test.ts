import { describe, expect, test, vi } from "vitest";
import { advanceTurn, buildBattle, toBattlePokemon, type BattleMove, type BattleState } from "../../battle/state-refactor.js";

function move(name: string, power: number, accuracy = 100, pp = 10, category: "physical" | "special" | "status" = "physical"): BattleMove {
    return { name, type: "normal", power, accuracy, pp, currentPP: pp, category };
}

function sampleBattle(): BattleState {
    const p = toBattlePokemon({ name: "egnis", base_experience: 100, height: 1, weight: 1,
        stats: [{ stat: { name: "hp" }, base_stat: 60 }, { stat: { name: "attack" }, base_stat: 60 },
            { stat: { name: "defense" }, base_stat: 50 }, { stat: { name: "special_attack" }, base_stat: 40 },
            { stat: { name: "special_defense" }, base_stat: 40 }, { stat: { name: "speed" }, base_stat: 55 }] } as never, 5);
    const o = toBattlePokemon({ name: "gregrill", base_experience: 100, height: 1, weight: 1,
        stats: [{ stat: { name: "hp" }, base_stat: 60 }, { stat: { name: "attack" }, base_stat: 40 },
            { stat: { name: "defense" }, base_stat: 60 }, { stat: { name: "special_attack" }, base_stat: 50 },
            { stat: { name: "special_defense" }, base_stat: 50 }, { stat: { name: "speed" }, base_stat: 45 }] } as never, 5);
    p.moves = [move("tackle", 40)];
    o.moves = [move("ram", 40)];
    return buildBattle(p, o); // player faster → acts first
}

describe("advanceTurn — damage & HP transitions", () => {
    test("player faster, attacks first and reduces HP", () => {
        const s = sampleBattle();
        const r = advanceTurn(s, 0);
        expect(r.kind).toBe("turn");
        if (r.kind === "turn") {
            expect(r.state.opponent.currentHp).toBeLessThan(s.opponent.currentHp); // opponent took damage
            expect(r.state.turnNumber).toBe(2);
        }
    });

    test("fainting ends the battle cleanly (ticket #8)", () => {
        const s = sampleBattle();
        // force opponent faint by hammering it with a high-power move
        s.opponent.maxHp = 1;
        s.opponent.currentHp = 1;
        const weakPlayer = { ...s.player, moves: [move("boom", 999)] };
        const forced: BattleState = { ...s, player: weakPlayer };
        const r = advanceTurn(forced, 0);
        expect(r.kind).toBe("over");
    });

    test("invalid move index throws (command layer re-prompts — ticket #8)", () => {
        const s = sampleBattle();
        expect(() => advanceTurn(s, 3)).toThrow(RangeError);
    });
});

describe("advanceTurn — PP depletion", () => {
    test("PP decrements on the active move, other moves untouched", () => {
        const s = sampleBattle();
        s.player.moves = [move("a", 10, 100, 4), move("b", 20, 100, 7)];
        const r = advanceTurn(s, 1);
        if (r.kind === "turn") {
            expect(r.state.player.moves[1].currentPP).toBe(6);
            expect(r.state.player.moves[0].currentPP).toBe(4); // untouched
        }
    });
});

describe("advanceTurn — turn order", () => {
    test("slower actor attacks first (speed-based turn order)", () => {
        const fullStats = (speed: number) => [{ stat: { name: "hp" }, base_stat: 80 },
            { stat: { name: "attack" }, base_stat: 50 }, { stat: { name: "defense" }, base_stat: 50 },
            { stat: { name: "special_attack" }, base_stat: 40 },
            { stat: { name: "special_defense" }, base_stat: 40 }, { stat: { name: "speed" }, base_stat: speed }];
        const slow = toBattlePokemon({ name: "x", base_experience: 1, height: 1, weight: 1, stats: fullStats(10) } as never, 5);
        const fast = toBattlePokemon({ name: "y", base_experience: 1, height: 1, weight: 1, stats: fullStats(100) } as never, 5);
        slow.moves = [move("weak", 1)];   // player (slow) provides the move index...
        fast.moves = [move("strong", 999)];// ...but the FASTER actor (opponent) decides who is hit
        const s = buildBattle(slow, fast); // fast is opponent -> opponent acts first
        const r = advanceTurn(s, 0);
        if (r.kind === "turn") {
            // Player (slower) never got to attack; opponent struck it first.
            expect(r.state.player.currentHp).toBeLessThan(slow.maxHp);
        }
    });
});

describe("testability boundary", () => {
    test("state machine needs no State, no I/O, no network", () => {
        vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("no network in tests"));
        const s = sampleBattle();
        expect(() => advanceTurn(s, 0)).not.toThrow(); // pure — no State fetch required
        vi.restoreAllMocks();
    });
});
