var request = require('request');

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('botkit');

var controller = Botkit.slackbot({
    debug: false,
    stats_optout: true
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

var scores = [];

getFriendlyHouseName = (house) => {
  let name;
  switch (house) {
      case 'house.jaceclaw':
        name = 'House Jaceclaw';
        break;
      case 'house.karolin':
        name = 'House Karolin';
        break;
      case 'house.kubindor':
        name = 'House Kubindor';
        break;
    }

    return name;
}

getHouseEmojiName = (house) => {
  let name;
  switch (house) {
      case 'house.jaceclaw':
        name = ':house-jaceclaw:';
        break;
      case 'house.karolin':
        name = ':house-karolin:';
        break;
      case 'house.kubindor':
        name = ':house-kubindor:';
        break;
    }

    return name;
}

checkResults = (goalsAchieved, house, bot, message) => {
  scores.push({path: house, score: goalsAchieved.length * 10, house: getFriendlyHouseName(house), emoji: getHouseEmojiName(house)});

  scores.sort(function(a, b) {
    return b.score - a.score;
  })

  let scoresMessage = '';

  if (scores.length === 3) {
    scores.forEach(function(score) {
      scoresMessage += score.emoji + ' ' + score.house + ' ' + score.score + ' PTS   ';
    })

    bot.reply(message, scoresMessage);
  }


  return true;
}

// checkResults = (goalsAchieved, house, bot, message) => {
//   switch (house) {
//     case 'house.jaceclaw':
//       scores.jaceclaw = goalsAchieved.length;
//       break;
//     case 'house.karolin':
//       scores.karolin = goalsAchieved.length;
//       break;
//     case 'house.kubindor':
//       scores.kubindor = goalsAchieved.length;
//       break;
//   }
//   if (scores.jaceclaw > 0 && scores.karolin > 0 && scores.kubindor > 0) {
//     bot.reply(message, 'House Jaceclaw: ' + scores.jaceclaw * 10 + 'PTS ,House Karolin: ' + scores.karolin * 10 + 'PTS ,House Kubindor: ' + scores.kubindor * 10 + 'PTS');
//   }
//   return true;
// }

getHousePathsUrl = (userId) => {
  return 'http://paths.unleash.x-team.com/api/v1/paths.json?userId=' + userId;
}

requestPaths = (house, bot, message) => {
  request(getHousePathsUrl(house), function (error, response, body) {
    if (!error && response.statusCode == 200) {

      let paths = JSON.parse(body);
      let goalsAchieved = [];
      paths.forEach(function (path) {
        if (path.goals.length > 0) {
            path.goals.forEach(function(goal) {
              if (goal.achieved) {
                  goalsAchieved.push(goal);
              }
            })
        }
      })

      checkResults(goalsAchieved, house, bot, message);
    }
  })
}

controller.hears(['\\*House Jaceclaw\\* has completed a goal',
  '\\*House Kubindor\\* has completed a goal!',
  '\\*House Karolin\\* has completed a goal!'],
  'bot_message,ambient',
  function(bot, message) {
    this.requestPaths('house.jaceclaw', bot, message);
    this.requestPaths('house.kubindor', bot, message);
    this.requestPaths('house.karolin', bot, message);
  }
);
