const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs");
const readline = require("readline");
const path = require("path");
const natural = require("natural");

const app = express();
const port = 9000; // Change as needed

// Middleware to serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Predefined questions and answers
const predefinedAnswers = {
  "Who developed you?":
    "I was developed by Hamza Ali Ghalib, a renowned web developer from Pakistan. His expertise in web development has been pivotal in creating and maintaining me.",
  "What is your purpose?":
    "My purpose is to assist users by providing information, answering questions, and engaging in meaningful conversations. I am here to help make information more accessible and interactions more efficient.",
  "What is your name?":
    "My name is Ghalib AI trained by Hamza Ali Ghalib and Danial Azam. You can refer to me as Hamza Ali Ghalib's AI, created to assist and engage with users.",
  "What technologies were used to build you?":
    "I was built using a combination of modern web technologies including HTML, CSS, JavaScript, and various libraries and frameworks. My backend may involve server-side technologies and APIs to handle requests and responses.",
  "Can you tell me about Hamza Ali Ghalib?":
    "Hamza Ali Ghalib is a well-known web developer based in Pakistan. He has made significant contributions to the field of web development and is known for his expertise in creating advanced web applications and tools.",
  "Who is Danial Azam?":
    "Danial Azam is a famous web developer and a great friend of Hamza Ali Ghalib. He is recognized for his contributions to web development and his collaboration on various projects. Danial Azam is not a musician but rather a prominent figure in the web development community.",
  "What are some of your capabilities?":
    "I can answer questions, provide information, engage in conversations, and assist with various topics related to web development and general knowledge. If you have specific queries or need help with something, feel free to ask!",
  "How can I use your services?":
    "Simply type your questions or messages, and I will do my best to provide you with accurate and helpful responses. Whether you need information, assistance, or just a chat, I'm here to help!",
  "How do you handle user data?":
    "I prioritize user privacy and data security. Any interactions with me are processed in accordance with privacy and security best practices. Personal data is handled with care and in compliance with relevant regulations.",
  "Can I provide feedback about your responses?":
    "Yes, feedback is always welcome! If you have suggestions or comments about my responses or functionality, please let me know so I can improve and better serve your needs.",
};

// Function to read the context data from the file
function readContextFromFile() {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream("./data.txt"); // Adjust path as needed
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let context = "";
    rl.on("line", (line) => {
      context += line + "\n"; // Append each line to the context
    });

    rl.on("close", () => {
      resolve(context.trim()); // Resolve with the complete context
    });

    rl.on("error", (err) => {
      reject(err); // Reject the promise on error
    });
  });
}

async function query(context, message) {
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/deepset/bert-large-uncased-whole-word-masking-squad2",
      {
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: {
            question: message,
            context: context,
          },
        }),
      }
    );
    const result = await response.json();
    return result.answer; // Assuming API returns an 'answer' field
  } catch (error) {
    console.error("Error making request:", error);
    return "Error occurred while processing your request.";
  }
}

// NLP functions using natural
function analyzeSentiment(text) {
  const analyzer = new natural.SentimentAnalyzer(
    "English",
    natural.PorterStemmer,
    "afinn"
  );
  const sentiment = analyzer.getSentiment(text.split(/\s+/));
  return sentiment > 0 ? "positive" : sentiment < 0 ? "negative" : "neutral";
}

function tokenizeText(text) {
  const tokenizer = new natural.WordTokenizer();
  return tokenizer.tokenize(text);
}

// Define the /chat route
app.get("/chat", async (req, res) => {
  const message = req.query.message || "Hi"; // Default question if no query parameter is provided

  // Check if the message matches one of the predefined questions
  if (predefinedAnswers[message]) {
    res.send(predefinedAnswers[message]); // Send predefined answer
  } else {
    try {
      const context = await readContextFromFile();
      const answer = await query(context, message);
      res.send(answer); // Send the answer from the API
    } catch (error) {
      console.error("Error in /chat route:", error);
      res.status(500).send("Internal Server Error");
    }
  }
});

// Define the /sentiment route for NLP tasks
app.get("/sentiment", (req, res) => {
  const text = req.query.text || ""; // Default text if no query parameter is provided

  try {
    const sentiment = analyzeSentiment(text);
    res.send({ sentiment }); // Send the sentiment analysis result
  } catch (error) {
    console.error("Error in /sentiment route:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Define the /tokenize route for tokenization
app.get("/tokenize", (req, res) => {
  const text = req.query.text || ""; // Default text if no query parameter is provided

  try {
    const tokens = tokenizeText(text);
    res.send({ tokens }); // Send the tokenized text
  } catch (error) {
    console.error("Error in /tokenize route:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
