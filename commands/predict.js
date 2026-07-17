module.exports = {
    name: "توقع",
    aliases: ["predict"],

    async execute(message) {
        return message.reply(
            "❌ التوقعات تتم عن طريق زر **توقع النتيجة** الموجود أسفل رسالة المباراة، وليس بالأوامر."
        );
    }
};
