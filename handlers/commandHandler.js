const commands = [
    require("../commands/pack"),
    require("../commands/cards"),
    require("../commands/team"),
    require("../commands/daily"),
    require("../commands/balance"),
    require("../commands/help"),
    require("../commands/match"),
    require("../commands/predict"),
    require("../commands/result"),
    require("../commands/sell"),
    require("../commands/market"),
    require("../commands/buy")
];

const map = new Map();

for (const cmd of commands) {
    map.set(cmd.name, cmd);

    for (const alias of cmd.aliases ?? []) {
        map.set(alias, cmd);
    }
}

module.exports = async function (message) {
    const [name, ...args] = message.content.trim().split(/\s+/);

    const cmd = map.get(name);

    if (!cmd) return false;

    await cmd.execute(message, args);

    return true;
};
