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
	fetch("https://billy-gay-bot.herokuapp.com/",{method: "HEAD"})
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


bot.on('message', msg => {

  if(!msg.content.startsWith(PREFIX)){return;}
  if(msg.author.bot){return;}

  let command = msg.content.slice(prefix_len,msg.content.length).toLowerCase();
    
  switch(command){
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


const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
 
app.get('/players', function (req, res) {
  res.send('Hello World')
  res.sendStatus(200);
})

app.head ("/availability", function (req, res) {
  res.sendStatus(200);
}) 

app.post('/players', (req, res) => {
  console.log('Got body:', req.body);
  res.sendStatus(200);
});

app.listen(process.env.PORT || 3000,()=>{
  console.log("API is running.");
});