require('dotenv').config();
const config = require('./config.json');

const Discord = require('discord.js');
const fs = require('fs');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const PREFIX = config.prefix;
const bossChannelID = config.bossChannelID;
const prefix_len = PREFIX.length;
//'0 0 * * MON'
var CronJob = require('cron').CronJob;
var job = new CronJob('0 0 * * MON', function() {
  sendBossMessage();
}, null, true, 'Asia/Taipei');

job.start();
bot.login(TOKEN);

bot.on('ready', () => {
  console.info("Discord SiuMui online");
    let bossChannel = fetchBossChannel();
    if(bossChannel!==undefined){
      console.log("Successful found channel "+bossChannel.name);
    }
    else{
      console.log("Boss channel is not found! Fix your config.");
      bot.destroy();
  }
});

function fetchBossChannel(){
  return bot.channels.cache.get(bossChannelID);
}

async function fetchBossMessage(){
  let bossChannel = fetchBossChannel();
  let messages = await bossChannel.messages.fetchPinned();
  let bossMessage = await bossChannel.messages.fetch(messages.filter(message => message.author === bot.user).first().id,true,true);
  return bossMessage;
}

async function fetchEmote(){
  let data = {
      "A":[],
      "B":[],
      "C":[],
      "D":[],
      "E":[],
      "F":[],
      "G":[],
  }
  let message = await fetchBossMessage();

  await message.reactions.resolve("🇦").users.fetch()
  .then(userList=>{
   data.A = userList.filter(user=>!user.bot).map(user=>user.username);
   })
  await message.reactions.resolve("🇧").users.fetch()
  .then(userList=>{
   data.B = userList.filter(user=>!user.bot).map(user=>user.username);
  })
  await message.reactions.resolve("🇨").users.fetch()
  .then(userList=>{
   data.C = userList.filter(user=>!user.bot).map(user=>user.username);
  })
  await message.reactions.resolve("🇩").users.fetch()
  .then(userList=>{
   data.D = userList.filter(user=>!user.bot).map(user=>user.username);
  })
   await message.reactions.resolve("🇪").users.fetch()
  .then(userList=>{
   data.E = userList.filter(user=>!user.bot).map(user=>user.username);
  })
  await message.reactions.resolve("🇫").users.fetch()
  .then(userList=>{
   data.F = userList.filter(user=>!user.bot).map(user=>user.username);
  })
  await message.reactions.resolve("🇬").users.fetch()
  .then(userList=>{
   data.G = userList.filter(user=>!user.bot).map(user=>user.username);
  })

  const embed = await new Discord.MessageEmbed()
      	.setColor('#ffff00')
      	.setTitle('Click me to jump to message')
        .setURL(message.url)
        .setDescription(JSON.stringify(data))
      	.setTimestamp()
      	.setFooter(message.id, bot.user.avatarURL());

  return embed; 
  
}

async function sendBossMessage(){
  let bossChannel = fetchBossChannel();
  let oldBossMessage = await fetchBossMessage();
  bossChannel.send("@everyone")
  .then((message)=>{
    message.delete();
  })

  const embed = new Discord.MessageEmbed()
  .setColor('#ffff00')
  .setTitle('新的一周開始了!')
  .setURL('https://billyovo.github.io/boss-list/index.html')
  .setDescription('@everyone 請給反應你要哪隻boss~')
  .addFields(
    { name: '\u200b', value: '🇦 寒冰魔女', inline: true },
    { name: '\u200b', value: '🇧 森法王', inline: true },
    { name: '\u200b', value: '🇨 夢魘虛影', inline: true },
    { name: '\u200b', value: '🇩 淵海噬者', inline: true },
    { name: '\u200b', value: '🇪 元素魔方', inline: true },
    { name: '\u200b', value: '🇫 幻雪守衛', inline: true },
    { name: '\u200b', value: '🇬 荒漠亡靈', inline: true },
  )
  .setTimestamp()
  .setFooter('新的一周快樂', bot.user.avatarURL());

  await oldBossMessage.unpin();
  await bossChannel.send(embed)
  .then(async(newMessage)=>{
      await newMessage.pin();
      await newMessage.react("🇦");
      await newMessage.react("🇧");
      await newMessage.react("🇨");
      await newMessage.react("🇩");
      await newMessage.react("🇪");
      await newMessage.react("🇫");
      await newMessage.react("🇬");
  })         
}

bot.on('message', msg => {

  if(!msg.content.startsWith(PREFIX)){return;}
  if(msg.author.bot){return;}

  let command = msg.content.slice(prefix_len,msg.content.length);
    
  switch(command){
    case "boss":{
      fetchEmote()
      .then(ret => {
        msg.channel.send(ret);
      })
      .catch(error=>{
        console.log(error);
      })
      break;
    }
    case "message":{
      msg.member.hasPermission('ADMINISTRATOR') ?
        sendBossMessage():
        msg.channel.send("No permission!");
      break;
    }
    case "ping":{
       const embed = new Discord.MessageEmbed()
       .setColor('#ffff00')
       .setDescription('Pong')
       .addFields(
        { name: bot.ws.ping+'ms', value: '\u200b' },
        )
       msg.channel.send(embed);
      break;
    }
  }
});

/*
const http = require("http");
const host = 'localhost';
const port = 8080;

const requestListener = function (req, res) {
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", process.env.ALLOW_DOMAIN);
    res.writeHead(200);

    fs.readFile('messageID.txt', function(err, data) {
        if(err){
            return console.log(err);
        }
        fetchEmote(data.toString())
        .then(ret => {
          res.end(ret);
        });
      });
    
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`HTTP Server is running on http://${host}:${port}`);
});

*/
