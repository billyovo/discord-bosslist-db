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

var CronJob = require('cron').CronJob;
var job = new CronJob('0 0 * * MON', function() {
  sendBossMessage();
}, null, true, 'Asia/Taipei');


job.start();

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

  bossMessageID = await fetchBossMessage();
  bossMessageID = bossMessageID.id;
  console.log("Boss message ID: "+bossMessageID);
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

async function sendBossMessage(){
  let bossChannel = fetchBossChannel();
  let oldBossMessage = await fetchBossMessage();

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
  await bossChannel.send('@everyone',embed)
  .then(async(newMessage)=>{
      await newMessage.pin();
      await newMessage.react("🇦");
      await newMessage.react("🇧");
      await newMessage.react("🇨");
      await newMessage.react("🇩");
      await newMessage.react("🇪");
      await newMessage.react("🇫");
      await newMessage.react("🇬");
      bossMessageID = newMessage.id;
  })  
  client.query('TRUNCATE TABLE player,boss01,boss02;');
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

function mapLetterToEmoji(letter){
  switch(letter){
    case 'A':{
      return '🇦';
    }
    case 'B':{
      return '🇧';
    }
    case 'C':{
      return '🇨';
    }
    case 'D':{
      return '🇩';
    }
    case 'E':{
      return '🇪';
    }
    case 'F':{
      return '🇫';
    }
    case 'G':{
      return '🇬';
    }
    default:{
      return -1;
    }
  }
}

const bossReactions = ['🇦','🇧','🇨','🇩','🇪','🇫','🇬'];

bot.on('messageReactionAdd', async (reaction, user) => {
  if(reaction.message.id !== bossMessageID ){ return; }
  if(user.bot){return;}
  if(!bossReactions.includes(reaction.emoji.name)){ return;}

  const hasSecondBoss = `EXISTS (SELECT FROM boss02 WHERE name = '${user.username}')`;
  const hasFirstBoss = `EXISTS (SELECT FROM boss01 WHERE name = '${user.username}')`;
  const insertPlayer = `INSERT INTO player (name,id,avatar) VALUES('${user.username}','${user.id}','${user.avatarURL({size:64})}')`;
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
  if(reaction.message.id !== bossMessageID ){ return; }
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
    client.query('ROLLBACK');
  }
});

