import express, { Application, Request, Response } from 'express';
import http, { Server } from 'http';
import WebSocket from 'ws';
import mongoose, { Document } from 'mongoose';
import cors from 'cors'; // Import cors middleware

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/myDatabase')
  .then(() => {
    console.log('Connected to MongoDB successfully!');
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB:', error);
  });

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define an interface for the Question schema
interface IQuestion extends Document {
  question: string;
  answer: string;
}

// Create Question model
const Question = mongoose.model<IQuestion>('Question', new mongoose.Schema<IQuestion>({
  question: String,
  answer: String,
}));

// Create Express app
const app: Application = express();

// Enable cors
app.use(cors());

// Create HTTP server using Express app
const httpServer: Server = http.createServer(app);

// Create WebSocket server and attach it to the HTTP server
const wss: WebSocket.Server = new WebSocket.Server({ server: httpServer });

// Listen for WebSocket connections
wss.on('connection', async (socket: WebSocket) => {
  console.log('Client connected');

  try {
    // Send all questions to the client
    const questions = await Question.find({}).exec();
    socket.send(JSON.stringify(questions));
  } catch (err) {
    console.error(err);
  }

  // Listen for messages from the client
  socket.on('message', async (message: string) => {
    console.log(`Received message: ${message}`);

    try {
      // Find the corresponding answer in the database
      const question = await Question.findOne({ question: message }).exec();
      // If question is found, send the answer word by word to the client
      if (question) {
        const words = question.answer.split(' ');
        let i = 0;
        const interval = setInterval(() => {
          if (i < words.length) {
            socket.send(words[i]);
            i++;
          } else {
            clearInterval(interval);
          }
        }, 1000);
      }
    } catch (err) {
      console.error(err);
    }
  });
});

// Define route for /questions endpoint
app.get('/questions', async (req: Request, res: Response) => {
  try {
    // Fetch all questions from the database
    const questions = await Question.find({}).exec();
    res.json(questions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Start the HTTP server
httpServer.listen(5000, () => {
  console.log('Server started on http://localhost:5000');
});
