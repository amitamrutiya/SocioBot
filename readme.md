# Social Media Post Generator Bot 🤖[(Link)](https://t.me/socio_media_bot)

This project is a Telegram bot that generates engaging social media posts based on the events you feed it throughout the day. It uses OpenAI's model to generate the posts.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js
- npm
- A Telegram account
- An OpenAI account

### Installing

1. Clone the repository:

```bash
git clone https://github.com/amitamrutiya2210/sociobot.git
```

2. Install the dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory of the project and add the following environment variables:

```bash
BOT_TOKEN=your_telegram_bot_token
MONGO_CONNECT_STRING=your_mongodb_connection_string
OPENAI_KEY=your_openai_api_key
OPENAI_MODEL=your_openai_model_id
```

4. Start the bot:

```bash
npm start
```

### Usage

Start the bot by sending the /start command. Then, send your events to the bot as text messages. When you're ready to generate the posts, send the /generate command.