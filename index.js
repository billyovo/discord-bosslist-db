require('dotenv').config();
const Discord = require('discord.js');
const fs = require('fs');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const PREFIX = "-";
const bossChannelID = "728568879302836275";

//'0 0 * * MON'
var CronJob = require('cron').CronJob;
var job = new CronJob('0 * * * TUE', function() {
  sendBossMessage();
}, null, true, 'Asia/Taipei');

job.start();
bot.login(TOKEN);

bot.on('ready', () => {
  console.info("Discord SiuMui online");
});

async function fetchEmote(ID){
  let data = {
      "A":[],
      "B":[],
      "C":[],
      "D":[],
      "E":[],
      "F":[],
      "G":[],
  }

  let bossChannel = bot.channels.cache.get(bossChannelID);
  await bossChannel.messages.fetch(ID)
  .then(async(message)=>{

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

  return JSON.stringify(data);
}

function sendBossMessage(){
  let bossChannel = bot.channels.cache.get(bossChannelID);
  let bossMessage = "@everyone 新的一周開始了!!\r\n";
      bossMessage += "請給反應你要哪隻boss~\r\n";
      bossMessage += "🇦 : 寒冰魔女\r\n";
      bossMessage += "🇧 : 森法王\r\n";
      bossMessage += "🇨 : 夢魘虛影\r\n";
      bossMessage += "🇩 : 淵海噬者\r\n";
      bossMessage += "🇪 : 元素魔方\r\n";
      bossMessage += "🇫 : 幻雪守衛\r\n";
      bossMessage += "🇬 : 荒漠亡靈\r\n";

  fs.readFile('messageID.txt', function(err, data){
    if(err){
      return console.log(err);
    }
    bossChannel.messages.fetch(data.toString())
    .then(async(message)=>{
      message.unpin();
    })
  });

  bossChannel.send(bossMessage)
  .then(async function(message){
    await message.react("🇦");
    await message.react("🇧");
    await message.react("🇨");
    await message.react("🇩");
    await message.react("🇪");
    await message.react("🇫");
    await message.react("🇬");
    await message.pin();
    fs.writeFile('messageID.txt', message.id, function (err) {
      if (err){
        console.log(err);
      }
    });
  })
         
}

bot.on('message', msg => {

  if(!msg.content.startsWith(PREFIX)){return;}
  if(msg.author.bot){return;}

  let command = msg.content.slice(1,msg.content.length);
    
  switch(command){

    case "boss":{
      fs.readFile('messageID.txt', function(err, data) {
        if(err){
          return console.log(err);
        }

        fetchEmote(data.toString())
        .then(ret => {
          msg.channel.send(ret);
        });
      });
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
