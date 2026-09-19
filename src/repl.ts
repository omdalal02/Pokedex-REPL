import * as repl from "node:repl";
import type { REPLEval, REPLServer } from "node:repl";
import { State } from "./state.js";


export function cleanInput(input:string): string[] {
    return input.toLowerCase().trim().split(/\s+/);
}

/**
 * Command dispatcher passed to node:repl as the `eval` function.
 * Treats every input line as a Pokedex command (no JS evaluation).
 * `cb(null, undefined)` + `ignoreUndefined: true` suppresses output;
 * a resolved Promise makes the REPL await async commands before re-prompting.
 */
function commandEval(state: State): REPLEval {
    return (cmd, _context, _filename, cb) => {
        const words = cleanInput(cmd);
        const commandName = words[0];

        if (commandName === "") {
            cb(null, undefined);
            return;
        }

        const command = state.commands[commandName];

        if (!command) {
            console.log("Unknown command");
            cb(null, undefined);
            return;
        }

        (async () => {
            try {
                await command.callback(state, ...words.slice(1));
            } catch (err) {
                console.log(err);
            } finally {
                cb(null, undefined);
            }
        })();
    };
}

export function startREPL(state: State): REPLServer {
    const server = repl.start({
        prompt: "Pokedex >",
        useGlobal: false,
        ignoreUndefined: true,
        eval: commandEval(state),
    });

    state.repl = server;
    return server;
}
