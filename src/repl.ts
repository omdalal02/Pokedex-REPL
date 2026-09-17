import { State } from "./state.js";


export function cleanInput(input:string): string[] {
    return input.toLowerCase().trim().split(/\s+/);
}

export function startREPL(state: State) {
    const rl = state.readline;
    const commands = state.commands;


    rl.prompt();

    rl.on("line", async (input) => {
        const words = cleanInput(input);
        const commandName = words[0];

        if (commandName === "") {
            rl.prompt();
            return;
        }

        const command = commands[commandName];

        if (command) {
            try {
               await command.callback(state, ...words.slice(1));
            } catch (err) {
                console.log(err);
            }
        } else {
            console.log("Unknown command");
        }

        rl.prompt();
    });
}