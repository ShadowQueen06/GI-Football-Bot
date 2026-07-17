const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  StringSelectMenuBuilder
} = require("discord.js");

const Economy = require("../models/Economy");

const SHOP_CHANNEL_ID = "1527307100701724813";
const TICKET_CATEGORY_ID = "1523399598817673347";
const SHOP_LOG_CHANNEL_ID = "1527310300653555902";
const STAFF_ROLE_ID = "1523447592380268544";
const VIP_ROLE_ID = "1526998696443515200";

const PRODUCTS = {
  custom_color: {
    name: "Custom Color",
    emoji: "🎨",
    price: 100000,
    description: "رتبة لون خاصة باللون الذي تختاره."
  },

  vip: {
    name: "VIP",
    emoji: "👑",
    price: 200000,
    description: "رتبة VIP مع استخدام الإيموجيات والستيكرات الخارجية."
  },

  nitro_basic: {
    name: "Nitro Basic",
    emoji: "💎",
    price: 350000,
    description: "اشتراك Nitro Basic."
  },

  nitro_gaming: {
    name: "Nitro Gaming",
    emoji: "🚀",
    price: 500000,
    description: "اشتراك Nitro Gaming لمدة شهر."
  }
};

function formatCoins(number) {
  return Number(number).toLocaleString("en-US");
}

function createShopEmbed() {
  return new EmbedBuilder()
    .setColor("#D4AF37")
    .setTitle("GI Shop")
    .setDescription(
      [
        "اختر المنتج الذي تريد شراءه من القائمة بالأسفل.",
        "",
        "🎨 **Custom Color**",
        "السعر: **100,000 GI Coins**",
        "",
        "👑 **VIP**",
        "السعر: **200,000 GI Coins**",
        "",
        "💎 **Nitro Basic**",
        "السعر: **350,000 GI Coins**",
        "",
        "🚀 **Nitro Gaming**",
        "السعر: **500,000 GI Coins**",
        "",
        "بعد اختيار المنتج سيفتح لك تكت شراء تلقائيًا."
      ].join("\n")
    )
    .setFooter({
      text: "Great Iraq • GI Shop"
    });
}

function createShopMenu() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("shop_product_menu")
    .setPlaceholder("اختر المنتج")
    .addOptions(
      Object.entries(PRODUCTS).map(([key, product]) => ({
        label: product.name,
        description: `${formatCoins(product.price)} GI Coins`,
        value: key,
        emoji: product.emoji
      }))
    );

  return new ActionRowBuilder().addComponents(menu);
}

async function sendShopPanel(message) {
  if (!message.guild || message.author.bot) return;
  if (message.channel.id !== SHOP_CHANNEL_ID) return;
  if (message.content.trim() !== "لوحة المتجر") return;

  const allowed =
    message.author.id === message.guild.ownerId ||
    message.member.permissions.has(
      PermissionFlagsBits.Administrator
    );

  if (!allowed) {
    return message.reply("ما عندك صلاحية ترسل لوحة المتجر.");
  }

  await message.delete().catch(() => {});

  await message.channel.send({
    embeds: [createShopEmbed()],
    components: [createShopMenu()]
  });
}

async function findOpenTicket(guild, userId) {
  return guild.channels.cache.find(
    channel =>
      channel.parentId === TICKET_CATEGORY_ID &&
      channel.topic?.startsWith(`shop:${userId}:`) &&
      channel.type === ChannelType.GuildText
  );
}

