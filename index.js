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

bot.on('messageReactionAdd', async (reaction, user) => {
  if(reaction.message.id !== '823224436789346304'){ return; }
  if(user.bot){return;}
  if(!bossReactions.includes(reaction.emoji.name)){ return;}

  const hasSecondBoss = `EXISTS (SELECT FROM boss02 WHERE name = '${user.username}')`;
  const hasFirstBoss = `EXISTS (SELECT FROM boss01 WHERE name = '${user.username}')`;
  const insertPlayer = `INSERT INTO player (name,id,avatar) VALUES('${user.username}','${user.id}','${user.avatarURL()}')`;
  const insertFirstBoss = `INSERT INTO boss01 (name,boss,hitted) VALUES('${user.username}','${mapEmojiToLetter(reaction.emoji.name)}','false')`;
  const insertSecondBoss = `INSERT INTO boss02 (name,boss,hitted) VALUES('${user.username}','${mapEmojiToLetter(reaction.emoji.name)}','false')`;
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
    await client.query('BEGIN');
    await client.query(query);
    await client.query('COMMIT');
  }
  catch(error){
    reaction.users.remove(user);
    client.query('ROLLBACK');
  }
});

bot.on('messageReactionRemove', async (reaction, user) => {
  if(reaction.message.id !== '823224436789346304'){ return; }
  if(user.bot){return;}
  if(!bossReactions.includes(reaction.emoji.name)){ return;}

  const secondBossMatch = `EXISTS (SELECT FROM boss02 WHERE name = '${user.username}' AND boss = '${mapEmojiToLetter(reaction.emoji.name)}')`;
  const firstBossMatch = `EXISTS (SELECT FROM boss01 WHERE name = '${user.username}' AND boss = '${mapEmojiToLetter(reaction.emoji.name)}')`;
  const hasSecondBoss = `EXISTS (SELECT FROM boss02 WHERE name = '${user.username}')`;
  const deleteSecondBoss = `DELETE FROM boss02 WHERE name = '${user.username}'`;
  const replaceFirstBoss = `UPDATE boss01 SET boss = (SELECT boss FROM boss02 WHERE name = '${user.username}') WHERE name = '${user.username}'`;
  const replaceHitted = `UPDATE boss01 SET hitted = (SELECT hitted FROM boss02 WHERE name = '${user.username}') WHERE name = '${user.username}'`;
  const deleteFirstBoss = `DELETE FROM boss01 WHERE name = '${user.username}'`;
  const deletePlayer = `DELETE FROM player WHERE name = '${user.username}'`;
  const query = `
                DO $$
                BEGIN 
                IF (${secondBossMatch}) THEN
                    ${deleteSecondBoss};
                ELSE
                    IF(${firstBossMatch}) THEN
                      IF(${hasSecondBoss}) THEN
                        ${replaceFirstBoss};
                        ${replaceHitted};
                        ${deleteSecondBoss};
                      ELSE
                        ${deleteFirstBoss};
                        ${deletePlayer};
                      END IF;
                    END IF;
                END IF;
                END $$;
              `;
  try{
    await client.query('BEGIN');
    await client.query(query);
    await client.query('COMMIT');
  }
  catch(error){
    reaction.users.remove(user);
    client.query('ROLLBACK');
  }
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
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());
 
app.all('/*', (req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.ACCESS_ORIGIN);
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.head ("/availability", (req, res) => {  //availability or keep awake
  res.sendStatus(200);
}) 

app.get('/players', (req, response) => {  //get records
  client.query('SELECT player.*, boss01.boss AS boss1, boss01.hitted AS hitted1, boss02.boss AS boss2, boss02.hitted AS hitted2 FROM player INNER JOIN boss01 ON player.name = boss01.name INNER JOIN boss02 ON player.name = boss02.name;', (err, res) => {
    if (err){response.sendStatus(500)};
    response.status(200).send(res.rows);
  });
  
})

app.post('/players', async (req, response) => {      //add records

  const exists = `EXISTS (SELECT FROM player WHERE name = '${req.body.name}')`;
  const insertPlayer = `INSERT INTO player (name,id,avatar) VALUES ('${req.body.name}','null','${req.body.avatar}')`;
  const insertBoss1 = `INSERT INTO boss01 (name,boss,hitted) VALUES ('${req.body.name}','${req.body.boss01}','false')`;
  const insertBoss2 = `INSERT INTO boss02 (name,boss,hitted) VALUES ('${req.body.name}','${req.body.boss02}','false')`;

  const query = `
                  DO $$
                  BEGIN 
                  IF (${exists}) THEN
                    RAISE EXCEPTION '${req.body.name} already exist!';
                  ELSE
                    ${insertPlayer};
                    ${insertBoss1};
                    ${insertBoss2};
                  END IF;
                  END $$;
                `;
  try{
    await client.query('BEGIN');
    await client.query(query);
    await client.query('COMMIT');
    response.status(200).send(`${req.body.name} is added!`);
  }
  catch(error){
    response.status(409).send(error.message);
    client.query('ROLLBACK');
  }

  });


app.patch('/players', async (req, response) => { //update records
  let responseArray = [];

  req.body.forEach(async (element) => {
    const exists = `NOT EXISTS (SELECT FROM player WHERE name = '${element.name}')`;
    const updateBoss1 = `UPDATE boss01 SET boss = '${element.bossTo}' WHERE name = '${element.name}' AND boss = '${element.bossFrom}'`;
    const updateBoss2 = `UPDATE boss02 SET boss = '${element.bossTo}' WHERE name = '${element.name}' AND boss = '${element.bossFrom}'`;
    const query = `
                    DO $$
                    BEGIN 
                    IF (${exists}) THEN
                      RAISE EXCEPTION '${element.name} is not found!';
                    ELSE
                      ${updateBoss1};
                      ${updateBoss2};
                    END IF;
                    END $$;
                  `;
    try{
      await client.query('BEGIN');
      await client.query(query);
      await client.query('COMMIT');
      responseArray.push({message: `${element.name} is updated`, status: '200'});
    }
    catch(error){
      responseArray.push({message: `${error.message}`, status: '409'});
      client.query('ROLLBACK');
    }
  });

  response.status(200).send(JSON.stringify(responseArray));
})

app.post('/delete-players', async(req, response) => {  //delete records
  let responseArray = [];

  req.body.forEach(async (element) => {
    console.log(element);
    const exists = `NOT EXISTS (SELECT FROM player WHERE name = '${element.name}')`;
    const removePlayer = `DELETE FROM player WHERE name = '${element.name}'`;
    const removeBoss1 = `DELETE FROM boss01 WHERE name = '${element.name}'`;
    const removeBoss2 = `DELETE FROM boss02 WHERE name = '${element.name}'`;
    const query = `
                    DO $$
                    BEGIN 
                    IF (${exists}) THEN
                      RAISE EXCEPTION '${element.name} is not found!';
                    ELSE
                      ${removePlayer};
                      ${removeBoss1};
                      ${removeBoss2};
                    END IF;
                    END $$;
                  `;
    try{
      await client.query('BEGIN');
      await client.query(query);
      await client.query('COMMIT');
      responseArray.push({message: `${element.name} is deleted!`, status: '200'});
    }
    catch(error){
      responseArray.push({message: `${error.message}`, status: '409'});
      client.query('ROLLBACK');
    }
  });

  response.status(200).send(JSON.stringify(responseArray));
  

})



app.listen(process.env.PORT || 3000,()=>{
  console.log("API is running.");
});
