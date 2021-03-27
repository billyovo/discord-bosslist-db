require('dotenv').config();
const config = require('./config.json');
const fetch = require("node-fetch");

const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;
const PREFIX = config.prefix;

const bossChannelID = config.bossChannelID;
const prefix_len = PREFIX.length;

let bossMessageID;
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

bot.on('ready', async () => {
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

  bossMessageID = await fetchBossMessage().id;
});

function fetchBossChannel(){
  return bot.channels.cache.get(bossChannelID);
}

async function fetchBossMessage(){
  let bossChannel = fetchBossChannel();
  let messages = await bossChannel.messages.fetchPinned();
  let bossMessage = await bossChannel.messages.fetch(messages.filter(message => (message.author === bot.user)||message.id === '823224436789346304').first().id,true,true);
  return bossMessage;
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
      bossMessageID = await fetchBossMessage().id;
  })  
  
}

function mapEmojiToLetter(emoji){
  switch(emoji){
    case '🇦':{
      return 'A';
    }
    case '🇧':{
      return 'B';
    }
    case '🇨':{
      return 'C';
    }
    case '🇩':{
      return 'D';
    }
    case '🇪':{
      return 'E';
    }
    case '🇫':{
      return 'F';
    }
    case '🇬':{
      return 'G';
    }
  }
}

const bossReactions = ['🇦','🇧','🇨','🇩','🇪','🇫','🇬'];

bot.on('messageReactionAdd', (reaction, user) => {
  if(reaction.message.id !== '823224436789346304'){ return; }
  if(user.bot){return;}
  if(!bossReactions.includes(reaction.emoji.name)){ return;}

  console.log(user.username);
  const hasSecondBoss = format('EXISTS (SELECT FROM boss02 WHERE name = %L)', user.username);
  const hasFirstBoss = format('EXISTS (SELECT FROM boss01 WHERE name = %L)', user.username);
  const insertPlayer = format('INSERT INTO player (name,id,avatar) VALUES(%L, %L, %L)',user.username,user.id,user.avatarURL());
  const insertFirstBoss = format('INSERT INTO boss01 (name,boss,hitted) VALUES(%L, %L, %L)',user.username,mapEmojiToLetter(reaction.emoji.name),false);
  const insertSecondBoss = format('INSERT INTO boss02 (name,boss,hitted) VALUES(%L, %L, %L)',user.username,mapEmojiToLetter(reaction.emoji.name),false);
  const query = `
                DO $$
                BEGIN 
                IF (${hasSecondBoss}) THEN
                    RAISE EXCEPTION '${user.username} already exist!';
                ELSE
                    IF(${hasFirstBoss}) THEN
                      ${insertSecondBoss};
                    ELSE
                      ${insertPlayer};
                      ${insertFirstBoss};
                    END IF;
                END IF;
                END $$;
              `;

  try{
    client.query('BEGIN');
    client.query(query);
    client.query('COMMIT');
  }
  catch(error){
    console.error(error);
    reaction.remove(user);
    client.query('ROLLBACK');
  }
});

bot.on('messageReactionRemove', (reaction, user) => {
  console.log('a reaction has been removed');
});
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


const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect();


const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
 
app.head ("/availability", function (req, res) {  //availability or keep awake
  res.sendStatus(200);
}) 

app.get('/players', function (req, response) {  //get records
  client.query('SELECT player.*, boss01.boss AS boss1, boss01.hitted AS hitted1, boss02.boss AS boss2, boss02.hitted AS hitted2 FROM player INNER JOIN boss01 ON player.name = boss01.name INNER JOIN boss02 ON player.name = boss02.name;', (err, res) => {
    if (err) throw err;
    response.status(200).send(res.rows);
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