async function createPurchaseTicket(interaction) {
  if (
    !interaction.isStringSelectMenu() ||
    interaction.customId !== "shop_product_menu"
  ) {
    return false;
  }

  const productKey = interaction.values[0];
  const product = PRODUCTS[productKey];

  if (!product) {
    await interaction.reply({
      content: "المنتج غير موجود.",
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  const oldTicket = await findOpenTicket(
    interaction.guild,
    interaction.user.id
  );

  if (oldTicket) {
    await interaction.reply({
      content: `عندك تكت شراء مفتوح بالفعل: ${oldTicket}`,
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  const account = await Economy.findOne({
    guildId: interaction.guild.id,
    userId: interaction.user.id
  });

  const balance = account?.balance || 0;

  const safeName = interaction.user.username
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]/g, "-")
    .slice(0, 18);

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  try {
    const ticket = await interaction.guild.channels.create({
      name: `shop-${safeName}`,
      type: ChannelType.GuildText,
      parent: TICKET_CATEGORY_ID,
      topic: `shop:${interaction.user.id}:${productKey}:pending`,

      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles
          ]
        },
        {
          id: STAFF_ROLE_ID,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageMessages
          ]
        },
        {
          id: interaction.client.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageRoles
          ]
        }
      ]
    });

    const ticketEmbed = new EmbedBuilder()
      .setColor("#FEE75C")
      .setTitle("طلب شراء جديد")
      .setDescription(
        [
          `العضو: ${interaction.user}`,
          "",
          `المنتج: ${product.emoji} **${product.name}**`,
          `السعر: **${formatCoins(product.price)} GI Coins**`,
          `رصيد العضو: **${formatCoins(balance)} GI Coins**`,
          "",
          product.description,
          "",
          "يرجى انتظار الإدارة لمراجعة الطلب."
        ].join("\n")
      )
      .setThumbnail(
        interaction.user.displayAvatarURL({
          size: 256
        })
      )
      .setTimestamp()
      .setFooter({
        text: "Great Iraq • Purchase Ticket"
      });

    const approveButton = new ButtonBuilder()
      .setCustomId(
        `shop_approve:${interaction.user.id}:${productKey}`
      )
      .setLabel("قبول وخصم الرصيد")
      .setStyle(ButtonStyle.Success);

    const rejectButton = new ButtonBuilder()
      .setCustomId(
        `shop_reject:${interaction.user.id}:${productKey}`
      )
      .setLabel("رفض")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(
      approveButton,
      rejectButton
    );

    await ticket.send({
      content: `${interaction.user} <@&${STAFF_ROLE_ID}>`,
      embeds: [ticketEmbed],
      components: [row],
      allowedMentions: {
        users: [interaction.user.id],
        roles: [STAFF_ROLE_ID]
      }
    });

    await interaction.editReply({
      content: `تم فتح تكت الشراء: ${ticket}`
    });
  } catch (error) {
    console.error("Shop ticket creation error:", error);

    await interaction.editReply({
      content:
        "ما كدرت أفتح التكت. تأكد من صلاحيات البوت والكاتيجوري."
    });
  }

  return true;
}

function disableMessageButtons(message) {
  return message.components.map(row => {
    const newRow = ActionRowBuilder.from(row);

    newRow.setComponents(
      row.components.map(component =>
        ButtonBuilder.from(component).setDisabled(true)
      )
    );

    return newRow;
  });
}

async function sendPurchaseLog({
  interaction,
  buyer,
  product,
  status,
  newBalance
}) {
  const logChannel = await interaction.guild.channels
    .fetch(SHOP_LOG_CHANNEL_ID)
    .catch(() => null);

  if (!logChannel?.isTextBased()) return;

  const accepted = status === "accepted";

  const embed = new EmbedBuilder()
    .setColor(accepted ? "#57F287" : "#ED4245")
    .setTitle(
      accepted ? "عملية شراء مقبولة" : "طلب شراء مرفوض"
    )
    .addFields(
      {
        name: "العضو",
        value: `${buyer}\n\`${buyer.id}\``
      },
      {
        name: "المنتج",
        value: `${product.emoji} ${product.name}`,
        inline: true
      },
      {
        name: "السعر",
        value: `${formatCoins(product.price)} GI Coins`,
        inline: true
      },
      {
        name: "الإدارة",
        value: `${interaction.user}`
      },
      {
        name: "الحالة",
        value: accepted ? "تم القبول وخصم الرصيد" : "تم الرفض"
      }
    )
    .setTimestamp()
    .setFooter({
      text: "Great Iraq • Shop Log"
    });

  if (accepted) {
    embed.addFields({
      name: "الرصيد المتبقي",
      value: `${formatCoins(newBalance)} GI Coins`
    });
  }

  await logChannel.send({
    embeds: [embed]
  });
}

