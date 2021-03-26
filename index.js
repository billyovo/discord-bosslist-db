require('dotenv').config();
const config = require('./config.json');
const fetch = require("node-fetch");

const Discord = require('discord.js');
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

var keepAwake = new CronJob('*/25 * * * *', function() {
	fetch("https://discord-bosslist-bot.herokuapp.com/",{method: "HEAD"})
	.then(response => {
		console.log("bossBot's status: "+response.status+" "+response.statusText);
	});
  }, null, true, 'Asia/Taipei');

keepAwake.start();

job.start();

bot.login(TOKEN);

bot.on('ready', () => {
  console.info("Discord SiuMui online");
  bot.user.setActivity('boss 時間表', { type: 'WATCHING' });
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

  return JSON.stringify(data); 
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
  .setURL(config.bossWebsiteURL)
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

  let command = msg.content.slice(prefix_len,msg.content.length).toLowerCase();
    
  switch(command){
    case "boss":{
      let timetable = new Array(7);
      timetable[0] = ["A","B","C","D"];
      timetable[1] = ["E","F","G","A"];
      timetable[2] = ["B","C","D","E"];
      timetable[3] = ["F","G","A","B"];
      timetable[4] = ["C","D","E","F"];
      timetable[5] = ["G","A","B","C"];
      timetable[6] = ["D","E","F","G"];
      
      let weekday = new Array(7);
      weekday[0] = "日";
      weekday[1] = "一";
      weekday[2] = "二";
      weekday[3] = "三";
      weekday[4] = "四";
      weekday[5] = "五";
      weekday[6] = "六";
      
      let today = new Date();
      let weekIndex = today.getDay();
      
      fetchEmote()
      .then(ret => {
        ret = JSON.parse(ret);
        const embed = new Discord.MessageEmbed()
        .setColor('#ffff00')
        .setTitle('本周的boss:')
        .addFields(
          { name: '\u200b', value: '🇦 '+ret.A.join(" ")},
          { name: '\u200b', value: '🇧 '+ret.B.join(" ")},
          { name: '\u200b', value: '🇨 '+ret.C.join(" ")},
          { name: '\u200b', value: '🇩 '+ret.D.join(" ")},
          { name: '\u200b', value: '🇪 '+ret.E.join(" ")},
          { name: '\u200b', value: '🇫 '+ret.F.join(" ")},
          { name: '\u200b', value: '🇬 '+ret.G.join(" ")},
        )
        .setTimestamp()
        .setFooter('星期'+weekday[weekIndex]+'的boss 7:30 '+timetable[weekIndex][0]+' '+timetable[weekIndex][1]+' | 9:30 '+timetable[weekIndex][2]+ ' '+timetable[weekIndex][3], bot.user.avatarURL());
        msg.channel.send(embed);
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
       .setTitle('Pong')
       .setDescription(bot.ws.ping+'ms')
       msg.channel.send(embed);
      break;
    }  
  }
});


const http = require("http");
const host = '0.0.0.0';
const port = process.env.PORT || 3000;

const requestListener = function (req, res) {
    if(req.url!="/"){
      res.writeHead(404);
      res.end();
      return;
    }
    if(req.method=="GET"){
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Access-Control-Allow-Origin", process.env.ALLOW_DOMAIN); 
      fetchEmote()
      .then(ret => {
        res.writeHead(200);
        res.end(ret);
      })
      .catch(()=>{
        res.writeHead(502)
        res.end();
      })
    }
    else{
      res.writeHead(200);
      res.end();
    }
};

const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`API server online on http://${host}:${port}`);
});