bot.on('message',async (msg) => {

  if(!msg.content.startsWith(PREFIX)){return;}
  if(msg.author.bot){return;}

  let raw = msg.content.slice(prefix_len,msg.content.length).toLowerCase();
  let command = raw.split(' ')[0];
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

    case "boss":{
      let timetable = new Array(7);
      timetable[0] = ["A","B","C","D"];
      timetable[1] = ["E","F","G","A"];
      timetable[2] = ["B","C","D","E"];
      timetable[3] = ["F","G","A","B"];
      timetable[4] = ["C","D","E","F"];
      timetable[5] = ["G","A","B","C"];
      timetable[6] = ["D","E","F","G"];
      
      const weekday = ['日','一','二','三','四','五','六'];

      let today = new Date();
      let weekIndex = today.getDay();
      
      let result = {
        A: [],
        B: [],
        C: [],
        D: [],
        E: [],
        F: [],
        G: [],
      }
      let res = await client.query('SELECT player.*, boss01.boss AS boss1, boss01.hitted AS hitted1, boss02.boss AS boss2, boss02.hitted AS hitted2 FROM player INNER JOIN boss01 ON player.name = boss01.name INNER JOIN boss02 ON player.name = boss02.name ORDER BY player.name;');
      res.rows.forEach(element=>{
        result[element.boss1].push(element.name);
        result[element.boss2].push(element.name);
      })

      const embed = new Discord.MessageEmbed()
      .setColor('#ffff00')
      .setTitle('本周的boss:')
      .addFields(
        { name: '\u200b', value: '🇦 '+result.A.join(" ")},
        { name: '\u200b', value: '🇧 '+result.B.join(" ")},
        { name: '\u200b', value: '🇨 '+result.C.join(" ")},
        { name: '\u200b', value: '🇩 '+result.D.join(" ")},
        { name: '\u200b', value: '🇪 '+result.E.join(" ")},
        { name: '\u200b', value: '🇫 '+result.F.join(" ")},
        { name: '\u200b', value: '🇬 '+result.G.join(" ")},
      )
      .setTimestamp()
      .setFooter('星期'+weekday[weekIndex]+'的boss 7:30 '+timetable[weekIndex][0]+' '+timetable[weekIndex][1]+' | 9:30 '+timetable[weekIndex][2]+ ' '+timetable[weekIndex][3], bot.user.avatarURL());
      await msg.channel.send(embed);

      break;

    }
    case "addboss":{
      raw = raw.split(' ');
      raw.shift();
      const regex = new RegExp('[A-G]');

      let firstBoss = raw.shift();
      firstBoss = firstBoss.toUpperCase();
      let secondBoss = raw.shift();
      secondBoss = secondBoss.toUpperCase();
      if(regex.test(firstBoss)&&regex.test(secondBoss)){
        msg.react(mapLetterToEmoji(firstBoss));
        msg.react(mapLetterToEmoji(secondBoss));

        let name = msg.author.username;
        let avatar = msg.author.avatarURL({size:64});

        const exists = `EXISTS (SELECT FROM player WHERE name = '${name}')`;
        const insertPlayer = `INSERT INTO player (name,id,avatar) VALUES ('${name}','${msg.author.id}','${avatar}')`;
        const insertBoss1 = `INSERT INTO boss01 (name,boss,hitted) VALUES ('${name}','${firstBoss}','false')`;
        const insertBoss2 = `INSERT INTO boss02 (name,boss,hitted) VALUES ('${name}','${secondBoss}','false')`;

        const query = `
                        DO $$
                        BEGIN 
                        IF (${exists}) THEN
                          RAISE EXCEPTION '${name} already exist!';
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
          msg.react('✔️');
        }
        catch(error){
          msg.react('❌');
          msg.channel.send(msg.author.username+' 已經存在!');
          client.query('ROLLBACK');
        }

        }
        else{
          msg.channel.send('這不是正確的輸入!');
          msg.react('❌');
        }
      break;
    } 
    case "removeboss":{
      const exists = `NOT EXISTS (SELECT FROM player WHERE name = '${msg.author.username}')`;
      const removePlayer = `DELETE FROM player WHERE name = '${msg.author.username}'`;
      const removeBoss1 = `DELETE FROM boss01 WHERE name = '${msg.author.username}'`;
      const removeBoss2 = `DELETE FROM boss02 WHERE name = '${msg.author.username}'`;
      const query = `
                    DO $$
                    BEGIN 
                    IF (${exists}) THEN
                      RAISE EXCEPTION '${msg.author.username} is not found!';
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
        msg.react('✔️');
      }
      catch(error){
        msg.react('❌');
        msg.channel.send('並沒有'+msg.author.username+'這個人!');
        client.query('ROLLBACK');
      } 
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
  res.header("Access-Control-Allow-Methods","GET, HEAD, POST, PATCH, DELETE");
  next();
});

app.head ("/availability", (req, res) => {  //availability or keep awake
  res.sendStatus(200);
}) 

app.get('/players', (req, response) => {  //get records
  client.query('SELECT player.*, boss01.boss AS boss1, boss01.hitted AS hitted1, boss02.boss AS boss2, boss02.hitted AS hitted2 FROM player INNER JOIN boss01 ON player.name = boss01.name INNER JOIN boss02 ON player.name = boss02.name ORDER BY player.name;', (err, res) => {
    if (err){response.sendStatus(500)};
    response.status(200).send(res.rows);
  });
  
})

app.post('/players', async (req, response) => {      //add records
  let name = req.body.name.trim();
  let boss01 = req.body.boss01.trim();
  let boss02 = req.body.boss02.trim();
  
  const exists = `EXISTS (SELECT FROM player WHERE name = '${name}')`;
  const insertPlayer = `INSERT INTO player (name,id,avatar) VALUES ('${name}','null','${req.body.avatar}')`;
  const insertBoss1 = `INSERT INTO boss01 (name,boss,hitted) VALUES ('${name}','${boss01}','false')`;
  const insertBoss2 = `INSERT INTO boss02 (name,boss,hitted) VALUES ('${name}','${boss02}','false')`;

  const query = `
                  DO $$
                  BEGIN 
                  IF (${exists}) THEN
                    RAISE EXCEPTION '${name} already exist!';
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
    response.status(200).send(`${name} is added!`);
  }
  catch(error){
    response.status(409).send(error.message);
    client.query('ROLLBACK');
  }
});


app.patch('/players', async (req, response) => { //update records
    let name = req.body.name.trim();
    let boss = req.body.boss.trim();

    const exists = `NOT ( EXISTS (SELECT FROM boss01 WHERE name = '${name}' AND boss = '${boss}') OR EXISTS (SELECT FROM boss02 WHERE name = '${name}' AND boss = '${boss}'))`;
    const updateBoss1 = `UPDATE boss01 SET hitted = NOT hitted WHERE name = '${name}' AND boss = '${boss}'`;
    const updateBoss2 = `UPDATE boss02 SET hitted = NOT hitted WHERE name = '${name}' AND boss = '${boss}'`;
    const query = `
                    DO $$
                    BEGIN 
                    IF (${exists}) THEN
                      RAISE EXCEPTION '${name} with ${boss} is not found!';
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
      response.status(200).send(`Updated ${name}`);
    }
    catch(error){
      response.status(409).send(error.message);
      client.query('ROLLBACK');
    }
})

app.delete('/players/:name', async (req, response) => {  //delete records

    let name = req.params.name.trim();
    const exists = `NOT EXISTS (SELECT FROM player WHERE name = '${name}')`;
    const removePlayer = `DELETE FROM player WHERE name = '${name}'`;
    const removeBoss1 = `DELETE FROM boss01 WHERE name = '${name}'`;
    const removeBoss2 = `DELETE FROM boss02 WHERE name = '${name}'`;
    const query = `
                    DO $$
                    BEGIN 
                    IF (${exists}) THEN
                      RAISE EXCEPTION '${name} is not found!';
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
      response.status(200).send(`${name} is deleted!`);
    }
    catch(error){
      response.status(409).send(error.message);
      client.query('ROLLBACK');
    }
})



app.listen(process.env.PORT || 3000,()=>{
    console.log('working');
});