async function handlePurchaseDecision(interaction) {
  if (!interaction.isButton()) return false;

  const approve =
    interaction.customId.startsWith("shop_approve:");

  const reject =
    interaction.customId.startsWith("shop_reject:");

  if (!approve && !reject) return false;

  const allowed =
    interaction.user.id === interaction.guild.ownerId ||
    interaction.member.roles.cache.has(STAFF_ROLE_ID) ||
    interaction.member.permissions.has(
      PermissionFlagsBits.Administrator
    );

  if (!allowed) {
    await interaction.reply({
      content: "ما عندك صلاحية مراجعة طلبات الشراء.",
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  const [, buyerId, productKey] =
    interaction.customId.split(":");

  const product = PRODUCTS[productKey];

  if (!product) {
    await interaction.reply({
      content: "بيانات المنتج غير صحيحة.",
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  const buyer = await interaction.guild.members
    .fetch(buyerId)
    .catch(() => null);

  if (!buyer) {
    await interaction.reply({
      content: "العضو مو موجود داخل السيرفر.",
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  await interaction.deferUpdate();

  const oldEmbed = interaction.message.embeds[0];
  const disabledButtons = disableMessageButtons(
    interaction.message
  );

  if (reject) {
    const rejectedEmbed = EmbedBuilder.from(oldEmbed)
      .setColor("#ED4245")
      .addFields({
        name: "الحالة",
        value: `تم رفض الطلب بواسطة ${interaction.user}`
      });

    await interaction.message.edit({
      embeds: [rejectedEmbed],
      components: disabledButtons
    });

    await interaction.channel.setTopic(
      `shop:${buyerId}:${productKey}:rejected`
    );

    await interaction.channel.send(
      `${buyer} تم رفض طلب الشراء. لم يتم خصم أي عملات.`
    );

    await sendPurchaseLog({
      interaction,
      buyer: buyer.user,
      product,
      status: "rejected"
    });

    await interaction.channel.send("❌ تم رفض الطلب. سيتم حذف التذكرة خلال 10 ثوانٍ.");

    setTimeout(async () => {
      await interaction.channel.delete().catch(() => {});
    }, 10000);

    return true;
  }

  const account = await Economy.findOneAndUpdate(
    {
      guildId: interaction.guild.id,
      userId: buyerId,
      balance: {
        $gte: product.price
      }
    },
    {
      $inc: {
        balance: -product.price
      }
    },
    {
      new: true
    }
  );

  if (!account) {
    await interaction.followUp({
      content:
        "رصيد العضو غير كافٍ أو حساب العملات غير موجود.",
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  try {
    if (productKey === "vip") {
      await buyer.roles.add(
        VIP_ROLE_ID,
        `VIP purchased and approved by ${interaction.user.tag}`
      );
    }
  } catch (error) {
    await Economy.updateOne(
      {
        guildId: interaction.guild.id,
        userId: buyerId
      },
      {
        $inc: {
          balance: product.price
        }
      }
    );

    console.error("VIP role error:", error);

    await interaction.followUp({
      content:
        "ما كدرت أضيف رتبة VIP، لذلك رجعت العملات للعضو. خلي رتبة البوت أعلى من VIP.",
      flags: MessageFlags.Ephemeral
    });

    return true;
  }

  const approvedEmbed = EmbedBuilder.from(oldEmbed)
    .setColor("#57F287")
    .addFields({
      name: "الحالة",
      value: [
        `تم قبول الطلب بواسطة ${interaction.user}`,
        `تم خصم **${formatCoins(product.price)} GI Coins**`,
        `الرصيد المتبقي: **${formatCoins(account.balance)} GI Coins**`
      ].join("\n")
    });

  await interaction.message.edit({
    embeds: [approvedEmbed],
    components: disabledButtons
  });

  await interaction.channel.setTopic(
    `shop:${buyerId}:${productKey}:accepted`
  );

  if (productKey === "vip") {
    await interaction.channel.send(
      `${buyer} تمت الموافقة وتم منحك رتبة VIP تلقائيًا.`
    );
  } else {
    await interaction.channel.send(
      `${buyer} تمت الموافقة وخصم العملات. انتظر الإدارة حتى تسلمك المنتج.`
    );
  }

  await sendPurchaseLog({
    interaction,
    buyer: buyer.user,
    product,
    status: "accepted",
    newBalance: account.balance
  });

  await interaction.channel.send("✅ تم قبول الطلب. سيتم حذف التذكرة خلال 10 ثوانٍ.");

  setTimeout(async () => {
    await interaction.channel.delete().catch(() => {});
  }, 10000);

  return true;
}

async function handleShopInteraction(interaction) {
  try {
    const ticketHandled = await createPurchaseTicket(interaction);

    if (ticketHandled) return;

    await handlePurchaseDecision(interaction);
  } catch (error) {
    console.error("Shop interaction error:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction
        .reply({
          content: "صار خطأ أثناء تنفيذ طلب المتجر.",
          flags: MessageFlags.Ephemeral
        })
        .catch(() => {});
    }
  }
}

module.exports = {
  sendShopPanel,
  handleShopInteraction
};
