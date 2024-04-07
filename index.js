import express from 'express';
import { Telegraf } from 'telegraf';
import shortNumber from '@pogix3m/short-number';
import { convert } from 'html-to-text';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const botToken = process.env.BOT_TOKEN;
const port = process.env.PORT || 2200;
const apiKey = process.env.X_RapidAPI_key;

const bot = new Telegraf(botToken);

const app = express();

const options = {
  method: 'GET',
  url: 'https://coinranking1.p.rapidapi.com/coins',
  params: {
    referenceCurrencyUuid: 'yhjMzLPhuIDl',
    timePeriod: '24h',
    'tiers[0]': '1',
    orderBy: 'marketCap',
    orderDirection: 'desc',
    limit: '50',
    offset: '0',
  },
  headers: {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': 'coinranking1.p.rapidapi.com',
  },
};

const options2 = {
  method: 'GET',
  params: {
    referenceCurrencyUuid: 'yhjMzLPhuIDl',
    timePeriod: '24h',
  },
  headers: {
    'X-RapidAPI-Key': apiKey,
    'X-RapidAPI-Host': 'coinranking1.p.rapidapi.com',
  },
};

app.get('/', (req, res) => {
  res.send('Hello crypto lovers');
});

// bot.start(async (ctx) => {
//   const name = ctx.chat.first_name ? ctx.chat.first_name : ctx.chat.username;
//   const userId = ctx.chat.id;

//   const message = `
//   <div>
//       <b>${name}, Welcome to this platform</b>
//       <p>I am your best crypto bot</p>
//       <p>
//         I can assist you in getting crypto information that will help you make
//         better decision in trading
//       </p>
//     </div>
//   `;

//   const text = convert(message);

//   bot.telegram.sendMessage(userId, message, { parse_mode: 'HTML' });
// });

try {
  const response = await axios.request(options);
  const coins = response.data.data.coins;
  const {
    total,
    totalCoins,
    totalMarkets,
    totalExchanges,
    totalMarketCap,
    total24hVolume,
  } = response.data.data.stats;

  bot.on('message', (message) => {
    const input = message.text;
    const inputLower = input.toLowerCase();

    const name = message.from.first_name + ' ' + message.from.last_name;
    const userId = message.chat.id;

    const greet = inputLower === 'hello' ? 'Hi' : 'Hello';
    let text = `
    ${greet} ${name}, this is crypto currency bot. Send help or /start for instructions
    `;

    // 👉 'news bitcoin'(or any other cryptocurrency name) - To get top 5 news articles of that cryptocurrency.\n
    let info = `
    <b>Hello ${name},</b>\n
    Welcome to cryptocurrency bot by <b><i>middlewareDebugger</i></b>.\n
    Here are the list of things you can do with this bot.\n
    👉 'stats' - To get current total stats of cryptocurrencies.\n
    👉 'bitcoin'(or any other cryptocurrency name) - To get all the possible information of that cryptocurrency.\n
    👉 'list' - To get list of all cryptocurrencies with their rank, name, UID.\n
    <b>Things to remember while using this bot</b> - 
    👉 Make sure to use the format given above otherwise it will not work.\n
    👉 If the name of cryptocurrency didn't work then type 'list' to get all the list of cryptocurrencies and from that list you can copy name in order to get information of the cryptocurrency that you want.\n
    <b><i>Thank you for using this bot.</i></b>
    `;

    if (inputLower === 'hello' || inputLower === 'hi') {
      bot.telegram.sendMessage(userId, text);
      return;
    }

    if (
      inputLower === 'help' ||
      inputLower === '/start' ||
      inputLower === 'start'
    ) {
      bot.telegram.sendMessage(userId, info, { parse_mode: 'html' });
      return;
    }

    if (inputLower === 'stats' || inputLower === '/stats') {
      let info = `
                  *STATISTICS*
      *Total* = ${shortNumber(total)}
      *Total Coins* = ${shortNumber(totalCoins)}
      *Total Markets* = ${shortNumber(totalMarkets)}
      *Total Exchanges* = ${shortNumber(totalExchanges)}
      *Total Market Cap* = ${shortNumber(totalMarketCap)}
      *Total 24hrs Volume* = ${shortNumber(total24hVolume)}
      `;
      bot.telegram.sendMessage(userId, info, { parse_mode: 'markdown' });
      return;
    }

    if (
      inputLower === 'list' ||
      inputLower === '/list' ||
      inputLower === 'crypto list' ||
      inputLower === '/crypto list' ||
      inputLower === '/crypto-list' ||
      inputLower === '/crypto'
    ) {
      coins.map((coin) => {
        let info = `
        <b>COIN NAME:</b> ${coin.name}
        <b>COIN RANK:</b> ${coin.rank}
        <b>COIN UUID:</b> ${coin.uuid}
        `;
        bot.telegram.sendMessage(userId, info, { parse_mode: 'HTML' });
        return;
      });
    }

    const getCrypto = async (query) => {
      if (query.includes('news')) {
        const words = query.split(' ');
        const result = await coins.filter((coin) => {
          return coin.name.toLowerCase() === words[1];
        });

        const options3 = {
          method: 'GET',
          url: 'https://bing-news-search1.p.rapidapi.com/news/search',
          params: {
            q: `${result[0].name}`,
            count: '5',
            freshness: 'Day',
            textFormat: 'Raw',
            safeSearch: 'Off',
          },
          headers: {
            'X-BingApis-SDK': 'true',
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': 'bing-news-search1.p.rapidapi.com',
          },
        };

        try {
          const response = await axios.request(options3);
          return;
        } catch (error) {
          console.error(error);
        }
        return;
        return;
      } else {
        const result = await coins.filter((coin) => {
          return coin.name.toLowerCase() === query;
        });

        if (
          !result ||
          result.length === 0 ||
          result === null ||
          result === undefined
        ) {
          let info = `
          ${query} crypto can not be found. Kindly use the word 'lists' to get the list of available cryptocurrencies.
          `;
          bot.telegram.sendMessage(userId, info, { parse_mode: 'html' });
        } else {
          const uuid = result[0].uuid;

          const url = `https://coinranking1.p.rapidapi.com/coin/${uuid}`;

          try {
            const { data } = await axios.request(url, options2);
            const coinData = data.data.coin;

            bot.telegram.sendMessage(
              userId,
              `
              <b>CRYPTO INFORMATION</b>
              <b>Rank</b> = ${coinData.rank}
              <b>Name</b> = ${coinData.name}
              <b>Symbol</b> = ${coinData.symbol}
              <b>Price</b> = ${coinData.price}
              <b>Number of markets</b> = ${coinData.numberOfMarkets}
              <b>Number of exchanges</b> = ${coinData.numberOfExchanges}
              <b>Daily volume</b> = ${coinData['24hVolume']}
              <b>Market cap</b> = ${coinData.marketCap}
              <b>Official website</b> = ${coinData.websiteUrl}
              <b>Description</b> = ${coinData.description}
              <b>Learn more</b> = ${coinData.coinrankingUrl}
              `,

              { parse_mode: 'HTML' }
            );
          } catch (error) {
            console.error(error);
          }
          // bot.telegram.sendMessage(userId, info, { parse_mode: 'Markdown' });
        }
      }
    };
    getCrypto(inputLower);
  });
} catch (error) {
  console.error(error);
}

bot.launch();
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
