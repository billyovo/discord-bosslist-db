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
  let msg;
  await fetchBossMessage()
  .then(async(message)=>{
   msg = message;
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
 })
 .finally(()=>{
  const embed = new Discord.MessageEmbed()
      	.setColor('#ffff00')
      	.setTitle('Boss statistics')
      	.setAuthor('', bot.avatarURL)
      	.addFields(
      		{ name: 'Data:', value: JSON.stringify(ret)},
      	)
      	.setTimestamp()
      	.setFooter('Click me to see the message', msg.url);

  return embed; 
 })
  
}

async function sendBossMessage(){
  let bossChannel = fetchBossChannel();
  let oldBossMessage = await fetchBossMessage();

  let bossMessage  = "@everyone 新的一周開始了!!\r\n";
      bossMessage += "請給反應你要哪隻boss~\r\n";
      bossMessage += "🇦 : 寒冰魔女\r\n";
      bossMessage += "🇧 : 森法王\r\n";
      bossMessage += "🇨 : 夢魘虛影\r\n";
      bossMessage += "🇩 : 淵海噬者\r\n";
      bossMessage += "🇪 : 元素魔方\r\n";
      bossMessage += "🇫 : 幻雪守衛\r\n";
      bossMessage += "🇬 : 荒漠亡靈\r\n";

  await oldBossMessage.unpin();
  await bossChannel.send(bossMessage)
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
