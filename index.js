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
//var job = new CronJob('0 0 * * MON', function() {
//  sendBossMessage();
//}, null, true, 'Asia/Taipei');

var keepAwake = new CronJob('*/25 * * * *', function() {
	fetch("https://billy-gay-bot.herokuapp.com/availability",{method: "HEAD"})
	.then(response => {
		console.log("bossBot's status: "+response.status+" "+response.statusText);
	});
  }, null, true, 'Asia/Taipei');

keepAwake.start();
//job.start();

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


const pgp = require('pg-promise')();
const db = pgp(process.env.DATABASE_URL);

const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
 
app.head ("/availability", function (req, res) {  //availability or keep awake
  res.sendStatus(200);
}) 

app.get('/players', function (req, res) {  //get records
  db.any('SELECT player.*, boss01.boss AS boss1, boss01.hitted AS hitted1, boss02.boss AS boss2, boss02.hitted AS hitted2 FROM player INNER JOIN boss01 ON player.name = boss01.name INNER JOIN boss02 ON player.name = boss02.name', [true])
    .then(function(data) {
        res.status(200).send(JSON.stringify(data));
    })
    .catch(function(error) {
        res.sendStatus(500);
	console.log(error);
    });
})

app.post('/players', (req, res) => {      //add records
  console.log('Got body:', req.body);
  res.sendStatus(200);
});

app.patch('/players', function (req, res) { //update records
  res.sendStatus(200);
})

app.delete('/players', function (req, res) {  //delete records
  res.sendStatus(200);
})



app.listen(process.env.PORT || 3000,()=>{
  console.log("API is running.");
});
